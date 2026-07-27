//app/api/admin/teachers/route
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hashPassword, hasAdminAccess, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const MIN_PASSWORD_LENGTH = 8;

const DEFAULT_PERMISSIONS = {
  canAddVideo: true,
  canAddExam: true,
  canEditContent: true,
  canViewStudents: false,
  canReorder: true,
};
// ── GET ─────────────────────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      avatarUrl: true,
      whatsappNumber: true,
      isActive: true,
      createdAt: true,
      // ✅ Actual back-relation field name on User is `teacherPermission`
      // (per the generated Prisma client), not `permissions`.
      teacherPermission: {
        select: {
          canAddVideo: true,
          canAddExam: true,
          canEditContent: true,
          canViewStudents: true,
          canReorder: true,
        },
      },
    },
  });

  // ✅ Reshape to `permissions` for the frontend's Teacher interface —
  // defaulting when no row exists yet.
  const result = teachers.map(({ teacherPermission, ...t }) => ({
    ...t,
    permissions: teacherPermission ?? DEFAULT_PERMISSIONS,
  }));

  return NextResponse.json(result);
}
// ── POST ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string;
  const whatsapp = formData.get('whatsapp') as string | null;
  const avatar = formData.get('avatar') as File | null;

  if (!fullName || !phone || !password)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  if (password.length < MIN_PASSWORD_LENGTH)
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });

  let avatarUrl: string | null = null;
  if (avatar && avatar.size > 0) {
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const ext = avatar.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    avatarUrl = `/uploads/avatars/${fileName}`;
  }

  const hashed = await hashPassword(password);
  const newteacher = await prisma.user.create({
    data: {
      fullName,
      phone,
      email: email || null,
      password: hashed,
      role: 'teacher',
      avatarUrl,
      whatsappNumber: whatsapp || null,
    },
  });

  return NextResponse.json({ success: true, id: newteacher.id });
}

// ── PATCH ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';

  // suspend / activate / updatePermissions — JSON
  if (contentType.includes('application/json')) {
    const body = await req.json();
    const { id, action } = body;
    if (!id || !action)
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });

    if (action === 'suspend') {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true });
    }
    if (action === 'activate') {
      await prisma.user.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ success: true });
    }

    // ✅ NEW: permissions are staff management — same tier as delete,
    // so this requires the strict admin role, not just hasAdminAccess.
    if (action === 'updatePermissions') {
      if (!isAdmin(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { permissions } = body;
      if (!permissions || typeof permissions !== 'object')
        return NextResponse.json({ error: 'Missing permissions' }, { status: 400 });

      const {
        canAddVideo = true,
        canAddExam = true,
        canEditContent = true,
        canViewStudents = false,
        canReorder = true,
      } = permissions;

      const teacher = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (!teacher || teacher.role !== 'teacher')
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

      const saved = await prisma.teacherPermission.upsert({
        where: { teacherId: id },
        create: {
          teacherId: id,
          canAddVideo: !!canAddVideo,
          canAddExam: !!canAddExam,
          canEditContent: !!canEditContent,
          canViewStudents: !!canViewStudents,
          canReorder: !!canReorder,
        },
        update: {
          canAddVideo: !!canAddVideo,
          canAddExam: !!canAddExam,
          canEditContent: !!canEditContent,
          canViewStudents: !!canViewStudents,
          canReorder: !!canReorder,
        },
      });

      return NextResponse.json({ success: true, permissions: saved });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  // update profile — FormData
  const formData = await req.formData();
  const id = Number(formData.get('id'));
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;
  const whatsapp = formData.get('whatsapp') as string | null;
  const avatar = formData.get('avatar') as File | null;

  if (!id || !fullName || !phone)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  if (password && password.length < MIN_PASSWORD_LENGTH)
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );

  const conflict = await prisma.user.findFirst({ where: { phone, NOT: { id } } });
  if (conflict) return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });

  let avatarUrl: string | undefined = undefined;
  if (avatar && avatar.size > 0) {
    const existing = await prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (existing?.avatarUrl) {
      const oldPath = path.join(process.cwd(), 'public', existing.avatarUrl);
      await unlink(oldPath).catch(() => {});
    }
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const ext = avatar.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    avatarUrl = `/uploads/avatars/${fileName}`;
  }

  const updateData: Record<string, unknown> = {
    fullName,
    phone,
    email: email || null,
    whatsappNumber: whatsapp || null,
  };
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (password) updateData.password = await hashPassword(password);

  await prisma.user.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true });
}

// ── DELETE ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !isAdmin(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } });
  if (existing?.avatarUrl) {
    const oldPath = path.join(process.cwd(), 'public', existing.avatarUrl);
    await unlink(oldPath).catch(() => {});
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

//app/api/admin/teachers/route
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// ── GET ─────────────────────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
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
    },
  });

  return NextResponse.json(teachers);
}

// ── POST ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
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
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';

  // suspend / activate — JSON
  if (contentType.includes('application/json')) {
    const { id, action } = await req.json();
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
  if (!user || user.role !== 'admin')
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

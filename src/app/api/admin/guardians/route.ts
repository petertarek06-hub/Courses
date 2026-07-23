//src/api/admin/guardians/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasAdminAccess, isAdmin, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MIN_PASSWORD_LENGTH } from '@/app/api/auth/register/route';

// ── GET /api/admin/guardians ── fetch all guardians with their linked student ──
export async function GET() {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guardians = await prisma.guardian.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      phone: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          academicYear: true,
        },
      },
    },
  });

  return NextResponse.json(guardians);
}

// ── POST /api/admin/guardians ── add a guardian for an existing student ──
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { studentId, fullName, phone, password } = body;

  if (!studentId || !fullName || !phone || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        error: 'password_too_short',
        message: `The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      },
      { status: 400 }
    );
  }

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const existingGuardian = await prisma.guardian.findUnique({ where: { phone } });
  if (existingGuardian) {
    return NextResponse.json({ error: 'Guardian phone already registered' }, { status: 409 });
  }

  const hashed = await hashPassword(password);

  const newGuardian = await prisma.guardian.create({
    data: {
      fullName,
      phone,
      password: hashed,
      studentId,
    },
  });

  return NextResponse.json({ success: true, id: newGuardian.id });
}

// ── PATCH /api/admin/guardians ── edit a guardian's details ──
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, fullName, phone, password } = body;

  if (!id || !fullName || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (password && (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)) {
    return NextResponse.json(
      {
        error: 'password_too_short',
        message: `The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      },
      { status: 400 }
    );
  }

  const existing = await prisma.guardian.findUnique({ where: { phone } });
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: 'Guardian phone already registered to another user' },
      { status: 409 }
    );
  }

  const data: { fullName: string; phone: string; password?: string } = { fullName, phone };
  if (password) {
    data.password = await hashPassword(password);
  }

  const updated = await prisma.guardian.update({ where: { id }, data });

  return NextResponse.json({ success: true, guardian: updated });
}

// ── DELETE /api/admin/guardians ── delete a guardian ──
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await prisma.guardian.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Guardian not found' }, { status: 404 });
  }

  await prisma.guardian.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

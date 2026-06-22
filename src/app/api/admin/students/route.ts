//src/api/admin/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ── GET /api/admin/students ── fetch all students
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: 'student' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      academicYear: true,
      role: true,
      isActive: true,
      balance: true,
      avatarUrl: true, // ✅ added
      createdAt: true,
    },
  });

  return NextResponse.json(students);
}

// ── POST /api/admin/students ── add new student
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, phone, email, academicYear, password } = body;

  if (!fullName || !phone || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });
  }

  const { hashPassword } = await import('@/lib/auth');
  const hashed = await hashPassword(password);

  const newStudent = await prisma.user.create({
    data: {
      fullName,
      phone,
      email: email || null,
      academicYear: academicYear || null,
      password: hashed,
      role: 'student',
    },
  });

  return NextResponse.json({ success: true, id: newStudent.id });
}

// ── PATCH /api/admin/students ── suspend/activate or adjust balance
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, amount } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  if (action === 'suspend') {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  }

  if (action === 'activate') {
    await prisma.user.update({ where: { id }, data: { isActive: true } });
    return NextResponse.json({ success: true });
  }

  if (action === 'addBalance' || action === 'deductBalance') {
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const newBalance =
      action === 'addBalance'
        ? (student.balance ?? 0) + Number(amount)
        : Math.max(0, (student.balance ?? 0) - Number(amount));

    await prisma.user.update({ where: { id }, data: { balance: newBalance } });
    return NextResponse.json({ success: true, newBalance });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── DELETE /api/admin/students ── delete a student
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

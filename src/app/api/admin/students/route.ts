//src/api/admin/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasAdminAccess, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ── GET /api/admin/students ── fetch all students
export async function GET() {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role)) {
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
      avatarUrl: true,
      createdAt: true,

      guardians: {
        select: {
          // fullName: true,
          phone: true,
        },
      },
    },
  });
  const withGuardianPhones = students.map(({ guardians, ...s }) => ({
    ...s,
    guardianPhones: guardians.map((g) => g.phone),
  }));

  return NextResponse.json(withGuardianPhones);
}

// ── POST /api/admin/students ── add new student
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role)) {
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
  if (!user || !hasAdminAccess(user.role)) {
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

    const numericAmount = Number(amount);
    const currentBalance = student.balance ?? 0;

    // ✅ FIX: a deduction larger than the current balance is now rejected
    // outright — no mutation, no Transaction row — instead of silently
    // clamping the balance to zero. The admin needs to see that it failed
    // and why, rather than have the student's balance quietly zeroed for
    // an amount that was never actually deducted in full.
    if (action === 'deductBalance' && numericAmount > currentBalance) {
      return NextResponse.json(
        {
          error: 'insufficient_balance',
          message: `Deduction of ${numericAmount} exceeds current balance of ${currentBalance}`,
          currentBalance,
        },
        { status: 400 }
      );
    }

    const delta = action === 'addBalance' ? numericAmount : -numericAmount;
    const newBalance = currentBalance + delta;

    // ✅ Every balance change still produces a Transaction row for the ledger.
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { balance: newBalance } }),
      prisma.transaction.create({
        data: {
          studentId: id,
          amount: Math.abs(delta),
          type: action === 'addBalance' ? 'topup' : 'adjustment',
          method: 'manual',
          notes:
            action === 'addBalance'
              ? 'Manual balance addition by admin'
              : 'Manual balance deduction by admin',
        },
      }),
    ]);

    return NextResponse.json({ success: true, newBalance });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── DELETE /api/admin/students ── delete a student
//
// Several tables reference `users.id` with `onDelete: NoAction` (Enrollment,
// Transaction, ExamAttempt, LessonProgress, TopUpRequest) — SQL Server would
// otherwise reject multiple cascade paths through User, so those were
// deliberately left as NoAction in the schema. That means a plain
// `prisma.user.delete()` fails with a foreign key violation (P2003) the
// moment the account has any real history attached to it — which is
// exactly the `enrollments_studentId_fkey` error this fixes.
//
// Rather than changing the DB-level cascade rules, we clear out everything
// that depends on this user's id ourselves, inside one transaction, then
// delete the user last. Guardian rows already cascade at the DB level
// (onDelete: Cascade on Guardian.studentId), but we delete them explicitly
// too so this whole operation is self-contained and doesn't depend on the
// DB actually having that cascade applied.
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Admin accounts are never deletable through this endpoint.
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Cannot delete an admin account' }, { status: 403 });
  }

  await prisma.$transaction([
    // ExamAttempt cascades to AttemptAnswer on its own (onDelete: Cascade),
    // so we don't need to touch attempt_answers separately.
    prisma.examAttempt.deleteMany({ where: { studentId: id } }),
    prisma.lessonProgress.deleteMany({ where: { studentId: id } }),
    prisma.enrollment.deleteMany({ where: { studentId: id } }),
    prisma.transaction.deleteMany({ where: { studentId: id } }),
    prisma.topUpRequest.deleteMany({ where: { studentId: id } }),
    // If this account is an assistant who processed other students' top-ups,
    // unlink rather than delete those historical ledger/review records.
    prisma.topUpRequest.updateMany({ where: { processedById: id }, data: { processedById: null } }),
    prisma.guardian.deleteMany({ where: { studentId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}

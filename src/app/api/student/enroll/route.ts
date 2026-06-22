// src/app/api/student/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { courseId } = await req.json();
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { id: Number(courseId), isVisible: true },
    // ✅ was: nameAr, nameEn → single name field
    select: { id: true, price: true, name: true },
  });
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  // Already enrolled?
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
  });
  if (existing) return NextResponse.json({ error: 'already_enrolled' }, { status: 409 });

  // Free course → enroll directly
  if (course.price === 0) {
    await prisma.enrollment.create({
      data: { studentId: user.id, courseId: course.id },
    });
    return NextResponse.json({ ok: true, enrolled: true });
  }

  // Paid course → check balance
  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });
  if (!student) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (student.balance < course.price) {
    return NextResponse.json(
      { error: 'insufficient_balance', balance: student.balance, price: course.price },
      { status: 402 }
    );
  }

  // Deduct balance, create transaction, enroll — all in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: course.price } },
    }),
    prisma.transaction.create({
      data: {
        studentId: user.id,
        courseId: course.id,
        amount: course.price,
        type: 'payment',
        method: 'balance',
        status: 'completed',
        // ✅ was: course.nameEn → course.name
        notes: `Enrollment: ${course.name}`,
      },
    }),
    prisma.enrollment.create({
      data: { studentId: user.id, courseId: course.id },
    }),
  ]);

  return NextResponse.json({ ok: true, enrolled: true });
}

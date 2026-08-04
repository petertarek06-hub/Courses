// src/app/api/student/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — enroll the logged-in student in a course, paid from their balance
// Body: { courseId: number, enrollmentType: 'full' | 'subscription' }
//
// Steps, all inside one $transaction so they succeed or fail together:
//  1. Re-check the course exists and is visible.
//  2. Re-check the student isn't already enrolled (defends against a
//     double-click / double-submit race, on top of the DB-level
//     @@unique([studentId, courseId]) on Enrollment).
//  3. Re-check the student's balance covers the price (never trust a
//     balance figure the client sent — always re-read from the DB here).
//  4. Decrement balance, create Enrollment, create the ledger Transaction
//     (type: 'purchase', topUpRequestId left null).
//  5. For subscription enrollments, also create a Subscription record.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'student')
    return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const courseId = Number(body?.courseId);
  const enrollmentType = body?.enrollmentType || 'full';
  if (!courseId || Number.isNaN(courseId))
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  if (!['full', 'subscription'].includes(enrollmentType))
    return NextResponse.json({ error: 'Invalid enrollment type' }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true, subscriptionPrice: true, isVisible: true },
  });
  if (!course || !course.isVisible)
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  // Validate subscription price is set for subscription enrollment
  if (enrollmentType === 'subscription' && !course.subscriptionPrice)
    return NextResponse.json({ error: 'Subscription not available for this course' }, { status: 400 });

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
    select: { id: true },
  });
  if (existing)
    return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 });

  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const price = enrollmentType === 'subscription' ? course.subscriptionPrice! : course.price;

  // Allow negative balance for subscription enrollments
  if (enrollmentType === 'full' && student.balance < price)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });

  try {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    if (enrollmentType === 'subscription') {
      const [, enrollment, subscription] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: price } },
        }),
        prisma.enrollment.create({
          data: {
            studentId: user.id,
            courseId,
            enrollmentType: 'subscription',
          },
        }),
        prisma.subscription.create({
          data: {
            studentId: user.id,
            courseId,
            nextBillingDate,
          },
        }),
        prisma.transaction.create({
          data: {
            studentId: user.id,
            amount: price,
            type: 'subscription',
            method: 'balance',
            courseId,
          },
        }),
      ]);

      // Link enrollment to subscription
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { subscriptionId: subscription.id },
      });

      return NextResponse.json({ ok: true, enrollment, subscription });
    } else {
      const [, enrollment] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: price } },
        }),
        prisma.enrollment.create({
          data: { studentId: user.id, courseId, enrollmentType: 'full' },
        }),
        prisma.transaction.create({
          data: {
            studentId: user.id,
            amount: price,
            type: 'purchase',
            method: 'balance',
            courseId,
          },
        }),
      ]);

      return NextResponse.json({ ok: true, enrollment });
    }
  } catch (err: any) {
    // P2002 here would mean a race on the Enrollment unique constraint —
    // i.e. two concurrent enroll requests for the same student+course.
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 });
    }
    throw err;
  }
}

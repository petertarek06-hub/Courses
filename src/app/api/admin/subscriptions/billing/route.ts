// src/app/api/admin/subscriptions/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasAdminAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — process monthly subscription billing
// This endpoint should be called by a cron job/scheduler to process
// recurring subscription payments every day.
//
// It will:
// 1. Find all active subscriptions where nextBillingDate <= today
// 2. Deduct the subscription price from the student's balance (allowing negative)
// 3. Create a transaction record
// 4. Update nextBillingDate to 30 days in the future
// 5. Return a summary of processed subscriptions
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active subscriptions that need billing
    const subscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        cancelledAt: null,
        nextBillingDate: { lte: today },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            subscriptionPrice: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            balance: true,
            isActive: true,
          },
        },
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No subscriptions due for billing today',
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ subscriptionId: number; studentName: string; error: string }>,
    };

    // Process each subscription
    for (const subscription of subscriptions) {
      results.processed++;

      try {
        const price = subscription.course.subscriptionPrice;
        if (!price || price <= 0) {
          throw new Error('Invalid subscription price');
        }

        // Deduct from balance (allow negative)
        await prisma.$transaction([
          prisma.user.update({
            where: { id: subscription.studentId },
            data: { balance: { decrement: price } },
          }),
          prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate: new Date(
                new Date(subscription.nextBillingDate).getTime() + 30 * 24 * 60 * 60 * 1000
              ),
            },
          }),
          prisma.transaction.create({
            data: {
              studentId: subscription.studentId,
              amount: price,
              type: 'subscription',
              method: 'balance',
              courseId: subscription.courseId,
              subscriptionId: subscription.id,
            },
          }),
        ]);

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription.id,
          studentName: subscription.student.fullName,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.processed} subscriptions: ${results.successful} successful, ${results.failed} failed`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to process subscription billing',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET — get billing status and upcoming subscriptions
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !hasAdminAccess(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeSubscriptions, dueToday, totalStudents] = await Promise.all([
      prisma.subscription.count({
        where: { isActive: true, cancelledAt: null },
      }),
      prisma.subscription.count({
        where: {
          isActive: true,
          cancelledAt: null,
          nextBillingDate: { lte: today },
        },
      }),
      prisma.user.count({
        where: { role: 'student', balance: { lt: 0 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      activeSubscriptions,
      dueToday,
      studentsWithNegativeBalance: totalStudents,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch billing status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

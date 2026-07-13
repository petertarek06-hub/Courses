import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalStudents, totalTeachers, totalCourses, revenueAgg, recentStudents] =
    await Promise.all([
      prisma.user.count({
        where: { role: 'student' },
      }),

      prisma.user.count({
        where: { role: 'teacher' },
      }),

      // Count all courses
      prisma.course.count(),

      // Sum course-purchase transactions.
      // No `status` filter needed anymore — Transaction is a pure ledger
      // now, so every row in it already represents completed, money-moved
      // activity by definition. Pending/rejected top-ups never make it in
      // here at all (they live in TopUpRequest until approved).
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'topup' },
      }),

      // Last 10 registered users (any role) for the recent table
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          phone: true,
          academicYear: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

  return NextResponse.json({
    totalStudents,
    totalTeachers,
    totalCourses,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    recentStudents,
  });
}

//src\app\api\admin\stats\route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user || (user.role !== 'admin' && user.role !== 'assistant')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalStudents, totalTeachers, totalAssistants, totalCourses, revenueAgg, recentStudents] =
    await Promise.all([
      prisma.user.count({
        where: { role: 'student' },
      }),

      prisma.user.count({
        where: { role: 'teacher' },
      }),
      prisma.user.count({
        where: { role: 'assistant' },
      }),

      // Count all courses
      prisma.course.count(),

      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'topup' },
      }),

      // Last 10 registered users (any role) for the recent table
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
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
    totalAssistants,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    recentStudents,
  });
}

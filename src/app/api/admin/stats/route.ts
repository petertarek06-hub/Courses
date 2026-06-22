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
      // Count all students
      prisma.user.count({
        where: { role: 'student' },
      }),

      // Count all teachers/instructors
      prisma.user.count({
        where: { role: 'teacher' },
      }),

      // Count all courses
      prisma.course.count(),

      // Sum completed payment transactions
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'payment', status: 'completed' },
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

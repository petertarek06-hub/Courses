// src/app/api/student/scheduled-exams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// ── GET /api/student/scheduled-exams?courseId=X ───────────────────
// Returns scheduled exams for courses the student is enrolled in
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));

  // Get student's enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  const where = {
    courseId: courseId ? courseId : { in: enrolledCourseIds },
    isVisible: true,
  };

  const scheduledExams = await prisma.scheduledExam.findMany({
    where,
    include: {
      course: {
        select: { id: true, name: true, subject: true, academicYear: true },
      },
      attempts: {
        where: { studentId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(scheduledExams);
}

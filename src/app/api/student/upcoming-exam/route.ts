// src/app/api/student/upcoming-exam/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Deliberately separate from /api/student/dashboard: that route returns a
// large payload meant for the dashboard page only. This one is meant to be
// polled from ANY page (via a global watcher mounted in the root layout),
// so it stays as small and cheap as possible — just the single nearest
// upcoming scheduled exam across all of the student's enrolled courses,
// or null if there isn't one.
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ exam: null }, { status: 401 });

  const now = new Date();

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: {
      course: {
        select: {
          id: true,
          name: true,
          lessons: {
            where: { isVisible: true, type: 'exam' },
            select: {
              exam: { select: { scheduledAt: true } },
            },
          },
        },
      },
    },
  });

  const upcoming = enrollments
    .flatMap((e) =>
      e.course.lessons
        .filter((l) => l.exam?.scheduledAt && new Date(l.exam.scheduledAt) > now)
        .map((l) => ({
          courseId: e.course.id,
          courseName: e.course.name,
          scheduledAt: l.exam!.scheduledAt as Date,
        }))
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  return NextResponse.json({ exam: upcoming ?? null });
}

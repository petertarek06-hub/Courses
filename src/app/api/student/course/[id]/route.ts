// src/app/api/student/course/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = Number((await params).id);
  if (!courseId) return NextResponse.json({ error: 'Invalid course' }, { status: 400 });

  // Verify student is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });

  // Fetch course + ALL visible lessons (video + exam) + student progress
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { id: true, fullName: true, avatarUrl: true } },
      lessons: {
        where: { isVisible: true }, // ✅ removed type:'video' — include exams too
        orderBy: { order: 'asc' },
        include: {
          video: { select: { id: true, vimeoId: true, durationSec: true } },
          exam: {
            select: {
              id: true,
              durationMinutes: true,
              passingScore: true,
              // Include the student's latest attempt for this exam
              attempts: {
                where: { studentId: user.id },
                orderBy: { startedAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  score: true,
                  passed: true,
                  submittedAt: true,
                },
              },
            },
          },
          progress: {
            where: { studentId: user.id },
            select: { completed: true, completedAt: true },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ course, enrolledAt: enrollment.enrolledAt });
}

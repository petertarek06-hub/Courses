// src/app/api/teacher/courses/[id]/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'teacher')
    return NextResponse.json({ error: 'Only teachers can access this' }, { status: 403 });

  const courseId = Number((await params).id);
  if (!courseId) return NextResponse.json({ error: 'Invalid course' }, { status: 400 });

  // Verify teacher owns this course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true, name: true },
  });
  if (!course || course.teacherId !== user.id)
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Fetch all enrollments + student progress + exam attempts
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  // For each student, fetch their progress and latest exam scores
  const studentData = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get all visible lessons in this course
      const allLessons = await prisma.lesson.findMany({
        where: { courseId, isVisible: true },
        select: {
          id: true,
          type: true,
          exam: { select: { id: true } },
        },
      });

      const totalLessons = allLessons.length;

      // Count completed lessons: either explicit LessonProgress OR submitted exam attempt
      const completedLessonIds = new Set<number>();

      // Add explicitly completed lessons from LessonProgress
      const progressRecords = await prisma.lessonProgress.findMany({
        where: {
          studentId: enrollment.studentId,
          lesson: { courseId },
          completed: true,
        },
        select: { lessonId: true },
      });
      progressRecords.forEach((r) => completedLessonIds.add(r.lessonId));

      // Add exam lessons where student has submitted an attempt
      const examLessons = allLessons.filter((l) => l.type === 'exam' && l.exam);
      for (const lesson of examLessons) {
        const hasAttempt = await prisma.examAttempt.findFirst({
          where: {
            studentId: enrollment.studentId,
            exam: { lessonId: lesson.id },
            submittedAt: { not: null }, // Only count submitted attempts
          },
          select: { id: true },
        });
        if (hasAttempt) {
          completedLessonIds.add(lesson.id);
        }
      }

      const progress = Array.from(completedLessonIds);

      // Get latest exam attempts (both regular exams and scheduled exams)
      const examAttempts = await prisma.examAttempt.findMany({
        where: {
          studentId: enrollment.studentId,
          exam: { lesson: { courseId } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          score: true,
          passed: true,
          submittedAt: true,
        },
      });

      const scheduledExamAttempts = await prisma.scheduledExamAttempt.findMany({
        where: {
          studentId: enrollment.studentId,
          exam: { courseId },
        },
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          score: true,
          passed: true,
          submittedAt: true,
        },
      });

      // Combine and get the most recent
      const allAttempts = [...examAttempts, ...scheduledExamAttempts].sort(
        (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
      );
      const latestAttempt = allAttempts[0] || null;

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.student.fullName,
        studentPhone: enrollment.student.phone,
        studentAvatar: enrollment.student.avatarUrl,
        enrolledAt: enrollment.enrolledAt,
        lessonsCompleted: progress.length,
        totalLessons,
        progressPercent: totalLessons > 0 ? Math.round((progress.length / totalLessons) * 100) : 0,
        latestExamScore: latestAttempt?.score ?? null,
        latestExamPassed: latestAttempt?.passed ?? null,
        latestExamDate: latestAttempt?.submittedAt ?? null,
      };
    })
  );

  return NextResponse.json({
    course: {
      //   id: course.id,
      name: course.name,
    },
    students: studentData,
  });
}

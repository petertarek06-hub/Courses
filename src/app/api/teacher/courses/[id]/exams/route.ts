//src\app\api\teacher\courses\[id]\exams\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true, teacherId: true },
  });

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (user.role === 'teacher' && course.teacherId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const examLessons = await prisma.lesson.findMany({
    where: { courseId, type: 'exam' },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      exam: {
        select: {
          id: true,
          scheduledAt: true,
          examQuestions: {
            select: { question: { select: { type: true } } },
          },
          attempts: {
            orderBy: { startedAt: 'desc' },
            select: {
              id: true,
              startedAt: true,
              submittedAt: true,
              score: true,
              passed: true,
              student: { select: { id: true, fullName: true } },
              answers: {
                select: {
                  isCorrect: true,
                  examQuestion: { select: { question: { select: { type: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  type Row = {
    examId: number;
    examName: string;
    scheduledAt: string | null;
    totalQuestions: number;
    essayQuestions: number;
    studentId: number | null;
    studentName: string | null;
    attemptId: number | null;
    submittedAt: string | null;
    score: number | null;
    passed: boolean | null;
    status: 'not_attempted' | 'in_progress' | 'pending_grading' | 'graded';
  };

  const grading: Row[] = [];
  const remaining: Row[] = [];

  for (const lesson of examLessons) {
    if (!lesson.exam) continue; // lesson marked type "exam" but no Exam row yet (shouldn't happen, guard anyway)

    const totalQuestions = lesson.exam.examQuestions.length;
    const essayQuestions = lesson.exam.examQuestions.filter(
      (eq) => eq.question.type === 'essay'
    ).length;

    if (lesson.exam.attempts.length === 0) {
      remaining.push({
        examId: lesson.exam.id,
        examName: lesson.title,
        scheduledAt: lesson.exam.scheduledAt ? lesson.exam.scheduledAt.toISOString() : null,
        totalQuestions,
        essayQuestions,
        studentId: null,
        studentName: null,
        attemptId: null,
        submittedAt: null,
        score: null,
        passed: null,
        status: 'not_attempted',
      });
      continue;
    }

    for (const attempt of lesson.exam.attempts) {
      const hasUngradedEssay = attempt.answers.some(
        (a) => a.examQuestion.question.type === 'essay' && a.isCorrect === null
      );

      const status: Row['status'] = !attempt.submittedAt
        ? 'in_progress'
        : hasUngradedEssay
          ? 'pending_grading'
          : 'graded';

      const row: Row = {
        examId: lesson.exam.id,
        examName: lesson.title,
        scheduledAt: lesson.exam.scheduledAt ? lesson.exam.scheduledAt.toISOString() : null,
        totalQuestions,
        essayQuestions,
        studentId: attempt.student.id,
        studentName: attempt.student.fullName,
        attemptId: attempt.id,
        submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
        score: attempt.score,
        passed: attempt.passed,
        status,
      };

      if (status === 'pending_grading') {
        grading.push(row);
      } else {
        remaining.push(row);
      }
    }
  }

  return NextResponse.json({
    course: { id: course.id, name: course.name },
    grading,
    remaining,
  });
}

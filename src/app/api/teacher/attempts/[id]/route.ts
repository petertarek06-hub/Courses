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
  const attemptId = Number(id);
  if (!Number.isFinite(attemptId)) {
    return NextResponse.json({ error: 'Invalid attempt id' }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: { select: { id: true, fullName: true, phone: true } },
      exam: {
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, name: true, teacherId: true } },
            },
          },
        },
      },
      answers: {
        include: {
          examQuestion: {
            include: {
              question: {
                select: {
                  id: true,
                  text: true,
                  type: true,
                  optionsJson: true,
                  correctAnswer: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  if (user.role === 'teacher' && attempt.exam.lesson.course.teacherId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const answers = [...attempt.answers]
    .sort((a, b) => a.examQuestion.order - b.examQuestion.order)
    .map((a) => {
      const isEssay = a.examQuestion.question.type === 'essay';
      return {
        answerId: a.id,
        givenAnswer: a.givenAnswer,
        isCorrect: a.isCorrect,
        gradedScore: a.gradedScore,
        graderNotes: a.graderNotes,
        question: {
          id: a.examQuestion.question.id,
          text: a.examQuestion.question.text,
          type: a.examQuestion.question.type,
          mark: a.examQuestion.mark,
          // For MCQs this is the correct option; for essays it doubles as grading notes.
          correctAnswer: isEssay ? null : a.examQuestion.question.correctAnswer,
          gradingNotes: isEssay ? a.examQuestion.question.correctAnswer : null,
          optionsJson: isEssay ? null : a.examQuestion.question.optionsJson,
        },
      };
    });

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      passed: attempt.passed,
    },
    student: attempt.student,
    exam: {
      id: attempt.exam.id,
      passingScore: attempt.exam.passingScore,
      scheduledAt: attempt.exam.scheduledAt,
      lessonId: attempt.exam.lesson.id,
      lessonTitle: attempt.exam.lesson.title,
      courseId: attempt.exam.lesson.course.id,
      courseName: attempt.exam.lesson.course.name,
    },
    answers,
  });
}

//src\app\api\teacher\attempts\[id]\route.ts
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const body = await req.json().catch(() => null);
  const answerId = Number(body?.answerId);
  const gradedScore = Number(body?.gradedScore);
  const graderNotes: string | null =
    typeof body?.graderNotes === 'string' ? body.graderNotes : null;

  if (!Number.isFinite(answerId)) {
    return NextResponse.json({ error: 'Invalid answerId' }, { status: 400 });
  }
  if (!Number.isFinite(gradedScore) || gradedScore < 0) {
    return NextResponse.json({ error: 'Invalid gradedScore' }, { status: 400 });
  }

  // Load the attempt (with course ownership + all answers/marks) so we can
  // both authorize the request and recompute the attempt's total score.
  // ✅ NEW: also select the lesson's id (not just course.teacherId) — we
  // need it below to upsert LessonProgress once the attempt is fully
  // graded and passed, otherwise essay-based exams never contributed to
  // course progress the way auto-graded exams already do.
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          lesson: { select: { id: true, course: { select: { teacherId: true } } } },
        },
      },
      answers: {
        include: {
          examQuestion: {
            include: { question: { select: { type: true } } },
          },
        },
      },
    },
  });

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  if (user.role === 'teacher' && attempt.exam.lesson.course.teacherId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetAnswer = attempt.answers.find((a) => a.id === answerId);
  if (!targetAnswer) {
    return NextResponse.json({ error: 'Answer not found on this attempt' }, { status: 404 });
  }
  if (targetAnswer.examQuestion.question.type !== 'essay') {
    return NextResponse.json(
      { error: 'Only essay answers can be graded manually' },
      { status: 400 }
    );
  }

  const mark = targetAnswer.examQuestion.mark;
  const safeScore = Math.min(gradedScore, mark);
  const isCorrect = safeScore >= mark;

  const updatedAnswer = await prisma.attemptAnswer.update({
    where: { id: answerId },
    data: {
      gradedScore: safeScore,
      isCorrect,
      graderNotes: graderNotes?.trim() || null,
    },
  });

  // Recompute the attempt's overall score once every answer has been graded.
  const allAnswers = attempt.answers.map((a) =>
    a.id === answerId ? { ...a, gradedScore: safeScore, isCorrect } : a
  );
  const allGraded = allAnswers.every((a) => a.isCorrect !== null);

  let attemptScore = attempt.score;
  let attemptPassed = attempt.passed;

  if (allGraded) {
    const totalMark = allAnswers.reduce((sum, a) => sum + a.examQuestion.mark, 0);
    const earned = allAnswers.reduce(
      (sum, a) =>
        sum +
        (a.examQuestion.question.type === 'essay'
          ? (a.gradedScore ?? 0)
          : a.isCorrect
            ? a.examQuestion.mark
            : 0),
      0
    );
    attemptScore = totalMark > 0 ? Math.round((earned / totalMark) * 100) : 0;
    attemptPassed =
      attemptScore >=
      (
        await prisma.exam.findUniqueOrThrow({
          where: { id: attempt.examId },
          select: { passingScore: true },
        })
      ).passingScore;

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { score: attemptScore, passed: attemptPassed },
    });
    if (attemptPassed) {
      await prisma.lessonProgress.upsert({
        where: {
          studentId_lessonId: { studentId: attempt.studentId, lessonId: attempt.exam.lesson.id },
        },
        create: {
          studentId: attempt.studentId,
          lessonId: attempt.exam.lesson.id,
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({
    answerId: updatedAnswer.id,
    gradedScore: updatedAnswer.gradedScore,
    isCorrect: updatedAnswer.isCorrect,
    graderNotes: updatedAnswer.graderNotes,
    attempt: { score: attemptScore, passed: attemptPassed },
  });
}

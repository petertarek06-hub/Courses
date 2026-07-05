// src/app/api/instructor/grade/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// ── Auth helper ───────────────────────────────────────────────────
async function authorizeGrader() {
  const user = await getAuthUser();
  if (!user)
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'teacher' && user.role !== 'admin')
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

// ── GET /api/instructor/grade ─────────────────────────────────────
// Returns all pending essay AttemptAnswers for courses owned by this instructor.
// Admin sees all courses.
// Query params: ?courseId=X (optional filter)
export async function GET(req: NextRequest) {
  const { user, error } = await authorizeGrader();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const filterCourseId = searchParams.get('courseId') ? Number(searchParams.get('courseId')) : null;

  // Build course filter
  const courseWhere =
    user!.role === 'admin'
      ? filterCourseId
        ? { id: filterCourseId }
        : {}
      : { instructorId: user!.id, ...(filterCourseId ? { id: filterCourseId } : {}) };

  const answers = await prisma.attemptAnswer.findMany({
    where: {
      isCorrect: null, // pending essay answers only
      examQuestion: {
        question: { type: 'essay' },
        exam: {
          lesson: {
            course: courseWhere,
          },
        },
      },
    },
    include: {
      attempt: {
        include: {
          student: { select: { id: true, fullName: true, phone: true } },
        },
      },
      examQuestion: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              correctAnswer: true, // grading notes for instructor
            },
          },
          exam: {
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  course: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { attempt: { submittedAt: 'asc' } },
  });

  // Shape the response for the grading page
  const pending = answers.map((a) => ({
    answerId: a.id,
    attemptId: a.attemptId,
    givenAnswer: a.givenAnswer,
    graderNotes: a.graderNotes,
    question: {
      id: a.examQuestion.question.id,
      text: a.examQuestion.question.text,
      gradingNotes: a.examQuestion.question.correctAnswer, // stored in correctAnswer column
      mark: a.examQuestion.mark,
    },
    student: a.attempt.student,
    exam: {
      lessonId: a.examQuestion.exam.lesson.id,
      lessonTitle: a.examQuestion.exam.lesson.title,
      courseId: a.examQuestion.exam.lesson.course.id,
      courseName: a.examQuestion.exam.lesson.course.name,
    },
    submittedAt: a.attempt.submittedAt,
  }));

  return NextResponse.json({ pending });
}

// ── PATCH /api/teacher/grade ───────────────────────────────────
// Body: { answerId, gradedScore, graderNotes? }
// Grades one essay answer and recalculates the attempt's total score/passed
// if all answers for that attempt are now graded.
export async function PATCH(req: NextRequest) {
  const { user, error } = await authorizeGrader();
  if (error) return error;

  const body = await req.json();
  const { answerId, gradedScore, graderNotes } = body;

  if (typeof answerId !== 'number' || typeof gradedScore !== 'number' || gradedScore < 0) {
    return NextResponse.json(
      { error: 'answerId and a non-negative gradedScore are required' },
      { status: 400 }
    );
  }

  // Fetch the answer to verify the instructor owns this course
  const answer = await prisma.attemptAnswer.findUnique({
    where: { id: answerId },
    include: {
      examQuestion: {
        include: {
          question: { select: { type: true } },
          exam: {
            include: {
              lesson: {
                include: { course: { select: { id: true, instructorId: true } } },
              },
            },
          },
        },
      },
      attempt: {
        include: {
          answers: {
            include: {
              examQuestion: { select: { mark: true, question: { select: { type: true } } } },
            },
          },
        },
      },
    },
  });

  if (!answer) return NextResponse.json({ error: 'Answer not found' }, { status: 404 });

  // Auth check: teachers can only grade their own courses
  if (
    user!.role === 'teacher' &&
    answer.examQuestion.exam.lesson.course.instructorId !== user!.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cap gradedScore to the question's max mark
  const maxMark = answer.examQuestion.mark;
  const safeScore = Math.min(gradedScore, maxMark);
  const isCorrect = safeScore >= maxMark; // full marks = correct; partial/zero = incorrect

  // Update this answer
  await prisma.attemptAnswer.update({
    where: { id: answerId },
    data: {
      gradedScore: safeScore,
      isCorrect,
      graderNotes: graderNotes?.trim() || null,
    },
  });

  // Check if ALL answers in this attempt are now graded
  const allAnswers = answer.attempt.answers;
  const updatedAnswers = allAnswers.map((a) =>
    a.id === answerId ? { ...a, isCorrect, gradedScore: safeScore } : a
  );

  const allGraded = updatedAnswers.every((a) => a.isCorrect !== null);

  if (allGraded) {
    // Recalculate total score across all questions
    const totalMark = updatedAnswers.reduce((sum, a) => sum + a.examQuestion.mark, 0);
    const earned = updatedAnswers.reduce((sum, a) => sum + (a.gradedScore ?? 0), 0);
    const finalScore = totalMark > 0 ? Math.round((earned / totalMark) * 100) : 0;
    const passingScore = answer.examQuestion.exam.passingScore;
    const passed = finalScore >= passingScore;

    await prisma.examAttempt.update({
      where: { id: answer.attemptId },
      data: { score: finalScore, passed },
    });

    return NextResponse.json({ ok: true, attemptFinalized: true, finalScore, passed });
  }

  return NextResponse.json({ ok: true, attemptFinalized: false });
}

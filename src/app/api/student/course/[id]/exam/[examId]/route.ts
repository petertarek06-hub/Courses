// src/app/api/student/exam/[lessonId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// ── GET /api/student/exam/[lessonId] ─────────────────────────────
// Returns exam metadata + questions (no correctAnswer exposed to student)
export async function GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lessonId } = await params;
  const lessonIdNum = Number(lessonId);

  if (!lessonIdNum) return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });

  // Load lesson + exam + questions
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonIdNum },
    include: {
      course: { select: { id: true } },
      exam: {
        include: {
          examQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                select: {
                  id: true,
                  text: true,
                  type: true,
                  optionsJson: true,
                  // correctAnswer intentionally NOT selected — never sent to student
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: lesson.course.id } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  // ✅ NEW: block access before the exam's scheduled time, even via direct URL
  if (lesson.exam.scheduledAt && new Date(lesson.exam.scheduledAt) > new Date()) {
    return NextResponse.json(
      { error: 'not_yet_available', scheduledAt: lesson.exam.scheduledAt },
      { status: 403 }
    );
  }

  // ✅ NEW: block access if the student already has a passed attempt on this exam
  const passedAttempt = await prisma.examAttempt.findFirst({
    where: { studentId: user.id, examId: lesson.exam.id, passed: true },
    select: { id: true, score: true, submittedAt: true },
  });
  if (passedAttempt) {
    return NextResponse.json(
      {
        error: 'already_passed',
        attempt: passedAttempt,
      },
      { status: 409 }
    );
  }

  const questions = lesson.exam.examQuestions.map((eq) => {
    let options: string[] = [];
    try {
      options = JSON.parse(eq.question.optionsJson);
    } catch {
      /* ignore */
    }
    return {
      examQuestionId: eq.id,
      order: eq.order,
      mark: eq.mark,
      questionId: eq.question.id,
      text: eq.question.text,
      type: eq.question.type,
      options,
    };
  });

  return NextResponse.json({
    examId: lesson.exam.id,
    lessonTitle: lesson.title,
    durationMinutes: lesson.exam.durationMinutes,
    passingScore: lesson.exam.passingScore,
    questions,
  });
}

// ── POST /api/student/exam/[lessonId] ────────────────────────────
// Body: { answers: [{ examQuestionId, givenAnswer }] }
// - MCQ / true_false: auto-graded immediately (isCorrect set)
// - essay: isCorrect = null, gradedScore = null (pending manual grading)
// Returns ResultData for the result screen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lessonId } = await params;
  const lessonIdNum = Number(lessonId);

  if (!lessonIdNum) return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });

  const body = await req.json();
  const submitted: { examQuestionId: number; givenAnswer: string }[] = body.answers ?? [];

  // Load exam with correct answers (server-side only)
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonIdNum },
    include: {
      course: { select: { id: true } },
      exam: {
        include: {
          examQuestions: {
            include: {
              question: {
                select: {
                  id: true,
                  type: true,
                  correctAnswer: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: lesson.course.id } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  const exam = lesson.exam;

  // ✅ NEW: block submission before the exam's scheduled time
  if (exam.scheduledAt && new Date(exam.scheduledAt) > new Date()) {
    return NextResponse.json(
      { error: 'not_yet_available', scheduledAt: exam.scheduledAt },
      { status: 403 }
    );
  }

  // ✅ NEW: block submission if the student already passed this exam
  const passedAttempt = await prisma.examAttempt.findFirst({
    where: { studentId: user.id, examId: exam.id, passed: true },
    select: { id: true },
  });
  if (passedAttempt) {
    return NextResponse.json({ error: 'already_passed' }, { status: 409 });
  }

  // Build a lookup: examQuestionId → { type, correctAnswer, mark }
  const eqMap = new Map(
    exam.examQuestions.map((eq) => [
      eq.id,
      { type: eq.question.type, correctAnswer: eq.question.correctAnswer, mark: eq.mark },
    ])
  );

  // Determine auto-grade totals
  let autoEarned = 0;
  let autoTotal = 0;
  let hasEssay = false;

  const answerData = submitted
    .map((s) => {
      const eq = eqMap.get(s.examQuestionId);
      if (!eq) return null;

      if (eq.type === 'essay') {
        hasEssay = true;
        return {
          examQuestionId: s.examQuestionId,
          givenAnswer: s.givenAnswer,
          isCorrect: null, // pending manual grading
          gradedScore: null,
        };
      }

      // Auto-grade MCQ / true_false (case-insensitive trim)
      const correct = s.givenAnswer.trim().toLowerCase() === eq.correctAnswer.trim().toLowerCase();
      autoTotal += eq.mark;
      if (correct) autoEarned += eq.mark;

      return {
        examQuestionId: s.examQuestionId,
        givenAnswer: s.givenAnswer,
        isCorrect: correct,
        gradedScore: correct ? eq.mark : 0,
      };
    })
    .filter(Boolean) as {
    examQuestionId: number;
    givenAnswer: string;
    isCorrect: boolean | null;
    gradedScore: number | null;
  }[];

  // Compute auto-score percentage and pass/fail.
  // If essay questions exist, pass/fail is deferred (null) until manually graded,
  // and we also withhold any numeric score from storage/response (see below).
  const autoScore = autoTotal > 0 ? Math.round((autoEarned / autoTotal) * 100) : null;
  const passed = hasEssay ? null : autoScore !== null ? autoScore >= exam.passingScore : null;

  // Create ExamAttempt + AttemptAnswers in a transaction
  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.examAttempt.create({
      data: {
        studentId: user.id,
        // ✅ When essay questions are present, store no score at all (pending manual review)
        examId: exam.id,
        score: hasEssay ? null : autoScore,
        passed,
        submittedAt: new Date(),
      },
    });

    await tx.attemptAnswer.createMany({
      data: answerData.map((a) => ({
        attemptId: newAttempt.id,
        examQuestionId: a.examQuestionId,
        givenAnswer: a.givenAnswer,
        isCorrect: a.isCorrect,
        gradedScore: a.gradedScore,
      })),
    });

    // ✅ NEW: an exam-type lesson only counts toward course progress once the
    // student has actually passed it — a fail, or an essay-pending attempt
    // (passed === null), leaves the lesson incomplete. This mirrors the
    // "completed" semantics of LessonProgress used for video lessons, but
    // gated on passing rather than merely attempting.
    //
    // Note: if this exam has essay questions, `passed` is null here and no
    // write happens yet. Whichever endpoint later performs manual grading
    // of essay answers (e.g. the teacher attempt-review route) and flips
    // passed to true must perform this same upsert at that point, or a
    // student who only passes after manual grading will never get credit
    // for this lesson in their course progress.
    if (passed === true) {
      await tx.lessonProgress.upsert({
        where: { studentId_lessonId: { studentId: user.id, lessonId: lessonIdNum } },
        update: { completed: true, completedAt: new Date() },
        create: {
          studentId: user.id,
          lessonId: lessonIdNum,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    return newAttempt;
  });

  // ✅ NEW: when essay questions exist, withhold all score/pass data from the response.
  // The frontend should show only the "pending manual grading" message in this case.
  if (hasEssay) {
    return NextResponse.json({
      attemptId: attempt.id,
      hasEssay: true,
      autoScore: null,
      autoTotal: 0,
      autoEarned: 0,
      passed: null,
      passingScore: exam.passingScore,
    });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    hasEssay,
    autoScore,
    autoTotal,
    autoEarned,
    passed,
    passingScore: exam.passingScore,
  });
}

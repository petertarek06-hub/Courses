// src/app/api/student/course/[id]/exam/[examId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string; examId: string }>;

// ── GET: fetch exam questions (shuffled) for a student to take ──
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, examId } = await params;
  const courseId = Number(id);
  const examIdNum = Number(examId);

  if (!courseId || !examIdNum)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  // Must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });

  // Fetch exam with its questions (via ExamQuestion join) + lesson info
  const exam = await prisma.exam.findUnique({
    where: { id: examIdNum },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
      examQuestions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              text: true,
              type: true,
              optionsJson: true,
              // correctAnswer intentionally omitted — sent only after submit
            },
          },
        },
      },
      attempts: {
        where: { studentId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          score: true,
          passed: true,
          submittedAt: true,
          startedAt: true,
          answers: {
            select: {
              examQuestionId: true,
              givenAnswer: true,
              isCorrect: true,
            },
          },
        },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  if (exam.lesson.courseId !== courseId)
    return NextResponse.json({ error: 'Exam not in course' }, { status: 403 });

  return NextResponse.json({ exam });
}

// ── POST: submit exam answers ────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, examId } = await params;
  const courseId = Number(id);
  const examIdNum = Number(examId);

  if (!courseId || !examIdNum)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  // Must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });

  const body = await req.json();
  // answers: { examQuestionId: number; givenAnswer: string }[]
  const answers: { examQuestionId: number; givenAnswer: string }[] = body.answers ?? [];

  if (!Array.isArray(answers) || answers.length === 0)
    return NextResponse.json({ error: 'No answers provided' }, { status: 400 });

  // Fetch exam with correct answers
  const exam = await prisma.exam.findUnique({
    where: { id: examIdNum },
    include: {
      lesson: { select: { id: true, courseId: true } },
      examQuestions: {
        include: {
          question: { select: { id: true, correctAnswer: true } },
        },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  if (exam.lesson.courseId !== courseId)
    return NextResponse.json({ error: 'Exam not in course' }, { status: 403 });

  // Build a map: examQuestionId → correctAnswer
  const correctMap = new Map<number, string>();
  for (const eq of exam.examQuestions) {
    correctMap.set(eq.id, eq.question.correctAnswer.trim().toLowerCase());
  }

  // Grade
  let correct = 0;
  const gradedAnswers = answers.map((a) => {
    const expectedRaw = correctMap.get(a.examQuestionId);
    const isCorrect =
      expectedRaw !== undefined && a.givenAnswer.trim().toLowerCase() === expectedRaw;
    if (isCorrect) correct++;
    return { ...a, isCorrect };
  });

  const total = exam.examQuestions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= exam.passingScore;

  // Create attempt + answers in one transaction
  const attempt = await prisma.examAttempt.create({
    data: {
      studentId: user.id,
      examId: examIdNum,
      score,
      passed,
      submittedAt: new Date(),
      answers: {
        create: gradedAnswers.map((a) => ({
          examQuestionId: a.examQuestionId,
          givenAnswer: a.givenAnswer,
          isCorrect: a.isCorrect,
        })),
      },
    },
    include: {
      answers: true,
    },
  });

  // Mark the exam lesson as completed in lesson progress
  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: user.id, lessonId: exam.lesson.id } },
    update: { completed: true, completedAt: new Date() },
    create: {
      studentId: user.id,
      lessonId: exam.lesson.id,
      completed: true,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ attempt, score, passed, correct, total });
}

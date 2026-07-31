// src/app/api/student/scheduled-exams/[examId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// ── GET /api/student/scheduled-exams/[examId] ───────────────────────
// Get scheduled exam details with questions (for taking the exam)
export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const examId = Number(params.examId);

  // Verify student is enrolled in the course
  const scheduledExam = await prisma.scheduledExam.findUnique({
    where: { id: examId },
    include: {
      course: {
        select: { id: true, name: true },
      },
      examQuestions: {
        where: { isVisible: true },
        include: { question: true },
        orderBy: { order: 'asc' },
      },
      attempts: {
        where: { studentId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!scheduledExam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: scheduledExam.courseId,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  // Check if exam is available (scheduled time has passed)
  if (new Date(scheduledExam.scheduledAt) > new Date()) {
    return NextResponse.json({ error: 'Exam not yet available' }, { status: 403 });
  }

  // Don't send correct answers to the student
  const examQuestions = scheduledExam.examQuestions.map((eq) => ({
    id: eq.id,
    order: eq.order,
    mark: eq.mark,
    question: {
      id: eq.question.id,
      text: eq.question.text,
      type: eq.question.type,
      optionsJson: eq.question.optionsJson,
      // Omit correctAnswer
    },
  }));

  return NextResponse.json({
    exam: {
      id: scheduledExam.id,
      title: scheduledExam.title,
      durationMinutes: scheduledExam.durationMinutes,
      passingScore: scheduledExam.passingScore,
      scheduledAt: scheduledExam.scheduledAt,
      course: scheduledExam.course,
    },
    questions: examQuestions,
    previousAttempt: scheduledExam.attempts[0] || null,
  });
}

// ── POST /api/student/scheduled-exams/[examId] ─────────────────────
// Start a new exam attempt
export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const examId = Number(params.examId);

  // Verify enrollment and availability
  const scheduledExam = await prisma.scheduledExam.findUnique({
    where: { id: examId },
    select: { courseId: true, scheduledAt: true },
  });

  if (!scheduledExam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  if (new Date(scheduledExam.scheduledAt) > new Date()) {
    return NextResponse.json({ error: 'Exam not yet available' }, { status: 403 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: scheduledExam.courseId,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  // Create new attempt
  const attempt = await prisma.scheduledExamAttempt.create({
    data: {
      examId,
      studentId: user.id,
    },
  });

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}

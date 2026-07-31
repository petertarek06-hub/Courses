// src/app/api/student/scheduled-exams/[examId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// ── POST /api/student/scheduled-exams/[examId]/submit ───────────────
// Submit exam answers for grading
export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const examId = Number(params.examId);
  const { attemptId, answers } = await req.json();

  if (!attemptId || !answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'attemptId and answers array required' }, { status: 400 });
  }

  // Verify the attempt belongs to this student and exam
  const attempt = await prisma.scheduledExamAttempt.findUnique({
    where: { id: Number(attemptId) },
    include: { exam: true },
  });

  if (!attempt || attempt.examId !== examId || attempt.studentId !== user.id) {
    return NextResponse.json({ error: 'Invalid attempt' }, { status: 404 });
  }

  if (attempt.submittedAt) {
    return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
  }

  // Get exam questions for grading
  const examQuestions = await prisma.scheduledExamQuestion.findMany({
    where: { examId, isVisible: true },
    include: { question: true },
    orderBy: { order: 'asc' },
  });

  let totalScore = 0;
  let totalMarks = 0;

  // Process each answer
  for (const answer of answers) {
    const examQuestion = examQuestions.find((eq) => eq.id === answer.examQuestionId);
    if (!examQuestion) continue;

    totalMarks += examQuestion.mark;

    const isCorrect = gradeAnswer(
      examQuestion.question.type,
      examQuestion.question.correctAnswer,
      answer.givenAnswer
    );

    const gradedScore = isCorrect ? examQuestion.mark : 0;
    totalScore += gradedScore;

    const existing = await prisma.scheduledExamAttemptAnswer.findFirst({
      where: {
        attemptId: Number(attemptId),
        examQuestionId: examQuestion.id,
      },
    });

    if (existing) {
      await prisma.scheduledExamAttemptAnswer.update({
        where: { id: existing.id },
        data: {
          givenAnswer: answer.givenAnswer,
          isCorrect,
          gradedScore,
        },
      });
    } else {
      await prisma.scheduledExamAttemptAnswer.create({
        data: {
          attemptId: Number(attemptId),
          examQuestionId: examQuestion.id,
          givenAnswer: answer.givenAnswer,
          isCorrect,
          gradedScore,
        },
      });
    }
  }

  // Calculate final score and pass/fail
  const finalScore = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const passed = finalScore >= attempt.exam.passingScore;

  // Update attempt
  await prisma.scheduledExamAttempt.update({
    where: { id: Number(attemptId) },
    data: {
      score: finalScore,
      passed,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({
    score: finalScore,
    passed,
    totalMarks,
    obtainedMarks: totalScore,
  });
}

function gradeAnswer(
  questionType: string,
  correctAnswer: string,
  givenAnswer: string
): boolean {
  if (questionType === 'essay') {
    // Essays require manual grading - return null for now
    return false;
  }

  try {
    const correct = JSON.parse(correctAnswer);
    const given = JSON.parse(givenAnswer);

    if (questionType === 'mcq' || questionType === 'true_false') {
      return JSON.stringify(correct) === JSON.stringify(given);
    }

    return false;
  } catch {
    // Fallback to string comparison
    return correctAnswer.trim() === givenAnswer.trim();
  }
}

// src/lib/examAttempt.ts
import { prisma } from '@/lib/prisma';

// Shared shaping logic for "review a graded attempt" — used by both the
// student and guardian routes so their response shapes never drift apart.
// Deliberately does NOT filter answers by examQuestion.isVisible: a
// question may have been soft-removed from the exam after the student
// answered it, but it still contributed to their score, so it stays
// visible in the historical review.
export async function loadExamAttemptDetail(attemptId: number) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: { select: { id: true, fullName: true, phone: true } },
      exam: {
        include: {
          lesson: { include: { course: { select: { id: true, name: true } } } },
        },
      },
      answers: {
        include: {
          examQuestion: { include: { question: true } },
        },
      },
    },
  });

  if (!attempt) return null;

  return {
    studentId: attempt.studentId,
    submittedAt: attempt.submittedAt,
    payload: {
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
        lessonId: attempt.exam.lessonId,
        lessonTitle: attempt.exam.lesson.title,
        courseId: attempt.exam.lesson.course.id,
        courseName: attempt.exam.lesson.course.name,
      },
      answers: [...attempt.answers]
        .sort((a, b) => a.examQuestion.order - b.examQuestion.order)
        .map((a) => ({
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
            correctAnswer: a.examQuestion.question.correctAnswer,
            // QuestionBank has no gradingNotes column in the schema —
            // kept null here to match what's actually persisted.
            gradingNotes: null as string | null,
            optionsJson: a.examQuestion.question.optionsJson,
          },
        })),
    },
  };
}

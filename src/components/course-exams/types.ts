export type ExamStatus = 'not_attempted' | 'in_progress' | 'pending_grading' | 'graded';

export interface ExamRow {
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
  status: ExamStatus;
}

export interface ExamsData {
  course: { id: number; name: string };
  grading: ExamRow[];
  remaining: ExamRow[];
}

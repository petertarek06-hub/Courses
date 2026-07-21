export interface Answer {
  answerId: number;
  givenAnswer: string;
  isCorrect: boolean | null;
  gradedScore: number | null;
  graderNotes: string | null;
  question: {
    id: number;
    text: string;
    type: string;
    mark: number;
    correctAnswer: string | null;
    gradingNotes: string | null;
    optionsJson: string | null;
  };
}

export interface AttemptDetail {
  attempt: {
    id: number;
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    passed: boolean | null;
  };
  student: { id: number; fullName: string; phone: string };
  exam: {
    id: number;
    passingScore: number;
    scheduledAt: string | null;
    lessonId: number;
    lessonTitle: string;
    courseId: number;
    courseName: string;
  };
  answers: Answer[];
}

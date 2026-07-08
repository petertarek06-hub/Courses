// src/lib/examSchedule.ts

// A scheduled exam lesson is locked until its scheduledAt time arrives.
// scheduledAt === null means "no time lock" (only sequence matters).
export function isTimeLocked(scheduledAt: Date | string | null): boolean {
  if (!scheduledAt) return false;
  return new Date(scheduledAt).getTime() > Date.now();
}

export interface TimeRemaining {
  totalMs: number;
  hours: number;
  minutes: number;
  isUnderOneDay: boolean; // < 24h remaining — this is when we show the countdown
}

export function getTimeRemaining(scheduledAt: Date | string): TimeRemaining {
  const totalMs = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
  const totalMinutes = Math.floor(totalMs / 60000);
  return {
    totalMs,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    isUnderOneDay: totalMs < 24 * 60 * 60 * 1000,
  };
}

interface ScheduleLessonLike {
  type: 'video' | 'exam';
  exam?: { scheduledAt?: Date | string | null } | null;
}

// A "scheduled exam" stands entirely outside the sequential lesson flow:
// it doesn't require previous lessons to be completed to unlock, and
// completing later lessons doesn't depend on it either. Identified purely
// by having a non-null scheduledAt. Exams WITHOUT a scheduledAt stay part
// of the normal sequence, gated like any other lesson.
export function isScheduledExam(lesson: ScheduleLessonLike): boolean {
  return lesson.type === 'exam' && !!lesson.exam?.scheduledAt;
}

// Lessons that participate in the ordered sequence — everything except
// standalone scheduled exams. Use this before calling isLessonUnlocked.
// Written without generics (plain array in/out) to avoid any ambiguity
// between TS generic syntax and JSX-like angle brackets in transfer/editing.
export function getSequencedLessons(lessons: ScheduleLessonLike[]): ScheduleLessonLike[] {
  return lessons.filter((l) => !isScheduledExam(l));
}

// A lesson is "done" for unlock purposes when:
// - video → student marked it watched
// - exam  → student passed it
export function isLessonComplete(lesson: {
  type: 'video' | 'exam';
  exam?: { attempts?: { passed: boolean | null }[] } | null;
  progress?: { completed: boolean }[];
}): boolean {
  if (lesson.type === 'exam') return lesson.exam?.attempts?.[0]?.passed === true;
  return lesson.progress?.[0]?.completed === true;
}

// Lesson n is unlocked when every lesson before it, WITHIN THE SEQUENCED
// LIST, is complete. Callers must pass a list already filtered through
// getSequencedLessons — scheduled exams never belong in this array, since
// they don't participate in the sequence at all.
export function isLessonUnlocked(
  lessons: {
    type: 'video' | 'exam';
    exam?: { attempts?: { passed: boolean | null }[] } | null;
    progress?: { completed: boolean }[];
  }[],
  index: number
): boolean {
  if (index === 0) return true;
  return lessons.slice(0, index).every(isLessonComplete);
}

// A standalone scheduled exam is available the moment its time arrives —
// independent of sequence, independent of any other lesson's state.
export function isScheduledExamAvailable(scheduledAt: Date | string): boolean {
  return !isTimeLocked(scheduledAt);
}

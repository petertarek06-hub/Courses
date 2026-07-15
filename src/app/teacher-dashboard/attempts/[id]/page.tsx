'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Send,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

interface Answer {
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

interface AttemptDetail {
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

const T = {
  ar: {
    back: 'العودة لامتحانات الكورس',
    loading: 'جارٍ التحميل...',
    errorLoad: 'فشل تحميل بيانات المحاولة',
    retry: 'إعادة المحاولة',
    student: 'الطالب',
    submittedAt: 'تاريخ التسليم',
    notSubmitted: 'لم يُسلَّم بعد',
    finalScore: 'الدرجة النهائية',
    passed: 'ناجح',
    failed: 'راسب',
    pendingResult: 'بانتظار التصحيح',
    question: 'السؤال',
    studentAnswer: 'إجابة الطالب',
    correctAnswer: 'الإجابة الصحيحة',
    gradingNotes: 'تعليمات التصحيح',
    showNotes: 'عرض تعليمات التصحيح',
    hideNotes: 'إخفاء التعليمات',
    noAnswer: 'لم يكتب الطالب إجابة',
    correct: 'صحيحة',
    incorrect: 'خاطئة',
    score: 'الدرجة',
    scoreOf: 'من',
    graderNotesLabel: 'ملاحظات للطالب (اختياري)',
    graderNotesPlaceholder: 'مثال: إجابة جيدة لكن يجب ذكر المزيد من التفاصيل...',
    submitGrade: 'حفظ الدرجة',
    submitting: 'جارٍ الحفظ...',
    graded: 'تم التصحيح',
    editGrade: 'تعديل الدرجة',
    missingScore: 'يرجى إدخال درجة صحيحة',
    mcqBadge: 'اختيار من متعدد',
    essayBadge: 'مقالي',
    studentPick: 'اختيار الطالب',
    correctPick: 'الإجابة الصحيحة',
    rawStudentAnswer: 'إجابة الطالب المسجّلة',
    rawCorrectAnswer: 'الإجابة الصحيحة المسجّلة',
  },
  en: {
    back: 'Back to Course Exams',
    loading: 'Loading...',
    errorLoad: 'Failed to load attempt data',
    retry: 'Retry',
    student: 'Student',
    submittedAt: 'Submitted',
    notSubmitted: 'Not submitted yet',
    finalScore: 'Final Score',
    passed: 'Passed',
    failed: 'Failed',
    pendingResult: 'Pending grading',
    question: 'Question',
    studentAnswer: 'Student answer',
    correctAnswer: 'Correct answer',
    gradingNotes: 'Grading notes',
    showNotes: 'Show grading notes',
    hideNotes: 'Hide notes',
    noAnswer: 'No answer written',
    correct: 'Correct',
    incorrect: 'Incorrect',
    score: 'Score',
    scoreOf: 'out of',
    graderNotesLabel: 'Feedback for student (optional)',
    graderNotesPlaceholder: 'e.g. Good answer but more detail is needed...',
    submitGrade: 'Save grade',
    submitting: 'Saving...',
    graded: 'Graded',
    editGrade: 'Edit grade',
    missingScore: 'Please enter a valid score',
    mcqBadge: 'Multiple choice',
    essayBadge: 'Essay',
    studentPick: 'Student picked',
    correctPick: 'Correct answer',
    rawStudentAnswer: 'Recorded student answer',
    rawCorrectAnswer: 'Recorded correct answer',
  },
} as const;

function formatDate(iso: string | null, isRtl: boolean, fallback: string) {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Parses the QuestionBank.optionsJson column into a string[] ───
function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map((o) => String(o)) : [];
  } catch {
    return [];
  }
}

// Case/whitespace-insensitive equality so stored values that differ only by
// trailing spaces or casing still match an option in the list.
function looseEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ─── MCQ (auto-graded) question card — read-only, color-coded options ──
function McqCard({ answer, lang, font }: { answer: Answer; lang: 'ar' | 'en'; font?: string }) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const options = parseOptions(answer.question.optionsJson);

  const correctMatchedAnOption = options.some((o) => looseEquals(o, answer.question.correctAnswer));
  const givenMatchedAnOption = options.some((o) => looseEquals(o, answer.givenAnswer));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {t.mcqBadge}
          </span>
          <p className="text-sm font-semibold text-foreground mt-2" style={{ fontFamily: font }}>
            {answer.question.text}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
            answer.isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
          }`}
          style={{ fontFamily: font }}
        >
          {answer.isCorrect ? <CheckCircle size={11} /> : <XCircle size={11} />}
          {answer.isCorrect ? t.correct : t.incorrect}
        </span>
      </div>

      {options.length > 0 ? (
        <div className="flex flex-col gap-2">
          {options.map((option, idx) => {
            const isCorrectOption = looseEquals(option, answer.question.correctAnswer);
            const isGivenOption = looseEquals(option, answer.givenAnswer);

            // Student picked the right one → green
            // The right one, but student didn't pick it → blue
            // Student's (wrong) pick → red
            // Everything else → neutral
            let stateClasses = 'border-border bg-muted/10 text-foreground';
            if (isCorrectOption && isGivenOption) {
              stateClasses = 'border-green-300 bg-green-50 text-green-700';
            } else if (isCorrectOption && !isGivenOption) {
              stateClasses = 'border-blue-300 bg-blue-50 text-blue-700';
            } else if (isGivenOption && !isCorrectOption) {
              stateClasses = 'border-red-300 bg-red-50 text-red-700';
            }

            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${stateClasses}`}
                style={{ fontFamily: font }}
              >
                <span>{option}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isGivenOption && (
                    <span className="text-[10px] sm:text-xs font-bold" style={{ fontFamily: font }}>
                      {t.studentPick}
                    </span>
                  )}
                  {isCorrectOption && !isGivenOption && (
                    <span className="text-[10px] sm:text-xs font-bold" style={{ fontFamily: font }}>
                      {t.correctPick}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback if optionsJson is missing/unparseable — still color-code the two knowns
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p
              className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1"
              style={{ fontFamily: font }}
            >
              {t.studentAnswer}
            </p>
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                answer.isCorrect
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
              style={{ fontFamily: font }}
            >
              {answer.givenAnswer || (
                <span className="italic text-muted-foreground">{t.noAnswer}</span>
              )}
            </div>
          </div>
          {!answer.isCorrect && (
            <div>
              <p
                className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.correctAnswer}
              </p>
              <div
                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700"
                style={{ fontFamily: font }}
              >
                {answer.question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety net: if the stored given/correct answer doesn't literally
          match any parsed option (e.g. a data inconsistency), surface the
          raw values here so they're never silently invisible. */}
      {options.length > 0 && (!givenMatchedAnOption || !correctMatchedAnOption) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          {!givenMatchedAnOption && (
            <div>
              <p
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.rawStudentAnswer}
              </p>
              <div
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                style={{ fontFamily: font }}
              >
                {answer.givenAnswer || (
                  <span className="italic text-muted-foreground">{t.noAnswer}</span>
                )}
              </div>
            </div>
          )}
          {!correctMatchedAnOption && (
            <div>
              <p
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.rawCorrectAnswer}
              </p>
              <div
                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700"
                style={{ fontFamily: font }}
              >
                {answer.question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      <span className="text-xs text-muted-foreground self-end" style={{ fontFamily: font }}>
        {answer.question.mark} {isRtl ? 'درجة' : 'pts'}
      </span>
    </div>
  );
}

// ─── Essay question card — editable if ungraded, else read-only ──
function EssayCard({
  answer,
  lang,
  font,
  attemptId,
  onGraded,
}: {
  answer: Answer;
  lang: 'ar' | 'en';
  font?: string;
  attemptId: string;
  onGraded: (
    answerId: number,
    gradedScore: number,
    isCorrect: boolean,
    graderNotes: string | null
  ) => void;
}) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const [editing, setEditing] = useState(answer.isCorrect === null);
  const [score, setScore] = useState(answer.gradedScore != null ? String(answer.gradedScore) : '');
  const [notes, setNotes] = useState(answer.graderNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const parsed = Number(score);
    if (!score.trim() || !Number.isFinite(parsed) || parsed < 0) {
      toast.error(t.missingScore);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: answer.answerId,
          gradedScore: parsed,
          graderNotes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const safeScore = Math.min(parsed, answer.question.mark);
      const isCorrect = safeScore >= answer.question.mark;
      onGraded(answer.answerId, safeScore, isCorrect, notes.trim() || null);
      setEditing(false);
      toast.success(t.graded);
    } catch {
      toast.error(t.errorLoad);
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
      <div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
          {t.essayBadge}
        </span>
        <p className="text-sm font-semibold text-foreground mt-2" style={{ fontFamily: font }}>
          {answer.question.text}
        </p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold mt-1.5">
          {answer.question.mark} {isRtl ? 'درجة' : 'pts'}
        </span>
        {answer.question.gradingNotes && (
          <div
            className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
            style={{ fontFamily: font }}
          >
            <p className="font-bold mb-0.5" style={{ fontFamily: font }}>
              {t.gradingNotes}
            </p>
            {answer.question.gradingNotes}
          </div>
        )}
      </div>

      <div>
        <p
          className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5"
          style={{ fontFamily: font }}
        >
          {t.studentAnswer}
        </p>
        <div
          className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm text-foreground whitespace-pre-wrap"
          style={{ fontFamily: font }}
        >
          {answer.givenAnswer || <span className="italic text-muted-foreground">{t.noAnswer}</span>}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
              {t.score}
            </label>
            <input
              type="number"
              min={0}
              max={answer.question.mark}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0"
              className="w-20 text-sm text-center px-2 py-1.5 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontFamily: font }}
            />
            <span className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
              {t.scoreOf} {answer.question.mark}
            </span>
          </div>

          <div className="flex-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.graderNotesPlaceholder}
              rows={2}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontFamily: font }}
            />
          </div>

          <div className="flex items-start flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {saving ? t.submitting : t.submitGrade}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold text-foreground tabular-nums"
              style={{ fontFamily: font }}
            >
              {t.score}: {answer.gradedScore ?? '—'} {t.scoreOf} {answer.question.mark}
            </span>
            {answer.graderNotes && (
              <span className="text-xs text-muted-foreground italic" style={{ fontFamily: font }}>
                “{answer.graderNotes}”
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            style={{ fontFamily: font }}
          >
            <Pencil size={12} />
            {t.editGrade}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AttemptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.id as string;
  const { lang, toggleLang } = useLang();
  const t = T[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [data, setData] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAttempt = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/attempts/${attemptId}`);
      if (res.status === 401) {
        router.replace('/sign-up-login-screen');
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    if (attemptId) fetchAttempt();
  }, [attemptId, fetchAttempt]);

  const handleGraded = (
    answerId: number,
    gradedScore: number,
    isCorrect: boolean,
    graderNotes: string | null
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const answers = prev.answers.map((a) =>
        a.answerId === answerId ? { ...a, gradedScore, isCorrect, graderNotes } : a
      );
      const allGraded = answers.every((a) => a.isCorrect !== null);
      let score = prev.attempt.score;
      let passed = prev.attempt.passed;
      if (allGraded) {
        const totalMark = answers.reduce((sum, a) => sum + a.question.mark, 0);
        const earned = answers.reduce(
          (sum, a) =>
            sum +
            (a.question.type === 'essay'
              ? (a.gradedScore ?? 0)
              : a.isCorrect
                ? a.question.mark
                : 0),
          0
        );
        score = totalMark > 0 ? Math.round((earned / totalMark) * 100) : 0;
        passed = score >= prev.exam.passingScore;
      }
      return { ...prev, answers, attempt: { ...prev.attempt, score, passed } };
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => router.push(`/teacher-dashboard/courses/${data.exam.courseId}/exams`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: font }}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
              {t.back}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.loading}
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.errorLoad}
            </p>
            <button
              onClick={fetchAttempt}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
              style={{ fontFamily: font }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="flex flex-col gap-6">
            {/* Summary header */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h1
                className="text-lg font-extrabold text-foreground flex items-center gap-2 mb-3"
                style={{ fontFamily: font }}
              >
                <BookOpen size={18} className="text-primary" />
                {data.exam.lessonTitle}
                <span className="text-sm font-normal text-muted-foreground">
                  — {data.exam.courseName}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User size={14} />
                  <span style={{ fontFamily: font }}>{t.student}:</span>
                  <span className="font-semibold text-foreground" style={{ fontFamily: font }}>
                    {data.student.fullName}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={14} />
                  <span style={{ fontFamily: font }}>{t.submittedAt}:</span>
                  <span dir="ltr">
                    {formatDate(data.attempt.submittedAt, isRtl, t.notSubmitted)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground" style={{ fontFamily: font }}>
                    {t.finalScore}:
                  </span>
                  {data.attempt.score != null ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.attempt.passed
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {data.attempt.score}% — {data.attempt.passed ? t.passed : t.failed}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"
                      style={{ fontFamily: font }}
                    >
                      {t.pendingResult}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Question cards */}
            <div className="flex flex-col gap-4">
              {data.answers.map((answer) =>
                answer.question.type === 'essay' ? (
                  <EssayCard
                    key={answer.answerId}
                    answer={answer}
                    lang={lang}
                    font={font}
                    attemptId={attemptId}
                    onGraded={handleGraded}
                  />
                ) : (
                  <McqCard key={answer.answerId} answer={answer} lang={lang} font={font} />
                )
              )}
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

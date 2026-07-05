'use client';
// src/app/student-dashboard/courses/[id]/lessons/exam/[examId]/page.tsx

import React, { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  FileText,
  AlertCircle,
  Send,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface ExamQuestion {
  examQuestionId: number;
  order: number;
  mark: number;
  questionId: number;
  text: string;
  type: 'mcq' | 'true_false' | 'essay';
  options: string[]; // empty for essay
}

interface ExamMeta {
  examId: number;
  lessonTitle: string;
  durationMinutes: number | null;
  passingScore: number;
  questions: ExamQuestion[];
}

// NEW: 'alreadyPassed' phase for the retake block
type Phase = 'loading' | 'error' | 'alreadyPassed' | 'taking' | 'submitting' | 'result';

interface ResultData {
  attemptId: number;
  hasEssay: boolean;
  autoScore: number | null; // % of auto-graded questions only; null if all essay
  autoTotal: number; // total marks of auto-graded questions
  autoEarned: number; // marks earned from auto-graded questions
  passed: boolean | null; // null when pending essay
  passingScore: number;
}

// NEW: minimal info about the existing passed attempt
interface PassedAttemptInfo {
  id: number;
  score: number | null;
  submittedAt: string | null;
}

// ─── i18n ────────────────────────────────────────────────────────
const T = {
  ar: {
    back: 'العودة للكورس',
    loading: 'جارٍ تحميل الامتحان...',
    errorLoad: 'فشل تحميل الامتحان',
    examTitle: 'امتحان',
    minutes: 'دقيقة',
    timeLeft: 'الوقت المتبقي',
    question: 'سؤال',
    of: 'من',
    mark: 'درجة',
    essayPlaceholder: 'اكتب إجابتك هنا...',
    essayNote: 'سيتم تصحيح هذا السؤال يدويًا من قِبَل المدرس',
    submitExam: 'تسليم الامتحان',
    submitting: 'جارٍ التسليم...',
    confirmSubmit: 'هل أنت متأكد من تسليم الامتحان؟',
    unanswered: 'لم تجب على جميع الأسئلة. هل تريد المتابعة؟',
    resultTitle: 'نتيجة الامتحان',
    passed: 'ناجح ✓',
    failed: 'راسب',
    pending: 'قيد المراجعة',
    pendingMsg:
      'يحتوي امتحانك على أسئلة مقالية تحتاج إلى تصحيح يدوي من المدرس. ستظهر نتيجتك النهائية بعد اكتمال التصحيح.',
    autoScore: 'درجة الأسئلة التلقائية',
    backToCourse: 'العودة للكورس',
    passingScore: 'درجة النجاح',
    noQuestions: 'لا توجد أسئلة في هذا الامتحان',
    timeUp: 'انتهى الوقت! جارٍ تسليم الامتحان...',
    pts: 'درجة',
    alreadyPassedTitle: 'لقد اجتزت هذا الامتحان بالفعل',
    alreadyPassedMsg: 'لا يمكنك إعادة هذا الامتحان بعد اجتيازه بنجاح.',
    yourScore: 'درجتك',
  },
  en: {
    back: 'Back to Course',
    loading: 'Loading exam...',
    errorLoad: 'Failed to load exam',
    examTitle: 'Exam',
    minutes: 'min',
    timeLeft: 'Time left',
    question: 'Question',
    of: 'of',
    mark: 'mark',
    essayPlaceholder: 'Write your answer here...',
    essayNote: 'This question will be graded manually by the teacher',
    submitExam: 'Submit Exam',
    submitting: 'Submitting...',
    confirmSubmit: 'Are you sure you want to submit the exam?',
    unanswered: 'You have unanswered questions. Continue anyway?',
    resultTitle: 'Exam Result',
    passed: 'Passed ✓',
    failed: 'Failed',
    pending: 'Under Review',
    pendingMsg:
      'Your exam contains essay questions that require manual grading by the teacher. Your final result will appear once grading is complete.',
    autoScore: 'Auto-graded score',
    backToCourse: 'Back to Course',
    passingScore: 'Passing score',
    noQuestions: 'This exam has no questions yet',
    timeUp: 'Time is up! Submitting your exam...',
    pts: 'pts',
    alreadyPassedTitle: "You've already passed this exam",
    alreadyPassedMsg: 'You cannot retake an exam you have already passed.',
    yourScore: 'Your score',
  },
} as const;

// ─── Timer component ─────────────────────────────────────────────
function Timer({ seconds, font, label }: { seconds: number; font?: string; label: string }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const isUrgent = seconds <= 60;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm ${isUrgent ? 'border-red-300 bg-red-50 text-red-600 animate-pulse' : 'border-border bg-muted/30 text-foreground'}`}
    >
      <Clock size={14} />
      <span style={{ fontFamily: font }}>{label}:</span>
      <span dir="ltr">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function StudentExamPage({
  params,
}: {
  params: Promise<{ id: string; examId: string }>;
}) {
  const { id, examId } = use(params);
  const courseId = Number(id);
  const lessonIdNum = Number(examId);

  const router = useRouter();
  const { lang, toggleLang } = useLang();
  const t = T[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [phase, setPhase] = useState<Phase>('loading');
  const [exam, setExam] = useState<ExamMeta | null>(null);
  // answers keyed by examQuestionId
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ResultData | null>(null);
  const [passedAttempt, setPassedAttempt] = useState<PassedAttemptInfo | null>(null); // NEW
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitCalledRef = useRef(false);

  // ── Load exam ────────────────────────────────────────────────
  const loadExam = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch(`/api/student/exam/${lessonIdNum}`);
      if (res.status === 401) {
        router.replace('/sign-up-login-screen');
        return;
      }
      // NEW: already passed → show block screen instead of an error
      if (res.status === 409) {
        const data = await res.json().catch(() => null);
        setPassedAttempt(data?.attempt ?? null);
        setPhase('alreadyPassed');
        return;
      }
      if (!res.ok) {
        setPhase('error');
        return;
      }
      const data: ExamMeta = await res.json();
      setExam(data);
      if (data.durationMinutes) setTimeLeft(data.durationMinutes * 60);
      setPhase('taking');
    } catch {
      setPhase('error');
    }
  }, [lessonIdNum, router]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // ── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          if (!submitCalledRef.current) handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (forced = false) => {
    if (submitCalledRef.current) return;
    if (!exam) return;

    if (!forced) {
      const unanswered = exam.questions.some((q) => !answers[q.examQuestionId]?.trim());
      if (unanswered) {
        if (!confirm(t.unanswered)) return;
      } else {
        if (!confirm(t.confirmSubmit)) return;
      }
    }

    submitCalledRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('submitting');

    try {
      const payload = exam.questions.map((q) => ({
        examQuestionId: q.examQuestionId,
        givenAnswer: answers[q.examQuestionId]?.trim() ?? '',
      }));

      const res = await fetch(`/api/student/exam/${lessonIdNum}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });

      // NEW: defensive guard in case of a race condition (e.g. two tabs)
      if (res.status === 409) {
        submitCalledRef.current = false;
        setPhase('alreadyPassed');
        return;
      }

      if (!res.ok) {
        submitCalledRef.current = false;
        setPhase('taking');
        return;
      }

      const data: ResultData = await res.json();
      setResult(data);
      setPhase('result');
    } catch {
      submitCalledRef.current = false;
      setPhase('taking');
    }
  };

  // ── Render: Loading ──────────────────────────────────────────
  if (phase === 'loading')
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
            {t.loading}
          </span>
        </div>
        <Footer lang={lang} />
      </div>
    );

  // ── Render: Already passed (retake blocked) ──────────────────
  // NEW
  if (phase === 'alreadyPassed')
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-sm p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center">
              <Trophy size={40} className="text-green-500" />
            </div>
            <div>
              <h1
                className="text-xl font-extrabold text-foreground mb-1"
                style={{ fontFamily: font }}
              >
                {t.alreadyPassedTitle}
              </h1>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                {t.alreadyPassedMsg}
              </p>
            </div>
            {passedAttempt?.score !== null && passedAttempt?.score !== undefined && (
              <div className="px-5 py-3 rounded-xl bg-green-50 border border-green-200">
                <p
                  className="text-xs text-green-700 font-semibold mb-0.5"
                  style={{ fontFamily: font }}
                >
                  {t.yourScore}
                </p>
                <p className="text-2xl font-extrabold text-green-600">{passedAttempt.score}%</p>
              </div>
            )}
            <button
              onClick={() => router.push(`/student-dashboard/courses/${courseId}/lessons`)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ fontFamily: font }}
            >
              {t.backToCourse}
            </button>
          </div>
        </main>
        <Footer lang={lang} />
      </div>
    );

  // ── Render: Error ────────────────────────────────────────────
  if (phase === 'error' || !exam)
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
            {t.errorLoad}
          </p>
          <button
            onClick={() => router.push(`/student-dashboard/courses/${courseId}/lessons`)}
            className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
            style={{ fontFamily: font }}
          >
            {t.back}
          </button>
        </div>
        <Footer lang={lang} />
      </div>
    );

  // ── Render: Result ───────────────────────────────────────────
  if (phase === 'result' && result)
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-sm p-8 flex flex-col items-center gap-5">
            <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: font }}>
              {t.resultTitle}
            </h1>

            {/* CHANGED: essay exams show ONLY the pending message — no score, no pass/fail */}
            {result.hasEssay ? (
              <div className="w-full flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <FileText size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800" style={{ fontFamily: font }}>
                    {t.pending}
                  </p>
                  <p
                    className="text-xs text-amber-700 mt-0.5 leading-relaxed"
                    style={{ fontFamily: font }}
                  >
                    {t.pendingMsg}
                  </p>
                </div>
              </div>
            ) : (
              result.autoTotal > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 ${
                      result.passed === true
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50'
                    }`}
                  >
                    {result.passed === true ? (
                      <Trophy size={32} className="text-green-500 mb-1" />
                    ) : (
                      <XCircle size={32} className="text-red-400 mb-1" />
                    )}
                    {result.autoScore !== null && (
                      <span
                        className={`text-lg font-extrabold ${
                          result.passed === true ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {result.autoScore}%
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      result.passed === true ? 'text-green-600' : 'text-red-500'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {result.passed === true ? t.passed : t.failed}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                    {t.passingScore}: {result.passingScore}%
                  </p>
                </div>
              )
            )}

            <button
              onClick={() => router.push(`/student-dashboard/courses/${courseId}/lessons`)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ fontFamily: font }}
            >
              {t.backToCourse}
            </button>
          </div>
        </main>
        <Footer lang={lang} />
      </div>
    );

  // ── Render: Taking / Submitting ──────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/student-dashboard/courses/${courseId}/lessons`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: font }}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
              {t.back}
            </button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-extrabold text-foreground" style={{ fontFamily: font }}>
              {exam.lessonTitle}
            </h1>
          </div>
          {timeLeft !== null && <Timer seconds={timeLeft} font={font} label={t.timeLeft} />}
        </div>

        {/* Questions */}
        {exam.questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <AlertCircle size={40} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.noQuestions}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {exam.questions.map((q, idx) => (
              <div
                key={q.examQuestionId}
                className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4"
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground mt-0.5 flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <p
                      className="text-sm font-semibold text-foreground leading-relaxed"
                      style={{ fontFamily: font }}
                    >
                      {q.text}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold flex-shrink-0">
                    {q.mark} {t.pts}
                  </span>
                </div>

                {/* MCQ */}
                {q.type === 'mcq' && (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.examQuestionId] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.examQuestionId]: opt }))
                          }
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-start transition-all ${
                            selected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/40 hover:bg-muted/20 text-foreground'
                          }`}
                          style={{ fontFamily: font }}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                            }`}
                          >
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True / False */}
                {q.type === 'true_false' && (
                  <div className="flex gap-3">
                    {q.options.map((opt) => {
                      const selected = answers[q.examQuestionId] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.examQuestionId]: opt }))
                          }
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                            selected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/40 text-foreground'
                          }`}
                          style={{ fontFamily: font }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay */}
                {q.type === 'essay' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                      <FileText size={13} className="flex-shrink-0" />
                      <span style={{ fontFamily: font }}>{t.essayNote}</span>
                    </div>
                    <textarea
                      value={answers[q.examQuestionId] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.examQuestionId]: e.target.value }))
                      }
                      placeholder={t.essayPlaceholder}
                      rows={5}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                      style={{ fontFamily: font }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit button */}
        {exam.questions.length > 0 && (
          <div className="flex justify-end pb-8">
            <button
              onClick={() => handleSubmit(false)}
              disabled={phase === 'submitting'}
              className="flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {phase === 'submitting' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {phase === 'submitting' ? t.submitting : t.submitExam}
            </button>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

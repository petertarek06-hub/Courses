'use client';
// src/app/instructor-dashboard/grade/page.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  Loader2,
  FileText,
  CheckCircle,
  ArrowRight,
  BookOpen,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
interface PendingAnswer {
  answerId: number;
  attemptId: number;
  givenAnswer: string;
  graderNotes: string | null;
  question: {
    id: number;
    text: string;
    gradingNotes: string;
    mark: number;
  };
  student: {
    id: number;
    fullName: string;
    phone: string;
  };
  exam: {
    lessonId: number;
    lessonTitle: string;
    courseId: number;
    courseName: string;
  };
  submittedAt: string | null;
}

// ─── i18n ────────────────────────────────────────────────────────
const T = {
  ar: {
    pageTitle: 'تصحيح الأسئلة المقالية',
    back: 'العودة للوحة المدرس',
    loading: 'جارٍ التحميل...',
    errorLoad: 'فشل تحميل الأسئلة',
    noPending: 'لا توجد أسئلة مقالية بانتظار التصحيح',
    noPendingHint: 'ستظهر هنا إجابات الطلاب على الأسئلة المقالية بعد تسليم الامتحان',
    student: 'الطالب',
    course: 'الكورس',
    exam: 'الامتحان',
    question: 'السؤال',
    gradingNotes: 'تعليمات التصحيح',
    studentAnswer: 'إجابة الطالب',
    score: 'الدرجة',
    scoreOf: 'من',
    graderNotes: 'ملاحظات للطالب (اختياري)',
    graderNotesPlaceholder: 'مثال: إجابة جيدة لكن يجب ذكر المزيد من التفاصيل...',
    submitGrade: 'حفظ الدرجة',
    submitting: 'جارٍ الحفظ...',
    graded: 'تم التصحيح',
    missingScore: 'يرجى إدخال درجة صحيحة',
    submittedAt: 'تاريخ التسليم',
    filterByCourse: 'تصفية حسب الكورس',
    allCourses: 'جميع الكورسات',
    pendingCount: 'إجابة بانتظار التصحيح',
    showNotes: 'عرض تعليمات التصحيح',
    hideNotes: 'إخفاء التعليمات',
  },
  en: {
    pageTitle: 'Grade Essay Questions',
    back: 'Back to Dashboard',
    loading: 'Loading...',
    errorLoad: 'Failed to load answers',
    noPending: 'No essay answers pending grading',
    noPendingHint:
      'Student answers will appear here after they submit an exam containing essay questions',
    student: 'Student',
    course: 'Course',
    exam: 'Exam',
    question: 'Question',
    gradingNotes: 'Grading notes',
    studentAnswer: 'Student answer',
    score: 'Score',
    scoreOf: 'out of',
    graderNotes: 'Feedback for student (optional)',
    graderNotesPlaceholder: 'e.g. Good answer but more detail is needed...',
    submitGrade: 'Save grade',
    submitting: 'Saving...',
    graded: 'Graded',
    missingScore: 'Please enter a valid score',
    submittedAt: 'Submitted',
    filterByCourse: 'Filter by course',
    allCourses: 'All courses',
    pendingCount: 'answer(s) pending grading',
    showNotes: 'Show grading notes',
    hideNotes: 'Hide notes',
  },
} as const;

function formatDate(iso: string | null, isRtl: boolean) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Single answer card ──────────────────────────────────────────
function AnswerCard({
  answer,
  lang,
  font,
  onGraded,
}: {
  answer: PendingAnswer;
  lang: 'ar' | 'en';
  font?: string;
  onGraded: (answerId: number) => void;
}) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showGradingNotes, setShowGradingNotes] = useState(false);

  const handleSubmit = async () => {
    const parsed = Number(score);
    if (!score.trim() || !Number.isFinite(parsed) || parsed < 0) {
      toast.error(t.missingScore);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/instructor/grade', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: answer.answerId,
          gradedScore: parsed,
          graderNotes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      onGraded(answer.answerId);
      toast.success(t.graded);
    } catch {
      toast.error(t.errorLoad);
    }
    setSaving(false);
  };

  if (done) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            <span style={{ fontFamily: font }}>{answer.exam.courseName}</span>
          </span>
          <span className="text-border">·</span>
          <span style={{ fontFamily: font }}>{answer.exam.lessonTitle}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <User size={12} />
            <span style={{ fontFamily: font }}>{answer.student.fullName}</span>
          </span>
        </div>
        <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
          {t.submittedAt}: {formatDate(answer.submittedAt, isRtl)}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Question text */}
        <div>
          <p
            className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5"
            style={{ fontFamily: font }}
          >
            {t.question}
          </p>
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
            {answer.question.text}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
              {answer.question.mark} {isRtl ? 'درجة' : 'pts'}
            </span>
            {answer.question.gradingNotes && (
              <button
                onClick={() => setShowGradingNotes((v) => !v)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
                style={{ fontFamily: font }}
              >
                {showGradingNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showGradingNotes ? t.hideNotes : t.showNotes}
              </button>
            )}
          </div>
          {showGradingNotes && answer.question.gradingNotes && (
            <div
              className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
              style={{ fontFamily: font }}
            >
              {answer.question.gradingNotes}
            </div>
          )}
        </div>

        {/* Student answer */}
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
            {answer.givenAnswer || (
              <span className="italic text-muted-foreground">
                {isRtl ? 'لم يكتب الطالب إجابة' : 'No answer written'}
              </span>
            )}
          </div>
        </div>

        {/* Grading row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-border">
          {/* Score input */}
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

          {/* Feedback textarea */}
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

          {/* Save button */}
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
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function GradingPage() {
  const router = useRouter();
  const { lang, toggleLang } = useLang();
  const t = T[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [pending, setPending] = useState<PendingAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [courseFilter, setCourseFilter] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/instructor/grade');
      if (res.status === 401) {
        router.replace('/sign-up-login-screen');
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleGraded = (answerId: number) => {
    setPending((prev) => prev.filter((a) => a.answerId !== answerId));
  };

  // Build unique course list for filter
  const courses = Array.from(
    new Map(pending.map((a) => [a.exam.courseId, a.exam.courseName])).entries()
  );

  const filtered = courseFilter
    ? pending.filter((a) => String(a.exam.courseId) === courseFilter)
    : pending;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/instructor-dashboard" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/instructor-dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: font }}
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {t.back}
          </button>
          <span className="text-muted-foreground">/</span>
          <h1
            className="text-xl font-extrabold text-foreground flex items-center gap-2"
            style={{ fontFamily: font }}
          >
            <FileText size={20} className="text-amber-500" />
            {t.pageTitle}
          </h1>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.loading}
            </span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.errorLoad}
            </p>
            <button
              onClick={fetchPending}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
              style={{ fontFamily: font }}
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CheckCircle size={48} className="text-green-400" />
            <p className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
              {t.noPending}
            </p>
            <p
              className="text-sm text-muted-foreground text-center max-w-sm"
              style={{ fontFamily: font }}
            >
              {t.noPendingHint}
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && pending.length > 0 && (
          <div className="flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                <span className="font-bold text-foreground">{filtered.length}</span>{' '}
                {t.pendingCount}
              </p>
              {courses.length > 1 && (
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontFamily: font }}
                >
                  <option value="">{t.allCourses}</option>
                  {courses.map(([id, name]) => (
                    <option key={id} value={String(id)}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Answer cards */}
            {filtered.map((answer) => (
              <AnswerCard
                key={answer.answerId}
                answer={answer}
                lang={lang}
                font={font}
                onGraded={handleGraded}
              />
            ))}

            {filtered.length === 0 && courseFilter && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <CheckCircle size={32} className="text-green-400" />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                  {isRtl
                    ? 'لا توجد إجابات معلقة في هذا الكورس'
                    : 'No pending answers in this course'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

//src\app\teacher-dashboard\courses\[id]\exams\page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  Loader2,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

interface ExamRow {
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
  status: 'not_attempted' | 'in_progress' | 'pending_grading' | 'graded';
}

interface ExamsData {
  course: { id: number; name: string };
  grading: ExamRow[];
  remaining: ExamRow[];
}

const T = {
  ar: {
    back: 'العودة للوحة المدرس',
    pageTitle: 'امتحانات الكورس',
    loading: 'جارٍ التحميل...',
    errorLoad: 'فشل تحميل بيانات الامتحانات',
    retry: 'إعادة المحاولة',
    gradingSection: 'امتحانات بحاجة إلى تصحيح',
    remainingSection: 'باقي الامتحانات',
    noGrading: 'لا توجد امتحانات بحاجة إلى تصحيح حاليًا',
    noRemaining: 'لا توجد امتحانات أخرى',
    colExam: 'اسم الامتحان',
    colStudent: 'الطالب',
    colScheduled: 'الموعد المحدد',
    colQuestions: 'عدد الأسئلة',
    colEssay: 'أسئلة مقالية',
    colStatus: 'الحالة',
    immediate: 'متاح فورًا',
    notAttempted: 'لم يُحاول بعد',
    inProgress: 'قيد الحل',
    graded: 'تم التصحيح',
    pendingGrading: 'بانتظار التصحيح',
    score: 'الدرجة',
    passed: 'ناجح',
    failed: 'راسب',
  },
  en: {
    back: 'Back to Dashboard',
    pageTitle: 'Course Exams',
    loading: 'Loading...',
    errorLoad: 'Failed to load exam data',
    retry: 'Retry',
    gradingSection: 'Exams Requiring Grading',
    remainingSection: 'Remaining Exams',
    noGrading: 'No exams currently need grading',
    noRemaining: 'No other exams',
    colExam: 'Exam Name',
    colStudent: 'Student',
    colScheduled: 'Scheduled Date',
    colQuestions: 'Questions',
    colEssay: 'Essay Questions',
    colStatus: 'Status',
    immediate: 'Available immediately',
    notAttempted: 'Not attempted yet',
    inProgress: 'In progress',
    graded: 'Graded',
    pendingGrading: 'Pending grading',
    score: 'Score',
    passed: 'Passed',
    failed: 'Failed',
  },
} as const;

function formatDate(iso: string | null, isRtl: boolean, immediateLabel: string) {
  if (!iso) return immediateLabel;
  return new Date(iso).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ row, lang }: { row: ExamRow; lang: 'ar' | 'en' }) {
  const t = T[lang];
  const font = lang === 'ar' ? 'var(--font-cairo)' : undefined;

  if (row.status === 'not_attempted') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-muted text-muted-foreground"
        style={{ fontFamily: font }}
      >
        {t.notAttempted}
      </span>
    );
  }
  if (row.status === 'in_progress') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700"
        style={{ fontFamily: font }}
      >
        <Clock size={11} />
        {t.inProgress}
      </span>
    );
  }
  if (row.status === 'pending_grading') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700"
        style={{ fontFamily: font }}
      >
        <FileText size={11} />
        {t.pendingGrading}
      </span>
    );
  }
  // graded
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
        row.passed ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
      }`}
      style={{ fontFamily: font }}
    >
      <CheckCircle size={11} />
      {row.score != null ? `${row.score}%` : t.graded}
    </span>
  );
}

function ExamTable({
  rows,
  lang,
  isRtl,
  font,
  emptyLabel,
}: {
  rows: ExamRow[];
  lang: 'ar' | 'en';
  isRtl: boolean;
  font?: string;
  emptyLabel: string;
}) {
  const t = T[lang];
  const router = useRouter();

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  const columns = [
    t.colExam,
    t.colStudent,
    t.colScheduled,
    t.colQuestions,
    t.colEssay,
    t.colStatus,
  ];

  return (
    <div className="bg-card rounded-2xl border border-border card-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead className="bg-muted">
            <tr>
              {columns.map((col, i, arr) => (
                <th
                  key={col}
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-center border-b border-border text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                    i < arr.length - 1 ? getBorderDirection() : ''
                  }`}
                  style={{ fontFamily: font }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 sm:py-10 text-center text-muted-foreground"
                  style={{ fontFamily: font }}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const clickable = row.attemptId != null;
                return (
                  <tr
                    key={`${row.examId}-${row.attemptId ?? 'none'}-${i}`}
                    onClick={() =>
                      clickable && router.push(`/teacher-dashboard/attempts/${row.attemptId}`)
                    }
                    className={`odd:bg-background even:bg-muted/10 transition-colors ${
                      clickable ? 'hover:bg-muted/30 cursor-pointer' : 'hover:bg-muted/20'
                    }`}
                  >
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      {row.examName}
                    </td>
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      {row.studentName ?? '—'}
                    </td>
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap`}
                      dir="ltr"
                    >
                      {formatDate(row.scheduledAt, isRtl, t.immediate)}
                    </td>
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground tabular-nums`}
                    >
                      {row.totalQuestions}
                    </td>
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground tabular-nums`}
                    >
                      {row.essayQuestions}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border">
                      <StatusBadge row={row} lang={lang} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CourseExamsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { lang, toggleLang } = useLang();
  const t = T[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [data, setData] = useState<ExamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}/exams`);
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
  }, [courseId, router]);

  useEffect(() => {
    if (courseId) fetchExams();
  }, [courseId, fetchExams]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push('/teacher-dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: font }}
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {t.back}
          </button>
          <span className="text-muted-foreground">/</span>
          <h1
            className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2"
            style={{ fontFamily: font }}
          >
            <ClipboardList size={20} className="text-primary" />
            {data ? `${t.pageTitle} — ${data.course.name}` : t.pageTitle}
          </h1>
        </div>

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
              onClick={fetchExams}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
              style={{ fontFamily: font }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Requiring grading */}
            <section>
              <h2
                className="text-sm sm:text-base font-bold text-foreground mb-3 flex items-center gap-2"
                style={{ fontFamily: font }}
              >
                <FileText size={16} className="text-amber-500" />
                {t.gradingSection}
                {data.grading.length > 0 && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                    {data.grading.length}
                  </span>
                )}
              </h2>
              <ExamTable
                rows={data.grading}
                lang={lang}
                isRtl={isRtl}
                font={font}
                emptyLabel={t.noGrading}
              />
            </section>

            {/* Remaining */}
            <section>
              <h2
                className="text-sm sm:text-base font-bold text-foreground mb-3 flex items-center gap-2"
                style={{ fontFamily: font }}
              >
                <ClipboardList size={16} className="text-primary" />
                {t.remainingSection}
              </h2>
              <ExamTable
                rows={data.remaining}
                lang={lang}
                isRtl={isRtl}
                font={font}
                emptyLabel={t.noRemaining}
              />
            </section>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

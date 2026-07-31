//src\components\course-exams\CourseExamsView.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardList, ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { T, type Lang } from './translations';
import type { ExamsData } from './types';
import ExamTable from './ExamTable';

export default function CourseExamsView({
  courseId,
  lang,
  font,
  backLabel,
  onBack,
  attemptHref,
}: {
  courseId: string;
  lang: Lang;
  font?: string;
  backLabel: string;
  onBack: () => void;
  /** Resolves the destination for a clickable row's attempt. */
  attemptHref: (attemptId: number) => string;
}) {
  const router = useRouter();
  const t = T[lang];
  const isRtl = lang === 'ar';

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
    <>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: font }}
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
          {backLabel}
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
              attemptHref={attemptHref}
            />
          </section>

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
              attemptHref={attemptHref}
            />
          </section>
        </div>
      )}
    </>
  );
}

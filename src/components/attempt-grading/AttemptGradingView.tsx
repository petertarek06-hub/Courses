'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle, Clock, User, BookOpen } from 'lucide-react';
import { T, type Lang } from './translations';
import { formatDate } from './helpers';
import type { AttemptDetail } from './types';
import McqCard from './McqCard';
import EssayCard from './EssayCard';

export default function AttemptGradingView({
  attemptId,
  lang,
  font,
  backLabel,
  getBackHref,
}: {
  attemptId: string;
  lang: Lang;
  font?: string;
  backLabel: string;
  /** Resolves the back-button destination once the exam's courseId is known. */
  getBackHref: (courseId: number) => string;
}) {
  const router = useRouter();
  const t = T[lang];
  const isRtl = lang === 'ar';

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
    <>
      {data && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push(getBackHref(data.exam.courseId))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: font }}
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {backLabel}
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
                <span dir="ltr">{formatDate(data.attempt.submittedAt, isRtl, t.notSubmitted)}</span>
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
    </>
  );
}

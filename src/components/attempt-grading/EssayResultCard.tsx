'use client';
import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { T, type Lang } from './translations';
import type { Answer } from './types';

// Read-only display of a graded (or still-pending) essay answer.
// No score input, no PATCH call — students/guardians can view but not grade.
export default function EssayResultCard({
  answer,
  lang,
  font,
}: {
  answer: Answer;
  lang: Lang;
  font?: string;
}) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const pending = answer.isCorrect === null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
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
        </div>
        {pending ? (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex-shrink-0"
            style={{ fontFamily: font }}
          >
            <Clock size={11} />
            {t.pendingResult}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
              answer.isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
            }`}
            style={{ fontFamily: font }}
          >
            {answer.isCorrect ? <CheckCircle size={11} /> : <XCircle size={11} />}
            {answer.isCorrect ? t.correct : t.incorrect}
          </span>
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

      {!pending && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap">
          <span
            className="text-sm font-bold text-foreground tabular-nums"
            style={{ fontFamily: font }}
          >
            {t.score}: {answer.gradedScore ?? '—'} {t.scoreOf} {answer.question.mark}
          </span>
          {answer.graderNotes && (
            <span className="text-xs text-muted-foreground italic" style={{ fontFamily: font }}>
              &ldquo;{answer.graderNotes}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
}

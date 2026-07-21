'use client';
import React from 'react';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import { T, type Lang } from './translations';
import type { ExamRow } from './types';

export default function StatusBadge({ row, lang }: { row: ExamRow; lang: Lang }) {
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

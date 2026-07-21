'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { T, type Lang } from './translations';
import { formatDate } from '@/components/attempt-grading/helpers';
import type { ExamRow } from './types';
import StatusBadge from './StatusBadge';

export default function ExamTable({
  rows,
  lang,
  isRtl,
  font,
  emptyLabel,
  attemptHref,
}: {
  rows: ExamRow[];
  lang: Lang;
  isRtl: boolean;
  font?: string;
  emptyLabel: string;
  /** Resolves the destination for a clickable row's attempt. */
  attemptHref: (attemptId: number) => string;
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
                    onClick={() => clickable && router.push(attemptHref(row.attemptId as number))}
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

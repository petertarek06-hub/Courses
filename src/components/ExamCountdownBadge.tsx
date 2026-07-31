// src/components/ExamCountdownBadge.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getTimeRemaining } from '@/lib/examSchedule';

interface Props {
  scheduledAt: Date | string;
  lang: 'ar' | 'en';
  font?: string;
  label: string;
}

// Amber/warning styling matches sonner's richColors "warning" toast, so a
// countdown reads as "the same kind of heads-up" as the login notifications
// — same color, same weight — instead of introducing a new visual meaning.
export default function ExamCountdownBadge({ scheduledAt, lang, font, label }: Props) {
  const isRtl = lang === 'ar';
  const [remaining, setRemaining] = useState(() => getTimeRemaining(scheduledAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getTimeRemaining(scheduledAt)), 30_000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  const countdownText = isRtl
    ? `متبقٍ ${remaining.hours} س ${remaining.minutes} د`
    : `${remaining.hours}h ${remaining.minutes}m remaining`;

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5"
      style={{ fontFamily: font }}
    >
      <Clock size={12} />
      {label}{' '}
      <span dir="ltr">
        {new Date(scheduledAt).toLocaleString(isRtl ? 'ar-EG' : 'en-EG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </span>
      {remaining.isUnderOneDay && (
        <span className="ms-1 font-bold" dir={isRtl ? 'rtl' : 'ltr'}>
          · {countdownText}
        </span>
      )}
    </div>
  );
}

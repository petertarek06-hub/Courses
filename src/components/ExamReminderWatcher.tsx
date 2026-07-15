'use client';
// src/components/ExamReminderWatcher.tsx
//
// Mounted once in the root layout (alongside <Toaster />) so it runs on
// EVERY page, not just the student dashboard. While the logged-in user is
// a student with a scheduled exam under 24h away, it keeps a persistent
// (non-auto-dismissing) toast visible with the current countdown — the
// same visual language as the "Account created" style toasts, but fixed
// in place instead of disappearing after a few seconds.
import { useEffect, useRef } from 'react';
import { getTimeRemaining } from '@/lib/examSchedule';
import { notifyPersistentWarning, dismissNotification } from '@/lib/notify';
import { useLang } from '@/lib/uselang';

const TOAST_ID = 'exam-reminder';
const POLL_MS = 30_000;

interface UpcomingExam {
  courseId: number;
  courseName: string;
  scheduledAt: string;
}

export default function ExamReminderWatcher() {
  const { lang } = useLang();
  // Read via ref inside the interval closure so we always use the latest
  // language without having to tear down/recreate the interval on toggle.
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function isLoggedInStudent(): Promise<boolean> {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return false;
        const data = await res.json();
        return data?.user?.role === 'student';
      } catch {
        return false;
      }
    }

    async function checkExam() {
      try {
        const res = await fetch('/api/student/upcoming-exam');
        if (!res.ok) {
          dismissNotification(TOAST_ID);
          return;
        }
        const data: { exam: UpcomingExam | null } = await res.json();
        if (!data.exam) {
          dismissNotification(TOAST_ID);
          return;
        }

        const { isUnderOneDay, totalMs, hours, minutes } = getTimeRemaining(data.exam.scheduledAt);
        if (!isUnderOneDay || totalMs <= 0) {
          dismissNotification(TOAST_ID);
          return;
        }

        const isRtl = langRef.current === 'ar';
        const message = isRtl
          ? `تنبيه: امتحان "${data.exam.courseName}" خلال ${hours} س ${minutes} د`
          : `Reminder: exam for "${data.exam.courseName}" is in ${hours}h ${minutes}m`;

        // Same id every call → sonner updates the existing toast's text
        // in place rather than closing and reopening it.
        notifyPersistentWarning(message, TOAST_ID);
      } catch {
        // Transient network failure — leave any existing toast alone
        // rather than flashing it away.
      }
    }

    (async () => {
      const isStudent = await isLoggedInStudent();
      if (cancelled || !isStudent) return;

      await checkExam();
      intervalId = setInterval(checkExam, POLL_MS);
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      dismissNotification(TOAST_ID);
    };
  }, []);

  return null;
}

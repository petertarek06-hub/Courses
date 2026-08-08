'use client';
// src/app/student-dashboard/attempts/[id]/page.tsx
import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import AttemptReviewView from '@/components/attempt-grading/AttemptReviewView';

export default function StudentAttemptReviewPage() {
  const params = useParams();
  const attemptId = params?.id as string;
  const { lang, toggleLang } = useLang();
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <AttemptReviewView
          attemptId={attemptId}
          fetchUrl={`/api/student/attempts/${attemptId}`}
          lang={lang}
          font={font}
          backLabel={isRtl ? 'العودة للوحة الطالب' : 'Back to Dashboard'}
          backHref="/student-dashboard"
        />
      </main>
      <Footer lang={lang} />
    </div>
  );
}

'use client';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import AttemptGradingView from '@/components/attempt-grading/AttemptGradingView';

export default function AttemptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.id as string;
  const { lang, toggleLang } = useLang();
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AttemptGradingView
          attemptId={attemptId}
          lang={lang}
          font={font}
          backLabel={isRtl ? 'العودة لامتحانات الكورس' : 'Back to Course Exams'}
          getBackHref={(courseId) => `/teacher-dashboard/courses/${courseId}/exams`}
        />
      </main>

      <Footer lang={lang} />
    </div>
  );
}

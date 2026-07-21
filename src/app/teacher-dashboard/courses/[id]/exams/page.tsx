'use client';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import CourseExamsView from '@/components/course-exams/CourseExamsView';

export default function CourseExamsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <CourseExamsView
          courseId={courseId}
          lang={lang}
          font={font}
          backLabel={isRtl ? 'العودة للوحة المدرس' : 'Back to Dashboard'}
          onBack={() => router.push('/teacher-dashboard')}
          attemptHref={(attemptId) => `/teacher-dashboard/attempts/${attemptId}`}
        />
      </main>

      <Footer lang={lang} />
    </div>
  );
}

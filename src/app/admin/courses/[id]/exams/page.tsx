'use client';
import { useParams, useRouter } from 'next/navigation';
import { useAdminLang } from '../../../Adminshell';
import CourseExamsView from '@/components/course-exams/CourseExamsView';

export default function AdminCourseExamsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { lang, isRtl } = useAdminLang();
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  return (
    <CourseExamsView
      courseId={courseId}
      lang={lang}
      font={font}
      backLabel={isRtl ? 'العودة للكورسات' : 'Back to Courses'}
      onBack={() => router.push('/admin/courses')}
      attemptHref={(attemptId) => `/admin/attempts/${attemptId}`}
    />
  );
}

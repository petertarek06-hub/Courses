//src\app\admin\attempts\[id]\page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useAdminLang } from '../../Adminshell';
import AttemptGradingView from '@/components/attempt-grading/AttemptGradingView';

export default function AdminAttemptDetailPage() {
  const params = useParams();
  const attemptId = params?.id as string;
  const { lang, isRtl } = useAdminLang();
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  return (
    <AttemptGradingView
      attemptId={attemptId}
      lang={lang}
      font={font}
      backLabel={isRtl ? 'العودة لامتحانات الكورس' : 'Back to Course Exams'}
      getBackHref={(courseId) => `/admin/courses/${courseId}/exams`}
    />
  );
}

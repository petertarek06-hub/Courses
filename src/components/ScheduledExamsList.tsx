// src/components/ScheduledExamsList.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { useLang } from '@/lib/uselang';

interface ScheduledExam {
  id: number;
  title: string;
  durationMinutes: number | null;
  passingScore: number;
  scheduledAt: string;
  course: {
    id: number;
    name: string;
    subject: string;
    academicYear: string;
  };
  attempts: Array<{
    id: number;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
  }>;
}

interface ScheduledExamsListProps {
  courseId?: string;
}

const content = {
  ar: {
    title: 'الامتحانات المجدولة',
    noExams: 'لا توجد امتحانات مجدولة',
    examTitle: 'عنوان الامتحان',
    course: 'الكورس',
    scheduledDate: 'الموعد',
    duration: 'المدة',
    status: 'الحالة',
    notStarted: 'لم يبدأ',
    inProgress: 'قيد التنفيذ',
    completed: 'مكتمل',
    passed: 'ناجح',
    failed: 'راسب',
    pendingGrading: 'بانتظار التصحيح',
    takeExam: 'بدء الامتحان',
    viewResults: 'عرض النتائج',
    minutes: 'دقيقة',
    availableNow: 'متاح الآن',
    availableAt: 'متاح في',
  },
  en: {
    title: 'Scheduled Exams',
    noExams: 'No scheduled exams',
    examTitle: 'Exam Title',
    course: 'Course',
    scheduledDate: 'Scheduled Date',
    duration: 'Duration',
    status: 'Status',
    notStarted: 'Not Started',
    inProgress: 'In Progress',
    completed: 'Completed',
    passed: 'Passed',
    failed: 'Failed',
    pendingGrading: 'Pending Grading',
    takeExam: 'Start Exam',
    viewResults: 'View Results',
    minutes: 'minutes',
    availableNow: 'Available Now',
    availableAt: 'Available at',
  },
};

export default function ScheduledExamsList({ courseId }: ScheduledExamsListProps) {
  const { lang } = useLang();
  const t = content[lang];
  const router = useRouter();
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [exams, setExams] = useState<ScheduledExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const url = courseId
          ? `/api/student/scheduled-exams?courseId=${courseId}`
          : '/api/student/scheduled-exams';
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setExams(data);
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [courseId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExamStatus = (exam: ScheduledExam) => {
    const now = new Date();
    const scheduledTime = new Date(exam.scheduledAt);
    const latestAttempt = exam.attempts[0];

    if (scheduledTime > now) {
      return { status: 'upcoming', label: t.availableAt + ' ' + formatDate(exam.scheduledAt) };
    }

    if (!latestAttempt) {
      return { status: 'available', label: t.availableNow };
    }

    if (!latestAttempt.submittedAt) {
      return { status: 'in_progress', label: t.inProgress };
    }

    if (latestAttempt.passed === null) {
      return { status: 'pending', label: t.pendingGrading };
    }

    return {
      status: latestAttempt.passed ? 'passed' : 'failed',
      label: latestAttempt.passed ? t.passed : t.failed,
    };
  };

  const handleTakeExam = (examId: number) => {
    router.push(`/student-dashboard/scheduled-exams/${examId}`);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <p className="text-center text-muted-foreground text-sm" style={{ fontFamily: font }}>
          {t.noExams}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: font }}>
        <Calendar size={18} className="text-primary" />
        {t.title}
      </h2>

      <div className="space-y-3">
        {exams.map((exam) => {
          const examStatus = getExamStatus(exam);
          const isAvailable = examStatus.status === 'available';
          const isUpcoming = examStatus.status === 'upcoming';

          return (
            <div
              key={exam.id}
              className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-2" style={{ fontFamily: font }}>
                    {exam.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1" style={{ fontFamily: font }}>
                      {exam.course.name}
                    </span>
                    {exam.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {exam.durationMinutes} {t.minutes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUpcoming && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} />
                        {examStatus.label}
                      </span>
                    )}
                    {isAvailable && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        {examStatus.label}
                      </span>
                    )}
                    {examStatus.status === 'passed' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        {examStatus.label}
                      </span>
                    )}
                    {examStatus.status === 'failed' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold flex items-center gap-1">
                        <XCircle size={12} />
                        {examStatus.label}
                      </span>
                    )}
                    {examStatus.status === 'pending' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center gap-1">
                        <Clock size={12} />
                        {examStatus.label}
                      </span>
                    )}
                  </div>
                </div>

                {isAvailable && (
                  <button
                    onClick={() => handleTakeExam(exam.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ fontFamily: font }}
                  >
                    <Play size={14} />
                    {t.takeExam}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

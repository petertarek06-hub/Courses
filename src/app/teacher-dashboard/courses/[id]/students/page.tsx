'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  ArrowLeft,
  Users,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react';

interface StudentProgress {
  studentId: number;
  studentName: string;
  studentPhone: string;
  studentAvatar: string | null;
  enrolledAt: string;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
  latestExamScore: number | null;
  latestExamPassed: boolean | null;
  latestExamDate: string | null;
}

interface PageData {
  course: { id: number; name: string };
  students: StudentProgress[];
}

type SortField = 'name' | 'enrolled' | 'progress' | 'score';
type SortOrder = 'asc' | 'desc';

const content = {
  ar: {
    title: 'الطلاب',
    backToCourse: 'العودة للكورس',
    noStudents: 'لا يوجد طلاب مسجلون بعد',
    loading: 'جاري التحميل...',
    studentName: 'اسم الطالب',
    enrolledDate: 'تاريخ التسجيل',
    progress: 'التقدم',
    lessonsCompleted: 'دروس',
    latestExam: 'آخر امتحان',
    score: 'الدرجة',
    passed: 'ناجح',
    failed: 'راسب',
    notAttempted: 'لم يحاول',
    percentComplete: 'مكتمل',
    sortBy: 'ترتيب حسب',
  },
  en: {
    title: 'Students',
    backToCourse: 'Back to Course',
    noStudents: 'No students enrolled yet',
    loading: 'Loading...',
    studentName: 'Student Name',
    enrolledDate: 'Enrolled Date',
    progress: 'Progress',
    lessonsCompleted: 'lessons',
    latestExam: 'Latest Exam',
    score: 'Score',
    passed: 'Passed',
    failed: 'Failed',
    notAttempted: 'Not Attempted',
    percentComplete: 'complete',
    sortBy: 'Sort by',
  },
};

function formatDate(dateString: string | null, lang: 'ar' | 'en') {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return lang === 'ar'
    ? date.toLocaleDateString('ar-EG')
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentProgressPage() {
  const { lang, toggleLang } = useLang();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('enrolled');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetch(`/api/teacher/courses/${courseId}/students`)
      .then((r) => {
        if (r.status === 401) {
          router.replace('/sign-up-login-screen');
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, router]);

  const sorted = useMemo(() => {
    if (!data) return [];
    const students = [...data.students];

    students.sort((a, b) => {
      let aVal: any = null;
      let bVal: any = null;

      switch (sortField) {
        case 'name':
          aVal = a.studentName.toLowerCase();
          bVal = b.studentName.toLowerCase();
          break;
        case 'enrolled':
          aVal = new Date(a.enrolledAt).getTime();
          bVal = new Date(b.enrolledAt).getTime();
          break;
        case 'progress':
          aVal = a.progressPercent;
          bVal = b.progressPercent;
          break;
        case 'score':
          aVal = a.latestExamScore ?? -1;
          bVal = b.latestExamScore ?? -1;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return students;
  }, [data, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button & title */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: font }}>
              {t.title}
            </h1>
            {data && (
              <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                {data.course.name}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border card-shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : !data || data.students.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Users size={44} className="text-muted-foreground/30" />
              <p
                className="text-sm font-semibold text-muted-foreground"
                style={{ fontFamily: font }}
              >
                {t.noStudents}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
                          style={{ fontFamily: font }}
                        >
                          {t.studentName}
                          <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          onClick={() => handleSort('enrolled')}
                          className="flex items-center gap-2 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
                          style={{ fontFamily: font }}
                        >
                          {t.enrolledDate}
                          <SortIcon field="enrolled" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSort('progress')}
                          className="flex items-center gap-2 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                          style={{ fontFamily: font }}
                        >
                          {t.progress}
                          <SortIcon field="progress" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSort('score')}
                          className="flex items-center gap-2 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                          style={{ fontFamily: font }}
                        >
                          {t.latestExam}
                          <SortIcon field="score" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((student, idx) => (
                      <tr
                        key={student.studentId}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        {/* Student Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.studentAvatar ? (
                              <img
                                src={student.studentAvatar}
                                alt={student.studentName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {student.studentName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p
                                className="text-sm font-semibold text-foreground"
                                style={{ fontFamily: font }}
                              >
                                {student.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.studentPhone}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Enrolled Date */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground" style={{ fontFamily: font }}>
                            {formatDate(student.enrolledAt, lang)}
                          </p>
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                                style={{ width: `${student.progressPercent}%` }}
                              />
                            </div>
                            <p
                              className="text-xs text-muted-foreground"
                              style={{ fontFamily: font }}
                            >
                              {student.lessonsCompleted}/{student.totalLessons} {t.lessonsCompleted}
                            </p>
                            <p className="text-xs font-semibold text-foreground">
                              {student.progressPercent}%
                            </p>
                          </div>
                        </td>

                        {/* Latest Exam */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-2">
                            {student.latestExamScore !== null ? (
                              <>
                                <span className="text-sm font-bold text-foreground">
                                  {Math.round(student.latestExamScore)}%
                                </span>
                                <div className="flex items-center gap-1">
                                  {student.latestExamPassed ? (
                                    <>
                                      <CheckCircle2 size={14} className="text-green-600" />
                                      <span
                                        className="text-xs text-green-600 font-semibold"
                                        style={{ fontFamily: font }}
                                      >
                                        {t.passed}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={14} className="text-destructive" />
                                      <span
                                        className="text-xs text-destructive font-semibold"
                                        style={{ fontFamily: font }}
                                      >
                                        {t.failed}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(student.latestExamDate, lang)}
                                </p>
                              </>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-xs text-muted-foreground"
                                  style={{ fontFamily: font }}
                                >
                                  {t.notAttempted}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-border">
                {sorted.map((student) => (
                  <div key={student.studentId} className="p-4 space-y-3">
                    {/* Student header */}
                    <div className="flex items-center gap-3">
                      {student.studentAvatar ? (
                        <img
                          src={student.studentAvatar}
                          alt={student.studentName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {student.studentName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: font }}
                        >
                          {student.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.studentPhone}</p>
                      </div>
                    </div>

                    {/* Enrolled date */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground" style={{ fontFamily: font }}>
                        {t.enrolledDate}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatDate(student.enrolledAt, lang)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground" style={{ fontFamily: font }}>
                          {t.progress}
                        </span>
                        <span className="font-semibold text-foreground">
                          {student.lessonsCompleted}/{student.totalLessons}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                          style={{ width: `${student.progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-foreground font-semibold">
                        {student.progressPercent}%
                      </p>
                    </div>

                    {/* Latest exam */}
                    <div className="pt-2 border-t border-border">
                      <p
                        className="text-xs text-muted-foreground mb-2"
                        style={{ fontFamily: font }}
                      >
                        {t.latestExam}
                      </p>
                      {student.latestExamScore !== null ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {Math.round(student.latestExamScore)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(student.latestExamDate, lang)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {student.latestExamPassed ? (
                              <>
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span
                                  className="text-xs text-green-600 font-semibold"
                                  style={{ fontFamily: font }}
                                >
                                  {t.passed}
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} className="text-destructive" />
                                <span
                                  className="text-xs text-destructive font-semibold"
                                  style={{ fontFamily: font }}
                                >
                                  {t.failed}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                          {t.notAttempted}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

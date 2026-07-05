'use client';
// src/app/student-dashboard/courses/[id]/lessons/page.tsx
import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  ArrowRight,
  CheckCircle,
  Circle,
  Loader2,
  PlayCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';

// ── Types ───────────────────────────────────────────────────────
interface VideoRecord {
  id: number;
  vimeoId: string;
  durationSec: number | null;
}

interface ExamAttempt {
  id: number;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

interface ExamRecord {
  id: number;
  durationMinutes: number | null;
  passingScore: number;
  attempts: ExamAttempt[];
}

interface LessonProgress {
  completed: boolean;
  completedAt: string | null;
}

interface Lesson {
  id: number;
  titleAr: string;
  titleEn: string;
  order: number;
  type: 'video' | 'exam';
  video: VideoRecord | null;
  exam: ExamRecord | null;
  progress: LessonProgress[];
}

interface Course {
  id: number;
  nameAr: string;
  nameEn: string;
  subjectAr: string;
  subjectEn: string;
  teacher: { id: number; fullName: string; avatarUrl: string | null };
  lessons: Lesson[];
}

// ── Translations ────────────────────────────────────────────────
const content = {
  ar: {
    back: 'لوحة الطالب',
    loading: 'جارٍ التحميل...',
    errorLoad: 'فشل تحميل الكورس',
    notEnrolled: 'غير مسجّل في هذا الكورس',
    noLessons: 'لا توجد دروس متاحة بعد',
    markComplete: 'تم مشاهدة الدرس',
    completed: 'مكتمل',
    lesson: 'الدرس',
    sidebarTitle: 'محتوى الكورس',
    lessons: 'درس',
    teacher: 'المدرس',
    selectLesson: 'اختر درسًا لتبدأ المشاهدة',
    examLesson: 'امتحان',
    videoLesson: 'فيديو',
    examDuration: 'المدة',
    examPassing: 'درجة النجاح',
    examMinutes: 'دقيقة',
    examScore: 'درجتك',
    examPassed: 'ناجح ✓',
    examFailed: 'راسب',
    examNotTaken: 'لم تؤدِّ الامتحان بعد',
    examTake: 'ابدأ الامتحان',
    examRetake: 'إعادة الامتحان',
    examPending: 'جارٍ التقييم',
  },
  en: {
    back: 'Student Dashboard',
    loading: 'Loading...',
    errorLoad: 'Failed to load course',
    notEnrolled: 'You are not enrolled in this course',
    noLessons: 'No lessons available yet',
    markComplete: 'Mark as watched',
    completed: 'Completed',
    lesson: 'Lesson',
    sidebarTitle: 'Course Content',
    lessons: 'lessons',
    teacher: 'Teacher',
    selectLesson: 'Select a lesson to start watching',
    examLesson: 'Exam',
    videoLesson: 'Video',
    examDuration: 'Duration',
    examPassing: 'Passing score',
    examMinutes: 'min',
    examScore: 'Your score',
    examPassed: 'Passed ✓',
    examFailed: 'Failed',
    examNotTaken: "You haven't taken this exam yet",
    examTake: 'Start Exam',
    examRetake: 'Retake Exam',
    examPending: 'Awaiting review',
  },
};

// ── Helpers ─────────────────────────────────────────────────────
function formatDuration(sec: number | null) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

// ── Sidebar lesson row ──────────────────────────────────────────
function LessonRow({
  lesson,
  isActive,
  isRtl,
  font,
  onClick,
}: {
  lesson: Lesson;
  isActive: boolean;
  isRtl: boolean;
  font: string | undefined;
  onClick: () => void;
}) {
  const done = lesson.progress[0]?.completed ?? false;
  const isExam = lesson.type === 'exam';
  const attempt = lesson.exam?.attempts[0];
  const examPassed = attempt?.passed === true;
  const examFailed = attempt?.passed === false;

  return (
    <button
      onClick={onClick}
      className={`w-full text-start flex items-start gap-3 px-4 py-3 border-b border-border transition-colors ${
        isActive ? 'bg-primary/8 border-s-2 border-s-primary' : 'hover:bg-muted/30'
      }`}
    >
      {/* Status icon */}
      <span className="mt-0.5 flex-shrink-0">
        {isExam ? (
          examPassed ? (
            <Trophy size={16} className="text-green-500" />
          ) : examFailed ? (
            <XCircle size={16} className="text-red-400" />
          ) : (
            <ClipboardList size={16} className="text-accent" />
          )
        ) : done ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <Circle size={16} className="text-muted-foreground" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}
          style={{ fontFamily: font }}
        >
          {isRtl ? lesson.titleAr : lesson.titleEn}
        </p>
        {/* Sub-label */}
        {isExam ? (
          <p className="text-xs text-accent mt-0.5" style={{ fontFamily: font }}>
            {isRtl ? '📝 امتحان' : '📝 Exam'}
          </p>
        ) : lesson.video?.durationSec ? (
          <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
            {formatDuration(lesson.video.durationSec)}
          </p>
        ) : null}
      </div>
    </button>
  );
}

// ── Exam panel ──────────────────────────────────────────────────
function ExamPanel({
  lesson,
  lang,
  font,
  courseId,
}: {
  lesson: Lesson;
  lang: 'ar' | 'en';
  font: string | undefined;
  courseId: number;
}) {
  const t = content[lang];
  const isRtl = lang === 'ar';
  const exam = lesson.exam!;
  const attempt = exam.attempts[0];
  const hasAttempt = !!attempt?.submittedAt;
  const isPassed = attempt?.passed === true;
  const isFailed = attempt?.passed === false;
  const isPending = attempt && !attempt.submittedAt;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
      {/* Exam icon */}
      <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
        <ClipboardList size={40} className="text-accent" />
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: font }}>
          {t.examLesson} {lesson.order}
        </p>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: font }}>
          {isRtl ? lesson.titleAr : lesson.titleEn}
        </h2>
      </div>

      {/* Exam meta */}
      <div className="flex items-center gap-6 text-sm">
        {exam.durationMinutes && (
          <div className="flex flex-col items-center gap-1">
            <Clock size={18} className="text-muted-foreground" />
            <span className="font-bold text-foreground">{exam.durationMinutes}</span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
              {t.examMinutes}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <Trophy size={18} className="text-muted-foreground" />
          <span className="font-bold text-foreground">{exam.passingScore}%</span>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
            {t.examPassing}
          </span>
        </div>
      </div>

      {/* Result card (if attempted) */}
      {hasAttempt && (
        <div
          className={`w-full max-w-sm p-4 rounded-2xl border text-center ${
            isPassed
              ? 'bg-green-50 border-green-200'
              : isFailed
                ? 'bg-red-50 border-red-200'
                : 'bg-muted border-border'
          }`}
        >
          <p
            className={`text-2xl font-extrabold mb-1 ${
              isPassed ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-foreground'
            }`}
          >
            {attempt.score !== null ? `${attempt.score}%` : '—'}
          </p>
          <p
            className={`text-sm font-bold ${
              isPassed ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-muted-foreground'
            }`}
            style={{ fontFamily: font }}
          >
            {isPassed ? t.examPassed : isFailed ? t.examFailed : t.examPending}
          </p>
        </div>
      )}

      {/* No attempt yet */}
      {!attempt && (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
          {t.examNotTaken}
        </p>
      )}

      {/* CTA — placeholder; exam taking UI would be a separate page/modal */}
      <a
        href={`/student-dashboard/courses/${courseId}/lessons/exam/${lesson.id}`}
        className="px-8 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
        style={{ fontFamily: font }}
      >
        {hasAttempt ? t.examRetake : t.examTake}
      </a>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function StudentCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const courseId = Number(id);
  const router = useRouter();
  const { lang, toggleLang } = useLang();
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'load' | 'notEnrolled' | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchCourse = useCallback(() => {
    fetch(`/api/student/course/${courseId}`)
      .then((r) => {
        if (r.status === 401) {
          router.replace('/sign-up-login-screen');
          return null;
        }
        if (r.status === 403) {
          setError('notEnrolled');
          return null;
        }
        if (!r.ok) {
          setError('load');
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setCourse(d.course);
        // Auto-select first incomplete video lesson, or first lesson overall
        const firstIncomplete =
          d.course.lessons.find((l: Lesson) => l.type === 'video' && !l.progress[0]?.completed) ??
          d.course.lessons[0];
        if (firstIncomplete) setActiveLesson(firstIncomplete);
      })
      .catch(() => setError('load'))
      .finally(() => setLoading(false));
  }, [courseId, router]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleMarkComplete = async () => {
    if (!activeLesson || marking) return;
    setMarking(true);
    const res = await fetch(`/api/student/course/${courseId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: activeLesson.id }),
    });
    if (res.ok) {
      await fetchCourse();
      setCourse((prev) => {
        if (!prev) return prev;
        const updated = prev.lessons.find((l) => l.id === activeLesson.id);
        if (updated) setActiveLesson(updated);
        return prev;
      });
    }
    setMarking(false);
  };

  const completedCount = course?.lessons.filter((l) => l.progress[0]?.completed).length ?? 0;
  const totalCount = course?.lessons.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = activeLesson?.progress[0]?.completed ?? false;

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
            {error === 'notEnrolled' ? t.notEnrolled : t.errorLoad}
          </p>
          <button
            onClick={() => router.push('/student-dashboard')}
            className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
            style={{ fontFamily: font }}
          >
            {t.back}
          </button>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />

      <main className="flex-1 flex flex-col">
        {/* ── Top bar ── */}
        <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/student-dashboard')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              style={{ fontFamily: font }}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
              {t.back}
            </button>
            <span className="text-muted-foreground flex-shrink-0">/</span>
            <p className="font-bold text-foreground text-sm truncate" style={{ fontFamily: font }}>
              {isRtl ? course.nameAr : course.nameEn}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
              {completedCount}/{totalCount} {t.lessons}
            </span>
          </div>
        </div>

        {/* ── Body: main area + sidebar ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Main area ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {!activeLesson ? (
              // Nothing selected
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <PlayCircle size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
                  {course.lessons.length === 0 ? t.noLessons : t.selectLesson}
                </p>
              </div>
            ) : activeLesson.type === 'exam' ? (
              // ── Exam panel ──────────────────────────────────
              <ExamPanel lesson={activeLesson} lang={lang} font={font} courseId={courseId} />
            ) : activeLesson.video ? (
              // ── Video player ─────────────────────────────────
              <>
                {/* مشغل الفيديو */}
                <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    key={activeLesson.video.vimeoId}
                    src={`https://player.vimeo.com/video/${activeLesson.video.vimeoId}?background=1&autoplay=1&loop=1&color=6366f1`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                </div>

                {/* Lesson info + mark complete */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: font }}>
                      {t.lesson} {activeLesson.order}
                    </p>
                    <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: font }}>
                      {isRtl ? activeLesson.titleAr : activeLesson.titleEn}
                    </h2>
                    {activeLesson.video.durationSec && (
                      <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                        {formatDuration(activeLesson.video.durationSec)}
                      </p>
                    )}
                  </div>

                  {isCompleted ? (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 text-sm font-bold flex-shrink-0"
                      style={{ fontFamily: font }}
                    >
                      <CheckCircle size={16} />
                      {t.completed}
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold flex-shrink-0 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                      style={{ fontFamily: font }}
                    >
                      {marking ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <CheckCircle size={15} />
                      )}
                      {t.markComplete}
                    </button>
                  )}
                </div>

                <div className="px-4 sm:px-6 py-3 flex items-center gap-2">
                  <Avatar url={course.teacher.avatarUrl} name={course.teacher.fullName} size={28} />
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                    {t.teacher}:{' '}
                    <span className="font-semibold text-foreground">{course.teacher.fullName}</span>
                  </span>
                </div>
              </>
            ) : (
              // Video lesson but no video attached yet
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <PlayCircle size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
                  {t.selectLesson}
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div
            className={`flex-shrink-0 border-s border-border bg-card flex flex-col transition-all duration-300 ${
              sidebarOpen ? 'w-72' : 'w-12'
            }`}
          >
            {/* Toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex items-center justify-center p-3 border-b border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              {sidebarOpen ? (
                isRtl ? (
                  <ChevronDown size={16} className="-rotate-90" />
                ) : (
                  <ChevronDown size={16} className="rotate-90" />
                )
              ) : isRtl ? (
                <ChevronUp size={16} className="-rotate-90" />
              ) : (
                <ChevronUp size={16} className="rotate-90" />
              )}
            </button>

            {sidebarOpen && (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <p
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                    style={{ fontFamily: font }}
                  >
                    {t.sidebarTitle}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {course.lessons.length === 0 ? (
                    <p
                      className="p-4 text-xs text-muted-foreground text-center"
                      style={{ fontFamily: font }}
                    >
                      {t.noLessons}
                    </p>
                  ) : (
                    course.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        isActive={activeLesson?.id === lesson.id}
                        isRtl={isRtl}
                        font={font}
                        onClick={() => setActiveLesson(lesson)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

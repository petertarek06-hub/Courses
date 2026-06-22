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
  List,
  Lock,
} from 'lucide-react';
import Image from 'next/image';

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
  title: string;
  order: number;
  type: 'video' | 'exam';
  video: VideoRecord | null;
  exam: ExamRecord | null;
  progress: LessonProgress[];
}
interface Course {
  id: number;
  name: string;
  subject: string;
  instructor: { id: number; fullName: string; avatarUrl: string | null };
  lessons: Lesson[];
}

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
    instructor: 'المدرس',
    selectLesson: 'اختر درسًا لتبدأ المشاهدة',
    examLesson: 'امتحان',
    examPassing: 'درجة النجاح',
    examMinutes: 'دقيقة',
    examPassed: 'ناجح ✓',
    examFailed: 'راسب',
    examNotTaken: 'لم تؤدِّ الامتحان بعد',
    examTake: 'ابدأ الامتحان',
    examRetake: 'إعادة الامتحان',
    examPending: 'جارٍ التقييم',
    showContent: 'محتوى الكورس',
    hideContent: 'إخفاء المحتوى',
    locked: 'أكمل الدرس السابق أولاً',
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
    instructor: 'Instructor',
    selectLesson: 'Select a lesson to start watching',
    examLesson: 'Exam',
    examPassing: 'Passing score',
    examMinutes: 'min',
    examPassed: 'Passed ✓',
    examFailed: 'Failed',
    examNotTaken: "You haven't taken this exam yet",
    examTake: 'Start Exam',
    examRetake: 'Retake Exam',
    examPending: 'Awaiting review',
    showContent: 'Course Content',
    hideContent: 'Hide Content',
    locked: 'Complete the previous lesson first',
  },
};

function formatDuration(sec: number | null) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  if (url)
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

// A lesson is "done" for unlock purposes when:
// - video  → student clicked "Mark as watched"  (progress[0].completed)
// - exam   → student passed the exam             (attempts[0].passed === true)
function isLessonComplete(lesson: Lesson): boolean {
  if (lesson.type === 'exam') return lesson.exam?.attempts[0]?.passed === true;
  return lesson.progress[0]?.completed === true;
}

// Lesson n is unlocked when every lesson before it is complete.
function isLessonUnlocked(lessons: Lesson[], index: number): boolean {
  if (index === 0) return true;
  return lessons.slice(0, index).every(isLessonComplete);
}

function LessonRow({
  lesson,
  index,
  lessons,
  isActive,
  isRtl,
  font,
  lockedMsg,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  lessons: Lesson[];
  isActive: boolean;
  isRtl: boolean;
  font: string | undefined;
  lockedMsg: string;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const unlocked = isLessonUnlocked(lessons, index);
  const done = isLessonComplete(lesson);
  const isExam = lesson.type === 'exam';
  const attempt = lesson.exam?.attempts[0];

  const handleClick = () => {
    if (!unlocked) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    onClick();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-full text-start flex items-start gap-3 px-4 py-3 border-b border-border transition-colors
          ${!unlocked ? 'opacity-45 cursor-not-allowed' : isActive ? 'bg-primary/8 border-s-2 border-s-primary' : 'hover:bg-muted/30'}`}
      >
        <span className="mt-0.5 flex-shrink-0">
          {!unlocked ? (
            <Lock size={16} className="text-muted-foreground" />
          ) : isExam ? (
            attempt?.passed === true ? (
              <Trophy size={16} className="text-green-500" />
            ) : attempt?.passed === false ? (
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
            className={`text-xs font-semibold truncate ${isActive && unlocked ? 'text-primary' : 'text-foreground'}`}
            style={{ fontFamily: font }}
          >
            {lesson.title}
          </p>
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

      {/* Tooltip — appears above the row, auto-dismisses after 2 s */}
      {showTooltip && (
        <div
          className={`absolute bottom-full mb-1 ${isRtl ? 'right-3' : 'left-3'} z-10
            bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-lg
            shadow-lg whitespace-nowrap pointer-events-none animate-fade-in`}
          style={{ fontFamily: font }}
        >
          <Lock size={11} className="inline-block me-1 mb-0.5" />
          {lockedMsg}
        </div>
      )}
    </div>
  );
}

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
  const exam = lesson.exam!;
  const attempt = exam.attempts[0];
  const hasAttempt = !!attempt?.submittedAt;
  const isPassed = attempt?.passed === true;
  const isFailed = attempt?.passed === false;
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 gap-5 sm:gap-6 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
        <ClipboardList size={32} className="text-accent sm:hidden" />
        <ClipboardList size={40} className="text-accent hidden sm:block" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: font }}>
          {t.examLesson} {lesson.order}
        </p>
        <h2
          className="text-lg sm:text-xl font-bold text-foreground px-2"
          style={{ fontFamily: font }}
        >
          {lesson.title}
        </h2>
      </div>
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
      {hasAttempt && (
        <div
          className={`w-full max-w-sm p-4 rounded-2xl border text-center ${isPassed ? 'bg-green-50 border-green-200' : isFailed ? 'bg-red-50 border-red-200' : 'bg-muted border-border'}`}
        >
          <p
            className={`text-2xl font-extrabold mb-1 ${isPassed ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-foreground'}`}
          >
            {attempt.score !== null ? `${attempt.score}%` : '—'}
          </p>
          <p
            className={`text-sm font-bold ${isPassed ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-muted-foreground'}`}
            style={{ fontFamily: font }}
          >
            {isPassed ? t.examPassed : isFailed ? t.examFailed : t.examPending}
          </p>
        </div>
      )}
      {!attempt && (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
          {t.examNotTaken}
        </p>
      )}
      <a
        href={`/student-dashboard/courses/${courseId}/lessons/exam/${lesson.id}`}
        className="w-full sm:w-auto px-8 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
        style={{ fontFamily: font }}
      >
        {hasAttempt ? t.examRetake : t.examTake}
      </a>
    </div>
  );
}

// Vimeo embed locked down against easy downloading/re-sharing:
// - dnt=1 disables Vimeo's own tracking/share affordances
// - byline/title/portrait/sharing all off removes the native share button
// - a transparent overlay blocks right-click "save video as" and drag-out
function ProtectedPlayer({ vimeoId }: { vimeoId: string }) {
  return (
    <div
      className="relative w-full bg-black"
      style={{ paddingTop: '56.25%' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        key={vimeoId}
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=6366f1&title=0&byline=0&portrait=0&dnt=1`}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
      {/* Invisible layer that eats right-click / long-press so the iframe's
          own context menu (which can expose download links) never opens. */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }} aria-hidden="true" />
    </div>
  );
}

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
  // Desktop: sidebar open/closed beside content. Mobile: drives an accordion below the player.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileListOpen, setMobileListOpen] = useState(false);

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
        // Pick the first unlocked-but-incomplete lesson, falling back to lesson 0
        const lessons: Lesson[] = d.course.lessons;
        const firstUnfinished =
          lessons.find((l, i) => isLessonUnlocked(lessons, i) && !isLessonComplete(l)) ??
          lessons[0];
        if (firstUnfinished) setActiveLesson(firstUnfinished);
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

  const completedCount = course?.lessons.filter(isLessonComplete).length ?? 0;
  const totalCount = course?.lessons.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = activeLesson ? isLessonComplete(activeLesson) : false;

  if (loading)
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
        <Footer lang={lang} />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
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

  if (!course) return null;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
      <main className="flex-1 flex flex-col">
        {/* Top bar — stacks on mobile, single row from sm up */}
        <div className="border-b border-border bg-card px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.push('/student-dashboard')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              style={{ fontFamily: font }}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
              <span className="hidden xs:inline">{t.back}</span>
            </button>
            <span className="text-muted-foreground flex-shrink-0">/</span>
            <p className="font-bold text-foreground text-sm truncate" style={{ fontFamily: font }}>
              {course.name}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex-1 sm:w-32 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-primary flex-shrink-0">{progressPct}%</span>
            <span
              className="text-xs text-muted-foreground flex-shrink-0 hidden xs:inline"
              style={{ fontFamily: font }}
            >
              {completedCount}/{totalCount} {t.lessons}
            </span>
          </div>
        </div>

        {/* Body — column on mobile/tablet, row from lg up */}
        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0 lg:overflow-y-auto order-1">
            {!activeLesson ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <PlayCircle size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
                  {course.lessons.length === 0 ? t.noLessons : t.selectLesson}
                </p>
              </div>
            ) : activeLesson.type === 'exam' ? (
              <ExamPanel lesson={activeLesson} lang={lang} font={font} courseId={courseId} />
            ) : activeLesson.video ? (
              <>
                <ProtectedPlayer vimeoId={activeLesson.video.vimeoId} />
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 border-b border-border">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: font }}>
                      {t.lesson} {activeLesson.order}
                    </p>
                    <h2
                      className="text-base sm:text-lg font-bold text-foreground"
                      style={{ fontFamily: font }}
                    >
                      {activeLesson.title}
                    </h2>
                    {activeLesson.video.durationSec && (
                      <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                        {formatDuration(activeLesson.video.durationSec)}
                      </p>
                    )}
                  </div>
                  {isCompleted ? (
                    <span
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 text-sm font-bold flex-shrink-0"
                      style={{ fontFamily: font }}
                    >
                      <CheckCircle size={16} />
                      {t.completed}
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold flex-shrink-0 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
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
                  <Avatar
                    url={course.instructor.avatarUrl}
                    name={course.instructor.fullName}
                    size={28}
                  />
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                    {t.instructor}:{' '}
                    <span className="font-semibold text-foreground">
                      {course.instructor.fullName}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <PlayCircle size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
                  {t.selectLesson}
                </p>
              </div>
            )}
          </div>

          {/* Mobile/tablet: collapsible lesson list below content (hidden at lg+) */}
          <div className="lg:hidden order-2 border-t border-border bg-card">
            <button
              onClick={() => setMobileListOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-foreground"
              style={{ fontFamily: font }}
            >
              <span className="flex items-center gap-2">
                <List size={16} />
                {mobileListOpen ? t.hideContent : t.showContent}
                <span className="text-xs font-normal text-muted-foreground">
                  ({completedCount}/{totalCount})
                </span>
              </span>
              {mobileListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {mobileListOpen && (
              <div className="max-h-[60vh] overflow-y-auto border-t border-border">
                {course.lessons.length === 0 ? (
                  <p
                    className="p-4 text-xs text-muted-foreground text-center"
                    style={{ fontFamily: font }}
                  >
                    {t.noLessons}
                  </p>
                ) : (
                  course.lessons.map((lesson, index) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      lessons={course.lessons}
                      isActive={activeLesson?.id === lesson.id}
                      isRtl={isRtl}
                      font={font}
                      lockedMsg={t.locked}
                      onClick={() => {
                        setActiveLesson(lesson);
                        setMobileListOpen(false);
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Desktop sidebar — only from lg up */}
          <div
            className={`hidden lg:flex flex-shrink-0 border-s border-border bg-card flex-col transition-all duration-300 order-3 ${sidebarOpen ? 'w-72' : 'w-12'}`}
          >
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
                    course.lessons.map((lesson, index) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        lessons={course.lessons}
                        isActive={activeLesson?.id === lesson.id}
                        isRtl={isRtl}
                        font={font}
                        lockedMsg={t.locked}
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

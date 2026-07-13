//src\app\teacher-dashboard\page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import { BookOpen, Users, ListVideo, Loader2, GraduationCap, ClipboardList } from 'lucide-react';

const gradeLabelMap: Record<string, { ar: string; en: string }> = {
  'grade-1': { ar: 'الصف الأول الابتدائي', en: 'Grade 1' },
  'grade-2': { ar: 'الصف الثاني الابتدائي', en: 'Grade 2' },
  'grade-3': { ar: 'الصف الثالث الابتدائي', en: 'Grade 3' },
  'grade-4': { ar: 'الصف الرابع الابتدائي', en: 'Grade 4' },
  'grade-5': { ar: 'الصف الخامس الابتدائي', en: 'Grade 5' },
  'grade-6': { ar: 'الصف السادس الابتدائي', en: 'Grade 6' },
  'grade-7': { ar: 'الصف الأول الإعدادي', en: 'Grade 7' },
  'grade-8': { ar: 'الصف الثاني الإعدادي', en: 'Grade 8' },
  'grade-9': { ar: 'الصف الثالث الإعدادي', en: 'Grade 9' },
  'grade-10': { ar: 'الصف الأول الثانوي', en: 'Grade 10' },
  'grade-11': { ar: 'الصف الثاني الثانوي', en: 'Grade 11' },
  'grade-12': { ar: 'الصف الثالث الثانوي', en: 'Grade 12' },
};

interface Course {
  id: number;
  nameAr: string;
  nameEn: string;
  subjectAr: string;
  subjectEn: string;
  academicYear: string;
  price: number;
  isVisible: boolean;
  _count: { lessons: number; enrollments: number };
}

const content = {
  ar: {
    title: 'لوحة المدرس',
    myCourses: 'كورساتي',
    manageLessons: 'إدارة الدروس',
    examsLink: 'الامتحانات',
    lessons: 'درس',
    students: 'طالب',
    free: 'مجاني',
    egp: 'ج.م',
    visible: 'مرئي',
    hidden: 'مخفي',
    noCourses: 'لا توجد كورسات مسندة إليك بعد',
    noCoursesHint: 'تواصل مع الإدارة لإضافة كورساتك',
  },
  en: {
    title: 'teacher Dashboard',
    myCourses: 'My Courses',
    manageLessons: 'Manage Lessons',
    examsLink: 'Exams',
    lessons: 'lessons',
    students: 'students',
    free: 'Free',
    egp: 'EGP',
    visible: 'Visible',
    hidden: 'Hidden',
    noCourses: 'No courses assigned to you yet',
    noCoursesHint: 'Contact the admin to add your courses',
  },
};

export default function teacherDashboardPage() {
  const { lang, toggleLang } = useLang();
  const router = useRouter();
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/courses')
      .then((r) => {
        if (r.status === 401) {
          router.replace('/sign-up-login-screen');
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => d && setCourses(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const gradeLabel = (key: string) =>
    gradeLabelMap[key] ? (isRtl ? gradeLabelMap[key].ar : gradeLabelMap[key].en) : key;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-6" style={{ fontFamily: font }}>
          {t.title}
        </h1>

        <div className="bg-card rounded-2xl border border-border card-shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
              {t.myCourses}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <GraduationCap size={44} className="text-muted-foreground/30" />
              <p
                className="text-sm font-semibold text-muted-foreground"
                style={{ fontFamily: font }}
              >
                {t.noCourses}
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                {t.noCoursesHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="font-bold text-foreground text-sm leading-snug"
                      style={{ fontFamily: font }}
                    >
                      {isRtl ? course.nameAr : course.nameEn}
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${course.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                      style={{ fontFamily: font }}
                    >
                      {course.isVisible ? t.visible : t.hidden}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold"
                      style={{ fontFamily: font }}
                    >
                      {isRtl ? course.subjectAr : course.subjectEn}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold"
                      style={{ fontFamily: font }}
                    >
                      {gradeLabel(course.academicYear)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {course._count.lessons} {t.lessons}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course._count.enrollments} {t.students}
                    </span>
                    <span className="font-semibold text-foreground" dir="ltr">
                      {course.price === 0 ? t.free : `${course.price} ${t.egp}`}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/teacher-dashboard/courses/${course.id}/lessons`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl gradient-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
                      style={{ fontFamily: font }}
                    >
                      <ListVideo size={14} />
                      {t.manageLessons}
                    </button>
                    <button
                      onClick={() => router.push(`/teacher-dashboard/courses/${course.id}/exams`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-muted transition-all"
                      style={{ fontFamily: font }}
                    >
                      <ClipboardList size={14} />
                      {t.examsLink}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

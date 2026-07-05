'use client';
// src/app/courses-page/components/CoursesClient.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CoursesFilters from './CoursesFilters';
import TeacherCard from './TeacherCard';
import CoursesEmptyState from './CoursesEmptyState';
import EnrollModal from './EnrollModal';
import { Loader2 } from 'lucide-react';

// ── Grade lookup (same keys the old code used) ──────────────────
const gradeLookup: Record<string, { ar: string; en: string }> = {
  'grade-1': { ar: 'أول ابتدائي', en: 'Grade 1' },
  'grade-2': { ar: 'ثاني ابتدائي', en: 'Grade 2' },
  'grade-3': { ar: 'ثالث ابتدائي', en: 'Grade 3' },
  'grade-4': { ar: 'رابع ابتدائي', en: 'Grade 4' },
  'grade-5': { ar: 'خامس ابتدائي', en: 'Grade 5' },
  'grade-6': { ar: 'سادس ابتدائي', en: 'Grade 6' },
  'grade-7': { ar: 'أول إعدادي', en: 'Grade 7' },
  'grade-8': { ar: 'ثاني إعدادي', en: 'Grade 8' },
  'grade-9': { ar: 'ثالث إعدادي', en: 'Grade 9' },
  'grade-10': { ar: 'أول ثانوي', en: 'Grade 10' },
  'grade-11': { ar: 'ثاني ثانوي', en: 'Grade 11' },
  'grade-12': { ar: 'ثالث ثانوي', en: 'Grade 12' },
};

// Which grade keys belong to each stage
const gradesByStage: Record<string, string[]> = {
  primary: ['grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6'],
  preparatory: ['grade-7', 'grade-8', 'grade-9'],
  secondary: ['grade-10', 'grade-11', 'grade-12'],
};

const subjectKeyMap: Record<string, string> = {
  الرياضيات: 'math',
  mathematics: 'math',
  'اللغة العربية': 'arabic',
  arabic: 'arabic',
  'arabic language': 'arabic',
  'اللغة الإنجليزية': 'english',
  english: 'english',
  'english language': 'english',
  العلوم: 'science',
  science: 'science',
  الفيزياء: 'physics',
  physics: 'physics',
  الكيمياء: 'chemistry',
  chemistry: 'chemistry',
  الأحياء: 'biology',
  biology: 'biology',
  التاريخ: 'history',
  history: 'history',
  الجغرافيا: 'geography',
  geography: 'geography',
};

const subjectColorMap: Record<string, string> = {
  math: 'bg-primary/10 text-primary',
  arabic: 'bg-secondary/20 text-secondary',
  english: 'bg-purple-100 text-purple-600',
  science: 'bg-accent/20 text-accent',
  physics: 'bg-red-100 text-red-500',
  chemistry: 'bg-teal-100 text-teal-600',
  biology: 'bg-green-100 text-green-600',
  history: 'bg-amber-100 text-amber-600',
  geography: 'bg-sky-100 text-sky-600',
};
const defaultColor = 'bg-muted text-muted-foreground';

interface RawCourse {
  id: number;
  name: string;
  description: string | null;
  subject: string;
  academicYear: string;
  price: number;
  isEnrolled: boolean;
  teacher: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    whatsappNumber: string | null;
  };
  _count: { lessons: number; enrollments: number };
}

export interface Teacher {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  subjectKey: string;
  gradeKey: string;
  gradeAr: string;
  gradeEn: string;
  photo: string | null;
  photoAlt: string;
  whatsapp: string | null;
  lessons: number;
  students: number;
  rating: null;
  color: string;
  price: number;
  isEnrolled: boolean;
}

function normalise(course: RawCourse): Teacher {
  const subjectKey = subjectKeyMap[course.subject.toLowerCase()] ?? 'other';
  const grade = gradeLookup[course.academicYear] ?? {
    ar: course.academicYear,
    en: course.academicYear,
  };
  const whatsapp = course.teacher.whatsappNumber
    ? `https://wa.me/${course.teacher.whatsappNumber.replace(/\D/g, '')}`
    : null;
  return {
    id: `course-${course.id}`,
    name: course.name,
    description: course.description,
    subject: course.subject,
    subjectKey,
    gradeKey: course.academicYear,
    gradeAr: grade.ar,
    gradeEn: grade.en,
    photo: course.teacher.avatarUrl,
    photoAlt: course.teacher.fullName,
    whatsapp,
    lessons: course._count.lessons,
    students: course._count.enrollments,
    rating: null,
    color: subjectColorMap[subjectKey] ?? defaultColor,
    price: course.price,
    isEnrolled: course.isEnrolled,
  };
}

export default function CoursesClient() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all'); // ← NEW real state
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollTarget, setEnrollTarget] = useState<Teacher | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data: RawCourse[]) => setTeachers(data.map(normalise)))
      .finally(() => setLoading(false));
  }, []);

  const handleEnrolled = useCallback((courseId: string) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === courseId ? { ...t, isEnrolled: true, students: t.students + 1 } : t
      )
    );
  }, []);

  // When stage changes, always reset grade
  function handleStageChange(stage: string) {
    setSelectedStage(stage);
    setSelectedGrade('all');
  }

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      // Stage filter: check if this course's gradeKey belongs to the selected stage
      if (selectedStage !== 'all') {
        const stageGrades = gradesByStage[selectedStage] ?? [];
        if (!stageGrades.includes(t.gradeKey)) return false;
      }

      // Grade filter
      if (selectedGrade !== 'all' && t.gradeKey !== selectedGrade) return false;

      // Subject filter
      const subjectQ = selectedSubject.toLowerCase().trim();
      if (subjectQ && !t.subject.toLowerCase().includes(subjectQ)) return false;

      // Name / subject search
      const q = searchQuery.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q))
        return false;

      return true;
    });
  }, [teachers, selectedStage, selectedGrade, selectedSubject, searchQuery]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
    >
      <Header
        lang={lang}
        onToggleLang={() => setLang((p) => (p === 'ar' ? 'en' : 'ar'))}
        currentPath="/courses-page"
      />

      <main className="flex-1">
        <div className="bg-gradient-to-br from-[#EEF4FF] to-[#E8F8F0] py-10 border-b border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {isRtl ? '🎓 استعرض الكورسات' : '🎓 Browse Courses'}
            </h1>
            <p
              className="text-muted-foreground text-base"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {isRtl
                ? `${teachers.length} كورس متاح — اختر مرحلتك الدراسية وابدأ التعلم`
                : `${teachers.length} course${teachers.length !== 1 ? 's' : ''} available — choose your stage and start learning`}
            </p>
          </div>
        </div>

        <CoursesFilters
          lang={lang}
          selectedStage={selectedStage}
          selectedGrade={selectedGrade}
          selectedSubject={selectedSubject}
          searchQuery={searchQuery}
          onStageChange={handleStageChange}
          onGradeChange={setSelectedGrade}
          onSubjectChange={setSelectedSubject}
          onSearchChange={setSearchQuery}
        />

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <CoursesEmptyState
              lang={lang}
              onReset={() => {
                handleStageChange('all');
                setSelectedSubject('');
                setSearchQuery('');
              }}
            />
          ) : (
            <>
              <p
                className="text-sm text-muted-foreground mb-6"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {isRtl
                  ? `عرض ${filtered.length} نتيجة`
                  : `Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
                {filtered.map((teacher) => (
                  <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    lang={lang}
                    onEnrollClick={setEnrollTarget}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer lang={lang} />

      <EnrollModal
        course={enrollTarget}
        lang={lang}
        onClose={() => setEnrollTarget(null)}
        onEnrolled={handleEnrolled}
      />
    </div>
  );
}

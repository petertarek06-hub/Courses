'use client';
// src/app/courses-page/components/CoursesFilters.tsx
import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  selectedStage: string; // NEW prop — owned by CoursesClient
  selectedGrade: string;
  selectedSubject: string;
  searchQuery: string;
  onStageChange: (stage: string) => void; // NEW
  onGradeChange: (grade: string) => void;
  onSubjectChange: (subject: string) => void;
  onSearchChange: (query: string) => void;
}

const stages = [
  { value: 'all', labelAr: 'كل المراحل', labelEn: 'All Stages' },
  { value: 'primary', labelAr: 'المرحلة الابتدائية', labelEn: 'Primary' },
  { value: 'preparatory', labelAr: 'المرحلة الإعدادية', labelEn: 'Preparatory' },
  { value: 'secondary', labelAr: 'المرحلة الثانوية', labelEn: 'Secondary' },
];

const gradesByStage: Record<string, { value: string; labelAr: string; labelEn: string }[]> = {
  primary: [
    { value: 'grade-1', labelAr: 'الصف الأول الابتدائي', labelEn: 'Grade 1' },
    { value: 'grade-2', labelAr: 'الصف الثاني الابتدائي', labelEn: 'Grade 2' },
    { value: 'grade-3', labelAr: 'الصف الثالث الابتدائي', labelEn: 'Grade 3' },
    { value: 'grade-4', labelAr: 'الصف الرابع الابتدائي', labelEn: 'Grade 4' },
    { value: 'grade-5', labelAr: 'الصف الخامس الابتدائي', labelEn: 'Grade 5' },
    { value: 'grade-6', labelAr: 'الصف السادس الابتدائي', labelEn: 'Grade 6' },
  ],
  preparatory: [
    { value: 'grade-7', labelAr: 'الصف الأول الإعدادي', labelEn: 'Grade 7' },
    { value: 'grade-8', labelAr: 'الصف الثاني الإعدادي', labelEn: 'Grade 8' },
    { value: 'grade-9', labelAr: 'الصف الثالث الإعدادي', labelEn: 'Grade 9' },
  ],
  secondary: [
    { value: 'grade-10', labelAr: 'الصف الأول الثانوي', labelEn: 'Grade 10' },
    { value: 'grade-11', labelAr: 'الصف الثاني الثانوي', labelEn: 'Grade 11' },
    { value: 'grade-12', labelAr: 'الصف الثالث الثانوي', labelEn: 'Grade 12' },
  ],
};

const content = {
  ar: {
    searchPlaceholder: 'ابحث باسم الكورس أو المدرس...',
    subjectPlaceholder: 'ابحث بالمادة... (رياضيات، فيزياء...)',
    clearAll: 'مسح الكل',
    allGrades: 'كل الصفوف',
  },
  en: {
    searchPlaceholder: 'Search by course or teacher name...',
    subjectPlaceholder: 'Search by subject... (math, physics...)',
    clearAll: 'Clear All',
    allGrades: 'All Grades',
  },
};

export default function CoursesFilters({
  lang,
  selectedStage,
  selectedGrade,
  selectedSubject,
  searchQuery,
  onStageChange,
  onGradeChange,
  onSubjectChange,
  onSearchChange,
}: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  const gradeOptions = selectedStage !== 'all' ? (gradesByStage[selectedStage] ?? []) : [];

  const hasActiveFilters =
    selectedStage !== 'all' ||
    selectedGrade !== 'all' ||
    selectedSubject !== '' ||
    searchQuery !== '';

  return (
    <div
      className="sticky top-16 z-40 bg-card border-b border-border shadow-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-3">
        {/* ── Row 1: text searches + clear ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative flex-1">
            <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </span>
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder={t.subjectPlaceholder}
              className="w-full ps-9 pe-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            />
            {selectedSubject && (
              <button
                onClick={() => onSubjectChange('')}
                className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                onStageChange('all');
                onGradeChange('all');
                onSubjectChange('');
                onSearchChange('');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all duration-150 flex-shrink-0"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              <X size={14} />
              {t.clearAll}
            </button>
          )}
        </div>

        {/* ── Row 2: stage → grade dropdowns ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Stage */}
          <div className="relative flex-1">
            <select
              value={selectedStage}
              onChange={(e) => {
                onStageChange(e.target.value);
                onGradeChange('all'); // reset grade whenever stage changes
              }}
              className={`w-full appearance-none ps-4 pe-9 py-2.5 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
                selectedStage !== 'all'
                  ? 'border-primary/60 bg-primary/5 text-primary font-semibold'
                  : 'border-border text-foreground'
              }`}
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>
                  {isRtl ? s.labelAr : s.labelEn}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
              <ChevronDown size={15} />
            </span>
          </div>

          {/* Grade — disabled until a stage is chosen */}
          <div className="relative flex-1">
            <select
              value={selectedGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              disabled={selectedStage === 'all'}
              className={`w-full appearance-none ps-4 pe-9 py-2.5 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedGrade !== 'all'
                  ? 'border-secondary/60 bg-secondary/5 text-secondary font-semibold'
                  : 'border-border text-foreground'
              }`}
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              <option value="all">{t.allGrades}</option>
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {isRtl ? g.labelAr : g.labelEn}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
              <ChevronDown size={15} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

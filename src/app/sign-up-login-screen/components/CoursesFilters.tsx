// src/app/courses-page/components/CoursesFilters.tsx
'use client';
import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  selectedGrade: string;
  selectedSubject: string;
  searchQuery: string;
  onGradeChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onSearchChange: (val: string) => void;
}

// ── Filter data ────────────────────────────────────────────────

const grades = {
  ar: [
    { value: 'all', label: 'كل الصفوف' },
    { value: 'grade-1', label: 'الصف الأول الابتدائي' },
    { value: 'grade-2', label: 'الصف الثاني الابتدائي' },
    { value: 'grade-3', label: 'الصف الثالث الابتدائي' },
    { value: 'grade-4', label: 'الصف الرابع الابتدائي' },
    { value: 'grade-5', label: 'الصف الخامس الابتدائي' },
    { value: 'grade-6', label: 'الصف السادس الابتدائي' },
    { value: 'grade-7', label: 'الصف الأول الإعدادي' },
    { value: 'grade-8', label: 'الصف الثاني الإعدادي' },
    { value: 'grade-9', label: 'الصف الثالث الإعدادي' },
    { value: 'grade-10', label: 'الصف الأول الثانوي' },
    { value: 'grade-11', label: 'الصف الثاني الثانوي' },
    { value: 'grade-12', label: 'الصف الثالث الثانوي' },
  ],
  en: [
    { value: 'all', label: 'All Grades' },
    { value: 'grade-1', label: 'Grade 1 — Primary' },
    { value: 'grade-2', label: 'Grade 2 — Primary' },
    { value: 'grade-3', label: 'Grade 3 — Primary' },
    { value: 'grade-4', label: 'Grade 4 — Primary' },
    { value: 'grade-5', label: 'Grade 5 — Primary' },
    { value: 'grade-6', label: 'Grade 6 — Primary' },
    { value: 'grade-7', label: 'Grade 7 — Middle' },
    { value: 'grade-8', label: 'Grade 8 — Middle' },
    { value: 'grade-9', label: 'Grade 9 — Middle' },
    { value: 'grade-10', label: 'Grade 10 — High School' },
    { value: 'grade-11', label: 'Grade 11 — High School' },
    { value: 'grade-12', label: 'Grade 12 — High School' },
  ],
};

const subjects = {
  ar: [
    { value: 'all', label: 'كل المواد' },
    { value: 'math', label: 'الرياضيات' },
    { value: 'arabic', label: 'اللغة العربية' },
    { value: 'english', label: 'اللغة الإنجليزية' },
    { value: 'science', label: 'العلوم' },
    { value: 'physics', label: 'الفيزياء' },
    { value: 'chemistry', label: 'الكيمياء' },
    { value: 'biology', label: 'الأحياء' },
    { value: 'history', label: 'التاريخ' },
    { value: 'geography', label: 'الجغرافيا' },
  ],
  en: [
    { value: 'all', label: 'All Subjects' },
    { value: 'math', label: 'Mathematics' },
    { value: 'arabic', label: 'Arabic Language' },
    { value: 'english', label: 'English Language' },
    { value: 'science', label: 'Science' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
  ],
};

const content = {
  ar: {
    searchPlaceholder: 'ابحث عن مدرس أو مادة...',
    gradeLabel: 'الصف الدراسي',
    subjectLabel: 'المادة',
    clearAll: 'مسح الفلاتر',
  },
  en: {
    searchPlaceholder: 'Search for a teacher or subject...',
    gradeLabel: 'Grade',
    subjectLabel: 'Subject',
    clearAll: 'Clear filters',
  },
};

// ── Component ──────────────────────────────────────────────────

export default function CoursesFilters({
  lang,
  selectedGrade,
  selectedSubject,
  searchQuery,
  onGradeChange,
  onSubjectChange,
  onSearchChange,
}: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const gradeOptions = grades[lang];
  const subjectOptions = subjects[lang];

  // Is any filter active (beyond defaults)?
  const hasActiveFilters =
    selectedGrade !== 'all' || selectedSubject !== 'all' || searchQuery.trim() !== '';

  const handleClearAll = () => {
    onGradeChange('all');
    onSubjectChange('all');
    onSearchChange('');
  };

  return (
    <div
      className="sticky top-16 z-30 bg-card/95 backdrop-blur border-b border-border"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* ── Search input ── */}
          <div className="relative flex-1 min-w-0">
            <span
              className="absolute inset-y-0 flex items-center pointer-events-none text-muted-foreground"
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            >
              <Search size={16} />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
              style={{
                fontFamily: font,
                [isRtl ? 'paddingRight' : 'paddingLeft']: '42px',
                [isRtl ? 'paddingLeft' : 'paddingRight']: '16px',
              }}
            />
          </div>

          {/* ── Grade select ── */}
          <div className="flex flex-col gap-1 sm:w-52">
            <select
              value={selectedGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 appearance-none cursor-pointer"
              style={{ fontFamily: font }}
              aria-label={t.gradeLabel}
            >
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Subject select ── */}
          <div className="flex flex-col gap-1 sm:w-44">
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 appearance-none cursor-pointer"
              style={{ fontFamily: font }}
              aria-label={t.subjectLabel}
            >
              {subjectOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Clear filters button — only shown when filters are active ── */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-150 whitespace-nowrap flex-shrink-0"
              style={{ fontFamily: font }}
            >
              <X size={15} />
              {t.clearAll}
            </button>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {selectedGrade !== 'all' && (
              <Chip
                label={gradeOptions.find((g) => g.value === selectedGrade)?.label ?? selectedGrade}
                onRemove={() => onGradeChange('all')}
                font={font}
              />
            )}
            {selectedSubject !== 'all' && (
              <Chip
                label={
                  subjectOptions.find((s) => s.value === selectedSubject)?.label ?? selectedSubject
                }
                onRemove={() => onSubjectChange('all')}
                font={font}
              />
            )}
            {searchQuery.trim() !== '' && (
              <Chip label={`"${searchQuery}"`} onRemove={() => onSearchChange('')} font={font} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter chip ────────────────────────────────────────────────

function Chip({
  label,
  onRemove,
  font,
}: {
  label: string;
  onRemove: () => void;
  font: string | undefined;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
      style={{ fontFamily: font }}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:text-primary/60 transition-colors"
        aria-label="Remove filter"
      >
        <X size={12} />
      </button>
    </span>
  );
}

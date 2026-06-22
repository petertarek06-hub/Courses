//src/app/courses-page/components/CoursesEmptyState.tsx
import React from 'react';
import { SearchX } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  onReset: () => void;
}

const content = {
  ar: {
    title: 'لا توجد نتائج مطابقة',
    description:
      'لم نجد أي مدرس يطابق فلاتر البحث الحالية. جرّب تغيير الصف الدراسي أو المادة أو كلمة البحث.',
    cta: 'مسح الفلاتر وعرض الكل',
  },
  en: {
    title: 'No matching results',
    description:
      "We couldn't find any teachers matching your current filters. Try changing the grade, subject, or search term.",
    cta: 'Clear filters and show all',
  },
};

export default function CoursesEmptyState({ lang, onReset }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
        <SearchX size={36} className="text-muted-foreground" />
      </div>
      <h3
        className="text-xl font-bold text-foreground mb-2"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.title}
      </h3>
      <p
        className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.description}
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all duration-150"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.cta}
      </button>
    </div>
  );
}

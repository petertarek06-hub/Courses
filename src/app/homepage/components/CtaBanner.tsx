//src/homepage/components/CatBanner
import React from 'react';
import Link from 'next/link';

interface Props {
  lang: 'ar' | 'en';
  user?: { id: number; fullName: string; role: string } | null;
}

const content = {
  ar: {
    title: 'جاهز تبدأ رحلة التفوق؟',
    subtitle: 'انضم لأكثر من 2,400 طالب يتعلمون بذكاء على إيدو سنتر الآن',
    cta1: 'سجّل مجاناً',
    cta1LoggedIn: 'الذهاب للوحتي',
    cta2: 'استعرض الكورسات',
  },
  en: {
    title: 'Ready to Start Your Excellence Journey?',
    subtitle: 'Join over 2,400 students learning smart on EduCenter today',
    cta1: 'Register Free',
    cta1LoggedIn: 'Go to Dashboard',
    cta2: 'Browse Courses',
  },
};

export default function CtaBanner({ lang, user }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  const dashboardHref =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'teacher'
        ? '/instructor-dashboard'
        : '/student-dashboard';

  return (
    <section className="py-16 gradient-primary" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-white mb-3"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.title}
        </h2>
        <p
          className="text-white/80 text-base mb-8 max-w-xl mx-auto"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Primary CTA — changes based on auth state */}
          <Link
            href={user ? dashboardHref : '/sign-up-login-screen'}
            className="px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-base shadow-lg hover:bg-white/90 active:scale-95 transition-all duration-150"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {user ? t.cta1LoggedIn : t.cta1}
          </Link>

          {/* Browse courses — always shown */}
          <Link
            href="/courses-page"
            className="px-8 py-3.5 rounded-xl border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 active:scale-95 transition-all duration-150"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.cta2}
          </Link>
        </div>
      </div>
    </section>
  );
}

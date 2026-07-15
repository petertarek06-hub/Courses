//src/app/sign-up-login-screen/components/AuthIllustration.tsx
import React from 'react';

interface Props {
  lang: 'ar' | 'en';
}

const content = {
  ar: {
    headline: 'تعلّم بذكاء',
    subheadline: 'تفوّق بثقة',
    bullets: [
      '✅ أكثر من 50 كورس في جميع المواد',
      '✅ دروس فيديو مشفرة وحصرية',
      '✅ امتحانات تفاعلية وتتبع الأداء',
      '✅ دفع آمن عبر المحفظة الذكية أو الكاش',
    ],
  },
  en: {
    headline: 'Learn Smart',
    subheadline: 'Excel with Confidence',
    bullets: [
      '✅ 50+ courses across all subjects',
      '✅ Encrypted exclusive video lessons',
      '✅ Interactive exams and progress tracking',
      '✅ Safe payment via smart wallet or cash',
    ],
  },
};

export default function AuthIllustration({ lang }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="hidden lg:flex gradient-primary flex-col items-center justify-center p-10 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-12 right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute top-1/3 right-4 w-8 h-8 rounded-full bg-accent/40" />
      <svg className="absolute top-20 right-10 w-12 opacity-30" viewBox="0 0 50 50" fill="white">
        <polygon points="25,3 31,18 47,18 34,28 39,44 25,35 11,44 16,28 3,18 19,18" />
      </svg>
      <svg className="absolute bottom-24 left-10 w-16 opacity-20" viewBox="0 0 40 120" fill="white">
        <rect x="8" y="10" width="24" height="80" rx="4" />
        <polygon points="8,90 32,90 20,115" />
      </svg>

      {/* Content */}
      <div className="relative z-10 text-center text-white">
        {/* Book emoji illustration */}
        <div className="text-7xl mb-6 animate-float">📚</div>

        <h2
          className="text-4xl font-extrabold text-white leading-tight"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.headline}
        </h2>
        <p
          className="text-2xl font-bold text-white/80 mt-1 mb-8"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.subheadline}
        </p>

        <ul className="flex flex-col gap-3 text-start">
          {t.bullets.map((bullet, i) => (
            <li
              key={`auth-bullet-${i}`}
              className="text-white/90 text-sm font-medium"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

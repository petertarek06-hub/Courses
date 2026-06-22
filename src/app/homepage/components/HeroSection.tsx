//src/homepage/components/HeroSection.tsx
import React from 'react';
import Link from 'next/link';

interface Props {
  lang: 'ar' | 'en';
  user?: { id: number; fullName: string; role: string } | null;
  authReady?: boolean;
}
// ── Decorative shapes ──────────────────────────────────────────
function PencilShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="24" height="80" rx="4" fill="#F7B267" fillOpacity="0.7" />
      <polygon points="8,90 32,90 20,115" fill="#FFD580" fillOpacity="0.8" />
      <rect x="8" y="10" width="24" height="12" rx="4" fill="#E8A050" fillOpacity="0.9" />
      <line
        x1="20"
        y1="100"
        x2="20"
        y2="115"
        stroke="#2D3436"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

function RulerShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="116" height="28" rx="4" fill="#7ED6A5" fillOpacity="0.6" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <line
          key={`ruler-tick-${i}`}
          x1={12 + i * 10}
          y1="8"
          x2={12 + i * 10}
          y2={i % 5 === 0 ? 24 : 18}
          stroke="#2D3436"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
      ))}
    </svg>
  );
}

function TriangleShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="50,5 95,85 5,85"
        fill="#5B8DEF"
        fillOpacity="0.2"
        stroke="#5B8DEF"
        strokeWidth="2"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

function StarShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="25,3 31,18 47,18 34,28 39,44 25,35 11,44 16,28 3,18 19,18"
        fill="#F7B267"
        fillOpacity="0.8"
      />
    </svg>
  );
}

function BookShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="32" height="60" rx="3" fill="#5B8DEF" fillOpacity="0.3" />
      <rect x="43" y="5" width="32" height="60" rx="3" fill="#7ED6A5" fillOpacity="0.3" />
      <line x1="40" y1="5" x2="40" y2="65" stroke="#2D3436" strokeWidth="2" strokeOpacity="0.2" />
      <line x1="12" y1="20" x2="30" y2="20" stroke="#5B8DEF" strokeWidth="2" strokeOpacity="0.5" />
      <line x1="12" y1="28" x2="30" y2="28" stroke="#5B8DEF" strokeWidth="2" strokeOpacity="0.5" />
      <line x1="12" y1="36" x2="24" y2="36" stroke="#5B8DEF" strokeWidth="2" strokeOpacity="0.5" />
    </svg>
  );
}

// ── Content ────────────────────────────────────────────────────
const content = {
  ar: {
    badge: '🎓 منصة التعليم الذكي',
    title: 'تعلّم بذكاء،',
    titleAccent: 'تفوّق بثقة',
    description:
      'منصة إيدو سنتر تجمع الطلاب من الصف الأول حتى الثانوية مع أفضل المدرسين. دروس فيديو، امتحانات تفاعلية، ومتابعة مستمرة لتقدمك الدراسي.',
    cta1: 'ابدأ التعلم الآن',
    cta2: 'استعرض الكورسات',
    stats: [
      { value: '+2000', label: 'طالب مسجّل' },
      { value: '+150', label: 'كورس متاح' },
      { value: '+50', label: 'مدرس متخصص' },
    ],
  },
  en: {
    badge: '🎓 Smart Learning Platform',
    title: 'Learn Smart,',
    titleAccent: 'Excel with Confidence',
    description:
      'EduCenter connects students from Grade 1 through high school with the best teachers. Video lessons, interactive exams, and continuous progress tracking.',
    cta1: 'Start Learning Now',
    cta2: 'Browse Courses',
    stats: [
      { value: '2000+', label: 'Enrolled Students' },
      { value: '150+', label: 'Available Courses' },
      { value: '50+', label: 'Specialist Teachers' },
    ],
  },
};

// ── Component ──────────────────────────────────────────────────
export default function HeroSection({ lang, user }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  const dashboardHref =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'teacher'
        ? '/instructor-dashboard'
        : '/student-dashboard';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4FF] via-background to-[#E8F8F0] py-16 md:py-24">
      {/* Decorative floating shapes */}
      <PencilShape className="absolute top-10 left-8 w-8 h-24 animate-float opacity-80 hidden md:block" />
      <RulerShape className="absolute top-16 right-12 w-28 h-8 animate-float-delay opacity-70 hidden md:block" />
      <TriangleShape className="absolute bottom-20 left-16 w-20 h-18 animate-float-delay2 opacity-60 hidden lg:block" />
      <StarShape className="absolute top-8 left-1/2 w-8 h-8 animate-float opacity-60 hidden md:block" />
      <BookShape className="absolute bottom-10 right-20 w-16 h-14 animate-float-delay opacity-50 hidden lg:block" />
      <StarShape className="absolute bottom-32 left-1/3 w-6 h-6 animate-float-delay2 opacity-40 hidden lg:block" />
      <PencilShape className="absolute top-24 right-1/3 w-6 h-18 animate-float-delay opacity-50 hidden xl:block" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 animate-fade-in">
            {t.badge}
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.title} <span className="text-primary">{t.titleAccent}</span>
          </h1>

          {/* Description */}
          <p
            className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              // ── Logged in: show dashboard button ──
              <Link
                href={dashboardHref}
                className="px-8 py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {isRtl
                  ? `مرحباً، ${user.fullName.split(' ')[0]} ← لوحتي`
                  : `Welcome, ${user.fullName.split(' ')[0]} ← Dashboard`}
              </Link>
            ) : (
              // ── Logged out: show register button ──
              <Link
                href="/sign-up-login-screen"
                className="px-8 py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {t.cta1}
              </Link>
            )}

            {/* Browse courses — always shown */}
            <Link
              href="/courses-page"
              className="px-8 py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 active:scale-95 transition-all duration-150"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.cta2}
            </Link>
          </div>

          {/* Mini stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {t.stats.map((stat) => (
              <div key={`hero-stat-${stat.label}`} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">
                  {stat.value}
                </div>
                <div
                  className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

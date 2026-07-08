//src/app/homepage/HowItWorksSection.tsx
import React from 'react';
import Link from 'next/link';
import { UserPlus, BookOpen, PlayCircle, TrendingUp } from 'lucide-react';
// import Icon from '@/components/ui/AppIcon';

interface Props {
  lang: 'ar' | 'en';
}

const content = {
  ar: {
    sectionBadge: 'كيف يعمل إيدو سنتر؟',
    title: 'أربع خطوات بسيطة للتفوق',
    subtitle: 'من التسجيل إلى التفوق، نرافقك في كل خطوة',
    steps: [
      {
        icon: UserPlus,
        color: 'bg-primary/10 text-primary',
        number: '١',
        title: 'سجّل حسابك',
        description:
          'أنشئ حسابك برقم هاتفك واختر صفك الدراسي من الأول الابتدائي حتى الثانوية العامة.',
      },
      {
        icon: BookOpen,
        color: 'bg-secondary/20 text-secondary',
        number: '٢',
        title: 'اشترك في الكورس',
        description: 'تصفح كورسات مدرسيك المفضلين وادفع بسهولة عبر المحفظة الذكية أو الكاش.',
      },
      {
        icon: PlayCircle,
        color: 'bg-accent/20 text-accent',
        number: '٣',
        title: 'شاهد الدروس',
        description: 'دروس فيديو مشفرة ومحمية تُعرض على الموقع فقط — شاهد في أي وقت ومن أي مكان.',
      },
      {
        icon: TrendingUp,
        color: 'bg-purple-100 text-purple-600',
        number: '٤',
        title: 'تابع تقدمك',
        description: 'أدِّ الامتحانات التفاعلية وتابع درجاتك ونسبة إكمالك للمنهج لحظة بلحظة.',
      },
    ],
    cta: 'ابدأ رحلتك الآن',
  },
  en: {
    sectionBadge: 'How EduCenter Works',
    title: 'Four Simple Steps to Excel',
    subtitle: 'From registration to excellence, we guide you every step of the way',
    steps: [
      {
        icon: UserPlus,
        color: 'bg-primary/10 text-primary',
        number: '1',
        title: 'Create Your Account',
        description:
          'Sign up with your phone number and select your academic year from Grade 1 through high school.',
      },
      {
        icon: BookOpen,
        color: 'bg-secondary/20 text-secondary',
        number: '2',
        title: 'Enroll in a Course',
        description:
          "Browse your favorite teachers' courses and pay easily via smart wallet or cash.",
      },
      {
        icon: PlayCircle,
        color: 'bg-accent/20 text-accent',
        number: '3',
        title: 'Watch Lessons',
        description:
          'Encrypted video lessons displayed exclusively on this website — watch anytime, anywhere.',
      },
      {
        icon: TrendingUp,
        color: 'bg-purple-100 text-purple-600',
        number: '4',
        title: 'Track Your Progress',
        description:
          'Take interactive exams and monitor your grades and curriculum completion in real time.',
      },
    ],
    cta: 'Start Your Journey',
  },
};

export default function HowItWorksSection({ lang }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <section className="py-16 md:py-24 bg-card" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.sectionBadge}
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.title}
          </h2>
          <p
            className="text-muted-foreground text-base max-w-xl mx-auto"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={`step-${index + 1}`}
                className="relative bg-background rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-200 border border-border group"
              >
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${step.color}`}
                >
                  <Icon size={22} />
                </div>

                {/* Content */}
                <h3
                  className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-150"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-muted-foreground text-sm leading-relaxed"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {step.description}
                </p>

                {/* Connector arrow (not on last) */}
                {index < t.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 -end-4 z-10 text-primary/40">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d={isRtl ? 'M5 8l6-4v8z' : 'M11 8L5 4v8z'} />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/sign-up-login-screen"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

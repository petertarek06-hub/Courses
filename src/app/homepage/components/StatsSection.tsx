//src/app/homepage/StatsSection.tsx
import React from 'react';
import { Users, BookOpen, GraduationCap, Star } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

interface Props {
  lang: 'ar' | 'en';
}

const content = {
  ar: {
    stats: [
      {
        icon: Users,
        value: '2,400+',
        label: 'طالب مسجّل',
        color: 'text-primary',
        bg: 'bg-primary/10',
      },
      {
        icon: BookOpen,
        value: '165',
        label: 'كورس متاح',
        color: 'text-secondary',
        bg: 'bg-secondary/20',
      },
      {
        icon: GraduationCap,
        value: '58',
        label: 'مدرس متخصص',
        color: 'text-accent',
        bg: 'bg-accent/20',
      },
      {
        icon: Star,
        value: '4.8',
        label: 'متوسط التقييم',
        color: 'text-purple-500',
        bg: 'bg-purple-100',
      },
    ],
  },
  en: {
    stats: [
      {
        icon: Users,
        value: '2,400+',
        label: 'Enrolled Students',
        color: 'text-primary',
        bg: 'bg-primary/10',
      },
      {
        icon: BookOpen,
        value: '165',
        label: 'Available Courses',
        color: 'text-secondary',
        bg: 'bg-secondary/20',
      },
      {
        icon: GraduationCap,
        value: '58',
        label: 'Specialist Teachers',
        color: 'text-accent',
        bg: 'bg-accent/20',
      },
      {
        icon: Star,
        value: '4.8',
        label: 'Average Rating',
        color: 'text-purple-500',
        bg: 'bg-purple-100',
      },
    ],
  },
};

export default function StatsSection({ lang }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <section className="py-12 gradient-primary" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {t.stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={`stat-${stat.label}`}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/15 backdrop-blur"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon size={22} className="text-white" />
                </div>
                <div className="text-3xl font-extrabold text-white tabular-nums">{stat.value}</div>
                <div
                  className="text-white/80 text-sm font-medium mt-1"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

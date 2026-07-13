'use client';
import React, { useEffect, useState } from 'react';
import { Users, BookOpen, GraduationCap, Video } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
}

interface StatsData {
  studentsCount: number;
  coursesCount: number;
  teachersCount: number;
  lessonsCount: number;
}

const labels = {
  ar: {
    students: 'طالب مسجّل',
    courses: 'كورس متاح',
    teachers: 'مدرس متخصص',
    lessons: 'درس متاح',
  },
  en: {
    students: 'Enrolled Students',
    courses: 'Available Courses',
    teachers: 'Specialist Teachers',
    lessons: 'Lessons Available',
  },
};

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+` : `${n}`;
}

export default function StatsSection({ lang }: Props) {
  const t = labels[lang];
  const isRtl = lang === 'ar';
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/homepage/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      icon: Users,
      value: stats ? formatCount(stats.studentsCount) : null,
      label: t.students,
      color: 'text-primary',
    },
    {
      icon: BookOpen,
      value: stats ? formatCount(stats.coursesCount) : null,
      label: t.courses,
      color: 'text-secondary',
    },
    {
      icon: GraduationCap,
      value: stats ? formatCount(stats.teachersCount) : null,
      label: t.teachers,
      color: 'text-accent',
    },
    {
      icon: Video,
      value: stats ? formatCount(stats.lessonsCount) : null,
      label: t.lessons,
      color: 'text-purple-500',
    },
  ];

  return (
    <section className="py-12 gradient-primary" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/15 backdrop-blur"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <StatIcon size={22} className="text-white" />
                </div>
                {stat.value ? (
                  <div className="text-3xl font-extrabold text-white tabular-nums">
                    {stat.value}
                  </div>
                ) : (
                  <div className="h-8 w-14 rounded bg-white/20 animate-pulse" />
                )}
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

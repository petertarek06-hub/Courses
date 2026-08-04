'use client';
// src/app/courses-page/components/TeacherCard.tsx
import React from 'react';
import { Star, BookOpen, Users, CheckCircle2 } from 'lucide-react';
import type { Teacher } from './CoursesClient';

interface Props {
  teacher: Teacher;
  lang: 'ar' | 'en';
  onEnrollClick: (teacher: Teacher) => void;
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const bg = color.split(' ')[0];
  const text = color.split(' ')[1];
  return (
    <div
      className={`w-16 h-16 rounded-2xl border-2 border-border flex items-center justify-center font-extrabold text-xl ${bg} ${text}`}
    >
      {initials}
    </div>
  );
}

const content = {
  ar: {
    lessons: 'درس',
    students: 'طالب',
    whatsapp: 'تواصل عبر واتساب',
    enroll: 'اشترك في الكورس',
    enrolled: 'متابعة الكورس',
    enrolledBadge: 'مشترك',
    free: 'مجاني',
    egp: 'ج.م',
    or: 'أو',
    monthly: 'شهرياً',
  },
  en: {
    lessons: 'lessons',
    students: 'students',
    whatsapp: 'Contact via WhatsApp',
    enroll: 'Enroll in Course',
    enrolled: 'Go to Course',
    enrolledBadge: 'Enrolled',
    free: 'Free',
    egp: 'EGP',
    or: 'or',
    monthly: '/month',
  },
};

export default function TeacherCard({ teacher, lang, onEnrollClick }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';
  const { isEnrolled } = teacher;
  const courseId = teacher.id.replace('course-', '');

  return (
    <div className="bg-card rounded-2xl border border-border card-shadow hover:card-shadow-hover transition-all duration-200 group flex flex-col overflow-hidden">
      <div className={`h-2 w-full ${teacher.color.split(' ')[0]}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Photo + name + subject */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            {teacher.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacher.photo}
                alt={teacher.photoAlt}
                width={64}
                height={64}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-border"
              />
            ) : (
              // ✅ was: isRtl ? teacher.nameAr : teacher.nameEn
              <InitialsAvatar name={teacher.name} color={teacher.color} />
            )}
            {isEnrolled && (
              <span className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-0.5 shadow">
                <CheckCircle2 size={14} strokeWidth={2.5} />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* ✅ was: isRtl ? teacher.nameAr : teacher.nameEn */}
            <h3
              className="font-bold text-base text-foreground leading-tight mb-1.5 group-hover:text-primary transition-colors duration-150 truncate"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {teacher.name}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* ✅ was: isRtl ? teacher.subjectAr : teacher.subjectEn */}
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${teacher.color}`}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {teacher.subject}
              </span>
              {isEnrolled && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                  {t.enrolledBadge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grade badge */}
        <div
          className="flex items-center gap-1.5 mb-3 text-sm text-muted-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          <span className="text-base">🎓</span>
          <span className="font-medium truncate">{isRtl ? teacher.gradeAr : teacher.gradeEn}</span>
        </div>

        {/* Description — ✅ was: isRtl ? teacher.descriptionAr : teacher.descriptionEn */}
        {teacher.description && (
          <p
            className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {teacher.description}
          </p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex flex-col items-center p-2 rounded-xl bg-muted/60 text-center">
            <BookOpen size={14} className="text-primary mb-0.5" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {teacher.lessons}
            </span>
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.lessons}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-muted/60 text-center">
            <Users size={14} className="text-secondary mb-0.5" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {teacher.students}
            </span>
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.students}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-muted/60 text-center">
            <Star size={14} className="text-accent mb-0.5" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {teacher.price === 0 ? t.free : teacher.price}
            </span>
            <span className="text-xs text-muted-foreground">
              {teacher.price === 0 ? '🎁' : t.egp}
            </span>
            {teacher.subscriptionPrice && (
              <span className="text-xs text-primary font-medium mt-0.5">
                {t.or} {teacher.subscriptionPrice} {t.egp} {t.monthly}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2">
          {teacher.whatsapp && (
            <a
              href={teacher.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-whatsapp hover:bg-green-500 text-white text-sm font-bold transition-all duration-150 active:scale-95"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              <WhatsAppIcon />
              {t.whatsapp}
            </a>
          )}

          {isEnrolled ? (
            <a
              href={`/student-dashboard/courses/${courseId}/lessons`}
              className="w-full py-2.5 rounded-xl bg-secondary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all duration-150 active:scale-95"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              <CheckCircle2 size={15} strokeWidth={2.5} />
              {t.enrolled}
            </a>
          ) : (
            <button
              onClick={() => onEnrollClick(teacher)}
              className="w-full py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-all duration-150 active:scale-95"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.enroll}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

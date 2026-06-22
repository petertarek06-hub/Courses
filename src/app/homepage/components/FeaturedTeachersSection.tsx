//src/app/homepage/FeaturedTeachersSection.tsx
import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

interface Props {
  lang: 'ar' | 'en';
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const featuredTeachers = [
  {
    id: 'teacher-001',
    nameAr: 'أ. محمد السيد',
    nameEn: 'Mr. Mohamed El-Sayed',
    subjectAr: 'الرياضيات',
    subjectEn: 'Mathematics',
    gradeAr: 'الصف الثالث الثانوي',
    gradeEn: 'Grade 12',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_1cbf097bf-1771887488991.png',
    photoAlt: 'Male teacher with glasses in professional attire',
    whatsapp: 'https://wa.me/201111111111',
    color: 'bg-primary/10 text-primary',
    lessons: 48,
  },
  {
    id: 'teacher-002',
    nameAr: 'أ. نور إبراهيم',
    nameEn: 'Ms. Nour Ibrahim',
    subjectAr: 'اللغة العربية',
    subjectEn: 'Arabic Language',
    gradeAr: 'الصف الأول الثانوي',
    gradeEn: 'Grade 10',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_1f23078ba-1773180519517.png',
    photoAlt: 'Female teacher smiling in classroom setting',
    whatsapp: 'https://wa.me/201222222222',
    color: 'bg-secondary/20 text-secondary',
    lessons: 36,
  },
  {
    id: 'teacher-003',
    nameAr: 'أ. كريم عبدالله',
    nameEn: 'Mr. Karim Abdallah',
    subjectAr: 'العلوم',
    subjectEn: 'Science',
    gradeAr: 'الصف السادس الابتدائي',
    gradeEn: 'Grade 6',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_13e3f7bce-1773055229123.png',
    photoAlt: 'Young male teacher in blue shirt',
    whatsapp: 'https://wa.me/201333333333',
    color: 'bg-accent/20 text-accent',
    lessons: 29,
  },
  {
    id: 'teacher-004',
    nameAr: 'أ. سارة مصطفى',
    nameEn: 'Ms. Sara Mostafa',
    subjectAr: 'اللغة الإنجليزية',
    subjectEn: 'English Language',
    gradeAr: 'الصف الثاني الإعدادي',
    gradeEn: 'Grade 8',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_16cc0c862-1772096790295.png',
    photoAlt: 'Female teacher with warm smile in light background',
    whatsapp: 'https://wa.me/201444444444',
    color: 'bg-purple-100 text-purple-600',
    lessons: 42,
  },
  {
    id: 'teacher-005',
    nameAr: 'أ. أحمد حسن',
    nameEn: 'Mr. Ahmed Hassan',
    subjectAr: 'الفيزياء',
    subjectEn: 'Physics',
    gradeAr: 'الصف الثاني الثانوي',
    gradeEn: 'Grade 11',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_1cfd048b8-1772544165648.png',
    photoAlt: 'Male physics teacher with confident expression',
    whatsapp: 'https://wa.me/201555555555',
    color: 'bg-red-100 text-red-500',
    lessons: 55,
  },
  {
    id: 'teacher-006',
    nameAr: 'أ. منى الشربيني',
    nameEn: 'Ms. Mona El-Sherbini',
    subjectAr: 'الكيمياء',
    subjectEn: 'Chemistry',
    gradeAr: 'الصف الثالث الثانوي',
    gradeEn: 'Grade 12',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_171c6e258-1766803099050.png',
    photoAlt: 'Female chemistry teacher in lab coat',
    whatsapp: 'https://wa.me/201666666666',
    color: 'bg-teal-100 text-teal-600',
    lessons: 38,
  },
];

const content = {
  ar: {
    badge: 'نخبة المدرسين',
    title: 'تعلّم من أفضل المدرسين',
    subtitle: 'مدرسون متخصصون في جميع المواد الدراسية من الابتدائي حتى الثانوية',
    lessonsLabel: 'درس',
    whatsappLabel: 'واتساب',
    viewAll: 'عرض كل الكورسات',
  },
  en: {
    badge: 'Top Teachers',
    title: 'Learn from the Best Teachers',
    subtitle: 'Specialist teachers in all subjects from primary through high school',
    lessonsLabel: 'lessons',
    whatsappLabel: 'WhatsApp',
    viewAll: 'View All Courses',
  },
};

export default function FeaturedTeachersSection({ lang }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <section className="py-16 md:py-24 bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-sm font-semibold mb-2"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.badge}
            </span>
            <h2
              className="text-3xl font-extrabold text-foreground"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.title}
            </h2>
            <p
              className="text-muted-foreground text-sm mt-1"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.subtitle}
            </p>
          </div>
          <Link
            href="/courses-page"
            className="flex-shrink-0 px-5 py-2.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all duration-150 whitespace-nowrap"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.viewAll}
          </Link>
        </div>

        {/* Teachers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          {featuredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover border border-border transition-all duration-200 group flex flex-col"
            >
              {/* Teacher info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  <AppImage
                    src={teacher.photo}
                    alt={teacher.photoAlt}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors duration-150"
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    {isRtl ? teacher.nameAr : teacher.nameEn}
                  </h3>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${teacher.color}`}
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    {isRtl ? teacher.subjectAr : teacher.subjectEn}
                  </span>
                </div>
              </div>

              {/* Grade + lessons */}
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  🎓 {isRtl ? teacher.gradeAr : teacher.gradeEn}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  📹 {teacher.lessons} {t.lessonsLabel}
                </span>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={teacher.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-whatsapp hover:bg-green-500 text-white text-sm font-bold transition-all duration-150 active:scale-95"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                <WhatsAppIcon />
                {t.whatsappLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

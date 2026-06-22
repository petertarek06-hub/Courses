//src/app/homepage/TestimonialsSection.tsx
import React from 'react';
import { Star } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface Props {
  lang: 'ar' | 'en';
}

const testimonials = [
  {
    id: 'testimonial-001',
    nameAr: 'أميرة خالد',
    nameEn: 'Amira Khaled',
    gradeAr: 'الصف الثالث الثانوي',
    gradeEn: 'Grade 12',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_126851564-1772139368088.png',
    photoAlt: 'Teenage girl student smiling',
    rating: 5,
    textAr:
      'المنصة رائعة جداً! درست الرياضيات مع الأستاذ محمد وحصلت على 98 في الامتحان. الدروس واضحة جداً والامتحانات بتساعدك تفهم أكتر.',
    textEn:
      'The platform is amazing! I studied Math with Mr. Mohamed and got 98 in my exam. The lessons are very clear and the exams help you understand more.',
  },
  {
    id: 'testimonial-002',
    nameAr: 'يوسف عمر',
    nameEn: 'Yousef Omar',
    gradeAr: 'الصف الثاني الإعدادي',
    gradeEn: 'Grade 8',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_1a1cebe91-1771134643484.png',
    photoAlt: 'Young male student with backpack',
    rating: 5,
    textAr:
      'بحب أوي إن أقدر أشوف الدرس أكتر من مرة. لما ماكنتش فاهم حاجة رجعت للفيديو وفهمت كويس. ممتاز جداً!',
    textEn:
      "I love that I can watch the lesson more than once. When I didn't understand something, I rewatched the video and understood perfectly. Excellent!",
  },
  {
    id: 'testimonial-003',
    nameAr: 'هبة الرحمن',
    nameEn: 'Heba El-Rahman',
    gradeAr: 'الصف الأول الثانوي',
    gradeEn: 'Grade 10',
    photo: 'https://img.rocket.new/generatedImages/rocket_gen_img_14e8bd565-1773155589957.png',
    photoAlt: 'Female student in school uniform',
    rating: 4,
    textAr:
      'كنت بخاف من الكيمياء بس بعد ما اشتركت مع الأستاذة منى بقيت بحبها. الشرح بسيط ومفهوم وفيه أمثلة كتير.',
    textEn:
      'I used to be scared of Chemistry, but after enrolling with Ms. Mona I started to love it. The explanation is simple and there are many examples.',
  },
];

const content = {
  ar: {
    badge: 'قالوا عنّا',
    title: 'آراء طلابنا',
    subtitle: 'نجاح طلابنا هو مقياس نجاحنا الحقيقي',
  },
  en: {
    badge: 'What They Say',
    title: "Our Students' Reviews",
    subtitle: "Our students' success is our true measure of achievement",
  },
};

export default function TestimonialsSection({ lang }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-br from-[#EEF4FF] to-[#E8F8F0]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-3"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.badge}
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.title}
          </h2>
          <p
            className="text-muted-foreground text-base"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-2xl p-6 card-shadow border border-border flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={`star-${item.id}-${i}`}
                    size={16}
                    className={i < item.rating ? 'fill-accent text-accent' : 'text-muted'}
                  />
                ))}
              </div>

              {/* Text */}
              <p
                className="text-foreground/80 text-sm leading-relaxed flex-1"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                "{isRtl ? item.textAr : item.textEn}"
              </p>

              {/* Student */}
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <AppImage
                  src={item.photo}
                  alt={item.photoAlt}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                />

                <div>
                  <div
                    className="font-bold text-sm text-foreground"
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    {isRtl ? item.nameAr : item.nameEn}
                  </div>
                  <div
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    {isRtl ? item.gradeAr : item.gradeEn}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

//src/components/Footer.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Facebook, Youtube, Instagram } from '@/components/ui/BrandIcons';

interface FooterProps {
  lang: 'ar' | 'en';
}

interface CenterInfo {
  siteName: string;
  siteDescription: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  whatsappButtonLabel: string | null;
  copyrightText: string | null;
  // ── Footer special offer ──
  offerEnabled: boolean;
  offerTitle: string | null;
  offerText: string | null;
  offerImageUrl: string | null;
}

// Fallback values shown until /api/settings resolves (and if a field was
// never set by the admin), so the footer never renders empty.
const DEFAULT_CENTER_INFO: CenterInfo = {
  siteName: 'EduCenter',
  siteDescription: null,
  email: 'info@educenter.eg',
  phone: '01234567890',
  whatsappNumber: '01234567890',
  address: null,
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  whatsappButtonLabel: null,
  copyrightText: null,
  // ── Footer special offer ── off by default until an admin turns it on
  offerEnabled: false,
  offerTitle: null,
  offerText: null,
  offerImageUrl: null,
};

// WhatsApp icon SVG
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const footerContent = {
  ar: {
    description:
      'منصة تعليمية متكاملة تربط الطلاب من سن 7 إلى 18 عامًا بأفضل المدرسين لتحقيق التفوق الدراسي.',
    quickLinks: 'روابط سريعة',
    links: [
      { label: 'الرئيسية', href: '/' },
      { label: 'الكورسات', href: '/courses-page' },
      { label: 'تسجيل الدخول', href: '/sign-up-login-screen' },
    ],
    contact: 'تواصل معنا',
    addressFallback: 'القاهرة، مصر',
    whatsapp: 'واتساب لويدا علي',
    brandName: 'إيدو سنتر',
    rights: '© 2026 إيدو سنتر. جميع الحقوق محفوظة.',
    followUs: 'تابعنا',
  },
  en: {
    description:
      'A complete educational platform connecting students aged 7–18 with the best teachers for academic excellence.',
    quickLinks: 'Quick Links',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses-page' },
      { label: 'Sign In', href: '/sign-up-login-screen' },
    ],
    contact: 'Contact Us',
    addressFallback: 'Cairo, Egypt',
    whatsapp: 'WhatsApp Loyda Ali',
    brandName: 'EduCenter',
    rights: '© 2026 EduCenter. All rights reserved.',
    followUs: 'Follow Us',
  },
};

export default function Footer({ lang }: FooterProps) {
  const t = footerContent[lang];
  const isRtl = lang === 'ar';

  const [center, setCenter] = useState<CenterInfo>(DEFAULT_CENTER_INFO);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCenter((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        // keep the static defaults if the request fails
      });
  }, []);

  const whatsappNumber = center.whatsappNumber ?? DEFAULT_CENTER_INFO.whatsappNumber;
  const whatsappHref = whatsappNumber ? `https://wa.me/2${whatsappNumber}` : '#';

  // Only render the offer banner once the admin has switched it on AND
  // there's actually something to show — avoids an empty/broken-looking card.
  const showOffer =
    center.offerEnabled && (center.offerTitle || center.offerText || center.offerImageUrl);

  return (
    <footer
      className="bg-foreground text-white mt-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        {/* Special offer banner */}
        {showOffer && (
          <div className="mb-10 rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
            {center.offerImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={center.offerImageUrl}
                alt={center.offerTitle || 'Special offer'}
                className="w-full sm:w-36 h-36 object-cover rounded-xl flex-shrink-0"
              />
            )}
            <div className="text-center sm:text-start">
              {center.offerTitle && (
                <h3 className="text-lg font-extrabold text-white mb-1">{center.offerTitle}</h3>
              )}
              {center.offerText && (
                <p className="text-white/75 text-sm leading-relaxed">{center.offerText}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AppLogo size={36} />
              <span className="font-bold text-lg text-white">{center.siteName || t.brandName}</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {center.siteDescription || t.description}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-base mb-4 text-white">{t.quickLinks}</h4>
            <ul className="flex flex-col gap-2">
              {t.links.map((link) => (
                <li key={`footer-link-${link.href}`}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-base mb-4 text-white">{t.contact}</h4>
            <ul className="flex flex-col gap-3">
              {(center.phone ?? DEFAULT_CENTER_INFO.phone) && (
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Phone size={15} className="flex-shrink-0 text-secondary" />
                  <span dir="ltr">{center.phone ?? DEFAULT_CENTER_INFO.phone}</span>
                </li>
              )}
              {(center.email ?? DEFAULT_CENTER_INFO.email) && (
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Mail size={15} className="flex-shrink-0 text-secondary" />
                  <span>{center.email ?? DEFAULT_CENTER_INFO.email}</span>
                </li>
              )}
              {(center.address ?? t.addressFallback) && (
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <MapPin size={15} className="flex-shrink-0 text-secondary" />
                  <span>{center.address ?? t.addressFallback}</span>
                </li>
              )}
              {/* WhatsApp */}
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-whatsapp hover:bg-green-500 text-white text-sm font-semibold transition-all duration-150 mt-1"
                >
                  <WhatsAppIcon size={16} />
                  {center.whatsappButtonLabel || t.whatsapp}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social + copyright */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">{center.copyrightText || t.rights}</p>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm">{t.followUs}:</span>
            <a
              href={center.facebookUrl || '#'}
              target={center.facebookUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-150"
              aria-label="Facebook"
            >
              <Facebook size={15} />
            </a>
            <a
              href={center.youtubeUrl || '#'}
              target={center.youtubeUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center transition-colors duration-150"
              aria-label="YouTube"
            >
              <Youtube size={15} />
            </a>
            <a
              href={center.instagramUrl || '#'}
              target={center.instagramUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-colors duration-150"
              aria-label="Instagram"
            >
              <Instagram size={15} />
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-whatsapp flex items-center justify-center transition-colors duration-150"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

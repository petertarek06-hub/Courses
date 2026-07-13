//src/app/layout.tsx
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import '../components/Header';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
//import { Terminal } from 'lucide-react';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'EduCenter — مركز التعليم الذكي للطلاب',
  description:
    'منصة تعليمية متكاملة للطلاب من سن 7 إلى 18 عامًا — دروس فيديو، امتحانات، ومتابعة التقدم. Bilingual learning platform for students aged 7–18.',
  icons: {
    icon: [{ url: '/assets/images/app_logo.png', type: 'image/png' }],
    apple: '/assets/images/app_logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" className={`${plusJakartaSans.variable} ${cairo.variable}`}>
      <body className={`${plusJakartaSans.className} font-sans`}>
        {children}
        <Toaster position="bottom-right" richColors />

        <script
          type="module"
          async
          src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Feducenter5812back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.18"
        />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" />
      </body>
    </html>
  );
}

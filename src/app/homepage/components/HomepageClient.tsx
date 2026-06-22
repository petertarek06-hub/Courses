'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './HeroSection';
import HowItWorksSection from './HowItWorksSection';
import StatsSection from './StatsSection';
import FeaturedTeachersSection from './FeaturedTeachersSection';
import TestimonialsSection from './TestimonialsSection';
import CtaBanner from './CtaBanner';
import { useLang } from '@/lib/uselang';

interface AuthUser {
  id: number;
  fullName: string;
  role: string;
}

export default function HomepageClient() {
  const { lang, toggleLang } = useLang();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ fontFamily: lang === 'ar' ? 'var(--font-cairo)' : undefined }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/" />
      <main className="flex-1">
        <HeroSection lang={lang} user={user} authReady={authReady} />
        <HowItWorksSection lang={lang} />
        <StatsSection lang={lang} />
        <FeaturedTeachersSection lang={lang} />
        <TestimonialsSection lang={lang} />
        <CtaBanner lang={lang} user={user} />
      </main>
      <Footer lang={lang} />
    </div>
  );
}

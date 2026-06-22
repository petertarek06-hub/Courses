'use client';
// src/app/sign-up-login-screen/components/AuthClient.tsx
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AuthIllustration from './AuthIllustration';

const content = {
  ar: {
    tabLogin: 'تسجيل الدخول',
    tabRegister: 'إنشاء حساب',
    welcomeBack: 'أهلاً بعودتك!',
    joinUs: 'انضم إلى إيدو سنتر',
  },
  en: {
    tabLogin: 'Sign In',
    tabRegister: 'Create Account',
    welcomeBack: 'Welcome Back!',
    joinUs: 'Join EduCenter',
  },
};

export default function AuthClient() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const isRtl = lang === 'ar';
  const t = content[lang];

  const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/sign-up-login-screen" />
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden card-shadow border border-border">
          {/* Illustration panel */}
          <AuthIllustration lang={lang} />

          {/* Form panel */}
          <div className="bg-card p-8 sm:p-10 flex flex-col">
            {/* Tabs */}
            <div className="flex bg-muted rounded-xl p-1 mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {t.tabLogin}
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {t.tabRegister}
              </button>
            </div>

            {/* Heading */}
            <h1
              className="text-2xl font-extrabold text-foreground mb-6"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {activeTab === 'login' ? t.welcomeBack : t.joinUs}
            </h1>

            {/* Forms */}
            {activeTab === 'login' ? (
              <LoginForm lang={lang} onSwitchToRegister={() => setActiveTab('register')} />
            ) : (
              <RegisterForm lang={lang} onSwitchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}

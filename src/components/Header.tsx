// src/components/Header.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import { Menu, X, Globe, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  currentPath?: string;
}

interface AuthUser {
  id: number;
  fullName: string;
  role: string;
  phone: string;
  avatarUrl?: string | null;
}

const navLinks = {
  ar: [
    { label: 'الرئيسية', href: '/' },
    { label: 'الكورسات', href: '/courses-page' },
  ],
  en: [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses-page' },
  ],
};

export default function Header({ lang, onToggleLang, currentPath = '/' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const links = navLinks[lang];
  const isRtl = lang === 'ar';

  const dashboardHref =
    user?.role === 'admin' || user?.role === 'assistant'
      ? '/admin'
      : user?.role === 'teacher'
        ? '/teacher-dashboard'
        : user?.role === 'guardian'
          ? '/guardian-dashboard'
          : '/student-dashboard';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => null)
      .finally(() => setLoadingUser(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out successfully');
    window.location.href = '/';
  };

  return (
    <header
      className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <AppLogo size={36} />
            <span
              className="font-bold text-lg text-foreground"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {lang === 'ar' ? 'ياللا نفهم' : 'Yalla Nefham'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={`nav-${link.href}`}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  currentPath === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <Globe size={15} />
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Auth area */}
            {!loadingUser &&
              (user ? (
                <div className="hidden md:flex items-center gap-2">
                  {/* User info — links to their dashboard */}
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 transition-colors duration-150"
                  >
                    {user.avatarUrl ? (
                      <AppImage
                        src={user.avatarUrl}
                        alt={user.fullName}
                        width={22}
                        height={22}
                        className="w-[22px] h-[22px] rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <User size={15} className="text-primary flex-shrink-0" />
                    )}
                    <span
                      className="text-sm font-semibold text-foreground max-w-[120px] truncate"
                      style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                    >
                      {user.fullName}
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-md font-bold">
                        {lang === 'ar' ? 'أدمن' : 'Admin'}
                      </span>
                    )}
                    {user.role === 'assistant' && (
                      <span className="text-xs bg-sky-500/20 text-sky-700 px-1.5 py-0.5 rounded-md font-bold">
                        {lang === 'ar' ? 'مساعد' : 'assistant'}
                      </span>
                    )}
                    {user.role === 'teacher' && (
                      <span
                        className="text-xs bg-secondary text-white px-1.5 py-0.5 rounded-md font-bold"
                        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                      >
                        {lang === 'ar' ? 'مدرس' : 'Teacher'}
                      </span>
                    )}
                    {user.role === 'guardian' && (
                      <span className="text-xs bg-orange-500/20 text-orange-700 px-1.5 py-0.5 rounded-md font-bold">
                        {lang === 'ar' ? 'ولي أمر' : 'Guardian'}
                      </span>
                    )}
                  </Link>
                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-150"
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    <LogOut size={15} />
                    {lang === 'ar' ? 'خروج' : 'Logout'}
                  </button>
                </div>
              ) : (
                <Link
                  href="/sign-up-login-screen"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-bold transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {lang === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                </Link>
              ))}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden bg-card border-t border-border animate-fade-in"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={`mobile-nav-${link.href}`}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  currentPath === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted mt-2"
                >
                  {user.avatarUrl ? (
                    <AppImage
                      src={user.avatarUrl}
                      alt={user.fullName}
                      width={22}
                      height={22}
                      className="w-[22px] h-[22px] rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <User size={15} className="text-primary flex-shrink-0" />
                  )}
                  <span
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                  >
                    {user.fullName}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-md font-bold">
                      {lang === 'ar' ? 'أدمن' : 'Admin'}
                    </span>
                  )}
                  {user.role === 'assistant' && (
                    <span className="text-xs bg-sky-500/20 text-sky-700 px-1.5 py-0.5 rounded-md font-bold">
                      {lang === 'ar' ? 'مساعد' : 'assistant'}
                    </span>
                  )}
                  {user.role === 'teacher' && (
                    <span
                      className="text-xs bg-secondary text-white px-1.5 py-0.5 rounded-md font-bold"
                      style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                    >
                      {lang === 'ar' ? 'مدرس' : 'Teacher'}
                    </span>
                  )}
                  {user.role === 'guardian' && (
                    <span className="text-xs bg-orange-500/20 text-orange-700 px-1.5 py-0.5 rounded-md font-bold">
                      {lang === 'ar' ? 'ولي أمر' : 'Guardian'}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-1 px-4 py-3 rounded-lg border border-red-200 text-red-500 text-sm font-bold text-center transition-all duration-150"
                  style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
                >
                  {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                href="/sign-up-login-screen"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-4 py-3 rounded-lg gradient-primary text-white text-sm font-bold text-center transition-all duration-150"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                {lang === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

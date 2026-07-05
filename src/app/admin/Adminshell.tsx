'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createContext, useContext } from 'react';

// ── Shared context ─────────────────────────────────────────────
interface AdminLangContextType {
  lang: 'ar' | 'en';
  isRtl: boolean;
}

export const AdminLangContext = createContext<AdminLangContextType>({
  lang: 'ar',
  isRtl: true,
});

export function useAdminLang() {
  return useContext(AdminLangContext);
}

// ── Sidebar links ──────────────────────────────────────────────
const sidebarLinks = (lang: 'ar' | 'en') => [
  { label: lang === 'ar' ? 'نظرة عامة' : 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: lang === 'ar' ? 'الطلاب' : 'Students', href: '/admin/students', icon: Users },
  {
    label: lang === 'ar' ? 'المدرسين' : 'Teachers',
    href: '/admin/teachers',
    icon: GraduationCap,
  },
  { label: lang === 'ar' ? 'الكورسات' : 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: lang === 'ar' ? 'المدفوعات' : 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: lang === 'ar' ? 'الإعدادات' : 'Settings', href: '/admin/settings', icon: Settings },
];

// ── Auth check interval (ms) ───────────────────────────────────
const AUTH_CHECK_INTERVAL = 60 * 1000; // every 60 seconds

// ── Main Component ─────────────────────────────────────────────
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { lang, toggleLang } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isRtl = lang === 'ar';
  const links = sidebarLinks(lang);

  // ── Periodic session check ─────────────────────────────────
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        router.replace('/sign-up-login-screen');
      }
    } catch {
      // network error — don't redirect, just wait for next check
    }
  }, [router]);

  useEffect(() => {
    // Check immediately when component mounts (covers client-side navigation)
    checkSession();

    // Then check on every interval
    const interval = setInterval(checkSession, AUTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkSession]);

  // Also re-check whenever the pathname changes (user navigates to a new admin page)
  useEffect(() => {
    checkSession();
  }, [pathname, checkSession]);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header lang={lang} onToggleLang={toggleLang} currentPath={pathname} />

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside
          className={`
            ${sidebarOpen ? 'w-56' : 'w-16'}
            transition-all duration-300
            bg-card border-e border-border
            flex flex-col py-4 gap-1
            sticky top-16 h-[calc(100vh-4rem)]
            overflow-y-auto
          `}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="mx-auto mb-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {isRtl ? (
              sidebarOpen ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )
            ) : sidebarOpen ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          {links.map((link) => {
            const isActive =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                title={!sidebarOpen ? link.label : undefined}
                className={`
                  flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
                  text-sm font-semibold transition-all duration-150
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                <link.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </aside>

        {/* ── Page content ── */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AdminLangContext.Provider value={{ lang, isRtl }}>{children}</AdminLangContext.Provider>
        </main>
      </div>

      <Footer lang={lang} />
    </div>
  );
}

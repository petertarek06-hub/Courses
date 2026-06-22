'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  TrendingUp,
  LogIn,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────
interface CourseInfo {
  id: string; // "course-12" format
  nameAr: string;
  nameEn: string;
  subjectAr: string;
  subjectEn: string;
  price: number;
  color: string; // e.g. "bg-primary/10 text-primary"
}

interface Props {
  course: CourseInfo | null; // null = modal closed
  lang: 'ar' | 'en';
  onClose: () => void;
  onEnrolled: (courseId: string) => void; // called after successful enroll
}

// ── i18n ────────────────────────────────────────────────────────
const t = {
  ar: {
    title: 'الاشتراك في الكورس',
    subject: 'المادة',
    price: 'سعر الكورس',
    balance: 'رصيدك الحالي',
    remaining: 'الرصيد بعد الاشتراك',
    insufficient: 'رصيدك غير كافٍ',
    insufficientHint: 'تواصل مع الإدارة لشحن رصيدك أو ادفع نقداً',
    confirm: 'تأكيد الاشتراك',
    confirming: 'جارٍ الاشتراك…',
    cancel: 'إلغاء',
    free: 'مجاني',
    egp: 'ج.م',
    successTitle: 'تم الاشتراك بنجاح! 🎉',
    successSub: 'يمكنك الآن متابعة دروس الكورس',
    goToCourse: 'ابدأ التعلم الآن',
    notLoggedIn: 'يجب تسجيل الدخول أولاً',
    notLoggedInHint: 'سجّل دخولك لتتمكن من الاشتراك في الكورس',
    login: 'تسجيل الدخول',
    errorGeneric: 'حدث خطأ، حاول مجدداً',
  },
  en: {
    title: 'Enroll in Course',
    subject: 'Subject',
    price: 'Course Price',
    balance: 'Your Balance',
    remaining: 'Balance After Enroll',
    insufficient: 'Insufficient Balance',
    insufficientHint: 'Contact admin to top up your balance or pay in cash',
    confirm: 'Confirm Enrollment',
    confirming: 'Enrolling…',
    cancel: 'Cancel',
    free: 'Free',
    egp: 'EGP',
    successTitle: 'Enrolled Successfully! 🎉',
    successSub: 'You can now access all course lessons',
    goToCourse: 'Start Learning',
    notLoggedIn: 'Login Required',
    notLoggedInHint: 'Please log in to enroll in this course',
    login: 'Log In',
    errorGeneric: 'Something went wrong, please try again',
  },
};

// ── Helpers ─────────────────────────────────────────────────────
function fmt(n: number, lang: 'ar' | 'en') {
  return lang === 'ar' ? `${n} ج.م` : `${n} EGP`;
}

type Phase = 'loading' | 'guest' | 'confirm' | 'enrolling' | 'success' | 'error';

// ── Component ───────────────────────────────────────────────────
export default function EnrollModal({ course, lang, onClose, onEnrolled }: Props) {
  const tx = t[lang];
  const isRtl = lang === 'ar';
  const fontStyle = isRtl ? { fontFamily: 'var(--font-cairo)' } : {};

  const [phase, setPhase] = useState<Phase>('loading');
  const [balance, setBalance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current user balance when modal opens
  useEffect(() => {
    if (!course) return;
    setPhase('loading');
    setErrorMsg('');

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          setPhase('guest');
        } else {
          setBalance(data.user.balance ?? 0);
          setPhase('confirm');
        }
      })
      .catch(() => setPhase('guest'));
  }, [course]);

  const handleEnroll = useCallback(async () => {
    if (!course) return;
    setPhase('enrolling');
    const courseId = course.id.replace('course-', '');

    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: Number(courseId) }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setPhase('success');
        onEnrolled(course.id);
      } else if (data.error === 'insufficient_balance') {
        setBalance(data.balance ?? 0);
        setPhase('confirm'); // stay on confirm, canEnroll will be false
      } else {
        setErrorMsg(data.error ?? tx.errorGeneric);
        setPhase('error');
      }
    } catch {
      setErrorMsg(tx.errorGeneric);
      setPhase('error');
    }
  }, [course, onEnrolled, tx.errorGeneric]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!course) return null;

  const price = course.price;
  const isFree = price === 0;
  const canEnroll = isFree || balance >= price;
  const remaining = balance - price;
  const courseId = course.id.replace('course-', '');
  const courseName = isRtl ? course.nameAr : course.nameEn;
  const accentBg = course.color.split(' ')[0];
  const accentText = course.color.split(' ')[1];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Card */}
      <div
        className="relative bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={fontStyle}
      >
        {/* Coloured top stripe */}
        <div className={`h-1.5 w-full ${accentBg}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="close"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-foreground mb-1" style={fontStyle}>
              {tx.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2" style={fontStyle}>
              {courseName}
            </p>
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${accentBg} ${accentText}`}
              style={fontStyle}
            >
              {isRtl ? course.subjectAr : course.subjectEn}
            </span>
          </div>

          {/* ── LOADING ── */}
          {phase === 'loading' && (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {/* ── GUEST ── */}
          {phase === 'guest' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn size={26} className="text-primary" />
              </div>
              <p className="font-bold text-foreground mb-1" style={fontStyle}>
                {tx.notLoggedIn}
              </p>
              <p className="text-sm text-muted-foreground mb-5" style={fontStyle}>
                {tx.notLoggedInHint}
              </p>
              <a
                href="/sign-up-login-screen"
                className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center hover:bg-primary/90 transition-colors"
                style={fontStyle}
              >
                {tx.login}
              </a>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {(phase === 'confirm' || phase === 'enrolling') && (
            <>
              {/* Price / Balance rows */}
              <div className="rounded-2xl bg-muted/50 divide-y divide-border overflow-hidden mb-5">
                {/* Course price */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    style={fontStyle}
                  >
                    <BookOpen size={15} className="text-primary" />
                    {tx.price}
                  </div>
                  <span className="font-extrabold text-foreground text-sm" style={fontStyle}>
                    {isFree ? tx.free : fmt(price, lang)}
                  </span>
                </div>

                {/* Balance (only for paid courses) */}
                {!isFree && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        style={fontStyle}
                      >
                        <Wallet size={15} className="text-secondary" />
                        {tx.balance}
                      </div>
                      <span
                        className={`font-extrabold text-sm ${canEnroll ? 'text-secondary' : 'text-destructive'}`}
                        style={fontStyle}
                      >
                        {fmt(balance, lang)}
                      </span>
                    </div>

                    {/* Remaining after enroll */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        style={fontStyle}
                      >
                        <TrendingUp size={15} className="text-accent" />
                        {tx.remaining}
                      </div>
                      <span
                        className={`font-extrabold text-sm ${canEnroll ? 'text-foreground' : 'text-destructive'}`}
                        style={fontStyle}
                      >
                        {canEnroll ? fmt(remaining, lang) : '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Insufficient balance warning */}
              {!isFree && !canEnroll && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive mb-5">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold" style={fontStyle}>
                      {tx.insufficient}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80" style={fontStyle}>
                      {tx.insufficientHint}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={phase === 'enrolling'}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-muted-foreground text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50"
                  style={fontStyle}
                >
                  {tx.cancel}
                </button>

                <button
                  onClick={handleEnroll}
                  disabled={(!canEnroll && !isFree) || phase === 'enrolling'}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={fontStyle}
                >
                  {phase === 'enrolling' ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {tx.confirming}
                    </>
                  ) : (
                    tx.confirm
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── SUCCESS ── */}
          {phase === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-secondary" />
              </div>
              <p className="font-extrabold text-foreground text-lg mb-1" style={fontStyle}>
                {tx.successTitle}
              </p>
              <p className="text-sm text-muted-foreground mb-6" style={fontStyle}>
                {tx.successSub}
              </p>
              <a
                href={`/student-dashboard/courses/${courseId}/lessons`}
                className="block w-full py-3 rounded-xl bg-secondary text-white font-bold text-sm text-center hover:bg-secondary/90 transition-colors"
                style={fontStyle}
              >
                {tx.goToCourse}
              </a>
            </div>
          )}

          {/* ── ERROR ── */}
          {phase === 'error' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-destructive" />
              </div>
              <p className="font-bold text-foreground mb-1" style={fontStyle}>
                {tx.errorGeneric}
              </p>
              <p className="text-xs text-muted-foreground mb-5" style={fontStyle}>
                {errorMsg}
              </p>
              <button
                onClick={() => setPhase('confirm')}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
                style={fontStyle}
              >
                {isRtl ? 'حاول مجدداً' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

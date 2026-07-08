// src/app/sign-up-login-screen/components/LoginForm.tsx
'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { notifySuccess } from '@/lib/notify';

interface Props {
  lang: 'ar' | 'en';
  onSwitchToRegister: () => void;
}

interface LoginData {
  phone: string;
  password: string;
  remember: boolean;
}

const content = {
  ar: {
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: '01xxxxxxxxx',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    remember: 'تذكرني',
    submit: 'تسجيل الدخول',
    loading: 'جارٍ الدخول...',
    noAccount: 'ليس لديك حساب؟',
    register: 'سجّل الآن',
    successMsg: 'تم تسجيل الدخول بنجاح! 🎉',
    errorMsg: 'بيانات غير صحيحة',
    phoneRequired: 'رقم الهاتف مطلوب',
    phonePattern: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMin: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', // ✅ Fixed: was 6
  },
  en: {
    phoneLabel: 'Phone Number',
    phonePlaceholder: '01xxxxxxxxx',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    remember: 'Remember me',
    submit: 'Sign In',
    loading: 'Signing in...',
    noAccount: "Don't have an account?",
    register: 'Register Now',
    successMsg: 'Signed in successfully! 🎉',
    errorMsg: 'Invalid credentials',
    phoneRequired: 'Phone number is required',
    phonePattern: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
    passwordRequired: 'Password is required',
    passwordMin: 'Password must be at least 8 characters', // ✅ Fixed: was 6
  },
};

export default function LoginForm({ lang, onSwitchToRegister }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = content[lang];
  const isRtl = lang === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginData>({ defaultValues: { remember: false } });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError('phone', { message: result.error });
      } else {
        notifySuccess(t.successMsg);
        if (result.role === 'admin') {
          window.location.href = '/admin';
        } else if (result.role === 'teacher') {
          window.location.href = '/teacher-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }
      }
    } catch {
      setError('phone', { message: t.errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.phoneLabel}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
            <Phone size={16} className="text-muted-foreground" />
          </span>
          <input
            {...register('phone', {
              required: t.phoneRequired,
              pattern: { value: /^01[0-9]{9}$/, message: t.phonePattern },
            })}
            type="tel"
            placeholder={t.phonePlaceholder}
            dir="ltr"
            className={`w-full ps-10 pe-4 py-3 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${
              errors.phone ? 'border-red-400 focus:ring-red-200' : 'border-border'
            }`}
          />
        </div>
        {errors.phone && (
          <p
            className="text-red-500 text-xs mt-0.5"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.passwordLabel}
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: t.passwordRequired,
              minLength: { value: 8, message: t.passwordMin }, // ✅ Fixed: was 6
            })}
            type={showPassword ? 'text' : 'password'}
            placeholder={t.passwordPlaceholder}
            dir="ltr"
            className={`w-full ps-4 pe-10 py-3 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground transition-all duration-150 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${
              errors.password ? 'border-red-400 focus:ring-red-200' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p
            className="text-red-500 text-xs mt-0.5"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          {...register('remember')}
          type="checkbox"
          className="w-4 h-4 rounded border-border accent-primary"
        />
        <span
          className="text-sm text-muted-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.remember}
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-md hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t.loading}
          </>
        ) : (
          t.submit
        )}
      </button>

      {/* Switch to register */}
      <p
        className="text-center text-sm text-muted-foreground"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.noAccount}{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary font-bold hover:underline"
        >
          {t.register}
        </button>
      </p>
    </form>
  );
}

//src/app/sign-up-login-screen/components/RegiserForm.tsx
'use client';
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, User, Phone, Mail, GraduationCap, Camera, X } from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notify';

interface Props {
  lang: 'ar' | 'en';
  onSwitchToLogin: () => void;
}

interface RegisterData {
  fullName: string;
  phone: string;
  email?: string;
  academicYear: string;
  password: string;
  confirmPassword: string;
}

const academicYears = [
  { value: 'grade-1', labelAr: 'الصف الأول الابتدائي', labelEn: 'Grade 1 — Primary' },
  { value: 'grade-2', labelAr: 'الصف الثاني الابتدائي', labelEn: 'Grade 2 — Primary' },
  { value: 'grade-3', labelAr: 'الصف الثالث الابتدائي', labelEn: 'Grade 3 — Primary' },
  { value: 'grade-4', labelAr: 'الصف الرابع الابتدائي', labelEn: 'Grade 4 — Primary' },
  { value: 'grade-5', labelAr: 'الصف الخامس الابتدائي', labelEn: 'Grade 5 — Primary' },
  { value: 'grade-6', labelAr: 'الصف السادس الابتدائي', labelEn: 'Grade 6 — Primary' },
  { value: 'grade-7', labelAr: 'الصف الأول الإعدادي', labelEn: 'Grade 7 — Middle' },
  { value: 'grade-8', labelAr: 'الصف الثاني الإعدادي', labelEn: 'Grade 8 — Middle' },
  { value: 'grade-9', labelAr: 'الصف الثالث الإعدادي', labelEn: 'Grade 9 — Middle' },
  { value: 'grade-10', labelAr: 'الصف الأول الثانوي', labelEn: 'Grade 10 — High School' },
  { value: 'grade-11', labelAr: 'الصف الثاني الثانوي', labelEn: 'Grade 11 — High School' },
  { value: 'grade-12', labelAr: 'الصف الثالث الثانوي', labelEn: 'Grade 12 — High School' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

const content = {
  ar: {
    avatarLabel: 'الصورة الشخصية',
    avatarHint: 'اختياري • JPG أو PNG أو WEBP • حتى 3 ميغا',
    avatarAdd: 'إضافة صورة',
    avatarChange: 'تغيير',
    avatarRemove: 'إزالة',
    avatarTypeError: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.',
    avatarSizeError: 'حجم الصورة يتجاوز 3 ميغابايت.',
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'أدخل اسمك الكامل',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: '01xxxxxxxxx',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    emailPlaceholder: 'example@email.com',
    yearLabel: 'الصف الدراسي',
    yearPlaceholder: 'اختر صفك الدراسي',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أنشئ كلمة مرور قوية',
    confirmLabel: 'تأكيد كلمة المرور',
    confirmPlaceholder: 'أعد إدخال كلمة المرور',
    submit: 'إنشاء الحساب',
    loading: 'جارٍ التسجيل...',
    hasAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    successMsg: 'تم إنشاء حسابك بنجاح! 🎉 يمكنك الآن تسجيل الدخول.',
    nameRequired: 'الاسم الكامل مطلوب',
    nameMin: 'الاسم يجب أن يكون 3 أحرف على الأقل',
    phoneRequired: 'رقم الهاتف مطلوب',
    phonePattern: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)',
    emailPattern: 'أدخل بريداً إلكترونياً صحيحاً',
    yearRequired: 'اختيار الصف الدراسي مطلوب',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMin: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    confirmRequired: 'تأكيد كلمة المرور مطلوب',
    confirmMatch: 'كلمتا المرور غير متطابقتين',
    terms: 'بالتسجيل، أوافق على شروط الاستخدام وسياسة الخصوصية',
  },
  en: {
    avatarLabel: 'Profile Picture',
    avatarHint: 'Optional • JPG, PNG or WEBP • Max 3 MB',
    avatarAdd: 'Add Photo',
    avatarChange: 'Change',
    avatarRemove: 'Remove',
    avatarTypeError: 'Unsupported file type. Use JPG, PNG, or WEBP.',
    avatarSizeError: 'Image exceeds the 3 MB limit.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '01xxxxxxxxx',
    emailLabel: 'Email Address (Optional)',
    emailPlaceholder: 'example@email.com',
    yearLabel: 'Academic Year',
    yearPlaceholder: 'Select your grade',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a strong password',
    confirmLabel: 'Confirm Password',
    confirmPlaceholder: 'Re-enter your password',
    submit: 'Create Account',
    loading: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Sign In',
    successMsg: 'Account created successfully! 🎉 You can now sign in.',
    nameRequired: 'Full name is required',
    nameMin: 'Name must be at least 3 characters',
    phoneRequired: 'Phone number is required',
    phonePattern: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
    emailPattern: 'Enter a valid email address',
    yearRequired: 'Academic year selection is required',
    passwordRequired: 'Password is required',
    passwordMin: 'Password must be at least 8 characters',
    confirmRequired: 'Password confirmation is required',
    confirmMatch: 'Passwords do not match',
    terms: 'By registering, I agree to the Terms of Service and Privacy Policy',
  },
};

export default function RegisterForm({ lang, onSwitchToLogin }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Avatar state ──────────────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = content[lang];
  const isRtl = lang === 'ar';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData>();

  const password = watch('password');

  // ── Avatar handlers ───────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      notifyError(t.avatarTypeError);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      notifyError(t.avatarSizeError);
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────
  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // Use FormData so the avatar binary can travel alongside text fields
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('phone', data.phone);
      if (data.email) formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('academicYear', data.academicYear);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        // ⚠️ Do NOT set Content-Type — browser sets it automatically with the correct boundary
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        notifyError(result.error);
      } else {
        notifySuccess(t.successMsg);
        if (result.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }
    } catch {
      notifyError(lang === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Avatar Picker ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.avatarLabel}
        </label>

        <div className="flex items-center gap-4">
          {/* Circle preview / placeholder */}
          <div
            className="relative shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer group transition-all duration-200 hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
            title={avatarPreview ? t.avatarChange : t.avatarAdd}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-muted-foreground" />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
              <Camera size={20} className="text-white" />
            </div>
          </div>

          {/* Right-side controls */}
          <div className="flex flex-col gap-2">
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {avatarPreview ? t.avatarChange : t.avatarAdd}
            </button>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-150"
                style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
              >
                <X size={13} />
                {t.avatarRemove}
              </button>
            )}

            <p
              className="text-xs text-muted-foreground leading-snug"
              style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
            >
              {t.avatarHint}
            </p>
          </div>
        </div>
      </div>

      {/* ── Full Name ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.nameLabel}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
            <User size={15} className="text-muted-foreground" />
          </span>
          <input
            {...register('fullName', {
              required: t.nameRequired,
              minLength: { value: 3, message: t.nameMin },
            })}
            type="text"
            placeholder={t.namePlaceholder}
            className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              errors.fullName ? 'border-red-400' : 'border-border'
            }`}
          />
        </div>
        {errors.fullName && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* ── Phone ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.phoneLabel}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
            <Phone size={15} className="text-muted-foreground" />
          </span>
          <input
            {...register('phone', {
              required: t.phoneRequired,
              pattern: { value: /^01[0-9]{9}$/, message: t.phonePattern },
            })}
            type="tel"
            placeholder={t.phonePlaceholder}
            dir="ltr"
            className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              errors.phone ? 'border-red-400' : 'border-border'
            }`}
          />
        </div>
        {errors.phone && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* ── Email (optional) ───────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.emailLabel}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
            <Mail size={15} className="text-muted-foreground" />
          </span>
          <input
            {...register('email', {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.emailPattern },
            })}
            type="email"
            placeholder={t.emailPlaceholder}
            dir="ltr"
            className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              errors.email ? 'border-red-400' : 'border-border'
            }`}
          />
        </div>
        {errors.email && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* ── Academic Year ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.yearLabel}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
            <GraduationCap size={15} className="text-muted-foreground" />
          </span>
          <select
            {...register('academicYear', { required: t.yearRequired })}
            className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 appearance-none cursor-pointer ${
              errors.academicYear ? 'border-red-400' : 'border-border'
            }`}
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            <option value="">{t.yearPlaceholder}</option>
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>
                {isRtl ? year.labelAr : year.labelEn}
              </option>
            ))}
          </select>
        </div>
        {errors.academicYear && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.academicYear.message}
          </p>
        )}
      </div>

      {/* ── Password ───────────────────────────────────────────── */}
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
              minLength: { value: 8, message: t.passwordMin },
            })}
            type={showPassword ? 'text' : 'password'}
            placeholder={t.passwordPlaceholder}
            dir="ltr"
            className={`w-full ps-4 pe-10 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              errors.password ? 'border-red-400' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ── Confirm Password ───────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
        >
          {t.confirmLabel}
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword', {
              required: t.confirmRequired,
              validate: (val) => val === password || t.confirmMatch,
            })}
            type={showConfirm ? 'text' : 'password'}
            placeholder={t.confirmPlaceholder}
            dir="ltr"
            className={`w-full ps-4 pe-10 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              errors.confirmPassword ? 'border-red-400' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p
            className="text-red-500 text-xs"
            style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* ── Terms ─────────────────────────────────────────────── */}
      <p
        className="text-xs text-muted-foreground leading-relaxed"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.terms}
      </p>

      {/* ── Submit ────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-base shadow-md hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* ── Switch to login ───────────────────────────────────── */}
      <p
        className="text-center text-sm text-muted-foreground"
        style={{ fontFamily: isRtl ? 'var(--font-cairo)' : undefined }}
      >
        {t.hasAccount}{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary font-bold hover:underline"
        >
          {t.login}
        </button>
      </p>
    </form>
  );
}

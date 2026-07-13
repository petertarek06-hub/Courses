'use client';
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone,
  Mail,
  GraduationCap,
  Camera,
  X,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notify';

interface Profile {
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  academicYear: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  profile: Profile;
}

interface FormData {
  fullName: string;
  phone: string;
  email?: string;
  academicYear: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
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
const MAX_SIZE_BYTES = 3 * 1024 * 1024;

const content = {
  ar: {
    title: 'تعديل البيانات الشخصية',
    avatarLabel: 'الصورة الشخصية',
    avatarChange: 'تغيير',
    avatarAdd: 'إضافة صورة',
    avatarRemove: 'إزالة',
    avatarTypeError: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.',
    avatarSizeError: 'حجم الصورة يتجاوز 3 ميغابايت.',
    nameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف',
    phoneHint: 'تغيير رقم الهاتف يتطلب تسجيل الدخول مرة أخرى',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    yearLabel: 'الصف الدراسي',
    changePassword: 'تغيير كلمة المرور',
    currentPasswordLabel: 'كلمة المرور الحالية',
    currentPasswordHint: 'مطلوبة عند تغيير رقم الهاتف أو كلمة المرور',
    newPasswordLabel: 'كلمة المرور الجديدة',
    confirmNewPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    nameRequired: 'الاسم الكامل مطلوب',
    nameMin: 'الاسم يجب أن يكون 3 أحرف على الأقل',
    phoneRequired: 'رقم الهاتف مطلوب',
    phonePattern: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)',
    emailPattern: 'أدخل بريداً إلكترونياً صحيحاً',
    yearRequired: 'اختيار الصف الدراسي مطلوب',
    passwordMin: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    confirmMatch: 'كلمتا المرور غير متطابقتين',
    currentPasswordRequired: 'يجب إدخال كلمة المرور الحالية لتأكيد هذا التغيير',
    successMsg: 'تم حفظ التغييرات بنجاح',
    relogInMsg: 'تم تحديث رقم الهاتف، يرجى تسجيل الدخول مرة أخرى',
    genericError: 'حدث خطأ، حاول مرة أخرى',
  },
  en: {
    title: 'Edit Profile',
    avatarLabel: 'Profile Picture',
    avatarChange: 'Change',
    avatarAdd: 'Add Photo',
    avatarRemove: 'Remove',
    avatarTypeError: 'Unsupported file type. Use JPG, PNG, or WEBP.',
    avatarSizeError: 'Image exceeds the 3 MB limit.',
    nameLabel: 'Full Name',
    phoneLabel: 'Phone Number',
    phoneHint: 'Changing your phone number requires signing in again',
    emailLabel: 'Email Address (Optional)',
    yearLabel: 'Academic Year',
    changePassword: 'Change Password',
    currentPasswordLabel: 'Current Password',
    currentPasswordHint: 'Required when changing phone number or password',
    newPasswordLabel: 'New Password',
    confirmNewPasswordLabel: 'Confirm New Password',
    save: 'Save Changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    nameRequired: 'Full name is required',
    nameMin: 'Name must be at least 3 characters',
    phoneRequired: 'Phone number is required',
    phonePattern: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
    emailPattern: 'Enter a valid email address',
    yearRequired: 'Academic year selection is required',
    passwordMin: 'Password must be at least 8 characters',
    confirmMatch: 'Passwords do not match',
    currentPasswordRequired: 'You must enter your current password to confirm this change',
    successMsg: 'Changes saved successfully',
    relogInMsg: 'Phone number updated — please sign in again',
    genericError: 'Something went wrong, please try again',
  },
};

export default function EditProfileModal({ open, onClose, lang, profile }: Props) {
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email ?? '',
      academicYear: profile.academicYear ?? '',
    },
  });

  const phoneValue = watch('phone');
  const newPasswordValue = watch('newPassword');
  const phoneChanged = phoneValue !== profile.phone;
  const needsCurrentPassword = phoneChanged || !!newPasswordValue;

  if (!open) return null;

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
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    if (needsCurrentPassword && !data.currentPassword) {
      notifyError(t.currentPasswordRequired);
      return;
    }
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
      notifyError(t.confirmMatch);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('phone', data.phone);
      if (data.email) formData.append('email', data.email);
      formData.append('academicYear', data.academicYear);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (data.currentPassword) formData.append('currentPassword', data.currentPassword);
      if (data.newPassword) formData.append('newPassword', data.newPassword);

      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) {
        notifyError(result.error || t.genericError);
        setIsLoading(false);
        return;
      }

      notifySuccess(result.requireRelogin ? t.relogInMsg : t.successMsg);
      // Reloading re-runs middleware: if the phone changed, the cookie was
      // already cleared server-side, so this naturally lands on the login
      // screen. Otherwise it just refreshes the header/dashboard with the
      // freshly issued cookie and updated data.
      window.location.reload();
    } catch {
      notifyError(t.genericError);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-card rounded-2xl border border-border card-shadow w-full max-w-lg max-h-[90vh] overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: font }}>
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-6 py-5">
          {/* Avatar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
              {t.avatarLabel}
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer group transition-all duration-200 hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
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
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                  <Camera size={20} className="text-white" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
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
                  style={{ fontFamily: font }}
                >
                  {avatarPreview ? t.avatarChange : t.avatarAdd}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-150"
                    style={{ fontFamily: font }}
                  >
                    <X size={13} />
                    {t.avatarRemove}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
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
                className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
                  errors.fullName ? 'border-red-400' : 'border-border'
                }`}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
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
                dir="ltr"
                className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
                  errors.phone ? 'border-red-400' : 'border-border'
                }`}
              />
            </div>
            {errors.phone ? (
              <p className="text-red-500 text-xs">{errors.phone.message}</p>
            ) : phoneChanged ? (
              <p className="text-amber-600 text-xs" style={{ fontFamily: font }}>
                {t.phoneHint}
              </p>
            ) : null}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
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
                dir="ltr"
                className={`w-full ps-9 pe-4 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
                  errors.email ? 'border-red-400' : 'border-border'
                }`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          {/* Academic Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
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
                style={{ fontFamily: font }}
              >
                {academicYears.map((year) => (
                  <option key={year.value} value={year.value}>
                    {isRtl ? year.labelAr : year.labelEn}
                  </option>
                ))}
              </select>
            </div>
            {errors.academicYear && (
              <p className="text-red-500 text-xs">{errors.academicYear.message}</p>
            )}
          </div>

          {/* Change Password toggle */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center justify-between w-full text-sm font-bold text-foreground"
              style={{ fontFamily: font }}
            >
              <span className="flex items-center gap-2">
                <Lock size={15} className="text-primary" />
                {t.changePassword}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showPasswordSection ? 'rotate-180' : ''}`}
              />
            </button>

            {showPasswordSection && (
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold text-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      {...register('newPassword', {
                        minLength: { value: 8, message: t.passwordMin },
                      })}
                      type={showNew ? 'text' : 'password'}
                      dir="ltr"
                      className={`w-full ps-4 pe-10 py-2.5 rounded-xl border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
                        errors.newPassword ? 'border-red-400' : 'border-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold text-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.confirmNewPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmNewPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      dir="ltr"
                      className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
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
                </div>
              </div>
            )}
          </div>

          {/* Current password — shown whenever a sensitive change is pending */}
          {needsCurrentPassword && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <label className="text-xs font-semibold text-foreground" style={{ fontFamily: font }}>
                {t.currentPasswordLabel}
              </label>
              <p className="text-[11px] text-amber-700" style={{ fontFamily: font }}>
                {t.currentPasswordHint}
              </p>
              <div className="relative">
                <input
                  {...register('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-all duration-150"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontFamily: font }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

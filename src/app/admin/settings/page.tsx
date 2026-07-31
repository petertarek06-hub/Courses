// src/app/admin/settings/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Save,
  Pencil,
  X,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Loader2,
  Building2,
  Megaphone,
  Image as ImageIcon,
  Trash2,
  Upload,
} from 'lucide-react';
import { Facebook, Instagram, Youtube } from '@/components/ui/BrandIcons';
import { toast } from 'sonner';

interface CenterSettings {
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

const content = {
  ar: {
    title: 'الإعدادات',
    centerDetails: 'بيانات المركز',
    siteName: 'اسم الموقع',
    siteNamePlaceholder: 'EduCenter',
    siteDesc: 'وصف الموقع',
    siteDescPlaceholder: 'منصة تعليمية متكاملة',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'info@educenter.eg',
    phone: 'رقم الهاتف',
    phonePlaceholder: '01xxxxxxxxx',
    whatsapp: 'رقم واتساب الدعم',
    whatsappPlaceholder: '01xxxxxxxxx',
    address: 'العنوان',
    addressPlaceholder: 'المحافظة، المنطقة، الشارع',
    facebook: 'فيسبوك',
    instagram: 'انستجرام',
    youtube: 'يوتيوب',
    urlPlaceholder: 'https://',
    whatsappBtnLabel: 'نص زر واتساب في الفوتر',
    whatsappBtnLabelPlaceholder: 'واتساب لويدا علي',
    copyrightText: 'نص حقوق النشر',
    copyrightTextPlaceholder: '© 2026 إيدو سنتر. جميع الحقوق محفوظة.',
    edit: 'تعديل البيانات',
    cancel: 'إلغاء',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    savedMsg: 'تم حفظ البيانات بنجاح!',
    errorMsg: 'حدث خطأ، حاول مرة أخرى',
    notSet: 'غير محدد',
    loading: 'جارٍ التحميل...',
    // ── Special offer ──
    offerSectionTitle: 'العرض الخاص',
    offerEnabledLabel: 'تفعيل ظهور العرض في الفوتر',
    offerEnabledBadge: 'مفعل',
    offerDisabledBadge: 'غير مفعل',
    offerTitleLabel: 'عنوان العرض',
    offerTitlePlaceholder: 'خصم 20% على جميع الكورسات',
    offerTextLabel: 'وصف العرض',
    offerTextPlaceholder: 'استخدم الكود SUMMER20 قبل نهاية الشهر',
    offerImageLabel: 'صورة العرض',
    uploadImage: 'رفع صورة',
    changeImage: 'تغيير الصورة',
    removeImage: 'حذف الصورة',
    uploadingImage: 'جارٍ رفع الصورة...',
    noImage: 'لم يتم اختيار صورة',
    offerEmptyNote: 'أضف عنوانًا أو نصًا أو صورة ليظهر العرض في الفوتر',
    imageErrorMsg: 'تعذر رفع الصورة، حاول مرة أخرى',
  },
  en: {
    title: 'Settings',
    centerDetails: 'Center Details',
    siteName: 'Site Name',
    siteNamePlaceholder: 'EduCenter',
    siteDesc: 'Site Description',
    siteDescPlaceholder: 'A complete educational platform',
    email: 'Email',
    emailPlaceholder: 'info@educenter.eg',
    phone: 'Phone Number',
    phonePlaceholder: '01xxxxxxxxx',
    whatsapp: 'Support WhatsApp Number',
    whatsappPlaceholder: '01xxxxxxxxx',
    address: 'Address',
    addressPlaceholder: 'Governorate, area, street',
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    urlPlaceholder: 'https://',
    whatsappBtnLabel: 'Footer WhatsApp Button Text',
    whatsappBtnLabelPlaceholder: 'WhatsApp Support',
    copyrightText: 'Copyright Text',
    copyrightTextPlaceholder: '© 2026 EduCenter. All rights reserved.',
    edit: 'Edit Details',
    cancel: 'Cancel',
    save: 'Save Changes',
    saving: 'Saving...',
    savedMsg: 'Details saved successfully!',
    errorMsg: 'Something went wrong, please try again',
    notSet: 'Not set',
    loading: 'Loading...',
    // ── Special offer ──
    offerSectionTitle: 'Special Offer',
    offerEnabledLabel: 'Show offer in footer',
    offerEnabledBadge: 'Enabled',
    offerDisabledBadge: 'Disabled',
    offerTitleLabel: 'Offer Title',
    offerTitlePlaceholder: '20% off all courses',
    offerTextLabel: 'Offer Description',
    offerTextPlaceholder: 'Use code SUMMER20 before the end of the month',
    offerImageLabel: 'Offer Image',
    uploadImage: 'Upload Image',
    changeImage: 'Change Image',
    removeImage: 'Remove Image',
    uploadingImage: 'Uploading image...',
    noImage: 'No image selected',
    offerEmptyNote: 'Add a title, text, or image so the offer appears in the footer',
    imageErrorMsg: 'Could not upload the image, please try again',
  },
};

const EMPTY_FORM: CenterSettings = {
  siteName: 'EduCenter',
  siteDescription: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  address: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  whatsappButtonLabel: '',
  copyrightText: '',
  offerEnabled: false,
  offerTitle: '',
  offerText: '',
  offerImageUrl: '',
};

function InfoRow({
  icon: Icon,
  label,
  value,
  notSetLabel,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  notSetLabel: string;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary hover:underline break-all"
              dir="ltr"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm font-bold text-foreground break-words" dir="ltr">
              {value}
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground italic">{notSetLabel}</p>
        )}
      </div>
    </div>
  );
}

// Small pill toggle switch - مطابق تماماً لتصميم صفحة المدرسين
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 ${
        checked
          ? 'bg-primary shadow-lg shadow-primary/30'
          : 'bg-blue-200 dark:bg-blue-900/40 hover:bg-blue-300 dark:hover:bg-blue-800/50'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
          checked
            ? 'left-[18px] sm:left-[22px] rtl:right-[18px] rtl:sm:right-[22px]'
            : 'left-0.5 rtl:right-0.5'
        }`}
      />
    </div>
  );
}
export default function AdminSettingsPage() {
  const [lang] = useState<'ar' | 'en'>('ar');
  const isRtl = lang === 'ar';
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [loading, setLoading] = useState(true);

  // ── Center Details editing state ──
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Special Offer editing state (independent card) ──
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [isSavingOffer, setIsSavingOffer] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<CenterSettings>(EMPTY_FORM);
  const [form, setForm] = useState<CenterSettings>(EMPTY_FORM);
  const [offerForm, setOfferForm] =
    useState<Pick<CenterSettings, 'offerEnabled' | 'offerTitle' | 'offerText'>>(EMPTY_FORM);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings(data);
          setForm(data);
          setOfferForm(data);
        }
      })
      .catch(() => toast.error(t.errorMsg))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Center Details handlers ──
  const startEditing = () => {
    setForm(settings);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(settings);
    setIsEditing(false);
  };

  const handleChange = (field: keyof CenterSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: form.siteName,
          siteDescription: form.siteDescription,
          email: form.email,
          phone: form.phone,
          whatsappNumber: form.whatsappNumber,
          address: form.address,
          facebookUrl: form.facebookUrl,
          instagramUrl: form.instagramUrl,
          youtubeUrl: form.youtubeUrl,
          whatsappButtonLabel: form.whatsappButtonLabel,
          copyrightText: form.copyrightText,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      setForm(updated);
      setIsEditing(false);
      toast.success(t.savedMsg);
    } catch {
      toast.error(t.errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Special Offer handlers ──
  const startEditingOffer = () => {
    setOfferForm(settings);
    setIsEditingOffer(true);
  };

  const cancelEditingOffer = () => {
    setOfferForm(settings);
    setIsEditingOffer(false);
  };

  const handleOfferChange = (field: 'offerTitle' | 'offerText', value: string) => {
    setOfferForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfferToggle = (value: boolean) => {
    setOfferForm((prev) => ({ ...prev, offerEnabled: value }));
  };

  const handleSaveOffer = async () => {
    setIsSavingOffer(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerEnabled: offerForm.offerEnabled,
          offerTitle: offerForm.offerTitle,
          offerText: offerForm.offerText,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      setForm(updated);
      setOfferForm(updated);
      setIsEditingOffer(false);
      toast.success(t.savedMsg);
    } catch {
      toast.error(t.errorMsg);
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input value so selecting the same file again still fires onChange
    e.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/settings/offer-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      setForm(updated);
      setOfferForm(updated);
      toast.success(t.savedMsg);
    } catch {
      toast.error(t.imageErrorMsg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    setIsUploadingImage(true);
    try {
      const res = await fetch('/api/admin/settings/offer-image', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      setForm(updated);
      setOfferForm(updated);
      toast.success(t.savedMsg);
    } catch {
      toast.error(t.imageErrorMsg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="flex-1 p-6 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-foreground mb-6" style={{ fontFamily: font }}>
          {t.title}
        </h1>

        {/* ── Center Details card ── */}
        <div className="bg-card rounded-2xl border border-border card-shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
                {t.centerDetails}
              </h2>
            </div>

            {!isEditing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary transition-all"
                style={{ fontFamily: font }}
              >
                <Pencil size={13} />
                {t.edit}
              </button>
            )}
          </div>

          {!isEditing ? (
            /* ── Read-only display ── */
            <div className="mt-2">
              <div className="pb-3 mb-1 border-b border-border">
                <p className="text-lg font-extrabold text-foreground" style={{ fontFamily: font }}>
                  {settings.siteName}
                </p>
                {settings.siteDescription && (
                  <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: font }}>
                    {settings.siteDescription}
                  </p>
                )}
              </div>

              <InfoRow icon={Phone} label={t.phone} value={settings.phone} notSetLabel={t.notSet} />
              <InfoRow icon={Mail} label={t.email} value={settings.email} notSetLabel={t.notSet} />
              <InfoRow
                icon={MessageCircle}
                label={t.whatsapp}
                value={settings.whatsappNumber}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={MapPin}
                label={t.address}
                value={settings.address}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={Facebook}
                label={t.facebook}
                value={settings.facebookUrl}
                href={settings.facebookUrl}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={Instagram}
                label={t.instagram}
                value={settings.instagramUrl}
                href={settings.instagramUrl}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={Youtube}
                label={t.youtube}
                value={settings.youtubeUrl}
                href={settings.youtubeUrl}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={MessageCircle}
                label={t.whatsappBtnLabel}
                value={settings.whatsappButtonLabel}
                notSetLabel={t.notSet}
              />
              <InfoRow
                icon={Building2}
                label={t.copyrightText}
                value={settings.copyrightText}
                notSetLabel={t.notSet}
              />
            </div>
          ) : (
            /* ── Edit form ── */
            <div className="flex flex-col gap-4 mt-3">
              <Field
                label={t.siteName}
                value={form.siteName}
                placeholder={t.siteNamePlaceholder}
                onChange={(v) => handleChange('siteName', v)}
                font={font}
              />
              <Field
                label={t.siteDesc}
                value={form.siteDescription ?? ''}
                placeholder={t.siteDescPlaceholder}
                onChange={(v) => handleChange('siteDescription', v)}
                font={font}
                textarea
              />
              <Field
                label={t.email}
                value={form.email ?? ''}
                placeholder={t.emailPlaceholder}
                onChange={(v) => handleChange('email', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.phone}
                value={form.phone ?? ''}
                placeholder={t.phonePlaceholder}
                onChange={(v) => handleChange('phone', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.whatsapp}
                value={form.whatsappNumber ?? ''}
                placeholder={t.whatsappPlaceholder}
                onChange={(v) => handleChange('whatsappNumber', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.address}
                value={form.address ?? ''}
                placeholder={t.addressPlaceholder}
                onChange={(v) => handleChange('address', v)}
                font={font}
              />
              <Field
                label={t.facebook}
                value={form.facebookUrl ?? ''}
                placeholder={t.urlPlaceholder}
                onChange={(v) => handleChange('facebookUrl', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.instagram}
                value={form.instagramUrl ?? ''}
                placeholder={t.urlPlaceholder}
                onChange={(v) => handleChange('instagramUrl', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.youtube}
                value={form.youtubeUrl ?? ''}
                placeholder={t.urlPlaceholder}
                onChange={(v) => handleChange('youtubeUrl', v)}
                font={font}
                dirLtr
              />
              <Field
                label={t.whatsappBtnLabel}
                value={form.whatsappButtonLabel ?? ''}
                placeholder={t.whatsappBtnLabelPlaceholder}
                onChange={(v) => handleChange('whatsappButtonLabel', v)}
                font={font}
              />
              <Field
                label={t.copyrightText}
                value={form.copyrightText ?? ''}
                placeholder={t.copyrightTextPlaceholder}
                onChange={(v) => handleChange('copyrightText', v)}
                font={font}
              />

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: font }}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? t.saving : t.save}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted/30 transition-all disabled:opacity-60"
                  style={{ fontFamily: font }}
                >
                  <X size={16} />
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Special Offer card ── */}
        <div className="bg-card rounded-2xl border border-border card-shadow p-6 mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
                {t.offerSectionTitle}
              </h2>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  settings.offerEnabled
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
                style={{ fontFamily: font }}
              >
                {settings.offerEnabled ? t.offerEnabledBadge : t.offerDisabledBadge}
              </span>
            </div>

            {!isEditingOffer && (
              <button
                onClick={startEditingOffer}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary transition-all"
                style={{ fontFamily: font }}
              >
                <Pencil size={13} />
                {t.edit}
              </button>
            )}
          </div>

          {!isEditingOffer ? (
            /* ── Read-only display ── */
            <div className="mt-3">
              {settings.offerImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.offerImageUrl}
                  alt={settings.offerTitle ?? 'Offer'}
                  className="w-full h-40 object-cover rounded-xl mb-4 border border-border"
                />
              )}
              {settings.offerTitle ? (
                <p
                  className="text-base font-extrabold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {settings.offerTitle}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t.notSet}</p>
              )}
              {settings.offerText && (
                <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: font }}>
                  {settings.offerText}
                </p>
              )}
              {!settings.offerTitle && !settings.offerText && !settings.offerImageUrl && (
                <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: font }}>
                  {t.offerEmptyNote}
                </p>
              )}
            </div>
          ) : (
            /* ── Edit form ── */
            <div className="flex flex-col gap-4 mt-3">
              {/* Enable/disable toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border">
                <span
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {t.offerEnabledLabel}
                </span>
                <ToggleSwitch checked={offerForm.offerEnabled} onChange={handleOfferToggle} />
              </div>

              <Field
                label={t.offerTitleLabel}
                value={offerForm.offerTitle ?? ''}
                placeholder={t.offerTitlePlaceholder}
                onChange={(v) => handleOfferChange('offerTitle', v)}
                font={font}
              />
              <Field
                label={t.offerTextLabel}
                value={offerForm.offerText ?? ''}
                placeholder={t.offerTextPlaceholder}
                onChange={(v) => handleOfferChange('offerText', v)}
                font={font}
                textarea
              />

              {/* Image upload */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {t.offerImageLabel}
                </label>

                {settings.offerImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.offerImageUrl}
                    alt={settings.offerTitle ?? 'Offer'}
                    className="w-full h-40 object-cover rounded-xl border border-border"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                    <ImageIcon size={16} />
                    <span style={{ fontFamily: font }}>{t.noImage}</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: font }}
                  >
                    {isUploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {isUploadingImage
                      ? t.uploadingImage
                      : settings.offerImageUrl
                        ? t.changeImage
                        : t.uploadImage}
                  </button>

                  {settings.offerImageUrl && (
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      disabled={isUploadingImage}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ fontFamily: font }}
                    >
                      <Trash2 size={14} />
                      {t.removeImage}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleSaveOffer}
                  disabled={isSavingOffer}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: font }}
                >
                  {isSavingOffer ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSavingOffer ? t.saving : t.save}
                </button>
                <button
                  onClick={cancelEditingOffer}
                  disabled={isSavingOffer}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted/30 transition-all disabled:opacity-60"
                  style={{ fontFamily: font }}
                >
                  <X size={16} />
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  font,
  textarea,
  dirLtr,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  font?: string;
  textarea?: boolean;
  dirLtr?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
          style={{ fontFamily: font }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dirLtr ? 'ltr' : undefined}
          className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          style={{ fontFamily: font }}
        />
      )}
    </div>
  );
}

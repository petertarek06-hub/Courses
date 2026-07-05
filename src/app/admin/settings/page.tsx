// src/app/admin/settings/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
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

export default function AdminSettingsPage() {
  const [lang] = useState<'ar' | 'en'>('ar');
  const isRtl = lang === 'ar';
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<CenterSettings>(EMPTY_FORM);
  const [form, setForm] = useState<CenterSettings>(EMPTY_FORM);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings(data);
          setForm(data);
        }
      })
      .catch(() => toast.error(t.errorMsg))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify(form),
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

// src/app/admin/settings/page.tsx
'use client';

import React, { useState } from 'react';
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const content = {
  ar: {
    title: 'الإعدادات',
    siteName: 'اسم الموقع',
    siteNamePlaceholder: 'EduCenter',
    siteDesc: 'وصف الموقع',
    siteDescPlaceholder: 'منصة تعليمية متكاملة',
    whatsapp: 'رقم واتساب الدعم',
    whatsappPlaceholder: '01xxxxxxxxx',
    save: 'حفظ الإعدادات',
    saving: 'جارٍ الحفظ...',
    savedMsg: 'تم حفظ الإعدادات بنجاح!',
    generalSettings: 'الإعدادات العامة',
    contactSettings: 'إعدادات التواصل',
  },

  en: {
    title: 'Settings',
    siteName: 'Site Name',
    siteNamePlaceholder: 'EduCenter',
    siteDesc: 'Site Description',
    siteDescPlaceholder: 'A complete educational platform',
    whatsapp: 'Support WhatsApp Number',
    whatsappPlaceholder: '01xxxxxxxxx',
    save: 'Save Settings',
    saving: 'Saving...',
    savedMsg: 'Settings saved successfully!',
    generalSettings: 'General Settings',
    contactSettings: 'Contact Settings',
  },
};

export default function AdminSettingsPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isSaving, setIsSaving] = useState(false);

  const [siteName, setSiteName] = useState('EduCenter');
  const [siteDesc, setSiteDesc] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const isRtl = lang === 'ar';
  const t = content[lang];

  const handleSave = async () => {
    setIsSaving(true);

    await new Promise((r) => setTimeout(r, 1000));

    toast.success(t.savedMsg);

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="flex-1 p-6 max-w-2xl">
        <h1
          className="text-2xl font-extrabold text-foreground mb-6"
          style={{
            fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
          }}
        >
          {t.title}
        </h1>

        <div className="flex flex-col gap-6">
          {/* General Settings */}
          <div className="bg-card rounded-2xl border border-border card-shadow p-6 flex flex-col gap-4">
            <h2
              className="text-base font-bold text-foreground"
              style={{
                fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
              }}
            >
              {t.generalSettings}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold text-foreground"
                style={{
                  fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
                }}
              >
                {t.siteName}
              </label>

              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder={t.siteNamePlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold text-foreground"
                style={{
                  fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
                }}
              >
                {t.siteDesc}
              </label>

              <textarea
                value={siteDesc}
                onChange={(e) => setSiteDesc(e.target.value)}
                placeholder={t.siteDescPlaceholder}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-card rounded-2xl border border-border card-shadow p-6 flex flex-col gap-4">
            <h2
              className="text-base font-bold text-foreground"
              style={{
                fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
              }}
            >
              {t.contactSettings}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold text-foreground"
                style={{
                  fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
                }}
              >
                {t.whatsapp}
              </label>

              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t.whatsappPlaceholder}
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed w-fit"
            style={{
              fontFamily: isRtl ? 'var(--font-cairo)' : undefined,
            }}
          >
            <Save size={16} />

            {isSaving ? t.saving : t.save}
          </button>
        </div>
      </main>
    </div>
  );
}

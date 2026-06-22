//src/lib/Uselang.ts
'use client';
import { useState, useEffect } from 'react';

const LANG_KEY = 'educenter_lang';

export function useLang() {
  const [lang, setLangState] = useState<'ar' | 'en'>('ar');

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  // Save to localStorage on change
  const setLang = (newLang: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, newLang);
    setLangState(newLang);
  };

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
  };

  return { lang, setLang, toggleLang };
}

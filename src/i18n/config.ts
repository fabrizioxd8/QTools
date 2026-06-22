import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en';
import es from './locales/es';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    // Default to Spanish; fall back to English if a key is missing
    lng: 'es',
    fallbackLng: 'en',
    // Don't detect from browser — we control the language ourselves
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'qtools-lang',
    },
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
  });

export default i18n;

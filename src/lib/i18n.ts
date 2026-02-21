import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bgTranslation from '@/locales/bg/translation.json';
import enTranslation from '@/locales/en/translation.json';

// URL-driven language detection: "URL is king"
// Only '/en/...' activates English; everything else defaults to Bulgarian
const firstSegment = window.location.pathname.split('/')[1];
const initialLng = firstSegment === 'en' ? 'en' : 'bg';

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: 'bg',
  resources: {
    bg: { translation: bgTranslation },
    en: { translation: enTranslation },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

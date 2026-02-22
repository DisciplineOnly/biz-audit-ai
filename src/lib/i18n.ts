import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// URL-driven language detection: "URL is king"
// Only '/en/...' activates English; everything else defaults to Bulgarian
const firstSegment = window.location.pathname.split('/')[1];
const initialLng = firstSegment === 'en' ? 'en' : 'bg';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'en',
    ns: ['common', 'landing', 'steps', 'generating', 'report'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

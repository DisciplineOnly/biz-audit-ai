import { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import i18n from '@/lib/i18n';

export function LangLayout() {
  const { lang } = useParams<{ lang?: string }>();
  const activeLang = lang === 'en' ? 'en' : 'bg';

  useEffect(() => {
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
    document.documentElement.lang = activeLang;
  }, [activeLang]);

  return <Outlet />;
}

import { useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import i18n from '@/lib/i18n';

export function LangLayout() {
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const activeLang = lang === 'en' ? 'en' : 'bg';

  // Redirect /bg/... → /... (BG is the default language, no prefix needed)
  useEffect(() => {
    if (lang === 'bg') {
      const rest = location.pathname.replace(/^\/bg/, '') || '/';
      navigate(rest + location.search + location.hash, { replace: true });
    }
  }, [lang, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
    document.documentElement.lang = activeLang;
  }, [activeLang]);

  return <Outlet />;
}

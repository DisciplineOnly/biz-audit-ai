import { useParams } from 'react-router-dom';

export type Lang = 'bg' | 'en';

export function useLang(): { lang: Lang; prefix: string } {
  const { lang } = useParams<{ lang?: string }>();
  const activeLang: Lang = lang === 'en' ? 'en' : 'bg';
  const prefix = activeLang === 'en' ? '/en' : '';
  return { lang: activeLang, prefix };
}

import { useNavigate, useLocation } from "react-router-dom";
import { useLang, Lang } from "@/hooks/useLang";

export function LanguageToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, prefix } = useLang();

  const switchLang = (newLang: Lang) => {
    if (newLang === lang) return;
    const newPrefix = newLang === "en" ? "/en" : "";
    const pathWithoutPrefix = prefix
      ? location.pathname.replace(new RegExp(`^${prefix}`), "") || "/"
      : location.pathname;
    navigate(newPrefix + pathWithoutPrefix + location.search);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      <button
        onClick={() => switchLang("bg")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
          lang === "bg"
            ? "bg-[hsl(var(--coral))] text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        BG
      </button>
      <button
        onClick={() => switchLang("en")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
          lang === "en"
            ? "bg-[hsl(var(--coral))] text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}

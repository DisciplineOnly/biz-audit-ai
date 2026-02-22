import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Wrench, Home, ArrowRight, CheckCircle, Star, BarChart3, Zap } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { LanguageToggle } from "@/components/LanguageToggle";

const STORAGE_KEY = "ep_audit_state";

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { prefix } = useLang();
  const { t } = useTranslation('landing');
  const { t: tc } = useTranslation('common');
  const partnerCode = searchParams.get("ref") || searchParams.get("partner");

  useEffect(() => {
    if (partnerCode) {
      sessionStorage.setItem("ep_partner_code", partnerCode);
    }
  }, [partnerCode]);

  const handleNicheSelect = (niche: "home_services" | "real_estate") => {
    // Clear any previous session
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    const saved = savedRaw ? JSON.parse(savedRaw) : null;

    if (saved && saved.niche === niche && saved.currentStep > 1) {
      // Resume existing session
      navigate(`${prefix}/audit?niche=${niche}&resume=true`);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      navigate(`${prefix}/audit?niche=${niche}`);
    }
  };

  const benefits = t('benefits', { returnObjects: true }) as string[];
  const hsTags = t('nicheSelect.hs.tags', { returnObjects: true }) as string[];
  const reTags = t('nicheSelect.re.tags', { returnObjects: true }) as string[];
  const howSteps = t('howItWorks.steps', { returnObjects: true }) as Array<{ step: string; title: string; description: string }>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header style={{ backgroundColor: "hsl(var(--navy))" }} className="py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "hsl(var(--coral))" }}
            >
              {tc('brand.initials')}
            </div>
            <span className="text-white font-semibold text-lg">{tc('brand.name')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm hidden sm:block">
              {tc('nav.freeAuditTool')}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ backgroundColor: "hsl(var(--navy))" }} className="py-16 px-6 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {partnerCode && (
            <div
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-6 text-white/80"
              style={{ backgroundColor: "hsl(var(--coral) / 0.2)", border: "1px solid hsl(var(--coral) / 0.4)" }}
            >
              <Star className="w-3.5 h-3.5" style={{ color: "hsl(var(--coral))" }} />
              {t('partner.referredBy', { code: partnerCode })}
            </div>
          )}

          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "hsl(var(--coral) / 0.15)", color: "hsl(var(--coral))" }}
          >
            <Zap className="w-3.5 h-3.5" />
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t('hero.title')}{" "}
            <span style={{ color: "hsl(var(--coral))" }}>{t('hero.titleHighlight')}</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            <Trans
              i18nKey="hero.subtitle"
              ns="landing"
              components={{ strong: <strong className="text-white" /> }}
            />
          </p>

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-12 text-left">
            {Array.isArray(benefits) && benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: "hsl(var(--score-green))" }}
                />
                <span className="text-white/80 text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {[
              { icon: BarChart3, label: t('stats.categoriesScored.label'), value: t('stats.categoriesScored.value') },
              { icon: Zap, label: t('stats.avgTime.label'), value: t('stats.avgTime.value') },
              { icon: Star, label: t('stats.aiReport.label'), value: t('stats.aiReport.value') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-white/50 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Niche Selection Cards */}
      <section className="px-6 -mt-12 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-muted-foreground font-medium">{t('nicheSelect.prompt')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Home Services */}
            <button
              onClick={() => handleNicheSelect("home_services")}
              className="group bg-card border-2 border-border rounded-2xl p-8 text-left transition-all duration-200 hover:border-[hsl(var(--coral))] hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:border-[hsl(var(--coral))]"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: "hsl(var(--coral) / 0.1)" }}
                >
                  🔧
                </div>
                <ArrowRight
                  className="w-5 h-5 text-muted-foreground group-hover:text-[hsl(var(--coral))] group-hover:translate-x-1 transition-all"
                />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">{t('nicheSelect.hs.title')}</h2>
              <p className="text-muted-foreground mb-5">
                {t('nicheSelect.hs.description')}
              </p>

              <div className="flex flex-wrap gap-2">
                {Array.isArray(hsTags) && hsTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                className="mt-6 flex items-center gap-2 font-semibold text-sm transition-colors"
                style={{ color: "hsl(var(--coral))" }}
              >
                {t('nicheSelect.hs.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Real Estate */}
            <button
              onClick={() => handleNicheSelect("real_estate")}
              className="group bg-card border-2 border-border rounded-2xl p-8 text-left transition-all duration-200 hover:border-[hsl(var(--coral))] hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:border-[hsl(var(--coral))]"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: "hsl(var(--coral) / 0.1)" }}
                >
                  🏠
                </div>
                <ArrowRight
                  className="w-5 h-5 text-muted-foreground group-hover:text-[hsl(var(--coral))] group-hover:translate-x-1 transition-all"
                />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">{t('nicheSelect.re.title')}</h2>
              <p className="text-muted-foreground mb-5">
                {t('nicheSelect.re.description')}
              </p>

              <div className="flex flex-wrap gap-2">
                {Array.isArray(reTags) && reTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                className="mt-6 flex items-center gap-2 font-semibold text-sm transition-colors"
                style={{ color: "hsl(var(--coral))" }}
              >
                {t('nicheSelect.re.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">{t('howItWorks.title')}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {Array.isArray(howSteps) && howSteps.map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "hsl(var(--coral))" }}
                >
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        <p className="text-white/40 text-sm">
          {tc('copyright', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}

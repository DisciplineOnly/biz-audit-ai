import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wrench, Home, ArrowRight, CheckCircle, Star, BarChart3, Zap } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const STORAGE_KEY = "ep_audit_state";

const benefits = [
  "Discover exactly where you're losing money",
  "Get a personalized AI-generated score for 7 business areas",
  "Receive actionable recommendations you can implement immediately",
  "Compare your performance to industry benchmarks",
  "Takes only 8–10 minutes to complete",
];

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { prefix } = useLang();
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
              E&P
            </div>
            <span className="text-white font-semibold text-lg">E&P Systems</span>
          </div>
          <div className="text-white/60 text-sm hidden sm:block">
            Free AI Business Audit Tool
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
              Referred by Partner: {partnerCode}
            </div>
          )}

          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "hsl(var(--coral) / 0.15)", color: "hsl(var(--coral))" }}
          >
            <Zap className="w-3.5 h-3.5" />
            FREE · AI-POWERED · PERSONALIZED
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Get Your Free{" "}
            <span style={{ color: "hsl(var(--coral))" }}>AI Business Audit</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Answer a few questions about your business and we'll generate a personalized report
            showing <strong className="text-white">exactly where you're leaving money on the table</strong> — and how to fix it.
          </p>

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-12 text-left">
            {benefits.map((benefit, i) => (
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
              { icon: BarChart3, label: "Business Categories Scored", value: "7" },
              { icon: Zap, label: "Avg. Time to Complete", value: "~8 min" },
              { icon: Star, label: "AI-Generated Report", value: "Free" },
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
            <p className="text-muted-foreground font-medium">Select your business type to get started:</p>
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

              <h2 className="text-2xl font-bold text-foreground mb-2">Home Services & Trades</h2>
              <p className="text-muted-foreground mb-5">
                HVAC, Plumbing, Electrical, Roofing, Landscaping, Pest Control, and more
              </p>

              <div className="flex flex-wrap gap-2">
                {["HVAC", "Plumbing", "Electrical", "Roofing", "Landscaping", "More"].map((tag) => (
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
                Start My Audit
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

              <h2 className="text-2xl font-bold text-foreground mb-2">Real Estate Teams & Brokerages</h2>
              <p className="text-muted-foreground mb-5">
                Agents, teams, brokerages, property management, and mortgage teams
              </p>

              <div className="flex flex-wrap gap-2">
                {["Residential", "Teams", "Brokerages", "Property Mgmt", "Mortgage", "More"].map((tag) => (
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
                Start My Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Answer 8 Quick Sections",
                desc: "Tell us about your technology, leads, operations, and financials. Takes about 8 minutes.",
              },
              {
                step: "02",
                title: "AI Analyzes Your Answers",
                desc: "Our AI scores your business across 7 critical categories and benchmarks you against industry standards.",
              },
              {
                step: "03",
                title: "Get Your Personalized Report",
                desc: "Receive your full audit report with scores, critical gaps, quick wins, and strategic recommendations.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "hsl(var(--coral))" }}
                >
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
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
          © {new Date().getFullYear()} E&P Systems · AI-Powered Business Growth Solutions
        </p>
      </footer>
    </div>
  );
}

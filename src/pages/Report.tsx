import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { AuditFormState, AuditScores } from "@/types/audit";
import { computeScores, getScoreColor, getScoreLabel, getBenchmark, generateMockReport } from "@/lib/scoring";
import { Calendar, Download, Share2, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, BarChart3, Zap } from "lucide-react";

const STORAGE_KEY = "ep_audit_state";

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: color }}>
            {scoreLabel}
          </span>
          <span className="font-bold text-foreground">{score}%</span>
        </div>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function OverallScoreCircle({ score }: { score: number }) {
  const color = getScoreColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

function BenchmarkBadge({ level }: { level: "above" | "average" | "below" }) {
  const config = {
    above: { label: "Above Average", bg: "hsl(var(--score-green) / 0.1)", color: "hsl(var(--score-green))", icon: "↑" },
    average: { label: "Average", bg: "hsl(var(--score-yellow) / 0.1)", color: "hsl(var(--score-yellow))", icon: "→" },
    below: { label: "Below Average", bg: "hsl(var(--score-red) / 0.1)", color: "hsl(var(--score-red))", icon: "↓" },
  };
  const c = config[level];
  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.icon} {c.label}
    </span>
  );
}

export default function Report() {
  const { auditId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<AuditFormState | null>(null);
  const [scores, setScores] = useState<AuditScores | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to get from navigation state first, then localStorage
    const locationState = location.state as { formState?: AuditFormState; scores?: AuditScores } | null;

    let fs: AuditFormState | null = locationState?.formState || null;
    let sc: AuditScores | null = locationState?.scores || null;

    if (!fs) {
      const savedForm = localStorage.getItem(STORAGE_KEY + "_form");
      if (savedForm) fs = JSON.parse(savedForm);
    }
    if (!sc && fs) {
      const savedScores = localStorage.getItem(STORAGE_KEY + "_scores");
      sc = savedScores ? JSON.parse(savedScores) : computeScores(fs);
    }

    if (fs && sc) {
      setFormState(fs);
      setScores(sc);
    }
  }, [location.state]);

  if (!formState || !scores) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No report data found.</p>
        <Link to="/" className="text-sm font-medium" style={{ color: "hsl(var(--coral))" }}>
          Start a New Audit →
        </Link>
      </div>
    );
  }

  const { criticalGaps, quickWins, strategicRecs } = generateMockReport(formState, scores);
  const isHS = formState.niche === "home_services";
  const businessName = formState.step1.businessName || "Your Business";
  const overallLabel = getScoreLabel(scores.overall);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header style={{ backgroundColor: "hsl(var(--navy))" }} className="py-4 px-6 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 hover:text-white">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "hsl(var(--coral))" }}>E&P</div>
            <span className="font-semibold hidden sm:block">E&P Systems</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <Share2 className="w-4 h-4" />
              {copied ? "Copied!" : "Share"}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Report Hero */}
      <section style={{ backgroundColor: "hsl(var(--navy))" }} className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/60 text-sm">{isHS ? "🔧 Home Services & Trades" : "🏠 Real Estate"} · AI Business Audit</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{businessName}</h1>
              <p className="text-white/60 mb-1">Business Audit Report · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {formState.step1.industry && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">{formState.step1.industry}</span>
                )}
                {formState.step1.employeeCount && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">{formState.step1.employeeCount} employees</span>
                )}
                {formState.step1.annualRevenue && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">{formState.step1.annualRevenue} revenue</span>
                )}
                {formState.step1.role && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">{formState.step1.role}</span>
                )}
              </div>
            </div>
            <div className="text-center">
              <OverallScoreCircle score={scores.overall} />
              <p className="text-white font-bold mt-2">Overall Score</p>
              <p className="text-white/60 text-sm">{overallLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Executive Summary */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: "hsl(var(--coral))" }} />
            Executive Summary
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3">
            <p>
              Based on your responses, <strong className="text-foreground">{businessName}</strong> scored{" "}
              <strong style={{ color: getScoreColor(scores.overall) }}>{scores.overall}/100</strong> overall —
              placing you in the <strong className="text-foreground">{overallLabel.toLowerCase()}</strong> category for{" "}
              {isHS ? "home service businesses" : "real estate teams"} of your size.
            </p>
            <p>
              Your strongest areas are in{" "}
              <strong className="text-foreground">
                {scores.categories.sort((a, b) => b.score - a.score).slice(0, 2).map(c => c.label).join(" and ")}
              </strong>
              , which suggests you have a solid operational foundation to build from.
            </p>
            <p>
              However, significant gaps in{" "}
              <strong className="text-foreground">
                {scores.categories.sort((a, b) => a.score - b.score).slice(0, 2).map(c => c.label).join(" and ")}
              </strong>{" "}
              represent your biggest opportunities. Businesses that close these gaps typically see{" "}
              <strong className="text-foreground">20–40% revenue increases</strong> within 12 months through better lead conversion,
              retention, and operational efficiency.
            </p>
            <p>
              The recommendations in this report are based on your specific answers and industry benchmarks for{" "}
              {isHS ? `${formState.step1.industry || "home service"} businesses` : "real estate teams"}{" "}
              {isHS ? `with ${formState.step1.employeeCount || "your"} employees` : `with ${formState.step1.teamSize || "your team size"}`}.
            </p>
          </div>
        </section>

        {/* Category Scorecard */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--coral))" }} />
            Category Scorecard
          </h2>
          <div className="space-y-5">
            {scores.categories.map((cat) => (
              <ScoreBar key={cat.category} score={cat.score} label={`${cat.label} (${cat.weight}% weight)`} />
            ))}
          </div>
        </section>

        {/* Critical Gaps */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: "hsl(var(--score-orange))" }} />
            Top 3 Critical Gaps
          </h2>
          <div className="space-y-4">
            {criticalGaps.map((gap, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: "hsl(var(--score-orange))" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-2">{gap.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{gap.description}</p>
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "hsl(var(--score-green) / 0.1)", color: "hsl(var(--score-green))" }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {gap.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Wins */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: "hsl(var(--score-yellow))" }} />
            Quick Wins (30 Days)
          </h2>
          <p className="text-muted-foreground text-sm mb-6">Things you can implement immediately with existing resources</p>
          <div className="space-y-5">
            {quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--score-green))" }} />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{win.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-1">{win.description}</p>
                  <span className="text-xs text-muted-foreground italic">{win.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Recommendations */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--coral))" }} />
            Strategic Recommendations (90 Days)
          </h2>
          <p className="text-muted-foreground text-sm mb-4">Larger investments with significant ROI potential</p>
          <div className="grid md:grid-cols-3 gap-4">
            {strategicRecs.map((rec, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4"
                  style={{ backgroundColor: "hsl(var(--navy))" }}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm">{rec.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">{rec.description}</p>
                <div className="text-xs font-semibold" style={{ color: "hsl(var(--score-green))" }}>
                  📈 {rec.roi}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Competitor Benchmark */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Competitor Benchmark</h2>
          <div className="space-y-3">
            {scores.categories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{cat.label}</span>
                <BenchmarkBadge level={getBenchmark(cat.score)} />
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="rounded-2xl p-8 md:p-10 text-center"
          style={{ background: `linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-dark)) 100%)` }}
        >
          <div className="text-3xl mb-4">📞</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Want Help Implementing These Recommendations?
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Book a free 30-minute strategy call with the E&P Systems team. We'll review your audit results,
            prioritize your top opportunities, and show you exactly how we can help implement them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://cal.com/ep-systems"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: "hsl(var(--coral))" }}
            >
              <Calendar className="w-5 h-5" />
              Book Your Free Strategy Call
            </a>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-4 rounded-xl text-white/70 hover:text-white font-medium border border-white/20 hover:border-white/40 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share This Report
            </button>
          </div>
          <p className="text-white/40 text-xs mt-4">No obligation · No sales pressure · Just strategy</p>
        </section>

        {/* Footer */}
        <div className="text-center py-4 print:hidden">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Start a New Audit
          </Link>
        </div>
      </div>
    </div>
  );
}

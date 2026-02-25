import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation, Trans } from "react-i18next";
import { AuditFormState, AuditScores, AIReportData } from "@/types/audit";
import {
  getScoreColor,
  getScoreLabel,
  getBenchmark,
  generateMockReport,
} from "@/lib/scoring";
import { SUB_NICHE_REGISTRY } from "@/config/subNicheConfig";
import { fetchReport } from "@/lib/fetchReport";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Download,
  Share2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";

function ScoreBar({
  score,
  label,
  scoreLabel,
}: {
  score: number;
  label: string;
  scoreLabel: string;
}) {
  const color = getScoreColor(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
            style={{ backgroundColor: color }}
          >
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
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

export default function Report() {
  const { auditId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { prefix } = useLang();
  const { t } = useTranslation("report");
  const { t: tc } = useTranslation("common");
  const { t: tCommon } = useTranslation("common");
  const [copied, setCopied] = useState(false);
  const [pollStartTime] = useState(() => Date.now());
  const POLL_TIMEOUT_MS = 90_000; // 90 seconds max polling

  // Navigation state fast path
  const locationState = location.state as {
    formState?: AuditFormState;
    scores?: AuditScores;
    auditId?: string;
    aiReport?: AIReportData;
  } | null;

  const hasNavigationState = !!(
    locationState?.formState && locationState?.scores
  );

  // Supabase fetch slow path (only when no navigation state)
  const {
    data: fetchedData,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ["report", auditId],
    queryFn: () => fetchReport(auditId!),
    enabled: !hasNavigationState && !!auditId,
    retry: (failureCount, error) => {
      // Don't retry 404s
      if (error instanceof Error && error.message === "not_found") return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.reportStatus === "pending") {
        // Stop polling after timeout
        if (Date.now() - pollStartTime > POLL_TIMEOUT_MS) return false;
        return 4000; // poll every 4s
      }
      return false; // stop when completed or failed
    },
    refetchIntervalInBackground: false,
  });

  // Unified data resolution - navigation state takes priority
  const formState: AuditFormState | null =
    locationState?.formState ?? fetchedData?.audit?.form_data ?? null;
  const scores: AuditScores | null =
    locationState?.scores ?? fetchedData?.audit?.scores ?? null;
  const aiReport: AIReportData | null =
    locationState?.aiReport ?? fetchedData?.aiReport ?? null;
  const reportStatus =
    fetchedData?.reportStatus ?? (locationState?.aiReport ? "completed" : null);

  // Translation helpers for score and category labels
  const scoreLabels: Record<string, string> = {
    Strong: t("scores.strong"),
    Moderate: t("scores.moderate"),
    "Needs Work": t("scores.needsWork"),
    "Critical Gap": t("scores.criticalGap"),
  };
  const translateScoreLabel = (score: number) => {
    const key = getScoreLabel(score);
    return scoreLabels[key] ?? key;
  };

  const isHS = formState?.niche === "home_services";

  // Resolve sub-niche display name (i18n-aware) for badge and template
  const subNicheEntry = formState?.subNiche
    ? SUB_NICHE_REGISTRY.find((sn) => sn.id === formState.subNiche)
    : null;
  const subNicheName = subNicheEntry ? tCommon(subNicheEntry.labelKey) : null;

  const categoryLabels: Record<string, string> = {
    technology: t("categories.technology"),
    leads: t("categories.leads"),
    scheduling: isHS
      ? t("categories.scheduling.hs")
      : t("categories.scheduling.re"),
    communication: t("categories.communication"),
    followUp: t("categories.followUp"),
    operations: t("categories.operations"),
    financial: t("categories.financial"),
  };

  const benchmarkLabels = {
    above: {
      label: t("benchmark.above"),
      bg: "hsl(var(--score-green) / 0.1)",
      color: "hsl(var(--score-green))",
      icon: "\u2191",
    },
    average: {
      label: t("benchmark.average"),
      bg: "hsl(var(--score-yellow) / 0.1)",
      color: "hsl(var(--score-yellow))",
      icon: "\u2192",
    },
    below: {
      label: t("benchmark.below"),
      bg: "hsl(var(--score-red) / 0.1)",
      color: "hsl(var(--score-red))",
      icon: "\u2193",
    },
  };

  // ---- Conditional rendering (in order) ----

  // a. Loading/skeleton state (fetching from Supabase)
  if (!hasNavigationState && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div
          style={{ backgroundColor: "hsl(var(--navy))" }}
          className="py-4 px-6"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Skeleton className="h-7 w-32 bg-white/10" />
            <div className="flex gap-3">
              <Skeleton className="h-5 w-16 bg-white/10" />
              <Skeleton className="h-5 w-24 bg-white/10" />
            </div>
          </div>
        </div>
        {/* Hero skeleton */}
        <div
          style={{ backgroundColor: "hsl(var(--navy))" }}
          className="py-12 px-6"
        >
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-3">
              <Skeleton className="h-5 w-48 bg-white/10" />
              <Skeleton className="h-10 w-72 bg-white/10" />
              <Skeleton className="h-4 w-56 bg-white/10" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-40 w-40 rounded-full bg-white/10 mx-auto md:mx-0" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // b. Branded 404 (UUID not found)
  if (
    isError &&
    fetchError instanceof Error &&
    fetchError.message === "not_found"
  ) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc("brand.initials")}
        </div>
        <h1 className="text-2xl font-bold text-white">
          {t("errors.notFound.heading")}
        </h1>
        <p className="text-white/60 text-center max-w-md">
          {t("errors.notFound.description")}
        </p>
        <Link
          to={prefix || "/"}
          className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc("buttons.startNewAudit")}
        </Link>
      </div>
    );
  }

  // c. Fetch error (non-404)
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("errors.fetchFailed")}</p>
        <Link
          to={prefix || "/"}
          className="text-sm font-medium"
          style={{ color: "hsl(var(--coral))" }}
        >
          {tc("buttons.startNewAudit")} &rarr;
        </Link>
      </div>
    );
  }

  // d. Poll timeout (pending > 90s) - check before pending so we show timeout instead of spinner
  if (
    fetchedData?.reportStatus === "pending" &&
    Date.now() - pollStartTime > POLL_TIMEOUT_MS
  ) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        <h2 className="text-xl font-bold text-white">
          {t("errors.timeout.heading")}
        </h2>
        <p className="text-white/60 text-center max-w-md">
          {t("errors.timeout.description")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc("buttons.refreshPage")}
        </button>
      </div>
    );
  }

  // e. Report generating (pending state with polling)
  if (fetchedData?.reportStatus === "pending") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "hsl(var(--coral))" }}
          />
        </div>
        <h2 className="text-xl font-bold text-white">
          {t("errors.pending.heading")}
        </h2>
        <p className="text-white/60 text-center max-w-md">
          {t("errors.pending.description")}
        </p>
      </div>
    );
  }

  // f. No data available (neither navigation state nor successful fetch)
  if (!formState || !scores) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc("brand.initials")}
        </div>
        <h1 className="text-2xl font-bold text-white">
          {t("errors.noData.heading")}
        </h1>
        <p className="text-white/60 text-center max-w-md">
          {t("errors.noData.description")}
        </p>
        <Link
          to={prefix || "/"}
          className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc("buttons.startNewAudit")}
        </Link>
      </div>
    );
  }

  // ---- Full report rendering ----

  // Generate template content as fallback
  const templateReport = generateMockReport(formState, scores);

  // Resolve which content to render - AI takes priority
  const gaps = aiReport?.gaps ?? templateReport.criticalGaps ?? [];
  const quickWins = aiReport?.quickWins ?? templateReport.quickWins ?? [];
  const strategicRecs =
    aiReport?.strategicRecommendations ?? templateReport.strategicRecs ?? [];
  const executiveSummary = aiReport?.executiveSummary ?? null;

  const businessName = formState.step1.businessName || "Your Business";
  const overallLabel = translateScoreLabel(scores.overall);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  // Niche description for executive summary template
  const nicheDescription = isHS
    ? t("executiveSummaryTemplate.hsNicheDescription", {
        industry: subNicheName || "home service",
        employees: formState.step1.employeeCount || "your",
      })
    : t("executiveSummaryTemplate.reNicheDescription", {
        teamSize: formState.step1.teamSize || "your team size",
      });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        style={{ backgroundColor: "hsl(var(--navy))" }}
        className="py-4 px-6 print:hidden"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(prefix || "/")}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "hsl(var(--coral))" }}
            >
              {tc("brand.initials")}
            </div>
            <span className="font-semibold hidden sm:block">
              {tc("brand.name")}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied ? t("share.copied") : t("share.share")}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              {tc("buttons.downloadPdf")}
            </button>
          </div>
        </div>
      </header>

      {/* Report Hero */}
      <section
        style={{ backgroundColor: "hsl(var(--navy))" }}
        className="py-12 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/60 text-sm">
              {isHS ? t("hero.nicheBadge.hs") : t("hero.nicheBadge.re")}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {businessName}
              </h1>
              <p className="text-white/60 mb-1">
                {t("hero.reportTitle", {
                  date: new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }),
                })}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {subNicheName && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">
                    {subNicheName}
                  </span>
                )}
                {formState.step1.employeeCount && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">
                    {t("hero.employees", {
                      count: formState.step1.employeeCount,
                    })}
                  </span>
                )}
                {formState.step1.annualRevenue && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">
                    {t("hero.revenue", {
                      amount: formState.step1.annualRevenue,
                    })}
                  </span>
                )}
                {formState.step1.role && (
                  <span className="text-xs px-3 py-1 rounded-full text-white/80 bg-white/10">
                    {formState.step1.role}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <OverallScoreCircle score={scores.overall} />
              <p className="text-white font-bold mt-2">
                {t("hero.overallScore")}
              </p>
              <p className="text-white/60 text-sm">{overallLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Executive Summary */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3
              className="w-5 h-5"
              style={{ color: "hsl(var(--coral))" }}
            />
            {t("sections.executiveSummary")}
          </h2>
          {executiveSummary ? (
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              <p>{executiveSummary}</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3">
              <p>
                <Trans
                  i18nKey="executiveSummaryTemplate.intro"
                  ns="report"
                  values={{
                    businessName,
                    score: scores.overall,
                    label: overallLabel.toLowerCase(),
                    nicheType: isHS
                      ? t("executiveSummaryTemplate.hsNicheType")
                      : t("executiveSummaryTemplate.reNicheType"),
                  }}
                  components={{
                    strong: <strong className="text-foreground" />,
                    scoreStrong: (
                      <strong
                        style={{ color: getScoreColor(scores.overall) }}
                      />
                    ),
                  }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="executiveSummaryTemplate.strengths"
                  ns="report"
                  values={{
                    areas: scores.categories
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 2)
                      .map((c) => categoryLabels[c.category] ?? c.label)
                      .join(" and "),
                  }}
                  components={{
                    strong: <strong className="text-foreground" />,
                  }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="executiveSummaryTemplate.gaps"
                  ns="report"
                  values={{
                    areas: scores.categories
                      .sort((a, b) => a.score - b.score)
                      .slice(0, 2)
                      .map((c) => categoryLabels[c.category] ?? c.label)
                      .join(" and "),
                  }}
                  components={{
                    strong: <strong className="text-foreground" />,
                  }}
                />
              </p>
              <p>
                {t("executiveSummaryTemplate.recommendation", {
                  nicheDescription,
                })}
              </p>
            </div>
          )}
        </section>

        {/* Category Scorecard */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: "hsl(var(--coral))" }}
            />
            {t("sections.categoryScorecard")}
          </h2>
          <div className="space-y-5">
            {scores.categories.map((cat) => (
              <ScoreBar
                key={cat.category}
                score={cat.score}
                label={`${categoryLabels[cat.category] ?? cat.label} (${t("scores.weight", { weight: cat.weight })})`}
                scoreLabel={translateScoreLabel(cat.score)}
              />
            ))}
          </div>
        </section>

        {/* Critical Gaps */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: "hsl(var(--score-orange))" }}
            />
            {t("sections.criticalGaps")}
          </h2>
          <div className="space-y-4">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: "hsl(var(--score-orange))" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-2">
                      {gap.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      {gap.description}
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: "hsl(var(--score-green) / 0.1)",
                        color: "hsl(var(--score-green))",
                      }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {gap.impact}
                    </div>
                    {"cta" in gap && gap.cta && (
                      <p
                        className="text-xs mt-2"
                        style={{ color: "hsl(var(--coral))" }}
                      >
                        {gap.cta}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Wins */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Zap
              className="w-5 h-5"
              style={{ color: "hsl(var(--score-yellow))" }}
            />
            {t("sections.quickWins")}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {t("sections.quickWinsSubtitle")}
          </p>
          <div className="space-y-5">
            {quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: "hsl(var(--score-green))" }}
                />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {win.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                    {win.description}
                  </p>
                  <span className="text-xs text-muted-foreground italic">
                    {win.timeframe}
                  </span>
                  {"cta" in win && win.cta && (
                    <p
                      className="text-xs mt-2"
                      style={{ color: "hsl(var(--coral))" }}
                    >
                      {win.cta}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Recommendations */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: "hsl(var(--coral))" }}
            />
            {t("sections.strategicRecs")}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t("sections.strategicRecsSubtitle")}
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {strategicRecs.map((rec, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4"
                  style={{ backgroundColor: "hsl(var(--navy))" }}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm">
                  {rec.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                  {rec.description}
                </p>
                <div
                  className="text-xs font-semibold"
                  style={{ color: "hsl(var(--score-green))" }}
                >
                  {rec.roi}
                </div>
                {"cta" in rec && rec.cta && (
                  <p
                    className="text-xs mt-2"
                    style={{ color: "hsl(var(--coral))" }}
                  >
                    {rec.cta}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Competitor Benchmark */}
        <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {t("sections.competitorBenchmark")}
          </h2>
          <div className="space-y-3">
            {scores.categories.map((cat) => {
              const level = getBenchmark(cat.score);
              const bConfig = benchmarkLabels[level];
              return (
                <div
                  key={cat.category}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-foreground">
                    {categoryLabels[cat.category] ?? cat.label}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: bConfig.bg,
                      color: bConfig.color,
                    }}
                  >
                    {bConfig.icon} {bConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section
          className="rounded-2xl p-8 md:p-10 text-center"
          style={{
            background: `linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-dark)) 100%)`,
          }}
        >
          <div className="text-3xl mb-4">📞</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {t("cta.heading")}
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            {t("cta.description")}
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
              {t("cta.bookCall")}
            </a>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-4 rounded-xl text-white/70 hover:text-white font-medium border border-white/20 hover:border-white/40 transition-all"
            >
              <Share2 className="w-4 h-4" />
              {t("cta.shareReport")}
            </button>
          </div>
          <p className="text-white/40 text-xs mt-4">{t("cta.noObligation")}</p>
        </section>

        {/* Footer */}
        <div className="text-center py-4 print:hidden">
          <Link
            to={prefix || "/"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("footer.startNewAudit")}
          </Link>
        </div>
      </div>
    </div>
  );
}

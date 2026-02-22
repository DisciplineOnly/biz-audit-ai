import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import { submitAudit } from "@/lib/submitAudit";
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { AuditFormState, AuditScores, AIReportData } from "@/types/audit";
import { useLang } from "@/hooks/useLang";

const MIN_WAIT_MS = 8000;

export default function Loading() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prefix, lang } = useLang();
  const { t } = useTranslation('generating');
  const { t: tc } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [, setAiReport] = useState<AIReportData | null>(null);

  const auditIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiResolvedRef = useRef(false);

  // Steps from i18n namespace
  const steps = (t('steps', { returnObjects: true }) as string[]);
  const stepsArray = Array.isArray(steps) ? steps : [];

  // Capture location state once at mount
  const locationStateRef = useRef(
    location.state as { auditId?: string; formState?: AuditFormState; scores?: AuditScores } | null
  );
  const formStateRef = useRef(locationStateRef.current?.formState);
  const scoresRef = useRef(locationStateRef.current?.scores);

  const callGenerateReport = useCallback(
    async (startTime: number) => {
      const auditId = auditIdRef.current;
      if (!auditId || auditId.startsWith("demo-")) {
        // submitAudit failed — skip AI, go to report with template content
        const elapsed = Date.now() - startTime;
        await new Promise<void>((r) => setTimeout(r, Math.max(0, MIN_WAIT_MS - elapsed)));
        if (!mountedRef.current) return;
        apiResolvedRef.current = true;
        setProgress(100);
        navigate(`${prefix}/report/${auditId}`, {
          state: { formState: formStateRef.current, scores: scoresRef.current, auditId },
        });
        return;
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_WAIT_MS - elapsed);
      const minTimer = new Promise<void>((r) => setTimeout(r, remaining));

      try {
        const generateCall = supabase.functions.invoke("generate-report", {
          body: { auditId, formState: formStateRef.current, scores: scoresRef.current, language: lang },
        });

        const [result] = await Promise.all([generateCall, minTimer]);
        const { data, error: invokeError } = result;

        if (!mountedRef.current) return;

        if (invokeError instanceof FunctionsHttpError) {
          const body = await invokeError.context.json();
          if (body?.rateLimited) {
            setIsRateLimited(true);
            const hours = body.hoursRemaining ?? 24;
            let timeHint: string;
            if (hours <= 1) {
              timeHint = t('rateLimit.timeHints.oneHour');
            } else if (hours < 20) {
              timeHint = t('rateLimit.timeHints.hours', { count: hours });
            } else {
              timeHint = t('rateLimit.timeHints.tomorrow');
            }
            setRateLimitMessage(t('rateLimit.message', { timeHint }));
            return; // Stay on loading screen — do NOT navigate
          }
          throw invokeError; // Non-429 HTTP error
        }

        if (invokeError || !data?.success) {
          throw new Error(
            invokeError?.message || data?.error || t('errors.reportFailed')
          );
        }

        // Success — navigate to report with AI data
        if (!mountedRef.current) return;
        apiResolvedRef.current = true;
        setAiReport(data.report as AIReportData);
        setProgress(100);
        navigate(`${prefix}/report/${auditId}`, {
          state: {
            formState: formStateRef.current,
            scores: scoresRef.current,
            auditId,
            aiReport: data.report,
          },
        });
      } catch (err) {
        if (!mountedRef.current) return;
        setAiError((err as Error).message || t('errors.reportFailed'));
        // Show Retry + Skip buttons — user can retry or skip to template report
      }
    },
    [navigate, prefix, t, lang]
  );

  const handleRetry = useCallback(() => {
    setAiError(null);
    callGenerateReport(Date.now()); // No min timer on retry — user already waited
  }, [callGenerateReport]);

  const handleSkipToReport = useCallback(() => {
    const auditId = auditIdRef.current || "demo-" + Date.now();
    navigate(`${prefix}/report/${auditId}`, {
      state: { formState: formStateRef.current, scores: scoresRef.current, auditId },
    });
  }, [navigate, prefix]);

  useEffect(() => {
    mountedRef.current = true;

    const locationState = locationStateRef.current;
    const formState = formStateRef.current;
    const scores = scoresRef.current;

    // Validate required data
    if (!formState || !scores) {
      setError(t('errors.missingFormData'));
      setTimeout(() => { if (mountedRef.current) navigate(prefix || "/"); }, 3000);
      return;
    }

    if (!formState.niche) {
      setError(t('errors.missingNiche'));
      setTimeout(() => { if (mountedRef.current) navigate(prefix || "/"); }, 3000);
      return;
    }

    const startTime = Date.now();

    // Decorative step cycling (independent of real API work)
    const stepInterval = setInterval(() => {
      if (!mountedRef.current) return;
      setCurrentStep((prev) => {
        if (prev >= stepsArray.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    // Progress bar: reaches ~90% at 8s (8000ms / 90 ticks ≈ 89ms per tick), then pauses
    progressIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setProgress((prev) => {
        // Pause at 90% until API resolves
        if (prev >= 90) {
          if (apiResolvedRef.current) {
            clearInterval(progressIntervalRef.current!);
            return 100;
          }
          return 90;
        }
        return prev + 1;
      });
    }, 89);

    // Async orchestration: submitAudit -> generate-report
    async function runAuditFlow() {
      // Step 1: Submit audit to DB (must complete first — auditId needed for generate-report)
      try {
        const id = await submitAudit(formState!, scores!, lang);
        if (!mountedRef.current) return;
        console.log("Audit saved successfully with ID:", id);
        auditIdRef.current = id;
      } catch (err) {
        if (!mountedRef.current) return;
        console.error("Failed to save audit:", err);
        setError(`Failed to save audit: ${(err as Error).message}`);
        auditIdRef.current = locationState?.auditId || "demo-" + Date.now();
      }

      // Step 2: Fire generate-report + remaining min timer in parallel
      if (mountedRef.current) {
        await callGenerateReport(startTime);
      }
    }

    runAuditFlow();

    return () => {
      mountedRef.current = false;
      clearInterval(stepInterval);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [navigate, callGenerateReport, prefix, t, stepsArray.length]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "hsl(var(--navy))" }}
    >
      {/* Logo */}
      <div className="mb-12 flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: "hsl(var(--coral))" }}
        >
          {tc('brand.initials')}
        </div>
        <span className="text-white font-bold text-xl">{tc('brand.name')}</span>
      </div>

      {/* Spinner */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin-slow"
          style={{
            borderTopColor: "hsl(var(--coral))",
            borderRightColor: "hsl(var(--coral) / 0.3)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-8 h-8" style={{ color: "hsl(var(--coral))" }} />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
        {t('heading')}
      </h1>
      <p className="text-white/50 text-sm mb-10 text-center">
        {t('subtitle')}
      </p>

      {/* DB save error (non-blocking notice) */}
      {error && (
        <div className="w-full max-w-md mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Rate limit block — replaces progress bar and step list */}
      {isRateLimited ? (
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">🚫</div>
          <h2 className="text-xl font-bold text-white mb-3">{t('rateLimit.heading')}</h2>
          <p className="text-white/70 mb-6">{rateLimitMessage}</p>
          <p className="text-white/40 text-sm">
            {t('rateLimit.savedMessage')}
          </p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full max-w-md mb-8">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>{t('analyzing')}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "hsl(var(--coral))",
                }}
              />
            </div>
          </div>

          {/* AI error state — shown below progress bar */}
          {aiError && (
            <div className="w-full max-w-md space-y-3 mb-6">
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 text-sm text-center mb-3">
                  {t('errors.reportIssue')}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                    style={{ backgroundColor: "hsl(var(--coral))" }}
                  >
                    {tc('buttons.retry')}
                  </button>
                  <button
                    onClick={handleSkipToReport}
                    className="px-4 py-2 rounded-lg text-white/70 hover:text-white font-medium text-sm border border-white/20 hover:border-white/40"
                  >
                    {tc('buttons.skipToReport')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Steps list */}
          <div className="w-full max-w-md space-y-3">
            {stepsArray.map((step, index) => {
              const isActive = index === currentStep;
              const isDone = index < currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    isDone
                      ? "text-white/50"
                      : isActive
                      ? "text-white"
                      : "text-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-[hsl(var(--score-green))] text-white"
                        : isActive
                        ? "bg-[hsl(var(--coral))] text-white"
                        : "bg-white/10 text-white/20"
                    }`}
                  >
                    {isDone ? "\u2713" : index + 1}
                  </div>
                  <span className={isActive ? "font-medium" : ""}>{step}</span>
                  {isActive && (
                    <span className="flex gap-1 ml-auto">
                      <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[hsl(var(--coral))]" />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[hsl(var(--coral))]" />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[hsl(var(--coral))]" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

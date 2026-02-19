import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import { submitAudit } from "@/lib/submitAudit";
import type { AuditFormState, AuditScores } from "@/types/audit";

const steps = [
  "Analyzing your technology stack...",
  "Evaluating your lead funnel...",
  "Scoring your scheduling & operations...",
  "Assessing your communication systems...",
  "Reviewing your follow-up & retention...",
  "Identifying revenue opportunities...",
  "Benchmarking against industry standards...",
  "Generating personalized recommendations...",
];

export default function Loading() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const auditIdRef = useRef<string | null>(null);

  useEffect(() => {
    const locationState = location.state as { auditId?: string; formState?: AuditFormState; scores?: AuditScores } | null;
    const formState = locationState?.formState;
    const scores = locationState?.scores;

    // Validate required data
    if (!formState || !scores) {
      setError("Missing form data. Please start over.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (!formState.niche) {
      setError("Missing niche selection. Please start over.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    // Submit audit to database
    submitAudit(formState, scores)
      .then((id) => {
        console.log("Audit saved successfully with ID:", id);
        auditIdRef.current = id;
      })
      .catch((err) => {
        console.error("Failed to save audit:", err);
        setError(`Failed to save audit: ${err.message}`);
        // Use fallback ID if save fails
        auditIdRef.current = locationState?.auditId || "demo-" + Date.now();
      });

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 140);

    const redirect = setTimeout(() => {
      // Use auditIdRef.current if available, otherwise fallback
      const finalAuditId = auditIdRef.current || locationState?.auditId || "demo-" + Date.now();
      navigate(`/report/${finalAuditId}`, { state: { ...locationState, auditId: finalAuditId } });
    }, 14500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(redirect);
    };
  }, [navigate, location.state]);

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
          E&P
        </div>
        <span className="text-white font-bold text-xl">E&P Systems</span>
      </div>

      {/* Spinner */}
      <div className="relative w-24 h-24 mb-8">
        <div
          className="absolute inset-0 rounded-full border-4 border-white/10"
        />
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
        Generating Your AI Audit Report
      </h1>
      <p className="text-white/50 text-sm mb-10 text-center">
        This takes about 15–20 seconds — please don't close this tab
      </p>
      {error && (
        <div className="w-full max-w-md mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Analyzing...</span>
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

      {/* Steps list */}
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, index) => {
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
                {isDone ? "✓" : index + 1}
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
    </div>
  );
}

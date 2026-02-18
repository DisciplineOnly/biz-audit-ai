import { useEffect, useReducer, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Save } from "lucide-react";
import { AuditFormState, auditReducer, initialFormState, Niche } from "@/types/audit";
import { Step1BusinessInfo } from "@/components/audit/Step1BusinessInfo";
import { Step2Technology } from "@/components/audit/Step2Technology";
import { Step3LeadFunnel } from "@/components/audit/Step3LeadFunnel";
import { Step4Scheduling } from "@/components/audit/Step4Scheduling";
import { Step5Communication } from "@/components/audit/Step5Communication";
import { Step6FollowUp } from "@/components/audit/Step6FollowUp";
import { Step7Operations } from "@/components/audit/Step7Operations";
import { Step8Financial } from "@/components/audit/Step8Financial";
import { computeScores } from "@/lib/scoring";

const STORAGE_KEY = "ep_audit_state";

const STEP_LABELS = [
  "BUSINESS",
  "TECHNOLOGY",
  "LEADS",
  "SCHEDULING",
  "COMMUNICATION",
  "FOLLOW-UP",
  "OPERATIONS",
  "FINANCIAL",
];

function validateStep(step: number, state: AuditFormState): string[] {
  const errors: string[] = [];
  switch (step) {
    case 1:
      if (!state.step1.businessName) errors.push("Business name is required");
      if (!state.step1.contactName) errors.push("Your name is required");
      if (!state.step1.email) errors.push("Email address is required");
      if (state.step1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.step1.email))
        errors.push("Please enter a valid email address");
      break;
    case 2:
      if (!state.step2.primaryCRM) errors.push("Please select your primary CRM or software");
      if (!state.step2.crmSatisfaction) errors.push("Please rate your satisfaction with your current software");
      break;
    case 3:
      if (!state.step3.leadSources.length) errors.push("Please select at least one lead source");
      if (!state.step3.responseSpeed) errors.push("Please select your lead response speed");
      break;
    // Steps 4-8 have no required fields beyond basics
  }
  return errors;
}

export default function AuditForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nicheParam = searchParams.get("niche") as Niche | null;
  const isResume = searchParams.get("resume") === "true";

  const [state, dispatch] = useReducer(auditReducer, initialFormState);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedToast, setSavedToast] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Initialize niche and load saved state
  useEffect(() => {
    const partnerCode = sessionStorage.getItem("ep_partner_code");
    if (partnerCode) dispatch({ type: "SET_PARTNER_CODE", payload: partnerCode });

    if (isResume) {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
          dispatch({ type: "RESTORE", payload: saved });
          return;
        } catch {}
      }
    }

    if (nicheParam) {
      dispatch({ type: "SET_NICHE", payload: nicheParam });
    } else {
      navigate("/");
    }
  }, [nicheParam, isResume, navigate]);

  // Auto-save to localStorage on every state change
  useEffect(() => {
    if (state.niche) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const isHS = state.niche === "home_services";
  const currentStep = state.currentStep;
  const progress = Math.round((currentStep / 8) * 100);

  const step4Label = isHS ? "SCHEDULING" : "LEAD MGMT";
  const tabLabels = [...STEP_LABELS];
  tabLabels[3] = step4Label;

  const handleNext = () => {
    const errs = validateStep(currentStep, state);
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    dispatch({ type: "COMPLETE_STEP", payload: currentStep });

    if (currentStep === 8) {
      // Generate report
      const scores = computeScores(state);
      const auditId = "audit-" + Date.now();
      localStorage.setItem(STORAGE_KEY + "_scores", JSON.stringify(scores));
      localStorage.setItem(STORAGE_KEY + "_form", JSON.stringify(state));
      navigate("/generating", { state: { auditId, scores, formState: state } });
      return;
    }

    setAnimKey((k) => k + 1);
    dispatch({ type: "SET_STEP", payload: currentStep + 1 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/");
      return;
    }
    setErrors([]);
    setAnimKey((k) => k + 1);
    dispatch({ type: "SET_STEP", payload: currentStep - 1 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabClick = (stepIndex: number) => {
    if (state.completedSteps.includes(stepIndex) || stepIndex < currentStep) {
      setErrors([]);
      setAnimKey((k) => k + 1);
      dispatch({ type: "SET_STEP", payload: stepIndex });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const stepProps = { state, dispatch, isHS };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header style={{ backgroundColor: "hsl(var(--navy))" }} className="sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "hsl(var(--coral))" }}
            >
              E&P
            </div>
            <span className="font-semibold hidden sm:block">E&P Systems</span>
          </button>

          <div className="text-center">
            <div className="text-white text-sm font-semibold">
              Step {currentStep} of 8
            </div>
            <div className="text-white/50 text-xs">{tabLabels[currentStep - 1]}</div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {savedToast ? "Saved!" : "Save Progress"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "hsl(var(--coral))" }}
          />
        </div>

        {/* Section tabs */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4 py-2 gap-1 max-w-5xl mx-auto">
            {tabLabels.map((label, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = state.completedSteps.includes(stepNum) || stepNum < currentStep;
              const isFuture = stepNum > currentStep;
              const isClickable = isCompleted && !isActive;

              return (
                <button
                  key={label}
                  onClick={() => handleTabClick(stepNum)}
                  disabled={isFuture}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
                    isActive
                      ? "text-white"
                      : isClickable
                      ? "text-white/60 hover:text-white cursor-pointer"
                      : "text-white/25 cursor-default"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "hsl(var(--coral))", color: "white" }
                      : {}
                  }
                >
                  {stepNum}. {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Niche badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">{isHS ? "🔧" : "🏠"}</span>
          <span className="text-sm text-muted-foreground font-medium">
            {isHS ? "Home Services & Trades" : "Real Estate Teams & Brokerages"} Audit
          </span>
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div
            className="mb-6 p-4 rounded-xl border"
            style={{
              backgroundColor: "hsl(var(--score-red) / 0.05)",
              borderColor: "hsl(var(--score-red) / 0.3)",
            }}
          >
            <p className="text-sm font-semibold text-destructive mb-1">Please fix the following:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-sm text-destructive">{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step content */}
        <div key={animKey} className="step-enter">
          {currentStep === 1 && <Step1BusinessInfo {...stepProps} />}
          {currentStep === 2 && <Step2Technology {...stepProps} />}
          {currentStep === 3 && <Step3LeadFunnel {...stepProps} />}
          {currentStep === 4 && <Step4Scheduling {...stepProps} />}
          {currentStep === 5 && <Step5Communication {...stepProps} />}
          {currentStep === 6 && <Step6FollowUp {...stepProps} />}
          {currentStep === 7 && <Step7Operations {...stepProps} />}
          {currentStep === 8 && <Step8Financial {...stepProps} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? "Back to Home" : "Back"}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: "hsl(var(--coral))" }}
          >
            {currentStep === 8 ? (
              <>
                <Zap className="w-4 h-4" />
                Generate My AI Audit Report
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: 8 }).map((_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isDone = stepNum < currentStep;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  isActive ? "w-8" : isDone ? "w-4" : "w-4"
                }`}
                style={{
                  backgroundColor: isActive
                    ? "hsl(var(--coral))"
                    : isDone
                    ? "hsl(var(--score-green))"
                    : "hsl(var(--border))",
                }}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}

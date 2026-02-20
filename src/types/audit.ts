export type Niche = "home_services" | "real_estate";

export interface AuditFormState {
  niche: Niche | null;
  currentStep: number;
  completedSteps: number[];
  partnerCode: string | null;

  // Step 1
  step1: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    // Home Services specific
    industry?: string;
    employeeCount?: string;
    annualRevenue?: string;
    yearsInBusiness?: string;
    serviceArea?: string;
    // Real Estate specific
    role?: string;
    teamSize?: string;
    transactionVolume?: string;
    annualGCI?: string;
    primaryMarket?: string;
  };

  // Step 2
  step2: {
    primaryCRM: string;
    crmSatisfaction: number; // 1-5
    toolsUsed: string[];
    techFrustrations: string;
  };

  // Step 3
  step3: {
    leadSources: string[];
    responseSpeed: string;
    leadTracking: string;
    conversionRate: string;
    // HS: missedCallHandling, RE: leadDistribution
    missedCallHandling?: string;
    leadDistribution?: string;
    googleReviews: string;
    reviewAutomation: string;
    // RE specific
    touchesIn7Days?: string;
  };

  // Step 4 (niche-specific)
  step4: {
    // Home Services: Scheduling
    schedulingMethod?: string;
    dispatchMethod?: string;
    routeOptimization?: string;
    realTimeTracking?: string;
    capacityPlanning?: string;
    emergencyHandling?: string;
    // Real Estate: Lead Management
    followUpPlan?: string;
    nurtureDuration?: string;
    automatedDrip?: string;
    leadTemperatureTracking?: string;
    activityLogging?: string;
    coldLeadHandling?: string;
  };

  // Step 5
  step5: {
    // HS specific
    appointmentReminders?: string;
    onTheWayNotifications?: string;
    jobCompletionComms?: string;
    // RE specific
    agentClientComms?: string;
    transactionUpdates?: string;
    pastClientEngagement?: string;
    // Shared
    internalComms: string;
    afterHoursComms: string;
    clientPortal: string;
  };

  // Step 6
  step6: {
    // HS specific
    postJobFollowUp?: string;
    maintenanceReminders?: string;
    serviceAgreements?: string;
    estimateFollowUp?: string;
    warrantyTracking?: string;
    // RE specific
    postCloseFollowUp?: string;
    pastClientContact?: string;
    referralProcess?: string;
    lostLeadFollowUp?: string;
    anniversaryTracking?: string;
    // Shared
    repeatBusinessPercent: string;
  };

  // Step 7
  step7: {
    // HS specific
    performanceMeasurement?: string;
    jobCosting?: string;
    inventoryManagement?: string;
    timeTracking?: string;
    qualityControl?: string;
    // RE specific
    agentPerformanceMeasurement?: string;
    agentAccountability?: string;
    transactionWorkflow?: string;
    agentOnboarding?: string;
    // Shared
    kpisTracked: string[];
  };

  // Step 8
  step8: {
    // HS specific
    estimateProcess?: string;
    pricingModel?: string;
    invoiceTiming?: string;
    // RE specific
    expenseTracking?: string;
    teamPnL?: string;
    commissionDisbursement?: string;
    marketingBudget?: string;
    // Shared
    paymentMethods: string[];
    collectionsProcess?: string;
    financialReview?: string;
    biggestChallenge: string;
  };
}

export const initialFormState: AuditFormState = {
  niche: null,
  currentStep: 1,
  completedSteps: [],
  partnerCode: null,
  step1: {
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
  },
  step2: {
    primaryCRM: "",
    crmSatisfaction: 0,
    toolsUsed: [],
    techFrustrations: "",
  },
  step3: {
    leadSources: [],
    responseSpeed: "",
    leadTracking: "",
    conversionRate: "",
    googleReviews: "",
    reviewAutomation: "",
  },
  step4: {},
  step5: {
    internalComms: "",
    afterHoursComms: "",
    clientPortal: "",
  },
  step6: {
    repeatBusinessPercent: "",
  },
  step7: {
    kpisTracked: [],
  },
  step8: {
    paymentMethods: [],
    biggestChallenge: "",
  },
};

export type AuditAction =
  | { type: "SET_NICHE"; payload: Niche }
  | { type: "SET_STEP"; payload: number }
  | { type: "COMPLETE_STEP"; payload: number }
  | { type: "SET_PARTNER_CODE"; payload: string }
  | { type: "UPDATE_STEP1"; payload: Partial<AuditFormState["step1"]> }
  | { type: "UPDATE_STEP2"; payload: Partial<AuditFormState["step2"]> }
  | { type: "UPDATE_STEP3"; payload: Partial<AuditFormState["step3"]> }
  | { type: "UPDATE_STEP4"; payload: Partial<AuditFormState["step4"]> }
  | { type: "UPDATE_STEP5"; payload: Partial<AuditFormState["step5"]> }
  | { type: "UPDATE_STEP6"; payload: Partial<AuditFormState["step6"]> }
  | { type: "UPDATE_STEP7"; payload: Partial<AuditFormState["step7"]> }
  | { type: "UPDATE_STEP8"; payload: Partial<AuditFormState["step8"]> }
  | { type: "RESTORE"; payload: AuditFormState };

export function auditReducer(state: AuditFormState, action: AuditAction): AuditFormState {
  switch (action.type) {
    case "SET_NICHE":
      return { ...state, niche: action.payload };
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "COMPLETE_STEP":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload],
      };
    case "SET_PARTNER_CODE":
      return { ...state, partnerCode: action.payload };
    case "UPDATE_STEP1":
      return { ...state, step1: { ...state.step1, ...action.payload } };
    case "UPDATE_STEP2":
      return { ...state, step2: { ...state.step2, ...action.payload } };
    case "UPDATE_STEP3":
      return { ...state, step3: { ...state.step3, ...action.payload } };
    case "UPDATE_STEP4":
      return { ...state, step4: { ...state.step4, ...action.payload } };
    case "UPDATE_STEP5":
      return { ...state, step5: { ...state.step5, ...action.payload } };
    case "UPDATE_STEP6":
      return { ...state, step6: { ...state.step6, ...action.payload } };
    case "UPDATE_STEP7":
      return { ...state, step7: { ...state.step7, ...action.payload } };
    case "UPDATE_STEP8":
      return { ...state, step8: { ...state.step8, ...action.payload } };
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  label: string;
  weight: number;
}

export interface AuditScores {
  technology: number;
  leads: number;
  scheduling: number;
  communication: number;
  followUp: number;
  operations: number;
  financial: number;
  overall: number;
  categories: CategoryScore[];
}

export interface AuditReport {
  id: string;
  niche: Niche;
  businessName: string;
  contactName: string;
  email: string;
  scores: AuditScores;
  executiveSummary: string;
  criticalGaps: Array<{ title: string; description: string; impact: string }>;
  quickWins: Array<{ title: string; description: string; timeframe: string }>;
  strategicRecommendations: Array<{ title: string; description: string; roi: string }>;
  benchmarks: Array<{ category: string; level: "below" | "average" | "above" }>;
  generatedAt: string;
}

/** Shape returned by the generate-report edge function's AI response */
export interface AIReportItem {
  title: string;
  description: string;
  impact?: string;
  timeframe?: string;
  roi?: string;
  priority: 'high' | 'medium' | 'low';
  cta: string;
}

export interface AIReportData {
  executiveSummary: string;
  gaps: AIReportItem[];
  quickWins: AIReportItem[];
  strategicRecommendations: AIReportItem[];
}

import { HSSubNiche, RESubNiche, SubNiche } from "@/types/audit";

/**
 * HS sub-niches are grouped by operational similarity to reduce config duplication.
 * RE sub-niches each have their own config.
 */
export type HSSubNicheGroup = "reactive" | "recurring" | "project_based";
export type SubNicheGroup = HSSubNicheGroup | RESubNiche;

/** Maps each HS sub-niche to its group */
const HS_GROUP_MAP: Record<HSSubNiche, HSSubNicheGroup> = {
  hvac: "reactive",
  plumbing: "reactive",
  electrical: "reactive",
  garage_doors: "reactive",
  pest_control: "recurring",
  landscaping: "recurring",
  cleaning: "recurring",
  roofing: "project_based",
  painting: "project_based",
  general_contracting: "project_based",
  construction: "project_based",
  interior_design: "project_based",
};

/** Display metadata for each sub-niche */
export interface SubNicheInfo {
  id: SubNiche;
  labelKey: string;       // i18n key for display label (Phase 11 uses this)
  label: string;          // English fallback label
  emoji: string;          // Visual identifier for card grid
  niche: "home_services" | "real_estate";
}

/** Registry of all 17 sub-niches with display metadata */
export const SUB_NICHE_REGISTRY: SubNicheInfo[] = [
  // Home Services — Group A: Reactive
  { id: "hvac", labelKey: "subNiche.hvac", label: "HVAC", emoji: "\u2744\uFE0F", niche: "home_services" },
  { id: "plumbing", labelKey: "subNiche.plumbing", label: "Plumbing", emoji: "\uD83D\uDD27", niche: "home_services" },
  { id: "electrical", labelKey: "subNiche.electrical", label: "Electrical", emoji: "\u26A1", niche: "home_services" },
  { id: "garage_doors", labelKey: "subNiche.garageDoors", label: "Garage Doors", emoji: "\uD83D\uDEAA", niche: "home_services" },
  // Home Services — Group B: Recurring
  { id: "pest_control", labelKey: "subNiche.pestControl", label: "Pest Control", emoji: "\uD83D\uDC1B", niche: "home_services" },
  { id: "landscaping", labelKey: "subNiche.landscaping", label: "Landscaping", emoji: "\uD83C\uDF3F", niche: "home_services" },
  { id: "cleaning", labelKey: "subNiche.cleaning", label: "Cleaning", emoji: "\uD83E\uDDF9", niche: "home_services" },
  // Home Services — Group C: Project-Based
  { id: "roofing", labelKey: "subNiche.roofing", label: "Roofing", emoji: "\uD83C\uDFD7\uFE0F", niche: "home_services" },
  { id: "painting", labelKey: "subNiche.painting", label: "Painting", emoji: "\uD83C\uDFA8", niche: "home_services" },
  { id: "general_contracting", labelKey: "subNiche.generalContracting", label: "General Contracting", emoji: "\uD83D\uDD28", niche: "home_services" },
  { id: "construction", labelKey: "subNiche.construction", label: "Construction", emoji: "\uD83C\uDFE2", niche: "home_services" },
  { id: "interior_design", labelKey: "subNiche.interiorDesign", label: "Interior Design", emoji: "\uD83D\uDECB\uFE0F", niche: "home_services" },
  // Real Estate
  { id: "residential_sales", labelKey: "subNiche.residentialSales", label: "Residential Sales", emoji: "\uD83C\uDFE0", niche: "real_estate" },
  { id: "commercial", labelKey: "subNiche.commercial", label: "Commercial / Office", emoji: "\uD83C\uDFEC", niche: "real_estate" },
  { id: "property_management", labelKey: "subNiche.propertyManagement", label: "Property Management", emoji: "\uD83D\uDD11", niche: "real_estate" },
  { id: "new_construction", labelKey: "subNiche.newConstruction", label: "New Construction", emoji: "\uD83C\uDFD7\uFE0F", niche: "real_estate" },
  { id: "luxury_resort", labelKey: "subNiche.luxuryResort", label: "Luxury / Resort", emoji: "\uD83D\uDC8E", niche: "real_estate" },
];

/** Option overrides for a sub-niche group. */
export interface SubNicheOptions {
  /** CRM options — replaces the entire base CRM list for this group */
  crms: string[];
  /** Additional tools to add to the base tools checklist */
  toolsExtra: string[];
  /** Lead source options — replaces the entire base lead source list for this group */
  leadSources: string[];
  /** KPI options — replaces the entire base KPI list for this group */
  kpis: string[];
}

/**
 * Config map: SubNicheGroup -> option overrides.
 * HS sub-niches share options via their group (reactive/recurring/project_based).
 * RE sub-niches each have their own entry.
 * Populated in 08-03.
 */
export const SUB_NICHE_OPTIONS: Record<SubNicheGroup, SubNicheOptions> = {
  // HS Group A: Reactive Service (HVAC, Plumbing, Electrical, Garage Doors)
  reactive: {
    crms: [
      "ServiceTitan", "Housecall Pro", "Jobber", "FieldEdge",
      "Successware", "ServiceM8", "No CRM/Software", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "Google Search/SEO", "Google Ads (PPC)", "Google Local Services Ads",
      "Facebook/Instagram Ads", "Nextdoor", "Yelp", "Angi/HomeAdvisor",
      "Emergency Call-Ins", "Home Warranty Company Referrals",
      "Word of Mouth/Referrals", "Truck Wraps/Yard Signs",
    ],
    kpis: [
      "Average Ticket/Job Value", "First-Time Fix Rate",
      "Callback/Redo Rate", "Revenue Per Technician",
      "Lead-to-Booked Rate", "Membership/Maintenance Plan Count",
      "Customer Satisfaction Score", "Emergency Call Response Time",
      "Profit Margins Per Job Type", "We don't track any KPIs",
    ],
  },

  // HS Group B: Recurring/Scheduled (Pest Control, Landscaping, Cleaning)
  recurring: {
    crms: [
      "Jobber", "Housecall Pro", "GorillaDesk", "ZenMaid",
      "Pocomos", "Lawn Buddy", "No CRM/Software", "Other",
    ],
    toolsExtra: [
      "Route Optimization Software", "Service Agreement Management Platform",
      "Recurring Payment/Subscription Processor",
    ],
    leadSources: [
      "Google Search/SEO", "Google Ads (PPC)", "Nextdoor", "Yelp",
      "Thumbtack", "Angi/HomeAdvisor", "Facebook/Instagram Ads",
      "Door-to-Door/Yard Signs", "Direct Mail/Flyers",
      "HOA Partnerships", "Seasonal Campaigns",
      "Word of Mouth/Referrals",
    ],
    kpis: [
      "Service Agreement Retention Rate", "Customer Churn Rate",
      "Revenue Per Route/Crew", "Monthly Recurring Revenue (MRR)",
      "Average Service Agreement Value", "Customer Acquisition Cost",
      "On-Time Completion Rate", "Chemical/Material Cost Per Job",
      "We don't track any KPIs",
    ],
  },

  // HS Group C: Project-Based (Roofing, Painting, GC, Construction, Interior Design)
  project_based: {
    crms: [
      "Buildertrend", "JobTread", "Procore", "CoConstruct",
      "Houzz Pro", "Jobber", "No CRM/Software", "Other",
    ],
    toolsExtra: [
      "BIM/CAD Software (AutoCAD, Revit, SketchUp)",
      "Takeoff/Estimating Software (PlanSwift, Bluebeam)",
      "3D Rendering Tools (Enscape, Lumion)",
      "FF&E Specification Software (Studio Designer, Programa)",
    ],
    leadSources: [
      "Google Search/SEO", "Google Ads (PPC)", "Houzz",
      "Angi/HomeAdvisor", "Facebook/Instagram Ads",
      "Storm Chasing/Door-to-Door Canvassing",
      "Architect/Engineer Partnerships", "Real Estate Agent Referrals",
      "Builder/Developer Referrals", "Instagram/Pinterest",
      "Word of Mouth/Referrals",
    ],
    kpis: [
      "Average Job/Project Value", "Estimate Close Rate",
      "Gross Margin Per Project", "Budget Adherence (CPI)",
      "Schedule Performance (SPI)", "Labor Productivity Rate",
      "Callback/Warranty Claim Rate", "Project Backlog Value",
      "Billable Hours Ratio", "We don't track any KPIs",
    ],
  },

  // RE: Residential Sales
  residential_sales: {
    crms: [
      "Follow Up Boss", "KVCore/Inside Real Estate", "Lofty (formerly Chime)",
      "Sierra Interactive", "LionDesk", "Wise Agent", "HubSpot",
      "Salesforce", "No CRM", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "Zillow/Realtor.com", "Google Ads (PPC)", "Facebook/Instagram Ads",
      "Open Houses", "Sphere of Influence/Referrals", "Past Client Referrals",
      "Agent Website/IDX", "YouTube/Video",
      "Door Knocking/Cold Calling", "Expired/FSBO Prospecting",
      "Relocation Companies", "Builder/Developer Partnerships",
    ],
    kpis: [
      "Leads Generated Per Agent", "Appointments Set Per Agent",
      "Conversion Rate (Lead to Client)", "Average Days to Close",
      "Cost Per Lead by Source", "GCI Per Agent",
      "Client Satisfaction Score", "Average List-to-Sale Price Ratio",
      "We don't track any KPIs",
    ],
  },

  // RE: Commercial / Office
  commercial: {
    crms: [
      "Apto", "Buildout", "REThink CRM", "Salesforce",
      "HubSpot", "No CRM", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "CoStar/LoopNet Leads", "LinkedIn Outreach/Prospecting",
      "Commercial Broker Referral Network", "Cold Calling/Direct Prospecting",
      "Trade Association Networks", "RFP/Tender Response",
      "Existing Tenant Expansion/Upsell",
    ],
    kpis: [
      "Deals Closed Per Quarter", "Total Square Footage Leased",
      "Average Lease Value/Commission", "Pipeline Value",
      "Average Deal Cycle Length", "Commission Per Deal",
      "Tenant Retention Rate", "Prospecting Activity Per Broker",
      "We don't track any KPIs",
    ],
  },

  // RE: Property Management
  property_management: {
    crms: [
      "Buildium", "AppFolio", "Propertyware", "Rent Manager",
      "Rentec Direct", "TenantCloud", "No CRM/Software", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "Referrals from Sales Agents", "Direct Outreach to Property Owners",
      "Zillow Rental Manager", "Apartments.com/Rent.com Listings",
      "LinkedIn (Commercial PM)", "Facebook Property Groups",
      "Past Landlord Relationships",
    ],
    kpis: [
      "Occupancy Rate", "Average Days to Re-Lease",
      "Rent Collection Rate", "Maintenance Request Resolution Time",
      "Lease Renewal Rate", "Units Under Management Growth",
      "Net Operating Income (NOI) Per Property", "Owner Retention/Churn Rate",
      "We don't track any KPIs",
    ],
  },

  // RE: New Construction
  new_construction: {
    crms: [
      "Lasso CRM", "Buildertrend", "Zoho CRM",
      "Salesforce", "HubSpot", "No CRM", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "Presale Reservation Lists", "Builder/Developer Referral Program",
      "Real Estate Broker Co-Op Network", "Property Exhibitions/Home Shows",
      "Facebook/Instagram Ads", "Google Ads (PPC)",
      "Email Database Campaigns", "Model Home Walk-Ins",
    ],
    kpis: [
      "Units Sold Per Month", "Presale Reservation Conversion Rate",
      "Average Time from Reservation to Contract",
      "Price Per SqFt vs Market Benchmark", "Co-Op Broker Deal Percentage",
      "Marketing Cost Per Unit Sold", "Cancellation/Refund Rate",
      "We don't track any KPIs",
    ],
  },

  // RE: Luxury / Resort
  luxury_resort: {
    crms: [
      "Salesforce", "Follow Up Boss", "LionDesk",
      "Top Producer", "Contactually", "No CRM", "Other",
    ],
    toolsExtra: [],
    leadSources: [
      "Referrals from Existing Luxury Clients",
      "International Property Portals", "Luxury Network Partnerships",
      "Instagram/Targeted Social Media",
      "Wealth Manager/Financial Advisor Partnerships",
      "Press/Editorial Features", "Private Client Events",
    ],
    kpis: [
      "Average Transaction Value", "International vs Domestic Buyer Ratio",
      "Time on Market for Luxury Listings", "Close Rate from Qualified Showings",
      "Referral/Repeat Client Rate", "Average Commission Per Transaction",
      "Qualified Buyer Introductions Per Month",
      "We don't track any KPIs",
    ],
  },
};

/** Get the sub-niche group for option lookups */
export function getSubNicheGroup(subNiche: SubNiche): SubNicheGroup {
  if (subNiche in HS_GROUP_MAP) {
    return HS_GROUP_MAP[subNiche as HSSubNiche];
  }
  // RE sub-niches are their own group
  return subNiche as RESubNiche;
}

/** Get sub-niches filtered by niche */
export function getSubNichesForNiche(niche: "home_services" | "real_estate"): SubNicheInfo[] {
  return SUB_NICHE_REGISTRY.filter((sn) => sn.niche === niche);
}

/** Get the option overrides for a given sub-niche */
export function getSubNicheOptions(subNiche: SubNiche): SubNicheOptions {
  const group = getSubNicheGroup(subNiche);
  return SUB_NICHE_OPTIONS[group];
}

/**
 * Bulgarian market option overrides (shared base + local additions framework).
 * Keeps widely-used international tools, adds Bulgarian platforms, removes US-only platforms.
 * Lead source values are scored by array length only (not by specific string), so BG-specific
 * values like "imot.bg" are safe. They also flow to AI formContext, which is desirable.
 */
export const BG_SUB_NICHE_OPTIONS: Record<SubNicheGroup, SubNicheOptions> = {
  // HS Group A: Reactive Service (HVAC, Plumbing, Electrical, Garage Doors)
  reactive: {
    crms: [
      "ServiceTitan", "Housecall Pro", "Jobber", "FieldEdge",
      "Successware", "ServiceM8", "No CRM/Software", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "Google Търсене/SEO", "Google Ads", "Facebook/Instagram реклами",
      "OLX.bg", "bazar.bg", "Alo.bg", "Viber групи",
      "Препоръки от клиенти",
    ],
    kpis: [
      "Average Ticket/Job Value", "First-Time Fix Rate",
      "Callback/Redo Rate", "Revenue Per Technician",
      "Lead-to-Booked Rate", "Membership/Maintenance Plan Count",
      "Customer Satisfaction Score", "Emergency Call Response Time",
      "Profit Margins Per Job Type", "We don't track any KPIs",
    ],
  },

  // HS Group B: Recurring/Scheduled (Pest Control, Landscaping, Cleaning)
  recurring: {
    crms: [
      "Jobber", "Housecall Pro", "GorillaDesk", "ZenMaid",
      "Pocomos", "Lawn Buddy", "No CRM/Software", "Other",
    ],
    toolsExtra: [
      "Route Optimization Software", "Service Agreement Management Platform",
      "Recurring Payment/Subscription Processor", "Viber",
    ],
    leadSources: [
      "Google Търсене/SEO", "Google Ads", "Facebook/Instagram реклами",
      "OLX.bg", "bazar.bg", "Alo.bg",
      "Флаери/Директен маркетинг", "Етажна собственост",
      "Сезонни кампании", "Препоръки от клиенти", "Viber групи",
    ],
    kpis: [
      "Service Agreement Retention Rate", "Customer Churn Rate",
      "Revenue Per Route/Crew", "Monthly Recurring Revenue (MRR)",
      "Average Service Agreement Value", "Customer Acquisition Cost",
      "On-Time Completion Rate", "Chemical/Material Cost Per Job",
      "We don't track any KPIs",
    ],
  },

  // HS Group C: Project-Based (Roofing, Painting, GC, Construction, Interior Design)
  project_based: {
    crms: [
      "Buildertrend", "JobTread", "Procore", "CoConstruct",
      "Houzz Pro", "Jobber", "No CRM/Software", "Other",
    ],
    toolsExtra: [
      "BIM/CAD Software (AutoCAD, Revit, SketchUp)",
      "Takeoff/Estimating Software (PlanSwift, Bluebeam)",
      "3D Rendering Tools (Enscape, Lumion)",
      "FF&E Specification Software (Studio Designer, Programa)",
      "Viber",
    ],
    leadSources: [
      "Google Търсене/SEO", "Google Ads", "OLX.bg",
      "Facebook/Instagram реклами", "Facebook групи",
      "Архитект/Инженер партньорства", "Препоръки от строители",
      "Instagram/Pinterest", "Препоръки от клиенти",
    ],
    kpis: [
      "Average Job/Project Value", "Estimate Close Rate",
      "Gross Margin Per Project", "Budget Adherence (CPI)",
      "Schedule Performance (SPI)", "Labor Productivity Rate",
      "Callback/Warranty Claim Rate", "Project Backlog Value",
      "Billable Hours Ratio", "We don't track any KPIs",
    ],
  },

  // RE: Residential Sales
  residential_sales: {
    crms: [
      "Follow Up Boss", "KVCore/Inside Real Estate", "Lofty (formerly Chime)",
      "Sierra Interactive", "LionDesk", "Wise Agent", "HubSpot",
      "Salesforce", "No CRM", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "imot.bg", "imoti.net", "homes.bg", "address.bg", "OLX.bg",
      "Google Ads", "Facebook/Instagram реклами",
      "Открити показвания", "Препоръки от клиенти",
      "Уебсайт на агенцията/IDX", "YouTube/Видео",
      "Строител/Предприемач партньорства",
    ],
    kpis: [
      "Leads Generated Per Agent", "Appointments Set Per Agent",
      "Conversion Rate (Lead to Client)", "Average Days to Close",
      "Cost Per Lead by Source", "GCI Per Agent",
      "Client Satisfaction Score", "Average List-to-Sale Price Ratio",
      "We don't track any KPIs",
    ],
  },

  // RE: Commercial / Office
  commercial: {
    crms: [
      "Apto", "Buildout", "REThink CRM", "Salesforce",
      "HubSpot", "No CRM", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "imot.bg Бизнес", "OLX.bg", "LinkedIn",
      "Брокерска мрежа", "Директно проучване/Обаждане",
      "Търговски асоциации", "RFP/Тръжни отговори",
      "Съществуващи наематели",
    ],
    kpis: [
      "Deals Closed Per Quarter", "Total Square Footage Leased",
      "Average Lease Value/Commission", "Pipeline Value",
      "Average Deal Cycle Length", "Commission Per Deal",
      "Tenant Retention Rate", "Prospecting Activity Per Broker",
      "We don't track any KPIs",
    ],
  },

  // RE: Property Management
  property_management: {
    crms: [
      "Buildium", "AppFolio", "Propertyware", "Rent Manager",
      "Rentec Direct", "TenantCloud", "No CRM/Software", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "Препоръки от агенти по продажби", "Директен контакт със собственици",
      "imot.bg Наеми", "OLX.bg",
      "LinkedIn (Търговски ПМ)", "Facebook групи за имоти",
      "Връзки с наемодатели",
    ],
    kpis: [
      "Occupancy Rate", "Average Days to Re-Lease",
      "Rent Collection Rate", "Maintenance Request Resolution Time",
      "Lease Renewal Rate", "Units Under Management Growth",
      "Net Operating Income (NOI) Per Property", "Owner Retention/Churn Rate",
      "We don't track any KPIs",
    ],
  },

  // RE: New Construction
  new_construction: {
    crms: [
      "Lasso CRM", "Buildertrend", "Zoho CRM",
      "Salesforce", "HubSpot", "No CRM", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "Списъци за предварителна продажба", "Програма за препоръки от строители",
      "Брокерска ко-оп мрежа", "Имотни изложения",
      "Facebook/Instagram реклами", "Google Ads",
      "Имейл кампании",
    ],
    kpis: [
      "Units Sold Per Month", "Presale Reservation Conversion Rate",
      "Average Time from Reservation to Contract",
      "Price Per SqFt vs Market Benchmark", "Co-Op Broker Deal Percentage",
      "Marketing Cost Per Unit Sold", "Cancellation/Refund Rate",
      "We don't track any KPIs",
    ],
  },

  // RE: Luxury / Resort
  luxury_resort: {
    crms: [
      "Salesforce", "Follow Up Boss", "LionDesk",
      "Top Producer", "Contactually", "No CRM", "Other",
    ],
    toolsExtra: ["Viber"],
    leadSources: [
      "Препоръки от луксозни клиенти",
      "imot.bg Луксозни", "homes.bg",
      "Партньорства с луксозни мрежи",
      "Instagram/Таргетирани социални медии",
      "Партньорства с финансови консултанти",
      "Преса/Редакционни материали", "Частни клиентски събития",
    ],
    kpis: [
      "Average Transaction Value", "International vs Domestic Buyer Ratio",
      "Time on Market for Luxury Listings", "Close Rate from Qualified Showings",
      "Referral/Repeat Client Rate", "Average Commission Per Transaction",
      "Qualified Buyer Introductions Per Month",
      "We don't track any KPIs",
    ],
  },
};

/**
 * Get language-aware sub-niche options.
 * Returns Bulgarian-market options for 'bg', English/US options otherwise.
 */
export function getSubNicheOptionsForLang(subNiche: SubNiche, lang: string): SubNicheOptions {
  const group = getSubNicheGroup(subNiche);
  return lang === 'bg' ? BG_SUB_NICHE_OPTIONS[group] : SUB_NICHE_OPTIONS[group];
}

/**
 * Weight overrides for scoring categories per sub-niche group.
 * All 7 values must sum to 1.0. Only groups with meaningfully
 * different priorities from the base weights get an entry.
 *
 * Base weights (used when no sub-niche or no override exists):
 *   technology: 0.10, leads: 0.20, scheduling: 0.15,
 *   communication: 0.10, followUp: 0.15, operations: 0.15, financial: 0.15
 */
export interface SubNicheWeights {
  technology: number;
  leads: number;
  scheduling: number;
  communication: number;
  followUp: number;
  operations: number;
  financial: number;
}

/**
 * Research-driven weight overrides per sub-niche group.
 * Only groups with meaningfully different priorities from base weights are listed.
 * Unlisted groups (e.g., residential_sales) use the base weights in scoring.ts.
 */
export const SUB_NICHE_WEIGHTS: Partial<Record<SubNicheGroup, SubNicheWeights>> = {
  // HS Reactive: emergency-driven — scheduling/dispatch is the core competitive advantage
  reactive: {
    technology: 0.10, leads: 0.20, scheduling: 0.20,
    communication: 0.10, followUp: 0.10, operations: 0.15, financial: 0.15,
  },

  // HS Recurring: subscription-based — retention and service agreements drive revenue
  recurring: {
    technology: 0.10, leads: 0.15, scheduling: 0.15,
    communication: 0.10, followUp: 0.20, operations: 0.15, financial: 0.15,
  },

  // HS Project-Based: high-value projects — financial controls and operations define profitability
  project_based: {
    technology: 0.10, leads: 0.15, scheduling: 0.10,
    communication: 0.10, followUp: 0.15, operations: 0.20, financial: 0.20,
  },

  // RE Commercial: long deal cycles — lead nurture and transaction management are critical
  commercial: {
    technology: 0.10, leads: 0.15, scheduling: 0.20,
    communication: 0.10, followUp: 0.10, operations: 0.20, financial: 0.15,
  },

  // RE Property Management: operational excellence — communication, operations, financial controls
  property_management: {
    technology: 0.10, leads: 0.10, scheduling: 0.10,
    communication: 0.15, followUp: 0.15, operations: 0.20, financial: 0.20,
  },

  // RE New Construction: presale pipeline — long nurture through build cycle
  new_construction: {
    technology: 0.10, leads: 0.20, scheduling: 0.20,
    communication: 0.10, followUp: 0.15, operations: 0.10, financial: 0.15,
  },

  // RE Luxury/Resort: relationship-intensive — communication, follow-up, and presentation tech
  luxury_resort: {
    technology: 0.15, leads: 0.15, scheduling: 0.10,
    communication: 0.15, followUp: 0.20, operations: 0.10, financial: 0.15,
  },
};
// NOTE: residential_sales intentionally omitted — base weights are a good fit

/** Get scoring weights for a sub-niche, falling back to null if no overrides exist */
export function getWeightsForSubNiche(subNiche: SubNiche | null): SubNicheWeights | null {
  if (!subNiche) return null;
  const group = getSubNicheGroup(subNiche);
  return SUB_NICHE_WEIGHTS[group] ?? null;
}

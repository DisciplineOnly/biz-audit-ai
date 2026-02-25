import {
  AuditFormState,
  AuditScores,
  CategoryScore,
  SubNiche,
} from "@/types/audit";
import { getWeightsForSubNiche } from "@/config/subNicheConfig";

// Maps dropdown values to 0-3 scores
// 0 = No process/major gap, 1 = Manual/inconsistent, 2 = Partial/somewhat, 3 = Fully optimized

const responseSpeedScore: Record<string, number> = {
  "Under 5 minutes": 3,
  "5–30 minutes": 2,
  "30–60 minutes": 2,
  "1–4 hours": 1,
  "Same business day": 1,
  "Next business day or later": 0,
  "No consistent process": 0,
  "It depends on the agent": 1,
};

const leadTrackingScore: Record<string, number> = {
  "CRM with pipeline stages": 3,
  "Spreadsheet/Google Sheets": 1,
  "Notebook/whiteboard": 0,
  "Software but not consistently": 1,
  "We don't really track this": 0,
};

const conversionRateScore: Record<string, number> = {
  "Yes - above 50%": 3,
  "Yes - 30–50%": 2,
  "Yes - under 30%": 1,
  "No - we don't track this": 0,
  "Above 10%": 3,
  "5–10%": 2,
  "2–5%": 1,
  "Under 2%": 0,
  "We don't track this": 0,
};

const reviewsScore: Record<string, number> = {
  "0–25": 0,
  "26–50": 1,
  "51–100": 2,
  "101–250": 3,
  "250+": 3,
};

const automationScore: Record<string, number> = {
  "Yes - automated via software": 3,
  "Yes - automated": 3,
  "Yes - manual/sometimes": 1,
  "Yes - manually ask sometimes": 1,
  No: 0,
};

const schedulingScore: Record<string, number> = {
  "Software with drag-and-drop board": 3,
  "Google/Outlook Calendar": 1,
  "Phone calls and a whiteboard": 0,
  "Paper schedule": 0,
  "No real system": 0,
};

const dispatchScore: Record<string, number> = {
  "Automated through software": 3,
  "Manual - office calls/texts techs": 1,
  "Techs check a shared calendar": 1,
  "Mixed approach": 1,
};

const followUpPlanScore: Record<string, number> = {
  "Yes - automated drip campaigns": 3,
  "Yes - manual but documented": 2,
  "Sort of - agents do their own thing": 1,
  "No formal plan": 0,
};

const nurtureDurationScore: Record<string, number> = {
  "30 days or less": 0,
  "1–3 months": 1,
  "3–6 months": 2,
  "6–12 months": 3,
  "We nurture indefinitely": 3,
  "Agents decide for themselves": 0,
};

const communicationScore: Record<string, number> = {
  "Yes - text and email": 3,
  "Yes - email only": 2,
  "Yes - text only": 2,
  "No - we call manually": 1,
  "No reminders sent": 0,
  "Yes - automated": 3,
  "Sometimes manually": 1,
  No: 0,
  "CRM-based communication (logged)": 3,
  "Personal phone/text (not logged)": 0,
  "Mix of both": 1,
  "Varies by agent": 0,
};

const afterHoursScore: Record<string, number> = {
  "AI chatbot or auto-responder": 3,
  "Auto-responder with info": 3,
  "AI chatbot": 3,
  "Answering service": 2,
  "Voicemail with next-day callback": 1,
  "After-hours calls go unanswered": 0,
  "Goes unanswered until next day": 0,
  "Agents handle on personal phones": 1,
};

const financialReviewScore: Record<string, number> = {
  "Monthly P&L and KPI review": 3,
  "Monthly financial review with bookkeeper/accountant": 3,
  "Quarterly review": 2,
  "Annual with accountant": 1,
  "Annual review": 1,
  "We check the bank account": 0,
  "We don't track team P&L": 0,
};

const estimateScore: Record<string, number> = {
  "Software-generated with digital approval": 3,
  "PDF/email quotes": 2,
  "Paper/verbal estimates": 0,
  "No standard process": 0,
};

const pricingScore: Record<string, number> = {
  "Flat rate pricing": 3,
  "Time & materials": 1,
  "Mix of both": 2,
  "No standardized pricing": 0,
};

const performanceScore: Record<string, number> = {
  "KPIs tracked in software (revenue per tech, callback rate, etc.)": 3,
  "CRM dashboards with KPIs": 3,
  "We review numbers quarterly": 1,
  "Spreadsheet tracking": 1,
  "Monthly production reports": 2,
  "Manager observation": 0,
  "No formal measurement": 0,
};

function scoreLeadSources(sources: string[]): number {
  if (sources.length >= 4) return 3;
  if (sources.length === 3) return 2;
  if (sources.length === 2) return 1;
  return 0;
}

function scoreToolsUsed(tools: string[]): number {
  if (tools.length >= 8) return 3;
  if (tools.length >= 5) return 2;
  if (tools.length >= 2) return 1;
  return 0;
}

function scoreKPIs(kpis: string[]): number {
  const noKPI = kpis.some((k) => k.includes("don't track") || k.includes("Не проследяваме"));
  if (noKPI) return 0;
  if (kpis.length >= 6) return 3;
  if (kpis.length >= 4) return 2;
  if (kpis.length >= 2) return 1;
  return 0;
}

function scorePaymentMethods(methods: string[]): number {
  if (methods.length >= 4) return 3;
  if (methods.length === 3) return 2;
  if (methods.length === 2) return 1;
  return 0;
}

function scoreMap(value: string, map: Record<string, number>): number {
  return map[value] ?? 1;
}

function calcCategory(scores: number[], maxPerItem: number = 3): number {
  if (scores.length === 0) return 50;
  const sum = scores.reduce((a, b) => a + b, 0);
  const max = scores.length * maxPerItem;
  return Math.round((sum / max) * 100);
}

export function computeScores(
  state: AuditFormState,
  subNiche?: SubNiche | null,
): AuditScores {
  const isHS = state.niche === "home_services";

  // Technology (Step 2)
  const techScores = [
    state.step2.crmSatisfaction ? state.step2.crmSatisfaction - 1 : 1, // 0-4 → normalize 0-3
    scoreToolsUsed(state.step2.toolsUsed),
  ];
  const technology = calcCategory(techScores);

  // Leads (Step 3)
  const leadScores = [
    scoreLeadSources(state.step3.leadSources),
    scoreMap(state.step3.responseSpeed, responseSpeedScore),
    scoreMap(state.step3.leadTracking, leadTrackingScore),
    scoreMap(state.step3.conversionRate, conversionRateScore),
    scoreMap(state.step3.googleReviews, reviewsScore),
    scoreMap(state.step3.reviewAutomation, automationScore),
  ];
  if (isHS) {
    leadScores.push(
      scoreMap(state.step3.missedCallHandling || "", {
        "Auto text-back within seconds": 3,
        "Voicemail - we call back ASAP": 2,
        "Voicemail - we call back when we can": 1,
        "Answering service": 2,
        "We probably miss some and never follow up": 0,
      }),
    );
  } else {
    leadScores.push(
      scoreMap(state.step3.touchesIn7Days || "", {
        "8+ touches": 3,
        "5–7 touches": 2,
        "2–4 touches": 1,
        "1 touch": 0,
        "No consistent follow-up plan": 0,
      }),
    );
    leadScores.push(
      scoreMap(state.step3.leadDistribution || "", {
        "Round robin - automated": 3,
        "Round robin - manual": 2,
        "Pond/claim system": 1,
        "Assigned by source or area": 2,
        "First to grab it": 1,
        "No formal system": 0,
      }),
    );
  }
  const leads = calcCategory(leadScores);

  // Scheduling / Lead Management (Step 4)
  let scheduling: number;
  if (isHS) {
    const s4Scores = [
      scoreMap(state.step4.schedulingMethod || "", schedulingScore),
      scoreMap(state.step4.dispatchMethod || "", dispatchScore),
      scoreMap(state.step4.routeOptimization || "", {
        "Yes - software optimized": 3,
        "We try to cluster jobs manually": 1,
        No: 0,
      }),
      scoreMap(state.step4.realTimeTracking || "", {
        "Yes - GPS tracking": 3,
        No: 0,
      }),
      scoreMap(state.step4.capacityPlanning || "", {
        "Software manages availability": 3,
        "We eyeball it": 1,
        "We often overbook or underbook": 0,
      }),
      scoreMap(state.step4.emergencyHandling || "", {
        "Dedicated slots held open": 3,
        "We shuffle the schedule": 1,
        "We usually can't accommodate them": 0,
        "It's chaotic": 0,
      }),
    ];
    scheduling = calcCategory(s4Scores);
  } else {
    const s4Scores = [
      scoreMap(state.step4.followUpPlan || "", followUpPlanScore),
      scoreMap(state.step4.nurtureDuration || "", nurtureDurationScore),
      scoreMap(state.step4.automatedDrip || "", {
        "Yes - fully automated": 3,
        "Yes - partially automated": 1,
        No: 0,
      }),
      scoreMap(state.step4.leadTemperatureTracking || "", {
        "CRM lead scoring": 3,
        "Manual tags/labels in CRM": 2,
        "Agents keep mental notes": 0,
        "We don't differentiate": 0,
      }),
      scoreMap(state.step4.activityLogging || "", {
        "Yes - consistently": 3,
        Sometimes: 1,
        Rarely: 0,
        "We don't require it": 0,
      }),
      scoreMap(state.step4.coldLeadHandling || "", {
        "Long-term automated nurture": 3,
        "Manual follow-up for 2+ weeks": 1,
        "A few attempts then move on": 0,
        "We mostly give up": 0,
      }),
    ];
    scheduling = calcCategory(s4Scores);
  }

  // Communication (Step 5)
  const commScores = [
    scoreMap(state.step5.internalComms, {
      "Field service app/software": 3,
      "Team app (Slack, Teams, etc.)": 3,
      "Group text/chat app": 2,
      "Group text": 1,
      "Phone calls": 1,
      Email: 1,
      "Mixed/inconsistent": 0,
      "In-person meetings only": 0,
    }),
    scoreMap(state.step5.afterHoursComms, afterHoursScore),
    scoreMap(state.step5.clientPortal, {
      Yes: 3,
      "Yes - through our software": 3,
      "No but we want one": 1,
      "No and not a priority": 0,
    }),
  ];
  if (isHS) {
    commScores.push(
      scoreMap(state.step5.appointmentReminders || "", communicationScore),
      scoreMap(state.step5.onTheWayNotifications || "", communicationScore),
      scoreMap(state.step5.jobCompletionComms || "", {
        "Digital summary/invoice sent immediately": 3,
        "We explain verbally": 1,
        "Paper invoice left behind": 0,
        "No formal communication": 0,
      }),
    );
  } else {
    commScores.push(
      scoreMap(state.step5.agentClientComms || "", communicationScore),
      scoreMap(state.step5.transactionUpdates || "", {
        "Yes - key milestones automated": 3,
        "Some manual updates": 1,
        "No - agents handle individually": 0,
      }),
      scoreMap(state.step5.pastClientEngagement || "", {
        "Automated long-term drip": 3,
        "Annual check-ins/market updates": 2,
        "Holiday cards/occasional emails": 1,
        "We don't maintain contact consistently": 0,
      }),
    );
  }
  const communication = calcCategory(commScores);

  // Follow-Up & Retention (Step 6)
  const followUpScores = [
    scoreMap(state.step6.repeatBusinessPercent, {
      "Over 50%": 3,
      "30–50%": 2,
      "10–30%": 1,
      "Under 10%": 0,
      "We don't know": 0,
      "We don't track this": 0,
    }),
  ];
  if (isHS) {
    followUpScores.push(
      scoreMap(state.step6.postJobFollowUp || "", {
        "Automated follow-up sequence (thank you + review request + maintenance reminder)": 3,
        "We send a review request": 1,
        "Nothing formal": 0,
        "Depends on the tech": 0,
      }),
      scoreMap(state.step6.maintenanceReminders || "", automationScore),
      scoreMap(state.step6.serviceAgreements || "", {
        "Yes - actively sold": 3,
        "Yes - but rarely sell them": 1,
        No: 0,
      }),
      scoreMap(state.step6.estimateFollowUp || "", {
        "Automated follow-up sequence": 3,
        "Manual follow-up within a week": 1,
        "We follow up if we remember": 0,
        "We don't follow up": 0,
      }),
      scoreMap(state.step6.warrantyTracking || "", {
        "Tracked in software": 3,
        "Tracked in spreadsheets": 1,
        "We don't track this": 0,
      }),
    );
  } else {
    followUpScores.push(
      scoreMap(state.step6.postCloseFollowUp || "", {
        "Automated post-close nurture sequence": 3,
        "Manual thank-you and check-in": 1,
        "Closing gift and that's about it": 0,
        "Nothing formal": 0,
      }),
      scoreMap(state.step6.pastClientContact || "", {
        "CRM-based annual touchpoint plan": 3,
        "Occasional emails/newsletters": 1,
        "Social media only": 0,
        "We don't have a system": 0,
      }),
      scoreMap(state.step6.referralProcess || "", {
        "Yes - automated asks at key milestones": 3,
        "Yes - manual but consistent": 2,
        "We ask occasionally": 1,
        "No formal process": 0,
      }),
      scoreMap(state.step6.lostLeadFollowUp || "", {
        "Automated long-term nurture": 3,
        "Manual follow-up for a few weeks": 1,
        "We mostly move on": 0,
        "No process": 0,
      }),
      scoreMap(state.step6.anniversaryTracking || "", {
        "Yes - automated": 3,
        "Yes - manual": 1,
        No: 0,
      }),
    );
  }
  const followUp = calcCategory(followUpScores);

  // Operations (Step 7)
  const opScores = [scoreKPIs(state.step7.kpisTracked)];
  if (isHS) {
    opScores.push(
      scoreMap(state.step7.performanceMeasurement || "", performanceScore),
      scoreMap(state.step7.jobCosting || "", {
        "Tracked per job in software": 3,
        "Estimated but not tracked precisely": 1,
        "We mostly guess": 0,
        "We don't track job costs": 0,
      }),
      scoreMap(state.step7.inventoryManagement || "", {
        "Inventory management software": 3,
        "Spreadsheet tracking": 1,
        "Techs manage their own trucks": 0,
        "No formal tracking": 0,
      }),
      scoreMap(state.step7.timeTracking || "", {
        "GPS + software time tracking": 3,
        "Manual time sheets": 1,
        "Clock in/clock out": 1,
        "They don't log time": 0,
      }),
      scoreMap(state.step7.qualityControl || "", {
        "QA checklist + customer survey": 3,
        "Customer feedback reviewed regularly": 2,
        "Handle complaints as they come": 0,
        "No formal process": 0,
      }),
    );
  } else {
    opScores.push(
      scoreMap(state.step7.agentPerformanceMeasurement || "", performanceScore),
      scoreMap(state.step7.agentAccountability || "", {
        "Daily/weekly activity minimums tracked in CRM": 3,
        "Weekly team meetings with accountability": 2,
        "Informal check-ins": 1,
        "No accountability system": 0,
      }),
      scoreMap(state.step7.transactionWorkflow || "", {
        "Transaction management software (Dotloop, SkySlope, etc.)": 3,
        "Checklists in CRM": 2,
        "Spreadsheet/Google Docs": 1,
        "No standardized process": 0,
      }),
      scoreMap(state.step7.agentOnboarding || "", {
        "Documented training program + mentorship": 3,
        "Informal training": 1,
        "Shadow other agents": 1,
        "Figure it out yourself": 0,
      }),
    );
  }
  const operations = calcCategory(opScores);

  // Financial (Step 8)
  const finScores = [
    scorePaymentMethods(state.step8.paymentMethods),
    scoreMap(state.step8.financialReview || "", financialReviewScore),
  ];
  if (isHS) {
    finScores.push(
      scoreMap(state.step8.estimateProcess || "", estimateScore),
      scoreMap(state.step8.pricingModel || "", pricingScore),
      scoreMap(state.step8.invoiceTiming || "", {
        "Immediately on-site (digital)": 3,
        "Same day": 2,
        "Within a few days": 1,
        "It varies a lot": 0,
      }),
      scoreMap(state.step8.collectionsProcess || "", {
        "Automated reminders + escalation": 3,
        "Manual follow-up": 1,
        "We chase when we remember": 0,
        "We write off a lot of receivables": 0,
      }),
    );
  } else {
    finScores.push(
      scoreMap(state.step8.expenseTracking || "", {
        "Team/brokerage software": 3,
        Spreadsheet: 1,
        "Accounting software": 2,
        "Agents handle their own": 0,
        "No system": 0,
      }),
      scoreMap(state.step8.teamPnL || "", financialReviewScore),
      scoreMap(state.step8.commissionDisbursement || "", {
        "Automated through transaction management software": 3,
        "Manual but systematic": 1,
        "Ad hoc": 0,
      }),
      scoreMap(state.step8.marketingBudget || "", {
        "Yes - detailed per-channel tracking": 3,
        "Yes - total spend tracked": 2,
        "We spend but don't track ROI": 1,
        "No formal marketing budget": 0,
      }),
    );
  }
  const financial = calcCategory(finScores);

  // Overall weighted score
  // Base weights - used when no sub-niche or no override exists
  const baseWeights = {
    technology: 0.1,
    leads: 0.2,
    scheduling: 0.15,
    communication: 0.1,
    followUp: 0.15,
    operations: 0.15,
    financial: 0.15,
  };

  // Apply sub-niche weight overrides when available
  const subNicheWeights = getWeightsForSubNiche(subNiche ?? null);
  const weights = subNicheWeights ?? baseWeights;

  const overall = Math.round(
    technology * weights.technology +
      leads * weights.leads +
      scheduling * weights.scheduling +
      communication * weights.communication +
      followUp * weights.followUp +
      operations * weights.operations +
      financial * weights.financial,
  );

  const schedulingLabel = isHS ? "Scheduling & Dispatch" : "Lead Management";

  const categories: CategoryScore[] = [
    {
      category: "technology",
      label: "Technology & Software",
      score: technology,
      weight: Math.round(weights.technology * 100),
    },
    {
      category: "leads",
      label: "Lead Funnel & Marketing",
      score: leads,
      weight: Math.round(weights.leads * 100),
    },
    {
      category: "scheduling",
      label: schedulingLabel,
      score: scheduling,
      weight: Math.round(weights.scheduling * 100),
    },
    {
      category: "communication",
      label: "Communication",
      score: communication,
      weight: Math.round(weights.communication * 100),
    },
    {
      category: "followUp",
      label: "Follow-Up & Retention",
      score: followUp,
      weight: Math.round(weights.followUp * 100),
    },
    {
      category: "operations",
      label: "Operations & Accountability",
      score: operations,
      weight: Math.round(weights.operations * 100),
    },
    {
      category: "financial",
      label: "Financial Operations",
      score: financial,
      weight: Math.round(weights.financial * 100),
    },
  ];

  return {
    technology,
    leads,
    scheduling,
    communication,
    followUp,
    operations,
    financial,
    overall,
    categories,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "hsl(var(--score-green))";
  if (score >= 50) return "hsl(var(--score-yellow))";
  if (score >= 25) return "hsl(var(--score-orange))";
  return "hsl(var(--score-red))";
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Needs Work";
  return "Critical Gap";
}

export function getBenchmark(score: number): "above" | "average" | "below" {
  if (score >= 65) return "above";
  if (score >= 40) return "average";
  return "below";
}

export function generateMockReport(state: AuditFormState, scores: AuditScores, lang: string = "en") {
  const isHS = state.niche === "home_services";
  const isBG = lang === "bg";
  const businessName = state.step1.businessName || (isBG ? "Вашият бизнес" : "Your Business");

  // Find weakest categories for gap analysis
  const sorted = [...scores.categories].sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 3);

  const criticalGaps = weakest.map((cat) => {
    const gapMap: Record<
      string,
      { title: string; description: string; impact: string }
    > = isBG ? {
      leads: {
        title: "Пропуски в отговор на запитвания и конверсия",
        description: isHS
          ? `Времето Ви за отговор на запитвания и проследяването на конверсиите Ви струват поръчки. Бизнесите, които отговарят до 5 минути, имат 21 пъти по-голям шанс да квалифицират клиент от тези, които отговарят след 30 минути.`
          : `Скоростта Ви на отговор и честотата на проследяване оставят сделки на масата. Екипите, които отговарят до 5 минути, конвертират 3 пъти повече интернет запитвания в срещи.`,
        impact: "Очаквани 15–30% повече приключени сделки с автоматизация на отговорите",
      },
      technology: {
        title: "Недостатъчно използване на технологиите",
        description: isHS
          ? `Текущият Ви софтуер не работи достатъчно ефективно за Вас. Модерните платформи за полеви услуги автоматизират планиране, диспечиране, фактуриране и проследяване — елиминирайки ръчна работа и човешки грешки.`
          : `Вашият CRM не носи пълната си стойност. Най-добрите екипи използват CRM като единствен източник на истина за всички активности с клиенти, позволявайки обучение, прогнозиране и автоматизация.`,
        impact: "10–20 часа/седмица спестени чрез автоматизация",
      },
      scheduling: {
        title: isHS
          ? "Неефективност в планирането и диспечирането"
          : "Пропуски в управлението на клиенти",
        description: isHS
          ? `Ръчното планиране и диспечиране създава празнини в графика Ви, хаби време за пътуване на техниците и прави почти невъзможно ефективното обработване на спешни обаждания.`
          : `Без документирана автоматизирана система за проследяване, клиентите се губят. Средното запитване изисква 8–12 контакта преди конверсия — повечето екипи се отказват след 2–3.`,
        impact: isHS
          ? "15–25% повече завършени задачи седмично с оптимизация на маршрути"
          : "20–40% повече конвертирани клиенти със системно проследяване",
      },
      communication: {
        title: "Пропуски в комуникацията с клиентите",
        description: isHS
          ? `Липсващи напомняния за срещи, без известия „на път съм" и непоследователно проследяване са причина №1 за негативни отзиви и отмени.`
          : `Непоследователна комуникация с активни клиенти и липса на системно проследяване на минали клиенти причинява загуба на препоръки и повторен бизнес.`,
        impact: "25–40% намаляване на отмените и неявяванията",
      },
      followUp: {
        title: "Пропуски в проследяването и задържането",
        description: isHS
          ? `Оставяте повторни приходи и препоръки на масата. Повечето бизнеси получават 40–60% от приходите си от повторни клиенти — но само ако остават в съзнанието им чрез последователно проследяване.`
          : `Проследяването след сделка и системите за препоръки са най-печелившата дейност в недвижимите имоти — но само ако е систематизирана. Без автоматизация просто не се случва последователно.`,
        impact: "30–50% увеличение на приходите от повторни клиенти и препоръки",
      },
      operations: {
        title: "Операционни и KPI слепи петна",
        description: isHS
          ? `Без проследяване на ключови показатели за ефективност, работите на сляпо. Не можете да подобрите нещо, което не измервате — а конкурентите Ви използват данни за оптимизиране на всеки аспект от бизнеса си.`
          : `Без ясни KPI за агентите и системи за отчетност, топ изпълнителите носят на гърба си по-слабите и общата продуктивност на екипа страда. Обучението, базирано на данни, е ключовият диференциатор.`,
        impact: "15–25% подобрение на продуктивността чрез системи за отчетност",
      },
      financial: {
        title: "Пропуски във финансовите операции",
        description: isHS
          ? `Непоследователно ценообразуване, бавно фактуриране и лошо събиране на вземания директно влияят на паричния Ви поток и рентабилност. Бизнесите със стандартизирано ценообразуване и дигитално фактуриране в същия ден събират 30% по-бързо.`
          : `Без детайлно проследяване на печалба/загуба и ROI по канали за маркетинг, не можете да вземате умни инвестиционни решения или да определите кои източници на клиенти са наистина печеливши.`,
        impact: "Подобрен паричен поток и 10–20% намаляване на несъбрани приходи",
      },
    } : {
      leads: {
        title: "Lead Response & Conversion Gaps",
        description: isHS
          ? `Your lead response time and conversion tracking are costing you jobs. Businesses that respond within 5 minutes are 21x more likely to qualify a lead than those who respond after 30 minutes.`
          : `Your lead response speed and nurture cadence are leaving deals on the table. Teams that respond within 5 minutes convert 3x more internet leads into appointments.`,
        impact:
          "Estimated 15–30% more closed deals with immediate response automation",
      },
      technology: {
        title: "Technology Stack Underutilization",
        description: isHS
          ? `Your current software isn't working hard enough for you. Modern field service platforms automate scheduling, dispatch, invoicing, and follow-up - eliminating manual work and human error.`
          : `Your CRM isn't delivering its full value. The best teams use their CRM as the single source of truth for all lead and client activity, enabling coaching, forecasting, and automation.`,
        impact: "10–20 hours/week recovered through automation",
      },
      scheduling: {
        title: isHS
          ? "Scheduling & Dispatch Inefficiency"
          : "Lead Management Process Gaps",
        description: isHS
          ? `Manual scheduling and dispatching creates gaps in your calendar, wastes technician drive time, and makes it nearly impossible to handle emergency calls efficiently.`
          : `Without a documented, automated lead follow-up system, leads fall through the cracks. The average lead requires 8–12 touches before converting - most teams give up after 2–3.`,
        impact: isHS
          ? "15–25% more jobs completed per week with route optimization"
          : "20–40% more leads converted with systematic nurture",
      },
      communication: {
        title: "Customer Communication Breakdowns",
        description: isHS
          ? `Missing appointment reminders, no on-the-way notifications, and inconsistent follow-up are the #1 drivers of negative reviews and cancellations.`
          : `Inconsistent communication with active clients and no systematic past-client follow-up is causing referral leakage and repeat business loss.`,
        impact: "25–40% reduction in cancellations and no-shows",
      },
      followUp: {
        title: "Follow-Up & Retention Failures",
        description: isHS
          ? `You're leaving repeat and referral revenue on the table. Most businesses get 40–60% of revenue from repeat customers - but only if they stay top-of-mind with consistent follow-up.`
          : `Post-close follow-up and referral systems are the most profitable activity in real estate - but only if systematized. Without automation, it simply doesn't happen consistently.`,
        impact: "30–50% increase in repeat/referral revenue",
      },
      operations: {
        title: "Operations & KPI Blind Spots",
        description: isHS
          ? `Without tracking key performance indicators, you're flying blind. You can't improve what you don't measure - and your competitors are using data to optimize every aspect of their business.`
          : `Without clear agent KPIs and accountability systems, top performers carry underperformers and overall team productivity suffers. Data-driven coaching is the differentiator.`,
        impact:
          "15–25% productivity improvement through accountability systems",
      },
      financial: {
        title: "Financial Operations Gaps",
        description: isHS
          ? `Inconsistent pricing, slow invoicing, and poor collections are directly impacting your cash flow and profitability. Businesses with standardized pricing and same-day digital invoicing collect 30% faster.`
          : `Without detailed P&L tracking and per-channel marketing ROI, you can't make smart investment decisions or identify which lead sources are actually profitable.`,
        impact:
          "Improved cash flow and 10–20% reduction in uncollected revenue",
      },
    };
    const fallback = isBG
      ? {
          title: `${cat.label} — необходимо подобрение`,
          description: `Вашият резултат от ${cat.score}% в ${cat.label.toLowerCase()} показва значителен потенциал за подобрение с правилните системи и процеси.`,
          impact: "Значителни подобрения в ефективността и приходите са възможни",
        }
      : {
          title: `${cat.label} Improvement Needed`,
          description: `Your ${cat.label.toLowerCase()} score of ${cat.score}% indicates significant room for improvement with the right systems and processes.`,
          impact: "Significant efficiency and revenue gains available",
        };
    return gapMap[cat.category] || fallback;
  });

  const quickWins = isHS
    ? isBG
      ? [
          {
            title: "Настройте автоматичен отговор на пропуснати обаждания",
            description:
              "Конфигурирайте Вашия CRM да изпраща автоматичен SMS на всеки пропуснат обаждащ се в рамките на 60 секунди с линк за онлайн резервация.",
            timeframe: "Може да е готово за 24–48 часа",
          },
          {
            title: "Активирайте автоматизация за заявки за отзиви",
            description:
              "Настройте автоматичен SMS с молба за Google отзив веднага след всяка завършена задача. Само това може да удвои броя на отзивите Ви в рамките на 90 дни.",
            timeframe: "Настройва се за 1–2 часа с повечето платформи",
          },
          {
            title: "Създайте последователност за проследяване след задача",
            description:
              "Изградете проста 3-съобщения последователност: (1) Благодарност + заявка за отзив, (2) Съвет за поддръжка, свързан със задачата, (3) Сезонно напомняне за услуга. Настройте го на автоматичен режим.",
            timeframe: "1–2 дни за създаване и активиране",
          },
        ]
      : [
          {
            title: "Set Up Missed Call Text-Back",
            description:
              "Configure your CRM or a tool like Hatch or Missed Call Text Back to automatically text every missed caller within 60 seconds with a link to book online.",
            timeframe: "Can be live in 24–48 hours",
          },
          {
            title: "Activate Review Request Automation",
            description:
              "Set up an automated text message requesting a Google review immediately after every completed job. This alone can double your review count within 90 days.",
            timeframe: "Set up in 1–2 hours with most field service platforms",
          },
          {
            title: "Create a Post-Job Follow-Up Sequence",
            description:
              "Build a simple 3-message follow-up: (1) Thank you + review request, (2) Maintenance tip related to the job, (3) Seasonal service reminder. Set it to run automatically.",
            timeframe: "1–2 days to create and activate",
          },
        ]
    : isBG
      ? [
          {
            title: "Въведете стандарт за отговор до 5 минути",
            description:
              "Създайте писмена процедура, изискваща всички интернет запитвания да получат обаждане + SMS до 5 минути. Използвайте автоматизация в CRM за разпределяне по ротация.",
            timeframe: "Може да се приложи за 24 часа",
          },
          {
            title: "Изградете 30-дневна последователност за проследяване",
            description:
              "Създайте минимум 8-стъпкова имейл + SMS последователност за всички нови запитвания, които не се конвертират веднага в срещи. Повечето CRM системи имат тази функция вградена.",
            timeframe: "3–5 часа за настройка в текущия Ви CRM",
          },
          {
            title: "Стартирайте кампания за препоръки от минали клиенти",
            description:
              "Изпратете личен имейл до клиентите Ви от последните 2 години с въпрос дали познават някой, който има нужда от помощ при покупка или продажба. Личните контакти конвертират с 20–30%.",
            timeframe: "Може да се изпрати днес — отнема 1 час",
          },
        ]
      : [
          {
            title: "Implement 5-Minute Lead Response SOP",
            description:
              "Create a written standard operating procedure requiring all internet leads to receive a call + text within 5 minutes. Use round-robin automation in your CRM to enforce it.",
            timeframe: "Can be implemented in 24 hours",
          },
          {
            title: "Build a 30-Day Lead Nurture Sequence",
            description:
              "Create a minimum 8-touch email + text drip sequence for all new leads who don't immediately convert to appointments. Most CRMs have this built in and unused.",
            timeframe: "3–5 hours to set up in your existing CRM",
          },
          {
            title: "Launch a Past Client Referral Campaign",
            description:
              "Send a simple personal email to your last 2 years of closed clients asking if they know anyone who needs help buying or selling. Personal outreach converts at 20–30%.",
            timeframe: "Can send today - takes 1 hour",
          },
        ];

  const strategicRecs = isHS
    ? isBG
      ? [
          {
            title: "Внедрете AI система за отговори и резервации",
            description:
              "Деплойте AI гласов агент или чатбот, който отговаря на обаждания извън работно време, квалифицира запитвания и резервира задачи директно в софтуера Ви за планиране — 24/7, без персонал.",
            roi: "Очаквани 15–25 допълнително резервирани задачи на месец",
          },
          {
            title: "Надградете до пълна платформа за управление на полеви услуги",
            description:
              "Преминете към цялостна платформа, която обединява планиране, диспечиране, фактуриране, комуникация с клиенти и отчетност на едно място.",
            roi: "10–20 часа/седмица спестени, 15–30% увеличение на приходите типично в рамките на 12 месеца",
          },
          {
            title: "Стартирайте програма за абонаменти/планове за поддръжка",
            description:
              "Създайте рекурентен приход със сезонен план за поддръжка. Дори с 50 абоната, това е предвидим годишен приход — плюс приоритетни клиенти, които препоръчват.",
            roi: "Значителен нов рекурентен приход в зависимост от размера на клиентската база",
          },
        ]
      : [
          {
            title: "Implement an AI-Powered Answering & Booking System",
            description:
              "Deploy an AI voice agent or chatbot that answers after-hours calls, qualifies leads, and books jobs directly into your scheduling software - 24/7, without staff.",
            roi: "Estimated 15–25 additional booked jobs per month",
          },
          {
            title: "Upgrade to a Full Field Service Management Platform",
            description:
              "Migrate to an all-in-one platform (ServiceTitan, Jobber, or Housecall Pro) that unifies scheduling, dispatch, invoicing, customer communication, and reporting in one place.",
            roi: "10–20 hours/week saved, 15–30% revenue increase typical within 12 months",
          },
          {
            title: "Launch a Membership/Maintenance Plan Program",
            description:
              "Create recurring revenue with a seasonal maintenance plan. Even with 50 members at $150/year, that's $7,500 in predictable annual revenue - plus priority customers who refer.",
            roi: "$50K–$200K in new recurring revenue depending on your customer base size",
          },
        ]
    : isBG
      ? [
          {
            title: "Внедрете цялостна CRM система за проследяване",
            description:
              "Приложете автоматизирани дългосрочни последователности за проследяване (6–18 месеца) и систематичен план за контакт с минали клиенти. Средната сделка за покупка/продажба отнема 6–18 месеца до приключване.",
            roi: "30–50% повече сключени сделки от съществуващата Ви база данни",
          },
          {
            title: "Изградете AI система за квалификация на запитвания",
            description:
              "Внедрете AI чат или гласова квалификация на уебсайта и порталите Ви, за да ангажирате запитвания мигновено, да квалифицирате времевата им рамка и мотивация, и да насочите горещите клиенти към агенти незабавно.",
            roi: "3–5 пъти подобрение в конверсията на интернет запитвания",
          },
          {
            title: "Създайте табла за представяне на агентите",
            description:
              "Изградете седмични KPI табла, показващи запитванията, контактите, срещите и договорите на всеки агент. Обучителните сесии, базирани на данни, подобряват продуктивността на екипа с 20–35%.",
            roi: "15–30% увеличение на GCI на екипа в рамките на 6 месеца",
          },
        ]
      : [
          {
            title: "Deploy a Comprehensive CRM Follow-Up System",
            description:
              "Implement automated long-term lead nurture sequences (6–18 months) and a systematic past-client touchpoint plan. The average buyer/seller transaction takes 6–18 months to close.",
            roi: "30–50% more closings from your existing lead database",
          },
          {
            title: "Build an AI-Powered Lead Qualification System",
            description:
              "Implement AI chat or voice qualification on your website and portals to engage leads instantly, qualify their timeline and motivation, and route hot leads to agents immediately.",
            roi: "3–5x improvement in internet lead conversion rates",
          },
          {
            title: "Create Agent Performance Dashboards",
            description:
              "Build weekly KPI dashboards showing each agent's leads, contacts, appointments, and contracts. Data-driven coaching sessions improve team productivity by 20–35%.",
            roi: "15–30% increase in team GCI within 6 months",
          },
        ];

  return { criticalGaps, quickWins, strategicRecs };
}

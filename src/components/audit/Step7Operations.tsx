import { FormField, StepHeader, StyledSelect, MultiCheckbox, StepProps, toOptions } from "./AuditFormComponents";

const HS_PERFORMANCE = toOptions([
  "KPIs tracked in software (revenue per tech, callback rate, etc.)",
  "We review numbers quarterly", "Manager observation", "No formal measurement",
]);
const HS_JOB_COSTING = toOptions([
  "Tracked per job in software", "Estimated but not tracked precisely",
  "We mostly guess", "We don't track job costs",
]);
const HS_INVENTORY = toOptions([
  "Inventory management software", "Spreadsheet tracking",
  "Techs manage their own trucks", "No formal tracking",
]);
const HS_TIME = toOptions([
  "GPS + software time tracking", "Manual time sheets",
  "Clock in/clock out", "They don't log time",
]);
const HS_QUALITY = toOptions([
  "QA checklist + customer survey", "Customer feedback reviewed regularly",
  "Handle complaints as they come", "No formal process",
]);
const HS_KPIS = toOptions([
  "Average Ticket/Job Value", "Close/Conversion Rate", "Revenue Per Technician",
  "Callback/Redo Rate", "Customer Acquisition Cost", "Membership/Service Plan Count",
  "Customer Satisfaction Score", "Average Lead Response Time",
  "Profit Margins Per Job Type", "We don't track any KPIs",
]);

const RE_PERFORMANCE = toOptions([
  "CRM dashboards with KPIs", "Spreadsheet tracking",
  "Monthly production reports", "No formal measurement",
]);
const RE_ACCOUNTABILITY = toOptions([
  "Daily/weekly activity minimums tracked in CRM", "Weekly team meetings with accountability",
  "Informal check-ins", "No accountability system",
]);
const RE_TRANSACTION = toOptions([
  "Transaction management software (Dotloop, SkySlope, etc.)",
  "Checklists in CRM", "Spreadsheet/Google Docs", "No standardized process",
]);
const RE_ONBOARDING = toOptions([
  "Documented training program + mentorship", "Informal training",
  "Shadow other agents", "Figure it out yourself",
]);
const RE_KPIS = toOptions([
  "Leads generated per agent", "Appointments set per agent",
  "Conversion rate (lead → client)", "Average days to close",
  "Cost per lead by source", "GCI per agent",
  "Client satisfaction score", "Average list-to-sale price ratio",
  "We don't track any KPIs",
]);

export function Step7Operations({ state, dispatch, isHS }: StepProps) {
  const { step7 } = state;
  const update = (payload: Partial<typeof step7>) => dispatch({ type: "UPDATE_STEP7", payload });

  return (
    <div>
      <StepHeader
        step={7}
        title="Operations & Accountability"
        subtitle="How you measure performance and run a tight operation"
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label="How do you measure technician performance?">
              <StyledSelect
                value={step7.performanceMeasurement || ""}
                onChange={(v) => update({ performanceMeasurement: v })}
                options={HS_PERFORMANCE}
              />
            </FormField>
            <FormField label="How accurate is your job costing?">
              <StyledSelect
                value={step7.jobCosting || ""}
                onChange={(v) => update({ jobCosting: v })}
                options={HS_JOB_COSTING}
              />
            </FormField>
            <FormField label="How do you manage parts and inventory?">
              <StyledSelect
                value={step7.inventoryManagement || ""}
                onChange={(v) => update({ inventoryManagement: v })}
                options={HS_INVENTORY}
              />
            </FormField>
            <FormField label="How do technicians log their time?">
              <StyledSelect
                value={step7.timeTracking || ""}
                onChange={(v) => update({ timeTracking: v })}
                options={HS_TIME}
              />
            </FormField>
            <FormField label="How do you ensure job quality and handle callbacks?">
              <StyledSelect
                value={step7.qualityControl || ""}
                onChange={(v) => update({ qualityControl: v })}
                options={HS_QUALITY}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="How do you measure agent performance?">
              <StyledSelect
                value={step7.agentPerformanceMeasurement || ""}
                onChange={(v) => update({ agentPerformanceMeasurement: v })}
                options={RE_PERFORMANCE}
              />
            </FormField>
            <FormField label="How do you hold agents accountable to activity standards?">
              <StyledSelect
                value={step7.agentAccountability || ""}
                onChange={(v) => update({ agentAccountability: v })}
                options={RE_ACCOUNTABILITY}
              />
            </FormField>
            <FormField label="How do you manage transaction workflows?">
              <StyledSelect
                value={step7.transactionWorkflow || ""}
                onChange={(v) => update({ transactionWorkflow: v })}
                options={RE_TRANSACTION}
              />
            </FormField>
            <FormField label="How do you onboard new agents to the team?">
              <StyledSelect
                value={step7.agentOnboarding || ""}
                onChange={(v) => update({ agentOnboarding: v })}
                options={RE_ONBOARDING}
              />
            </FormField>
          </>
        )}

        <FormField
          label="Do you track these KPIs regularly?"
          hint="Select all that apply"
        >
          <MultiCheckbox
            options={isHS ? HS_KPIS : RE_KPIS}
            selected={step7.kpisTracked}
            onChange={(v) => update({ kpisTracked: v })}
          />
        </FormField>
      </div>
    </div>
  );
}

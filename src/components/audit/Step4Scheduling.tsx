import { FormField, StepHeader, StyledSelect, StepProps } from "./AuditFormComponents";

// Home Services options
const HS_SCHEDULING = [
  "Software with drag-and-drop board", "Google/Outlook Calendar",
  "Phone calls and a whiteboard", "Paper schedule", "No real system",
];
const HS_DISPATCH = [
  "Automated through software", "Manual — office calls/texts techs",
  "Techs check a shared calendar", "Mixed approach",
];
const HS_ROUTE = ["Yes — software optimized", "We try to cluster jobs manually", "No"];
const HS_TRACKING = ["Yes — GPS tracking", "No"];
const HS_CAPACITY = [
  "Software manages availability", "We eyeball it", "We often overbook or underbook",
];
const HS_EMERGENCY = [
  "Dedicated slots held open", "We shuffle the schedule",
  "We usually can't accommodate them", "It's chaotic",
];

// Real Estate options
const RE_FOLLOW_UP = [
  "Yes — automated drip campaigns", "Yes — manual but documented",
  "Sort of — agents do their own thing", "No formal plan",
];
const RE_NURTURE = [
  "30 days or less", "1–3 months", "3–6 months", "6–12 months",
  "We nurture indefinitely", "Agents decide for themselves",
];
const RE_DRIP = ["Yes — fully automated", "Yes — partially automated", "No"];
const RE_TEMP = [
  "CRM lead scoring", "Manual tags/labels in CRM",
  "Agents keep mental notes", "We don't differentiate",
];
const RE_LOGGING = ["Yes — consistently", "Sometimes", "Rarely", "We don't require it"];
const RE_COLD = [
  "Long-term automated nurture", "Manual follow-up for 2+ weeks",
  "A few attempts then move on", "We mostly give up",
];

export function Step4Scheduling({ state, dispatch, isHS }: StepProps) {
  const { step4 } = state;
  const update = (payload: Partial<typeof step4>) => dispatch({ type: "UPDATE_STEP4", payload });

  if (isHS) {
    return (
      <div>
        <StepHeader
          step={4}
          title="Scheduling & Dispatching"
          subtitle="How you manage your calendar, crew, and daily operations"
        />
        <div className="space-y-7">
          <FormField label="How do you schedule jobs?">
            <StyledSelect
              value={step4.schedulingMethod || ""}
              onChange={(v) => update({ schedulingMethod: v })}
              options={HS_SCHEDULING}
            />
          </FormField>
          <FormField label="How are jobs dispatched to technicians?">
            <StyledSelect
              value={step4.dispatchMethod || ""}
              onChange={(v) => update({ dispatchMethod: v })}
              options={HS_DISPATCH}
            />
          </FormField>
          <FormField label="Do you use route optimization for technician travel?">
            <StyledSelect
              value={step4.routeOptimization || ""}
              onChange={(v) => update({ routeOptimization: v })}
              options={HS_ROUTE}
            />
          </FormField>
          <FormField label="Can you see real-time technician locations?">
            <StyledSelect
              value={step4.realTimeTracking || ""}
              onChange={(v) => update({ realTimeTracking: v })}
              options={HS_TRACKING}
            />
          </FormField>
          <FormField label="How do you handle capacity planning and overbooking prevention?">
            <StyledSelect
              value={step4.capacityPlanning || ""}
              onChange={(v) => update({ capacityPlanning: v })}
              options={HS_CAPACITY}
            />
          </FormField>
          <FormField label="How do you handle emergency/same-day service calls?">
            <StyledSelect
              value={step4.emergencyHandling || ""}
              onChange={(v) => update({ emergencyHandling: v })}
              options={HS_EMERGENCY}
            />
          </FormField>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader
        step={4}
        title="Lead Management & Follow-Up"
        subtitle="How you nurture leads from inquiry through closing"
      />
      <div className="space-y-7">
        <FormField label="Do you have a defined lead follow-up plan (call/text/email sequence)?">
          <StyledSelect
            value={step4.followUpPlan || ""}
            onChange={(v) => update({ followUpPlan: v })}
            options={RE_FOLLOW_UP}
          />
        </FormField>
        <FormField label="How long do you nurture leads before giving up?">
          <StyledSelect
            value={step4.nurtureDuration || ""}
            onChange={(v) => update({ nurtureDuration: v })}
            options={RE_NURTURE}
          />
        </FormField>
        <FormField label="Do you use automated drip email/text sequences?">
          <StyledSelect
            value={step4.automatedDrip || ""}
            onChange={(v) => update({ automatedDrip: v })}
            options={RE_DRIP}
          />
        </FormField>
        <FormField label="How do you track which leads are hot/warm/cold?">
          <StyledSelect
            value={step4.leadTemperatureTracking || ""}
            onChange={(v) => update({ leadTemperatureTracking: v })}
            options={RE_TEMP}
          />
        </FormField>
        <FormField label="Do agents log their activities (calls, texts, showings) in the CRM?">
          <StyledSelect
            value={step4.activityLogging || ""}
            onChange={(v) => update({ activityLogging: v })}
            options={RE_LOGGING}
          />
        </FormField>
        <FormField label="How do you handle internet leads that don't respond to initial outreach?">
          <StyledSelect
            value={step4.coldLeadHandling || ""}
            onChange={(v) => update({ coldLeadHandling: v })}
            options={RE_COLD}
          />
        </FormField>
      </div>
    </div>
  );
}

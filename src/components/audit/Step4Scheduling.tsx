import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, StepProps, toOptions } from "./AuditFormComponents";

// Home Services options
const HS_SCHEDULING = toOptions([
  "Software with drag-and-drop board", "Google/Outlook Calendar",
  "Phone calls and a whiteboard", "Paper schedule", "No real system",
]);
const HS_DISPATCH = toOptions([
  "Automated through software", "Manual — office calls/texts techs",
  "Techs check a shared calendar", "Mixed approach",
]);
const HS_ROUTE = toOptions(["Yes — software optimized", "We try to cluster jobs manually", "No"]);
const HS_TRACKING = toOptions(["Yes — GPS tracking", "No"]);
const HS_CAPACITY = toOptions([
  "Software manages availability", "We eyeball it", "We often overbook or underbook",
]);
const HS_EMERGENCY = toOptions([
  "Dedicated slots held open", "We shuffle the schedule",
  "We usually can't accommodate them", "It's chaotic",
]);

// Real Estate options
const RE_FOLLOW_UP = toOptions([
  "Yes — automated drip campaigns", "Yes — manual but documented",
  "Sort of — agents do their own thing", "No formal plan",
]);
const RE_NURTURE = toOptions([
  "30 days or less", "1–3 months", "3–6 months", "6–12 months",
  "We nurture indefinitely", "Agents decide for themselves",
]);
const RE_DRIP = toOptions(["Yes — fully automated", "Yes — partially automated", "No"]);
const RE_TEMP = toOptions([
  "CRM lead scoring", "Manual tags/labels in CRM",
  "Agents keep mental notes", "We don't differentiate",
]);
const RE_LOGGING = toOptions(["Yes — consistently", "Sometimes", "Rarely", "We don't require it"]);
const RE_COLD = toOptions([
  "Long-term automated nurture", "Manual follow-up for 2+ weeks",
  "A few attempts then move on", "We mostly give up",
]);

export function Step4Scheduling({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step4 } = state;
  const update = (payload: Partial<typeof step4>) => dispatch({ type: "UPDATE_STEP4", payload });

  if (isHS) {
    return (
      <div>
        <StepHeader
          step={4}
          title={t('step4.hs.title')}
          subtitle={t('step4.hs.subtitle')}
        />
        <div className="space-y-7">
          <FormField label={t('step4.hs.fields.schedulingMethod.label')}>
            <StyledSelect
              value={step4.schedulingMethod || ""}
              onChange={(v) => update({ schedulingMethod: v })}
              options={HS_SCHEDULING}
            />
          </FormField>
          <FormField label={t('step4.hs.fields.dispatchMethod.label')}>
            <StyledSelect
              value={step4.dispatchMethod || ""}
              onChange={(v) => update({ dispatchMethod: v })}
              options={HS_DISPATCH}
            />
          </FormField>
          <FormField label={t('step4.hs.fields.routeOptimization.label')}>
            <StyledSelect
              value={step4.routeOptimization || ""}
              onChange={(v) => update({ routeOptimization: v })}
              options={HS_ROUTE}
            />
          </FormField>
          <FormField label={t('step4.hs.fields.realTimeTracking.label')}>
            <StyledSelect
              value={step4.realTimeTracking || ""}
              onChange={(v) => update({ realTimeTracking: v })}
              options={HS_TRACKING}
            />
          </FormField>
          <FormField label={t('step4.hs.fields.capacityPlanning.label')}>
            <StyledSelect
              value={step4.capacityPlanning || ""}
              onChange={(v) => update({ capacityPlanning: v })}
              options={HS_CAPACITY}
            />
          </FormField>
          <FormField label={t('step4.hs.fields.emergencyHandling.label')}>
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
        title={t('step4.re.title')}
        subtitle={t('step4.re.subtitle')}
      />
      <div className="space-y-7">
        <FormField label={t('step4.re.fields.followUpPlan.label')}>
          <StyledSelect
            value={step4.followUpPlan || ""}
            onChange={(v) => update({ followUpPlan: v })}
            options={RE_FOLLOW_UP}
          />
        </FormField>
        <FormField label={t('step4.re.fields.nurtureDuration.label')}>
          <StyledSelect
            value={step4.nurtureDuration || ""}
            onChange={(v) => update({ nurtureDuration: v })}
            options={RE_NURTURE}
          />
        </FormField>
        <FormField label={t('step4.re.fields.automatedDrip.label')}>
          <StyledSelect
            value={step4.automatedDrip || ""}
            onChange={(v) => update({ automatedDrip: v })}
            options={RE_DRIP}
          />
        </FormField>
        <FormField label={t('step4.re.fields.leadTemperatureTracking.label')}>
          <StyledSelect
            value={step4.leadTemperatureTracking || ""}
            onChange={(v) => update({ leadTemperatureTracking: v })}
            options={RE_TEMP}
          />
        </FormField>
        <FormField label={t('step4.re.fields.activityLogging.label')}>
          <StyledSelect
            value={step4.activityLogging || ""}
            onChange={(v) => update({ activityLogging: v })}
            options={RE_LOGGING}
          />
        </FormField>
        <FormField label={t('step4.re.fields.coldLeadHandling.label')}>
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

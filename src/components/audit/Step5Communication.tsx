import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, StepProps, toOptions } from "./AuditFormComponents";

const HS_REMINDERS = toOptions([
  "Yes — text and email", "Yes — email only", "Yes — text only",
  "No — we call manually", "No reminders sent",
]);
const HS_ONWAY = toOptions(["Yes — automated", "Sometimes manually", "No"]);
const HS_JOB_COMPLETE = toOptions([
  "Digital summary/invoice sent immediately", "We explain verbally",
  "Paper invoice left behind", "No formal communication",
]);
const HS_INTERNAL = toOptions([
  "Field service app/software", "Group text/chat app", "Phone calls", "Mixed/inconsistent",
]);
const HS_AFTERHOURS = toOptions([
  "AI chatbot or auto-responder", "Answering service",
  "Voicemail with next-day callback", "After-hours calls go unanswered",
]);
const HS_PORTAL = toOptions(["Yes", "No but we want one", "No and not a priority"]);

const RE_AGENT_COMMS = toOptions([
  "CRM-based communication (logged)", "Personal phone/text (not logged)",
  "Mix of both", "Varies by agent",
]);
const RE_TRANSACTION_UPDATES = toOptions([
  "Yes — key milestones automated", "Some manual updates",
  "No — agents handle individually",
]);
const RE_PAST_CLIENT = toOptions([
  "Automated long-term drip", "Annual check-ins/market updates",
  "Holiday cards/occasional emails", "We don't maintain contact consistently",
]);
const RE_INTERNAL = toOptions([
  "Team app (Slack, Teams, etc.)", "Group text", "Email", "In-person meetings only",
]);
const RE_AFTERHOURS = toOptions([
  "Auto-responder with info", "AI chatbot", "Agents handle on personal phones",
  "Goes unanswered until next day",
]);
const RE_PORTAL = toOptions(["Yes — through our software", "No but we'd like one", "No and not a priority"]);

export function Step5Communication({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step5 } = state;
  const update = (payload: Partial<typeof step5>) => dispatch({ type: "UPDATE_STEP5", payload });

  return (
    <div>
      <StepHeader
        step={5}
        title={isHS ? t('step5.hs.title') : t('step5.re.title')}
        subtitle={isHS ? t('step5.hs.subtitle') : t('step5.re.subtitle')}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t('step5.hs.fields.appointmentReminders.label')}>
              <StyledSelect
                value={step5.appointmentReminders || ""}
                onChange={(v) => update({ appointmentReminders: v })}
                options={HS_REMINDERS}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.onTheWayNotifications.label')}>
              <StyledSelect
                value={step5.onTheWayNotifications || ""}
                onChange={(v) => update({ onTheWayNotifications: v })}
                options={HS_ONWAY}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.jobCompletionComms.label')}>
              <StyledSelect
                value={step5.jobCompletionComms || ""}
                onChange={(v) => update({ jobCompletionComms: v })}
                options={HS_JOB_COMPLETE}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.internalComms.label')}>
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={HS_INTERNAL}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.afterHoursComms.label')}>
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={HS_AFTERHOURS}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.clientPortal.label')}>
              <StyledSelect
                value={step5.clientPortal}
                onChange={(v) => update({ clientPortal: v })}
                options={HS_PORTAL}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step5.re.fields.agentClientComms.label')}>
              <StyledSelect
                value={step5.agentClientComms || ""}
                onChange={(v) => update({ agentClientComms: v })}
                options={RE_AGENT_COMMS}
              />
            </FormField>
            <FormField label={t('step5.re.fields.transactionUpdates.label')}>
              <StyledSelect
                value={step5.transactionUpdates || ""}
                onChange={(v) => update({ transactionUpdates: v })}
                options={RE_TRANSACTION_UPDATES}
              />
            </FormField>
            <FormField label={t('step5.re.fields.pastClientEngagement.label')}>
              <StyledSelect
                value={step5.pastClientEngagement || ""}
                onChange={(v) => update({ pastClientEngagement: v })}
                options={RE_PAST_CLIENT}
              />
            </FormField>
            <FormField label={t('step5.re.fields.internalComms.label')}>
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={RE_INTERNAL}
              />
            </FormField>
            <FormField label={t('step5.re.fields.afterHoursComms.label')}>
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={RE_AFTERHOURS}
              />
            </FormField>
            <FormField label={t('step5.re.fields.clientPortal.label')}>
              <StyledSelect
                value={step5.clientPortal}
                onChange={(v) => update({ clientPortal: v })}
                options={RE_PORTAL}
              />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
}

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
  const { step5 } = state;
  const update = (payload: Partial<typeof step5>) => dispatch({ type: "UPDATE_STEP5", payload });

  return (
    <div>
      <StepHeader
        step={5}
        title={isHS ? "Customer Communication" : "Client Communication"}
        subtitle="How you stay connected with customers at every stage"
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label="Do you send automated appointment reminders to customers?">
              <StyledSelect
                value={step5.appointmentReminders || ""}
                onChange={(v) => update({ appointmentReminders: v })}
                options={HS_REMINDERS}
              />
            </FormField>
            <FormField label='Do you send "on-the-way" notifications with technician info?'>
              <StyledSelect
                value={step5.onTheWayNotifications || ""}
                onChange={(v) => update({ onTheWayNotifications: v })}
                options={HS_ONWAY}
              />
            </FormField>
            <FormField label="How do customers know when a job is complete or what was done?">
              <StyledSelect
                value={step5.jobCompletionComms || ""}
                onChange={(v) => update({ jobCompletionComms: v })}
                options={HS_JOB_COMPLETE}
              />
            </FormField>
            <FormField label="How does your office communicate with field technicians?">
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={HS_INTERNAL}
              />
            </FormField>
            <FormField label="How do you handle after-hours customer communication?">
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={HS_AFTERHOURS}
              />
            </FormField>
            <FormField label="Do customers have an online portal or app to view their account?">
              <StyledSelect
                value={step5.clientPortal}
                onChange={(v) => update({ clientPortal: v })}
                options={HS_PORTAL}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="How do agents communicate with active clients?">
              <StyledSelect
                value={step5.agentClientComms || ""}
                onChange={(v) => update({ agentClientComms: v })}
                options={RE_AGENT_COMMS}
              />
            </FormField>
            <FormField label="Do you send automated updates during the transaction process?">
              <StyledSelect
                value={step5.transactionUpdates || ""}
                onChange={(v) => update({ transactionUpdates: v })}
                options={RE_TRANSACTION_UPDATES}
              />
            </FormField>
            <FormField label="How do you keep past clients engaged after closing?">
              <StyledSelect
                value={step5.pastClientEngagement || ""}
                onChange={(v) => update({ pastClientEngagement: v })}
                options={RE_PAST_CLIENT}
              />
            </FormField>
            <FormField label="How does the team communicate internally?">
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={RE_INTERNAL}
              />
            </FormField>
            <FormField label="How do you handle after-hours client inquiries?">
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={RE_AFTERHOURS}
              />
            </FormField>
            <FormField label="Do clients have a portal to track their transaction?">
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

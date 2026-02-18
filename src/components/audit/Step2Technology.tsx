import {
  FormField, StepHeader, StyledSelect, MultiCheckbox,
  StyledTextarea, RatingButtons, StepProps
} from "./AuditFormComponents";

const HS_CRMS = [
  "ServiceTitan", "Housecall Pro", "Jobber", "FieldEdge", "ServiceM8",
  "Successware", "No CRM/Software", "Other",
];

const RE_CRMS = [
  "Follow Up Boss", "KVCore/Inside Real Estate", "Lofty (formerly Chime)",
  "Sierra Interactive", "LionDesk", "Wise Agent", "HubSpot", "Salesforce",
  "No CRM", "Other",
];

const HS_TOOLS = [
  "Business Website", "Online Booking/Scheduling", "Google Business Profile",
  "Social Media Accounts", "Email Marketing (Mailchimp etc.)", "Call Tracking (CallRail etc.)",
  "GPS/Fleet Tracking", "Accounting Software (QuickBooks etc.)", "Business Texting/SMS Platform",
  "Reputation Management Software", "Website Chat/Chatbot", "Proposal/Estimate Software",
  "Inventory/Parts Management", "Project Management Tool", "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)",
];

const RE_TOOLS = [
  "IDX Website", "Landing Page Builder", "Email Marketing/Drip Campaigns",
  "Social Media Management Tool", "Call Tracking", "Business Texting/SMS",
  "Video Email (BombBomb etc.)", "Transaction Management (Dotloop, SkySlope etc.)",
  "E-Signature (DocuSign, Dotloop)", "Virtual Tour/3D Tools", "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)", "Team Communication (Slack, Teams)", "Accounting Software",
];

export function Step2Technology({ state, dispatch, isHS }: StepProps) {
  const { step2 } = state;
  const update = (payload: Partial<typeof step2>) => dispatch({ type: "UPDATE_STEP2", payload });

  return (
    <div>
      <StepHeader
        step={2}
        title="Your Technology & Software Stack"
        subtitle="Let's understand the tools powering your business today"
      />

      <div className="space-y-7">
        <FormField label={isHS ? "Primary CRM / Field Service Software" : "Primary CRM"} required>
          <StyledSelect
            value={step2.primaryCRM}
            onChange={(v) => update({ primaryCRM: v })}
            options={isHS ? HS_CRMS : RE_CRMS}
            placeholder="Select your primary software..."
          />
        </FormField>

        <FormField
          label={`How satisfied are you with your current ${isHS ? "software" : "CRM"}?`}
          required
          hint="1 = Very Unsatisfied, 5 = Very Satisfied"
        >
          <RatingButtons
            value={step2.crmSatisfaction}
            onChange={(v) => update({ crmSatisfaction: v })}
          />
        </FormField>

        <FormField
          label="Which of these tools do you currently use?"
          hint="Select all that apply"
        >
          <MultiCheckbox
            options={isHS ? HS_TOOLS : RE_TOOLS}
            selected={step2.toolsUsed}
            onChange={(v) => update({ toolsUsed: v })}
          />
        </FormField>

        <FormField
          label="What's your biggest frustration with your current tech setup?"
          hint="Optional — be as specific as you'd like"
        >
          <StyledTextarea
            value={step2.techFrustrations}
            onChange={(v) => update({ techFrustrations: v })}
            placeholder="e.g., Our software doesn't integrate with QuickBooks, scheduling is still done on a whiteboard..."
          />
        </FormField>
      </div>
    </div>
  );
}

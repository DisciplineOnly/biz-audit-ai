import { FormField, StepHeader, StyledSelect, StepProps } from "./AuditFormComponents";

const HS_POST_JOB = [
  "Automated follow-up sequence (thank you + review request + maintenance reminder)",
  "We send a review request", "Nothing formal", "Depends on the tech",
];
const HS_MAINTENANCE = ["Yes — automated", "Yes — manually/sometimes", "No"];
const HS_AGREEMENTS = ["Yes — actively sold", "Yes — but rarely sell them", "No"];
const HS_ESTIMATE_FU = [
  "Automated follow-up sequence", "Manual follow-up within a week",
  "We follow up if we remember", "We don't follow up",
];
const HS_WARRANTY = ["Tracked in software", "Tracked in spreadsheets", "We don't track this"];
const REPEAT_PERCENT = ["Over 50%", "30–50%", "10–30%", "Under 10%", "We don't know"];

const RE_POST_CLOSE = [
  "Automated post-close nurture sequence", "Manual thank-you and check-in",
  "Closing gift and that's about it", "Nothing formal",
];
const RE_PAST_CLIENT = [
  "CRM-based annual touchpoint plan", "Occasional emails/newsletters",
  "Social media only", "We don't have a system",
];
const RE_REFERRAL = [
  "Yes — automated asks at key milestones", "Yes — manual but consistent",
  "We ask occasionally", "No formal process",
];
const RE_LOST_LEAD = [
  "Automated long-term nurture", "Manual follow-up for a few weeks",
  "We mostly move on", "No process",
];
const RE_ANNIVERSARY = ["Yes — automated", "Yes — manual", "No"];
const RE_REPEAT = ["Over 50%", "30–50%", "10–30%", "Under 10%", "We don't track this"];

export function Step6FollowUp({ state, dispatch, isHS }: StepProps) {
  const { step6 } = state;
  const update = (payload: Partial<typeof step6>) => dispatch({ type: "UPDATE_STEP6", payload });

  return (
    <div>
      <StepHeader
        step={6}
        title={isHS ? "Follow-Up & Customer Retention" : "Follow-Up & Client Retention"}
        subtitle="How you stay connected after the sale and build long-term loyalty"
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label="What happens after a job is completed?">
              <StyledSelect
                value={step6.postJobFollowUp || ""}
                onChange={(v) => update({ postJobFollowUp: v })}
                options={HS_POST_JOB}
              />
            </FormField>
            <FormField label="Do you send maintenance or seasonal reminders to past customers?">
              <StyledSelect
                value={step6.maintenanceReminders || ""}
                onChange={(v) => update({ maintenanceReminders: v })}
                options={HS_MAINTENANCE}
              />
            </FormField>
            <FormField label="Do you offer service agreements/maintenance plans/memberships?">
              <StyledSelect
                value={step6.serviceAgreements || ""}
                onChange={(v) => update({ serviceAgreements: v })}
                options={HS_AGREEMENTS}
              />
            </FormField>
            <FormField label="How do you follow up on unsold estimates/unbooked quotes?">
              <StyledSelect
                value={step6.estimateFollowUp || ""}
                onChange={(v) => update({ estimateFollowUp: v })}
                options={HS_ESTIMATE_FU}
              />
            </FormField>
            <FormField label="How do you track equipment warranties and recall opportunities?">
              <StyledSelect
                value={step6.warrantyTracking || ""}
                onChange={(v) => update({ warrantyTracking: v })}
                options={HS_WARRANTY}
              />
            </FormField>
            <FormField label="What percentage of your business comes from repeat customers?">
              <StyledSelect
                value={step6.repeatBusinessPercent}
                onChange={(v) => update({ repeatBusinessPercent: v })}
                options={REPEAT_PERCENT}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="What happens after a deal closes?">
              <StyledSelect
                value={step6.postCloseFollowUp || ""}
                onChange={(v) => update({ postCloseFollowUp: v })}
                options={RE_POST_CLOSE}
              />
            </FormField>
            <FormField label="How do you stay in touch with past clients?">
              <StyledSelect
                value={step6.pastClientContact || ""}
                onChange={(v) => update({ pastClientContact: v })}
                options={RE_PAST_CLIENT}
              />
            </FormField>
            <FormField label="Do you have a formal referral request process for past clients?">
              <StyledSelect
                value={step6.referralProcess || ""}
                onChange={(v) => update({ referralProcess: v })}
                options={RE_REFERRAL}
              />
            </FormField>
            <FormField label="How do you follow up with leads who toured but didn't buy/list?">
              <StyledSelect
                value={step6.lostLeadFollowUp || ""}
                onChange={(v) => update({ lostLeadFollowUp: v })}
                options={RE_LOST_LEAD}
              />
            </FormField>
            <FormField label="Do you track client anniversaries (move-in date, birthday) for touchpoints?">
              <StyledSelect
                value={step6.anniversaryTracking || ""}
                onChange={(v) => update({ anniversaryTracking: v })}
                options={RE_ANNIVERSARY}
              />
            </FormField>
            <FormField label="What percentage of your deals come from repeat clients or referrals?">
              <StyledSelect
                value={step6.repeatBusinessPercent}
                onChange={(v) => update({ repeatBusinessPercent: v })}
                options={RE_REPEAT}
              />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
}

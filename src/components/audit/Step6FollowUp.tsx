import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, StepProps, toOptions } from "./AuditFormComponents";

const HS_POST_JOB = toOptions([
  "Automated follow-up sequence (thank you + review request + maintenance reminder)",
  "We send a review request", "Nothing formal", "Depends on the tech",
]);
const HS_MAINTENANCE = toOptions(["Yes — automated", "Yes — manually/sometimes", "No"]);
const HS_AGREEMENTS = toOptions(["Yes — actively sold", "Yes — but rarely sell them", "No"]);
const HS_ESTIMATE_FU = toOptions([
  "Automated follow-up sequence", "Manual follow-up within a week",
  "We follow up if we remember", "We don't follow up",
]);
const HS_WARRANTY = toOptions(["Tracked in software", "Tracked in spreadsheets", "We don't track this"]);
const REPEAT_PERCENT = toOptions(["Over 50%", "30–50%", "10–30%", "Under 10%", "We don't know"]);

const RE_POST_CLOSE = toOptions([
  "Automated post-close nurture sequence", "Manual thank-you and check-in",
  "Closing gift and that's about it", "Nothing formal",
]);
const RE_PAST_CLIENT = toOptions([
  "CRM-based annual touchpoint plan", "Occasional emails/newsletters",
  "Social media only", "We don't have a system",
]);
const RE_REFERRAL = toOptions([
  "Yes — automated asks at key milestones", "Yes — manual but consistent",
  "We ask occasionally", "No formal process",
]);
const RE_LOST_LEAD = toOptions([
  "Automated long-term nurture", "Manual follow-up for a few weeks",
  "We mostly move on", "No process",
]);
const RE_ANNIVERSARY = toOptions(["Yes — automated", "Yes — manual", "No"]);
const RE_REPEAT = toOptions(["Over 50%", "30–50%", "10–30%", "Under 10%", "We don't track this"]);

export function Step6FollowUp({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step6 } = state;
  const update = (payload: Partial<typeof step6>) => dispatch({ type: "UPDATE_STEP6", payload });

  return (
    <div>
      <StepHeader
        step={6}
        title={isHS ? t('step6.hs.title') : t('step6.re.title')}
        subtitle={isHS ? t('step6.hs.subtitle') : t('step6.re.subtitle')}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t('step6.hs.fields.postJobFollowUp.label')}>
              <StyledSelect
                value={step6.postJobFollowUp || ""}
                onChange={(v) => update({ postJobFollowUp: v })}
                options={HS_POST_JOB}
              />
            </FormField>
            <FormField label={t('step6.hs.fields.maintenanceReminders.label')}>
              <StyledSelect
                value={step6.maintenanceReminders || ""}
                onChange={(v) => update({ maintenanceReminders: v })}
                options={HS_MAINTENANCE}
              />
            </FormField>
            <FormField label={t('step6.hs.fields.serviceAgreements.label')}>
              <StyledSelect
                value={step6.serviceAgreements || ""}
                onChange={(v) => update({ serviceAgreements: v })}
                options={HS_AGREEMENTS}
              />
            </FormField>
            <FormField label={t('step6.hs.fields.estimateFollowUp.label')}>
              <StyledSelect
                value={step6.estimateFollowUp || ""}
                onChange={(v) => update({ estimateFollowUp: v })}
                options={HS_ESTIMATE_FU}
              />
            </FormField>
            <FormField label={t('step6.hs.fields.warrantyTracking.label')}>
              <StyledSelect
                value={step6.warrantyTracking || ""}
                onChange={(v) => update({ warrantyTracking: v })}
                options={HS_WARRANTY}
              />
            </FormField>
            <FormField label={t('step6.hs.fields.repeatBusinessPercent.label')}>
              <StyledSelect
                value={step6.repeatBusinessPercent}
                onChange={(v) => update({ repeatBusinessPercent: v })}
                options={REPEAT_PERCENT}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step6.re.fields.postCloseFollowUp.label')}>
              <StyledSelect
                value={step6.postCloseFollowUp || ""}
                onChange={(v) => update({ postCloseFollowUp: v })}
                options={RE_POST_CLOSE}
              />
            </FormField>
            <FormField label={t('step6.re.fields.pastClientContact.label')}>
              <StyledSelect
                value={step6.pastClientContact || ""}
                onChange={(v) => update({ pastClientContact: v })}
                options={RE_PAST_CLIENT}
              />
            </FormField>
            <FormField label={t('step6.re.fields.referralProcess.label')}>
              <StyledSelect
                value={step6.referralProcess || ""}
                onChange={(v) => update({ referralProcess: v })}
                options={RE_REFERRAL}
              />
            </FormField>
            <FormField label={t('step6.re.fields.lostLeadFollowUp.label')}>
              <StyledSelect
                value={step6.lostLeadFollowUp || ""}
                onChange={(v) => update({ lostLeadFollowUp: v })}
                options={RE_LOST_LEAD}
              />
            </FormField>
            <FormField label={t('step6.re.fields.anniversaryTracking.label')}>
              <StyledSelect
                value={step6.anniversaryTracking || ""}
                onChange={(v) => update({ anniversaryTracking: v })}
                options={RE_ANNIVERSARY}
              />
            </FormField>
            <FormField label={t('step6.re.fields.repeatBusinessPercent.label')}>
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

import { useTranslation } from 'react-i18next';
import {
  FormField, StepHeader, StyledSelect, MultiCheckbox,
  StyledTextarea, RatingButtons, StepProps, toOptions
} from "./AuditFormComponents";
import { getSubNicheOptions } from "@/config/subNicheConfig";

const HS_CRMS = toOptions([
  "ServiceTitan", "Housecall Pro", "Jobber", "FieldEdge", "ServiceM8",
  "Successware", "No CRM/Software", "Other",
]);

const RE_CRMS = toOptions([
  "Follow Up Boss", "KVCore/Inside Real Estate", "Lofty (formerly Chime)",
  "Sierra Interactive", "LionDesk", "Wise Agent", "HubSpot", "Salesforce",
  "No CRM", "Other",
]);

const HS_TOOLS = toOptions([
  "Business Website", "Online Booking/Scheduling", "Google Business Profile",
  "Social Media Accounts", "Email Marketing (Mailchimp etc.)", "Call Tracking (CallRail etc.)",
  "GPS/Fleet Tracking", "Accounting Software (QuickBooks etc.)", "Business Texting/SMS Platform",
  "Reputation Management Software", "Website Chat/Chatbot", "Proposal/Estimate Software",
  "Inventory/Parts Management", "Project Management Tool", "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)",
]);

const RE_TOOLS = toOptions([
  "IDX Website", "Landing Page Builder", "Email Marketing/Drip Campaigns",
  "Social Media Management Tool", "Call Tracking", "Business Texting/SMS",
  "Video Email (BombBomb etc.)", "Transaction Management (Dotloop, SkySlope etc.)",
  "E-Signature (DocuSign, Dotloop)", "Virtual Tour/3D Tools", "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)", "Team Communication (Slack, Teams)", "Accounting Software",
]);

export function Step2Technology({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step2 } = state;
  const update = (payload: Partial<typeof step2>) => dispatch({ type: "UPDATE_STEP2", payload });

  // Sub-niche-aware option resolution
  const subNicheOpts = state.subNiche ? getSubNicheOptions(state.subNiche) : null;
  const crmOptions = subNicheOpts && subNicheOpts.crms.length > 0
    ? toOptions(subNicheOpts.crms)
    : (isHS ? HS_CRMS : RE_CRMS);
  const baseTools = isHS ? HS_TOOLS : RE_TOOLS;
  const toolOptions = subNicheOpts && subNicheOpts.toolsExtra.length > 0
    ? [...baseTools, ...toOptions(subNicheOpts.toolsExtra)]
    : baseTools;

  return (
    <div>
      <StepHeader
        step={2}
        title={t('step2.title')}
        subtitle={t('step2.subtitle')}
      />

      <div className="space-y-7">
        <FormField label={isHS ? t('step2.fields.primaryCRM.hs.label') : t('step2.fields.primaryCRM.re.label')} required>
          <StyledSelect
            value={step2.primaryCRM}
            onChange={(v) => update({ primaryCRM: v })}
            options={crmOptions}
            placeholder={t('step2.fields.primaryCRM.placeholder')}
          />
        </FormField>

        <FormField
          label={isHS ? t('step2.fields.crmSatisfaction.hs.label') : t('step2.fields.crmSatisfaction.re.label')}
          required
          hint={t('step2.fields.crmSatisfaction.hint')}
        >
          <RatingButtons
            value={step2.crmSatisfaction}
            onChange={(v) => update({ crmSatisfaction: v })}
          />
        </FormField>

        <FormField
          label={t('step2.fields.toolsUsed.label')}
          hint={t('step2.fields.toolsUsed.hint')}
        >
          <MultiCheckbox
            options={toolOptions}
            selected={step2.toolsUsed}
            onChange={(v) => update({ toolsUsed: v })}
          />
        </FormField>

        <FormField
          label={t('step2.fields.techFrustrations.label')}
          hint={t('step2.fields.techFrustrations.hint')}
        >
          <StyledTextarea
            value={step2.techFrustrations}
            onChange={(v) => update({ techFrustrations: v })}
            placeholder={t('step2.fields.techFrustrations.placeholder')}
          />
        </FormField>
      </div>
    </div>
  );
}

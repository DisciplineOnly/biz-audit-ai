import { useTranslation } from "react-i18next";
import {
  FormField,
  StepHeader,
  StyledSelect,
  MultiCheckbox,
  StyledTextarea,
  RatingButtons,
  StepProps,
  toOptions,
  localizeOptions,
} from "./AuditFormComponents";
import { getSubNicheOptionsForLang } from "@/config/subNicheConfig";
import { useLang } from "@/hooks/useLang";

const HS_CRMS = toOptions([
  "ServiceTitan",
  "Housecall Pro",
  "Jobber",
  "FieldEdge",
  "ServiceM8",
  "HubSpot",
  "No CRM/Software",
  "Other",
]);

const RE_CRMS = toOptions([
  "Follow Up Boss",
  "Zoho",
  "Sierra Interactive",
  "Smart ERP Suite",
  "Wise Agent",
  "HubSpot",
  "Salesforce",
  "No CRM",
  "Other",
]);

const HS_TOOLS = toOptions([
  "Business Website",
  "Online Booking/Scheduling",
  "Google Business Profile",
  "Social Media Accounts",
  "Email Marketing (Mailchimp etc.)",
  "Call Tracking (CallRail etc.)",
  "GPS/Fleet Tracking",
  "Accounting Software (QuickBooks etc.)",
  "Business Texting/SMS Platform",
  "Reputation Management Software",
  "Website Chat/Chatbot",
  "Proposal/Estimate Software",
  "Inventory/Parts Management",
  "Project Management Tool",
  "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)",
]);

const RE_TOOLS = toOptions([
  "IDX Website",
  "Landing Page Builder",
  "Email Marketing/Drip Campaigns",
  "Social Media Management Tool",
  "Call Tracking",
  "Business Texting/SMS",
  "Video Email (BombBomb etc.)",
  "Transaction Management (Dotloop, SkySlope etc.)",
  "E-Signature (DocuSign, Dotloop)",
  "Virtual Tour/3D Tools",
  "AI Tools (ChatGPT etc.)",
  "Automation (Zapier, Make, etc.)",
  "Team Communication (Slack, Teams)",
  "Accounting Software",
]);

const BG_HS_TOOLS = toOptions([
  "Бизнес уебсайт",
  "Онлайн резервации / Планиране",
  "Google Business профил",
  "Социални мрежи",
  "Имейл маркетинг (Mailchimp и др.)",
  "Проследяване на обаждания",
  "GPS Проследяване",
  "Счетоводен софтуер",
  "Бизнес SMS платформа",
  "Софтуер за управление на репутацията",
  "Чат / Чатбот на сайта",
  "Софтуер за оферти / Калкулации",
  "Управление на инвентар / наличности",
  "Софтуер за управление на проекти",
  "AI инструменти (ChatGPT и др.)",
  "Автоматизация (Zapier, Make и др.)",
]);

const BG_RE_TOOLS = toOptions([
  "Уебсайт с обяви за имоти",
  "Създаване на целеви страници",
  "Имейл маркетинг",
  "Инструмент за социални мрежи",
  "Проследяване на обаждания",
  "Бизнес SMS",
  "Видео имейл (BombBomb и др.)",
  "Управление на сделки (Dotloop, SkySlope и др.)",
  "Електронен подпис (DocuSign, Dotloop)",
  "Виртуални турове / 3D инструменти",
  "AI инструменти (ChatGPT и др.)",
  "Автоматизация (Zapier, Make и др.)",
  "Екипна комуникация (Slack, Teams)",
  "Счетоводен софтуер",
]);

const BG_CRM_LABELS: Record<string, string> = {
  "No CRM/Software": "Без CRM/Софтуер",
  "No CRM": "Без CRM",
  Other: "Друго",
};

export function Step2Technology({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation("steps");
  const { lang } = useLang();
  const { step2 } = state;
  const update = (payload: Partial<typeof step2>) =>
    dispatch({ type: "UPDATE_STEP2", payload });

  // Sub-niche-aware + language-aware option resolution
  const subNicheOpts = state.subNiche
    ? getSubNicheOptionsForLang(state.subNiche, lang)
    : null;
  const crmOptionsRaw =
    subNicheOpts && subNicheOpts.crms.length > 0
      ? toOptions(subNicheOpts.crms)
      : isHS
        ? HS_CRMS
        : RE_CRMS;
  const crmOptions =
    lang === "bg"
      ? localizeOptions(crmOptionsRaw, BG_CRM_LABELS)
      : crmOptionsRaw;
  const baseTools = isHS
    ? lang === "bg"
      ? BG_HS_TOOLS
      : HS_TOOLS
    : lang === "bg"
      ? BG_RE_TOOLS
      : RE_TOOLS;
  const toolOptions =
    subNicheOpts && subNicheOpts.toolsExtra.length > 0
      ? [...baseTools, ...toOptions(subNicheOpts.toolsExtra)]
      : baseTools;

  return (
    <div>
      <StepHeader
        step={2}
        title={t("step2.title")}
        subtitle={t("step2.subtitle")}
      />

      <div className="space-y-7">
        <FormField
          label={
            isHS
              ? t("step2.fields.primaryCRM.hs.label")
              : t("step2.fields.primaryCRM.re.label")
          }
          required
        >
          <StyledSelect
            value={step2.primaryCRM}
            onChange={(v) => update({ primaryCRM: v })}
            options={crmOptions}
            placeholder={t("step2.fields.primaryCRM.placeholder")}
          />
        </FormField>

        <FormField
          label={
            isHS
              ? t("step2.fields.crmSatisfaction.hs.label")
              : t("step2.fields.crmSatisfaction.re.label")
          }
          required
          hint={t("step2.fields.crmSatisfaction.hint")}
        >
          <RatingButtons
            value={step2.crmSatisfaction}
            onChange={(v) => update({ crmSatisfaction: v })}
          />
        </FormField>

        <FormField
          label={t("step2.fields.toolsUsed.label")}
          hint={t("step2.fields.toolsUsed.hint")}
        >
          <MultiCheckbox
            options={toolOptions}
            selected={step2.toolsUsed}
            onChange={(v) => update({ toolsUsed: v })}
          />
        </FormField>

        <FormField
          label={t("step2.fields.techFrustrations.label")}
          hint={t("step2.fields.techFrustrations.hint")}
        >
          <StyledTextarea
            value={step2.techFrustrations}
            onChange={(v) => update({ techFrustrations: v })}
            placeholder={t("step2.fields.techFrustrations.placeholder")}
          />
        </FormField>
      </div>
    </div>
  );
}

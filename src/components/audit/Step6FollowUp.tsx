import { useTranslation } from "react-i18next";
import {
  FormField,
  StepHeader,
  StyledSelect,
  StepProps,
  SelectOption,
  toOptions,
  localizeOptions,
} from "./AuditFormComponents";
import { useLang } from "@/hooks/useLang";

const HS_POST_JOB = toOptions([
  "Automated follow-up sequence (thank you + review request + maintenance reminder)",
  "We send a review request",
  "Nothing formal",
  "Depends on the tech",
]);
const HS_MAINTENANCE = toOptions([
  "Yes - automated",
  "Yes - manually/sometimes",
  "No",
]);
const HS_AGREEMENTS = toOptions([
  "Yes - actively sold",
  "Yes - but rarely sell them",
  "No",
]);
const HS_ESTIMATE_FU = toOptions([
  "Automated follow-up sequence",
  "Manual follow-up within a week",
  "We follow up if we remember",
  "We don't follow up",
]);
const HS_WARRANTY = toOptions([
  "Tracked in software",
  "Tracked in spreadsheets",
  "We don't track this",
]);
const REPEAT_PERCENT = toOptions([
  "Over 50%",
  "30–50%",
  "10–30%",
  "Under 10%",
  "We don't know",
]);

const RE_POST_CLOSE = toOptions([
  "Automated post-close nurture sequence",
  "Manual thank-you and check-in",
  "Closing gift and that's about it",
  "Nothing formal",
]);
const RE_PAST_CLIENT = toOptions([
  "CRM-based annual touchpoint plan",
  "Occasional emails/newsletters",
  "Social media only",
  "We don't have a system",
]);
const RE_REFERRAL = toOptions([
  "Yes - automated asks at key milestones",
  "Yes - manual but consistent",
  "We ask occasionally",
  "No formal process",
]);
const RE_LOST_LEAD = toOptions([
  "Automated long-term nurture",
  "Manual follow-up for a few weeks",
  "We mostly move on",
  "No process",
]);
const RE_ANNIVERSARY = toOptions(["Yes - automated", "Yes - manual", "No"]);
const RE_REPEAT = toOptions([
  "Over 50%",
  "30–50%",
  "10–30%",
  "Under 10%",
  "We don't track this",
]);

const BG_LABELS: Record<string, string> = {
  // HS Post-job follow-up
  "Automated follow-up sequence (thank you + review request + maintenance reminder)":
    "Автоматизирана последователност (благодарност + заявка за отзив + напомняне за поддръжка)",
  "We send a review request": "Изпращаме заявка за отзив",
  "Nothing formal": "Нищо формално",
  "Depends on the tech": "Зависи от техника",
  // HS Maintenance
  "Yes - automated": "Да - автоматизирано",
  "Yes - manually/sometimes": "Да - ръчно/понякога",
  No: "Не",
  // HS Agreements
  "Yes - actively sold": "Да - активно продаваме",
  "Yes - but rarely sell them": "Да - но рядко ги продаваме",
  // HS Estimate follow-up
  "Automated follow-up sequence":
    "Автоматизирана последователност за проследяване",
  "Manual follow-up within a week": "Ръчно проследяване в рамките на седмица",
  "We follow up if we remember": "Проследяваме, ако си спомним",
  "We don't follow up": "Не проследяваме",
  // HS Warranty
  "Tracked in software": "Проследявано в софтуер",
  "Tracked in spreadsheets": "Проследявано в таблици",
  "We don't track this": "Не проследяваме това",
  // Repeat business percent (shared)
  "Over 50%": "Над 50%",
  "30–50%": "30–50%",
  "10–30%": "10–30%",
  "Under 10%": "Под 10%",
  "We don't know": "Не знаем",
  "We don't track this": "Не проследяваме",
  // RE Post-close
  "Automated post-close nurture sequence":
    "Автоматизирана последователност след приключване",
  "Manual thank-you and check-in": "Ръчна благодарност и проверка",
  "Closing gift and that's about it": "Подарък при приключване и толкова",
  // RE Past client
  "CRM-based annual touchpoint plan": "Годишен план за контакт чрез CRM",
  "Occasional emails/newsletters": "Случайни имейли/бюлетини",
  "Social media only": "Само социални мрежи",
  "We don't have a system": "Нямаме система",
  // RE Referral
  "Yes - automated asks at key milestones":
    "Да - автоматизирани заявки при ключови етапи",
  "Yes - manual but consistent": "Да - ръчно, но последователно",
  "We ask occasionally": "Питаме понякога",
  "No formal process": "Без формален процес",
  // RE Lost lead
  "Automated long-term nurture": "Автоматизирано дългосрочно поддържане",
  "Manual follow-up for a few weeks": "Ръчно проследяване за няколко седмици",
  "We mostly move on": "Най-често продължаваме",
  "No process": "Без процес",
  // RE Anniversary
  "Yes - manual": "Да - ръчно",
};

export function Step6FollowUp({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation("steps");
  const { lang } = useLang();
  const { step6 } = state;
  const loc = (opts: SelectOption[]) =>
    lang === "bg" ? localizeOptions(opts, BG_LABELS) : opts;
  const update = (payload: Partial<typeof step6>) =>
    dispatch({ type: "UPDATE_STEP6", payload });

  return (
    <div>
      <StepHeader
        step={6}
        title={isHS ? t("step6.hs.title") : t("step6.re.title")}
        subtitle={isHS ? t("step6.hs.subtitle") : t("step6.re.subtitle")}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t("step6.hs.fields.postJobFollowUp.label")}>
              <StyledSelect
                value={step6.postJobFollowUp || ""}
                onChange={(v) => update({ postJobFollowUp: v })}
                options={loc(HS_POST_JOB)}
              />
            </FormField>
            <FormField label={t("step6.hs.fields.maintenanceReminders.label")}>
              <StyledSelect
                value={step6.maintenanceReminders || ""}
                onChange={(v) => update({ maintenanceReminders: v })}
                options={loc(HS_MAINTENANCE)}
              />
            </FormField>
            <FormField label={t("step6.hs.fields.serviceAgreements.label")}>
              <StyledSelect
                value={step6.serviceAgreements || ""}
                onChange={(v) => update({ serviceAgreements: v })}
                options={loc(HS_AGREEMENTS)}
              />
            </FormField>
            <FormField label={t("step6.hs.fields.estimateFollowUp.label")}>
              <StyledSelect
                value={step6.estimateFollowUp || ""}
                onChange={(v) => update({ estimateFollowUp: v })}
                options={loc(HS_ESTIMATE_FU)}
              />
            </FormField>
            <FormField label={t("step6.hs.fields.warrantyTracking.label")}>
              <StyledSelect
                value={step6.warrantyTracking || ""}
                onChange={(v) => update({ warrantyTracking: v })}
                options={loc(HS_WARRANTY)}
              />
            </FormField>
            <FormField label={t("step6.hs.fields.repeatBusinessPercent.label")}>
              <StyledSelect
                value={step6.repeatBusinessPercent}
                onChange={(v) => update({ repeatBusinessPercent: v })}
                options={loc(REPEAT_PERCENT)}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t("step6.re.fields.postCloseFollowUp.label")}>
              <StyledSelect
                value={step6.postCloseFollowUp || ""}
                onChange={(v) => update({ postCloseFollowUp: v })}
                options={loc(RE_POST_CLOSE)}
              />
            </FormField>
            <FormField label={t("step6.re.fields.pastClientContact.label")}>
              <StyledSelect
                value={step6.pastClientContact || ""}
                onChange={(v) => update({ pastClientContact: v })}
                options={loc(RE_PAST_CLIENT)}
              />
            </FormField>
            <FormField label={t("step6.re.fields.referralProcess.label")}>
              <StyledSelect
                value={step6.referralProcess || ""}
                onChange={(v) => update({ referralProcess: v })}
                options={loc(RE_REFERRAL)}
              />
            </FormField>
            <FormField label={t("step6.re.fields.lostLeadFollowUp.label")}>
              <StyledSelect
                value={step6.lostLeadFollowUp || ""}
                onChange={(v) => update({ lostLeadFollowUp: v })}
                options={loc(RE_LOST_LEAD)}
              />
            </FormField>
            <FormField label={t("step6.re.fields.anniversaryTracking.label")}>
              <StyledSelect
                value={step6.anniversaryTracking || ""}
                onChange={(v) => update({ anniversaryTracking: v })}
                options={loc(RE_ANNIVERSARY)}
              />
            </FormField>
            <FormField label={t("step6.re.fields.repeatBusinessPercent.label")}>
              <StyledSelect
                value={step6.repeatBusinessPercent}
                onChange={(v) => update({ repeatBusinessPercent: v })}
                options={loc(RE_REPEAT)}
              />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
}

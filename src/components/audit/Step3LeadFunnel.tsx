import { useTranslation } from "react-i18next";
import {
  FormField,
  StepHeader,
  StyledSelect,
  MultiCheckbox,
  StepProps,
  SelectOption,
  toOptions,
  localizeOptions,
} from "./AuditFormComponents";
import { getSubNicheOptionsForLang } from "@/config/subNicheConfig";
import { useLang } from "@/hooks/useLang";

const HS_LEAD_SOURCES = toOptions([
  "Google Search/SEO",
  "Google Ads (PPC)",
  "Google Local Services Ads",
  "Facebook/Instagram Ads",
  "Nextdoor",
  "Yelp",
  "Angi/HomeAdvisor",
  "Thumbtack",
  "Word of Mouth/Referrals",
  "Direct Mail/Door Hangers",
  "Radio/TV",
  "Truck Wraps/Yard Signs",
]);

const RE_LEAD_SOURCES = toOptions([
  "Zillow/Realtor.com",
  "Google Ads (PPC)",
  "Facebook/Instagram Ads",
  "Open Houses",
  "Sphere of Influence/Referrals",
  "Past Client Referrals",
  "Agent Website/IDX",
  "YouTube/Video",
  "Door Knocking/Cold Calling",
  "Expired/FSBO Prospecting",
  "Relocation Companies",
  "Builder/Developer Partnerships",
]);

// Bulgarian base lead source lists (fallback when no sub-niche selected)
const BG_HS_LEAD_SOURCES = toOptions([
  "Google Търсене/SEO",
  "Google Ads",
  "Facebook/Instagram реклами",
  "OLX.bg",
  "bazar.bg",
  "Alo.bg",
  "Facebook Marketplace",
  "Препоръки от клиенти",
  "Viber групи",
]);

const BG_RE_LEAD_SOURCES = toOptions([
  "imot.bg",
  "imoti.net",
  "homes.bg",
  "OLX.bg",
  "Facebook/Instagram реклами",
  "Google Ads",
  "Препоръки от клиенти",
]);

const RESPONSE_SPEEDS = [
  "Under 5 minutes",
  "5–30 minutes",
  "30–60 minutes",
  "1–4 hours",
  "Same business day",
  "Next business day or later",
];

const HS_RESPONSE_SPEEDS = toOptions([
  ...RESPONSE_SPEEDS,
  "No consistent process",
]);
const RE_RESPONSE_SPEEDS = toOptions([
  ...RESPONSE_SPEEDS,
  "It depends on the agent",
]);

const LEAD_TRACKING = toOptions([
  "CRM with pipeline stages",
  "Spreadsheet/Google Sheets",
  "Notebook/whiteboard",
  "Software but not consistently",
  "We don't really track this",
]);

const HS_CONVERSION_RATES = toOptions([
  "Yes - above 50%",
  "Yes - 30–50%",
  "Yes - under 30%",
  "No - we don't track this",
]);

const RE_CONVERSION_RATES = toOptions([
  "Above 10%",
  "5–10%",
  "2–5%",
  "Under 2%",
  "We don't track this",
]);

const MISSED_CALL = toOptions([
  "Auto text-back within seconds",
  "Voicemail - we call back ASAP",
  "Voicemail - we call back when we can",
  "Answering service",
  "We probably miss some and never follow up",
]);

const LEAD_DISTRIBUTION = toOptions([
  "Round robin - automated",
  "Round robin - manual",
  "Pond/claim system",
  "Assigned by source or area",
  "First to grab it",
  "No formal system",
]);

const TOUCHES_7DAYS = toOptions([
  "8+ touches",
  "5–7 touches",
  "2–4 touches",
  "1 touch",
  "No consistent follow-up plan",
]);

const REVIEWS_COUNT = toOptions(["0–25", "26–50", "51–100", "101–250", "250+"]);

const REVIEW_AUTOMATION = toOptions([
  "Yes - automated via software",
  "Yes - manually ask sometimes",
  "No",
]);

const RE_REVIEW_AUTOMATION = toOptions([
  "Yes - automated",
  "Yes - manual/sometimes",
  "No",
]);

const BG_LABELS: Record<string, string> = {
  // Response speeds
  "Under 5 minutes": "Под 5 минути",
  "5–30 minutes": "5–30 минути",
  "30–60 minutes": "30–60 минути",
  "1–4 hours": "1–4 часа",
  "Same business day": "В рамките на работния ден",
  "Next business day or later": "Следващ работен ден или по-късно",
  "No consistent process": "Без последователен процес",
  "It depends on the agent": "Зависи от агента",
  // Lead tracking
  "CRM with pipeline stages": "Специален софтуер",
  "Spreadsheet/Google Sheets": "Таблица/Google Sheets",
  "Notebook/whiteboard": "Тетрадка/бяла дъска",
  "Software but not consistently": "Софтуер, но не постоянно",
  "We don't really track this": "Не проследяваме това",
  // HS conversion rates
  "Yes - above 50%": "Да - над 50%",
  "Yes - 30–50%": "Да - 30–50%",
  "Yes - under 30%": "Да - под 30%",
  "No - we don't track this": "Не - не проследяваме",
  // RE conversion rates
  "Above 10%": "Над 10%",
  "Under 2%": "Под 2%",
  "We don't track this": "Не проследяваме",
  // Missed call handling
  "Auto text-back within seconds": "Автоматичен SMS отговор за секунди",
  "Voicemail - we call back ASAP":
    "Гласова поща - обаждаме се възможно най-скоро",
  "Voicemail - we call back when we can":
    "Гласова поща - обаждаме се когато можем",
  "Answering service": "Услуга за отговаряне на обаждания",
  "We probably miss some and never follow up":
    "Вероятно пропускаме някои и не се обаждаме",
  // Lead distribution
  "Round robin - automated": "Ротация - автоматична",
  "Round robin - manual": "Ротация - ръчна",
  "Pond/claim system": "Система за заявяване",
  "Assigned by source or area": "Разпределение по източник или район",
  "First to grab it": "Първият, който го вземе",
  "No formal system": "Без формална система",
  // Touches in 7 days
  "8+ touches": "8+ контакта",
  "5–7 touches": "5–7 контакта",
  "2–4 touches": "2–4 контакта",
  "1 touch": "1 контакт",
  "No consistent follow-up plan": "Без последователен план за проследяване",
  // Review automation
  "Yes - automated via software": "Да - автоматизирано чрез софтуер",
  "Yes - manually ask sometimes": "Да - питаме ръчно понякога",
  "Yes - automated": "Да - автоматизирано",
  "Yes - manual/sometimes": "Да - ръчно/понякога",
  No: "Не",
};

export function Step3LeadFunnel({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation("steps");
  const { lang } = useLang();
  const { step3 } = state;
  const update = (payload: Partial<typeof step3>) =>
    dispatch({ type: "UPDATE_STEP3", payload });

  // Sub-niche-aware + language-aware lead source options
  const subNicheOpts = state.subNiche
    ? getSubNicheOptionsForLang(state.subNiche, lang)
    : null;
  const leadSourceOptions =
    subNicheOpts && subNicheOpts.leadSources.length > 0
      ? toOptions(subNicheOpts.leadSources)
      : isHS
        ? lang === "bg"
          ? BG_HS_LEAD_SOURCES
          : HS_LEAD_SOURCES
        : lang === "bg"
          ? BG_RE_LEAD_SOURCES
          : RE_LEAD_SOURCES;
  const loc = (opts: SelectOption[]) =>
    lang === "bg" ? localizeOptions(opts, BG_LABELS) : opts;

  return (
    <div>
      <StepHeader
        step={3}
        title={t("step3.title")}
        subtitle={t("step3.subtitle")}
      />

      <div className="space-y-7">
        <FormField
          label={t("step3.fields.leadSources.label")}
          hint={t("step3.fields.leadSources.hint")}
          required
        >
          <MultiCheckbox
            options={leadSourceOptions}
            selected={step3.leadSources}
            onChange={(v) => update({ leadSources: v })}
          />
        </FormField>

        <FormField
          label={
            isHS
              ? t("step3.fields.responseSpeed.hs.label")
              : t("step3.fields.responseSpeed.re.label")
          }
          required
        >
          <StyledSelect
            value={step3.responseSpeed}
            onChange={(v) => update({ responseSpeed: v })}
            options={loc(isHS ? HS_RESPONSE_SPEEDS : RE_RESPONSE_SPEEDS)}
          />
        </FormField>

        {!isHS && (
          <FormField label={t("step3.fields.leadDistribution.label")}>
            <StyledSelect
              value={step3.leadDistribution || ""}
              onChange={(v) => update({ leadDistribution: v })}
              options={loc(LEAD_DISTRIBUTION)}
            />
          </FormField>
        )}

        <FormField
          label={
            isHS
              ? t("step3.fields.leadTracking.hs.label")
              : t("step3.fields.leadTracking.re.label")
          }
        >
          <StyledSelect
            value={step3.leadTracking}
            onChange={(v) => update({ leadTracking: v })}
            options={loc(LEAD_TRACKING)}
          />
        </FormField>

        <FormField
          label={
            isHS
              ? t("step3.fields.conversionRate.hs.label")
              : t("step3.fields.conversionRate.re.label")
          }
        >
          <StyledSelect
            value={step3.conversionRate}
            onChange={(v) => update({ conversionRate: v })}
            options={loc(isHS ? HS_CONVERSION_RATES : RE_CONVERSION_RATES)}
          />
        </FormField>

        {isHS ? (
          <FormField label={t("step3.fields.missedCallHandling.label")}>
            <StyledSelect
              value={step3.missedCallHandling || ""}
              onChange={(v) => update({ missedCallHandling: v })}
              options={loc(MISSED_CALL)}
            />
          </FormField>
        ) : (
          <FormField label={t("step3.fields.touchesIn7Days.label")}>
            <StyledSelect
              value={step3.touchesIn7Days || ""}
              onChange={(v) => update({ touchesIn7Days: v })}
              options={loc(TOUCHES_7DAYS)}
            />
          </FormField>
        )}

        <FormField
          label={
            isHS
              ? t("step3.fields.googleReviews.hs.label")
              : t("step3.fields.googleReviews.re.label")
          }
        >
          <StyledSelect
            value={step3.googleReviews}
            onChange={(v) => update({ googleReviews: v })}
            options={loc(REVIEWS_COUNT)}
          />
        </FormField>

        <FormField
          label={
            isHS
              ? t("step3.fields.reviewAutomation.hs.label")
              : t("step3.fields.reviewAutomation.re.label")
          }
        >
          <StyledSelect
            value={step3.reviewAutomation}
            onChange={(v) => update({ reviewAutomation: v })}
            options={loc(isHS ? REVIEW_AUTOMATION : RE_REVIEW_AUTOMATION)}
          />
        </FormField>
      </div>
    </div>
  );
}

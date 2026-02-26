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

// Home Services options
const HS_SCHEDULING = toOptions([
  "Software with drag-and-drop board",
  "Google/Outlook Calendar",
  "Phone calls and a whiteboard",
  "Paper schedule",
  "No real system",
]);
const HS_DISPATCH = toOptions([
  "Automated through software",
  "Manual - office calls/texts techs",
  "Techs check a shared calendar",
  "Mixed approach",
]);
const HS_ROUTE = toOptions([
  "Yes - software optimized",
  "We try to cluster jobs manually",
  "No",
]);
const HS_TRACKING = toOptions(["Yes - GPS tracking", "No"]);
const HS_CAPACITY = toOptions([
  "Software manages availability",
  "We eyeball it",
  "We often overbook or underbook",
]);
const HS_EMERGENCY = toOptions([
  "Dedicated slots held open",
  "We shuffle the schedule",
  "We usually can't accommodate them",
  "It's chaotic",
]);

// Real Estate options
const RE_FOLLOW_UP = toOptions([
  "Yes - automated drip campaigns",
  "Yes - manual but documented",
  "Sort of - agents do their own thing",
  "No formal plan",
]);
const RE_NURTURE = toOptions([
  "30 days or less",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "We nurture indefinitely",
  "Agents decide for themselves",
]);
const RE_DRIP = toOptions([
  "Yes - fully automated",
  "Yes - partially automated",
  "No",
]);
const RE_TEMP = toOptions([
  "CRM lead scoring",
  "Manual tags/labels in CRM",
  "Agents keep mental notes",
  "We don't differentiate",
]);
const RE_LOGGING = toOptions([
  "Yes - consistently",
  "Sometimes",
  "Rarely",
  "We don't require it",
]);
const RE_COLD = toOptions([
  "Long-term automated nurture",
  "Manual follow-up for 2+ weeks",
  "A few attempts then move on",
  "We mostly give up",
]);

const BG_LABELS: Record<string, string> = {
  // HS Scheduling
  "Software with drag-and-drop board": "Специален софтуер",
  "Google/Outlook Calendar": "Google/Outlook календар",
  "Phone calls and a whiteboard": "Телефонни обаждания и бяла дъска",
  "Paper schedule": "Хартиен график",
  "No real system": "Без реална система",
  // HS Dispatch
  "Automated through software": "Автоматизирано чрез софтуер",
  "Manual - office calls/texts techs":
    "Ръчно - офисът звъни/пише на служителите",
  "Techs check a shared calendar": "Служителите проверяват споделен календар",
  "Mixed approach": "Смесен подход",
  // HS Route
  "Yes - software optimized": "Да - оптимизирано чрез софтуер",
  "We try to cluster jobs manually": "Опитваме се ръчно да групираме задачите",
  No: "Не",
  // HS Tracking
  "Yes - GPS tracking": "Да - GPS проследяване",
  // HS Capacity
  "Software manages availability": "Софтуерът управлява наличността",
  "We eyeball it": "Преценяваме на око",
  "We often overbook or underbook":
    "Често резервираме прекалено много или малко",
  // HS Emergency
  "Dedicated slots held open": "Запазени слотове за спешни случаи",
  "We shuffle the schedule": "Пренареждаме графика",
  "We usually can't accommodate them": "Обикновено не можем да ги поемем",
  "It's chaotic": "Хаотично е",
  // RE Follow Up
  "Yes - automated drip campaigns": "Да - автоматизирано",
  "Yes - manual but documented": "Да - ръчно, но документирано",
  "Sort of - agents do their own thing":
    "Донякъде - агентите действат самостоятелно",
  "No formal plan": "Без формален план",
  // RE Nurture
  "30 days or less": "30 дни или по-малко",
  "1–3 months": "1–3 месеца",
  "3–6 months": "3–6 месеца",
  "6–12 months": "6–12 месеца",
  "We nurture indefinitely": "Поддържаме контакт безсрочно",
  "Agents decide for themselves": "Агентите решават сами",
  // RE Drip
  "Yes - fully automated": "Да - напълно автоматизирано",
  "Yes - partially automated": "Да - частично автоматизирано",
  // RE Temp
  "CRM lead scoring": "CRM оценка на лийдове",
  "Manual tags/labels in CRM": "Ръчни тагове/етикети в CRM",
  "Agents keep mental notes": "Агентите помнят наум",
  "We don't differentiate": "Не правим разлика",
  // RE Logging
  "Yes - consistently": "Да - последователно",
  Sometimes: "Понякога",
  Rarely: "Рядко",
  "We don't require it": "Не го изискваме",
  // RE Cold
  "Long-term automated nurture": "Дългосрочно автоматизирано поддържане",
  "Manual follow-up for 2+ weeks": "Ръчно проследяване 2+ седмици",
  "A few attempts then move on": "Няколко опита, после продължаваме",
  "We mostly give up": "Най-често се отказваме",
};

export function Step4Scheduling({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation("steps");
  const { lang } = useLang();
  const { step4 } = state;
  const loc = (opts: SelectOption[]) =>
    lang === "bg" ? localizeOptions(opts, BG_LABELS) : opts;
  const update = (payload: Partial<typeof step4>) =>
    dispatch({ type: "UPDATE_STEP4", payload });

  if (isHS) {
    return (
      <div>
        <StepHeader
          step={4}
          title={t("step4.hs.title")}
          subtitle={t("step4.hs.subtitle")}
        />
        <div className="space-y-7">
          <FormField label={t("step4.hs.fields.schedulingMethod.label")}>
            <StyledSelect
              value={step4.schedulingMethod || ""}
              onChange={(v) => update({ schedulingMethod: v })}
              options={loc(HS_SCHEDULING)}
            />
          </FormField>
          <FormField label={t("step4.hs.fields.dispatchMethod.label")}>
            <StyledSelect
              value={step4.dispatchMethod || ""}
              onChange={(v) => update({ dispatchMethod: v })}
              options={loc(HS_DISPATCH)}
            />
          </FormField>
          <FormField label={t("step4.hs.fields.routeOptimization.label")}>
            <StyledSelect
              value={step4.routeOptimization || ""}
              onChange={(v) => update({ routeOptimization: v })}
              options={loc(HS_ROUTE)}
            />
          </FormField>
          <FormField label={t("step4.hs.fields.realTimeTracking.label")}>
            <StyledSelect
              value={step4.realTimeTracking || ""}
              onChange={(v) => update({ realTimeTracking: v })}
              options={loc(HS_TRACKING)}
            />
          </FormField>
          <FormField label={t("step4.hs.fields.capacityPlanning.label")}>
            <StyledSelect
              value={step4.capacityPlanning || ""}
              onChange={(v) => update({ capacityPlanning: v })}
              options={loc(HS_CAPACITY)}
            />
          </FormField>
          <FormField label={t("step4.hs.fields.emergencyHandling.label")}>
            <StyledSelect
              value={step4.emergencyHandling || ""}
              onChange={(v) => update({ emergencyHandling: v })}
              options={loc(HS_EMERGENCY)}
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
        title={t("step4.re.title")}
        subtitle={t("step4.re.subtitle")}
      />
      <div className="space-y-7">
        <FormField label={t("step4.re.fields.followUpPlan.label")}>
          <StyledSelect
            value={step4.followUpPlan || ""}
            onChange={(v) => update({ followUpPlan: v })}
            options={loc(RE_FOLLOW_UP)}
          />
        </FormField>
        <FormField label={t("step4.re.fields.nurtureDuration.label")}>
          <StyledSelect
            value={step4.nurtureDuration || ""}
            onChange={(v) => update({ nurtureDuration: v })}
            options={loc(RE_NURTURE)}
          />
        </FormField>
        <FormField label={t("step4.re.fields.automatedDrip.label")}>
          <StyledSelect
            value={step4.automatedDrip || ""}
            onChange={(v) => update({ automatedDrip: v })}
            options={loc(RE_DRIP)}
          />
        </FormField>
        <FormField label={t("step4.re.fields.leadTemperatureTracking.label")}>
          <StyledSelect
            value={step4.leadTemperatureTracking || ""}
            onChange={(v) => update({ leadTemperatureTracking: v })}
            options={loc(RE_TEMP)}
          />
        </FormField>
        <FormField label={t("step4.re.fields.activityLogging.label")}>
          <StyledSelect
            value={step4.activityLogging || ""}
            onChange={(v) => update({ activityLogging: v })}
            options={loc(RE_LOGGING)}
          />
        </FormField>
        <FormField label={t("step4.re.fields.coldLeadHandling.label")}>
          <StyledSelect
            value={step4.coldLeadHandling || ""}
            onChange={(v) => update({ coldLeadHandling: v })}
            options={loc(RE_COLD)}
          />
        </FormField>
      </div>
    </div>
  );
}

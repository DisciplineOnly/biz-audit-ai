import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, MultiCheckbox, StepProps, SelectOption, toOptions, localizeOptions } from "./AuditFormComponents";
import { getSubNicheOptionsForLang } from "@/config/subNicheConfig";
import { useLang } from "@/hooks/useLang";

const HS_PERFORMANCE = toOptions([
  "KPIs tracked in software (revenue per tech, callback rate, etc.)",
  "We review numbers quarterly", "Manager observation", "No formal measurement",
]);
const HS_JOB_COSTING = toOptions([
  "Tracked per job in software", "Estimated but not tracked precisely",
  "We mostly guess", "We don't track job costs",
]);
const HS_INVENTORY = toOptions([
  "Inventory management software", "Spreadsheet tracking",
  "Techs manage their own trucks", "No formal tracking",
]);
const HS_TIME = toOptions([
  "GPS + software time tracking", "Manual time sheets",
  "Clock in/clock out", "They don't log time",
]);
const HS_QUALITY = toOptions([
  "QA checklist + customer survey", "Customer feedback reviewed regularly",
  "Handle complaints as they come", "No formal process",
]);
const HS_KPIS = toOptions([
  "Average Ticket/Job Value", "Close/Conversion Rate", "Revenue Per Technician",
  "Callback/Redo Rate", "Customer Acquisition Cost", "Membership/Service Plan Count",
  "Customer Satisfaction Score", "Average Lead Response Time",
  "Profit Margins Per Job Type", "We don't track any KPIs",
]);

const RE_PERFORMANCE = toOptions([
  "CRM dashboards with KPIs", "Spreadsheet tracking",
  "Monthly production reports", "No formal measurement",
]);
const RE_ACCOUNTABILITY = toOptions([
  "Daily/weekly activity minimums tracked in CRM", "Weekly team meetings with accountability",
  "Informal check-ins", "No accountability system",
]);
const RE_TRANSACTION = toOptions([
  "Transaction management software (Dotloop, SkySlope, etc.)",
  "Checklists in CRM", "Spreadsheet/Google Docs", "No standardized process",
]);
const RE_ONBOARDING = toOptions([
  "Documented training program + mentorship", "Informal training",
  "Shadow other agents", "Figure it out yourself",
]);
const RE_KPIS = toOptions([
  "Leads generated per agent", "Appointments set per agent",
  "Conversion rate (lead → client)", "Average days to close",
  "Cost per lead by source", "GCI per agent",
  "Client satisfaction score", "Average list-to-sale price ratio",
  "We don't track any KPIs",
]);

const BG_LABELS: Record<string, string> = {
  // HS Performance
  "KPIs tracked in software (revenue per tech, callback rate, etc.)": "KPI проследявани в софтуер (приход на техник, процент обратни обаждания и др.)",
  "We review numbers quarterly": "Преглеждаме числата на тримесечие",
  "Manager observation": "Наблюдение от мениджъра",
  "No formal measurement": "Без формално измерване",
  // HS Job costing
  "Tracked per job in software": "Проследявано за всяка задача в софтуер",
  "Estimated but not tracked precisely": "Оценявано, но не проследявано точно",
  "We mostly guess": "Предимно гадаем",
  "We don't track job costs": "Не проследяваме разходите по задачи",
  // HS Inventory
  "Inventory management software": "Софтуер за управление на инвентар",
  "Spreadsheet tracking": "Проследяване с таблици",
  "Techs manage their own trucks": "Техниците управляват собствените си камиони",
  "No formal tracking": "Без формално проследяване",
  // HS Time tracking
  "GPS + software time tracking": "GPS + софтуерно проследяване на времето",
  "Manual time sheets": "Ръчни табели за работно време",
  "Clock in/clock out": "Отбелязване начало/край на смяна",
  "They don't log time": "Не записват работното време",
  // HS Quality
  "QA checklist + customer survey": "QA чеклист + анкета за клиенти",
  "Customer feedback reviewed regularly": "Обратната връзка от клиенти се преглежда редовно",
  "Handle complaints as they come": "Решаваме оплакванията, когато постъпят",
  "No formal process": "Без формален процес",
  // HS KPIs
  "Average Ticket/Job Value": "Средна стойност на поръчка/задача",
  "Close/Conversion Rate": "Процент на приключване/конверсия",
  "Revenue Per Technician": "Приход на техник",
  "Callback/Redo Rate": "Процент обратни обаждания/преработки",
  "Customer Acquisition Cost": "Цена за привличане на клиент",
  "Membership/Service Plan Count": "Брой членства/сервизни планове",
  "Customer Satisfaction Score": "Оценка на удовлетвореност на клиентите",
  "Average Lead Response Time": "Средно време за отговор на запитване",
  "Profit Margins Per Job Type": "Маржове на печалба по тип задача",
  "We don't track any KPIs": "Не проследяваме никакви KPI",
  // RE Performance
  "CRM dashboards with KPIs": "CRM табла с KPI",
  "Spreadsheet tracking": "Проследяване с таблици",
  "Monthly production reports": "Месечни отчети за продуктивност",
  // RE Accountability
  "Daily/weekly activity minimums tracked in CRM": "Дневни/седмични минимуми за активност в CRM",
  "Weekly team meetings with accountability": "Седмични екипни срещи с отчетност",
  "Informal check-ins": "Неформални проверки",
  "No accountability system": "Без система за отчетност",
  // RE Transaction
  "Transaction management software (Dotloop, SkySlope, etc.)": "Софтуер за управление на сделки (Dotloop, SkySlope и др.)",
  "Checklists in CRM": "Чеклисти в CRM",
  "Spreadsheet/Google Docs": "Таблица/Google Docs",
  "No standardized process": "Без стандартизиран процес",
  // RE Onboarding
  "Documented training program + mentorship": "Документирана програма за обучение + менторство",
  "Informal training": "Неформално обучение",
  "Shadow other agents": "Наблюдение на други агенти",
  "Figure it out yourself": "Оправяй се сам",
  // RE KPIs
  "Leads generated per agent": "Генерирани лийдове на агент",
  "Appointments set per agent": "Уговорени срещи на агент",
  "Conversion rate (lead → client)": "Процент на конверсия (лийд → клиент)",
  "Average days to close": "Средно дни до приключване",
  "Cost per lead by source": "Цена на лийд по източник",
  "GCI per agent": "GCI на агент",
  "Client satisfaction score": "Оценка на удовлетвореност на клиентите",
  "Average list-to-sale price ratio": "Средно съотношение обявена/продажна цена",
};

export function Step7Operations({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { lang } = useLang();
  const { step7 } = state;
  const loc = (opts: SelectOption[]) => lang === 'bg' ? localizeOptions(opts, BG_LABELS) : opts;
  const update = (payload: Partial<typeof step7>) => dispatch({ type: "UPDATE_STEP7", payload });

  // Sub-niche-aware + language-aware KPI options
  const subNicheOpts = state.subNiche ? getSubNicheOptionsForLang(state.subNiche, lang) : null;
  const kpiOptions = subNicheOpts && subNicheOpts.kpis.length > 0
    ? toOptions(subNicheOpts.kpis)
    : (isHS ? HS_KPIS : RE_KPIS);

  return (
    <div>
      <StepHeader
        step={7}
        title={t('step7.title')}
        subtitle={t('step7.subtitle')}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t('step7.hs.fields.performanceMeasurement.label')}>
              <StyledSelect
                value={step7.performanceMeasurement || ""}
                onChange={(v) => update({ performanceMeasurement: v })}
                options={loc(HS_PERFORMANCE)}
              />
            </FormField>
            <FormField label={t('step7.hs.fields.jobCosting.label')}>
              <StyledSelect
                value={step7.jobCosting || ""}
                onChange={(v) => update({ jobCosting: v })}
                options={loc(HS_JOB_COSTING)}
              />
            </FormField>
            <FormField label={t('step7.hs.fields.inventoryManagement.label')}>
              <StyledSelect
                value={step7.inventoryManagement || ""}
                onChange={(v) => update({ inventoryManagement: v })}
                options={loc(HS_INVENTORY)}
              />
            </FormField>
            <FormField label={t('step7.hs.fields.timeTracking.label')}>
              <StyledSelect
                value={step7.timeTracking || ""}
                onChange={(v) => update({ timeTracking: v })}
                options={loc(HS_TIME)}
              />
            </FormField>
            <FormField label={t('step7.hs.fields.qualityControl.label')}>
              <StyledSelect
                value={step7.qualityControl || ""}
                onChange={(v) => update({ qualityControl: v })}
                options={loc(HS_QUALITY)}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step7.re.fields.agentPerformanceMeasurement.label')}>
              <StyledSelect
                value={step7.agentPerformanceMeasurement || ""}
                onChange={(v) => update({ agentPerformanceMeasurement: v })}
                options={loc(RE_PERFORMANCE)}
              />
            </FormField>
            <FormField label={t('step7.re.fields.agentAccountability.label')}>
              <StyledSelect
                value={step7.agentAccountability || ""}
                onChange={(v) => update({ agentAccountability: v })}
                options={loc(RE_ACCOUNTABILITY)}
              />
            </FormField>
            <FormField label={t('step7.re.fields.transactionWorkflow.label')}>
              <StyledSelect
                value={step7.transactionWorkflow || ""}
                onChange={(v) => update({ transactionWorkflow: v })}
                options={loc(RE_TRANSACTION)}
              />
            </FormField>
            <FormField label={t('step7.re.fields.agentOnboarding.label')}>
              <StyledSelect
                value={step7.agentOnboarding || ""}
                onChange={(v) => update({ agentOnboarding: v })}
                options={loc(RE_ONBOARDING)}
              />
            </FormField>
          </>
        )}

        <FormField
          label={t('step7.fields.kpisTracked.label')}
          hint={t('step7.fields.kpisTracked.hint')}
        >
          <MultiCheckbox
            options={loc(kpiOptions)}
            selected={step7.kpisTracked}
            onChange={(v) => update({ kpisTracked: v })}
          />
        </FormField>
      </div>
    </div>
  );
}

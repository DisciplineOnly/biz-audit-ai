import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, MultiCheckbox, StyledTextarea, StepProps, SelectOption, toOptions, localizeOptions } from "./AuditFormComponents";
import { useLang } from "@/hooks/useLang";

const HS_ESTIMATE = toOptions([
  "Software-generated with digital approval", "PDF/email quotes",
  "Paper/verbal estimates", "No standard process",
]);
const HS_PRICING = toOptions(["Flat rate pricing", "Time & materials", "Mix of both", "No standardized pricing"]);
const HS_INVOICE_TIMING = toOptions([
  "Immediately on-site (digital)", "Same day", "Within a few days", "It varies a lot",
]);
const HS_PAYMENT_METHODS = toOptions([
  "Credit/Debit in the field", "Online payment portal", "Customer financing options",
  "Check", "Cash", "ACH/Bank transfer", "Auto-pay for recurring services",
]);
const HS_COLLECTIONS = toOptions([
  "Automated reminders + escalation", "Manual follow-up",
  "We chase when we remember", "We write off a lot of receivables",
]);
const FINANCIAL_REVIEW = toOptions([
  "Monthly P&L and KPI review", "Quarterly review",
  "Annual with accountant", "We check the bank account",
]);

const RE_EXPENSE = toOptions([
  "Team/brokerage software", "Spreadsheet", "Accounting software",
  "Agents handle their own", "No system",
]);
const RE_PNL = toOptions([
  "Monthly financial review with bookkeeper/accountant", "Quarterly review",
  "Annual review", "We don't track team P&L",
]);
const RE_COMMISSION = toOptions([
  "Automated through transaction management software", "Manual but systematic", "Ad hoc",
]);
const RE_MARKETING_BUDGET = toOptions([
  "Yes — detailed per-channel tracking", "Yes — total spend tracked",
  "We spend but don't track ROI", "No formal marketing budget",
]);
const RE_PAYMENT_METHODS = toOptions([
  "Credit/Debit", "Online portal", "ACH/Bank transfer", "Check", "Wire transfer",
]);

const BG_LABELS: Record<string, string> = {
  // HS Estimate
  "Software-generated with digital approval": "Генерирана от софтуер с дигитално одобрение",
  "PDF/email quotes": "PDF/имейл оферти",
  "Paper/verbal estimates": "Хартиени/устни оценки",
  "No standard process": "Без стандартен процес",
  // HS Pricing
  "Flat rate pricing": "Фиксирани цени",
  "Time & materials": "Време и материали",
  "Mix of both": "Комбинация от двете",
  "No standardized pricing": "Без стандартизирано ценообразуване",
  // HS Invoice timing
  "Immediately on-site (digital)": "Веднага на място (дигитално)",
  "Same day": "В същия ден",
  "Within a few days": "В рамките на няколко дни",
  "It varies a lot": "Варира значително",
  // HS Payment methods
  "Credit/Debit in the field": "Кредитна/дебитна карта на място",
  "Online payment portal": "Онлайн портал за плащане",
  "Customer financing options": "Опции за финансиране на клиенти",
  "Check": "Чек",
  "Cash": "В брой",
  "ACH/Bank transfer": "Банков превод",
  "Auto-pay for recurring services": "Автоматично плащане за повтарящи се услуги",
  // HS Collections
  "Automated reminders + escalation": "Автоматични напомняния + ескалация",
  "Manual follow-up": "Ръчно проследяване",
  "We chase when we remember": "Следим, когато си спомним",
  "We write off a lot of receivables": "Отписваме много вземания",
  // Financial review (shared)
  "Monthly P&L and KPI review": "Месечен преглед на приходи/разходи и KPI",
  "Quarterly review": "Тримесечен преглед",
  "Annual with accountant": "Годишен с счетоводител",
  "We check the bank account": "Проверяваме банковата сметка",
  // RE Expense
  "Team/brokerage software": "Екипен/брокерски софтуер",
  "Spreadsheet": "Таблица",
  "Accounting software": "Счетоводен софтуер",
  "Agents handle their own": "Агентите се справят сами",
  "No system": "Без система",
  // RE P&L
  "Monthly financial review with bookkeeper/accountant": "Месечен финансов преглед със счетоводител",
  "Annual review": "Годишен преглед",
  "We don't track team P&L": "Не проследяваме екипните приходи/разходи",
  // RE Commission
  "Automated through transaction management software": "Автоматизирано чрез софтуер за управление на сделки",
  "Manual but systematic": "Ръчно, но систематично",
  "Ad hoc": "При необходимост",
  // RE Marketing budget
  "Yes — detailed per-channel tracking": "Да — детайлно проследяване по канал",
  "Yes — total spend tracked": "Да — проследяваме общите разходи",
  "We spend but don't track ROI": "Харчим, но не проследяваме ROI",
  "No formal marketing budget": "Без формален маркетингов бюджет",
  // RE Payment methods
  "Credit/Debit": "Кредитна/дебитна карта",
  "Online portal": "Онлайн портал",
  "Wire transfer": "Банков превод",
};

export function Step8Financial({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { lang } = useLang();
  const { step8 } = state;
  const loc = (opts: SelectOption[]) => lang === 'bg' ? localizeOptions(opts, BG_LABELS) : opts;
  const update = (payload: Partial<typeof step8>) => dispatch({ type: "UPDATE_STEP8", payload });

  return (
    <div>
      <StepHeader
        step={8}
        title={t('step8.title')}
        subtitle={t('step8.subtitle')}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t('step8.hs.fields.estimateProcess.label')}>
              <StyledSelect
                value={step8.estimateProcess || ""}
                onChange={(v) => update({ estimateProcess: v })}
                options={loc(HS_ESTIMATE)}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.pricingModel.label')}>
              <StyledSelect
                value={step8.pricingModel || ""}
                onChange={(v) => update({ pricingModel: v })}
                options={loc(HS_PRICING)}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.invoiceTiming.label')}>
              <StyledSelect
                value={step8.invoiceTiming || ""}
                onChange={(v) => update({ invoiceTiming: v })}
                options={loc(HS_INVOICE_TIMING)}
              />
            </FormField>
            <FormField
              label={t('step8.hs.fields.paymentMethods.label')}
              hint={t('step8.hs.fields.paymentMethods.hint')}
            >
              <MultiCheckbox
                options={loc(HS_PAYMENT_METHODS)}
                selected={step8.paymentMethods}
                onChange={(v) => update({ paymentMethods: v })}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.collectionsProcess.label')}>
              <StyledSelect
                value={step8.collectionsProcess || ""}
                onChange={(v) => update({ collectionsProcess: v })}
                options={loc(HS_COLLECTIONS)}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.financialReview.label')}>
              <StyledSelect
                value={step8.financialReview || ""}
                onChange={(v) => update({ financialReview: v })}
                options={loc(FINANCIAL_REVIEW)}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step8.re.fields.expenseTracking.label')}>
              <StyledSelect
                value={step8.expenseTracking || ""}
                onChange={(v) => update({ expenseTracking: v })}
                options={loc(RE_EXPENSE)}
              />
            </FormField>
            <FormField label={t('step8.re.fields.teamPnL.label')}>
              <StyledSelect
                value={step8.teamPnL || ""}
                onChange={(v) => update({ teamPnL: v })}
                options={loc(RE_PNL)}
              />
            </FormField>
            <FormField label={t('step8.re.fields.commissionDisbursement.label')}>
              <StyledSelect
                value={step8.commissionDisbursement || ""}
                onChange={(v) => update({ commissionDisbursement: v })}
                options={loc(RE_COMMISSION)}
              />
            </FormField>
            <FormField label={t('step8.re.fields.marketingBudget.label')}>
              <StyledSelect
                value={step8.marketingBudget || ""}
                onChange={(v) => update({ marketingBudget: v })}
                options={loc(RE_MARKETING_BUDGET)}
              />
            </FormField>
            <FormField
              label={t('step8.re.fields.paymentMethods.label')}
              hint={t('step8.re.fields.paymentMethods.hint')}
            >
              <MultiCheckbox
                options={loc(RE_PAYMENT_METHODS)}
                selected={step8.paymentMethods}
                onChange={(v) => update({ paymentMethods: v })}
              />
            </FormField>
          </>
        )}

        <FormField
          label={t('step8.fields.biggestChallenge.label')}
          hint={t('step8.fields.biggestChallenge.hint')}
        >
          <StyledTextarea
            value={step8.biggestChallenge}
            onChange={(v) => update({ biggestChallenge: v })}
            placeholder={t('step8.fields.biggestChallenge.placeholder')}
            rows={4}
          />
        </FormField>

        <div
          className="p-5 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-dark)) 100%)",
          }}
        >
          <div className="text-2xl mb-2">&#9889;</div>
          <p className="text-white font-semibold text-lg mb-1">{t('step8.completionBanner.title')}</p>
          <p className="text-white/60 text-sm">
            {t('step8.completionBanner.description')}
          </p>
        </div>
      </div>
    </div>
  );
}

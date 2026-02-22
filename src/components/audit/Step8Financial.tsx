import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, MultiCheckbox, StyledTextarea, StepProps, toOptions } from "./AuditFormComponents";

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

export function Step8Financial({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step8 } = state;
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
                options={HS_ESTIMATE}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.pricingModel.label')}>
              <StyledSelect
                value={step8.pricingModel || ""}
                onChange={(v) => update({ pricingModel: v })}
                options={HS_PRICING}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.invoiceTiming.label')}>
              <StyledSelect
                value={step8.invoiceTiming || ""}
                onChange={(v) => update({ invoiceTiming: v })}
                options={HS_INVOICE_TIMING}
              />
            </FormField>
            <FormField
              label={t('step8.hs.fields.paymentMethods.label')}
              hint={t('step8.hs.fields.paymentMethods.hint')}
            >
              <MultiCheckbox
                options={HS_PAYMENT_METHODS}
                selected={step8.paymentMethods}
                onChange={(v) => update({ paymentMethods: v })}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.collectionsProcess.label')}>
              <StyledSelect
                value={step8.collectionsProcess || ""}
                onChange={(v) => update({ collectionsProcess: v })}
                options={HS_COLLECTIONS}
              />
            </FormField>
            <FormField label={t('step8.hs.fields.financialReview.label')}>
              <StyledSelect
                value={step8.financialReview || ""}
                onChange={(v) => update({ financialReview: v })}
                options={FINANCIAL_REVIEW}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step8.re.fields.expenseTracking.label')}>
              <StyledSelect
                value={step8.expenseTracking || ""}
                onChange={(v) => update({ expenseTracking: v })}
                options={RE_EXPENSE}
              />
            </FormField>
            <FormField label={t('step8.re.fields.teamPnL.label')}>
              <StyledSelect
                value={step8.teamPnL || ""}
                onChange={(v) => update({ teamPnL: v })}
                options={RE_PNL}
              />
            </FormField>
            <FormField label={t('step8.re.fields.commissionDisbursement.label')}>
              <StyledSelect
                value={step8.commissionDisbursement || ""}
                onChange={(v) => update({ commissionDisbursement: v })}
                options={RE_COMMISSION}
              />
            </FormField>
            <FormField label={t('step8.re.fields.marketingBudget.label')}>
              <StyledSelect
                value={step8.marketingBudget || ""}
                onChange={(v) => update({ marketingBudget: v })}
                options={RE_MARKETING_BUDGET}
              />
            </FormField>
            <FormField
              label={t('step8.re.fields.paymentMethods.label')}
              hint={t('step8.re.fields.paymentMethods.hint')}
            >
              <MultiCheckbox
                options={RE_PAYMENT_METHODS}
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

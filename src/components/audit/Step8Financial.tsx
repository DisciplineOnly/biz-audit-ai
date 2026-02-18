import { FormField, StepHeader, StyledSelect, MultiCheckbox, StyledTextarea, StepProps } from "./AuditFormComponents";

const HS_ESTIMATE = [
  "Software-generated with digital approval", "PDF/email quotes",
  "Paper/verbal estimates", "No standard process",
];
const HS_PRICING = ["Flat rate pricing", "Time & materials", "Mix of both", "No standardized pricing"];
const HS_INVOICE_TIMING = [
  "Immediately on-site (digital)", "Same day", "Within a few days", "It varies a lot",
];
const HS_PAYMENT_METHODS = [
  "Credit/Debit in the field", "Online payment portal", "Customer financing options",
  "Check", "Cash", "ACH/Bank transfer", "Auto-pay for recurring services",
];
const HS_COLLECTIONS = [
  "Automated reminders + escalation", "Manual follow-up",
  "We chase when we remember", "We write off a lot of receivables",
];
const FINANCIAL_REVIEW = [
  "Monthly P&L and KPI review", "Quarterly review",
  "Annual with accountant", "We check the bank account",
];

const RE_EXPENSE = [
  "Team/brokerage software", "Spreadsheet", "Accounting software",
  "Agents handle their own", "No system",
];
const RE_PNL = [
  "Monthly financial review with bookkeeper/accountant", "Quarterly review",
  "Annual review", "We don't track team P&L",
];
const RE_COMMISSION = [
  "Automated through transaction management software", "Manual but systematic", "Ad hoc",
];
const RE_MARKETING_BUDGET = [
  "Yes — detailed per-channel tracking", "Yes — total spend tracked",
  "We spend but don't track ROI", "No formal marketing budget",
];
const RE_PAYMENT_METHODS = [
  "Credit/Debit", "Online portal", "ACH/Bank transfer", "Check", "Wire transfer",
];

export function Step8Financial({ state, dispatch, isHS }: StepProps) {
  const { step8 } = state;
  const update = (payload: Partial<typeof step8>) => dispatch({ type: "UPDATE_STEP8", payload });

  return (
    <div>
      <StepHeader
        step={8}
        title="Financial Operations"
        subtitle="The final piece — how you price, invoice, and manage your money"
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label="How do you create and deliver estimates?">
              <StyledSelect
                value={step8.estimateProcess || ""}
                onChange={(v) => update({ estimateProcess: v })}
                options={HS_ESTIMATE}
              />
            </FormField>
            <FormField label="What pricing model do you primarily use?">
              <StyledSelect
                value={step8.pricingModel || ""}
                onChange={(v) => update({ pricingModel: v })}
                options={HS_PRICING}
              />
            </FormField>
            <FormField label="When is the invoice sent after job completion?">
              <StyledSelect
                value={step8.invoiceTiming || ""}
                onChange={(v) => update({ invoiceTiming: v })}
                options={HS_INVOICE_TIMING}
              />
            </FormField>
            <FormField
              label="What payment methods do you accept?"
              hint="Select all that apply"
            >
              <MultiCheckbox
                options={HS_PAYMENT_METHODS}
                selected={step8.paymentMethods}
                onChange={(v) => update({ paymentMethods: v })}
              />
            </FormField>
            <FormField label="How do you handle overdue invoices/collections?">
              <StyledSelect
                value={step8.collectionsProcess || ""}
                onChange={(v) => update({ collectionsProcess: v })}
                options={HS_COLLECTIONS}
              />
            </FormField>
            <FormField label="How do you review financial performance?">
              <StyledSelect
                value={step8.financialReview || ""}
                onChange={(v) => update({ financialReview: v })}
                options={FINANCIAL_REVIEW}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="How do agents track their expenses and commission splits?">
              <StyledSelect
                value={step8.expenseTracking || ""}
                onChange={(v) => update({ expenseTracking: v })}
                options={RE_EXPENSE}
              />
            </FormField>
            <FormField label="How do you track team P&L?">
              <StyledSelect
                value={step8.teamPnL || ""}
                onChange={(v) => update({ teamPnL: v })}
                options={RE_PNL}
              />
            </FormField>
            <FormField label="How do you handle commission disbursements?">
              <StyledSelect
                value={step8.commissionDisbursement || ""}
                onChange={(v) => update({ commissionDisbursement: v })}
                options={RE_COMMISSION}
              />
            </FormField>
            <FormField label="Do you have a marketing budget with ROI tracking per channel?">
              <StyledSelect
                value={step8.marketingBudget || ""}
                onChange={(v) => update({ marketingBudget: v })}
                options={RE_MARKETING_BUDGET}
              />
            </FormField>
            <FormField
              label="What payment methods do you accept for client-facing fees?"
              hint="Select all that apply"
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
          label="What's the single biggest operational challenge in your business right now?"
          hint="Optional — this helps our AI personalize your recommendations"
        >
          <StyledTextarea
            value={step8.biggestChallenge}
            onChange={(v) => update({ biggestChallenge: v })}
            placeholder="e.g., We can't seem to keep good technicians, our invoicing is a mess, we're losing leads to competitors..."
            rows={4}
          />
        </FormField>

        <div
          className="p-5 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-dark)) 100%)",
          }}
        >
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-white font-semibold text-lg mb-1">You're almost done!</p>
          <p className="text-white/60 text-sm">
            Click "Generate My AI Audit Report" below to get your personalized business audit with scores,
            gaps, and actionable recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledInput, StyledSelect, StepProps, toOptions } from "./AuditFormComponents";

const HS_INDUSTRIES = toOptions([
  "HVAC", "Plumbing", "Electrical", "Roofing", "Landscaping",
  "Pest Control", "Garage Doors", "Painting", "General Contracting", "Other",
]);
const HS_EMPLOYEE_COUNTS = toOptions(["Solo", "2–5", "6–15", "16–30", "31–50", "50+"]);
const HS_REVENUES = toOptions(["Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M–$5M", "$5M+"]);
const HS_YEARS = toOptions(["Less than 1", "1–3", "3–5", "5–10", "10+"]);
const HS_SERVICE_AREAS = toOptions(["Single city/town", "Multiple cities", "Entire metro area", "Multiple metros/statewide"]);

const RE_ROLES = toOptions(["Team Lead", "Broker/Owner", "Operations Manager", "Individual Agent", "Other"]);
const RE_TEAM_SIZES = toOptions(["Solo agent", "2–5 agents", "6–15 agents", "16–30 agents", "30+"]);
const RE_VOLUMES = toOptions(["Under 25 deals", "25–50 deals", "50–100 deals", "100–250 deals", "250+"]);
const RE_GCI = toOptions(["Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M+"]);
const RE_MARKETS = toOptions(["Residential resale", "New construction", "Luxury", "Commercial", "Mixed"]);

export function Step1BusinessInfo({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { step1 } = state;
  const update = (payload: Partial<typeof step1>) => dispatch({ type: "UPDATE_STEP1", payload });

  return (
    <div>
      <StepHeader
        step={1}
        title={t('step1.title')}
        subtitle={t('step1.subtitle')}
      />

      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField label={t('step1.fields.businessName.label')} required>
            <StyledInput
              value={step1.businessName}
              onChange={(v) => update({ businessName: v })}
              placeholder={t('step1.fields.businessName.placeholder')}
            />
          </FormField>

          <FormField label={t('step1.fields.contactName.label')} required>
            <StyledInput
              value={step1.contactName}
              onChange={(v) => update({ contactName: v })}
              placeholder={t('step1.fields.contactName.placeholder')}
            />
          </FormField>

          <FormField label={t('step1.fields.email.label')} required>
            <StyledInput
              type="email"
              value={step1.email}
              onChange={(v) => update({ email: v })}
              placeholder={t('step1.fields.email.placeholder')}
            />
          </FormField>

          <FormField label={t('step1.fields.phone.label')}>
            <StyledInput
              type="tel"
              value={step1.phone}
              onChange={(v) => update({ phone: v })}
              placeholder={t('step1.fields.phone.placeholder')}
            />
          </FormField>
        </div>

        <div className="border-t border-border pt-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {isHS ? t('step1.hs.sectionHeader') : t('step1.re.sectionHeader')}
          </h3>

          {isHS ? (
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label={t('step1.hs.industry.label')} required>
                <StyledSelect
                  value={step1.industry || ""}
                  onChange={(v) => update({ industry: v })}
                  options={HS_INDUSTRIES}
                />
              </FormField>

              <FormField label={t('step1.hs.employeeCount.label')}>
                <StyledSelect
                  value={step1.employeeCount || ""}
                  onChange={(v) => update({ employeeCount: v })}
                  options={HS_EMPLOYEE_COUNTS}
                />
              </FormField>

              <FormField label={t('step1.hs.annualRevenue.label')}>
                <StyledSelect
                  value={step1.annualRevenue || ""}
                  onChange={(v) => update({ annualRevenue: v })}
                  options={HS_REVENUES}
                />
              </FormField>

              <FormField label={t('step1.hs.yearsInBusiness.label')}>
                <StyledSelect
                  value={step1.yearsInBusiness || ""}
                  onChange={(v) => update({ yearsInBusiness: v })}
                  options={HS_YEARS}
                />
              </FormField>

              <FormField label={t('step1.hs.serviceArea.label')} hint={t('step1.hs.serviceArea.hint')}>
                <StyledSelect
                  value={step1.serviceArea || ""}
                  onChange={(v) => update({ serviceArea: v })}
                  options={HS_SERVICE_AREAS}
                />
              </FormField>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label={t('step1.re.role.label')} required>
                <StyledSelect
                  value={step1.role || ""}
                  onChange={(v) => update({ role: v })}
                  options={RE_ROLES}
                />
              </FormField>

              <FormField label={t('step1.re.teamSize.label')}>
                <StyledSelect
                  value={step1.teamSize || ""}
                  onChange={(v) => update({ teamSize: v })}
                  options={RE_TEAM_SIZES}
                />
              </FormField>

              <FormField label={t('step1.re.transactionVolume.label')}>
                <StyledSelect
                  value={step1.transactionVolume || ""}
                  onChange={(v) => update({ transactionVolume: v })}
                  options={RE_VOLUMES}
                />
              </FormField>

              <FormField label={t('step1.re.annualGCI.label')}>
                <StyledSelect
                  value={step1.annualGCI || ""}
                  onChange={(v) => update({ annualGCI: v })}
                  options={RE_GCI}
                />
              </FormField>

              <FormField label={t('step1.re.yearsInBusiness.label')}>
                <StyledSelect
                  value={step1.yearsInBusiness || ""}
                  onChange={(v) => update({ yearsInBusiness: v })}
                  options={HS_YEARS}
                />
              </FormField>

              <FormField label={t('step1.re.primaryMarket.label')}>
                <StyledSelect
                  value={step1.primaryMarket || ""}
                  onChange={(v) => update({ primaryMarket: v })}
                  options={RE_MARKETS}
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

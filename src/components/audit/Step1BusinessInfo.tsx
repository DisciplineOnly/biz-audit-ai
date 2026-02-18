import { FormField, StepHeader, StyledInput, StyledSelect, StepProps } from "./AuditFormComponents";

const HS_INDUSTRIES = [
  "HVAC", "Plumbing", "Electrical", "Roofing", "Landscaping",
  "Pest Control", "Garage Doors", "Painting", "General Contracting", "Other",
];
const HS_EMPLOYEE_COUNTS = ["Solo", "2–5", "6–15", "16–30", "31–50", "50+"];
const HS_REVENUES = ["Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M–$5M", "$5M+"];
const HS_YEARS = ["Less than 1", "1–3", "3–5", "5–10", "10+"];
const HS_SERVICE_AREAS = ["Single city/town", "Multiple cities", "Entire metro area", "Multiple metros/statewide"];

const RE_ROLES = ["Team Lead", "Broker/Owner", "Operations Manager", "Individual Agent", "Other"];
const RE_TEAM_SIZES = ["Solo agent", "2–5 agents", "6–15 agents", "16–30 agents", "30+"];
const RE_VOLUMES = ["Under 25 deals", "25–50 deals", "50–100 deals", "100–250 deals", "250+"];
const RE_GCI = ["Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M+"];
const RE_MARKETS = ["Residential resale", "New construction", "Luxury", "Commercial", "Mixed"];

export function Step1BusinessInfo({ state, dispatch, isHS }: StepProps) {
  const { step1 } = state;
  const update = (payload: Partial<typeof step1>) => dispatch({ type: "UPDATE_STEP1", payload });

  return (
    <div>
      <StepHeader
        step={1}
        title="Tell Us About Your Business"
        subtitle="Basic info to personalize your audit report"
      />

      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField label="Business Name" required>
            <StyledInput
              value={step1.businessName}
              onChange={(v) => update({ businessName: v })}
              placeholder="ABC Plumbing & Heating"
            />
          </FormField>

          <FormField label="Your Name" required>
            <StyledInput
              value={step1.contactName}
              onChange={(v) => update({ contactName: v })}
              placeholder="John Smith"
            />
          </FormField>

          <FormField label="Email Address" required>
            <StyledInput
              type="email"
              value={step1.email}
              onChange={(v) => update({ email: v })}
              placeholder="john@abcplumbing.com"
            />
          </FormField>

          <FormField label="Phone Number">
            <StyledInput
              type="tel"
              value={step1.phone}
              onChange={(v) => update({ phone: v })}
              placeholder="(555) 123-4567"
            />
          </FormField>
        </div>

        <div className="border-t border-border pt-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {isHS ? "About Your Trade Business" : "About Your Real Estate Business"}
          </h3>

          {isHS ? (
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="Industry / Trade" required>
                <StyledSelect
                  value={step1.industry || ""}
                  onChange={(v) => update({ industry: v })}
                  options={HS_INDUSTRIES}
                />
              </FormField>

              <FormField label="Number of Employees (including techs)">
                <StyledSelect
                  value={step1.employeeCount || ""}
                  onChange={(v) => update({ employeeCount: v })}
                  options={HS_EMPLOYEE_COUNTS}
                />
              </FormField>

              <FormField label="Annual Revenue">
                <StyledSelect
                  value={step1.annualRevenue || ""}
                  onChange={(v) => update({ annualRevenue: v })}
                  options={HS_REVENUES}
                />
              </FormField>

              <FormField label="Years in Business">
                <StyledSelect
                  value={step1.yearsInBusiness || ""}
                  onChange={(v) => update({ yearsInBusiness: v })}
                  options={HS_YEARS}
                />
              </FormField>

              <FormField label="Service Area" hint="How broad is your coverage?">
                <StyledSelect
                  value={step1.serviceArea || ""}
                  onChange={(v) => update({ serviceArea: v })}
                  options={HS_SERVICE_AREAS}
                />
              </FormField>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="Your Role" required>
                <StyledSelect
                  value={step1.role || ""}
                  onChange={(v) => update({ role: v })}
                  options={RE_ROLES}
                />
              </FormField>

              <FormField label="Team Size">
                <StyledSelect
                  value={step1.teamSize || ""}
                  onChange={(v) => update({ teamSize: v })}
                  options={RE_TEAM_SIZES}
                />
              </FormField>

              <FormField label="Annual Transaction Volume">
                <StyledSelect
                  value={step1.transactionVolume || ""}
                  onChange={(v) => update({ transactionVolume: v })}
                  options={RE_VOLUMES}
                />
              </FormField>

              <FormField label="Annual GCI (Gross Commission Income)">
                <StyledSelect
                  value={step1.annualGCI || ""}
                  onChange={(v) => update({ annualGCI: v })}
                  options={RE_GCI}
                />
              </FormField>

              <FormField label="Years in Business">
                <StyledSelect
                  value={step1.yearsInBusiness || ""}
                  onChange={(v) => update({ yearsInBusiness: v })}
                  options={HS_YEARS}
                />
              </FormField>

              <FormField label="Primary Market Type">
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

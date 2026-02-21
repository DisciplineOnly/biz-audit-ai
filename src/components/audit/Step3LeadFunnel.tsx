import {
  FormField, StepHeader, StyledSelect, MultiCheckbox, StepProps, toOptions
} from "./AuditFormComponents";

const HS_LEAD_SOURCES = toOptions([
  "Google Search/SEO", "Google Ads (PPC)", "Google Local Services Ads",
  "Facebook/Instagram Ads", "Nextdoor", "Yelp", "Angi/HomeAdvisor", "Thumbtack",
  "Word of Mouth/Referrals", "Direct Mail/Door Hangers", "Radio/TV", "Truck Wraps/Yard Signs",
]);

const RE_LEAD_SOURCES = toOptions([
  "Zillow/Realtor.com", "Google Ads (PPC)", "Facebook/Instagram Ads", "Open Houses",
  "Sphere of Influence/Referrals", "Past Client Referrals", "Agent Website/IDX",
  "YouTube/Video", "Door Knocking/Cold Calling", "Expired/FSBO Prospecting",
  "Relocation Companies", "Builder/Developer Partnerships",
]);

const RESPONSE_SPEEDS = [
  "Under 5 minutes", "5–30 minutes", "30–60 minutes", "1–4 hours",
  "Same business day", "Next business day or later",
];

const HS_RESPONSE_SPEEDS = toOptions([...RESPONSE_SPEEDS, "No consistent process"]);
const RE_RESPONSE_SPEEDS = toOptions([...RESPONSE_SPEEDS, "It depends on the agent"]);

const LEAD_TRACKING = toOptions([
  "CRM with pipeline stages", "Spreadsheet/Google Sheets", "Notebook/whiteboard",
  "Software but not consistently", "We don't really track this",
]);

const HS_CONVERSION_RATES = toOptions([
  "Yes — above 50%", "Yes — 30–50%", "Yes — under 30%", "No — we don't track this",
]);

const RE_CONVERSION_RATES = toOptions([
  "Above 10%", "5–10%", "2–5%", "Under 2%", "We don't track this",
]);

const MISSED_CALL = toOptions([
  "Auto text-back within seconds", "Voicemail — we call back ASAP",
  "Voicemail — we call back when we can", "Answering service",
  "We probably miss some and never follow up",
]);

const LEAD_DISTRIBUTION = toOptions([
  "Round robin — automated", "Round robin — manual", "Pond/claim system",
  "Assigned by source or area", "First to grab it", "No formal system",
]);

const TOUCHES_7DAYS = toOptions([
  "8+ touches", "5–7 touches", "2–4 touches", "1 touch", "No consistent follow-up plan",
]);

const REVIEWS_COUNT = toOptions(["0–25", "26–50", "51–100", "101–250", "250+"]);

const REVIEW_AUTOMATION = toOptions([
  "Yes — automated via software", "Yes — manually ask sometimes", "No",
]);

const RE_REVIEW_AUTOMATION = toOptions([
  "Yes — automated", "Yes — manual/sometimes", "No",
]);

export function Step3LeadFunnel({ state, dispatch, isHS }: StepProps) {
  const { step3 } = state;
  const update = (payload: Partial<typeof step3>) => dispatch({ type: "UPDATE_STEP3", payload });

  return (
    <div>
      <StepHeader
        step={3}
        title="Lead Funnel & Marketing"
        subtitle="How you attract, respond to, and convert new leads"
      />

      <div className="space-y-7">
        <FormField
          label="Where do your leads come from?"
          hint="Select all that apply"
          required
        >
          <MultiCheckbox
            options={isHS ? HS_LEAD_SOURCES : RE_LEAD_SOURCES}
            selected={step3.leadSources}
            onChange={(v) => update({ leadSources: v })}
          />
        </FormField>

        <FormField
          label={isHS
            ? "When a new lead calls or submits a form, how quickly do they get a response?"
            : "When a new lead comes in, how fast does an agent respond?"
          }
          required
        >
          <StyledSelect
            value={step3.responseSpeed}
            onChange={(v) => update({ responseSpeed: v })}
            options={isHS ? HS_RESPONSE_SPEEDS : RE_RESPONSE_SPEEDS}
          />
        </FormField>

        {!isHS && (
          <FormField label="How do you distribute leads to agents?">
            <StyledSelect
              value={step3.leadDistribution || ""}
              onChange={(v) => update({ leadDistribution: v })}
              options={LEAD_DISTRIBUTION}
            />
          </FormField>
        )}

        <FormField
          label={isHS
            ? "How do you track leads from first contact to booked job?"
            : "How do you track leads from inquiry to appointment?"
          }
        >
          <StyledSelect
            value={step3.leadTracking}
            onChange={(v) => update({ leadTracking: v })}
            options={LEAD_TRACKING}
          />
        </FormField>

        <FormField
          label={isHS
            ? "Do you know your lead-to-booked-job conversion rate?"
            : "What percentage of your internet leads convert to appointments?"
          }
        >
          <StyledSelect
            value={step3.conversionRate}
            onChange={(v) => update({ conversionRate: v })}
            options={isHS ? HS_CONVERSION_RATES : RE_CONVERSION_RATES}
          />
        </FormField>

        {isHS ? (
          <FormField label="How do you handle missed calls?">
            <StyledSelect
              value={step3.missedCallHandling || ""}
              onChange={(v) => update({ missedCallHandling: v })}
              options={MISSED_CALL}
            />
          </FormField>
        ) : (
          <FormField label="How many touches (calls, texts, emails) does a new lead get in the first 7 days?">
            <StyledSelect
              value={step3.touchesIn7Days || ""}
              onChange={(v) => update({ touchesIn7Days: v })}
              options={TOUCHES_7DAYS}
            />
          </FormField>
        )}

        <FormField
          label={isHS
            ? "Approximately how many Google reviews does your business have?"
            : "Approximately how many Google reviews does your team/brokerage have?"
          }
        >
          <StyledSelect
            value={step3.googleReviews}
            onChange={(v) => update({ googleReviews: v })}
            options={REVIEWS_COUNT}
          />
        </FormField>

        <FormField
          label={isHS
            ? "Do you have an automated process to request reviews after completed jobs?"
            : "Do you have an automated review request process after closing?"
          }
        >
          <StyledSelect
            value={step3.reviewAutomation}
            onChange={(v) => update({ reviewAutomation: v })}
            options={isHS ? REVIEW_AUTOMATION : RE_REVIEW_AUTOMATION}
          />
        </FormField>
      </div>
    </div>
  );
}

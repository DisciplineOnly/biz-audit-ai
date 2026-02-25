import { useTranslation } from 'react-i18next';
import { FormField, StepHeader, StyledSelect, StepProps, SelectOption, toOptions, localizeOptions } from "./AuditFormComponents";
import { useLang } from "@/hooks/useLang";

const HS_REMINDERS = toOptions([
  "Yes — text and email", "Yes — email only", "Yes — text only",
  "No — we call manually", "No reminders sent",
]);
const HS_ONWAY = toOptions(["Yes — automated", "Sometimes manually", "No"]);
const HS_JOB_COMPLETE = toOptions([
  "Digital summary/invoice sent immediately", "We explain verbally",
  "Paper invoice left behind", "No formal communication",
]);
const HS_INTERNAL = toOptions([
  "Field service app/software", "Group text/chat app", "Phone calls", "Mixed/inconsistent",
]);
const HS_AFTERHOURS = toOptions([
  "AI chatbot or auto-responder", "Answering service",
  "Voicemail with next-day callback", "After-hours calls go unanswered",
]);
const HS_PORTAL = toOptions(["Yes", "No but we want one", "No and not a priority"]);

const RE_AGENT_COMMS = toOptions([
  "CRM-based communication (logged)", "Personal phone/text (not logged)",
  "Mix of both", "Varies by agent",
]);
const RE_TRANSACTION_UPDATES = toOptions([
  "Yes — key milestones automated", "Some manual updates",
  "No — agents handle individually",
]);
const RE_PAST_CLIENT = toOptions([
  "Automated long-term drip", "Annual check-ins/market updates",
  "Holiday cards/occasional emails", "We don't maintain contact consistently",
]);
const RE_INTERNAL = toOptions([
  "Team app (Slack, Teams, etc.)", "Group text", "Email", "In-person meetings only",
]);
const RE_AFTERHOURS = toOptions([
  "Auto-responder with info", "AI chatbot", "Agents handle on personal phones",
  "Goes unanswered until next day",
]);
const RE_PORTAL = toOptions(["Yes — through our software", "No but we'd like one", "No and not a priority"]);

const BG_LABELS: Record<string, string> = {
  // HS Reminders
  "Yes — text and email": "Да — SMS и имейл",
  "Yes — email only": "Да — само имейл",
  "Yes — text only": "Да — само SMS",
  "No — we call manually": "Не — обаждаме се ръчно",
  "No reminders sent": "Не изпращаме напомняния",
  // HS On-way
  "Yes — automated": "Да — автоматизирано",
  "Sometimes manually": "Понякога ръчно",
  "No": "Не",
  // HS Job complete
  "Digital summary/invoice sent immediately": "Дигитално резюме/фактура веднага",
  "We explain verbally": "Обясняваме устно",
  "Paper invoice left behind": "Хартиена фактура на място",
  "No formal communication": "Без формална комуникация",
  // HS Internal
  "Field service app/software": "Приложение/софтуер за полеви услуги",
  "Group text/chat app": "Групов чат/приложение за съобщения",
  "Phone calls": "Телефонни обаждания",
  "Mixed/inconsistent": "Смесено/непоследователно",
  // HS After hours
  "AI chatbot or auto-responder": "AI чатбот или автоматичен отговор",
  "Answering service": "Услуга за отговаряне на обаждания",
  "Voicemail with next-day callback": "Гласова поща с обратно обаждане на следващия ден",
  "After-hours calls go unanswered": "Обажданията извън работно време остават без отговор",
  // HS Portal
  "Yes": "Да",
  "No but we want one": "Не, но искаме",
  "No and not a priority": "Не и не е приоритет",
  // RE Agent comms
  "CRM-based communication (logged)": "Комуникация чрез CRM (записана)",
  "Personal phone/text (not logged)": "Личен телефон/SMS (незаписан)",
  "Mix of both": "Комбинация от двете",
  "Varies by agent": "Зависи от агента",
  // RE Transaction updates
  "Yes — key milestones automated": "Да — ключови етапи са автоматизирани",
  "Some manual updates": "Някои ръчни актуализации",
  "No — agents handle individually": "Не — агентите се справят поотделно",
  // RE Past client
  "Automated long-term drip": "Автоматизиран дългосрочен drip",
  "Annual check-ins/market updates": "Годишни проверки/пазарни актуализации",
  "Holiday cards/occasional emails": "Празнични картички/случайни имейли",
  "We don't maintain contact consistently": "Не поддържаме контакт последователно",
  // RE Internal
  "Team app (Slack, Teams, etc.)": "Екипно приложение (Slack, Teams и др.)",
  "Group text": "Групови съобщения",
  "Email": "Имейл",
  "In-person meetings only": "Само лични срещи",
  // RE After hours
  "Auto-responder with info": "Автоматичен отговор с информация",
  "AI chatbot": "AI чатбот",
  "Agents handle on personal phones": "Агентите отговарят на личните си телефони",
  "Goes unanswered until next day": "Остава без отговор до следващия ден",
  // RE Portal
  "Yes — through our software": "Да — чрез нашия софтуер",
  "No but we'd like one": "Не, но бихме искали",
};

export function Step5Communication({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation('steps');
  const { lang } = useLang();
  const { step5 } = state;
  const loc = (opts: SelectOption[]) => lang === 'bg' ? localizeOptions(opts, BG_LABELS) : opts;
  const update = (payload: Partial<typeof step5>) => dispatch({ type: "UPDATE_STEP5", payload });

  return (
    <div>
      <StepHeader
        step={5}
        title={isHS ? t('step5.hs.title') : t('step5.re.title')}
        subtitle={isHS ? t('step5.hs.subtitle') : t('step5.re.subtitle')}
      />

      <div className="space-y-7">
        {isHS ? (
          <>
            <FormField label={t('step5.hs.fields.appointmentReminders.label')}>
              <StyledSelect
                value={step5.appointmentReminders || ""}
                onChange={(v) => update({ appointmentReminders: v })}
                options={loc(HS_REMINDERS)}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.onTheWayNotifications.label')}>
              <StyledSelect
                value={step5.onTheWayNotifications || ""}
                onChange={(v) => update({ onTheWayNotifications: v })}
                options={loc(HS_ONWAY)}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.jobCompletionComms.label')}>
              <StyledSelect
                value={step5.jobCompletionComms || ""}
                onChange={(v) => update({ jobCompletionComms: v })}
                options={loc(HS_JOB_COMPLETE)}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.internalComms.label')}>
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={loc(HS_INTERNAL)}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.afterHoursComms.label')}>
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={loc(HS_AFTERHOURS)}
              />
            </FormField>
            <FormField label={t('step5.hs.fields.clientPortal.label')}>
              <StyledSelect
                value={step5.clientPortal}
                onChange={(v) => update({ clientPortal: v })}
                options={loc(HS_PORTAL)}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t('step5.re.fields.agentClientComms.label')}>
              <StyledSelect
                value={step5.agentClientComms || ""}
                onChange={(v) => update({ agentClientComms: v })}
                options={loc(RE_AGENT_COMMS)}
              />
            </FormField>
            <FormField label={t('step5.re.fields.transactionUpdates.label')}>
              <StyledSelect
                value={step5.transactionUpdates || ""}
                onChange={(v) => update({ transactionUpdates: v })}
                options={loc(RE_TRANSACTION_UPDATES)}
              />
            </FormField>
            <FormField label={t('step5.re.fields.pastClientEngagement.label')}>
              <StyledSelect
                value={step5.pastClientEngagement || ""}
                onChange={(v) => update({ pastClientEngagement: v })}
                options={loc(RE_PAST_CLIENT)}
              />
            </FormField>
            <FormField label={t('step5.re.fields.internalComms.label')}>
              <StyledSelect
                value={step5.internalComms}
                onChange={(v) => update({ internalComms: v })}
                options={loc(RE_INTERNAL)}
              />
            </FormField>
            <FormField label={t('step5.re.fields.afterHoursComms.label')}>
              <StyledSelect
                value={step5.afterHoursComms}
                onChange={(v) => update({ afterHoursComms: v })}
                options={loc(RE_AFTERHOURS)}
              />
            </FormField>
            <FormField label={t('step5.re.fields.clientPortal.label')}>
              <StyledSelect
                value={step5.clientPortal}
                onChange={(v) => update({ clientPortal: v })}
                options={loc(RE_PORTAL)}
              />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
}

import { AuditFormState, AuditAction } from "@/types/audit";

interface StepProps {
  state: AuditFormState;
  dispatch: React.Dispatch<AuditAction>;
  isHS: boolean;
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span style={{ color: "hsl(var(--coral))" }} className="ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--coral))] focus:border-transparent transition-all"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function StyledInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--coral))] focus:border-transparent transition-all placeholder:text-muted-foreground"
    />
  );
}

export function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--coral))] focus:border-transparent transition-all placeholder:text-muted-foreground resize-none"
    />
  );
}

export function MultiCheckbox({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  columns?: number;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className={`grid gap-2 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <label
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all text-sm ${
              isSelected
                ? "border-[hsl(var(--coral))] bg-[hsl(var(--coral)_/_0.05)]"
                : "border-border bg-background hover:bg-secondary/50"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "border-[hsl(var(--coral))] bg-[hsl(var(--coral))]"
                  : "border-muted-foreground"
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={isSelected ? "font-medium text-foreground" : "text-foreground"}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

export function RatingButtons({
  value,
  onChange,
  labels = ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"],
}: {
  value: number;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all ${
              value === rating
                ? "border-[hsl(var(--coral))] bg-[hsl(var(--coral))] text-white"
                : "border-border bg-background hover:border-[hsl(var(--coral)_/_0.5)]"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
      {value > 0 && (
        <p className="text-sm text-center font-medium" style={{ color: "hsl(var(--coral))" }}>
          {labels[value - 1]}
        </p>
      )}
    </div>
  );
}

export function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
        Step {step} of 8
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export type { StepProps };

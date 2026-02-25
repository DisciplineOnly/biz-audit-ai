# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `AuditForm.tsx`, `Step1BusinessInfo.tsx`)
- Utilities and helpers: camelCase with `.ts` extension (e.g., `scoring.ts`, `utils.ts`)
- UI components: kebab-case with `.tsx` extension (e.g., `use-toast.ts`, `input-otp.tsx`)
- Type definitions: camelCase with `.ts` extension (e.g., `audit.ts`)

**Functions:**
- React components: PascalCase (e.g., `AuditForm`, `ScoreBar`, `OverallScoreCircle`)
- Utility functions: camelCase (e.g., `computeScores`, `getScoreColor`, `generateMockReport`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleNicheSelect`, `handleStep`)
- Helper functions: camelCase (e.g., `scoreMap`, `calcCategory`, `validateStep`)

**Variables:**
- Constants in module scope: SCREAMING_SNAKE_CASE (e.g., `STORAGE_KEY`, `STEP_LABELS`, `HS_EMPLOYEE_COUNTS`)
- Regular variables: camelCase (e.g., `isHS`, `currentStep`, `formState`)
- State variables: camelCase (e.g., `state`, `dispatch`, `errors`, `savedToast`)

**Types:**
- Interfaces: PascalCase prefixed with capital letter (e.g., `AuditFormState`, `StepProps`, `FieldProps`)
- Type aliases: PascalCase (e.g., `Niche`, `AuditAction`, `CategoryScore`)
- Generic/union types: PascalCase with `|` separators (e.g., `"home_services" | "real_estate"`)
- Discriminated unions: `type` property lowercase string literal (e.g., `{ type: "SET_NICHE"; payload: Niche }`)

## Code Style

**Formatting:**
- No automatic formatter detected (no Prettier config found)
- ESLint configured with TypeScript support
- 2-space indentation (inferred from code)
- Semicolons used throughout
- String quotes: double quotes for JSX attributes, double quotes for strings

**Linting:**
- ESLint with TypeScript support (`typescript-eslint`)
- React Hooks plugin enabled (`eslint-plugin-react-hooks`)
- React Refresh plugin enabled (`eslint-plugin-react-refresh`)
- Rule: `react-refresh/only-export-components` set to warn
- Rule: `@typescript-eslint/no-unused-vars` disabled (set to `off`)

**Config location:** `/d/Claude/BizAudit/eslint.config.js`

## Import Organization

**Order:**
1. External React and routing libraries (`react`, `react-dom`, `react-router-dom`)
2. React hooks and standard hooks (`useEffect`, `useState`, `useReducer`, `useRef`, `useNavigate`)
3. Icon libraries (`lucide-react`)
4. Types and interfaces from `@/types/*`
5. Utilities from `@/lib/*`
6. Components from `@/components/*` or `@/pages/*`
7. Hooks from `@/hooks/*`

**Path Aliases:**
- `@/` resolves to `/src/`

**Example from `/d/Claude/BizAudit/src/pages/AuditForm.tsx`:**
```typescript
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Save } from "lucide-react";
import { AuditFormState, auditReducer, initialFormState, Niche } from "@/types/audit";
import { Step1BusinessInfo } from "@/components/audit/Step1BusinessInfo";
// ... more component imports
import { computeScores } from "@/lib/scoring";
```

## Error Handling

**Patterns:**
- No explicit try-catch blocks found in the codebase (minimal error handling)
- Form validation done via dedicated `validateStep()` function in `AuditForm.tsx`
- Safe JSON parsing with fallback: `JSON.parse(savedRaw) ? /* ... */ : null`
- Optional chaining and nullish coalescing used throughout
- State-based error accumulation: `const [errors, setErrors] = useState<string[]>([])`

**Validation example from `/d/Claude/BizAudit/src/pages/AuditForm.tsx`:**
```typescript
function validateStep(step: number, state: AuditFormState): string[] {
  const errors: string[] = [];
  switch (step) {
    case 1:
      if (!state.step1.businessName) errors.push("Business name is required");
      // ... more validation
      break;
  }
  return errors;
}
```

## Logging

**Framework:** `console` (no structured logging library detected)

**Patterns:**
- No logging statements found in production code
- No `console.log`, `console.error`, or `console.warn` calls in analyzed files
- Development/testing uses only localStorage and sessionStorage for state persistence

## Comments

**When to Comment:**
- Inline comments used sparingly
- Block comments used for section headers and state management notes
- Comments explain scoring logic and business rules

**Examples:**
- `// Maps dropdown values to 0-3 scores` - explains mapping approach
- `// ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE` - routing convention note
- `// 0 = No process/major gap, 1 = Manual/inconsistent, 2 = Partial/somewhat, 3 = Fully optimized` - scoring scale documentation

**JSDoc/TSDoc:**
- Not used in this codebase
- Type safety relied upon via TypeScript interfaces instead

## Function Design

**Size:** Functions range from small single-purpose utilities (10 lines) to larger component logic (100+ lines)

**Parameters:**
- Props interfaces defined separately (`StepProps`, `FieldProps`) and passed as single object
- Destructuring used consistently in function signatures
- Type safety via TypeScript: all parameters are explicitly typed

**Example from `/d/Claude/BizAudit/src/components/audit/AuditFormComponents.tsx`:**
```typescript
export function FormField({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      {/* ... */}
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
  // ... implementation
}
```

**Return Values:**
- React components return JSX (implicit return for short components)
- Utility functions return typed values or objects
- No void functions used except for side effects
- Example: `computeScores()` returns `AuditScores` object with full type definition

## Module Design

**Exports:**
- Named exports used consistently: `export function`, `export interface`, `export type`
- Default exports used for page components: `export default function AuditForm()`
- UI components use named exports: `export { NavLink };`

**Example from `/d/Claude/BizAudit/src/types/audit.ts`:**
```typescript
export type Niche = "home_services" | "real_estate";
export interface AuditFormState { /* ... */ }
export const initialFormState: AuditFormState = { /* ... */ };
export type AuditAction = /* ... */;
export function auditReducer(/* ... */) { /* ... */ }
```

**Barrel Files:**
- Minimal use detected
- Single-export files more common
- Component files export a single component or utility set

## React Patterns

**Hooks Usage:**
- `useReducer` for complex state management (audit form state)
- `useState` for simple UI state (errors, toast visibility)
- `useEffect` for side effects (auto-save, localStorage sync)
- `useRef` for DOM references and mutable values (stepRef)
- `useNavigate`, `useSearchParams`, `useLocation` for routing
- Custom hooks defined in `src/hooks/` (e.g., `use-toast.ts`, `use-mobile.tsx`)

**Component Structure:**
- Functional components exclusively
- Props passed as single object with interface definition
- Conditional rendering via ternary operators
- Array mapping for list rendering with key prop

**Example from `/d/Claude/BizAudit/src/pages/Index.tsx`:**
```typescript
const handleNicheSelect = (niche: "home_services" | "real_estate") => {
  // function logic
};

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ... render
}
```

## Styling

**CSS Framework:** Tailwind CSS with shadcn/ui components

**Patterns:**
- Inline `className` strings with Tailwind classes
- CSS variables via `style` prop for theme colors: `style={{ color: "hsl(var(--coral))" }}`
- Utility function `cn()` in `/d/Claude/BizAudit/src/lib/utils.ts` combines clsx and tailwind-merge

**Example:**
```typescript
<div className="w-full h-11 px-3 rounded-xl border border-input bg-background">
  {/* content */}
</div>
```

**Color variables used:**
- `--navy`, `--coral`, `--score-green`, `--score-yellow`, `--score-orange`, `--score-red`
- Border and background tokens: `--border`, `--input`, `--background`, `--foreground`

## Data Flow

**State Management:**
- Reducer pattern for complex form state (`auditReducer` in `/d/Claude/BizAudit/src/types/audit.ts`)
- localStorage for persistence (key: `"ep_audit_state"`)
- sessionStorage for temporary data (partner code)
- React Query integrated but not actively used in analyzed files

**Props Drilling:**
- Dispatch function passed through props via `AuditAction` union
- State passed as single object to components
- Minimal prop drilling due to component structure

---

*Convention analysis: 2026-02-19*

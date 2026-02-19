# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
BizAudit/
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui component library (60+ files)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── select.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (other UI primitives)
│   │   ├── audit/                       # Audit-specific form step components
│   │   │   ├── AuditFormComponents.tsx  # Shared form field wrappers
│   │   │   ├── Step1BusinessInfo.tsx
│   │   │   ├── Step2Technology.tsx
│   │   │   ├── Step3LeadFunnel.tsx
│   │   │   ├── Step4Scheduling.tsx
│   │   │   ├── Step5Communication.tsx
│   │   │   ├── Step6FollowUp.tsx
│   │   │   ├── Step7Operations.tsx
│   │   │   └── Step8Financial.tsx
│   │   └── NavLink.tsx
│   ├── pages/
│   │   ├── Index.tsx                    # Landing page with niche selection
│   │   ├── AuditForm.tsx                # Multi-step form wizard (main page)
│   │   ├── Report.tsx                   # Audit report display
│   │   ├── Loading.tsx                  # Loading/generating state
│   │   └── NotFound.tsx                 # 404 page
│   ├── lib/
│   │   ├── scoring.ts                   # Score computation engine
│   │   └── utils.ts                     # Utility functions (cn helper)
│   ├── hooks/
│   │   ├── use-toast.ts                 # Toast notification hook (shadcn)
│   │   └── use-mobile.tsx               # Mobile breakpoint detection hook
│   ├── types/
│   │   └── audit.ts                     # All TypeScript interfaces and types
│   ├── test/
│   │   ├── setup.ts                     # Vitest setup
│   │   └── example.test.ts              # Example test file
│   ├── App.tsx                          # Root app router
│   ├── main.tsx                         # Application entry point
│   ├── index.css                        # Global styles (Tailwind directives)
│   └── vite-env.d.ts                    # Vite environment types
├── .planning/
│   └── codebase/                        # Codebase documentation (this directory)
├── tailwind.config.ts                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript base config
├── tsconfig.app.json                    # TypeScript app-specific config
├── tsconfig.node.json                   # TypeScript build/node config
├── vite.config.ts                       # Vite build configuration
├── eslint.config.js                     # ESLint configuration
├── package.json                         # Dependencies and scripts
└── package-lock.json                    # Locked dependency versions
```

## Directory Purposes

**src/components/ui/:**
- Purpose: shadcn/ui component library - pre-built, accessible, unstyled primitives
- Contains: 60+ files including Button, Card, Dialog, Form, Select, Input, Textarea, Checkbox, etc.
- Key files: `button.tsx`, `card.tsx`, `form.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`
- Generated from shadcn/ui CLI, customized with project color scheme

**src/components/audit/:**
- Purpose: Audit-specific form components for data collection
- Contains: 9 step component files + shared form components file
- Key files:
  - `AuditFormComponents.tsx` - reusable form wrappers (FormField, StyledInput, MultiCheckbox, RatingButtons)
  - `Step1-8*.tsx` - niche-aware form sections

**src/pages/:**
- Purpose: Page-level components that correspond to routes
- Contains: All top-level page components
- Key files:
  - `Index.tsx` - landing page, niche selection, hero
  - `AuditForm.tsx` - main multi-step wizard (~335 lines, central to app)
  - `Report.tsx` - results display (~375 lines)

**src/lib/:**
- Purpose: Shared business logic and utilities
- Contains: Scoring engine and utility functions
- Key files:
  - `scoring.ts` - 710 lines of score computation, report generation, color/label helpers
  - `utils.ts` - 7 lines, `cn()` function for classname utilities

**src/types/:**
- Purpose: TypeScript type definitions
- Contains: All interfaces and types for audit form data
- Key files:
  - `audit.ts` - 269 lines defining AuditFormState, AuditAction, AuditScores, etc.

**src/hooks/:**
- Purpose: Custom React hooks
- Contains: Reusable hook logic
- Key files:
  - `use-toast.ts` - Toast notification hook (shadcn)
  - `use-mobile.tsx` - Mobile breakpoint detection

**src/test/:**
- Purpose: Test files and setup
- Contains: Vitest configuration and test examples
- Key files:
  - `setup.ts` - Vitest configuration
  - `example.test.ts` - Example test

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React application bootstrap, creates root element
- `src/App.tsx`: Route configuration, global providers (QueryClientProvider, TooltipProvider)
- `src/pages/Index.tsx`: Initial route `/`, niche selection interface

**Configuration:**
- `vite.config.ts`: Vite dev server, React plugin, path aliases
- `tsconfig.json`: TypeScript compiler options, baseUrl, path aliases
- `tailwind.config.ts`: Tailwind CSS colors (navy, coral, score colors), animations
- `eslint.config.js`: ESLint rules for React, TypeScript

**Core Logic:**
- `src/types/audit.ts`: Form state shape, reducer, initial state (269 lines)
- `src/lib/scoring.ts`: Score calculations, report generation (710 lines)
- `src/pages/AuditForm.tsx`: Form wizard state management and flow (335 lines)

**Testing:**
- `src/test/setup.ts`: Vitest configuration
- `src/test/example.test.ts`: Example test file

## Naming Conventions

**Files:**
- Page components: PascalCase + .tsx (`Index.tsx`, `AuditForm.tsx`)
- Component files: PascalCase + .tsx (`Step1BusinessInfo.tsx`, `FormField`)
- Utility/lib files: camelCase + .ts (`scoring.ts`, `utils.ts`)
- Test files: camelCase + .test.ts (`example.test.ts`)
- Type files: camelCase + .ts (`audit.ts`)
- UI components: kebab-case with shadcn convention (`button.tsx`, `form.tsx`)

**Functions:**
- React components: PascalCase (`AuditForm`, `StepHeader`)
- Regular functions: camelCase (`computeScores`, `validateStep`, `getScoreColor`)
- Action creators/handlers: camelCase starting with 'handle' or verb (`handleNext`, `handleSave`)
- Constants: SCREAMING_SNAKE_CASE (`STORAGE_KEY`, `STEP_LABELS`)

**Variables:**
- State: camelCase (`formState`, `errors`, `currentStep`)
- Props objects: descriptive nouns (`stepProps`, `fieldProps`)
- Temporary: descriptive (`isHS` for "is home services")

**Types:**
- Interfaces: PascalCase starting with capital letter (`AuditFormState`, `StepProps`, `FieldProps`)
- Type aliases: PascalCase (`Niche`, `AuditAction`)
- Enums/unions: PascalCase (`CategoryScore`)

## Where to Add New Code

**New Feature (e.g., add a new audit question):**
- Add field to `AuditFormState` in `src/types/audit.ts`
- Add action type to `AuditAction` union type
- Add case to `auditReducer` function
- Update `initialFormState` with default value
- Update relevant Step component (`src/components/audit/Step*.tsx`)
- Update `computeScores` in `src/lib/scoring.ts` to include in scoring logic
- Tests: Create `src/test/[feature].test.ts`

**New Step Component:**
- Create `src/components/audit/Step[N][Name].tsx`
- Import form wrappers from `AuditFormComponents.tsx`
- Accept `StepProps` interface
- Use `dispatch({ type: "UPDATE_STEP[N]", payload: {...} })`
- Add to route-based rendering in `AuditForm.tsx`

**New UI Component:**
- Use shadcn/ui if available in `src/components/ui/`
- If custom needed: Create in `src/components/` (not in `ui/` subdirectory)
- Follow existing naming and styling patterns from shadcn

**Utilities/Helpers:**
- Shared logic: `src/lib/` directory (create new file if >50 lines)
- Small helpers: Add to `src/lib/utils.ts`
- Component-specific helpers: Keep in component file

**Styling:**
- Use Tailwind classes inline in JSX
- Custom colors: Use CSS variables from `tailwind.config.ts` (e.g., `hsl(var(--coral))`)
- Global styles: `src/index.css` (only Tailwind directives)
- Component-specific: Inline Tailwind only, no separate CSS files

**Testing:**
- Unit tests: `src/test/[filename].test.ts`
- Test setup: Already configured in `src/test/setup.ts`
- Run: `npm test` or `npm run test:watch`

## Special Directories

**src/components/ui/:**
- Purpose: shadcn/ui generated components
- Generated: Yes (via `npx shadcn-ui@latest add`)
- Committed: Yes (source files committed, not generated artifacts)
- Note: Do not manually edit - regenerate via shadcn CLI if needed

**src/test/:**
- Purpose: Testing configuration and test files
- Generated: No
- Committed: Yes
- Note: Vitest configuration in `setup.ts`

**.planning/codebase/:**
- Purpose: Codebase documentation for GSD commands
- Generated: No (written by mapper agent)
- Committed: Yes
- Note: Documentation files only, no code

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (from package-lock.json)
- Committed: No (.gitignored)

**dist/:**
- Purpose: Compiled/bundled production build
- Generated: Yes (via `vite build`)
- Committed: No (.gitignored)
- Build command: `npm run build`

## Relative Path Aliases

TypeScript is configured with path alias for clean imports:
- `@/*` → `./src/*`

Example imports:
```typescript
import { AuditFormState } from "@/types/audit";
import { computeScores } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Step1BusinessInfo } from "@/components/audit/Step1BusinessInfo";
```

No relative path imports (e.g., `../../../lib/`) are used in the codebase.

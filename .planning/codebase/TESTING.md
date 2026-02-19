# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `/d/Claude/BizAudit/vitest.config.ts`

**Environment:**
- jsdom for DOM testing
- Globals enabled (no need to import describe, it, expect)

**Assertion Library:**
- Vitest built-in expect (compatible with Jest)
- Testing Library for React component testing (`@testing-library/react` 16.0.0)
- Jest DOM matchers (`@testing-library/jest-dom` 6.6.0)

**Run Commands:**
```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode for development
```

**Config reference:**
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

## Test File Organization

**Location:**
- Collocated with source: Tests live in `src/test/` directory structure
- Test pattern: `src/**/*.{test,spec}.{ts,tsx}`

**Naming:**
- Test files: `example.test.ts` (suffix `.test` or `.spec`)
- Setup files: `setup.ts`

**Structure:**
```
src/
├── test/
│   ├── setup.ts          # Vitest setup file
│   └── example.test.ts   # Test suite example
└── ... (source files)
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
```

**Patterns observed:**
- `describe()` blocks for test suites
- `it()` for individual test cases
- `expect()` for assertions
- No setup/teardown hooks visible in example

**Setup File Example from `/d/Claude/BizAudit/src/test/setup.ts`:**
```typescript
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

This setup:
- Imports Jest DOM matchers
- Provides `window.matchMedia` polyfill for media query testing (used by Radix UI components)

## Mocking

**Framework:** Vitest built-in mocking (Jest-compatible API)

**Patterns:**
- No explicit mocking examples found in current test file
- Setup file shows mock object creation for DOM APIs
- Path aliases (`@`) configured in vitest.config.ts for import resolution in tests

**What to Mock:**
- External dependencies (APIs, libraries)
- Browser APIs not available in jsdom (window.matchMedia already polyfilled in setup.ts)
- localStorage/sessionStorage if needed

**What NOT to Mock:**
- React components under test (test the real component)
- Internal utility functions (unless they have side effects)
- CSS and styling (Vitest doesn't require CSS mocking)

## Fixtures and Factories

**Test Data:**
- No fixtures directory currently present
- Recommend creating `src/test/fixtures/` for shared test data
- Example pattern for form testing:
  ```typescript
  const mockAuditFormState: AuditFormState = {
    niche: "home_services",
    currentStep: 1,
    // ... rest of state
  };
  ```

**Location:**
- Fixtures should live in `src/test/fixtures/` or `src/test/` directory
- Import and reuse across test files

## Coverage

**Requirements:** Not enforced (no coverage configuration detected)

**View Coverage:**
```bash
npm run test -- --coverage
```

Note: Coverage not currently configured but command pattern available through Vitest.

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test pure functions (scoring logic, validation)
- Example: Testing `computeScores()` function with various state inputs
- Location: `src/lib/*.test.ts`

**Integration Tests:**
- Scope: Component + state management + form submission
- Approach: Render components, simulate user interaction, verify state changes
- Example: Testing full audit form flow with multiple steps
- Location: `src/pages/*.test.tsx` or `src/components/*.test.tsx`

**E2E Tests:**
- Framework: Not used
- No end-to-end testing setup detected
- Would require additional tools (Playwright, Cypress, etc.)

## Common Patterns

**Async Testing:**

For async operations in components:
```typescript
import { render, screen, waitFor } from "@testing-library/react";

it("should fetch and display data", async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText(/loaded/)).toBeInTheDocument();
  });
});
```

**Error Testing:**

For error conditions:
```typescript
it("should show error when validation fails", () => {
  const errors = validateStep(1, invalidState);
  expect(errors).toContain("Business name is required");
  expect(errors.length).toBeGreaterThan(0);
});
```

**Component Testing with React Testing Library:**

Pattern for form components:
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("should update state on input change", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Step1BusinessInfo state={initialState} dispatch={mockDispatch} isHS={true} />);

  const input = screen.getByPlaceholderText("ABC Plumbing & Heating");
  await user.type(input, "New Business");

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "UPDATE_STEP1",
    payload: { businessName: "New Business" }
  });
});
```

## Testing Best Practices for This Codebase

**For Reducer Functions:**
Test state transitions via `auditReducer`:
```typescript
it("should set niche on SET_NICHE action", () => {
  const newState = auditReducer(initialFormState, {
    type: "SET_NICHE",
    payload: "home_services"
  });
  expect(newState.niche).toBe("home_services");
});
```

**For Scoring Functions:**
Test scoring logic with various input combinations:
```typescript
it("should calculate correct technology score", () => {
  const scores = computeScores(mockAuditState);
  expect(scores.technology).toBeGreaterThanOrEqual(0);
  expect(scores.technology).toBeLessThanOrEqual(100);
});
```

**For Form Validation:**
Test validateStep with boundary cases:
```typescript
it("should return errors for missing required fields", () => {
  const errors = validateStep(1, { ...initialFormState, step1: {} });
  expect(errors.length).toBeGreaterThan(0);
});

it("should validate email format", () => {
  const errors = validateStep(1, {
    ...initialFormState,
    step1: { ...initialFormState.step1, email: "invalid" }
  });
  expect(errors).toContain("Please enter a valid email address");
});
```

## Current Test Coverage Gap

**Missing test files:**
- No tests for React components (Step1-Step8, pages, etc.)
- No tests for form validation logic
- No tests for scoring calculations
- No tests for localStorage/state persistence

**Priority areas to test:**
1. `validateStep()` function - critical form logic
2. `computeScores()` function - core business logic
3. `AuditForm.tsx` - main user interaction
4. Step components - form field updates
5. State persistence - localStorage sync

---

*Testing analysis: 2026-02-19*

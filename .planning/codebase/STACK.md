# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript 5.8.3 - Frontend application with React components and utilities
- TSX/JSX - React component implementation

**Secondary:**
- JavaScript - Configuration files (postcss.config.js, eslint.config.js)
- CSS - Tailwind CSS styling framework

## Runtime

**Environment:**
- Node.js (version not specified in .nvmrc, but target ES2020 in tsconfig)

**Package Manager:**
- npm (inferred from package.json structure)
- Lockfile: present (package-lock.json expected but not verified)

## Frameworks

**Core:**
- React 18.3.1 - UI library and component framework
- React Router DOM 6.30.1 - Client-side routing with multi-page audit flow
- React Hook Form 7.61.1 - Form state management with validation

**UI Components & Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- shadcn/ui - Component library built on Radix UI (imported via @radix-ui packages)
- Radix UI 1.x - Unstyled, accessible components (multiple @radix-ui packages):
  - @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-tabs, etc.
- Lucide React 0.462.0 - Icon library
- Recharts 2.15.4 - Data visualization (used in Report component for score displays)

**Data & State:**
- TanStack React Query (@tanstack/react-query) 5.83.0 - Server state management (configured in `src/App.tsx`)
- Zod 3.25.76 - TypeScript-first schema validation
- @hookform/resolvers 3.10.0 - Integration layer for React Hook Form with validation schemas

**Utilities:**
- date-fns 3.6.0 - Date manipulation and formatting
- Sonner 1.7.4 - Toast notification library
- class-variance-authority 0.7.1 - Type-safe CSS class variants
- clsx 2.1.1 - Conditional class composition
- tailwind-merge 2.6.0 - Merge Tailwind classes without conflicts
- tailwindcss-animate 1.0.7 - Animation utilities for Tailwind
- next-themes 0.3.0 - Dark mode support
- embla-carousel-react 8.6.0 - Carousel/slider component
- react-resizable-panels 2.1.9 - Resizable layout panels
- input-otp 1.4.2 - OTP input component
- cmdk 1.1.1 - Command palette component
- react-day-picker 8.10.1 - Date picker component
- vaul 0.9.9 - Drawer component

## Build & Development Tools

**Build:**
- Vite 5.4.19 - Build tool and dev server with React SWC plugin
- @vitejs/plugin-react-swc 3.11.0 - SWC compiler for JSX transformation (faster than Babel)
- TailwindCSS 3.4.17 - PostCSS plugin for Tailwind compilation
- PostCSS 8.5.6 - CSS transformation pipeline
- Autoprefixer 10.4.21 - Vendor prefix auto-completion

**Linting & Formatting:**
- ESLint 9.32.0 - JavaScript/TypeScript linting with flat config (eslint.config.js)
- @eslint/js 9.32.0 - ESLint JavaScript rules
- typescript-eslint 8.38.0 - TypeScript support for ESLint
- eslint-plugin-react-hooks 5.2.0 - React hooks rule enforcement
- eslint-plugin-react-refresh 0.4.20 - React Fast Refresh rule enforcement
- Lovable Tagger 1.1.13 - Component tagging utility for development

**Testing:**
- Vitest 3.2.4 - Vite-native unit test framework
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.6.0 - DOM matchers for assertions
- jsdom 20.0.3 - DOM implementation for Node.js environments

**Type Support:**
- @types/react 18.3.23 - React type definitions
- @types/react-dom 18.3.7 - React DOM type definitions
- @types/node 22.16.5 - Node.js type definitions
- globals 15.15.0 - Global variable type definitions

## Key Dependencies

**Critical:**
- React 18.3.1 - Core framework for UI rendering
- React Router DOM 6.30.1 - Multi-step audit form navigation at `/audit`, `/report/:auditId`
- TanStack React Query 5.83.0 - Configured in `src/App.tsx` but primarily for future API integration
- React Hook Form 7.61.1 - Form state management across 8-step audit form (`src/pages/AuditForm.tsx`)

**Infrastructure:**
- Tailwind CSS + Radix UI - Complete design system implementation
- Vite - Development and production build infrastructure
- TypeScript - Type safety across codebase

## Configuration

**Environment:**
- No `.env` files detected - configuration appears to be client-side only
- Partner code passed via URL parameters (`?ref=` or `?partner=`)
- Session/Local storage for audit form state persistence

**Build Configuration:**
- `vite.config.ts` - Vite configuration with React SWC plugin
- `tailwind.config.ts` - Tailwind theme with custom colors (navy, coral, score colors)
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `./src/*`
- `eslint.config.js` - ESLint configuration with React and TypeScript rules
- `vitest.config.ts` - Test environment configuration (jsdom)

## Platform Requirements

**Development:**
- Node.js runtime (version unspecified)
- npm package manager
- Modern browser with ES2020+ support

**Production:**
- Static hosting (Vite builds to `dist/` directory)
- Client-side only execution (no backend required)
- Browser storage (localStorage for form state, sessionStorage for partner codes)

---

*Stack analysis: 2026-02-19*

---
name: frontend-ui-engineering
description: Frontend UI Engineering — React, Next.js, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, CSS Grid, Flexbox, Motion, Playwright. Componentization, responsive implementation, design token integration, performance optimization, accessibility implementation, visual regression testing, cross-browser compatibility.
type: prompt
version: "1.0.0"
categories:
  - frontend
  - engineering
  - implementation
  - testing
---

# Frontend UI Engineering

Responsible for translating design specifications, wireframes, and design system tokens into robust, performant, accessible, and pixel-perfect web applications using React, Next.js, TypeScript, and Tailwind CSS.

## When to Use

Activate this skill when the squad project requires:
- Transforming design specs into functional React/Next.js components
- Integrating Tailwind CSS v4 / CSS custom properties and design tokens
- Building responsive layouts (mobile, tablet, desktop)
- Implementing UI states (hover, focus, active, disabled, loading, empty, error)
- Ensuring accessibility (ARIA attributes, keyboard navigation, focus management)
- Setting up component libraries, design system primitives, and composite components
- Performance optimization (bundle size, code splitting, lazy loading, re-render prevention)
- Executing visual and functional testing with Playwright

## Required Inputs

1. **Design Specifications**: UI specs, wireframes, or reference HTML templates (`template-reference.html`, `visual-identity.md`)
2. **Design Tokens**: Color systems, typography scales, spacing tokens, shadow definitions
3. **Tech Stack**: Next.js App Router, TypeScript, Tailwind CSS v4, Lucide React icons
4. **Target Breakpoints**: Mobile (<768px), Tablet (768-1199px), Desktop (≥1200px)

## Operational Procedure

### Phase 1: Setup & Token Integration
1. Configure Tailwind CSS (`tailwind.config.js` or theme variables in `globals.css`)
2. Import required Google Fonts (e.g., Poppins)
3. Set up base styles, CSS variables, and utility classes
4. Verify build pipeline and ensure zero compilation errors

### Phase 2: Component Implementation
1. Build atomic primitives (Button, Badge, Input, Card, Icon wrapper)
2. Build composite components (HeroSection, FeatureCard, Navigation Header, Footer, Modals)
3. Implement responsive grids and layout structures using CSS Grid & Flexbox
4. Apply interaction states (hover lift, active press, focus rings, disabled styling)

### Phase 3: Page Assembly & Integration
1. Assemble pages following the approved information architecture and visual specs
2. Ensure dynamic routing and SEO metadata in Next.js App Router
3. Connect state handling, forms, and interactive widgets

### Phase 4: Testing & Optimization
1. Run accessibility checks (semantic HTML, contrast, keyboard navigation)
2. Verify responsive scaling across viewports
3. Test build stability (`npm run build`) and fix any TypeScript or lint errors

## Available Operations

- `setup-tailwind` — Configure Tailwind v4 and CSS variables
- `build-component` — Implement an atomic or composite React component
- `assemble-page` — Create Next.js page following design specs
- `optimize-performance` — Audit and optimize bundle and runtime performance
- `validate-build` — Run build, typecheck, and tests

## Outputs

All outputs must be saved to the project directory (`squads/{code}/output/frontend/` or directly in the Next.js project):

1. **Component Source Files** (`src/components/`, `src/app/`)
2. **Build Verification Report** (`build-report.md`)
   - Compilation status
   - TypeScript check results
   - Lighthouse performance summary

## Quality Criteria

- **Pixel-Perfect**: Faithfully matches design specifications and visual identity tokens
- **Type-Safe**: Strict TypeScript with zero `any` types where possible
- **Accessible**: Semantic HTML, proper ARIA attributes, visible focus rings
- **Performant**: Fast initial load, optimized assets, smooth animations (60fps)
- **Responsive**: Flawless layout at all viewports without horizontal overflow

## Validation Rules

- Every interactive element MUST have hover, focus, and active states
- All color classes MUST use CSS custom properties or theme tokens (`bg-surface`, `text-text`, `bg-primary`)
- Never use inline hardcoded hex colors when design tokens exist
- TypeScript compilation (`npm csc` / `next build`) must pass without errors
- Zero broken imports or missing component exports

## Examples

### Example 1: Implementing a Feature Card Component
**Input**: "Implement `FeatureCard.tsx` using Tailwind CSS with hover lift and icon support."
**Output**: Reusable React component with TypeScript interface, icon container, hover transition, and border styling.

## Limitations & Escalation

- **Does not decide**: UX flows or wireframe layouts (delegate to UI/UX Design Expert)
- **Does not define**: Brand color choices or raw design tokens (delegate to Design System Architect)
- **Escalate to**: UX Audit / QA for independent quality verification

## Cross-Agent Review Protocol

- **Design System Architect** reviews: Token adherence and component reusability
- **Accessibility Specialist** reviews: ARIA roles, keyboard nav, focus states
- **UX Audit** reviews: Final implemented UI against design intent

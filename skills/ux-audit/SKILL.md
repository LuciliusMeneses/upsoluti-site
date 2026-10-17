---
name: ux-audit
description: UX Audit & Design Quality Assurance — Visual quality, Design System consistency, Navigation, Usability, Responsiveness, Accessibility, Interaction states, Forms, User feedback, Visual performance, Conversion, Implementation errors. Independent audit skill for validating design and implementation quality.
type: prompt
version: "1.0.0"
categories:
  - quality
  - audit
  - ux
  - accessibility
---

# UX Audit & Design Quality Assurance

Independent auditing skill for evaluating design quality, usability, accessibility, and implementation fidelity. Provides objective, evidence-based assessment with severity ratings and actionable recommendations.

## When to Use

Activate this skill when the squad project requires:
- Independent quality validation of design and implementation
- Pre-launch UX/UI audit
- Post-implementation visual regression testing
- Design system consistency verification
- Accessibility compliance verification (WCAG 2.2 AA)
- Usability heuristic evaluation
- Responsive breakpoint validation
- Conversion funnel analysis
- Third-party design review

## Required Inputs

1. **Audit Target**: Live URL, staging environment, or local dev server
2. **Design Specifications**: Approved wireframes, UI specs, or design system documentation
3. **Success Criteria**: Defined KPIs, conversion goals, accessibility targets
4. **Scope**: Full site audit or specific pages/flows

## Operational Procedure

### Phase 1: Scope Definition & Baseline
1. Define audit scope (pages, user flows, components)
2. Establish evaluation criteria and rubrics
3. Capture baseline screenshots across breakpoints (1440px, 1024px, 768px, 375px)

### Phase 2: Systematic Evaluation

**Visual Quality**
- Color palette adherence (primary #0866FF, secondary #1877F2, navy #0B1F3A, surface #f9f9ff)
- Typography consistency (Poppins font family, weight usage, line heights)
- Spacing rhythm (8px base unit, consistent padding/margins)
- Visual hierarchy clarity (heading vs body vs caption distinction)

**Design System Consistency**
- Component reuse vs. duplication audit
- Token usage verification (CSS variables vs. hardcoded values)
- Variant completeness (all states implemented)
- Border radius, shadow, elevation consistency

**Navigation & Information Architecture**
- Primary/secondary navigation clarity
- Breadcrumb presence and accuracy
- Search accessibility
- Logical content grouping

**Usability Heuristics (Nielsen's 10)**
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

**Responsiveness**
- No horizontal overflow at any breakpoint
- Touch targets ≥44x44px (mobile)
- Readable text at 200% zoom
- Flexible images and media

**Accessibility (WCAG 2.2 AA)**
- Color contrast ratios (4.5:1 normal, 3:1 large text)
- Keyboard navigation completeness
- Focus indicator visibility
- Semantic HTML structure
- ARIA labels/roles where needed
- Screen reader compatibility

**Interaction States**
- Every interactive element: default, hover, focus, active, disabled
- Loading states for async actions
- Empty states for data-driven components
- Error states with clear recovery guidance

**Forms & Feedback**
- Label association
- Inline validation
- Help text clarity
- Submission feedback (success/error)

**Visual Performance**
- Layout shift (CLS) minimization
- Animation smoothness (60fps)
- Image optimization
- Font loading strategy

### Phase 3: Reporting
1. Compile findings with severity: Critical / High / Medium / Low / Advisory
2. Provide screenshots as evidence
3. Reference specific code/design locations
4. Prioritize remediation by impact and effort

## Available Operations

- `full-audit` — Complete UX/UI audit across all dimensions
- `visual-regression` — Compare implementation against design specs
- `accessibility-check` — WCAG 2.2 AA compliance verification
- `usability-heuristic` — Heuristic evaluation
- `responsive-test` — Multi-breakpoint validation
- `conversion-review` — Funnel and CTA effectiveness analysis

## Outputs

All outputs must be saved to `squads/{code}/output/ux-audit/`:

1. **Audit Report** (`audit-report.md`)
   - Executive summary with overall score
   - Findings table (ID, Category, Severity, Description, Evidence, Recommendation)
   - Priority matrix (Impact × Effort)
   - Screenshots appendix

2. **Accessibility Report** (`accessibility-report.md`)
   - Contrast ratio table
   - Keyboard navigation test results
   - Screen reader test results
   - Compliance status per criterion

3. **Visual Regression Report** (`visual-regression.md`)
   - Design vs. implementation comparison
   - Pixel-perfect score per component
   - Missing/incorrect states inventory

## Quality Criteria

- **Evidence-based**: Every finding must include screenshot or code reference
- **Severity-accurate**: Critical = blocks task completion; High = major friction; Medium = inconsistency; Low = polish
- **Actionable**: Recommendations must be specific and implementable
- **Independent**: Auditor must not be the implementer

## Validation Rules

- Audit MUST use automated tools where possible (axe-core, Lighthouse, Playwright)
- Manual testing REQUIRED for keyboard nav, screen readers, cognitive walkthroughs
- No finding without evidence
- Severity must be justified against user impact

## Examples

### Example 1: Pre-Launch Audit
**Input**: "Audit the UPsoluti homepage and service pages before launch."
**Output**: Complete audit report with 23 findings (2 Critical, 5 High, 10 Medium, 6 Low), prioritized remediation plan, and screenshots.

## Limitations & Escalation

- **Does not fix**: Issues identified (delegate to Frontend UI Engineer or UI/UX Designer)
- **Escalate to**: Product Designer for flow decisions, Accessibility Specialist for complex a11y remediation

## Cross-Agent Review Protocol

- **UI/UX Designer** reviews: Usability findings, flow recommendations
- **Design System Architect** reviews: Token violations, component inconsistencies
- **Frontend UI Engineer** reviews: Implementation feasibility of fixes
- **Accessibility Specialist** reviews: WCAG interpretation, assistive technology testing

The UX Audit agent MUST be independent from the implementation team.
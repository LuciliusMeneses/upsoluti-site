---
name: ui-ux-design
description: UI/UX Design Expert — User Experience, Interface Design, Research, Information Architecture, User Flows, Wireframing, Prototyping, Interaction Design, Usability Heuristics, Cognitive Load Optimization, Responsive UX, Accessibility WCAG 2.2 AA, Conversion-Centered Design. Use when squad needs professional UI/UX analysis, design proposals, or usability validation.
type: prompt
version: "1.0.0"
categories:
  - design
  - ux
  - ui
  - research
  - accessibility
---

# UI/UX Design Expert

Professional UI/UX design specialization for creating user-centered, accessible, and conversion-optimized digital experiences.

## When to Use

Activate this skill when the squad pipeline requires:
- User experience analysis and optimization
- User interface design for web applications, SaaS platforms, dashboards, CRM systems
- User research synthesis and persona development
- Information architecture and navigation design
- User flow mapping and optimization
- Wireframing and prototyping guidance
- Interaction design and micro-interactions
- Usability heuristic evaluation (Nielsen's 10 heuristics)
- Cognitive load reduction strategies
- Responsive UX patterns for desktop, tablet, mobile
- Accessibility compliance (WCAG 2.2 AA)
- Conversion-centered design for landing pages and funnels

## Required Inputs

Before executing, ensure you have:
1. **Business context**: Company profile, target audience, value proposition (from `_opensquad/_memory/company.md`)
2. **Project requirements**: Functional requirements, user stories, success metrics
3. **Existing assets**: Current designs, analytics data, user feedback (if available)
4. **Technical constraints**: Platform, framework, browser support, performance budgets
5. **Brand guidelines**: Color palette, typography, tone of voice (from company.md or design system)

## Operational Procedure

### Phase 1: Discovery & Research Analysis
1. Read company context and project requirements
2. Identify target user segments and primary use cases
3. Analyze competitive landscape (if design-research skill available, delegate)
4. Define success metrics and KPIs for UX quality

### Phase 2: Information Architecture & User Flows
1. Create sitemap and content hierarchy
2. Map critical user journeys (primary and secondary flows)
3. Identify decision points, friction areas, and drop-off risks
4. Design navigation structure and information hierarchy
5. Document edge cases and error states

### Phase 3: Wireframing & Layout Design
1. Define layout patterns for each page type (dashboard, detail, form, list, settings)
2. Establish visual hierarchy principles (primary > secondary > tertiary actions)
3. Design responsive breakpoints: desktop (≥1200px), tablet (768-1199px), mobile (<768px)
4. Apply cognitive load optimization: progressive disclosure, chunking, clear affordances
5. Specify component placement and spacing rhythm

### Phase 4: Interface Design & Interaction
1. Define component states: default, hover, focus, active, disabled, loading, error, empty
2. Design micro-interactions: transitions, feedback, loading states
3. Apply accessibility patterns: focus management, ARIA labels, semantic HTML
4. Create conversion-optimized patterns: CTA hierarchy, trust signals, form optimization
5. Document design rationale for key decisions

### Phase 5: Validation & Handoff
1. Run usability heuristic checklist (see checklists/heuristic-evaluation.md)
2. Verify accessibility compliance (WCAG 2.2 AA checklist)
3. Validate responsive behavior across breakpoints
4. Prepare design specifications for frontend implementation
5. Create handoff documentation with annotations

## Available Operations

- `analyze-ux` — Comprehensive UX analysis of existing interface or requirements
- `design-flows` — Create user flows and journey maps
- `wireframe` — Produce wireframe specifications for pages/components
- `design-interface` — Create detailed UI specifications
- `audit-usability` — Heuristic evaluation and usability audit
- `validate-accessibility` — WCAG 2.2 AA compliance check
- `optimize-conversion` — Conversion-centered design recommendations
- `create-handoff` — Generate implementation-ready design specs

## Outputs

All outputs must be saved to the squad's output directory (`squads/{code}/output/ui-ux-design/`):

1. **UX Analysis Report** (`ux-analysis-report.md`)
   - Executive summary
   - User personas and scenarios
   - Pain points and opportunities
   - Recommendations with priority

2. **Information Architecture** (`information-architecture.md`)
   - Sitemap
   - Navigation structure
   - Content hierarchy

3. **User Flows** (`user-flows.md`)
   - Primary flows (Mermaid diagrams or structured text)
   - Edge cases and error flows
   - Decision points and branching logic

4. **Wireframes** (`wireframes/`)
   - Page-level wireframe specifications
   - Component layout annotations
   - Responsive behavior notes

5. **UI Specifications** (`ui-specifications.md`)
   - Component designs with states
   - Interaction patterns
   - Visual design tokens reference
   - Accessibility annotations

6. **Usability Audit Report** (`usability-audit.md`)
   - Heuristic evaluation results
   - Severity ratings (Critical/High/Medium/Low)
   - Evidence and recommendations

7. **Accessibility Report** (`accessibility-report.md`)
   - WCAG 2.2 AA compliance status
   - Contrast ratios
   - Keyboard navigation validation
   - Screen reader compatibility

7. **Design Handoff Package** (`handoff/`)
   - Annotated designs for developers
   - Component specifications
   - Responsive behavior specs
   - Asset inventory

## Quality Criteria

- **User-centered**: All decisions traceable to user needs and business goals
- **Accessible**: WCAG 2.2 AA compliant by default
- **Consistent**: Follows design system tokens and patterns
- **Responsive**: Works across all target breakpoints
- **Performant**: Considers loading states, progressive enhancement
- **Documented**: Clear rationale for design decisions
- **Testable**: Success criteria defined for each flow
- **Scalable**: Patterns reusable across the product

## Validation Rules

- Every interactive element must have: default, hover, focus, active, disabled states
- Every form field must have: label, help text (if needed), error state, required indicator
- Every page must have: loading state, empty state, error state
- Color contrast must meet 4.5:1 (normal text) / 3:1 (large text) minimum
- Focus indicators must be visible and consistent
- Touch targets minimum 44x44px (mobile)
- No horizontal scrolling at any breakpoint
- All content readable at 200% zoom

## Examples

### Example 1: SaaS Dashboard UX Analysis
**Input**: "Analyze the UX of our CRM dashboard — users report difficulty finding key metrics and completing common tasks."
**Output**: UX analysis report with heuristic violations, redesigned user flows, wireframe proposals for dashboard reorganization, priority matrix for fixes.

### Example 2: Landing Page Conversion Optimization
**Input**: "Design a high-converting landing page for our AI automation service targeting SMBs."
**Output**: Wireframes, user flow, CTA strategy, trust signal placement, form optimization, A/B test hypotheses.

### Example 3: Mobile App Onboarding Flow
**Input**: "Create onboarding flow for mobile app — reduce drop-off from 60% to <30%."
**Output**: Step-by-step flow, screen designs, micro-interactions, progressive disclosure pattern, success metrics.

## Limitations & Escalation

- **Does not produce**: Final production code, pixel-perfect visual designs (delegate to premium-web-design or frontend-ui-engineering)
- **Does not replace**: User research with real users (uses existing data, heuristics, best practices)
- **Escalate to**: Premium Web Design Specialist for art direction, Design System Architect for token/component decisions, Frontend UI Engineer for implementation feasibility, UX Audit for independent validation

## Cross-Agent Review Protocol

- **Product Designer** reviews: Business alignment, flow completeness, prioritization
- **Design System Specialist** reviews: Token usage, component consistency, scalability
- **Frontend UI Engineer** reviews: Implementation feasibility, performance implications
- **Accessibility Specialist** reviews: WCAG compliance, semantic structure
- **UX Audit** reviews: Final quality gate before handoff

The implementing agent (Frontend UI Engineer) must NOT be the sole approver of the final interface.
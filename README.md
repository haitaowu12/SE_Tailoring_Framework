---
title: SE_Tailoring_Framework
date_converted: '2026-03-04'
domain: projects
tags: []
---

# SE Tailoring Framework App

Interactive decision aid for right-sizing systems engineering rigor against ISO/IEC/IEEE 15288:2023 process thinking.

## Current Scope

- Executable assessment: 16 project metrics mapped to 22 project-facing Technical and Technical Management processes.
- Reference scope: 8 Agreement and Organizational Project-Enabling processes remain visible in the data model, but are not yet fully executable recommendations.
- Traceability model: each process declares ISO/IEC/IEEE 15288:2023 process-group metadata and explicit executable-core vs reference scope. This is decision-support traceability, not a standalone ISO compliance or certification claim.
- Evidence maturity: reviewed and exercised through illustrative cases, automated unit/static checks, and manual browser smoke checks. Not yet empirically validated against a statistically meaningful set of completed projects.

## Run Locally

```bash
npm install
npm run dev
```

For a production bundle:

```bash
npm run build
npm run preview
```

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

Current verified gates:

- `npm test`: includes algorithm, import/export, inheritance, process-catalog schema, and static security/accessibility guardrails.
- `npm run test:e2e`: builds the production bundle and runs a browser import/report/matrix smoke for legacy JSON hydration and manual-adjustment preservation.
- GitHub Actions CI and Pages deploy gates run `npm ci`, install Playwright Chromium dependencies, then execute unit/static tests, e2e smoke, production dependency audit, and build before deployment.
- `npm run build`: production Vite bundle passes.
- Manual browser smoke: Dashboard/app shell, Vee Model, Process Explorer, Matrix, Deliverables, and Report guard render without console errors; Vee process nodes and table fallback support navigation into Process Explorer; checked routes have no inline click handlers or `javascript:` pseudo-links.
- Manual mobile viewport smoke (390px): Dashboard, Assessment, Vee Model, Deliverables, and Report guard render without framework overlays or page-level horizontal overflow; mobile route selector is visible; Vee table fallback opens Project Planning in Process Explorer.

Built by [Tony Wu](https://haitaowu12.github.io/tony-wu-home/) - systems engineering tools, assurance workflows, and learning simulations.

# Improvement plan: assessment-to-decision workflow

This plan separates implemented repairs from proposed product work and owner-level policy decisions. It reflects practitioner-workflow, decision-governance, rule-defensibility and testing/release perspectives. Automated test counts demonstrate encoded contracts, not practitioner usefulness or professional validation.

## Implemented in the draft repair

See the [issue, repair and test ledger](ASSESSMENT-WORKFLOW-AUDIT-2026-10-09.md) for exact evidence and CI follow-through.

- Restore independent named assessments, switching, duplication and non-destructive legacy migration.
- Keep calculated recommendations, applied choices, persistent rationale drafts and decision history distinct across editing, reports and recovery files.
- Preserve original Rule 11 provenance through later decisions; prevent repeated completeness checks from replacing a higher applied choice.
- Make saving failures and recovery limits explicit; retain incomplete private drafts without granting approval.
- Enforce current and inherited protected floors, hard constraints and context isolation; repair hierarchy-disposition snapshot binding.
- Correct scoped Matrix attribution, PDF export, direct-consequence labels and process-guidance recommendation/choice labels.
- Preserve protected scores through the full ancestry, respecting valid allocation boundaries and rejecting malformed ancestry or unresolved allocations at completeness checks.

These repairs keep the existing numerical policy and canonical process-metric registry. Browser-local records remain editable assertions; they are not authenticated approvals.

## P0 acceptance gate: finish the confirmed defects

Before accepting the draft, require exact-head unit/build/dependency and browser results, plus checks of:

1. Baseline versus applied choice in every affected view, including process guidance.
2. Root → child → grandchild protection with no cached results, changed ancestors, valid boundary exceptions and malformed/cyclic ancestry. Active and inactive unresolved elements must block completeness.
3. Two-assessment isolation through switching, duplication, back navigation, refresh, private export/import and quota/conflicting-tab failures.
4. Rationale and original provenance through unchanged saves, later changes, recalculation and recovery. “Satisfy” must reflect canonical current levels, never an imported claim alone.

A passing automated suite is necessary, not sufficient. Candidate manual visual, screen-reader and contrast checks remain separate from browser automation. Full Chromium coverage and selected Firefox/WebKit paths should not be described as every workflow in every browser.

## P1 proposed: make return and review dependable

Take these through a bounded design review before implementation:

- A context-bound return/review queue: show the assessment, element, recommendation revision, saved choice, unresolved check and exact return destination together.
- Explicit selected-process saving versus batch retention. Avoid treating an unnoticed “save all” as evidence that every recommendation was reviewed. Make the scope of each save visible and test partial completion.
- Lightweight revision identities and stale/current/suspended statuses. Keep each reason attached to the inputs and recommendation it addressed; show what changed and what needs renewed judgment.
- Separate event timestamps from future review scheduling. Preserve legacy `reviewDate` exactly; introduce a clearly defined new `nextReviewOn` only after agreeing semantics. Do not retrospectively label old records expired.

Risks: added review burden, false precision from revision labels, and implying approval through a green status. Acceptance should test comprehension and recovery, not merely fewer clicks.

## P2 proposed: portable records and a policy register

- A concise, boundary-aware decision brief: assessment/element scope, recommendation and current choice, reasons, unresolved matters, owners and next review obligations.
- Portable recovery with explicit lineage for copies, imports and revisions. Keep reduced sharing distinct from a full private backup; do not silently truncate history.
- A versioned policy register covering each threshold, floor and dependency: owner, rationale, evidence maturity, known exceptions, change history and calibration status.

Keep this browser-local and lightweight unless a demonstrated collaboration requirement justifies a backend. A static app cannot establish authenticated organizational approval.

## Four practitioner acceptance tasks

Use synthetic, representative cases and compare the deployed and candidate flows:

1. Create two project options, switch repeatedly and duplicate one. Confirm which project/element is open and prove no scores or reasons leak between them.
2. Review a recommendation, change two process choices, record reasons, inspect guidance and return. Explain which level is calculated, applied, being compared and still awaiting review.
3. Reopen after an interruption, change a consequential input and resolve the review queue. Recover the earlier reason, recognize a suspended choice and avoid treating it as currently applied.
4. Export a private backup and a reduced sharing copy, restore into a clean session, and explain what each preserves or omits. Repeat with a simulated storage failure and verify an honest unsaved warning.

Observe task completion, wrong-context edits, lost or misunderstood rationale, recovery success and explanation quality. Do not use test counts or demo completion as adoption, effectiveness or compliance evidence.

## Owner decisions and evidence still needed

The [independent 17-rule review](INDEPENDENT-RULE-REVIEW-2026-10-09.md) identifies policy questions rather than authorizing new rules:

- Explain consequence asymmetries across safety, environmental, mission and security ratings, including when low Risk Management can be defensible at high consequence.
- Calibrate support thresholds and PSI budgets using independently assessed cases. Distinct metrics do not establish independent evidence; current empirical validity is not proven.
- Define lifecycle phase, external responsibility, reassessment triggers and the meaning of time-bounded deferral dates.

Next review step: inspect the bounded P0 draft and run the four practitioner tasks, then agree the smallest P1 design. Any merge, deployment, new policy threshold or broader feature build remains a separate decision.

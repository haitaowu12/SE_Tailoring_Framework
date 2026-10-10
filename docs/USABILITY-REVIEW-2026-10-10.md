# Report and guidance usability review

Review baseline: `25b6af5a76f9f11cf2142b21dddd825593ae6a85`.
Scope: synthetic browser walkthrough of every main and reference destination, source-to-policy consistency review, and bounded usability repairs. Framework semantics remain 4.2.0. This review does not establish professional content validity, ISO compliance, external approval, or suitability for consequential use.

## Findings and disposition

| Surface | Observed finding | Candidate response |
| --- | --- | --- |
| Workspace / Library | Library explanation and management forms preceded the assessment action. | Put Start/Resume and current progress first; put detailed storage guidance behind a labeled disclosure. Independent assessments, restore, rename, import and backup behavior retained. |
| Assessment | Leaving recommendation review for a metric retained the review route/title. | Route back to the selected assessment step; support first-unanswered-area resume. Preserve immediate draft saving and explicit ratings. |
| Decisions | Draft saving and baseline/local-choice/history separation were usable in the walkthrough. | Retain the interaction and record model; run existing persistence, repeated-save, protected-floor and recovery tests. |
| Guidance | Static-only metric tags omitted conditional M15 mappings. Some dependencies showed base WN rather than effective HC; generic/array references were omitted. | Reuse Matrix's context presentation; show applicable conditional roles, effective rule type, complete reference coverage and conditions on possible minimums. |
| Guidance examples | Planning language could imply mandatory document formats or automatic Comprehensive from distribution/uncertainty alone. | Use outcome-focused examples and optional formats; distinguish professional-review prompts from executable rules. Collapse generic team-plan instructions. |
| Report, incomplete | Continue Assessment opened empty Results instead of the next incomplete input. | Resume the first incomplete rating area, or review if all ratings are confirmed. |
| Report, complete | Repeated summary/title layers, empty technical counters and expanded rating/metadata tables preceded the process plan. | Show one compact profile summary and process plan first. Five initial rows with explicit access to all 22; local choices/higher-rigor work ordered first. Collapse supporting records and remove redundant overview/distribution/floor-elevation blocks. |
| Report meaning | High M16 was called “high pressure”; optional Comprehensive justification appeared mandatory; floor provenance was labeled “Source Standard.” | Explain stronger M16 conditions, optional elevation, and policy-basis references without attributing numerical thresholds to standards. |
| Report and HTML | Sparse legacy anchors left ratings 2/4 blank and did not consistently reproduce selected descriptions. Boundary/purpose were absent. | Share the same five-anchor text helper across Assessment, Report and HTML; retain escaped boundary and purpose. |
| Right-sizing form | Unsubmitted rationale silently disappeared after visiting Help and returning to the proposal. | Preserve bounded per-element drafts separately from asserted decisions; retain them in private backup and omit them from minimum-data exports. Require review when proposal context changes; expose local-save failure. |
| Report exports | HTML privacy caveat was only in a tooltip. | Show the free-text/evidence warning next to export controls; preserve minimum-data/private-backup distinction. |
| Help | Long advanced prose; “Unknown” label differed from the UI; nonexistent peer-review form; unclear self-service, phase and completion bounds. | Quick start stays visible; advanced topics and FAQs use keyboard-accessible disclosures with stable deep links. Correct terminology and prototype/privacy/approval limitations. |
| Matrix | Desktop inspection was compact and read-only, with role/context distinctions. | Retain layout and behavior; run conditional-context and export tests. |
| Dependencies | Direct Preview controls lacked associated names; explanation was overly technical. | Add visible associated labels and a clear direct-only preview boundary. Retain rule behavior. |
| System Elements | Add-element controls lacked clear names; raw status and unexplained lock symbol. | Add labels, human-readable status and an accurate explanation of manual-score propagation behavior. Retain hierarchy protections. |
| Reference Deliverables | Level filter lacked an associated label; multiple sections expanded by default made the view long. | Associate filter label and collapse examples by default, preserving deliberate expansion and guidance links. |
| Vee Model | Process links and accessible table fallback worked. Small node labels can crowd on desktop. | Preserve tested behavior. Defer diagram re-layout as a separately scoped visual change. Filtering the long Decisions table is also deferred; its persistence and saved history are retained. |

## Verification

- Local unit/static tests, production build, dependency audit and whitespace checks are run against the candidate.
- Native browser launch is unavailable in this execution environment; the separate cloud browser cannot reach its localhost preview. No local browser pass is claimed.
- GitHub CI runs the full Chromium suite and critical paths in Firefox/WebKit. Added coverage checks resume/route coherence, compact report expansion, printable nested detail, selected-anchor parity, Help deep links/keyboard/history/mobile layout, and reference-control names.
- CI captures screenshots from synthetic fixtures only for visual review; no user's saved assessment is published.
- Existing assessment library, import/privacy, interrupted edits, decision history, ancestry floors, local scenario and completeness tests remain required.

Release is a separate decision. This candidate is prepared as a draft pull request; this review does not authorize merge or deployment.

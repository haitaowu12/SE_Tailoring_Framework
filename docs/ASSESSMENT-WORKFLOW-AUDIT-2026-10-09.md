# Assessment and decision workflow audit

Scope: deployed companion app `SE_Tailoring_Framework` main `604a17cf23f3a017f632e6ac18e6916122684fba`, not the distinct research repository or frozen research candidate. Changes are a review candidate, not deployed.

## Confirmed problems and corrections

| Finding | Consequence | Candidate correction |
|---|---|---|
| One autosave slot; Start Fresh deletes it; import replaces current work | Multiple independent assessments require manual file management and risk loss | Named local library, independent create/switch/duplicate, isolated imports, non-destructive Start Fresh, retained legacy source |
| Workspace foregrounds the marketing introduction | Returning users must find their current work below introductory content | Library/current work first, framework explanation collapsed on returning work |
| Adjustment route exists but navigation hides it | Recommendations look like the end of the workflow | Visible Decisions navigation, recommendation-review entry, report entry and WIP access |
| Another level change rerenders and discards typed rationale | A user can lose the reasoning while editing another process | Per-element persistent drafts updated as the user types |
| Saved edited levels become the displayed Derived comparison | Original recommendation and user decision become indistinguishable | Separate recommendation snapshots, current choices, rationale and dated local history |
| Reset/re-save can erase or duplicate evidence | Review trail is unreliable | Reset stages a new decision; history remains; repeated identical saves are idempotent |
| Minimum-data JSON intentionally removes manual adjustments/evidence | Users mistake a sharing export for a complete backup | Explicit privacy-confirmed full per-assessment backup; reduced sharing export remains clearly distinct |
| 16/16 report guard labels reviewed work as preview without naming next step | Users do not know how to reach the record | Guard names Review → Check Software Completeness and links to saved decisions |
| Old adjustments can remain applied after safety inputs change | Manual values can bypass a new protected recommendation | Revalidate against current and inherited floors/rules; stale or invalid choices are retained as review drafts, never silently applied |
| Recalculation and import resolve different element contexts | Child display can inherit root levels or lose local choices | Active-element context hydration and decision-aware recalculation/round-trip coverage |

## Additional integrity findings found during regression review

| Finding | Correction | Regression evidence |
|---|---|---|
| Blank/unfinished CSI records serialize empty date/type values that the importer rejected | Permit structurally valid incomplete draft values; completion remains strict | Real createBlankAssessment and CSI draft round-trip tests |
| Incomplete asserted reduction drafts cannot restore through a full backup | Private recovery schema retains incomplete assertions; authority evaluation remains strict and unverified | Long-CSI/incomplete-reduction private recovery test |
| Long local histories exceed reduced-sharing limits | Separate bounded 20 MiB / 20,000-entry private recovery envelope; same export/import preflight | 1,001-entry retained history roundtrip; over-limit export refuses without truncation |
| Import accepts malformed new snapshot/history shapes | Validate history members, levels and active-floor member schemas; defensive renderer/reference handling | Null-history, missing-level, nonarray-floor and null-floor tests |
| Storage failure can still produce a “saved” confirmation | Return persistence outcome and distinguish in-tab work from durable local storage | Quota/stale-tab unit tests; browser failure test |
| Right-sizing record recalculation drops prior user choices | Reconcile and reapply valid decisions; quarantine stale choices with original rationale retained | Unchanged-recalculation and new-safety-floor tests |
| Approval-snapshot code hashes nonexistent hierarchy field names | Bind actual securityHierarchyDisposition and assuranceHierarchyDisposition | Separate security and assurance hash-invalidation tests |
| Software completeness ignores HC errors because only warning dispositions are checked | Explicit and recomputed hard constraints and mandatory floors fail closed, including inactive hierarchy nodes | New logic-integrity regressions and independent four-counterexample probes |
| V&V chain explanation implies equal levels not required by explicit rules; threshold reference omits Secondary drivers | Correct explanatory text and reference-only labels; executable thresholds unchanged | Canonical statement/Secondary reference parity test |
| Matrix omits conditional M15 drivers and labels effective relationships “Not mapped” | Add explicit active/inactive/unavailable scoped overlay and matching CSV/PDF explanation; canonical 102-cell registry unchanged | Eight conditional-context/export parity tests and real-event DOM check |
| Sole M5/M7 score-5 exception is mislabeled “corroborated” | Distinct direct-consequence status across engine attribution, UI, import and report export; levels unchanged | Sole M7/P30 and M5/P18 round-trip tests, supported-multiple-input control |
| Matrix PDF calls an unregistered ESM autoTable instance method | Use jspdf-autotable’s explicit autoTable(doc, options) API | Generated two-page PDF and extracted matrix/conditional explanation text |
| Locked DOMPurify version now has a production advisory | Patch-only lockfile update 3.4.15 → 3.4.16 | Clean install and npm audit --omit=dev: zero vulnerabilities |

## Boundaries preserved

- No metric, mapping, scoring threshold, mandatory floor, or closure rule changed. Two implementation defects in enforcement/snapshot identity were corrected so the existing policy cannot be bypassed.
- Decision history is browser-local, editable and unverified. It does not establish organizational approval, adoption, effectiveness or compliance.
- No server, account, telemetry or shared persistence was added.
- No migration deletes older browser data. Explicit End Session erasure has a whole-library confirmation.
- JSON bounds remain enforced. A file that cannot pass the app's import validation is not described as a successful backup; no history is silently truncated.

## Verification

New unit coverage includes library migration/isolation, quota and stale-tab errors, idempotent decision saves, rationale/history preservation, floor and inherited-safety protection, stale-decision quarantine, actual blank/CSI-draft backups, import schema checks and oversized-backup preflight.

New browser tests cover independent assessment switching/duplication/import, immediate refresh, decision edits across another process change, navigation/back, repeated saves, reset/history and private-vs-reduced exports. Existing baseline tests remain in the suite.

The current candidate passes 296 unit/static checks, production build, a deterministic 128-profile check that hard/floor-correct engine outputs remain eligible at that gate, and production dependency audit (zero vulnerabilities). A separate 1,024-profile comparison against the frozen deployed engine confirms unchanged derived/final/normative levels, floors, violations, right-sizing proposals and indices. Real-event DOM integration against the production bundle passed create/rename/switch/duplicate/restore, rationale retention, idempotent save, navigation and draft reload with no uncaught runtime errors. DOM integration is not layout, browser or native-download verification. Standalone Playwright browser launch in that container is blocked by a Unix socket restriction; candidate cross-browser results must be read from the PR's exact-head CI run. Original deployed browser findings were independently reproduced. No candidate visual pass is claimed before supported rendered checks finish.

## Independent logic review and remaining governance questions

[Independent rule review](INDEPENDENT-RULE-REVIEW-2026-10-09.md) records the bounded external source challenge and native reproductions separately. It is not evidence of complete framework validation. All 17 active rules were considered in the source ledger. Quantitative execution claims from the external review were withdrawn; only locally executed tests are reported as test evidence.

Policy questions remain for qualified owners: differing M5/M6/M7/M8 consequence coverage, evidence independence and calibration of support thresholds, PSI budget rationale, phase/scope boundaries, and the meaning of dates in “time-bounded” dispositions. No new floor, reciprocal rule, weight, approval claim or expiry policy has been invented.

## Browser CI follow-through

The first exact-head Chromium run passed 39/42 tests. It exposed two browser-fixture errors (a required empty processLevels map and reopening a collapsed assessed metric), now corrected without weakening assertions. It also caught a real provenance regression: applying the Rule 11 Validation elevation removed its resolved recommendation warning and disposition from the report. The repair retains addressed recommendation warnings and their records, clearly labels them addressed, and still recomputes current hard constraints. A unit regression and the original browser assertion cover this path. Matrix CSV/PDF native downloads are now asserted in the browser suite. Final exact-head CI status is recorded in the PR.

The second exact-head CI run passed all 42 Chromium tests and all 22 Firefox/WebKit critical-path tests, plus unit/build/audit. A further record-integrity challenge then found two edge cases: unchanged generic saves dropped legacy Rule 11 source/owner fields, and `satisfy` stayed blocked for a genuinely addressed general warning. The candidate now retains original adjustment provenance through unchanged saves, later independent edits and private recovery, and verifies satisfied relationships against canonical requirements and actual levels rather than trusting an imported flag. Following that path also exposed repeat-completeness logic that could replace a later Comprehensive P27 choice with the earlier Standard elevation; the action now only applies to a currently needed Basic-to-Standard transition. The expanded existing Rule 11 browser test covers all three follow-on paths. Final exact-head results remain tracked in the PR.

The expanded third Chromium run passed 41/42 tests and reached the new provenance and satisfied-warning assertions successfully. Its sole remaining failure was a newly added test selector for a nonexistent button ID; this was replaced with the existing accessible “Check Software Completeness” selector. This was a test correction, not another application fix.

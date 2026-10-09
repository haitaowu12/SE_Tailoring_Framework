# Independent review of tailoring rules and assessment logic

## Conclusion and scope

The executable rules are coherent as a provisional decision-support policy, but this review does **not** establish completeness, empirical validity, standards conformity, or fitness for operational approval. It found concrete integrity and explanation defects, alongside policy questions that require qualified owners rather than automatic changes to scoring or floors.

The reviewed baseline is [SE_Tailoring_Framework commit 604a17cf23f3a017f632e6ac18e6916122684fba](https://github.com/haitaowu12/SE_Tailoring_Framework/tree/604a17cf23f3a017f632e6ac18e6916122684fba), app **3.6.1**, semantics **4.2.0**. This is the deployed companion app, not the separate research repository or its older 4.1.1 app pin. Later candidate changes require their own tests and exact-head CI.

An independent **ChatGPT 5.5 Pro source critique** received an archive of 84 public tracked files and two review wrappers. Receipt and core hashes were crosschecked. The critique covered all 17 active rules and selected engine, governance, hierarchy and completeness paths. It was supplemented by a separate native source review and executable probes. No private assessment data was used.

Pro's preliminary test-pass and runtime claims were withdrawn after crosschecking. **No Pro test-execution result is relied on here.** The ledger below consolidates the usable source critique with corrections checked against the actual registry; it is not a verbatim endorsement of every preliminary comment.

## Confirmed defects and repair boundaries

Line references in this section refer to the pinned baseline.

| Finding | Reproducible consequence | Repair and verification requirement |
|---|---|---|
| Snapshot uses obsolete hierarchy fields, `right-sizing-governance.js:106–110` | Changing actual `securityHierarchyDisposition` or `assuranceHierarchyDisposition` can leave the approval snapshot unchanged | Hash the canonical records; changes to their status or rationale must invalidate the snapshot |
| Missing explicit hard-constraint completeness gate, `assessment-integrity.js:130–178`; `rule-dispositions.js:25–29` | Confirmed all-1 metrics plus Comprehensive P19, Basic P25 and a Rule 2 HC error can still pass software checks; an inactive child has the same gap | Block explicit and recomputed hard violations and active floors; test inactive nodes and absent cached violations |
| Direct-consequence exception mislabeled as corroboration, `assessment-engine.js:197–201, 935–940` | All-1 metrics except M7=5 produce Comprehensive P30 with `corroborated` attribution, although its only other driver is Secondary M6=1; sole M5=5 at P18 has the same issue | Distinguish direct-consequence attribution from a satisfied support threshold without changing levels |
| V&V chain overstates equal-level matching, `metrics.js:1129–1130` | The explanation implies equal rigor, while Rules 2/3 permit Comprehensive Requirements with Standard V&V | Describe evidence adequacy and the explicit applicable minimums; avoid an unsupported equality rule |
| Reference threshold omits Secondary Standard triggers, `metrics.js:589–595` | Reference text disagrees with derivation when a Secondary driver reaches 3 | Generate reference text from all applicable drivers and the canonical Comprehensive policy; this export was not used by the baseline UI |
| Matrix omits conditional direct-driver explanation, `matrix-view.js:14, 57–64`; `metrics.js:566–573` | M15=3 with a confirmed P13-scoped obligation derives Standard P13, although its canonical M15 cell is blank; no M15 override floor applies below 4 | Explain or display scoped conditional drivers in UI and exports while retaining the canonical 102 unconditional cells |

The first two defects were reproduced independently, then four focused probes passed against the repaired local candidate. Other repair status and release gates belong in the [workflow audit](ASSESSMENT-WORKFLOW-AUDIT-2026-10-09.md). This review does not certify later changes merely because they address a finding.

## Individual rule ledger

Source: [consistency rules and propagation mappings at the reviewed pin](https://github.com/haitaowu12/SE_Tailoring_Framework/blob/604a17cf23f3a017f632e6ac18e6916122684fba/src/data/metrics.js#L1029-L1105). C = Comprehensive; S = Standard. HC = hard constraint; WN = warning. “Retain” means retain provisionally while testing the stated applicability question, not professionally validated. Process rigor is not a claim that every activity is already complete in the current phase.

| Rule | Trigger and minimum | Type and mapping | Source-review conclusion and question |
|---|---|---|---|
| 1 | P18 Stakeholder Needs C → P19 Requirements S | HC; P1 | Retain. Define how a supplier or parent requirements baseline satisfies the assessed boundary's needs |
| 2 | P19 Requirements C → P25 Verification S | HC; P2 | Retain. Clarify planned verification rigor versus execution timing in concept studies |
| 3 | P19 Requirements C → P27 Validation S | HC; P3 | Retain. Define stakeholder-intent evidence and allocated responsibility; validation need is not limited to external acceptance |
| 4 | P19 Requirements C → P13 Configuration Management S | HC; P4 | Retain. Demonstrate proportionate baseline/change control for short-lived prototypes rather than treating temporary work as an automatic exemption |
| 6 | P20 Architecture C → P21 Design S | HC; P6 | Retain. Explain how architecture-only studies record later or externally allocated design responsibility |
| 7 | P20 Architecture C → P24 Integration S | WN; P7 | Retain as advisory. Elaborate architecture alone does not establish the same integration burden in every boundary |
| 8b | Any technical C → P9 Planning C | WN; P8b | Investigate breadth. One specialist Comprehensive activity may coexist with proportionate Standard project planning |
| 9 | P25 Verification or P27 Validation C → P19 Requirements S | HC; P9/P10 | Retain. Recognize controlled supplier/parent requirements without implying they must be authored locally |
| 10 | P24 Integration C → P25 Verification S | HC; P11 | Retain. Distinguish planned verification rigor from evidence maturity and sequence of execution |
| 11 | P25 Verification C → P27 Validation S | WN; P12 | Retain as advisory. Strong verification alone does not prove a mandatory increase in validation scope |
| 12 | Any technical ≥ S → P9 Planning S | HC; P13 | Retain. Clarify acceptable parent/shared planning evidence; raise planning rather than lower technical work |
| 14 | P12 Risk C → P11 Decision Management S | WN; P15 | Retain. Identify evidence that enterprise decision governance adequately receives project risk outputs |
| 15 | P28 Operation C → P29 Maintenance S | WN; P16 | Retain. Record operator/maintainer responsibilities and externally supplied maintenance evidence |
| 16 | Any technical C → P15 Measurement S | WN, conditional HC; P17 | Retain provisionally. Validate when structured measurement is essential, including critical-context coverage and environmental consequences |
| 17 | Any technical C → P16 Quality Assurance S | WN, conditional HC; P18 | Retain provisionally. Validate assurance burden and boundary allocation; do not equate a score with independent approval |
| 18 | P23 Implementation C → P24 Integration S | HC; P19 | Retain as a framework minimum. Clarify integration planning and responsibility for separately delivered components |
| 19 | P26 Transition C → P28 Operation S | WN; P20 | Retain. A handover to an external operator still needs explicit receiving responsibilities and evidence |

For Rules 16/17, HC severity requires M5, M6 or M8 ≥4, or M15 ≥4 with a confirmed source-backed obligation scoped to the rule's required process. The **separate technical-Comprehensive trigger must also hold**. See `assessment-engine.js:48–80`. The 18 direct mappings correspond to these 17 rules because Rule 9 has two source mappings. One-hop preview is distinct from mandatory fixed-point closure.

## Concrete policy challenges

These outputs were **executed natively against the pinned baseline**, not established by Pro execution. Each profile sets all 16 metrics to 1, then changes the named metric to 5.

| Profile | Comprehensive processes | Remaining warning IDs | Consequence for policy review |
|---|---|---|---|
| M5 only | 12, 16, 18, 19, 20, 21, 22, 24, 25, 27, 28, 29 | 8b, 14 | Broad direct derivation; six named life-safety Comprehensive floors remain protected |
| M7 only | 28, 29, 30 | 8b, 16, 17 | Risk Management remains Basic; environmental override minimums are Standard, distinct from Comprehensive derivation |
| M6 only | None | None | Standard mission floors apply; Rules 16/17 lack their technical-Comprehensive trigger |
| M8 only | None | None | Standard security floors apply; Rules 16/17 lack their technical-Comprehensive trigger |

**Consequence asymmetry needs explicit justification.** Determine whether Basic Risk Management is ever acceptable for maximum environmental consequence, and when catastrophic mission/security outcomes require stronger protection. These examples reveal policy tensions, not permission to invent new automatic floors.

**Supporting thresholds need calibration.** Primary 5 + Primary 3 yields Comprehensive; Primary 5 + Secondary 4 yields Standard; Primary 5 + Secondary 5 yields Comprehensive. Distinct metric identifiers do not demonstrate independent evidence. Correlated M6/M8 pathways require particular attention. Assess rating reliability, borderline cases, false escalation and under-tailoring using independently assessed cases.

**PSI remains nonbinding.** Small PSI can propose reductions in high-consequence profiles, but cannot override mandatory floors. For M5=5, lowering P25 below Comprehensive must be blocked, not merely approved after additional review. The 3/8/22 Comprehensive budgets and priority ordering still need a defensible calibration basis.

**Dates and lifecycle boundaries remain open decisions.** Warning deferral is described as time-bounded, while its `reviewDate` is format-checked without a defined expiry contract. Separate a past review record from a future review/expiry obligation before enforcing time-based invalidation. Define phase changes, external responsibility and reassessment triggers explicitly; phase labels alone do not prove phase-specific logic.

## Verification and coverage

- Native baseline execution: 70 focused tests in `comprehensive-support-policy.test.mjs` and `full-policy-audit.test.mjs` passed. This includes the existing 10,000 synthetic four-driver combinations and 2,000 deterministic closure profiles, not an exhaustive real-project validation.
- Four additional native probes exposed the two integrity defects and subsequently passed on the repaired local candidate. Main regression coverage is in `logic-integrity-regressions.test.mjs`; `pro-review-regressions.test.mjs` adds inactive-child coverage with explicit and missing cached violations plus a positive control.
- Pro substantive source coverage: registry, core derivation/closure and the 17-rule ledger; selected snapshot, hierarchy and completeness paths. Import/export and completeness were initially scanned, with selected findings subsequently examined. Archive inventory is not substantive review of all 84 files.
- Not established by this review: complete UI/state-path coverage, full migration/export execution, cross-browser candidate behavior, every possible hierarchy/approval interaction, independent professional assessment, project trials or operational acceptance. Required aggregate tests and CI must run against the eventual exact candidate commit.

## Evidence boundary and next decisions

[ISO/IEC/IEEE 15288:2023's official scope](https://www.iso.org/standard/81702.html) supports iterative, concurrent and recursive lifecycle process use; it does not establish this app's numeric thresholds. The [NASA SE Handbook tailoring discussion](https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/) and [NPR 7123.1C](https://nodis3.gsfc.nasa.gov/displayAll.cfm?Internal_ID=N_PR_7123_001C_&page_name=all) support context-dependent tailoring, risk rationale and approval in NASA's domain. [NIST SP 800-160 Volume 1 Revision 1](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final) supplies systems-security engineering context, not validation of this scoring scheme. These primary-source checks were separate from the Pro critique.

Repair and regression-test the demonstrated implementation and explanation defects. Keep unresolved policy decisions visible, preserve current rule semantics pending an explicit decision, and obtain structured domain review of thresholds, consequence protection and boundary cases before making stronger deployment or validation claims.

# Visual and content delivery review — 11 November 2026

## Scope and baseline

Reviewed the active application at `418e015f64fa66ef78473fbe25e5fd9fa7eec0b5` and its deployed assessment/dependency interfaces. The uppercase `SE_Tailoring_Framework` repository is the application named by the model repository; the older lowercase repository was not used as the implementation target.

Applied the current frontend product-design, interaction, visual-explanation and motion guidance from the Second Brain integration at `c0dea84f1c3dd8135d6f6c50bc894299d09371c5`. The existing dark teal identity, assessment workflow and engineering engine were retained.

## Finding and implementation

The direct-dependency preview returned detached result cards. It did not connect the proposed source process to its affected processes or display the engine's rule IDs and rationale. Its fallback also displayed Basic as though it were a recorded level when a process had not been assessed.

The preview now shows the proposed source beside connected consequence rows. Each row identifies its process, rule, mandatory/recommended status, current and proposed level, and rule rationale. Process names link to guidance for the proposed target level. A three-position ordinal rail explains the categorical levels without implying numerical scale. Unknown current levels read **Unassessed**, with the engine's Basic assumption disclosed. An empty selection produces an actionable prompt. A zero-effect result retains the distinction between direct preview and full dependency closure.

The layout stacks below 700 px. The result entrance uses a 200 ms transition only when reduced motion is not requested. The exact level change is also text, and the result region announces updates. Preview remains read-only: it neither applies the proposal nor changes engine behavior or assessment data.

## Verification and release status

- Full Node suite: **384 tests passed**.
- Vite production build with `--base=./`: passed.
- New tests exercise actual engine consequences, rule/severity/link retention, immutable assessment state, unknown current levels and the zero-effect boundary. Existing reference-control checks continue to cover repeated read-only previews.
- Independent source review found no high or medium defect in this slice.
- Diff whitespace check: passed.

Chrome rendered the Direct Preview at desktop and 390 px. A Comprehensive System Requirements Definition proposal showed seven rule effects across six processes, including Unassessed → Standard, rule IDs and level-specific guidance links. The Basic proposal displayed the zero-effect explanation. Keyboard submission and focus worked, and the updated result was in a polite live region. The assessment-state invariant is covered by the existing preview tests. Screen-reader speech and the operating-system reduced-motion override remain unverified.

Prepared as a review branch. No merge, deployment or GitHub Actions run is part of this delivery. Commits use `[skip ci]` under the existing Actions pause.

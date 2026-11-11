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

The deployed baseline was inspected in the cloud browser. The changed interface could not be rendered: local Chromium failed to create its process-singleton socket (`Operation not permitted`), and the cloud browser could not reach the isolated local preview. Desktop/narrow layout, keyboard focus and announcement behavior therefore remain an explicit browser acceptance gate. Automated checks are not a substitute for that gate.

Prepared as a review branch. No merge, deployment or GitHub Actions run is part of this delivery. Commits use `[skip ci]` under the existing Actions pause.

## Browser acceptance before integration

1. Open Dependencies → Direct Preview; choose a process with multiple effects. Check source-to-consequence reading order and rule/guidance links.
2. Repeat with an incomplete assessment and a proposal with no direct effects. Check Unassessed and full-assessment guidance.
3. Verify 390 px and desktop layouts, keyboard operation, a screen-reader result announcement, and reduced-motion rendering.
4. Return to assessment and confirm no answer or computed level was changed by previewing.

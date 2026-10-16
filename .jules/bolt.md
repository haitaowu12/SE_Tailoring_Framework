## 2024-05-18 - Debounce synchronous auto-saves in inputs

**Learning:** I found that the `flushAutosave` mechanism triggered synchronously on every state change, and complex form interactions in `assessment.js`, `process-review.js`, and `report.js` triggered `commitAssessmentDraft` on every keystroke, leading to blocking the main thread during fast typing. The code had a comment mentioning a "five-second debounce", but it was not actually implemented for individual inputs.

**Action:** Created `src/utils/debounce.js` and applied it to text inputs and textareas that trigger heavy synchronous evaluations (like `refreshGeneralWarningRecord`, `refreshCsiResponse`, `refreshRule11Record`, `saveDraft`). Used a 500ms debounce.

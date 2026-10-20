## 2024-10-13 - Route-level code splitting
**Learning:** Initial application load time was delayed by loading all view components upfront. Using dynamic imports (`await import(...)`) for route rendering enables Vite to perform code splitting, generating much smaller initial JavaScript bundle and loading components only when needed.
**Action:** Use dynamic imports for lazy loading views/routes in front-end single-page applications.

## 2024-11-20 - Replace JSON.parse(JSON.stringify) with structuredClone
**Learning:** The codebase heavily relied on `JSON.parse(JSON.stringify(...))` for deep copying objects, which is a known performance bottleneck in JS. We found out via a simple script that `structuredClone` is 3 times faster.
**Action:** Replaced instances of `JSON.parse(JSON.stringify(...))` with `structuredClone(...)` across the codebase.

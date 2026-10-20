## 2024-10-13 - Route-level code splitting
**Learning:** Initial application load time was delayed by loading all view components upfront. Using dynamic imports (`await import(...)`) for route rendering enables Vite to perform code splitting, generating much smaller initial JavaScript bundle and loading components only when needed.
**Action:** Use dynamic imports for lazy loading views/routes in front-end single-page applications.

## 2026-10-18 - Replace deep cloning with structuredClone
**Learning:** The codebase heavily relied on `JSON.parse(JSON.stringify(...))` to deep clone state trees and element contexts, which becomes a bottleneck on frequent updates in complex structures. Replacing this pattern with the native `structuredClone` API offers significant performance improvements and is fully supported in modern environments.
**Action:** Use native `structuredClone` for deep cloning instead of the JSON serialize/deserialize workaround where possible.

## 2026-10-20 - structuredClone vs JSON.parse(JSON.stringify) Performance
**Learning:** In V8 and SpiderMonkey (Chromium/Firefox), `JSON.parse(JSON.stringify(...))` is heavily optimized and can be significantly faster (1.5x-2x) than `structuredClone` for deep cloning plain data objects, especially for objects primarily composed of primitives and plain arrays/objects. The performance advantage of `structuredClone` usually only appears for very large structures, structures containing specialized types (Map, Set, Date, RegExp, Blob), or when circular references are present.
**Action:** Do not blindly replace `JSON.parse(JSON.stringify)` with `structuredClone` assuming it's universally faster. Measure the specific objects being cloned in the target environment first.

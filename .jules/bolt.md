## 2024-10-13 - Route-level code splitting
**Learning:** Initial application load time was delayed by loading all view components upfront. Using dynamic imports (`await import(...)`) for route rendering enables Vite to perform code splitting, generating much smaller initial JavaScript bundle and loading components only when needed.
**Action:** Use dynamic imports for lazy loading views/routes in front-end single-page applications.

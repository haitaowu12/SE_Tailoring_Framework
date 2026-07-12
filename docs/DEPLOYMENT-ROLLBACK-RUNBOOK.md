# Deployment and Rollback Runbook

This runbook governs the repository-controlled static deployment. It does not authorize pilot sessions or production decision use.

## Preconditions

1. Confirm the intended app release, framework semantic version, metric-definition set, and exchange schema.
2. Confirm the root framework parity and release checks passed for the same commits.
3. In this app repository run:

   ```bash
   npm ci
   npm test
   npm run test:e2e
   npm audit --omit=dev
   npm run build
   ```

4. Record the app commit and the parent repository commit that points to it.
5. Confirm all required external use gates separately. Green CI is not pilot authorization.

## Normal GitHub Pages deployment

1. Merge the reviewed commit to `main` under the repository's normal approval policy.
2. The `Deploy to GitHub Pages` workflow checks out that commit, records its full Git SHA as `VITE_BUILD_ID`, reruns the verification gates, and deploys the generated `dist` artifact.
3. After deployment, open **Diagnostics** in the deployed app and compare:
   - app release;
   - framework semantic version;
   - metric-definition set;
   - exchange schema;
   - build identity (must equal the deployed commit SHA, not `local-unattested`).
4. Exercise Dashboard, Assessment, Import, Minimum-data Export, Diagnostics, and End Session on a non-sensitive synthetic record.
5. Record the workflow run URL, Pages URL, commit, verification time, verifier, and outcome in the applicable release evidence record.

## Manual redeployment or rollback

Rollback is a controlled deployment of a previously verified immutable commit. Do not edit generated files on the server.

1. Stop affected pilot or demonstration sessions and state that the service is unavailable.
2. Identify the last known-good app commit and confirm its framework compatibility and test evidence.
3. Run the Pages workflow manually and enter that full commit SHA in the `ref` input.
4. Confirm workflow checks pass. Do not bypass a failed gate to accelerate rollback.
5. Verify **Diagnostics** reports the selected commit SHA and repeat the synthetic smoke checks above.
6. Record the reason, failed release, rollback release, impact, start/end time, approver, and any data-handling actions.
7. Repair through a new reviewed commit. Do not force-push or rewrite the deployed release history.

If no safe prior commit is compatible with current governed records, disable use and preserve the failure state for review instead of deploying an uncertain version.
## Local facilitated profile

For an authorized facilitated session, use a build from an exact verified commit. Run with `npm run preview` or an approved static host, verify Diagnostics before the session, use a dedicated browser profile, and perform the End Session deletion check afterward. A local `local-unattested` build is acceptable only for internal development and synthetic testing, not as an evidence-bearing pilot release.

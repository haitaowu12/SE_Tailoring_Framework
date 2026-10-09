# SE Tailoring App Operating Model

Status: controlled prototype operating contract

App release: 3.6.1

Framework semantics: 4.2.0

Workflow update reviewed: 2026-10-09 (candidate; deployment remains separately controlled)

This contract separates what the repository can support today from organizational decisions that software cannot authorize. It does not authorize a pilot, create a service commitment, or represent the framework as validated.

## Supported operating profiles

| Profile ID | Permitted use | Data and control boundary | Current status |
|---|---|---|---|
| `facilitated-local-pilot` | Facilitator-led formative sessions after the applicable study gates, participant information, and first-session authorization are complete | Known release on a controlled device; non-identifying codes; no sensitive content; browser-local work erased after governed capture; study record retained outside the app under the approved pilot procedure | **Conditionally supportable.** Repository controls are present; D01-D10 and each session authorization remain external gates. |
| `static-self-service-prototype` | Internal review, training, synthetic scenarios, and non-consequential self-guided exploration | Static files; no accounts or server storage; browser-local autosave; minimum-data sharing export plus explicit private per-assessment backup; browser-local decision history; no central support, backup service, tamper-evident audit log, or authority verification | **Supported as a prototype only.** This is the build's declared runtime profile; “self-service” does not authorize consequential use. |
| `future-governed-service` | Persistent organizational assessments, authenticated approvals, multi-user workflow, or consequential self-service recommendations | Would require an approved host, identity and access, governed persistence, audit evidence, monitoring, backup/recovery, incident response, support ownership, and release attestation | **Not implemented or authorized.** |

The static prototype is not a substitute for the facilitated-pilot profile. A public URL does not authorize participant research or consequential decision use.

## Current technical boundary

- The app is a browser-only static application. It has no backend, user accounts, server database, analytics, or telemetry.
- The independent-assessment library uses the browser's `localStorage` under `se-tailoring-workspace-v1`. Migration preserves the older `se-tailoring-autosave` source without modifying it; only explicit End Session erasure removes both keys. Anyone with access to the same browser profile may be able to restore that work.
- The normal UI produces a minimum-data JSON export. It omits direct identifiers, free text, evidence references, asserted identities, approval records, and completed-baseline status.
- Private backup is an explicit, warning-confirmed download of the current assessment, including names, free text, evidence references, drafts, recommendation snapshots and local decision history. The file is sensitive to the same degree as its contents and is not automatically shared. Each assessment must be backed up separately.
- All JSON downloads are validated against import schema and resource limits before they are offered as restorable files. If a long-running record exceeds the explicit private-backup 20 MiB / 20,000-entry collection / total-value bounds (reduced sharing remains 2 MiB), export is blocked with an explanation and no history is removed; keep the page open and resolve the size limit before relying on a backup. Browser-local persistence is bounded by device storage, not a records-management service.
- A minimum-data export is a portability aid, not an authoritative assessment record or backup of the evidence and governance record.
- Local diagnostics contain release/build metadata, storage availability, route, connectivity state, and at most five sanitized runtime issue descriptions. They contain no assessment content and are never transmitted automatically.
- Runtime render failures fail to a recovery view. Storage failures are surfaced to the user because silent loss would make continued work unsafe.

## Data lifecycle

| Stage | Repository-controlled behavior | Required operating action |
|---|---|---|
| Collection | Browser accepts project text, assessment judgments, evidence references, and governance records; autosave is local | Use non-identifying codes. Do not enter personal, confidential, export-controlled, privileged, or operationally sensitive content. |
| Active session | Work remains in the current browser profile | Use a controlled device and browser profile. Do not share the profile. |
| Export | Minimum-data sharing copy omits evidence and completed-baseline status; explicit Private backup retains the current local record without claiming external approval | Review the file before sharing. Capture authoritative study observations in the separately governed study record. |
| Retention | The app defines no retention period and performs no remote retention | The pilot data steward must define the approved record location, access list, retention period, deletion, withdrawal, and dataset-freeze procedure before external data collection. |
| Deletion | **End Session** explicitly removes every assessment in this app's library and the retained legacy autosave, then reloads a blank session; **Start Fresh** preserves older work | Facilitator verifies deletion at session close and follows the external procedure for downloads, backups, and study records. |
| Recovery | No central backup or recovery exists | Do not treat browser state as the sole authoritative record. Stop if local storage is unavailable. |

## Privacy and security boundary

Named local assessments and append-only-in-the-UI decision history improve continuity. Files and browser storage remain editable, so the history is not an authenticated or tamper-evident audit trail. Recalculation keeps old reasons as review drafts when choices are stale or conflict with mandatory floors.

Implemented controls include a restrictive static Content Security Policy, local resources only, import size/shape/tree validation, safe text rendering, CSV formula neutralization, minimum-data export, local-session erasure, focus-aware dialogs, and release diagnostics without telemetry.

These controls do not provide authentication, authorization, encryption beyond the device/browser/host, verified approval identities, tamper-evident records, device management, legal privilege, records-management compliance, or organizational security accreditation. The host and device remain part of the trust boundary.

## Release and deployment control

- App release, framework semantic version, metric-definition set, exchange schema, and build identity are visible under **Diagnostics** and embedded in new exports under `_producer`.
- CI verifies unit/static tests, Playwright flows, production dependency audit, and the production build.
- The Pages deployment workflow records the checked-out commit as `VITE_BUILD_ID` and supports an explicit manual ref for controlled redeployment or rollback.
- Follow [Deployment and Rollback Runbook](docs/DEPLOYMENT-ROLLBACK-RUNBOOK.md). A deployment is not an authorization to run a pilot.

## Incident, support, and backup boundary

Follow [Incident and Support Runbook](docs/INCIDENT-AND-SUPPORT-RUNBOOK.md). There is currently no service desk, uptime commitment, on-call function, centrally managed backup, or authorized incident contact encoded in the repository. Until an owner is named, stop use, preserve only minimum necessary non-sensitive diagnostics, and escalate through the responsible facilitator or repository owner.

## Conditions that require a new architecture decision

Do not extend the static profile by convention. Reopen architecture and governance before introducing any of the following:

- persistent central records or cross-device restoration;
- authenticated assessor or approval roles;
- participant contact information or sensitive evidence;
- multi-user editing, workflow, or organization-wide reporting;
- telemetry, remote logging, or automated notifications;
- an uptime, backup, recovery-time, or support commitment;
- unsupervised consequential recommendations or production authorization.

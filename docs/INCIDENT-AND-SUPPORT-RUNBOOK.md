# Incident and Support Runbook

Status: prototype boundary; named organizational contacts remain external decisions.

## Stop-use triggers

Stop the affected session or deployment when any of the following occurs:

- local save, restore, import, export, or erasure fails;
- assessment content appears in an unintended browser profile, file, screen share, log, or recipient's possession;
- the deployed build identity does not match the approved commit;
- a runtime failure prevents the result from being reviewed or reproduced;
- a participant requests withdrawal or deletion;
- the facilitator cannot determine whether study authorization or data-handling conditions are satisfied;
- framework/app version compatibility is uncertain.

## Immediate response

1. Stop consequential use. Do not keep retrying with real data.
2. Protect the device and any export files from further access or transmission.
3. Open **Diagnostics** and record the release identity and local issue IDs. Download diagnostics only if the approved handling location is known; diagnostics contain no assessment content by design.
4. Do not copy assessment text into issue trackers, email, chat, or diagnostics.
5. For local-storage or erasure uncertainty, retain control of the device and browser profile until the responsible data steward gives instructions.
6. Notify the named facilitator/incident route once established. Before that role is named, escalate to the repository owner and do not resume external use.

## Triage record

Record outside the app, in the approved incident location:

- time detected and detector;
- release/build identity and operating profile;
- affected session code, without participant identity where possible;
- category: availability, integrity, confidentiality/privacy, authorization, or version mismatch;
- what data may have been affected and where it may exist;
- containment action;
- decision owner, participant/ethics notification decision, and rationale;
- recovery or deletion evidence;
- corrective action and authorization to resume.

## Support boundary

The static prototype has no uptime target, on-call support, service desk, remote administration, or guaranteed recovery. Repository maintainers can diagnose reproducible software defects using a synthetic reproduction, release/build identity, browser/version, local issue ID, and steps to reproduce. They must not request real assessment content through an uncontrolled channel.

## Backup and restoration

There is no managed backup. Browser autosave is convenience state, not an authoritative record. Minimum-data exports omit the governance evidence required for a completed baseline. The authorized study or service owner must therefore maintain the authoritative record in a separate approved system and define its own backup, restore test, retention, and deletion controls.

## Closure

Resume only after the accountable owner confirms containment, version identity, data disposition, successful synthetic verification, and authorization. CI success alone does not close a privacy, ethics, or participant-safety incident.

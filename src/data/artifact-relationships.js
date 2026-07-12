/**
 * Output-sufficiency pilot and relationship-study registry.
 *
 * These relationships govern artifact acceptance only. They are deliberately
 * separate from consistency rules and cannot create or elevate process levels.
 */
export const ARTIFACT_ID_PATTERN = /^ART:[A-Z0-9][A-Z0-9-]*:[A-Za-z0-9_-]+:[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const RELATIONSHIP_STUDIES = Object.freeze([
    {
        id: 'requirements-to-architecture',
        label: 'System Requirements Definition → Architecture Definition',
        providerProcessId: 19,
        consumerProcessId: 20,
        classification: 'artifact-prerequisite',
        governance: 'acceptance-gate',
        pilot: true,
        normativeEffect: 'Blocks baseline unless accepted or covered by a complete governed review; never changes a process level.'
    },
    {
        id: 'cm-to-information-management',
        label: 'Configuration Management → Information Management',
        providerProcessId: 13,
        consumerProcessId: 14,
        classification: 'evidence-handoff',
        governance: 'non-normative-study',
        pilot: false,
        normativeEffect: 'Study prompt only; no baseline gate and no process-level floor.'
    }
]);

export const REQUIREMENTS_ARCHITECTURE_PILOT = RELATIONSHIP_STUDIES[0];

export const HANDOFF_EVIDENCE_STATUSES = Object.freeze([
    { id: 'draft', label: 'Draft' },
    { id: 'evidence-ready', label: 'Evidence ready' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'governed-review', label: 'Governed review' }
]);

export function createRequirementsArchitectureHandoff(elementId = 'default') {
    return {
        artifactId: `ART:REQ-ARCH:${elementId}:architecture-input`,
        relationshipId: REQUIREMENTS_ARCHITECTURE_PILOT.id,
        providerElementId: elementId,
        providerProcessId: REQUIREMENTS_ARCHITECTURE_PILOT.providerProcessId,
        consumerElementId: elementId,
        consumerProcessId: REQUIREMENTS_ARCHITECTURE_PILOT.consumerProcessId,
        requiredContent: '',
        acceptanceCriteria: '',
        evidenceStatus: 'draft',
        evidenceRefs: '',
        gaps: '',
        equivalentEvidence: '',
        acceptanceAuthority: '',
        reviewDate: ''
    };
}

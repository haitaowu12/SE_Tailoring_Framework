/**
 * SE Tailoring Model — Vee Model Layout
 * Maps processes to positions on the Vee lifecycle diagram.
 * _VERSION: 3.2.1 | _LAST_UPDATED: 2026-02
 */

// Vee model phases and process mappings
export const VEE_PHASES = [
    { id: 'concept', name: 'Concept & Mission', side: 'left', depth: 0 },
    { id: 'requirements', name: 'Requirements', side: 'left', depth: 1 },
    { id: 'architecture', name: 'Architecture', side: 'left', depth: 2 },
    { id: 'design', name: 'Design', side: 'left', depth: 3 },
    { id: 'implementation', name: 'Implementation', side: 'bottom', depth: 4 },
    { id: 'integration', name: 'Integration', side: 'right', depth: 3 },
    { id: 'verification', name: 'Verification', side: 'right', depth: 2 },
    { id: 'validation', name: 'Validation', side: 'right', depth: 1 },
    { id: 'transition', name: 'Transition & Ops', side: 'right', depth: 0 }
];

// Map processes to Vee phases with position coordinates (as % of SVG viewbox)
export const VEE_PROCESS_MAP = [
    // Left side (descending) — decomposition & definition
    { processId: 17, phase: 'concept', x: 10, y: 12, label: 'Business/Mission Analysis' },
    { processId: 18, phase: 'requirements', x: 14, y: 24, label: 'Stakeholder Needs & Req' },
    { processId: 19, phase: 'requirements', x: 20, y: 32, label: 'System Requirements Definition' },
    { processId: 20, phase: 'architecture', x: 26, y: 42, label: 'Architecture Definition' },
    { processId: 21, phase: 'design', x: 32, y: 52, label: 'Design Definition' },
    { processId: 22, phase: 'design', x: 38, y: 60, label: 'System Analysis' },
    // Bottom — implementation
    { processId: 23, phase: 'implementation', x: 50, y: 72, label: 'Implementation' },
    // Right side (ascending) — integration & verification
    { processId: 24, phase: 'integration', x: 62, y: 60, label: 'Integration' },
    { processId: 25, phase: 'verification', x: 68, y: 52, label: 'Verification' },
    { processId: 27, phase: 'validation', x: 76, y: 32, label: 'Validation' },
    { processId: 26, phase: 'transition', x: 82, y: 24, label: 'Transition' },
    { processId: 28, phase: 'transition', x: 86, y: 14, label: 'Operation' },
    { processId: 29, phase: 'transition', x: 90, y: 8, label: 'Maintenance' },
    { processId: 30, phase: 'transition', x: 92, y: 2, label: 'Disposal' }
];

// Horizontal connections across the Vee (verification/validation traceability)
export const VEE_HORIZONTAL_LINKS = [
    { from: 18, to: 27, label: 'Validates stakeholder needs', style: 'dashed' },
    { from: 19, to: 25, label: 'Verifies requirements', style: 'dashed' },
    { from: 20, to: 25, label: 'Verifies architecture', style: 'dotted' },
    { from: 21, to: 25, label: 'Verifies design', style: 'dotted' }
];

// Management processes positioned as a "spanning" layer above the Vee
export const VEE_MGMT_PROCESSES = [
    { processId: 9, x: 15, y: -8, label: 'Project Planning' },
    { processId: 10, x: 30, y: -8, label: 'Assessment & Control' },
    { processId: 11, x: 45, y: -8, label: 'Decision Mgmt' },
    { processId: 12, x: 60, y: -8, label: 'Risk Mgmt' },
    { processId: 13, x: 15, y: -16, label: 'Config Mgmt' },
    { processId: 14, x: 35, y: -16, label: 'Info Mgmt' },
    { processId: 15, x: 55, y: -16, label: 'Measurement' },
    { processId: 16, x: 75, y: -16, label: 'Quality Assurance' }
];

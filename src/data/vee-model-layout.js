/**
 * SE Tailoring Model — Vee Model Layout
 * Maps processes to positions on the Vee lifecycle diagram.
 * _VERSION: 3.1 | _LAST_UPDATED: 2025-02
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
    { processId: 19, phase: 'requirements', x: 20, y: 32, label: 'System Requirements' },
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

// Culture assessment data (from Symplifies SE)
export const CULTURE_CHARACTERISTICS = [
    { id: 1, name: 'Employee relationships', supportive: 'Support and encourage SE practices', tolerant: 'Encourage individuals to do what they think is best', resistant: 'Discourage SE as too bureaucratic' },
    { id: 2, name: 'Engineer focus', supportive: 'Think broadly across the system', tolerant: 'Decide own focus', resistant: 'Focus narrowly on elements' },
    { id: 3, name: 'Trade-offs', supportive: 'Systematic, documented', tolerant: 'At discretion of individual', resistant: 'Exclude viable options' },
    { id: 4, name: 'Lessons learned', supportive: 'Analyzed and implemented across projects', tolerant: 'Kept by individuals', resistant: 'Rarely captured' },
    { id: 5, name: 'Internal reviews', supportive: 'Routinely performed with checklists', tolerant: 'For significant cost impacts only', resistant: 'Discouraged for faster progress' },
    { id: 6, name: 'Risk management', supportive: 'Systematically assessed and managed', tolerant: 'Individual initiative or informal', resistant: 'Not a focus of attention' },
    { id: 7, name: 'Quality vs schedule', supportive: 'Continuously measured and monitored', tolerant: 'At discretion of individuals', resistant: 'Dictated by schedule/cost' },
    { id: 8, name: 'Configuration control', supportive: 'Systematically done across system', tolerant: 'At discretion of individuals', resistant: 'Assumed to be okay' },
    { id: 9, name: 'Interface management', supportive: 'Identified, owned, tested, managed', tolerant: 'At discretion of individuals', resistant: 'Not a focus of attention' },
    { id: 10, name: 'New technology', supportive: 'Prototyped before production', tolerant: 'At discretion of individuals', resistant: 'Refused or embraced without understanding risks' },
    { id: 11, name: 'Cross-subsystem problems', supportive: 'Cross-functional teams, defined processes', tolerant: 'Addressed by affected individuals', resistant: 'Quickest workaround' },
    { id: 12, name: 'System-level V&V', supportive: 'Performed rigorously and systematically', tolerant: 'As individuals see fit', resistant: 'Limited to HW/SW level or verification only' },
    { id: 13, name: 'Customer expectations', supportive: 'Managed pro-actively', tolerant: 'When individuals take initiative', resistant: 'Taken for granted' },
    { id: 14, name: 'Openness to new methods', supportive: 'Piloted before widespread use', tolerant: 'Used by proactive individuals', resistant: 'Rare, reluctance to change' }
];

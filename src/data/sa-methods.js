/**
 * SE Tailoring Model — Safety Assurance Methods Reference
 * _VERSION: 1.0 | _LAST_UPDATED: 2026-02
 * _SOURCE: 02-PRACTICAL/SA-Integration-Guide.md
 * 
 * Reference data for Safety Assurance (RAMS) analysis methods
 */

export const SA_METHODS = [
    {
        id: 'pha',
        name: 'Preliminary Hazard Analysis',
        acronym: 'PHA',
        category: 'hazard',
        phase: ['concept', 'definition'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Early identification of potential hazards and their causes during concept and definition phases',
        inputs: ['System concept', 'Operational environment', 'Historical hazard data'],
        outputs: ['Preliminary Hazard List', 'Hazard causes', 'Initial risk assessment'],
        standardRef: 'EN 50126-2, MIL-STD-882'
    },
    {
        id: 'hazop',
        name: 'Hazard and Operability Study',
        acronym: 'HAZOP',
        category: 'hazard',
        phase: ['definition', 'development'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Systematic examination of processes and operations to identify potential deviations from design intent',
        inputs: ['Design documents', 'Process flow diagrams', 'Operational procedures'],
        outputs: ['HAZOP worksheets', 'Deviations list', 'Recommendations'],
        standardRef: 'IEC 61882'
    },
    {
        id: 'fta',
        name: 'Fault Tree Analysis',
        acronym: 'FTA',
        category: 'analysis',
        phase: ['definition', 'development', 'verification'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Top-down deductive analysis to identify combinations of failures leading to undesired events',
        inputs: ['System architecture', 'Failure modes', 'Top-level hazards'],
        outputs: ['Fault tree diagrams', 'Minimal cut sets', 'Probability calculations'],
        standardRef: 'IEC 61025'
    },
    {
        id: 'fmea',
        name: 'Failure Modes and Effects Analysis',
        acronym: 'FMEA',
        category: 'analysis',
        phase: ['development', 'implementation'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Bottom-up analysis identifying potential failure modes and their effects on system operation',
        inputs: ['Design documentation', 'Component specifications', 'Functional requirements'],
        outputs: ['FMEA worksheets', 'Risk Priority Numbers (RPN)', 'Critical items list'],
        standardRef: 'IEC 60812'
    },
    {
        id: 'fmeca',
        name: 'Failure Modes, Effects, and Criticality Analysis',
        acronym: 'FMECA',
        category: 'analysis',
        phase: ['development', 'implementation'],
        applicableTiers: ['tier3'],
        description: 'Extended FMEA with criticality classification and quantitative analysis',
        inputs: ['FMEA results', 'Failure rate data', 'Severity classifications'],
        outputs: ['Criticality matrix', 'Critical items list', 'Maintenance recommendations'],
        standardRef: 'MIL-STD-1629A, IEC 60812'
    },
    {
        id: 'rbd',
        name: 'Reliability Block Diagram',
        acronym: 'RBD',
        category: 'reliability',
        phase: ['definition', 'development'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Graphical representation of system reliability showing series and parallel relationships',
        inputs: ['System architecture', 'Component reliability data', 'Failure definitions'],
        outputs: ['RBD models', 'System reliability calculations', 'Weak point identification'],
        standardRef: 'IEC 61078'
    },
    {
        id: 'markov',
        name: 'Markov Analysis',
        acronym: 'Markov',
        category: 'reliability',
        phase: ['development', 'verification'],
        applicableTiers: ['tier3'],
        description: 'Stochastic modeling technique for systems with multiple states and transitions',
        inputs: ['System states', 'Transition rates', 'Repair policies'],
        outputs: ['State transition diagrams', 'Availability calculations', 'MTBF predictions'],
        standardRef: 'IEC 61165'
    },
    {
        id: 'eta',
        name: 'Event Tree Analysis',
        acronym: 'ETA',
        category: 'analysis',
        phase: ['definition', 'development'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Bottom-up inductive analysis examining consequences of initiating events',
        inputs: ['Initiating events', 'Safety barriers', 'Operator responses'],
        outputs: ['Event tree diagrams', 'Outcome probabilities', 'Consequence analysis'],
        standardRef: 'IEC 62502'
    },
    {
        id: 'sil_alloc',
        name: 'Safety Integrity Level Allocation',
        acronym: 'SIL Allocation',
        category: 'safety',
        phase: ['definition', 'development'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Process of allocating safety integrity requirements to safety functions',
        inputs: ['Risk analysis results', 'Safety functions', 'Risk tolerance criteria'],
        outputs: ['SIL targets', 'Safety requirements allocation', 'Architecture constraints'],
        standardRef: 'IEC 61508, EN 50129'
    },
    {
        id: 'fracas',
        name: 'Failure Reporting, Analysis, and Corrective Action System',
        acronym: 'FRACAS',
        category: 'reliability',
        phase: ['operation', 'maintenance'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Closed-loop system for reporting, analyzing, and correcting failures during operation',
        inputs: ['Failure reports', 'Maintenance records', 'Operational data'],
        outputs: ['Failure analysis reports', 'Corrective actions', 'Reliability growth tracking'],
        standardRef: 'MIL-STD-2155'
    },
    {
        id: 'ram_pred',
        name: 'RAM Prediction',
        acronym: 'RAM Prediction',
        category: 'reliability',
        phase: ['definition', 'development'],
        applicableTiers: ['tier2', 'tier3'],
        description: 'Quantitative prediction of reliability, availability, and maintainability metrics',
        inputs: ['Component data', 'Environmental factors', 'Operational profile'],
        outputs: ['MTBF predictions', 'Availability forecasts', 'Maintenance intervals'],
        standardRef: 'MIL-HDBK-217, Telcordia SR-332'
    },
    {
        id: 'safety_case',
        name: 'Safety Case Development',
        acronym: 'Safety Case',
        category: 'safety',
        phase: ['development', 'transition'],
        applicableTiers: ['tier3'],
        description: 'Structured argument demonstrating that system is acceptably safe for a given application',
        inputs: ['Hazard analysis', 'Risk assessment', 'Safety requirements', 'Evidence'],
        outputs: ['Safety Case report', 'Argument structure', 'Evidence traceability'],
        standardRef: 'EN 50129, IEC 61508'
    },
    {
        id: 'isa',
        name: 'Independent Safety Assessment',
        acronym: 'ISA',
        category: 'safety',
        phase: ['verification', 'transition'],
        applicableTiers: ['tier3'],
        description: 'Independent evaluation of safety achievements by qualified assessor',
        inputs: ['Safety Case', 'Design documentation', 'Test evidence', 'Operational procedures'],
        outputs: ['ISA report', 'Conformity statement', 'Recommendations'],
        standardRef: 'EN 50129, IEC 61508'
    }
];

export const SA_METHOD_CATEGORIES = [
    { id: 'hazard', name: 'Hazard Analysis', description: 'Methods for identifying and analyzing hazards' },
    { id: 'analysis', name: 'Failure Analysis', description: 'Methods for analyzing failure modes and effects' },
    { id: 'reliability', name: 'Reliability Analysis', description: 'Methods for predicting and assessing reliability' },
    { id: 'safety', name: 'Safety Assessment', description: 'Methods for safety integrity and assurance' }
];

export const SA_PHASES = [
    { id: 'concept', name: 'Concept', processes: [17], description: 'Business/Mission Analysis phase' },
    { id: 'definition', name: 'Definition', processes: [18, 19, 20], description: 'Requirements and Architecture phase' },
    { id: 'development', name: 'Development', processes: [21, 22, 23, 24], description: 'Design, Implementation, Integration phase' },
    { id: 'verification', name: 'Verification', processes: [25, 27], description: 'Verification and Validation phase' },
    { id: 'transition', name: 'Transition', processes: [26], description: 'Transition to operations phase' },
    { id: 'operation', name: 'Operation', processes: [28], description: 'Operational phase' },
    { id: 'maintenance', name: 'Maintenance', processes: [29], description: 'Maintenance phase' }
];

export const SA_METHODS_BY_PROCESS = {
    9: ['pha'],
    10: ['fracas'],
    11: [],
    12: ['pha', 'fta', 'eta'],
    13: [],
    14: [],
    15: ['ram_pred'],
    16: ['safety_case'],
    17: ['pha'],
    18: ['pha', 'ram_pred'],
    19: ['pha', 'hazop', 'sil_alloc'],
    20: ['fta', 'rbd', 'sil_alloc'],
    21: ['fmea', 'fmeca', 'fta'],
    22: ['fmea', 'fta', 'hazop', 'ram_pred', 'markov'],
    23: ['fmea'],
    24: ['fta', 'fmea'],
    25: ['fta', 'fmea', 'sil_alloc'],
    26: ['safety_case', 'isa'],
    27: ['safety_case', 'isa'],
    28: ['fracas'],
    29: ['fracas', 'ram_pred'],
    30: ['safety_case']
};

export const SA_TIER_METHOD_REQUIREMENTS = {
    tier1: {
        required: [],
        recommended: ['pha'],
        description: 'Basic SA awareness, minimal formal methods required'
    },
    tier2: {
        required: ['pha', 'fmea'],
        recommended: ['fta', 'hazop', 'ram_pred', 'fracas'],
        description: 'Formal SA activities with documented analyses'
    },
    tier3: {
        required: ['pha', 'fmea', 'fta', 'safety_case'],
        recommended: ['fmeca', 'hazop', 'sil_alloc', 'isa', 'markov', 'fracas'],
        description: 'Comprehensive SA program with independent assessment'
    }
};

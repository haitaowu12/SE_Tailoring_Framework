/**
 * SE Tailoring Model — Metrics & Assessment Data
 * _VERSION: 3.1 | _LAST_UPDATED: 2025-02
 * _SOURCE: 02-PRACTICAL/Assessment-Worksheet.md, Process-Metric-Applicability-Matrix.md
 */

export const DIMENSIONS = [
    { id: 'complexity', name: 'System Complexity', color: '#8b5cf6', metrics: ['M1', 'M2', 'M3', 'M4'] },
    { id: 'safety', name: 'Safety & Criticality', color: '#ef4444', metrics: ['M5', 'M6', 'M7', 'M8'] },
    { id: 'constraints', name: 'Project Constraints', color: '#f59e0b', metrics: ['M9', 'M10', 'M11', 'M12'] },
    { id: 'stakeholder', name: 'Stakeholder Context', color: '#22d3ee', metrics: ['M13', 'M14', 'M15', 'M16'] }
];

export const METRICS = [
    {
        id: 'M1', name: 'Architectural Complexity', dimension: 'complexity',
        anchors: { 1: 'Few elements, simple interactions', 3: 'Multiple elements, known patterns', 5: 'Many elements, non-linear interactions' },
        guidedQuestions: [
            { text: "Does the system involve multiple interacting systems-of-systems with emergent, unpredictable behaviors?", yesScore: 5 },
            { text: "Are there numerous customized elements with significant, non-linear interactions?", yesScore: 4 },
            { text: "Is the architecture composed of multiple elements but follows known, proven industry patterns?", yesScore: 3 },
            { text: "Does the system require custom integration of just a few standard components?", yesScore: 2 }
        ]
    },
    {
        id: 'M2', name: 'Interface Complexity', dimension: 'complexity',
        anchors: { 1: 'Simple, well-defined', 3: 'Multiple, need coordination', 5: 'Complex with emergent behaviors' },
        guidedQuestions: [
            { text: "Does the system rely on multiple complex, undefined, or evolving external interfaces across different organizations?", yesScore: 5 },
            { text: "Are there numerous internal and external interfaces that require formal ICDs (Interface Control Documents) and tight coordination?", yesScore: 4 },
            { text: "Does the system have several well-defined interfaces but few external dependencies?", yesScore: 3 },
            { text: "Are there only a few simple interfaces using standard communication protocols?", yesScore: 2 }
        ]
    },
    {
        id: 'M3', name: 'Technology Maturity', dimension: 'complexity',
        anchors: { 1: 'Proven technologies', 3: 'Mix of mature and emerging', 5: 'Novel or unproven' },
        guidedQuestions: [
            { text: "Does the system rely on novel, unproven, or bleeding-edge technologies (TRL 1-4)?", yesScore: 5 },
            { text: "Does the system use emerging technologies that have not been widely adopted in your specific industry (TRL 5-6)?", yesScore: 4 },
            { text: "Is the system a mix of mostly mature technologies and some recent, but proven, innovations (TRL 7-8)?", yesScore: 3 },
            { text: "Are all core technologies fully mature, but being applied in a slightly new configuration?", yesScore: 2 }
        ]
    },
    {
        id: 'M4', name: 'Integration Complexity', dimension: 'complexity',
        anchors: { 1: 'Straightforward', 3: 'Requires systematic planning', 5: 'Cross-domain dependencies' },
        guidedQuestions: [
            { text: "Does the system require complex integration across multiple engineering disciplines, diverse contractors, and legacy systems?", yesScore: 5 },
            { text: "Are there significant integration challenges requiring custom middleware, bridging adapters, or hardware modifications?", yesScore: 4 },
            { text: "Does the integration require systematic planning but utilizes standard APIs and well-documented physical interfaces?", yesScore: 3 },
            { text: "Is the integration straightforward, involving primarily plug-and-play or minor software configurations?", yesScore: 2 }
        ]
    },
    {
        id: 'M5', name: 'Safety Impact', dimension: 'safety',
        anchors: { 1: 'No safety implications', 3: 'Moderate safety concerns', 5: 'Safety-critical, potential harm' },
        guidedQuestions: [
            { text: "Could a system failure directly lead to fatalities, severe injuries, or catastrophic damage (Life Safety / Tier 3)?", yesScore: 5 },
            { text: "Could a failure result in minor injuries, regulatory non-compliance, or significant property damage (Safety Relevant / Tier 2+)?", yesScore: 4 },
            { text: "Does the system manage processes where failure causes standard occupational safety concerns that are easily mitigated?", yesScore: 3 },
            { text: "Are there only indirect or very minor safety implications requiring basic situational awareness?", yesScore: 2 }
        ]
    },
    {
        id: 'M6', name: 'Mission Criticality', dimension: 'safety',
        anchors: { 1: 'Low mission impact', 3: 'Moderate mission impact', 5: 'Mission-critical' },
        guidedQuestions: [
            { text: "Would a system failure result in a complete inability to perform the primary organizational mission (e.g., total system stoppage, massive revenue loss)?", yesScore: 5 },
            { text: "Would a failure severely degrade mission performance, requiring immediate emergency workarounds and significant downtime?", yesScore: 4 },
            { text: "Would a failure cause moderate disruption that can be managed with standard operational backups or redundancies?", yesScore: 3 },
            { text: "Would a failure cause a minor inconvenience with minimal impact on core business or transit functions?", yesScore: 2 }
        ]
    },
    {
        id: 'M7', name: 'Environmental Impact', dimension: 'safety',
        anchors: { 1: 'Minimal concerns', 3: 'Moderate considerations', 5: 'Significant environmental risks' },
        guidedQuestions: [
            { text: "Could the system cause catastrophic, irreversible environmental damage or major public health crises?", yesScore: 5 },
            { text: "Is there potential for significant environmental pollution requiring extensive mitigation, permits, and reporting?", yesScore: 4 },
            { text: "Are there moderate environmental considerations that require standard mitigation limits and routine monitoring?", yesScore: 3 },
            { text: "Does the system have a minor environmental footprint (e.g., standard waste disposal, moderate energy use)?", yesScore: 2 }
        ]
    },
    {
        id: 'M8', name: 'Regulatory Compliance', dimension: 'safety',
        anchors: { 1: 'Minimal requirements', 3: 'Standard compliance', 5: 'Extensive regulatory framework' },
        guidedQuestions: [
            { text: "Is the system subject to an extensive, complex web of strict federal/international regulations requiring rigorous independent certification?", yesScore: 5 },
            { text: "Are there significant, specific regulatory standards that mandate formal auditing, traceability, and compliance reporting?", yesScore: 4 },
            { text: "Does the system need to comply with standard industry codes and municipal regulations?", yesScore: 3 },
            { text: "Are there only basic internal policies or minor local guidelines to follow?", yesScore: 2 }
        ]
    },
    {
        id: 'M9', name: 'Schedule Pressure', dimension: 'constraints',
        anchors: { 1: 'Flexible timeline', 3: 'Moderate constraints', 5: 'Aggressive, immovable deadlines' },
        guidedQuestions: [
            { text: "Are there aggressive, immovable deadlines where a delay causes catastrophic project failure or massive financial penalties?", yesScore: 5 },
            { text: "Is the schedule very tight, requiring frequent concurrent engineering and significant planned overtime?", yesScore: 4 },
            { text: "Are there moderate schedule constraints requiring careful management and critical path tracking?", yesScore: 3 },
            { text: "Is the timeline slightly accelerated but generally comfortable?", yesScore: 2 }
        ]
    },
    {
        id: 'M10', name: 'Budget Constraints', dimension: 'constraints',
        anchors: { 1: 'Adequate budget', 3: 'Careful management needed', 5: 'Tight, limited flexibility' },
        guidedQuestions: [
            { text: "Is the budget extremely tight with absolutely no contingency, where any overrun kills the project?", yesScore: 5 },
            { text: "Are funds highly restricted, requiring constant rigorous cost control and major scope trade-offs?", yesScore: 4 },
            { text: "Is the budget carefully managed with standard management reserves and contingencies in place?", yesScore: 3 },
            { text: "Are funds adequately provisioned with comfortable margins for error?", yesScore: 2 }
        ]
    },
    {
        id: 'M11', name: 'Team Experience', dimension: 'constraints',
        anchors: { 1: 'Highly experienced', 3: 'Mixed experience', 5: 'Limited relevant experience' },
        guidedQuestions: [
            { text: "Is the team completely new to this type of system, domain, and technology, lacking relevant prior experience?", yesScore: 5 },
            { text: "Does the team have significant skill gaps requiring external consultants or extensive ramp-up training?", yesScore: 4 },
            { text: "Is there a mix of experienced seniors and junior members needing standard supervision?", yesScore: 3 },
            { text: "Is the team mostly experienced with this technology, with only one or two minor unfamiliar areas?", yesScore: 2 }
        ]
    },
    {
        id: 'M12', name: 'Geographic Distribution', dimension: 'constraints',
        anchors: { 1: 'Co-located', 3: 'Partially distributed', 5: 'Globally distributed' },
        guidedQuestions: [
            { text: "Is the team globally distributed across multiple incompatible time zones with significant language/cultural barriers?", yesScore: 5 },
            { text: "Are key development, testing, and management teams located in distinctly different geographical regions making coordination difficult?", yesScore: 4 },
            { text: "Is the team partially distributed, perhaps across a few regional offices or a hybrid remote model?", yesScore: 3 },
            { text: "Is the team mostly co-located with only occasional remote contributors?", yesScore: 2 }
        ]
    },
    {
        id: 'M13', name: 'Stakeholder Count', dimension: 'stakeholder',
        anchors: { 1: 'Few, aligned', 3: 'Multiple groups', 5: 'Numerous, diverse communities' },
        guidedQuestions: [
            { text: "Are there numerous, diverse, and heavily conflicting stakeholder communities (e.g., public, government, multiple sub-contractors)?", yesScore: 5 },
            { text: "Are there multiple distinct stakeholder groups with competing interests requiring formal negotiation and arbitration?", yesScore: 4 },
            { text: "Are there several stakeholder groups, but their needs are generally aligned and well-understood?", yesScore: 3 },
            { text: "Is there a small, easily identified group of stakeholders with clear, non-conflicting needs?", yesScore: 2 }
        ]
    },
    {
        id: 'M14', name: 'Requirements Volatility', dimension: 'stakeholder',
        anchors: { 1: 'Stable, understood', 3: 'Moderate change expected', 5: 'High volatility, evolving needs' },
        guidedQuestions: [
            { text: "Are requirements expected to change constantly due to extreme uncertainty, shifting market forces, or political whims?", yesScore: 5 },
            { text: "Is there high volatility with major requirements likely to be discovered or fundamentally altered late in the development cycle?", yesScore: 4 },
            { text: "Are there moderate expected changes requiring a formal change control board?", yesScore: 3 },
            { text: "Are requirements mostly stable with only minor, well-understood refinements anticipated?", yesScore: 2 }
        ]
    },
    {
        id: 'M15', name: 'Political Sensitivity', dimension: 'stakeholder',
        anchors: { 1: 'Low public interest', 3: 'Moderate political factors', 5: 'High-profile, politically sensitive' },
        guidedQuestions: [
            { text: "Is the project highly visible to the general public and media, where failure would cause a massive political scandal?", yesScore: 5 },
            { text: "Does the project attract significant scrutiny from top executives, board members, or industry regulators?", yesScore: 4 },
            { text: "Are there moderate organizational politics and cross-departmental turf issues to navigate?", yesScore: 3 },
            { text: "Is there some minor internal visibility, but generally treated as a standard operational project?", yesScore: 2 }
        ]
    },
    {
        id: 'M16', name: 'Organizational Culture', dimension: 'stakeholder',
        anchors: { 1: 'Resistant (SE = overhead)', 3: 'Tolerant (show value)', 5: 'Supportive (actively invests)' },
        note: 'Primarily shapes adoption strategy; contributes weakly to derived levels.',
        guidedQuestions: [
            { text: "Does the executive team mandate and actively invest heavily in rigorous SE practices across the organization?", yesScore: 5 },
            { text: "Is there formal, documented support for SE, though implementation might sometimes be inconsistent?", yesScore: 4 },
            { text: "Is the organization tolerant of SE, but requires practitioners to constantly prove its value on each project?", yesScore: 3 },
            { text: "Is there active skepticism toward Systems Engineering, generally viewing it mostly as documentation overhead?", yesScore: 2 }
        ]
    }
];

// Process-Metric Applicability Matrix: P = Primary, S = Secondary
// Key: processId -> { metricId: 'P' | 'S' }
export const METRIC_PROCESS_MAP = {
    9: { M1: 'S', M9: 'P', M10: 'P', M12: 'P', M13: 'S' },
    10: { M9: 'P', M10: 'P', M11: 'S', M15: 'S' },
    11: { M1: 'P', M3: 'P', M5: 'S', M6: 'P', M12: 'S', M15: 'S' },
    12: { M1: 'S', M2: 'S', M5: 'P', M6: 'P', M7: 'S', M8: 'P', M9: 'S' },
    13: { M1: 'S', M2: 'P', M4: 'P', M8: 'P', M14: 'S' },
    14: { M1: 'S', M2: 'S', M8: 'P', M12: 'P', M13: 'S' },
    15: { M6: 'S', M9: 'P', M10: 'P', M15: 'S' },
    16: { M3: 'S', M5: 'P', M6: 'P', M8: 'P', M11: 'S' },
    17: { M3: 'S', M6: 'P', M8: 'S', M13: 'P', M15: 'P' },
    18: { M5: 'S', M6: 'S', M13: 'P', M14: 'P', M15: 'P' },
    19: { M1: 'P', M2: 'P', M3: 'S', M5: 'P', M8: 'S', M14: 'S' },
    20: { M1: 'P', M2: 'P', M3: 'P', M4: 'P', M5: 'S', M6: 'S', M11: 'S' },
    21: { M1: 'P', M2: 'P', M3: 'P', M5: 'S', M8: 'S', M11: 'S' },
    22: { M1: 'P', M2: 'S', M3: 'P', M4: 'S', M5: 'S', M6: 'P' },
    23: { M1: 'P', M2: 'S', M4: 'P', M5: 'S', M8: 'S', M9: 'S', M10: 'S', M11: 'P' },
    24: { M1: 'S', M2: 'P', M4: 'P', M5: 'S', M11: 'S', M12: 'P' },
    25: { M1: 'S', M2: 'P', M4: 'P', M5: 'P', M8: 'S' },
    26: { M5: 'S', M6: 'P', M9: 'S', M12: 'P', M13: 'P', M15: 'S', M16: 'S' },
    27: { M5: 'P', M6: 'P', M8: 'S', M13: 'P', M14: 'S', M15: 'S' },
    28: { M5: 'P', M6: 'P', M7: 'P', M11: 'S', M12: 'S', M16: 'S' },
    29: { M4: 'S', M5: 'P', M6: 'P', M7: 'S', M10: 'S', M11: 'S' },
    30: { M5: 'S', M7: 'P', M8: 'P', M15: 'S', M16: 'S' }
};

// Level thresholds per process (from Process Tailoring Tables header rows)
export const LEVEL_THRESHOLDS = {
    9: { standard: 'M9≥3 or M10≥3', comprehensive: 'M9≥4 and M12≥4' },
    10: { standard: 'M9≥3 or M10≥3', comprehensive: 'M9≥4 and M10≥4' },
    11: { standard: 'M1≥3 or M6≥3', comprehensive: 'M1≥4 and M6≥4' },
    12: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 (Safety Override)' },
    13: { standard: 'M2≥3 or M8≥4 (Regulatory)', comprehensive: 'M2≥4 and M4≥4' },
    14: { standard: 'M8≥4 (Regulatory)', comprehensive: 'M8≥4 and M12≥4' },
    15: { standard: 'M9≥3 or M10≥3', comprehensive: 'M9≥4 and M10≥4' },
    16: { standard: 'M5≥4 or M8≥4 (Safety/Reg)', comprehensive: 'M5=5 (Life Safety)' },
    17: { standard: 'M6≥3 or M13≥3', comprehensive: 'M6≥4 and M13≥4' },
    18: { standard: 'M13≥3 or M14≥3', comprehensive: 'M13≥4 and M14≥4' },
    19: { standard: 'M5≥4 (Safety) or M2≥3', comprehensive: 'M5=5 (Life Safety) or M2≥4' },
    20: { standard: 'M1≥3 or M6≥4 (Mission)', comprehensive: 'M1≥4 and M2≥4' },
    21: { standard: 'M1≥3 or M3≥3', comprehensive: 'M1≥4 and M3≥4' },
    22: { standard: 'M1≥3 or M6≥3', comprehensive: 'M1≥4 and M6≥4' },
    23: { standard: 'M3≥3 or M4≥3', comprehensive: 'M3≥4 and M11≥4' },
    24: { standard: 'M2≥3 or M4≥3', comprehensive: 'M2≥4 and M4≥4' },
    25: { standard: 'M5≥3 or M2≥3', comprehensive: 'M5≥4 and M2≥4' },
    26: { standard: 'M6≥3 or M12≥3', comprehensive: 'M6≥4 and M12≥4' },
    27: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 and M6≥4' },
    28: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 and M6≥4' },
    29: { standard: 'M5≥3 or M7≥3', comprehensive: 'M5≥4 and M7≥4' },
    30: { standard: 'M7≥3 or M8≥3', comprehensive: 'M7≥4 and M8≥4' }
};

// Override conditions
export const OVERRIDE_CONDITIONS = [
    { id: 'safety_critical', condition: 'M5 ≥ 4', label: 'Safety-Critical', processes: [19, 25, 27, 16], minLevel: 'standard' },
    { id: 'life_safety', condition: 'M5 = 5', label: 'Life Safety', processes: [19, 25, 27, 16, 12], minLevel: 'comprehensive' },
    { id: 'mission_critical', condition: 'M6 ≥ 4', label: 'Mission-Critical', processes: [20, 12], minLevel: 'standard' },
    { id: 'high_regulatory', condition: 'M8 ≥ 4', label: 'High Regulatory', processes: [13, 14], minLevel: 'standard' },
    { id: 'env_critical', condition: 'M7 = 5', label: 'Environmental Critical', processes: [21, 30, 28], minLevel: 'standard' },
    { id: 'novel_tech', condition: 'M3 ≥ 4', label: 'Novel Technology', processes: [22, 25, 11], minLevel: 'standard' }
];

// Consistency Rules (from §6.5)
export const CONSISTENCY_RULES = [
    {
        id: 1, type: 'HC', trigger: { process: 18, level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' },
        label: 'Stakeholder Needs ≥ Comprehensive → Requirements ≥ Standard', rationale: 'Comprehensive needs analysis generates data requiring structured requirements management.'
    },
    {
        id: 2, type: 'HC', trigger: { process: [25, 27], level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' },
        label: 'V&V ≥ Comprehensive → Requirements ≥ Standard', rationale: 'Comprehensive V&V requires rigorous acceptance criteria and traceability.'
    },
    {
        id: 3, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 13, level: 'standard', op: '>=' },
        label: 'Requirements ≥ Comprehensive → CM ≥ Standard', rationale: 'Comprehensive requirements involve large volumes of volatile data.'
    },
    {
        id: 4, type: 'HC', trigger: { process: 21, level: 'comprehensive', op: '>=' }, required: { process: 20, level: 'standard', op: '>=' },
        label: 'Design ≥ Comprehensive → Architecture ≥ Standard', rationale: 'High-fidelity design must be grounded in structured architecture.'
    },
    {
        id: 5, type: 'WN', trigger: { process: 24, level: 'comprehensive', op: '>=' }, required: { process: 13, level: 'standard', op: '>=' },
        label: 'Integration ≥ Comprehensive → CM ≥ Standard', rationale: 'Complex integration requires strict interface control.'
    },
    {
        id: 6, type: 'WN', trigger: { process: 12, level: 'basic', op: '=' }, required: { process: 11, level: 'standard', op: '<=' },
        label: 'Risk Mgmt = Basic → Decision Mgmt ≤ Standard', rationale: 'Standard Decision Management requires risk quantification as input.'
    },
    {
        id: 7, type: 'HC', trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 9, level: 'standard', op: '>=' },
        label: 'Any Technical ≥ Standard → Project Planning ≥ Standard', rationale: 'Standard technical processes require formal planning inputs.'
    }
];

// Propagation Rules (from §6.6)
export const PROPAGATION_RULES = [
    { source: 18, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 19, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 19, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 19, sourceLevel: 'comprehensive', target: 13, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 19, sourceLevel: 'standard', target: 25, minLevel: 'basic', type: 'recommended', depth: 1 },
    { source: 20, sourceLevel: 'comprehensive', target: 21, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 20, sourceLevel: 'comprehensive', target: 24, minLevel: 'standard', type: 'recommended', depth: 1 },
    { source: 21, sourceLevel: 'comprehensive', target: 23, minLevel: 'standard', type: 'recommended', depth: 1 },
    { source: 24, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1 },
    { source: 25, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'recommended', depth: 2 },
    { source: 12, sourceLevel: 'comprehensive', target: 11, minLevel: 'standard', type: 'recommended', depth: 1 },
    { source: 9, sourceLevel: 'basic', target: 'all_technical', minLevel: 'basic', type: 'mandatory', depth: 1 }
];

// Dependency Chains
export const DEPENDENCY_CHAINS = [
    { id: 'req_design', name: 'Requirements → Design → Implementation', processes: [18, 19, 20, 21, 23], description: 'Each process depends on outputs from the previous. Avoid large gaps.' },
    { id: 'vv_loop', name: 'V&V Loop', processes: [19, 24, 25, 27, 18], description: 'V&V levels should be at least as high as the processes producing their test bases.' },
    { id: 'mgmt_support', name: 'Management Support', processes: [9, 12, 11, 16], description: 'If any technical process ≥ Standard, these should be ≥ Standard.' },
    { id: 'config_backbone', name: 'Configuration Backbone', processes: [13, 14, 8], description: 'CM supports all processes. Its level should match the highest technical process level.' }
];

// System Assurance Criticality Tier Data (derived from M5)
export const SA_CRITICALITY_TIERS = [
    {
        id: 'tier1',
        name: 'Tier I – Negligible',
        level: 'basic',
        m5Range: '1-2',
        criteria: 'No hazardous consequences; failures are recoverable with no harm',
        minRigor: 'Basic',
        independence: 'No specific independence requirement',
        description: 'System failures have minimal impact and are easily recoverable'
    },
    {
        id: 'tier2',
        name: 'Tier II – Safety Relevant',
        level: 'standard',
        m5Range: '3',
        criteria: 'Potential minor harm; regulated environment; availability impacts',
        minRigor: 'Standard',
        independence: 'Safety Engineer separate from design; peer review of safety analyses',
        description: 'System has safety implications requiring formal SA activities'
    },
    {
        id: 'tier3',
        name: 'Tier III – Safety Critical',
        level: 'comprehensive',
        m5Range: '4-5',
        criteria: 'Potential for major harm, fatality, or regulatory non-compliance',
        minRigor: 'Comprehensive',
        independence: 'Independent Safety Engineer; ISA required for Safety Case and acceptance',
        description: 'Safety-critical system requiring comprehensive SA program'
    }
];

export const SA_FLOOR_RULE = {
    description: 'The SA Criticality Tier (derived from M5 Safety Impact) acts as a minimum rigor floor for safety-relevant processes',
    rules: [
        { tier: 'tier1', minLevel: null, action: 'None' },
        { tier: 'tier2', minLevel: 'standard', action: 'Upgrade Basic → Standard' },
        { tier: 'tier3', minLevel: 'comprehensive', action: 'Upgrade all to Comprehensive' }
    ]
};

export const SA_STANDARDS_REFERENCE = [
    { id: 'en50126', name: 'EN 50126-1/-2', application: 'Railway RAMS' },
    { id: 'en50129', name: 'EN 50129', application: 'Safety-related electronic systems' },
    { id: 'csar114', name: 'CSA R114:22', application: 'Canadian risk evaluation' },
    { id: 'nfpa130', name: 'NFPA 130', application: 'Fixed guideway transit' },
    { id: 'iec61508', name: 'IEC 61508', application: 'Functional safety (all industries)' }
];

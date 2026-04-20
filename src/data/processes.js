/**
 * SE Tailoring Model — Process Definitions
 * ==========================================
 * AI SYNC: This file maps directly to the SE Tailoring Model Master Index.
 * When processes change, update this file to keep the web app in sync.
 *
 * _VERSION: 3.5.0
 * _LAST_UPDATED: 2026-04
 * _SOURCE: 00-MASTER/SE-Tailoring-Model-Master-Index.md
 * _SYNC_CONTRACT:
 *   - Canonical core/extended process scope: 00-MASTER/SE-Tailoring-Model-Master-Index.md
 */

export const PROCESS_GROUPS = {
    TECH_MGMT: { id: 'tech_mgmt', name: 'Technical Management', color: '#6366f1', icon: '⚙️' },
    TECHNICAL: { id: 'technical', name: 'Technical', color: '#22d3ee', icon: '🔧' },
    AGREEMENT: { id: 'agreement', name: 'Agreement', color: '#f472b6', icon: '🤝' },
    ORG_ENABLING: { id: 'org_enabling', name: 'Organizational Project-Enabling', color: '#a78bfa', icon: '🏢' }
};

export const PROCESSES = [
    // --- Agreement Processes ---
    { id: 1, name: 'Acquisition', group: 'agreement', purpose: 'Procurement and supplier management', extended: true },
    { id: 2, name: 'Supply', group: 'agreement', purpose: 'Proposal development and delivery', extended: true },
    // --- Organizational Project-Enabling ---
    { id: 3, name: 'Life Cycle Model Management', group: 'org_enabling', purpose: 'Lifecycle model selection and improvement', extended: true },
    { id: 4, name: 'Infrastructure Management', group: 'org_enabling', purpose: 'Tools, facilities, and infrastructure', extended: true },
    { id: 5, name: 'Portfolio Management', group: 'org_enabling', purpose: 'Project prioritization and resource allocation', extended: true },
    { id: 6, name: 'Human Resource Management', group: 'org_enabling', purpose: 'Competency development and workforce management', extended: true },
    { id: 7, name: 'Quality Management', group: 'org_enabling', purpose: 'Quality objectives and improvement', extended: true },
    { id: 8, name: 'Knowledge Management', group: 'org_enabling', purpose: 'Knowledge capture, sharing, and reuse', extended: true },
    // --- Technical Management Processes (Core) ---
    {
        id: 9, name: 'Project Planning', group: 'tech_mgmt', purpose: 'Establish and maintain project plans that define expectations, activities, and resources', extended: false,
        definition: { basic: 'Basic planning with simple schedule and resource list', standard: 'Structured planning with WBS, IMS, and risk register', comprehensive: 'Integrated multi-view planning with probabilistic analysis' },
        assumptions: 'Schedule is milestone-based; resources assigned as available; risks tracked informally; cost estimates are high-level.',
        whenToElevate: 'Elevate to Standard if any technical process is at Standard or above. Elevate to Comprehensive for large distributed teams or high uncertainty.'
    },
    {
        id: 10, name: 'Project Assessment & Control', group: 'tech_mgmt', purpose: 'Monitor project progress and take corrective action when needed', extended: false,
        definition: { basic: 'Basic status reporting with issue logging', standard: 'Structured performance measurement with change control', comprehensive: 'Dashboard monitoring with predictive analytics' },
        assumptions: 'Status reported verbally or via simple updates; issues tracked in simple log; changes recorded but not formally controlled.',
        whenToElevate: 'Elevate to Standard for projects with formal milestones or regulatory requirements.'
    },
    {
        id: 11, name: 'Decision Management', group: 'tech_mgmt', purpose: 'Make informed decisions with traceability and stakeholder involvement', extended: false,
        definition: { basic: 'Basic decision recording with informal analysis', standard: 'Structured decision process with criteria matrices', comprehensive: 'Decision governance framework with uncertainty analysis' },
        assumptions: 'Decisions made informally; alternatives discussed but not formally analyzed.',
        whenToElevate: 'Elevate to Standard for high-value decisions or when traceability is required.'
    },
    {
        id: 12, name: 'Risk Management', group: 'tech_mgmt', purpose: 'Identify, assess, and treat risks throughout the project lifecycle', extended: false,
        definition: { basic: 'Simple risk register with high/medium/low assessment. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured risk management with response planning', comprehensive: 'Comprehensive framework with quantitative analysis' },
        assumptions: 'Risks identified through experience and intuition; assessment is qualitative (H/M/L); monitoring is informal.',
        whenToElevate: 'Elevate to Standard for medium-complexity projects. Elevate to Comprehensive for safety-critical systems.',
        cultureActions: { resistant: 'Frame risks as "What could go wrong?"; use guerrilla tactics if formal registers rejected', tolerant: 'Demonstrate ROI of risk management; use internal champions', supportive: 'Implement quantitative risk analysis; create risk dashboards' }
    },
    {
        id: 13, name: 'Configuration Management', group: 'tech_mgmt', purpose: 'Establish and maintain consistency of system attributes throughout the lifecycle', extended: false,
        definition: { basic: 'Basic item tracking with simple version control. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured CM with change control board', comprehensive: 'Comprehensive CM with PLM/ALM integration' },
        assumptions: 'Configuration items tracked in simple list; versions controlled manually; changes requested informally.',
        whenToElevate: 'Elevate to Standard for multiple interfaces or regulatory requirements.'
    },
    {
        id: 14, name: 'Information Management', group: 'tech_mgmt', purpose: 'Manage information throughout its lifecycle with appropriate access and security', extended: false,
        definition: { basic: 'Basic repository with access control', standard: 'Structured management with protocols per ISO 27001 basics', comprehensive: 'Comprehensive architecture for lifecycle information' },
        assumptions: 'Information stored in shared folders; access controlled by folder permissions.',
        whenToElevate: 'Elevate to Standard for regulatory requirements or sensitive information.'
    },
    {
        id: 15, name: 'Measurement', group: 'tech_mgmt', purpose: 'Define, collect, and analyze measures to support decision-making', extended: false,
        definition: { basic: 'Basic metrics for tracking', standard: 'Defined framework with trends per ISO 15939', comprehensive: 'Comprehensive strategy with predictive analytics' },
        assumptions: 'Metrics are few and simple; data collection is manual; reporting is ad-hoc.',
        whenToElevate: 'Elevate to Standard for projects requiring performance tracking.'
    },
    {
        id: 16, name: 'Quality Assurance', group: 'tech_mgmt', purpose: 'Ensure processes and products meet quality requirements', extended: false,
        definition: { basic: 'Basic audits and reviews for compliance', standard: 'Structured assurance with evaluations per ISO 9001', comprehensive: 'Comprehensive program with trend analyses for proactive quality' },
        assumptions: 'QA limited to basic audits; non-conformances tracked informally.',
        whenToElevate: 'Elevate to Standard for regulated industries or quality-critical products.'
    },
    // --- Technical Processes (Core) ---
    {
        id: 17, name: 'Business/Mission Analysis', group: 'technical', purpose: 'Define the problem or opportunity and explore solution alternatives', extended: false,
        definition: { basic: 'Basic problem identification and alternatives exploration', standard: 'Structured analysis with stakeholder mapping per INCOSE', comprehensive: 'Comprehensive analysis with value modeling for strategic alignment' },
        assumptions: 'Problem is well-understood; stakeholders are few and aligned.',
        whenToElevate: 'Elevate to Standard for multiple stakeholder groups or complex context.'
    },
    {
        id: 18, name: 'Stakeholder Needs & Requirements Definition', group: 'technical', purpose: 'Elicit, analyze, and validate stakeholder needs', extended: false,
        definition: { basic: 'Basic needs elicitation and validation. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured elicitation with conflict resolution', comprehensive: 'Comprehensive modeling with engagement planning' },
        assumptions: 'Stakeholders identified through direct engagement; needs captured informally.',
        whenToElevate: 'Elevate to Standard for multiple stakeholder groups with conflicting needs.'
    },
    {
        id: 19, name: 'System Requirements Definition', group: 'technical', purpose: 'Transform stakeholder needs into system requirements', extended: false,
        definition: { basic: 'Simple derivation with basic traceability. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured development with database management', comprehensive: 'Model-based with full traceability network per SysML/INCOSE' },
        assumptions: 'Requirements documented in simple list; traceability is manual.',
        whenToElevate: 'Elevate to Standard for safety-related requirements or formal verification needs.'
    },
    {
        id: 20, name: 'Architecture Definition', group: 'technical', purpose: 'Define the system architecture that satisfies requirements', extended: false,
        definition: { basic: 'Basic concepts with interface lists', standard: 'Structured development with evaluation per ISO 42010', comprehensive: 'Model-based with governance for complex architectures' },
        assumptions: 'Architecture defined in simple diagrams; interfaces listed informally.',
        whenToElevate: 'Elevate to Standard for multi-system integration or mission-critical systems.'
    },
    {
        id: 21, name: 'Design Definition', group: 'technical', purpose: 'Create comprehensive design specifications for all system elements', extended: false,
        definition: { basic: 'Basic design documentation with diagrams', standard: 'Structured design with alternatives analysis', comprehensive: 'Model-based design with formal notation and optimization' },
        assumptions: 'Design documented informally; technology selections based on experience.',
        whenToElevate: 'Elevate to Standard for complex subsystems or novel technology.'
    },
    {
        id: 22, name: 'System Analysis', group: 'technical', purpose: 'Perform trade studies, modeling, and analysis to support decisions', extended: false,
        definition: { basic: 'Simple analysis with basic methodology', standard: 'Structured analysis with defined methodologies', comprehensive: 'Advanced modeling and simulation with uncertainty quantification' },
        assumptions: 'Analysis is ad-hoc and experience-based.',
        whenToElevate: 'Elevate to Standard for novel technology or complex trade-offs.'
    },
    {
        id: 23, name: 'Implementation', group: 'technical', purpose: 'Transform designs into tangible system elements', extended: false,
        definition: { basic: 'Basic build per specifications', standard: 'Structured implementation with progress tracking', comprehensive: 'Comprehensive implementation with continuous monitoring' },
        assumptions: 'Implementation follows design; acceptance is basic.',
        whenToElevate: 'Elevate to Standard for complex integration or quality-critical products.'
    },
    {
        id: 24, name: 'Integration', group: 'technical', purpose: 'Combine system elements into a functioning whole', extended: false,
        definition: { basic: 'Basic integration with issue tracking. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured integration with verification', comprehensive: 'Comprehensive integration with risk assessment' },
        assumptions: 'Integration is straightforward; issues tracked in simple log.',
        whenToElevate: 'Elevate to Standard for many interfaces or cross-domain dependencies.'
    },
    {
        id: 25, name: 'Verification', group: 'technical', purpose: 'Confirm system meets specified requirements (built correctly)', extended: false,
        definition: { basic: 'Basic testing with defect logging. In PSI 1-2 / CRI ≤ 2 contexts, implemented via consolidated Basic-Plus Project Notebook.', standard: 'Structured verification with multiple methods', comprehensive: 'Comprehensive risk-based verification with full traceability' },
        assumptions: 'Verification limited to basic testing; defects tracked informally.',
        whenToElevate: 'Elevate to Standard for safety-related or regulated systems.'
    },
    {
        id: 26, name: 'Transition', group: 'technical', purpose: 'Deploy system and establish operational readiness', extended: false,
        definition: { basic: 'Basic deployment with installation procedures', standard: 'Structured transition with readiness verification', comprehensive: 'Comprehensive transition strategy with risk assessment' },
        assumptions: 'Transition is straightforward; training is informal.',
        whenToElevate: 'Elevate to Standard for complex operational environments.'
    },
    {
        id: 27, name: 'Validation', group: 'technical', purpose: 'Confirm system meets stakeholder needs (right system built)', extended: false,
        definition: { basic: 'Basic validation with user feedback', standard: 'Structured validation with multiple methods', comprehensive: 'Comprehensive validation with stakeholder acceptance strategy' },
        assumptions: 'Validation through informal user review.',
        whenToElevate: 'Elevate to Standard for safety-critical or complex stakeholder environments.'
    },
    {
        id: 28, name: 'Operation', group: 'technical', purpose: 'Operate the system in its intended environment', extended: false,
        definition: { basic: 'Basic operational procedures and support', standard: 'Structured operations with performance monitoring', comprehensive: 'Comprehensive operational strategy with predictive analytics' },
        assumptions: 'Operations follow basic procedures; performance tracked informally.',
        whenToElevate: 'Elevate to Standard for mission-critical or safety-critical operations.'
    },
    {
        id: 29, name: 'Maintenance', group: 'technical', purpose: 'Maintain system in operational condition', extended: false,
        definition: { basic: 'Basic maintenance procedures and problem tracking', standard: 'Structured maintenance with environment management', comprehensive: 'Predictive maintenance with optimization' },
        assumptions: 'Maintenance is reactive; problems tracked in simple log.',
        whenToElevate: 'Elevate to Standard for safety-critical or high-availability systems.'
    },
    {
        id: 30, name: 'Disposal', group: 'technical', purpose: 'Retire system with environmental compliance', extended: false,
        definition: { basic: 'Basic disposal with archiving', standard: 'Structured disposal with environmental assessment', comprehensive: 'Comprehensive disposal strategy with risk assessment' },
        assumptions: 'Disposal is straightforward; archiving is basic.',
        whenToElevate: 'Elevate to Standard for environmental or regulatory requirements.'
    }
];

export const CORE_PROCESSES = PROCESSES.filter(p => !p.extended);
export const EXTENDED_PROCESSES = PROCESSES.filter(p => p.extended);

/**
 * SE Tailoring Model — Metrics & Assessment Data
 * _SEMANTIC_VERSION: 4.1.1 | _LAST_UPDATED: 2026-07-12
 * _SOURCE: This registry is authoritative for normative semantic fields.
 * _SYNC_CONTRACT:
 *   - 01-PAPER/SE-Tailoring-Framework-Conference-Methods-Paper-v4.1.1.md explains the current architecture and claim boundary.
 *   - 00-MASTER/generated/semantic-projection.json is the generated human/machine projection.
 *   - 02-PRACTICAL/Interdependency-Quick-Reference.md is an authored, parity-checked practitioner view.
 *   - Prose and practitioner views must not alter registry semantics.
 * 
 * CURRENT LOGIC:
 *   - Removed weighted score calculations (no P=2/S=1 weighting)
 *   - Uses max-tier derivation with Comprehensive corroboration
 *   - Excludes M9/M10 from direct process-level inflation; uses them in CSI
 *   - Uses process-specific override floors from Chapter 6
 *   - Supports right-sizing through PSI/CSI/CRI governance
 */

export const DIMENSIONS = [
    { id: 'complexity', name: 'System Complexity', color: '#8b5cf6', metrics: ['M1', 'M2', 'M3', 'M4'] },
    { id: 'safety', name: 'Safety & Criticality', color: '#ef4444', metrics: ['M5', 'M6', 'M7', 'M8'] },
    { id: 'constraints', name: 'Project Constraints', color: '#f59e0b', metrics: ['M9', 'M10', 'M11', 'M12'] },
    { id: 'stakeholder', name: 'Stakeholder, Governance & Adoption Context', color: '#22d3ee', metrics: ['M13', 'M14', 'M15', 'M16'] }
];

export const FRAMEWORK_SEMANTIC_VERSION = '4.1.1';
export const METRIC_DEFINITION_SET_ID = 'se-tailoring-m1-m16-v3';
export const METRIC_DEFINITION_VERSION = 3;
export const QUALIFIER_SCHEMA_VERSION = '1.1';

export const METRIC_QUALIFIER_DEFINITIONS = {
    M3: [
        { id: 'component-readiness', label: 'Component or technology readiness' },
        { id: 'application-novelty', label: 'Novelty of intended application or use' },
        { id: 'configuration-integration-novelty', label: 'Novelty of configuration or integration pattern' },
        { id: 'environment-representativeness', label: 'Representativeness of demonstrated environment' },
        { id: 'scale-up-realization-novelty', label: 'Scale-up, manufacturing, or realization novelty' },
        { id: 'evidence-maturity', label: 'Maturity of supporting readiness evidence' }
    ],
    M8: [
        { id: 'confidentiality', label: 'Confidentiality consequence' },
        { id: 'integrity', label: 'Integrity consequence' },
        { id: 'availability', label: 'Availability consequence' },
        { id: 'privacy', label: 'Privacy consequence' },
        { id: 'cyber-physical', label: 'Cyber-physical consequence' }
    ],
    M15: [
        { id: 'regulatory-mandate', label: 'Regulatory mandate', floorEligible: true },
        { id: 'contractual-assurance', label: 'Contractual assurance', floorEligible: true },
        { id: 'certification-scheme', label: 'Certification or authorization scheme', floorEligible: true },
        { id: 'independent-assurance-requirement', label: 'Independent assurance requirement', floorEligible: true },
        { id: 'executive-board-mandate', label: 'Documented executive or board mandate', floorEligible: true },
        { id: 'political-visibility', label: 'Political visibility', floorEligible: false },
        { id: 'public-interest', label: 'Public interest', floorEligible: false },
        { id: 'media-scrutiny', label: 'Media scrutiny', floorEligible: false },
        { id: 'reputational-exposure', label: 'Reputational exposure', floorEligible: false }
    ]
};

export const BINDING_ASSURANCE_QUALIFIERS = METRIC_QUALIFIER_DEFINITIONS.M15
    .filter(qualifier => qualifier.floorEligible)
    .map(qualifier => qualifier.id);

export const METRIC_MIGRATION_HISTORY = [
    {
        fromDefinitionSet: 'se-tailoring-m1-m16-v1',
        toDefinitionSet: 'se-tailoring-m1-m16-v2',
        frameworkVersion: '4.0.0',
        reassessmentMetrics: ['M6', 'M8', 'M15']
    },
    {
        fromDefinitionSet: 'se-tailoring-m1-m16-v2',
        toDefinitionSet: METRIC_DEFINITION_SET_ID,
        frameworkVersion: '4.1.0',
        reassessmentMetrics: ['M3']
    }
];

export const METRIC_MIGRATION = {
    fromDefinitionSet: 'se-tailoring-m1-m16-v2',
    toDefinitionSet: METRIC_DEFINITION_SET_ID,
    frameworkVersion: '4.1.0',
    metrics: {
        M3: {
            classification: 'reassessment-required',
            from: 'Technology Novelty / Uncertainty (TRL-dominant prompts)',
            to: 'Technology Novelty / Uncertainty (application/configuration-aware prompts)',
            rationale: 'Mature components no longer imply low uncertainty when their application, configuration, environment, scale-up, or realization basis is novel.'
        }
    }
};

export const METRICS = [
    {
        id: 'M1', name: 'Architectural Complexity', dimension: 'complexity',
        anchors: { 1: 'Few elements, simple interactions', 3: 'Multiple elements, known patterns', 5: 'Many elements, non-linear interactions' },
        guidedQuestions: [
            {
                text: "Does the architecture involve SYSTEM-OF-SYSTEMS with emergent, unpredictable behaviors across multiple organizations?",
                yesScore: 5,
                rationale: 'Multiple interacting systems with non-linear dependencies'
            },
            {
                text: "Are there NUMEROUS customized elements (10+) with significant, non-standard interactions requiring custom integration?",
                yesScore: 4,
                rationale: 'High element count with complex custom interactions'
            },
            {
                text: "Does the architecture use MULTIPLE elements (5-10) following known, proven industry patterns (e.g., client-server, microservices)?",
                yesScore: 3,
                rationale: 'Moderate complexity with established architectural patterns'
            },
            {
                text: "Is the architecture composed of FEW elements (2-4) with simple, well-documented interactions?",
                yesScore: 2,
                rationale: 'Low complexity, straightforward element relationships'
            }
        ]
    },
    {
        id: 'M2', name: 'Interface Complexity', dimension: 'complexity',
        anchors: { 1: 'Simple, well-defined', 3: 'Multiple, need coordination', 5: 'Complex with emergent behaviors' },
        guidedQuestions: [
            {
                text: "Are there MULTIPLE COMPLEX external interfaces (10+) across different organizations that are undefined or rapidly evolving?",
                yesScore: 5,
                rationale: 'High interface count with cross-organizational coordination and evolution'
            },
            {
                text: "Are there NUMEROUS internal/external interfaces (5-10) requiring formal ICDs and tight configuration control?",
                yesScore: 4,
                rationale: 'Formal interface control required across multiple boundaries'
            },
            {
                text: "Are there SEVERAL well-defined interfaces (3-5) with mostly internal dependencies and standard protocols?",
                yesScore: 3,
                rationale: 'Moderate interface count with established definitions'
            },
            {
                text: "Are there only FEW simple interfaces (1-2) using standard, off-the-shelf communication protocols?",
                yesScore: 2,
                rationale: 'Minimal interface complexity'
            }
        ]
    },
    {
        id: 'M3', name: 'Technology Novelty / Uncertainty', dimension: 'complexity',
        anchors: { 1: 'Proven in the intended use and environment', 3: 'Mixed readiness or bounded application uncertainty', 5: 'Novel or materially unproven use' },
        note: 'Judge uncertainty from both the technologies and their intended application, configuration, environment, scale, realization method, and supporting evidence. Structural integration burden remains M4.',
        guidedQuestions: [
            {
                text: "Does the system rely on technologies, applications, configurations, environments, or realization methods with only early research or laboratory evidence?",
                yesScore: 5,
                rationale: 'Unproven technology with high technical risk'
            },
            {
                text: "Is there material readiness uncertainty because the technology or its intended application, configuration, operating environment, scale, or realization method has limited representative evidence?",
                yesScore: 4,
                rationale: 'Limited industry track record, requires validation'
            },
            {
                text: "Is readiness mixed, with representative evidence for most of the intended use but bounded uncertainty in one or more technology, application, configuration, environment, scale, or realization aspects?",
                yesScore: 3,
                rationale: 'Mostly proven with minor new elements'
            },
            {
                text: "Are all core technologies mature and supported by representative evidence in a familiar application, configuration, operating environment, scale, and realization method?",
                yesScore: 2,
                rationale: 'Low residual novelty or readiness uncertainty in the intended use'
            }
        ]
    },
    {
        id: 'M4', name: 'Integration Complexity', dimension: 'complexity',
        anchors: { 1: 'Straightforward', 3: 'Requires systematic planning', 5: 'Cross-domain dependencies' },
        guidedQuestions: [
            {
                text: "Does integration require coordination across MULTIPLE engineering disciplines, diverse contractors, AND legacy systems simultaneously?",
                yesScore: 5,
                rationale: 'Multi-domain integration with organizational complexity'
            },
            {
                text: "Are there SIGNIFICANT integration challenges requiring custom middleware, bridging adapters, or major hardware modifications?",
                yesScore: 4,
                rationale: 'Custom integration solutions required'
            },
            {
                text: "Does integration require SYSTEMATIC planning but uses standard APIs and well-documented physical interfaces?",
                yesScore: 3,
                rationale: 'Planned integration with established interfaces'
            },
            {
                text: "Is integration STRAIGHTFORWARD with plug-and-play components or minor software configurations?",
                yesScore: 2,
                rationale: 'Minimal integration effort'
            }
        ]
    },
    {
        id: 'M5', name: 'Safety Impact', dimension: 'safety',
        anchors: { 1: 'No safety implications', 3: 'Moderate safety concerns (minor injury)', 5: 'Safety-critical (fatality potential)' },
        note: 'Primary driver for Safety Assurance Criticality Tier. M5=5 triggers life-safety overrides.',
        guidedQuestions: [
            {
                text: "Could a system failure DIRECTLY result in FATALITY, catastrophic injury, or loss of life (e.g., train collision, structural collapse, electrocution)?",
                yesScore: 5,
                rationale: 'Life-Safety (Tier 3) – Triggers comprehensive SA program with independent safety assessment'
            },
            {
                text: "Could a failure cause SEVERE INJURY requiring hospitalization, permanent disability, or major regulatory investigation (e.g., broken bones, chemical exposure, fire)?",
                yesScore: 4,
                rationale: 'Safety-Critical (Tier 2+) – Requires formal hazard analysis and safety case'
            },
            {
                text: "Could a failure result in MINOR INJURY requiring first aid or medical treatment (e.g., cuts, bruises, minor burns) but not life-threatening?",
                yesScore: 3,
                rationale: 'Safety consideration (Tier I, no SA floor) – Drives applicable process rigor and risk review without triggering safety-critical floors'
            },
            {
                text: "Are there only INDIRECT safety implications (e.g., situational awareness, minor ergonomic issues) with no direct injury potential?",
                yesScore: 2,
                rationale: 'Baseline safety assurance (Tier I) – No specific SA independence requirements'
            }
        ]
    },
    {
        id: 'M6', name: 'Mission / Operational Criticality', dimension: 'safety',
        anchors: { 1: 'Negligible operational consequence', 3: 'Moderate service or mission degradation', 5: 'Catastrophic mission or operational loss' },
        guidedQuestions: [
            {
                text: "Would system failure cause COMPLETE LOSS of a primary mission or essential operational service with no timely workaround?",
                yesScore: 5,
                rationale: 'Catastrophic mission or operational consequence'
            },
            {
                text: "Would failure SEVERELY DEGRADE mission performance or essential operations and require emergency workarounds or sustained degraded-mode operation?",
                yesScore: 4,
                rationale: 'Major mission or operational degradation requiring emergency response'
            },
            {
                text: "Would failure cause MODERATE DISRUPTION that can be managed with standard operational backups or redundancies?",
                yesScore: 3,
                rationale: 'Manageable disruption with existing contingencies'
            },
            {
                text: "Would failure cause only MINOR INCONVENIENCE with minimal impact on core business or operations?",
                yesScore: 2,
                rationale: 'Low mission impact'
            }
        ]
    },
    {
        id: 'M7', name: 'Environmental Impact', dimension: 'safety',
        anchors: { 1: 'Minimal concerns', 3: 'Moderate considerations', 5: 'Significant environmental risks' },
        guidedQuestions: [
            {
                text: "Could the system cause CATASTROPHIC, IRREVERSIBLE environmental damage or major public health crises (e.g., toxic spill affecting thousands)?",
                yesScore: 5,
                rationale: 'Catastrophic environmental impact with public health implications'
            },
            {
                text: "Is there potential for SIGNIFICANT environmental pollution requiring extensive mitigation, permits, and ongoing regulatory reporting?",
                yesScore: 4,
                rationale: 'Major environmental impact requiring formal oversight'
            },
            {
                text: "Are there MODERATE environmental considerations that require standard mitigation limits and routine monitoring?",
                yesScore: 3,
                rationale: 'Moderate impact with standard regulatory compliance'
            },
            {
                text: "Does the system have MINOR environmental footprint (e.g., standard waste disposal, moderate energy use) with minimal regulatory oversight?",
                yesScore: 2,
                rationale: 'Minimal environmental impact'
            }
        ]
    },
    {
        id: 'M8', name: 'Security Criticality / Consequence', dimension: 'safety',
        anchors: { 1: 'Negligible security consequence', 3: 'Moderate service, information, or control consequence', 5: 'Catastrophic or systemic security consequence' },
        note: 'Score credible consequence from loss of confidentiality, integrity, availability, privacy, or control authority. Record likelihood, vulnerability, and control maturity separately.',
        guidedQuestions: [
            {
                text: "Could compromise cause CATASTROPHIC mission loss, systemic critical-infrastructure disruption, physical harm, or irreversible highly sensitive information loss?",
                yesScore: 5,
                rationale: 'Catastrophic security-origin consequence within the stated system boundary'
            },
            {
                text: "Could compromise cause MAJOR or sustained operational disruption, significant protected-data or control compromise, or propagation across critical interfaces?",
                yesScore: 4,
                rationale: 'Major security consequence requiring formal security engineering and recovery planning'
            },
            {
                text: "Could compromise cause MODERATE service degradation, sensitive-information exposure, integrity loss, or unauthorized control requiring coordinated recovery?",
                yesScore: 3,
                rationale: 'Moderate security consequence with formal protection needs'
            },
            {
                text: "Would compromise be LOCALIZED and REVERSIBLE, with limited non-sensitive information exposure and routine recovery?",
                yesScore: 2,
                rationale: 'Minor security consequence'
            }
        ]
    },
    {
        id: 'M9', name: 'Schedule Pressure', dimension: 'constraints',
        anchors: { 1: 'Flexible timeline', 3: 'Moderate constraints', 5: 'Aggressive, immovable deadlines' },
        guidedQuestions: [
            {
                text: "Is there an immovable external deadline with negligible usable margin and consequences that materially threaten the approved mission, service, authorization, or project case?",
                yesScore: 5,
                rationale: 'Extreme schedule pressure with zero tolerance for delay'
            },
            {
                text: "Is the schedule highly constrained, with substantial critical-path compression, concurrency, or limited recovery margin requiring active feasibility intervention?",
                yesScore: 4,
                rationale: 'High schedule pressure requiring aggressive management'
            },
            {
                text: "Are there MODERATE schedule constraints requiring careful management, critical path tracking, and some schedule margin?",
                yesScore: 3,
                rationale: 'Standard schedule management required'
            },
            {
                text: "Is the timeline SLIGHTLY ACCELERATED but generally comfortable with adequate schedule margin?",
                yesScore: 2,
                rationale: 'Low schedule pressure'
            }
        ]
    },
    {
        id: 'M10', name: 'Budget Constraints', dimension: 'constraints',
        anchors: { 1: 'Adequate budget', 3: 'Careful management needed', 5: 'Tight, limited flexibility' },
        guidedQuestions: [
            {
                text: "Is the budget EXTREMELY TIGHT with ABSOLUTELY NO contingency, where ANY cost overrun kills the project or requires major scope reduction?",
                yesScore: 5,
                rationale: 'Extreme budget constraint with zero margin'
            },
            {
                text: "Are funds HIGHLY RESTRICTED requiring constant rigorous cost control, frequent trade-offs, and minimal management reserve?",
                yesScore: 4,
                rationale: 'High budget pressure requiring active cost management'
            },
            {
                text: "Does the approved budget require active management but retain a documented, proportionate contingency and workable change authority for the current estimate maturity?",
                yesScore: 3,
                rationale: 'Standard budget management'
            },
            {
                text: "Are funds adequately provisioned relative to estimate uncertainty, with usable contingency and flexibility to address credible changes?",
                yesScore: 2,
                rationale: 'Low budget pressure'
            }
        ]
    },
    {
        id: 'M11', name: 'Team Capability Gap', dimension: 'constraints',
        anchors: { 1: 'Highly experienced', 3: 'Mixed experience', 5: 'Limited relevant experience' },
        guidedQuestions: [
            {
                text: "Is the team COMPLETELY NEW to this type of system, domain, AND technology with NO relevant prior experience?",
                yesScore: 5,
                rationale: 'No relevant experience – high learning curve'
            },
            {
                text: "Does the team have SIGNIFICANT SKILL GAPS requiring external consultants, extensive ramp-up training, or knowledge transfer programs?",
                yesScore: 4,
                rationale: 'Major skill gaps requiring mitigation'
            },
            {
                text: "Is there a MIX of experienced seniors and junior members needing standard supervision and mentoring?",
                yesScore: 3,
                rationale: 'Mixed experience level – standard supervision required'
            },
            {
                text: "Is the team MOSTLY EXPERIENCED with this technology, with only one or two minor unfamiliar areas?",
                yesScore: 2,
                rationale: 'High relevant experience'
            }
        ]
    },
    {
        id: 'M12', name: 'Distributed Delivery Complexity', dimension: 'constraints',
        anchors: { 1: 'Coordinated delivery context', 3: 'Distributed with manageable handoffs', 5: 'Fragmented delivery topology and authority' },
        guidedQuestions: [
            {
                text: "Is delivery fragmented across multiple organizations, contracts, sites, tool or data boundaries, and limited working-hour overlap, with unclear or contested integration and decision authority?",
                yesScore: 5,
                rationale: 'Severe delivery-topology fragmentation with major coordination and authority burden'
            },
            {
                text: "Do material organizational, contractual, site, tool, data, or time-overlap boundaries require formal handoffs and coordinated decision authority?",
                yesScore: 4,
                rationale: 'High distribution requiring formal coordination'
            },
            {
                text: "Is delivery distributed across a manageable number of boundaries with defined responsibilities, compatible tools, and workable coordination windows?",
                yesScore: 3,
                rationale: 'Moderate distribution with some coordination needs'
            },
            {
                text: "Is delivery coordinated through clear responsibilities, compatible information and tool access, and routine handoffs, regardless of physical location?",
                yesScore: 2,
                rationale: 'Low delivery-topology burden with effective coordination'
            }
        ]
    },
    {
        id: 'M13', name: 'Stakeholder Complexity', dimension: 'stakeholder',
        anchors: { 1: 'Few, aligned', 3: 'Multiple groups', 5: 'Numerous, diverse communities' },
        guidedQuestions: [
            {
                text: "Are there NUMEROUS, DIVERSE, HEAVILY CONFLICTING stakeholder communities (e.g., public, government agencies, multiple contractors, advocacy groups)?",
                yesScore: 5,
                rationale: 'High stakeholder complexity with conflicting interests'
            },
            {
                text: "Are there MULTIPLE DISTINCT stakeholder groups with competing interests requiring formal negotiation and arbitration?",
                yesScore: 4,
                rationale: 'Multiple stakeholders with competing priorities'
            },
            {
                text: "Are there SEVERAL stakeholder groups, but their needs are GENERALLY ALIGNED and well-understood?",
                yesScore: 3,
                rationale: 'Moderate stakeholder count with aligned interests'
            },
            {
                text: "Is there a SMALL, EASILY IDENTIFIED group of stakeholders (<5) with clear, non-conflicting needs?",
                yesScore: 2,
                rationale: 'Low stakeholder complexity'
            }
        ]
    },
    {
        id: 'M14', name: 'Requirements Volatility', dimension: 'stakeholder',
        anchors: { 1: 'Stable, understood', 3: 'Moderate change expected', 5: 'High volatility, evolving needs' },
        guidedQuestions: [
            {
                text: "Are requirements expected to change continually in rate, magnitude, or direction because key needs, constraints, or external conditions remain highly uncertain?",
                yesScore: 5,
                rationale: 'Extreme volatility – requirements unstable throughout lifecycle'
            },
            {
                text: "Is there HIGH VOLATILITY with MAJOR requirements likely to be discovered or fundamentally altered LATE in the development cycle?",
                yesScore: 4,
                rationale: 'High volatility with late-stage changes expected'
            },
            {
                text: "Are moderate changes expected in a bounded set of requirements, with their likely sources, timing, and effects reasonably understood?",
                yesScore: 3,
                rationale: 'Moderate, bounded requirements change expected'
            },
            {
                text: "Are requirements MOSTLY STABLE with only minor, well-understood refinements anticipated?",
                yesScore: 2,
                rationale: 'Low volatility – stable requirements baseline'
            }
        ]
    },
    {
        id: 'M15', name: 'External Governance & Assurance Demand', dimension: 'stakeholder',
        anchors: { 1: 'Routine internal governance', 3: 'Formal external gates and auditable evidence', 5: 'Compound critical assurance and authorization regime' },
        note: 'The numeric score represents binding evidence, review, approval, certification, or authorization burden. Public, political, media, or reputational visibility is recorded as a non-floor qualifier and does not raise this score by itself.',
        guidedQuestions: [
            {
                text: "Is release, entry to service, or continued operation dependent on MULTIPLE or highest-authority certifications, licences, authorizations, or assurance cases with continuing evidence obligations?",
                yesScore: 5,
                rationale: 'Compound critical assurance regime with consequential approval gates'
            },
            {
                text: "Is there a DOCUMENTED BINDING requirement for independent review, audit, certification, regulator or owner approval, or board-mandated assurance before release or use?",
                yesScore: 4,
                rationale: 'Significant binding assurance demand with independent acceptance authority'
            },
            {
                text: "Are there DEFINED BINDING obligations requiring auditable evidence, formal review gates, and a named external or delegated acceptance authority?",
                yesScore: 3,
                rationale: 'Formal external governance plan and scheduled acceptance gates'
            },
            {
                text: "Are obligations LIMITED to a single client or contractual party with routine reporting or self-attestation and no independent approval dependency?",
                yesScore: 2,
                rationale: 'Limited external assurance burden'
            }
        ]
    },
    {
        id: 'M16', name: 'Organizational Culture', dimension: 'stakeholder',
        anchors: { 1: 'Limited conditions for adoption and challenge', 3: 'Mixed or locally dependent conditions', 5: 'Strong conditions for adoption and constructive challenge' },
        note: 'Higher M16 indicates stronger organizational conditions for SE adoption and constructive challenge. It shapes adoption strategy only and does not directly raise or lower process-level rigor.',
        guidedQuestions: [
            {
                text: "Does the organization provide sustained leadership support, decision authority, resources, learning mechanisms, and safe constructive challenge for proportionate SE practice?",
                yesScore: 5,
                rationale: 'Strong organizational conditions for adoption and constructive challenge'
            },
            {
                text: "Are formal support, authority, resources, and learning mechanisms present for SE, though application remains inconsistent across parts of the organization?",
                yesScore: 4,
                rationale: 'Formal SE support with variable implementation'
            },
            {
                text: "Do conditions for SE adoption depend mainly on local sponsors or repeated case-by-case justification, with uneven authority or learning support?",
                yesScore: 3,
                rationale: 'Mixed, locally dependent adoption conditions'
            },
            {
                text: "Are there material barriers to proportionate SE practice, such as weak decision support, limited authority or resources, incentives for ritual compliance, or low tolerance for constructive challenge?",
                yesScore: 2,
                rationale: 'Limited organizational conditions for effective adoption'
            }
        ]
    }
];

// Process-Metric Applicability Matrix: P = Primary, S = Secondary
// Key: processId -> { metricId: 'P' | 'S' }
// 
// P/S designations are retained for traceability and corroboration logic.
// The trigger tier uses all applicable metrics (P+S); a Comprehensive result
// still requires corroboration before it becomes the default recommendation.
// Source: this normative registry; the generated semantic projection is exact-checked.
// Semantic v4.1 note: M9 (Schedule Pressure) and M10 (Budget Constraints) are EXCLUDED
// from process-level driving. High constraint scores mean "less budget/time available"
// which should LIMIT rigor, not inflate it. M9/M10 feed into CSI (Constraint Stress
// Index) which governs right-sizing review and priority-based reduction instead.
// M16 (Organizational Culture) is also excluded from process-level driving.
// Culture identifies adoption-readiness gaps; it does not raise or lower
// technically required rigor.
export const METRIC_PROCESS_MAP = {
    9: { M1: 'P', M4: 'P', M12: 'P', M13: 'S' },
    10: { M1: 'P', M4: 'P', M13: 'S', M15: 'S' },
    11: { M1: 'P', M3: 'P', M6: 'P', M13: 'P', M15: 'P', M12: 'S' },
    12: { M5: 'P', M6: 'P', M8: 'P', M1: 'S', M2: 'S' },
    13: { M2: 'P', M4: 'P', M8: 'P', M1: 'S', M14: 'S' },
    14: { M8: 'P', M12: 'P', M2: 'S', M13: 'S' },
    15: { M6: 'P', M14: 'S' },
    16: { M5: 'P', M11: 'S', M3: 'S' },
    17: { M6: 'P', M13: 'P', M3: 'S' },
    18: { M13: 'P', M14: 'P', M15: 'P', M5: 'S', M6: 'S' },
    19: { M1: 'P', M2: 'P', M5: 'P', M14: 'S', M3: 'S', M8: 'S' },
    20: { M1: 'P', M2: 'P', M3: 'P', M4: 'P', M8: 'P', M5: 'S', M6: 'S', M11: 'S' },
    21: { M1: 'P', M2: 'P', M3: 'P', M5: 'S', M8: 'S', M11: 'S' },
    22: { M1: 'P', M3: 'P', M6: 'P', M2: 'S', M4: 'S', M5: 'S' },
    23: { M1: 'P', M4: 'P', M11: 'P', M2: 'S' },
    24: { M2: 'P', M4: 'P', M12: 'P', M1: 'S', M5: 'S', M11: 'S' },
    25: { M2: 'P', M4: 'P', M5: 'P', M8: 'P', M1: 'S' },
    26: { M6: 'P', M12: 'P', M13: 'P' },
    27: { M5: 'P', M6: 'P', M13: 'P', M8: 'S', M14: 'S' },
    28: { M5: 'P', M6: 'P', M7: 'P', M11: 'S', M12: 'S' },
    29: { M5: 'P', M6: 'P', M7: 'P', M11: 'S', M4: 'S' },
    30: { M7: 'P', M6: 'S' }
};

// M15 has both a general governance role and binding-assurance roles that are
// applicable only when a confirmed, source-backed obligation is scoped to the
// process. These records are evaluated by the engine and intentionally remain
// separate from the unconditional P/S matrix above.
export const CONDITIONAL_METRIC_PROCESS_DRIVERS = [
    { processId: 12, metric: 'M15', role: 'S', predicate: 'binding-assurance' },
    { processId: 13, metric: 'M15', role: 'P', predicate: 'binding-assurance' },
    { processId: 14, metric: 'M15', role: 'P', predicate: 'binding-assurance' },
    { processId: 16, metric: 'M15', role: 'P', predicate: 'binding-assurance' },
    { processId: 25, metric: 'M15', role: 'P', predicate: 'binding-assurance' },
    { processId: 27, metric: 'M15', role: 'S', predicate: 'binding-assurance' },
    { processId: 30, metric: 'M15', role: 'S', predicate: 'binding-assurance' }
];

// M15 may also change the severity of Rules 16 and 17, without becoming an
// additional metric-to-process driver. The named process must be present in a
// confirmed, source-backed obligation's processScope.
export const M15_SCOPED_RULE_ESCALATIONS = [
    { ruleId: 16, processId: 15, purpose: 'rule-severity' },
    { ruleId: 17, processId: 16, purpose: 'rule-severity' }
];

// Level thresholds per process.
// Algorithm: Trigger Tier = MAX(Tier(M₁), Tier(M₂), ...) where Tier(score): 1-2→Basic, 3-4→Standard, 5→Comprehensive
// These thresholds are provided for REFERENCE ONLY. The actual derivation also applies
// Comprehensive corroboration, override floors, right-sizing, and consistency rules.
// V4.1: M9/M10 removed from all thresholds — they are constraint metrics that feed CSI only
export const LEVEL_THRESHOLDS = Object.fromEntries(Object.entries(METRIC_PROCESS_MAP).map(([processId, metricMap]) => {
    const primaryMetrics = Object.entries(metricMap).filter(([, role]) => role === 'P').map(([metric]) => metric);
    const secondaryMetrics = Object.entries(metricMap).filter(([, role]) => role === 'S').map(([metric]) => metric);
    return [processId, {
        standard: primaryMetrics.map(metric => `${metric}≥3`).join(' or '),
        comprehensive: 'Any applicable metric = 5, with corroboration',
        primaryMetrics,
        secondaryMetrics
    }];
}));

/**
 * Override Conditions (Process-Specific)
 * _SOURCE: Normative registry decisions summarized in the current manuscript §3.5.
 * _SYNC_CONTRACT: Authoritative override baseline O1-O29, represented as process-specific floors.
 * 
 * CURRENT LOGIC:
 *   - Removed blanket exclusions (no longer "Basic excluded for X processes")
 *   - Made overrides process-specific with explicit minimum levels
 *   - Added SA floor conditions as explicit overrides (M5-derived)
 *   - Simplified trigger logic (metric-based only, no complex boolean combinations)
 * 
 * Trigger metadata:
 * - trigger.type = 'metric' uses metric/op/value fields
 * - trigger.type = 'context' uses project-context field/equals
 * 
 * ALGORITHM: Final Level = MAX(Derived Level, Override Minimum, SA Floor)
 */
export const OVERRIDE_CONDITIONS = [
    // =====================================================================
    // SAFETY OVERRIDES (M5-based)
    // =====================================================================
    {
        id: 'life_safety_requirements',
        condition: 'M5 = 5 → Process 19 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: System Requirements Definition',
        description: 'M5=5 (fatality potential) requires comprehensive requirements rigor with formal hazard analysis integration',
        processes: [19],
        minLevel: 'comprehensive',
        source: 'Framework policy summarized in the current manuscript §3.5; external standards are context, not direct score authority'
    },
    {
        id: 'life_safety_architecture',
        condition: 'M5 = 5 → Process 20 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: System Architecture Definition',
        description: 'M5=5 requires comprehensive architecture with SIL allocation and safety integrity verification',
        processes: [20],
        minLevel: 'comprehensive',
        source: 'EN 50129; IEC 61508-2'
    },
    {
        id: 'life_safety_verification',
        condition: 'M5 = 5 → Process 25 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Verification',
        description: 'M5=5 requires comprehensive verification with independent safety testing and evidence',
        processes: [25],
        minLevel: 'comprehensive',
        source: 'IEC 61508-3; DO-178C'
    },
    {
        id: 'life_safety_validation',
        condition: 'M5 = 5 → Process 27 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Validation',
        description: 'M5=5 requires comprehensive validation with safety acceptance and operational hazard assessment',
        processes: [27],
        minLevel: 'comprehensive',
        source: 'EN 50126; IEC 61508-7'
    },
    {
        id: 'life_safety_risk',
        condition: 'M5 = 5 → Process 12 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Risk Management',
        description: 'M5=5 requires comprehensive hazard identification, treatment, and safety evidence control',
        processes: [12],
        minLevel: 'comprehensive',
        source: 'EN 50126; IEC 61508'
    },
    {
        id: 'life_safety_qa',
        condition: 'M5 = 5 → Process 16 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Quality Assurance',
        description: 'M5=5 requires comprehensive independent assurance and safety audit evidence',
        processes: [16],
        minLevel: 'comprehensive',
        source: 'EN 50126/50129; IEC 61508'
    },
    {
        id: 'safety_critical_risk',
        condition: 'M5 = 4 → Process 12 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Risk Management',
        description: 'M5=4 (severe injury potential) requires standard risk management with formal hazard log',
        processes: [12],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO 15288 §6.3.4 and IEC 61508'
    },
    {
        id: 'safety_critical_qa',
        condition: 'M5 = 4 → Process 16 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Quality Assurance',
        description: 'M5=4 requires standard QA with safety audit trail and compliance verification',
        processes: [16],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO 15288 §6.3.8'
    },
    {
        id: 'safety_critical_requirements',
        condition: 'M5 = 4 → Process 19 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: System Requirements Definition',
        description: 'M5=4 requires explicit, traceable safety requirements and acceptance bases',
        processes: [19],
        minLevel: 'standard',
        source: 'EN 50126/50129; IEC 61508'
    },
    {
        id: 'safety_critical_architecture',
        condition: 'M5 = 4 → Process 20 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: System Architecture Definition',
        description: 'M5=4 requires architectural representation of safety constraints and mitigations',
        processes: [20],
        minLevel: 'standard',
        source: 'EN 50129; IEC 61508'
    },
    {
        id: 'safety_critical_verification',
        condition: 'M5 = 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Verification',
        description: 'M5=4 requires structured verification evidence for safety-related requirements',
        processes: [25],
        minLevel: 'standard',
        source: 'EN 50126/50129; IEC 61508'
    },
    {
        id: 'safety_critical_validation',
        condition: 'M5 = 4 → Process 27 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Validation',
        description: 'M5=4 requires structured operational validation of safety-related stakeholder needs',
        processes: [27],
        minLevel: 'standard',
        source: 'EN 50126/50129; IEC 61508'
    },
    // =====================================================================
    // MISSION / OPERATIONAL CRITICAL OVERRIDES (M6-based)
    // =====================================================================
    {
        id: 'mission_critical_risk',
        condition: 'M6 >= 4 → Process 12 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: Risk Management',
        description: 'M6≥4 requires standard risk management with mission-failure, continuity, and degraded-mode analysis',
        processes: [12],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO/IEC/IEEE 15288:2023 Risk Management'
    },
    {
        id: 'mission_critical_architecture',
        condition: 'M6 >= 4 → Process 20 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: System Architecture Definition',
        description: 'M6≥4 requires standard architecture with continuity, redundancy, degraded-mode, and recovery concepts',
        processes: [20],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.4'
    },
    {
        id: 'mission_critical_verification',
        condition: 'M6 >= 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: Verification',
        description: 'M6≥4 requires standard verification with mission success criteria validation',
        processes: [25],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.9'
    },
    {
        id: 'mission_critical_validation',
        condition: 'M6 >= 4 → Process 27 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: Validation',
        description: 'M6≥4 requires standard validation with operational mission effectiveness assessment',
        processes: [27],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO 15288 §6.4.11'
    },
    {
        id: 'mission_critical_operation',
        condition: 'M6 >= 4 → Process 28 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: Operation',
        description: 'M6≥4 requires standard operation with contingency procedures and emergency response',
        processes: [28],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO 15288 §6.4.12'
    },
    // =====================================================================
    // SECURITY CRITICAL OVERRIDES (M8-based)
    // =====================================================================
    {
        id: 'security_critical_risk',
        condition: 'M8 >= 4 → Process 12 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'Security-Critical: Risk Management',
        description: 'M8≥4 requires standard risk management with security consequence, threat, vulnerability, and treatment evidence kept distinct',
        processes: [12],
        minLevel: 'standard',
        source: 'Framework policy informed by NIST SP 800-160 Vol. 1 Rev. 1'
    },
    {
        id: 'security_critical_cm',
        condition: 'M8 >= 4 → Process 13 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'Security-Critical: Configuration Management',
        description: 'M8≥4 requires standard secure baseline control, change authorization, component provenance, and patch governance',
        processes: [13],
        minLevel: 'standard',
        source: 'Framework policy informed by NIST SP 800-160 and NIST SP 800-82 Rev. 3'
    },
    {
        id: 'security_critical_info',
        condition: 'M8 >= 4 → Process 14 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'Security-Critical: Information Management',
        description: 'M8≥4 requires standard information protection, access control, evidence handling, and recovery records',
        processes: [14],
        minLevel: 'standard',
        source: 'Framework policy informed by NIST SP 800-160 and NIST SP 800-82 Rev. 3'
    },
    {
        id: 'security_critical_architecture',
        condition: 'M8 >= 4 → Process 20 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'Security-Critical: System Architecture Definition',
        description: 'M8≥4 requires standard security architecture, trust-boundary, protection-needs, and resilience analysis',
        processes: [20],
        minLevel: 'standard',
        source: 'Framework policy informed by NIST SP 800-160 Vol. 1 Rev. 1'
    },
    {
        id: 'security_critical_verification',
        condition: 'M8 >= 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'Security-Critical: Verification',
        description: 'M8≥4 requires standard verification of security requirements, interfaces, degraded modes, and recovery behavior',
        processes: [25],
        minLevel: 'standard',
        source: 'Framework policy informed by NIST SP 800-160 and NIST SP 800-82 Rev. 3'
    },
    // =====================================================================
    // BINDING EXTERNAL ASSURANCE OVERRIDES (M15 plus scoped evidence)
    // =====================================================================
    {
        id: 'binding_assurance_cm',
        condition: 'M15 >= 4 + confirmed scoped binding obligation → Process 13 ≥ Standard',
        trigger: { type: 'binding-assurance', metric: 'M15', op: '>=', value: 4 },
        label: 'Binding Assurance: Configuration Management',
        description: 'A confirmed binding obligation requires formal baseline control, traceability, and audit evidence',
        processes: [13],
        minLevel: 'standard',
        source: 'Framework policy; obligation authority and instrument are recorded in the assessment'
    },
    {
        id: 'binding_assurance_info',
        condition: 'M15 >= 4 + confirmed scoped binding obligation → Process 14 ≥ Standard',
        trigger: { type: 'binding-assurance', metric: 'M15', op: '>=', value: 4 },
        label: 'Binding Assurance: Information Management',
        description: 'A confirmed binding obligation requires retrievable, controlled evidence and decision records',
        processes: [14],
        minLevel: 'standard',
        source: 'Framework policy; obligation authority and instrument are recorded in the assessment'
    },
    {
        id: 'binding_assurance_qa',
        condition: 'M15 >= 4 + confirmed scoped binding obligation → Process 16 ≥ Standard',
        trigger: { type: 'binding-assurance', metric: 'M15', op: '>=', value: 4 },
        label: 'Binding Assurance: Quality Assurance',
        description: 'A confirmed binding obligation requires planned assurance, auditability, and acceptance evidence',
        processes: [16],
        minLevel: 'standard',
        source: 'Framework policy; obligation authority and instrument are recorded in the assessment'
    },
    {
        id: 'binding_assurance_verification',
        condition: 'M15 >= 4 + confirmed scoped binding obligation → Process 25 ≥ Standard',
        trigger: { type: 'binding-assurance', metric: 'M15', op: '>=', value: 4 },
        label: 'Binding Assurance: Verification',
        description: 'A confirmed binding obligation requires controlled verification evidence for the named acceptance authority',
        processes: [25],
        minLevel: 'standard',
        source: 'Framework policy; obligation authority and instrument are recorded in the assessment'
    },
    // =====================================================================
    // INTEGRATION & COMPLEXITY OVERRIDES
    // =====================================================================
    {
        id: 'multi_contractor_integration',
        condition: 'M4 >= 4 → Process 24 ≥ Standard',
        trigger: { type: 'metric', metric: 'M4', op: '>=', value: 4 },
        label: 'Multi-Contractor: Integration',
        description: 'M4≥4 requires standard integration with formal interface control and cross-contractor coordination',
        processes: [24],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.8'
    },
    {
        id: 'multi_contractor_cm',
        condition: 'M4 >= 4 → Process 13 ≥ Standard',
        trigger: { type: 'metric', metric: 'M4', op: '>=', value: 4 },
        label: 'Multi-Contractor: Configuration Management',
        description: 'M4≥4 requires standard CM with multi-party baseline coordination and change control',
        processes: [13],
        minLevel: 'standard',
        source: 'ISO 15288 §6.3.5'
    },
    {
        id: 'novel_tech_decision',
        condition: 'M3 >= 4 → Process 11 ≥ Standard',
        trigger: { type: 'metric', metric: 'M3', op: '>=', value: 4 },
        label: 'Novel Technology: Decision Management',
        description: 'M3≥4 requires traceable decisions for novel-technology trade-offs and uncertainty handling',
        processes: [11],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    },
    {
        id: 'novel_tech_analysis',
        condition: 'M3 >= 4 → Process 22 ≥ Standard',
        trigger: { type: 'metric', metric: 'M3', op: '>=', value: 4 },
        label: 'Novel Technology: System Analysis',
        description: 'M3≥4 requires standard system analysis with trade studies, modeling, and technology risk mitigation',
        processes: [22],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.6; NASA NPR 7123.1'
    },
    {
        id: 'novel_tech_verification',
        condition: 'M3 >= 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M3', op: '>=', value: 4 },
        label: 'Novel Technology: Verification',
        description: 'M3≥4 requires stronger confirmation evidence for novel or unproven technology behavior',
        processes: [25],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    },
    // =====================================================================
    // ENVIRONMENTAL OVERRIDES (M7-based)
    // =====================================================================
    {
        id: 'env_critical_design',
        condition: 'M7 = 5 → Process 21 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Design Definition',
        description: 'M7=5 requires design choices to explicitly address environmental constraints',
        processes: [21],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    },
    {
        id: 'env_critical_operation',
        condition: 'M7 = 5 → Process 28 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Operation',
        description: 'M7=5 (catastrophic environmental damage) requires standard operation with environmental monitoring and emergency response',
        processes: [28],
        minLevel: 'standard',
        source: 'Framework policy informed by ISO 14001 and ISO 15288 §6.4.12'
    },
    {
        id: 'env_critical_maintenance',
        condition: 'M7 = 5 → Process 29 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Maintenance',
        description: 'M7=5 requires maintenance discipline that preserves environmental compliance controls',
        processes: [29],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    },
    {
        id: 'env_critical_disposal',
        condition: 'M7 = 5 → Process 30 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Disposal',
        description: 'M7=5 requires standard disposal with environmental impact mitigation and regulatory compliance',
        processes: [30],
        minLevel: 'standard',
        source: 'ISO 14001; EPA regulations'
    },
    {
        id: 'env_critical_cm',
        condition: 'M7 = 5 → Process 13 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Configuration Management',
        description: 'M7=5 requires traceable baselines for environmental obligations and constraints',
        processes: [13],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    },
    {
        id: 'env_critical_info',
        condition: 'M7 = 5 → Process 14 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Information Management',
        description: 'M7=5 requires complete and retrievable environmental records',
        processes: [14],
        minLevel: 'standard',
        source: 'Framework policy summarized in the current manuscript §3.5'
    }
];

/**
 * External Standard Mapping
 * Maps external safety/security standards to metric thresholds.
 * 
 * NOTE: These are provided for REFERENCE ONLY. The actual tailoring
 * algorithm uses max-tier derivation, corroboration, and explicit overrides.
 * External standards trigger overrides via the OVERRIDE_CONDITIONS mechanism.
 */
export const EXTERNAL_STANDARD_MAPPING = [
    { standard: 'IEC 61508 SIL allocation', metric: 'M5, M15', threshold: 'Evidence only', notes: 'Record allocated integrity and any binding assurance regime separately; do not convert SIL directly to a metric score.' },
    { standard: 'DO-178C DAL allocation', metric: 'M5, M15', threshold: 'Evidence only', notes: 'DAL and certification evidence may inform safety consequence and binding assurance, but are not direct score equivalents.' },
    { standard: 'ISO 26262 ASIL allocation', metric: 'M5, M15', threshold: 'Evidence only', notes: 'ASIL and confirmation measures are evidence inputs, not direct five-point conversions.' },
    { standard: 'EN 50126/50128/50129 assurance obligations', metric: 'M5, M15', threshold: 'Evidence only', notes: 'Record safety consequence and binding lifecycle assurance obligations independently.' },
    { standard: 'IEC 62443 security requirements', metric: 'M8, M15', threshold: 'Evidence only', notes: 'Security levels describe target/capability requirements, not a direct security-consequence score.' },
    { standard: 'NIST SP 800-160 / SP 800-82', metric: 'M8', threshold: 'Evidence only', notes: 'Use system-boundary, protection-needs, consequence, architecture, and lifecycle evidence; the publications do not define this framework’s 1-5 scale.' }
];

/**
 * Consistency Rules (17 active rules plus retained migration identifiers)
 * HC = Hard Constraint (auto-enforced), WN = Warning (advisory)
 */
export const CONSISTENCY_RULES = [
    { id: 1, type: 'HC', trigger: { process: 18, level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' }, label: 'Stakeholder Needs ≥ Comprehensive → System Requirements Definition ≥ Standard', rationale: 'Comprehensive needs elicitation requires structured system requirements management.' },
    { id: 2, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 25, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Verification ≥ Standard', rationale: 'High-rigor requirements require formal verification planning and evidence.' },
    { id: 3, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 27, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Validation ≥ Standard', rationale: 'Comprehensive requirements require structured validation against stakeholder intent.' },
    { id: 4, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 13, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Configuration Management ≥ Standard', rationale: 'Comprehensive requirements require baseline and change control discipline.' },
    { id: 5, type: 'WN', active: false, deprecated: true, trigger: { process: 19, level: 'standard', op: '=' }, required: { process: 25, level: 'basic', op: '>=' }, label: 'System Requirements Definition = Standard → Verification ≥ Basic', rationale: 'Retired — trivially satisfied since Basic is the minimum possible level. Retained only for migration and ID stability.' },
    { id: 6, type: 'HC', trigger: { process: 20, level: 'comprehensive', op: '>=' }, required: { process: 21, level: 'standard', op: '>=' }, label: 'Architecture Definition ≥ Comprehensive → Design Definition ≥ Standard', rationale: 'Comprehensive architecture should be realized with structured design definition.' },
    { id: 7, type: 'WN', trigger: { process: 20, level: 'comprehensive', op: '>=' }, required: { process: 24, level: 'standard', op: '>=' }, label: 'Architecture Definition ≥ Comprehensive → Integration ≥ Standard', rationale: 'Complex architecture benefits from structured integration rigor.' },
    { id: '8a', type: 'HC', active: false, deprecated: true, aliasOf: 12, trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 9, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Standard → Project Planning ≥ Standard', rationale: 'Retired duplicate — use Rule 12. Retained only as a migration alias.' },
    { id: '8b', type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 9, level: 'comprehensive', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Project Planning ≥ Comprehensive', rationale: 'Comprehensive technical work benefits from comprehensive planning oversight.' },
    { id: 9, type: 'HC', trigger: { process: [25, 27], level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' }, label: 'Verification or Validation ≥ Comprehensive → System Requirements Definition ≥ Standard (Floor)', rationale: 'Comprehensive V&V must be backed by structured requirements baselines. This is a floor constraint: requirements rigor cannot be lower than V&V rigor demands.' },
    { id: 10, type: 'HC', trigger: { process: 24, level: 'comprehensive', op: '>=' }, required: { process: 25, level: 'standard', op: '>=' }, label: 'Integration ≥ Comprehensive → Verification ≥ Standard', rationale: 'Comprehensive integration requires corresponding verification maturity.' },
    { id: 11, type: 'WN', trigger: { process: 25, level: 'comprehensive', op: '>=' }, required: { process: 27, level: 'standard', op: '>=' }, label: 'Verification ≥ Comprehensive → Validation ≥ Standard', rationale: 'High-rigor verification should prompt review of validation rigor, while verification evidence alone does not prove stakeholder acceptance needs require a mandatory Validation floor.' },
    { id: 12, type: 'HC', trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 9, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Standard → Project Planning ≥ Standard', rationale: 'Basic planning cannot sustain higher-rigor technical execution. If any technical process exceeds Basic, Project Planning must be elevated to at least Standard; do not downgrade technical processes to satisfy this rule.' },
    { id: 13, type: 'WN', active: false, deprecated: true, trigger: { process: 12, level: 'basic', op: '=' }, required: { process: 11, level: 'standard', op: '>=' }, label: 'Risk Management = Basic → Decision Management ≥ Standard', rationale: 'Retired as non-monotone: increasing Risk Management from Basic to Standard removed the advisory Decision Management floor. Preserve the identifier for migration only; assess decision support directly from project evidence.' },
    { id: 14, type: 'WN', trigger: { process: 12, level: 'comprehensive', op: '>=' }, required: { process: 11, level: 'standard', op: '>=' }, label: 'Risk Management ≥ Comprehensive → Decision Management ≥ Standard', rationale: 'Comprehensive risk outputs should inform at least standard decision management.' },
    { id: 15, type: 'WN', trigger: { process: 28, level: 'comprehensive', op: '>=' }, required: { process: 29, level: 'standard', op: '>=' }, label: 'Operation ≥ Comprehensive → Maintenance ≥ Standard', rationale: 'Comprehensive operations produce data and workload requiring structured maintenance.' },
    { id: 16, type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 15, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Measurement ≥ Standard', rationale: 'Comprehensive technical rigor should be supported by structured measurement.' },
    { id: 17, type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 16, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Quality Assurance ≥ Standard', rationale: 'Comprehensive technical rigor should be supported by structured quality assurance.' },
    { id: 18, type: 'HC', trigger: { process: 23, level: 'comprehensive', op: '>=' }, required: { process: 24, level: 'standard', op: '>=' }, label: 'Implementation ≥ Comprehensive → Integration ≥ Standard', rationale: 'Formally-built components cannot be informally assembled without integration failures.' },
    { id: 19, type: 'WN', trigger: { process: 26, level: 'comprehensive', op: '>=' }, required: { process: 28, level: 'standard', op: '>=' }, label: 'Transition ≥ Comprehensive → Operation ≥ Standard', rationale: 'Formal transition planning without structured operations creates a handoff cliff.' },
    { id: 20, type: 'WN', active: false, deprecated: true, trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 13, level: 'basic', op: '>=' }, label: 'Any Technical Process ≥ Standard → Configuration Management ≥ Basic', rationale: 'Retired — trivially satisfied under the Never Zero model. Retained only for migration and ID stability.' }
];

/** Active semantic rules. Retired identifiers remain above for import/migration traceability. */
export const ACTIVE_CONSISTENCY_RULES = CONSISTENCY_RULES
    .filter(rule => rule.active !== false)
    .map(rule => ({
        ...rule,
        provenance: {
            evidenceMaturity: 'design-rationale',
            expertReviewStatus: 'pending-structured-review',
            severityRationale: rule.rationale,
            knownExceptions: [],
            owner: 'framework-governance-owner',
            lastReviewed: '2026-07-10'
        }
    }));

export const CONSISTENCY_RULE_MIGRATION = [
    { legacyId: 5, disposition: 'retired-vacuous', replacementId: null },
    { legacyId: '8a', disposition: 'alias', replacementId: 12 },
    { legacyId: 13, disposition: 'retired-non-monotone', replacementId: null },
    { legacyId: 20, disposition: 'retired-vacuous', replacementId: null }
];

/**
 * Direct-consequence mappings (18 active mappings plus retained migration identifiers)
 * type: 'mandatory' = auto-upgrade candidate, 'recommended' = advisory propagation
 */
export const PROPAGATION_RULES = [
    { id: 'P1', source: 18, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 1, rationale: 'Stakeholder needs at comprehensive level require structured system requirements.' },
    { id: 'P2', source: 19, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 2, rationale: 'Comprehensive requirements require formal verification rigor.' },
    { id: 'P3', source: 19, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 3, rationale: 'Comprehensive requirements require validation structure.' },
    { id: 'P4', source: 19, sourceLevel: 'comprehensive', target: 13, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 4, rationale: 'Comprehensive requirements require baseline and change control.' },
    { id: 'P5', active: false, deprecated: true, source: 19, sourceLevel: 'standard', sourceOp: '=', target: 25, minLevel: 'basic', type: 'recommended', depth: 1, ruleId: 5, rationale: 'Retired as vacuous. Retained for migration and ID stability.' },
    { id: 'P6', source: 20, sourceLevel: 'comprehensive', target: 21, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 6, rationale: 'Comprehensive architecture should flow into at least standard design definition.' },
    { id: 'P7', source: 20, sourceLevel: 'comprehensive', target: 24, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 7, rationale: 'Comprehensive architecture generally benefits from standard integration rigor.' },
    { id: 'P8a', active: false, deprecated: true, aliasOf: 'P13', source: 'any_technical', sourceLevel: 'standard', target: 9, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: '8a', rationale: 'Retired duplicate of P13. Retained as a migration alias.' },
    { id: 'P8b', source: 'any_technical', sourceLevel: 'comprehensive', target: 9, minLevel: 'comprehensive', type: 'recommended', depth: 1, ruleId: '8b', rationale: 'Comprehensive technical work benefits from comprehensive planning oversight.' },
    { id: 'P9', source: 25, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 9, rationale: 'Comprehensive verification requires structured requirements baselines.' },
    { id: 'P10', source: 27, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 9, rationale: 'Comprehensive validation requires structured requirements baselines.' },
    { id: 'P11', source: 24, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 10, rationale: 'Comprehensive integration should be matched by at least standard verification.' },
    { id: 'P12', source: 25, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'recommended', depth: 2, ruleId: 11, rationale: 'Comprehensive verification typically supports standard-or-higher validation.' },
    { id: 'P13', source: 'any_technical', sourceLevel: 'standard', target: 9, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 12, rationale: 'Any technical process above basic requires at least standard project planning.' },
    { id: 'P14', active: false, deprecated: true, source: 12, sourceLevel: 'basic', sourceOp: '=', target: 11, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 13, rationale: 'Retired with non-monotone Rule 13. Retained only for migration and ID stability.' },
    { id: 'P15', source: 12, sourceLevel: 'comprehensive', target: 11, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 14, rationale: 'Comprehensive risk outputs should be reflected in decision-management rigor.' },
    { id: 'P16', source: 28, sourceLevel: 'comprehensive', target: 29, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 15, rationale: 'Comprehensive operations should be paired with structured maintenance.' },
    { id: 'P17', source: 'any_technical', sourceLevel: 'comprehensive', target: 15, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 16, rationale: 'Comprehensive technical work should be supported by structured measurement.' },
    { id: 'P18', source: 'any_technical', sourceLevel: 'comprehensive', target: 16, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 17, rationale: 'Comprehensive technical work should be supported by structured quality assurance.' },
    { id: 'P19', source: 23, sourceLevel: 'comprehensive', target: 24, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 18, rationale: 'Formally-built components cannot be informally assembled.' },
    { id: 'P20', source: 26, sourceLevel: 'comprehensive', target: 28, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 19, rationale: 'Formal transition planning requires structured operational handoff.' },
    { id: 'P21', active: false, deprecated: true, source: 'any_technical', sourceLevel: 'standard', target: 13, minLevel: 'basic', type: 'recommended', depth: 1, ruleId: 20, rationale: 'Retired as vacuous. Retained for migration and ID stability.' }
];

/** Active direct-consequence mappings. Retired entries remain available for migration traceability. */
export const ACTIVE_PROPAGATION_RULES = PROPAGATION_RULES.filter(rule => rule.active !== false);

export const PROPAGATION_RULE_MIGRATION = [
    { legacyId: 'P5', disposition: 'retired-vacuous', replacementId: null },
    { legacyId: 'P8a', disposition: 'alias', replacementId: 'P13' },
    { legacyId: 'P14', disposition: 'retired-non-monotone', replacementId: null },
    { legacyId: 'P21', disposition: 'retired-vacuous', replacementId: null }
];

/**
 * Dependency Chains
 * Named process sequences representing key ISO 15288 / Vee Model relationships.
 * Used in the Interdependency View to visualize process groupings.
 */
export const DEPENDENCY_CHAINS = [
    {
        id: 'req_design',
        name: 'Requirements → Design → Implementation',
        processes: [17, 18, 19, 20, 21, 23],
        description: 'Vee Model left side: Each process depends on outputs from the previous. Business analysis → stakeholder needs → system requirements → architecture → design → implementation. Avoid rigor gaps greater than one level between adjacent processes.'
    },
    {
        id: 'vv_loop',
        name: 'V&V Traceability Loop',
        processes: [19, 24, 25, 27, 18],
        description: 'Vee Model right side: V&V levels should be at least as rigorous as the processes producing their test/acceptance bases. Requirements → verification tracing. Stakeholder needs → validation tracing. Integration provides the verified baseline.'
    },
    {
        id: 'integration_chain',
        name: 'Architecture → Integration → Verification',
        processes: [20, 24, 25],
        description: 'Per ISO 15288 §6.4.4/8/9: Architecture defines the integration strategy and interface sequences. Integrated system elements form the subject of verification. These three processes form a tight triad.'
    },
    {
        id: 'mgmt_support',
        name: 'Technical Management Support',
        processes: [9, 10, 12, 11, 15, 16],
        description: 'Framework advisory chain: higher-rigor technical work should prompt review of planning, assessment, risk, decision, measurement, and QA support. INCOSE process relationships inform the review but do not prescribe identical level floors.'
    },
    {
        id: 'config_backbone',
        name: 'Configuration & Information Backbone',
        processes: [13, 14, 8],
        description: 'Framework advisory chain: Configuration Management and Information Management are cross-cutting enablers whose evidence burden should be reviewed against technical baseline and traceability needs. ISO 15288 process relationships do not prescribe identical level matching.'
    },
    {
        id: 'operational_feedback',
        name: 'Operational Lifecycle',
        processes: [26, 28, 29, 30],
        description: 'Per ISO 15288 §6.4.10–13: Transition → Operation → Maintenance → Disposal. Operational data feeds back into maintenance (FRACAS loop). Disposal must address safety and environmental concerns from operations.'
    },
    {
        id: 'safety_assurance',
        name: 'Safety Assurance Thread',
        processes: [12, 19, 20, 22, 25, 27],
        description: 'Per EN 50126/IEC 61508: Safety-critical processes form a thread through the lifecycle. Risk Management produces the hazard log, which drives safety requirements, architecture (SIL allocation), analysis (FMEA/FTA), verification (safety testing), and validation (safety acceptance).'
    },
    {
        id: 'analysis_decision',
        name: 'System Analysis → Decision Support',
        processes: [22, 11, 20, 21],
        description: 'Per ISO 15288 §6.4.6: System Analysis (trade studies, modeling, simulation) provides evidence to Decision Management, which in turn informs architecture and design trade-offs.'
    }
];

// =====================================================================
// DEPRECATED LEGACY SA RULES
// =====================================================================
// SA_CRITICALITY_TIERS and SA_FLOOR_RULE have been deprecated.
// SA floors are now integrated into OVERRIDE_CONDITIONS as process-specific overrides.
// This provides explicit, auditable traceability for each SA floor application.
//
// For reference, the active SA floor logic is:
//   - M5 = 1-3: No SA floor (Tier I – Baseline Safety Assurance)
//   - M5 = 4: SA floor = Standard for safety-critical processes (Tier II – Safety Relevant)
//   - M5 = 5: SA floor = Comprehensive for life-safety processes (Tier III – Safety Critical)
//
// See OVERRIDE_CONDITIONS for explicit SA floor implementations:
//   - life_safety_* overrides (M5=5 → Comprehensive)
//   - safety_critical_* overrides (M5=4 → Standard)
// =====================================================================

export const SA_STANDARDS_REFERENCE = [
    { id: 'en50126', name: 'EN 50126-1/-2', application: 'Railway RAMS' },
    { id: 'en50129', name: 'EN 50129', application: 'Safety-related electronic systems' },
    { id: 'csar114', name: 'CSA R114:22', application: 'Canadian risk evaluation' },
    { id: 'nfpa130', name: 'NFPA 130', application: 'Fixed guideway transit' },
    { id: 'iec61508', name: 'IEC 61508', application: 'Functional safety (all industries)' }
];

// =====================================================================
// RIGHT-SIZING: Derived Indices & Rigor Governance (Integrated Evaluation)
// =====================================================================

/**
 * Rigor budget table: max Comprehensive and guideline Standard counts by PSI.
 * PSI 1-2 = small, PSI 3 = medium, PSI 4-5 = large/mega.
 */
export const RIGOR_BUDGET = [
    { psiMin: 1, psiMax: 2, label: 'Small', maxComprehensive: 3, typicalStandardRange: [6, 8], notes: 'Remainder Basic by design' },
    { psiMin: 3, psiMax: 3, label: 'Medium', maxComprehensive: 8, typicalStandardRange: [8, 12], notes: 'At least ~25% Basic' },
    { psiMin: 4, psiMax: 5, label: 'Large/Mega', maxComprehensive: 22, typicalStandardRange: [0, 22], notes: 'Flag if >70% Comprehensive; exec review required' }
];

/**
 * Adoption-readiness guidance by CRI.
 * CRI never lowers technically required rigor; it flags implementation support
 * needed when the assessed enabling conditions do not support the required profile.
 */
export const ADOPTION_READINESS_GUIDANCE = [
    {
        cri: 1,
        label: 'Constrained Enabling Conditions',
        triggerLevel: 'standard',
        comprehensiveSeverity: 'high',
        standardSeverity: 'medium',
        notes: 'Clarify decision authority, secure leadership support and resources, enable safe challenge, and provide independent SE or assurance support for high-rigor processes.'
    },
    {
        cri: 2,
        label: 'Mixed Enabling Conditions',
        triggerLevel: 'comprehensive',
        comprehensiveSeverity: 'medium',
        notes: 'Resolve uneven authority, resources, incentives, learning mechanisms, or challenge pathways and provide focused support for Comprehensive processes.'
    },
    {
        cri: 3,
        label: 'Strong Enabling Conditions',
        triggerLevel: null,
        comprehensiveSeverity: 'low',
        notes: 'No readiness gap flag; retain normal governance, learning, and continuous improvement.'
    }
];

/**
 * Process priority classes for structured reduction.
 * When rigor budget is exceeded, downgrade from lowest priority first.
 * Safety/regulatory overrides are never downgraded regardless of priority.
 */
export const PROCESS_PRIORITY_CLASSES = {
    core: {
        label: 'Core High-Leverage',
        description: 'Always keep highest where triggered',
        processes: [12, 18, 19, 20, 24, 25, 27, 13]
    },
    contextSensitive: {
        label: 'Context-Sensitive',
        description: 'Keep high if metrics strongly drive them',
        processes: [9, 10, 11, 14]
    },
    secondary: {
        label: 'Secondary',
        description: 'Lower leverage for small projects',
        processes: [15, 16, 17, 21, 22, 23, 26, 28, 29, 30]
    }
};

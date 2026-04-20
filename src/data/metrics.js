/**
 * SE Tailoring Model — Metrics & Assessment Data
 * _VERSION: 4.0 | _LAST_UPDATED: 2026-02-28
 * _SOURCE: 01-PAPER/03-Methodology.md, 02-PRACTICAL/Assessment-Worksheet.md
 * _SYNC_CONTRACT:
 *   - Canonical algorithm: 01-PAPER/03-Methodology.md §3.4 (v4.0 Simplified)
 *   - Canonical process/metric map: 02-PRACTICAL/Process-Metric-Applicability-Matrix.md
 *   - Canonical overrides: 01-PAPER/06-Interdependencies.md §6.4
 * 
 * V4.0 CHANGES:
 *   - Removed weighted score calculations (no P=2/S=1 weighting)
 *   - Replaced conditional derivation with "highest tier wins" algorithm
 *   - Simplified override conditions (process-specific, not blanket exclusions)
 *   - Added SA floor conditions as explicit overrides
 *   - Enhanced guided questions with clear decision trees
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
        id: 'M3', name: 'Technology Maturity', dimension: 'complexity',
        anchors: { 1: 'Proven technologies', 3: 'Mix of mature and emerging', 5: 'Novel or unproven' },
        guidedQuestions: [
            {
                text: "Does the system rely on BLEEDING-EDGE technologies at TRL 1-4 (basic research to lab validation)?",
                yesScore: 5,
                rationale: 'Unproven technology with high technical risk'
            },
            {
                text: "Does the system use EMERGING technologies at TRL 5-6 that have not been widely adopted in your industry?",
                yesScore: 4,
                rationale: 'Limited industry track record, requires validation'
            },
            {
                text: "Is the system a MIX of mature technologies (TRL 7-8) with some recent but proven innovations?",
                yesScore: 3,
                rationale: 'Mostly proven with minor new elements'
            },
            {
                text: "Are ALL core technologies fully mature (TRL 9) with extensive industry deployment, even if in a new configuration?",
                yesScore: 2,
                rationale: 'Low technology risk'
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
                rationale: 'Safety-Relevant (Tier 2) – Requires safety engineer separate from design'
            },
            {
                text: "Are there only INDIRECT safety implications (e.g., situational awareness, minor ergonomic issues) with no direct injury potential?",
                yesScore: 2,
                rationale: 'Negligible (Tier 1) – No specific SA independence requirements'
            }
        ]
    },
    {
        id: 'M6', name: 'Mission & Security Criticality', dimension: 'safety',
        anchors: { 1: 'Low mission impact, isolated network', 3: 'Moderate impact, segmented data', 5: 'Mission-critical, life-safety cyber' },
        guidedQuestions: [
            {
                text: "Would system compromise or failure result in COMPLETE INABILITY to perform primary mission or expose life-safety cyber vectors (e.g., CBTC networks, SCADA)?",
                yesScore: 5,
                rationale: 'Catastrophic mission impact or life-safety cyber risk'
            },
            {
                text: "Would failure/compromise SEVERELY DEGRADE mission performance or expose critical operational data, requiring immediate emergency response?",
                yesScore: 4,
                rationale: 'Major mission/security degradation requiring emergency workarounds'
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
        id: 'M8', name: 'Regulatory Compliance', dimension: 'safety',
        anchors: { 1: 'Minimal requirements', 3: 'Standard compliance', 5: 'Extensive regulatory framework' },
        guidedQuestions: [
            {
                text: "Is the system subject to an EXTENSIVE, COMPLEX web of strict federal/international regulations requiring rigorous independent certification (e.g., DO-178C DAL A, ISO 26262 ASIL D)?",
                yesScore: 5,
                rationale: 'Highest regulatory burden with independent certification required'
            },
            {
                text: "Are there SIGNIFICANT, SPECIFIC regulatory standards that mandate formal auditing, traceability, and compliance reporting (e.g., FDA 21 CFR Part 820, EN 50129)?",
                yesScore: 4,
                rationale: 'High regulatory burden with formal compliance evidence required'
            },
            {
                text: "Does the system need to comply with STANDARD industry codes and municipal regulations (e.g., building codes, NFPA 130)?",
                yesScore: 3,
                rationale: 'Standard regulatory compliance'
            },
            {
                text: "Are there only BASIC internal policies or minor local guidelines to follow with no formal external oversight?",
                yesScore: 2,
                rationale: 'Minimal regulatory requirements'
            }
        ]
    },
    {
        id: 'M9', name: 'Schedule Pressure', dimension: 'constraints',
        anchors: { 1: 'Flexible timeline', 3: 'Moderate constraints', 5: 'Aggressive, immovable deadlines' },
        guidedQuestions: [
            {
                text: "Are there AGGRESSIVE, IMMOVABLE deadlines where ANY delay causes catastrophic project failure or massive financial penalties (>$500K/week)?",
                yesScore: 5,
                rationale: 'Extreme schedule pressure with zero tolerance for delay'
            },
            {
                text: "Is the schedule VERY TIGHT requiring frequent concurrent engineering, significant planned overtime, and critical path compression?",
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
                text: "Is the budget CAREFULLY MANAGED with standard management reserves (10-15%) and contingencies in place?",
                yesScore: 3,
                rationale: 'Standard budget management'
            },
            {
                text: "Are funds ADEQUATELY PROVISIONED with comfortable margins for error (>20% contingency)?",
                yesScore: 2,
                rationale: 'Low budget pressure'
            }
        ]
    },
    {
        id: 'M11', name: 'Team Experience', dimension: 'constraints',
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
        id: 'M12', name: 'Geographic Distribution', dimension: 'constraints',
        anchors: { 1: 'Co-located', 3: 'Partially distributed', 5: 'Globally distributed' },
        guidedQuestions: [
            {
                text: "Is the team GLOBALLY DISTRIBUTED across MULTIPLE incompatible time zones (>8 hour spread) with significant language/cultural barriers?",
                yesScore: 5,
                rationale: 'Extreme distribution with major coordination challenges'
            },
            {
                text: "Are KEY development, testing, and management teams located in DISTINCTLY DIFFERENT geographical regions making real-time coordination difficult?",
                yesScore: 4,
                rationale: 'High distribution requiring formal coordination'
            },
            {
                text: "Is the team PARTIALLY DISTRIBUTED, perhaps across a few regional offices or a hybrid remote model within compatible time zones?",
                yesScore: 3,
                rationale: 'Moderate distribution with some coordination needs'
            },
            {
                text: "Is the team MOSTLY CO-LOCATED with only occasional remote contributors or single time-zone distribution?",
                yesScore: 2,
                rationale: 'Low distribution – easy coordination'
            }
        ]
    },
    {
        id: 'M13', name: 'Stakeholder Count', dimension: 'stakeholder',
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
                text: "Are requirements expected to CHANGE CONSTANTLY due to extreme uncertainty, shifting market forces, or political whims throughout development?",
                yesScore: 5,
                rationale: 'Extreme volatility – requirements unstable throughout lifecycle'
            },
            {
                text: "Is there HIGH VOLATILITY with MAJOR requirements likely to be discovered or fundamentally altered LATE in the development cycle?",
                yesScore: 4,
                rationale: 'High volatility with late-stage changes expected'
            },
            {
                text: "Are there MODERATE EXPECTED CHANGES requiring a formal change control board and baseline management?",
                yesScore: 3,
                rationale: 'Standard volatility with formal change control'
            },
            {
                text: "Are requirements MOSTLY STABLE with only minor, well-understood refinements anticipated?",
                yesScore: 2,
                rationale: 'Low volatility – stable requirements baseline'
            }
        ]
    },
    {
        id: 'M15', name: 'Political Sensitivity', dimension: 'stakeholder',
        anchors: { 1: 'Low public interest', 3: 'Moderate political factors', 5: 'High-profile, politically sensitive' },
        guidedQuestions: [
            {
                text: "Is the project HIGHLY VISIBLE to the GENERAL PUBLIC and MEDIA where FAILURE would cause a MASSIVE POLITICAL SCANDAL or career-ending consequences?",
                yesScore: 5,
                rationale: 'Extreme political visibility with scandal potential'
            },
            {
                text: "Does the project attract SIGNIFICANT SCRUTINY from TOP EXECUTIVES, board members, industry regulators, or elected officials?",
                yesScore: 4,
                rationale: 'High executive/regulatory scrutiny'
            },
            {
                text: "Are there MODERATE ORGANIZATIONAL POLITICS and cross-departmental turf issues to navigate?",
                yesScore: 3,
                rationale: 'Moderate internal political factors'
            },
            {
                text: "Is there SOME MINOR INTERNAL VISIBILITY but generally treated as a STANDARD OPERATIONAL PROJECT?",
                yesScore: 2,
                rationale: 'Low political sensitivity'
            }
        ]
    },
    {
        id: 'M16', name: 'Organizational Culture', dimension: 'stakeholder',
        anchors: { 1: 'Resistant (SE = overhead)', 3: 'Tolerant (show value)', 5: 'Supportive (actively invests)' },
        note: 'Primarily shapes adoption strategy; contributes weakly to derived levels per v4.0.',
        guidedQuestions: [
            {
                text: "Does the EXECUTIVE TEAM MANDATE and ACTIVELY INVEST HEAVILY in rigorous SE practices across the organization with dedicated funding and headcount?",
                yesScore: 5,
                rationale: 'Strong SE culture with executive sponsorship'
            },
            {
                text: "Is there FORMAL, DOCUMENTED SUPPORT for SE, though implementation might sometimes be inconsistent across projects?",
                yesScore: 4,
                rationale: 'Formal SE support with variable implementation'
            },
            {
                text: "Is the organization TOLERANT of SE but REQUIRES PRACTITIONERS TO CONSTANTLY PROVE ITS VALUE on each project?",
                yesScore: 3,
                rationale: 'Tolerant but skeptical – value must be demonstrated'
            },
            {
                text: "Is there ACTIVE SKEPTICISM toward Systems Engineering, generally viewing it mostly as DOCUMENTATION OVERHEAD with no tangible value?",
                yesScore: 2,
                rationale: 'Resistant culture – SE seen as bureaucracy'
            }
        ]
    }
];

// Process-Metric Applicability Matrix: P = Primary, S = Secondary
// Key: processId -> { metricId: 'P' | 'S' }
// 
// V4.0 NOTE: P/S designations are for REFERENCE and DOCUMENTATION ONLY.
// The algorithm treats ALL applicable metrics (P+S) equally using "highest tier wins".
// There is NO weighted scoring (no P=2, S=1 weighting) in v4.0.
// Source: 02-PRACTICAL/Process-Metric-Applicability-Matrix.md
// V4.1 NOTE: M9 (Schedule Pressure) and M10 (Budget Constraints) are EXCLUDED
// from process-level driving. High constraint scores mean "less budget/time available"
// which should LIMIT rigor, not inflate it. M9/M10 feed into CSI (Constraint Stress
// Index) which governs right-sizing caps and priority-based reduction instead.
export const METRIC_PROCESS_MAP = {
    9: { M1: 'P', M4: 'P', M12: 'S', M13: 'S' },
    10: { M1: 'P', M4: 'P', M13: 'S', M15: 'S' },
    11: { M1: 'P', M3: 'P', M6: 'P', M13: 'P', M15: 'P', M8: 'S', M12: 'S' },
    12: { M5: 'P', M6: 'P', M8: 'P', M1: 'S', M2: 'S' },
    13: { M2: 'P', M8: 'P', M12: 'S', M14: 'S' },
    14: { M8: 'P', M12: 'P', M13: 'S', M15: 'S' },
    15: { M6: 'P', M8: 'P', M14: 'S' },
    16: { M5: 'P', M8: 'P', M11: 'S', M13: 'S', M15: 'S' },
    17: { M6: 'P', M13: 'P', M8: 'S', M15: 'S' },
    18: { M13: 'P', M14: 'P', M15: 'S' },
    19: { M1: 'P', M2: 'P', M5: 'S', M8: 'S', M14: 'S' },
    20: { M1: 'P', M2: 'P', M3: 'P', M6: 'S', M5: 'S', M11: 'S' },
    21: { M1: 'P', M3: 'P', M5: 'S', M8: 'S', M11: 'S' },
    22: { M1: 'P', M3: 'P', M6: 'S', M2: 'S', M4: 'S', M5: 'S' },
    23: { M1: 'P', M4: 'P', M11: 'P', M3: 'S' },
    24: { M2: 'P', M4: 'P', M12: 'P', M5: 'S', M11: 'S' },
    25: { M2: 'P', M4: 'P', M5: 'P', M8: 'S' },
    26: { M6: 'P', M12: 'P', M4: 'S', M13: 'S', M15: 'S', M16: 'S' },
    27: { M5: 'P', M6: 'P', M13: 'P', M8: 'S', M14: 'S', M15: 'S' },
    28: { M5: 'P', M6: 'P', M7: 'P', M11: 'S', M12: 'S', M16: 'S' },
    29: { M5: 'P', M7: 'P', M4: 'S', M11: 'S' },
    30: { M7: 'P', M8: 'P', M15: 'S', M16: 'S' }
};

// Level thresholds per process (v4.0 Simplified - "Highest Tier Wins")
// Algorithm: Trigger Tier = MAX(Tier(M₁), Tier(M₂), ...) where Tier(score): 1-2→Basic, 3-4→Standard, 5→Comprehensive
// These thresholds are provided for REFERENCE ONLY. The actual derivation uses the simple highest-tier-wins rule.
// V4.1: M9/M10 removed from all thresholds — they are constraint metrics that feed CSI only
export const LEVEL_THRESHOLDS = {
    9: { standard: 'M1≥3 or M4≥3', comprehensive: 'M1≥4 or M4≥4', primaryMetrics: ['M1', 'M4'], secondaryMetrics: ['M12', 'M13'] },
    10: { standard: 'M1≥3 or M4≥3', comprehensive: 'M1≥4 or M4≥4', primaryMetrics: ['M1', 'M4'], secondaryMetrics: ['M13', 'M15'] },
    11: { standard: 'M1≥3 or M6≥3 or M13≥3 or M15≥3', comprehensive: 'M1≥4 or M6≥4 or M13≥4 or M15≥4', primaryMetrics: ['M1', 'M3', 'M6', 'M13', 'M15'], secondaryMetrics: ['M8', 'M12'] },
    12: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 or M6≥4', primaryMetrics: ['M5', 'M6', 'M8'], secondaryMetrics: ['M1', 'M2'] },
    13: { standard: 'M2≥3 or M8≥3', comprehensive: 'M2≥4 or M8≥4', primaryMetrics: ['M2', 'M8'], secondaryMetrics: ['M12', 'M14'] },
    14: { standard: 'M8≥3 or M12≥3', comprehensive: 'M8≥4 or M12≥4', primaryMetrics: ['M8', 'M12'], secondaryMetrics: ['M13', 'M15'] },
    15: { standard: 'M6≥3 or M8≥3', comprehensive: 'M6≥4 or M8≥4', primaryMetrics: ['M6', 'M8'], secondaryMetrics: ['M14'] },
    16: { standard: 'M5≥3 or M8≥3', comprehensive: 'M5≥4 or M8≥4', primaryMetrics: ['M5', 'M8'], secondaryMetrics: ['M11', 'M13', 'M15'] },
    17: { standard: 'M6≥3 or M13≥3', comprehensive: 'M6≥4 or M13≥4', primaryMetrics: ['M6', 'M13'], secondaryMetrics: ['M8', 'M15'] },
    18: { standard: 'M13≥3 or M14≥3', comprehensive: 'M13≥4 or M14≥4', primaryMetrics: ['M13', 'M14'], secondaryMetrics: ['M15'] },
    19: { standard: 'M5≥3 or M2≥3', comprehensive: 'M5≥4 or M2≥4', primaryMetrics: ['M5', 'M2'], secondaryMetrics: ['M8', 'M14'] },
    20: { standard: 'M1≥3 or M6≥3', comprehensive: 'M1≥4 or M6≥4', primaryMetrics: ['M1', 'M6'], secondaryMetrics: ['M2', 'M3', 'M5', 'M11'] },
    21: { standard: 'M1≥3 or M3≥3', comprehensive: 'M1≥4 or M3≥4', primaryMetrics: ['M1', 'M3'], secondaryMetrics: ['M5', 'M8', 'M11'] },
    22: { standard: 'M1≥3 or M6≥3', comprehensive: 'M1≥4 or M6≥4', primaryMetrics: ['M1', 'M6'], secondaryMetrics: ['M2', 'M3', 'M4', 'M5'] },
    23: { standard: 'M1≥3 or M4≥3', comprehensive: 'M1≥4 or M4≥4', primaryMetrics: ['M1', 'M4'], secondaryMetrics: ['M3', 'M11'] },
    24: { standard: 'M2≥3 or M4≥3', comprehensive: 'M2≥4 or M4≥4', primaryMetrics: ['M2', 'M4'], secondaryMetrics: ['M5', 'M11', 'M12'] },
    25: { standard: 'M5≥3 or M2≥3', comprehensive: 'M5≥4 or M2≥4', primaryMetrics: ['M5', 'M2'], secondaryMetrics: ['M8'] },
    26: { standard: 'M6≥3 or M12≥3', comprehensive: 'M6≥4 or M12≥4', primaryMetrics: ['M6', 'M12'], secondaryMetrics: ['M4', 'M13', 'M15', 'M16'] },
    27: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 or M6≥4', primaryMetrics: ['M5', 'M6'], secondaryMetrics: ['M8', 'M13', 'M14', 'M15'] },
    28: { standard: 'M5≥3 or M6≥3', comprehensive: 'M5≥4 or M6≥4', primaryMetrics: ['M5', 'M6', 'M7'], secondaryMetrics: ['M11', 'M12', 'M16'] },
    29: { standard: 'M5≥3 or M7≥3', comprehensive: 'M5≥4 or M7≥4', primaryMetrics: ['M5', 'M7'], secondaryMetrics: ['M4', 'M11'] },
    30: { standard: 'M7≥3 or M8≥3', comprehensive: 'M7≥4 or M8≥4', primaryMetrics: ['M7', 'M8'], secondaryMetrics: ['M15', 'M16'] }
};

/**
 * Override Conditions (v4.0 - Process-Specific)
 * _SOURCE: 01-PAPER/06-Interdependencies.md §6.4, 02-PRACTICAL/Assessment-Worksheet.md
 * _SYNC_CONTRACT: Authoritative override baseline (10 conditions including SA floors).
 * 
 * V4.0 CHANGES:
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
        minLevel: 'standard',
        source: 'EN 50126/50129; IEC 61508; 01-PAPER/03-Methodology.md §3.4.4'
    },
    {
        id: 'life_safety_architecture',
        condition: 'M5 = 5 → Process 20 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: System Architecture Definition',
        description: 'M5=5 requires comprehensive architecture with SIL allocation and safety integrity verification',
        processes: [20],
        minLevel: 'standard',
        source: 'EN 50129; IEC 61508-2'
    },
    {
        id: 'life_safety_verification',
        condition: 'M5 = 5 → Process 25 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Verification',
        description: 'M5=5 requires comprehensive verification with independent safety testing and evidence',
        processes: [25],
        minLevel: 'standard',
        source: 'IEC 61508-3; DO-178C'
    },
    {
        id: 'life_safety_validation',
        condition: 'M5 = 5 → Process 27 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 5 },
        label: 'Life-Safety: Validation',
        description: 'M5=5 requires comprehensive validation with safety acceptance and operational hazard assessment',
        processes: [27],
        minLevel: 'standard',
        source: 'EN 50126; IEC 61508-7'
    },
    {
        id: 'safety_critical_risk',
        condition: 'M5 = 4 → Process 12 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Risk Management',
        description: 'M5=4 (severe injury potential) requires standard risk management with formal hazard log',
        processes: [12],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.9-10; IEC 61508'
    },
    {
        id: 'safety_critical_qa',
        condition: 'M5 = 4 → Process 16 ≥ Standard',
        trigger: { type: 'metric', metric: 'M5', op: '=', value: 4 },
        label: 'Safety-Critical: Quality Assurance',
        description: 'M5=4 requires standard QA with safety audit trail and compliance verification',
        processes: [16],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.12'
    },
    // =====================================================================
    // MISSION & SECURITY CRITICAL OVERRIDES (M6-based)
    // =====================================================================
    {
        id: 'mission_critical_risk',
        condition: 'M6 >= 4 → Process 12 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: Risk Management',
        description: 'M6≥4 requires standard risk management with threat modeling and mission failure analysis',
        processes: [12],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4; IEC 62443'
    },
    {
        id: 'mission_critical_cm',
        condition: 'M6 >= 4 → Process 13 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: Configuration Management',
        description: 'M6≥4 requires secure baseline control, patch management, and change tracking',
        processes: [13],
        minLevel: 'standard',
        source: 'IEC 62443; NIST 800-82'
    },
    {
        id: 'mission_critical_info',
        condition: 'M6 >= 4 → Process 14 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: Information Management',
        description: 'M6≥4 requires standard information management with data protection and access control',
        processes: [14],
        minLevel: 'standard',
        source: 'IEC 62443; NIST 800-82'
    },
    {
        id: 'mission_critical_architecture',
        condition: 'M6 >= 4 → Process 20 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: System Architecture Definition',
        description: 'M6≥4 requires standard architecture with redundancy and secure-by-design concepts',
        processes: [20],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.4'
    },
    {
        id: 'mission_critical_verification',
        condition: 'M6 >= 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: Verification',
        description: 'M6≥4 requires standard verification with mission success criteria validation',
        processes: [25],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.9'
    },
    {
        id: 'life_safety_cyber_verification',
        condition: 'M6 = 5 → Process 25 ≥ Comprehensive',
        trigger: { type: 'metric', metric: 'M6', op: '=', value: 5 },
        label: 'Life-Safety Cyber Risk: Verification',
        description: 'M6=5 requires comprehensive verification including penetration testing and cyber-physical V&V',
        processes: [25],
        minLevel: 'comprehensive',
        source: 'IEC 62443 SL4; NIST 800-82'
    },
    {
        id: 'mission_critical_validation',
        condition: 'M6 >= 4 → Process 27 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission-Critical: Validation',
        description: 'M6≥4 requires standard validation with operational mission effectiveness assessment',
        processes: [27],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.10'
    },
    {
        id: 'mission_critical_operation',
        condition: 'M6 >= 4 → Process 28 ≥ Standard',
        trigger: { type: 'metric', metric: 'M6', op: '>=', value: 4 },
        label: 'Mission/Security-Critical: Operation',
        description: 'M6≥4 requires standard operation with contingency procedures and emergency response',
        processes: [28],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.11'
    },
    // =====================================================================
    // REGULATORY OVERRIDES (M8-based)
    // =====================================================================
    {
        id: 'high_regulatory_cm',
        condition: 'M8 >= 4 → Process 13 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'High Regulatory: Configuration Management',
        description: 'M8≥4 requires standard CM with formal baseline control and audit trail for regulatory compliance',
        processes: [13],
        minLevel: 'standard',
        source: 'DO-178C; ISO 26262; EN 50129'
    },
    {
        id: 'high_regulatory_info',
        condition: 'M8 >= 4 → Process 14 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'High Regulatory: Information Management',
        description: 'M8≥4 requires standard information management with traceability and compliance documentation',
        processes: [14],
        minLevel: 'standard',
        source: 'FDA 21 CFR Part 820; DO-178C'
    },
    {
        id: 'high_regulatory_verification',
        condition: 'M8 >= 4 → Process 25 ≥ Standard',
        trigger: { type: 'metric', metric: 'M8', op: '>=', value: 4 },
        label: 'High Regulatory: Verification',
        description: 'M8≥4 requires standard verification with compliance evidence and regulatory audit support',
        processes: [25],
        minLevel: 'standard',
        source: 'DO-178C; ISO 26262'
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
        id: 'novel_tech_analysis',
        condition: 'M3 >= 4 → Process 22 ≥ Standard',
        trigger: { type: 'metric', metric: 'M3', op: '>=', value: 4 },
        label: 'Novel Technology: System Analysis',
        description: 'M3≥4 requires standard system analysis with trade studies, modeling, and technology risk mitigation',
        processes: [22],
        minLevel: 'standard',
        source: 'ISO 15288 §6.4.6; NASA NPR 7123.1'
    },
    // =====================================================================
    // ENVIRONMENTAL OVERRIDES (M7-based)
    // =====================================================================
    {
        id: 'env_critical_operation',
        condition: 'M7 = 5 → Process 28 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '=', value: 5 },
        label: 'Environmental Criticality: Operation',
        description: 'M7=5 (catastrophic environmental damage) requires standard operation with environmental monitoring and emergency response',
        processes: [28],
        minLevel: 'standard',
        source: 'ISO 14001; ISO 15288 §6.4.13'
    },
    {
        id: 'env_critical_disposal',
        condition: 'M7 >= 4 → Process 30 ≥ Standard',
        trigger: { type: 'metric', metric: 'M7', op: '>=', value: 4 },
        label: 'Environmental Criticality: Disposal',
        description: 'M7≥4 requires standard disposal with environmental impact mitigation and regulatory compliance',
        processes: [30],
        minLevel: 'standard',
        source: 'ISO 14001; EPA regulations'
    }
];

/**
 * External Standard Mapping (v4.0)
 * Maps external safety/security standards to metric thresholds.
 * 
 * V4.0 NOTE: These are provided for REFERENCE ONLY. The actual tailoring
 * algorithm uses the simplified highest-tier-wins approach with explicit overrides.
 * External standards trigger overrides via the OVERRIDE_CONDITIONS mechanism.
 */
export const EXTERNAL_STANDARD_MAPPING = [
    { standard: 'IEC 61508 SIL 2-3', metric: 'M5', threshold: '>= 4', notes: 'Safety-critical; triggers safety_critical_* overrides → Standard minimum for affected processes' },
    { standard: 'IEC 61508 SIL 4', metric: 'M5', threshold: '= 5', notes: 'Life-safety; triggers life_safety_* overrides → Comprehensive minimum for requirements, architecture, V&V' },
    { standard: 'DO-178C DAL A-C', metric: 'M5, M8', threshold: '>= 4', notes: 'Aviation software; safety + regulatory overrides apply' },
    { standard: 'ISO 26262 ASIL C-D', metric: 'M5, M8', threshold: '>= 4', notes: 'Automotive; safety + regulatory overrides apply' },
    { standard: 'EN 50126/8/9 SIL 3-4', metric: 'M5', threshold: '>= 4', notes: 'Railway; safety-critical overrides apply' },
    { standard: 'IEC 62443 SL 3-4', metric: 'M6', threshold: '>= 4', notes: 'Industrial cybersecurity; triggers mission_critical_* overrides → Standard min for Risk, CM, Info Mgmt' },
    { standard: 'NIST 800-82 / 53 High', metric: 'M6', threshold: '= 5', notes: 'US federal security controls; triggers life-safety cyber overrides' }
];

/**
 * Consistency Rules (canonical 20-rule baseline from Paper §6.6, v3.6.0)
 * HC = Hard Constraint (auto-enforced), WN = Warning (advisory)
 */
export const CONSISTENCY_RULES = [
    { id: 1, type: 'HC', trigger: { process: 18, level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' }, label: 'Stakeholder Needs ≥ Comprehensive → System Requirements Definition ≥ Standard', rationale: 'Comprehensive needs elicitation requires structured system requirements management.' },
    { id: 2, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 25, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Verification ≥ Standard', rationale: 'High-rigor requirements require formal verification planning and evidence.' },
    { id: 3, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 27, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Validation ≥ Standard', rationale: 'Comprehensive requirements require structured validation against stakeholder intent.' },
    { id: 4, type: 'HC', trigger: { process: 19, level: 'comprehensive', op: '>=' }, required: { process: 13, level: 'standard', op: '>=' }, label: 'System Requirements Definition ≥ Comprehensive → Configuration Management ≥ Standard', rationale: 'Comprehensive requirements require baseline and change control discipline.' },
    { id: 5, type: 'WN', trigger: { process: 19, level: 'standard', op: '=' }, required: { process: 25, level: 'basic', op: '>=' }, label: 'System Requirements Definition = Standard → Verification ≥ Basic', rationale: 'DEPRECATED (v3.6.0) — trivially satisfied since Basic is the minimum possible level. Retained for ID stability.' },
    { id: 6, type: 'HC', trigger: { process: 20, level: 'comprehensive', op: '>=' }, required: { process: 21, level: 'standard', op: '>=' }, label: 'Architecture Definition ≥ Comprehensive → Design Definition ≥ Standard', rationale: 'Comprehensive architecture should be realized with structured design definition.' },
    { id: 7, type: 'WN', trigger: { process: 20, level: 'comprehensive', op: '>=' }, required: { process: 24, level: 'standard', op: '>=' }, label: 'Architecture Definition ≥ Comprehensive → Integration ≥ Standard', rationale: 'Complex architecture benefits from structured integration rigor.' },
    { id: '8a', type: 'HC', trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 9, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Standard → Project Planning ≥ Standard', rationale: 'Standard or higher technical work requires structured project planning. Forward direction of Rule 12.' },
    { id: '8b', type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 9, level: 'comprehensive', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Project Planning ≥ Comprehensive', rationale: 'Comprehensive technical work benefits from comprehensive planning oversight.' },
    { id: 9, type: 'HC', trigger: { process: [25, 27], level: 'comprehensive', op: '>=' }, required: { process: 19, level: 'standard', op: '>=' }, label: 'Verification or Validation ≥ Comprehensive → System Requirements Definition ≥ Standard (Floor)', rationale: 'Comprehensive V&V must be backed by structured requirements baselines. This is a floor constraint: requirements rigor cannot be lower than V&V rigor demands.' },
    { id: 10, type: 'HC', trigger: { process: 24, level: 'comprehensive', op: '>=' }, required: { process: 25, level: 'standard', op: '>=' }, label: 'Integration ≥ Comprehensive → Verification ≥ Standard', rationale: 'Comprehensive integration requires corresponding verification maturity.' },
    { id: 11, type: 'HC', trigger: { process: 25, level: 'comprehensive', op: '>=' }, required: { process: 27, level: 'standard', op: '>=' }, label: 'Verification ≥ Comprehensive → Validation ≥ Standard', rationale: 'High-rigor verification requires at least standard validation to confirm stakeholder intent is met.' },
    { id: 12, type: 'HC', trigger: { process: 9, level: 'basic', op: '=' }, required: { process: 'all_technical', level: 'basic', op: '<=' }, label: 'Project Planning = Basic → All Technical Processes ≤ Basic (Strengthened)', rationale: 'Basic planning cannot sustain higher-rigor technical execution. If any technical process exceeds Basic, Project Planning must be elevated to at least Standard.' },
    { id: 13, type: 'WN', trigger: { process: 12, level: 'basic', op: '=' }, required: { process: 11, level: 'standard', op: '>=' }, label: 'Risk Management = Basic → Decision Management ≥ Standard', rationale: 'Basic risk inputs require structured decision-making as a compensating control. This is a floor, not a cap.' },
    { id: 14, type: 'WN', trigger: { process: 12, level: 'comprehensive', op: '>=' }, required: { process: 11, level: 'standard', op: '>=' }, label: 'Risk Management ≥ Comprehensive → Decision Management ≥ Standard', rationale: 'Comprehensive risk outputs should inform at least standard decision management.' },
    { id: 15, type: 'WN', trigger: { process: 28, level: 'comprehensive', op: '>=' }, required: { process: 29, level: 'standard', op: '>=' }, label: 'Operation ≥ Comprehensive → Maintenance ≥ Standard', rationale: 'Comprehensive operations produce data and workload requiring structured maintenance.' },
    { id: 16, type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 15, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Measurement ≥ Standard', rationale: 'Comprehensive technical rigor should be supported by structured measurement.' },
    { id: 17, type: 'WN', trigger: { process: 'any_technical', level: 'comprehensive', op: '>=' }, required: { process: 16, level: 'standard', op: '>=' }, label: 'Any Technical Process ≥ Comprehensive → Quality Assurance ≥ Standard', rationale: 'Comprehensive technical rigor should be supported by structured quality assurance.' },
    { id: 18, type: 'HC', trigger: { process: 23, level: 'comprehensive', op: '>=' }, required: { process: 24, level: 'standard', op: '>=' }, label: 'Implementation ≥ Comprehensive → Integration ≥ Standard', rationale: 'Formally-built components cannot be informally assembled without integration failures.' },
    { id: 19, type: 'WN', trigger: { process: 26, level: 'comprehensive', op: '>=' }, required: { process: 28, level: 'standard', op: '>=' }, label: 'Transition ≥ Comprehensive → Operation ≥ Standard', rationale: 'Formal transition planning without structured operations creates a handoff cliff.' },
    { id: 20, type: 'WN', trigger: { process: 'any_technical', level: 'standard', op: '>=' }, required: { process: 13, level: 'basic', op: '>=' }, label: 'Any Technical Process ≥ Standard → Configuration Management ≥ Basic', rationale: 'Structured technical work degrades without any baseline control.' }
];

/**
 * Propagation Rules (canonical baseline from Paper §6.7.2, P1..P21, v3.6.0)
 * type: 'mandatory' = auto-upgrade candidate, 'recommended' = advisory propagation
 */
export const PROPAGATION_RULES = [
    { id: 'P1', source: 18, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 1, rationale: 'Stakeholder needs at comprehensive level require structured system requirements.' },
    { id: 'P2', source: 19, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 2, rationale: 'Comprehensive requirements require formal verification rigor.' },
    { id: 'P3', source: 19, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 3, rationale: 'Comprehensive requirements require validation structure.' },
    { id: 'P4', source: 19, sourceLevel: 'comprehensive', target: 13, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 4, rationale: 'Comprehensive requirements require baseline and change control.' },
    { id: 'P5', source: 19, sourceLevel: 'standard', target: 25, minLevel: 'basic', type: 'recommended', depth: 1, ruleId: 5, rationale: 'DEPRECATED — trivially satisfied. Retained for ID stability.' },
    { id: 'P6', source: 20, sourceLevel: 'comprehensive', target: 21, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 6, rationale: 'Comprehensive architecture should flow into at least standard design definition.' },
    { id: 'P7', source: 20, sourceLevel: 'comprehensive', target: 24, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 7, rationale: 'Comprehensive architecture generally benefits from standard integration rigor.' },
    { id: 'P8a', source: 'any_technical', sourceLevel: 'standard', target: 9, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: '8a', rationale: 'Standard or higher technical work requires structured project planning.' },
    { id: 'P8b', source: 'any_technical', sourceLevel: 'comprehensive', target: 9, minLevel: 'comprehensive', type: 'recommended', depth: 1, ruleId: '8b', rationale: 'Comprehensive technical work benefits from comprehensive planning oversight.' },
    { id: 'P9', source: 25, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 9, rationale: 'Comprehensive verification requires structured requirements baselines.' },
    { id: 'P10', source: 27, sourceLevel: 'comprehensive', target: 19, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 9, rationale: 'Comprehensive validation requires structured requirements baselines.' },
    { id: 'P11', source: 24, sourceLevel: 'comprehensive', target: 25, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 10, rationale: 'Comprehensive integration should be matched by at least standard verification.' },
    { id: 'P12', source: 25, sourceLevel: 'comprehensive', target: 27, minLevel: 'standard', type: 'recommended', depth: 2, ruleId: 11, rationale: 'Comprehensive verification typically supports standard-or-higher validation.' },
    { id: 'P13', source: 9, sourceLevel: 'basic', target: 'all_technical', minLevel: 'basic', type: 'mandatory', depth: 1, ruleId: 12, rationale: 'Basic planning cannot sustain technical processes above basic.' },
    { id: 'P14', source: 12, sourceLevel: 'basic', target: 11, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 13, rationale: 'Basic risk inputs require structured decision-making as compensating control (floor, not cap).' },
    { id: 'P15', source: 12, sourceLevel: 'comprehensive', target: 11, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 14, rationale: 'Comprehensive risk outputs should be reflected in decision-management rigor.' },
    { id: 'P16', source: 28, sourceLevel: 'comprehensive', target: 29, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 15, rationale: 'Comprehensive operations should be paired with structured maintenance.' },
    { id: 'P17', source: 'any_technical', sourceLevel: 'comprehensive', target: 15, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 16, rationale: 'Comprehensive technical work should be supported by structured measurement.' },
    { id: 'P18', source: 'any_technical', sourceLevel: 'comprehensive', target: 16, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 17, rationale: 'Comprehensive technical work should be supported by structured quality assurance.' },
    { id: 'P19', source: 23, sourceLevel: 'comprehensive', target: 24, minLevel: 'standard', type: 'mandatory', depth: 1, ruleId: 18, rationale: 'Formally-built components cannot be informally assembled.' },
    { id: 'P20', source: 26, sourceLevel: 'comprehensive', target: 28, minLevel: 'standard', type: 'recommended', depth: 1, ruleId: 19, rationale: 'Formal transition planning requires structured operational handoff.' },
    { id: 'P21', source: 'any_technical', sourceLevel: 'standard', target: 13, minLevel: 'basic', type: 'recommended', depth: 1, ruleId: 20, rationale: 'Structured technical work needs at least basic baseline control.' }
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
        description: 'Per INCOSE SE Handbook: If any technical process ≥ Standard, planning, assessment, risk, decision, measurement, and QA should be ≥ Standard to provide adequate management oversight.'
    },
    {
        id: 'config_backbone',
        name: 'Configuration & Information Backbone',
        processes: [13, 14, 8],
        description: 'Per ISO 15288 §6.3.5–6.3.6: CM and Information Management are cross-cutting enablers. Their rigor level should match the highest technical process level to maintain baselines and traceability.'
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
// DEPRECATED IN v4.0
// =====================================================================
// SA_CRITICALITY_TIERS and SA_FLOOR_RULE have been DEPRECATED in v4.0.
// SA floors are now integrated into OVERRIDE_CONDITIONS as process-specific overrides.
// This provides explicit, auditable traceability for each SA floor application.
//
// For reference, the v4.0 SA floor logic is:
//   - M5 = 1-2: No SA floor (Tier I – Negligible)
//   - M5 = 3: SA floor = Standard for safety-relevant processes (Tier II – Safety Relevant)
//   - M5 = 4-5: SA floor = Comprehensive for safety-critical processes (Tier III – Safety Critical)
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
 * Capability ceilings by CRI.
 * CRI=1: cap at Standard except safety/regulatory overrides.
 * CRI=2: data-intensive processes capped at Standard unless PSI>=3.
 * CRI=3: no caps.
 */
export const CAPABILITY_CEILINGS = [
    { cri: 1, maxLevel: 'standard', label: 'Resistant / Low Capability', exemptMetrics: ['M5', 'M6', 'M7', 'M8'], notes: 'Override-exempt processes may still reach Comprehensive' },
    { cri: 2, maxLevel: 'comprehensive', label: 'Mixed / Moderate', dataIntensiveCap: 'standard', dataIntensiveProcesses: [14, 15, 16], psiExemptionThreshold: 3, notes: 'Data-intensive processes capped at Standard unless PSI>=3' },
    { cri: 3, maxLevel: 'comprehensive', label: 'Supportive / High Capability', notes: 'No capability caps' }
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

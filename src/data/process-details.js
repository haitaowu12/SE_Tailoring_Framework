/**
 * SE Tailoring Model — Process Activities & Deliverables
 * _CONTENT_SCHEMA_VERSION: 1.0 | _LAST_UPDATED: 2026-07-17
 * _STATUS: Provisional authored implementation guidance; non-normative and not professional-validity evidence.
 * 
 * Structure: { processId: { activities: {basic:[], standard:[], comprehensive:[]}, deliverables: {...}, outputs: [...] } }
 * Activities prefixed with (*) identify core outcome examples; format and method choices remain adaptable.
 * Tags: [Safety] and [RAM] are conditional examples; assess M5/M6 context and applicable obligations before planning them.
 * Conditional M8/M15 guidance is kept in PROCESS_CONTEXT_OVERLAYS so it does
 * not silently change the three base tailoring levels or add mapping edges.
 */

/** Work allocation examples only; no process level, floor or mapping changes. */
export const PROCESS_RESPONSIBILITY_GUIDANCE = {
    9: {
        outcome: 'Keep scope, responsibilities, dependencies, resources and review points coordinated.',
        local: 'Plan the work package and its handoffs; reference applicable programme milestones and resourcing decisions rather than duplicate the whole programme plan.'
    },
    10: {
        outcome: 'Make progress, issues, changes and corrective actions visible against agreed expectations.',
        local: 'Maintain local status and action records and feed the programme control process. Choose a dashboard or predictive model only when it answers a real control question with suitable evidence.'
    },
    11: {
        outcome: 'Make consequential choices with explicit criteria, decision authority, rationale and follow-up.',
        local: 'Record local interface and delivery decisions; escalate choices outside your authority. Reuse the programme decision process and perform sensitivity analysis or simulation where the decision and evidence warrant it.'
    },
    12: {
        outcome: 'Identify risks and hazards, assign owners, analyze uncertainty, plan responses and track closure.',
        local: 'Maintain local risks and hand them to the applicable programme risk and safety processes. Reference their scope and owner; check that they cover this work package. Simulation is conditional on defensible models and inputs, while the protected safety minimum still applies.'
    },
    16: {
        outcome: 'Plan assurance coverage, evaluate work against criteria, and track nonconformances and improvement.',
        local: 'Agree which checks and records your team supplies and which applicable programme assurance activities cover them. Reference that coverage and its owner; do not infer it from the existence of a programme. Use trend analysis when the available evidence supports it.'
    }
};

export const PROCESS_DETAILS = {
    9: {
        activities: {
            basic: ['(*) Develop basic project plan', '(*) Create simple schedule (milestone-based)', 'List resources', 'Estimate costs (high-level)'],
            standard: ['(*) Maintain a coordinated plan covering scope, responsibilities, schedule, resources, risks, and review points', '(*) Break work into manageable elements with clear ownership', 'Coordinate schedule dependencies and milestones', 'Plan resources in detail', 'Register risks formally', 'Schedule SA milestones and reviews [Safety]', 'Budget for SA activities [Safety]'],
            comprehensive: ['(*) Integrate multi-view planning', '(*) Assess schedule uncertainty using a method suited to the available evidence', 'Assess resource capacity; use modeling where useful', 'Develop stakeholder communication plan', 'Create risk-based estimates', 'Integrate SA planning into project baseline [Safety]']
        },
        deliverables: {
            basic: ['Basic project plan', 'Simple schedule', 'Resource list', 'Cost estimate'],
            standard: ['Coordinated planning record (a PMP or equivalent)', 'Work breakdown and ownership record (a WBS or equivalent)', 'Dependency-aware schedule', 'Resource management plan', 'Risk register', 'SA Milestone Schedule [Safety]'],
            comprehensive: ['Integrated planning documentation', 'Multi-view WBS', 'Schedule uncertainty analysis', 'Resource capacity assessment', 'Risk-based estimates', 'Stakeholder communication plan']
        },
        outputs: [
            { name: 'Project plans', feedsInto: 'Project Assessment, Infrastructure Management' },
            { name: 'Schedule', feedsInto: 'All Technical Processes (for planning), Measurement' },
            { name: 'Resource plan', feedsInto: 'HR Management, Infrastructure Management' },
            { name: 'Risk register', feedsInto: 'Risk Management, Decision Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the planning detail, schedule formality, and resource allocation rigor.'
    },
    10: {
        activities: {
            basic: ['(*) Report project status', '(*) Log issues (simple tracking)', 'Minute meetings', 'Log changes (record only)'],
            standard: ['(*) Measure performance against agreed baselines; use earned value where suitable', '(*) Track issues with severity and ownership', 'Review actions with owners and deadlines', 'Control changes through formal process', 'Plan corrections with impact assessment', 'Track SA metrics and KPIs [Safety]', 'Monitor SA action items [Safety]'],
            comprehensive: ['(*) Monitor integrated performance against agreed indicators; use a dashboard where useful', '(*) Track issues with metrics and assess emerging patterns', 'Analyze trends where evidence supports early warning', 'Model corrective-action scenarios where inputs support a defensible prediction', 'Implement continuous improvement', 'Report SA status using suitable controlled records [Safety]']
        },
        deliverables: {
            basic: ['Status reports', 'Issue log', 'Meeting minutes', 'Basic change log'],
            standard: ['Performance measurements against agreed baselines', 'Issue and action records', 'Review records with action tracking', 'Change control documentation', 'Corrective action plans', 'SA Status Reports [Safety]'],
            comprehensive: ['Integrated performance record', 'Advanced issue tracking with root cause', 'Comprehensive review documentation', 'Change impact analyses', 'Trend analysis reports', 'Corrective-action forecasts where supported by evidence']
        },
        outputs: [
            { name: 'Status reports', feedsInto: 'Information Management, Portfolio Management' },
            { name: 'Issue log', feedsInto: 'Quality Assurance, Knowledge Management' },
            { name: 'Change records', feedsInto: 'Configuration Management, Decision Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the performance measurement depth, change control formality, and reporting frequency.'
    },
    11: {
        activities: {
            basic: ['(*) Analyze basic alternatives (informal)', '(*) Record decision outcomes'],
            standard: ['(*) Plan decision process with criteria', '(*) Compare alternatives against explicit criteria; justify any weighting', 'Report analyses with rationale', 'Document rationale and trade-offs', 'Analyze SA alternatives and trade-offs [Safety]'],
            comprehensive: ['(*) Apply an agreed decision framework with named authority', '(*) Analyze consequential alternatives and sensitivity where relevant to the decision', 'Analyze uncertainties; use simulation only with a defensible model and inputs', 'Measure decision effectiveness', 'Record rationale for SA choices [Safety]']
        },
        deliverables: {
            basic: ['Decision records', 'Basic alternatives analysis', 'Meeting minutes with decisions'],
            standard: ['Decision management plan', 'Decision criteria matrices', 'Alternatives analysis reports', 'Decision records with rationale', 'Stakeholder input documentation', 'SA Trade-off Analysis [Safety]'],
            comprehensive: ['Decision governance framework', 'Decision models where useful', 'Comprehensive alternatives analysis', 'Uncertainty and sensitivity analyses', 'Decision effectiveness metrics']
        },
        outputs: [
            { name: 'Decision records', feedsInto: 'Configuration Management, System Analysis' },
            { name: 'Alternatives analysis', feedsInto: 'Architecture Definition, Design Definition' }
        ],
        useInTailoring: 'In tailoring, the main levers are the decision traceability depth, criteria formality, and stakeholder involvement.'
    },
    12: {
        activities: {
            basic: ['(*) Register risks or hazards in an authorized team or project record', '(*) Assign and confirm a named owner', '(*) Assess using simple High/Medium/Low criteria', '(*) Route material concerns through the applicable risk, hazard, safety, ethics, regulatory, issue, or nonconformance channel'],
            standard: ['(*) Plan risk management formally', '(*) Detail risk register with probability/impact', '(*) Plan responses with triggers and owners', 'Report regularly to stakeholders', 'Review risks at milestones', 'Identify and assess safety hazards [Safety]', 'Develop SA risk responses [Safety]'],
            comprehensive: ['(*) Apply and reference the applicable risk management framework', '(*) Analyze risk uncertainty; use distribution-based modeling or simulation only with a defensible model and inputs', '(*) Strategize responses with contingencies', 'Monitor leading indicators using suitable records', 'Analyze risk management effectiveness', 'Integrate SA risks into the assessment; use quantitative models where justified [Safety]', 'Track SA risk indicators [Safety]']
        },
        deliverables: {
            basic: ['Simple risk register', 'Risk assessment matrix (H/M/L)', 'Basic risk reports'],
            standard: ['Risk Management Plan (RMP)', 'Detailed risk register', 'Risk response plans', 'Regular risk reports', 'Risk review records', 'Safety Hazard Register [Safety]', 'SA Risk Response Plans [Safety]'],
            comprehensive: ['Risk management framework', 'Risk uncertainty analysis with supporting models or simulations where suitable', 'Detailed risk response strategies', 'Risk monitoring records with relevant leading indicators', 'Linked risk and response records', 'Risk management effectiveness metrics']
        },
        outputs: [
            { name: 'Risk register', feedsInto: 'Project Planning, Decision Management' },
            { name: 'Risk assessment', feedsInto: 'System Analysis, Quality Assurance' },
            { name: 'Risk response plans', feedsInto: 'Configuration Management, Integration' }
        ],
        useInTailoring: 'In tailoring, the main levers are the risk identification breadth, assessment methodology, and response planning formality.'
    },
    13: {
        activities: {
            basic: ['(*) List configuration items (CIs)', '(*) Control versions (manual or simple tool)', 'Request changes simply (informal)', 'Report status (basic)'],
            standard: ['(*) Plan configuration management', '(*) Identify configuration scheme', 'Assign change authority and record change decisions; use a board where warranted', 'Account status formally', 'Audit configurations', 'Manage safety-related CIs [Safety]', 'Control safety baseline changes [Safety]'],
            comprehensive: ['(*) Plan comprehensively with strategy', '(*) Systematically identify with structure', 'Analyze change impacts with traceability', 'Keep configuration status accessible to decision-makers', 'Maintain links between configuration and life-cycle records using suitable tools', 'Maintain SA documentation under CM [Safety]']
        },
        deliverables: {
            basic: ['Configuration item list', 'Simple change request forms', 'Basic configuration status reports', 'Version control records'],
            standard: ['Configuration Management Plan (CMP)', 'Configuration identification scheme', 'Change authority and decision procedures', 'Configuration status accounting reports', 'Configuration audit reports', 'Baseline documentation', 'Safety CI List [Safety]'],
            comprehensive: ['Comprehensive CM plan', 'Detailed configuration identification system', 'Advanced change control with impact analysis', 'Configuration status records', 'Comprehensive audit documentation', 'Configuration indicators where useful', 'Linked configuration and life-cycle records']
        },
        outputs: [
            { name: 'CI list', feedsInto: 'Integration, Implementation' },
            { name: 'Baselines', feedsInto: 'Verification, Validation' },
            { name: 'Change records', feedsInto: 'Project Assessment, Quality Assurance' }
        ],
        useInTailoring: 'In tailoring, the main levers are the scope of configuration items, change control formality, and baseline management depth.'
    },
    14: {
        activities: {
            basic: ['(*) Structure repository', '(*) Backup data', 'List access controls', 'Inventory information'],
            standard: ['(*) Plan information management', '(*) Categorize scheme with classification', 'Control access with procedures', 'Plan recovery with procedures', 'Protocol exchanges with stakeholders', 'Manage SA documentation repository [Safety]'],
            comprehensive: ['(*) Document information architecture', '(*) Schema metadata with relationships', 'Matrix access with audit procedures', 'Plan continuity with contingencies', 'Agree exchanges with formal agreements']
        },
        deliverables: {
            basic: ['Information repository structure', 'Basic access control list', 'Backup procedures', 'Simple information inventory'],
            standard: ['Information management plan', 'Information categorization scheme', 'Access control procedures', 'Backup and recovery plan', 'Information exchange protocols', 'Information security procedures'],
            comprehensive: ['Information architecture documentation', 'Metadata schema and relationships', 'Access control matrix with audit', 'Comprehensive backup/recovery/continuity plan', 'Information exchange agreements', 'Information security framework', 'Information lifecycle policies', 'Information quality metrics']
        },
        outputs: [
            { name: 'Repository structure', feedsInto: 'Knowledge Management, all processes (storage)' },
            { name: 'Access controls', feedsInto: 'Quality Assurance, Risk Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the information architecture formality, access control rigor, and retention requirements.'
    },
    15: {
        activities: {
            basic: ['(*) Define simple metrics (schedule, cost, quality)', '(*) Collect data (manual)', 'Report measurements (basic)'],
            standard: ['(*) Plan measurement with objectives', '(*) Define measurement constructs', 'Define repeatable collection procedures; automate where useful', 'Analyze trends', 'Review measures periodically', 'Define SA metrics (RAMS indicators) [Safety]'],
            comprehensive: ['(*) Plan comprehensively with strategy', '(*) Define measurement models and their assumptions', 'Automate collection or reporting when repeat use justifies it', 'Analyze methods with statistics', 'Evaluate effectiveness continuously', 'Collect and report SA performance data [Safety]']
        },
        deliverables: {
            basic: ['Simple metrics definitions', 'Basic data collection forms', 'Measurement reports'],
            standard: ['Measurement plan', 'Measurement construct definitions', 'Data collection procedures', 'Analysis reports with trends', 'Measurement review records', 'SA Metrics Definitions [Safety]'],
            comprehensive: ['Comprehensive measurement plan', 'Advanced measurement framework', 'Data collection and quality checks', 'Statistical analysis methodologies', 'Forecasts with assumptions where they support a decision', 'Measurement effectiveness evaluation', 'Integrated measurement results']
        },
        outputs: [
            { name: 'Metrics definitions', feedsInto: 'Project Assessment, Portfolio Management' },
            { name: 'Trend analysis', feedsInto: 'Decision Management, Risk Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the measurement framework scope, data collection formality, and analysis depth.'
    },
    16: {
        activities: {
            basic: ['(*) Plan basic quality assurance against named criteria', '(*) Conduct a peer check or authorized review with recorded scope', '(*) Report nonconformances through the applicable controlled channel', 'Track owners, actions, and closure evidence'],
            standard: ['(*) Develop quality assurance plan', '(*) Perform evaluations with criteria', '(*) Report regularly to stakeholders', 'Initiate improvements with actions', 'Conduct SA audits [Safety]', 'Verify SA process compliance [Safety]'],
            comprehensive: ['(*) Strategize assurance with objectives', '(*) Conduct assurance evaluations, including audits where required, with defined coverage and methodology', '(*) Assess quality issues and emerging patterns using available evidence', 'Drive improvement initiatives with metrics', 'Review safety documentation quality [Safety]']
        },
        deliverables: {
            basic: ['Review record with scope, criteria, and findings', 'Nonconformance actions and closure evidence'],
            standard: ['Detailed quality assurance plan', 'Evaluation procedures and results', 'Regular quality reports', 'Improvement action plans', 'SA Audit Reports [Safety]', 'SA Compliance Records [Safety]'],
            comprehensive: ['Quality assurance strategy', 'Comprehensive evaluation program', 'Quality trend analyses', 'Formal improvement initiative documentation', 'Assurance effectiveness metrics']
        },
        outputs: [
            { name: 'Audit reports', feedsInto: 'Stakeholder Needs, Validation' },
            { name: 'Non-conformance records', feedsInto: 'Project Assessment, Risk Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the audit frequency, non-conformance tracking formality, and process compliance depth.'
    },
    17: {
        activities: {
            basic: ['(*) Define problem statement', '(*) Explore solution alternatives (informal)', '(*) Identify affected stakeholders and decision authorities'],
            standard: ['(*) Develop analysis plan', '(*) Map relevant stakeholder groups, interests, and decision rights', '(*) Analyze problems with context', 'Define initial concepts', 'Preliminary hazard identification [Safety]', 'Initial SA criticality assessment [Safety]'],
            comprehensive: ['(*) Perform comprehensive analysis', '(*) Analyze stakeholder values, conflicts, and representation gaps', '(*) Analyze opportunities and external context; use PESTEL where suitable', 'Develop business or mission cases using relevant benefits, costs, and risks; use ROI where suitable', 'Identify safety-related stakeholders [Safety]']
        },
        deliverables: {
            basic: ['Problem statement', 'Solution alternatives', 'Initial stakeholder list', 'Initial operating concept where it helps compare options'],
            standard: ['Business/mission analysis plan', 'Stakeholder maps', 'Problem definition document', 'Initial Concept of Operations', 'Preliminary Hazard List (PHL) [Safety]', 'SA Criticality Tier determination [Safety]'],
            comprehensive: ['Comprehensive problem analysis', 'Stakeholder value models', 'Opportunity/risk profiles', 'Detailed business case documentation']
        },
        outputs: [
            { name: 'Problem statement', feedsInto: 'Stakeholder Needs, Portfolio Management' },
            { name: 'Solution alternatives', feedsInto: 'System Requirements Definition, Architecture Definition' },
            { name: 'ConOps', feedsInto: 'Stakeholder Needs, Validation' }
        ],
        useInTailoring: 'In tailoring, the main levers are the problem definition formality, stakeholder analysis depth, and opportunity assessment rigor.'
    },
    18: {
        activities: {
            basic: ['(*) List stakeholders', '(*) Elicit basic needs (interviews)', 'Validate simply (review)', 'Note constraints'],
            standard: ['(*) Analyze stakeholders with influence', '(*) Elicit needs formally with techniques', 'Validate with plan and criteria', 'Analyze constraints with impact', 'Resolve conflicts with stakeholders', 'Define mission profile and operational scenarios', 'Capture safety needs from stakeholders [Safety]', 'Establish preliminary RAM targets [RAM]'],
            comprehensive: ['(*) Map stakeholder influence comprehensively', '(*) Model comprehensive needs', 'Apply multiple validation techniques', 'Strategize engagement', 'Analyze constraint impacts comprehensively', 'Identify safety constraints [Safety]']
        },
        deliverables: {
            basic: ['Stakeholder list', 'Needs statements', 'Simple validation records', 'Basic constraints list'],
            standard: ['Stakeholder analysis document', 'Stakeholder needs specification', 'Elicitation records', 'Validation plan and results', 'Constraints analysis', 'Conflict resolution records', 'Mission profile documentation', 'Preliminary RAM targets [RAM]', 'Safety needs register [Safety]'],
            comprehensive: ['Detailed stakeholder influence maps', 'Comprehensive needs models', 'Multiple elicitation technique results', 'Formal validation strategy', 'Extensive constraints impact analysis', 'Conflict resolution process documentation', 'Stakeholder engagement plan']
        },
        outputs: [
            { name: 'Stakeholder list', feedsInto: 'Project Planning, System Requirements' },
            { name: 'Needs statements', feedsInto: 'System Requirements, Validation' },
            { name: 'Constraints list', feedsInto: 'Architecture Definition, System Requirements' }
        ],
        useInTailoring: 'In tailoring, the main levers are the elicitation methodology, needs documentation formality, and transformation rigor into requirements.'
    },
    19: {
        activities: {
            basic: ['(*) Document requirements (simple list)', '(*) Link requirements to their source using the project’s existing records', 'Review requirements (informal)'],
            standard: ['(*) Plan requirements development', '(*) Specify requirements with attributes', 'Maintain controlled requirements records with attributes and links', 'Trace with matrix', 'Validate requirements records', 'Plan verification', 'Identify safety requirements [Safety]', 'Define RAM requirements [RAM]', 'Establish and maintain Hazard Log [Safety]', 'Allocate safety requirements and integrity targets where the applicable regime requires them [Safety]'],
            comprehensive: ['(*) Model required behaviors using representations suited to assurance and verification needs', '(*) Specify requirements unambiguously; use formal models where suitable or required', 'Keep requirements and their relationships under change control', 'Document traceability network', 'Strategize validation', 'Plan verification comprehensively', 'Define safety functional requirements [Safety]', 'Define reliability, availability, and maintainability requirements for the applicable context [RAM]']
        },
        deliverables: {
            basic: ['Requirements with sources and review decisions, in a list or an existing record'],
            standard: ['Requirements development plan', 'System Specification (SS)', 'Controlled requirements records with attributes', 'Traceability matrix', 'Validation records', 'Verification planning documentation', 'Preliminary Hazard Analysis (PHA) [Safety]', 'RAMS Requirements Specification [RAM]', 'Hazard Log [Safety]', 'Safety requirement and applicable integrity allocation record [Safety]'],
            comprehensive: ['Detailed requirements specification with formal models where suitable or required', 'Controlled requirements records and relationships', 'Traceability across the assessed requirements, interfaces, and evidence', 'Detailed validation strategy', 'Comprehensive verification planning', 'Change impact analysis methodology', 'Requirements quality metrics', 'Safety Requirements Specification [Safety]', 'Safety argument and supporting evidence required by the applicable regime [Safety]']
        },
        outputs: [
            { name: 'Requirements document', feedsInto: 'Architecture Definition, Verification' },
            { name: 'Traceability matrix', feedsInto: 'Verification, Validation' },
            { name: 'Hazard Log', feedsInto: 'Risk Management, System Analysis, Validation' }
        ],
        useInTailoring: 'In tailoring, the main levers are the required traceability depth, formality of baselines, and integration with safety and regulatory arguments.'
    },
    20: {
        activities: {
            basic: ['(*) Define concepts (block diagrams)', '(*) List interfaces', 'Evaluate options (informal)', 'Document architecture'],
            standard: ['(*) Plan architecture development', '(*) Develop viewpoints addressing the relevant stakeholder concerns', 'Create interface control documents (ICDs)', 'Evaluate alternatives with trade studies', 'Plan architecture governance', 'Perform RAMS apportionment [RAM]', 'Allocate safety requirements and any required integrity targets to subsystems [Safety]', 'Define safety partitioning and isolation [Safety]'],
            comprehensive: ['(*) Model architectures using notation suited to stakeholder concerns and assurance needs', '(*) Develop comprehensive description', 'Specify interfaces in detail', 'Evaluate consequential alternatives against explicit criteria', 'Govern architecture decisions', 'Measure architecture quality', 'Define redundancy and fault tolerance strategies [RAM]', 'Conduct architecture safety reviews [Safety]']
        },
        deliverables: {
            basic: ['Simple architecture description', 'Basic interface list', 'Architecture diagrams', 'Evaluation notes'],
            standard: ['Architecture development plan', 'Architecture description with views', 'Interface control document (ICD)', 'Architecture alternatives analysis', 'Architecture evaluation results', 'Architecture governance plan', 'RAMS Apportionment Document [RAM]', 'Safety requirement and applicable integrity allocation to elements [Safety]'],
            comprehensive: ['Architecture models using suitable notation, including formal notation where required', 'Comprehensive architecture description', 'Detailed interface specifications', 'Extensive alternatives analysis with trade studies', 'Architecture evaluation and decision record', 'Architecture governance documentation', 'Architecture metrics', 'Patterns and reference architectures', 'Fault Tolerance Strategy Document [RAM]', 'Safety Partitioning Specification [Safety]']
        },
        outputs: [
            { name: 'Architecture description', feedsInto: 'Design Definition, System Requirements Definition' },
            { name: 'Interface specifications', feedsInto: 'Integration, Verification' },
            { name: 'RAMS apportionment', feedsInto: 'Design Definition, Verification' }
        ],
        useInTailoring: 'In tailoring, the main levers are the breadth of trade studies, formality of architecture documentation, and depth of interface specification.'
    },
    21: {
        activities: {
            basic: ['(*) Create design documentation', '(*) Create design diagrams', 'Select technologies', 'Basic verification'],
            standard: ['(*) Plan design process', '(*) Record the design and its key assumptions', 'Analyze alternatives', 'Verify designs with analysis', 'Assess technologies', 'Conduct design reviews', 'Perform FMEA/FMECA [RAM]', 'Conduct maintainability analysis [RAM]', 'Execute safety design reviews [Safety]'],
            comprehensive: ['(*) Model designs using notation suited to implementation and verification needs', '(*) Develop detailed multi-view documentation', 'Resolve consequential design trade-offs using suitable analysis', 'Comprehensive verification strategy', 'Technology assessment where choices or uncertainties affect the design', 'Formal design reviews', 'Define diagnostic and test provisions [RAM]', 'Analyze failure modes and effects [RAM]']
        },
        deliverables: {
            basic: ['Design documentation', 'Design diagrams', 'Technology selections', 'Basic verification records'],
            standard: ['Design plan', 'Controlled design record', 'Design alternatives analysis', 'Verification results', 'Technology assessment report', 'Design review records', 'FMEA/FMECA Report [RAM]', 'Maintainability Analysis Report [RAM]', 'Safety Design Review Records [Safety]'],
            comprehensive: ['Design models using suitable notation, including formal notation where required', 'Detailed multi-view documentation', 'Extensive alternatives analysis', 'Comprehensive verification results', 'Technology decisions and follow-up where relevant', 'Formal design review documentation', 'Design patterns catalog', 'Design quality metrics', 'Diagnostic Strategy Document [RAM]']
        },
        outputs: [
            { name: 'Design documentation', feedsInto: 'Implementation, Integration' },
            { name: 'Technology assessment', feedsInto: 'Risk Management, Decision Management' },
            { name: 'FMEA/FMECA results', feedsInto: 'Risk Management, System Analysis' }
        ],
        useInTailoring: 'In tailoring, the main levers are the level of design detail, formality of design reviews, and extent of design verification.'
    },
    22: {
        activities: {
            basic: ['(*) Perform basic analyses', '(*) Document analysis data', 'Document methodology'],
            standard: ['(*) Plan analysis activities', '(*) Define analysis methodologies', 'Conduct analyses with recommendations', 'Define tool usage', 'Support decisions', 'Perform RAM analysis (FMEA/FMECA) [RAM]', 'Conduct RAMS trade studies [RAM]', 'Analyze safety risks [Safety]'],
            comprehensive: ['(*) Develop analysis strategy', '(*) Define the decisions, assumptions, and evidence the analysis must address', 'Use modeling or simulation where the decision and available evidence warrant it', 'Validate methodologies', 'Document tool environments', 'Quantify uncertainties', 'Measure analysis effectiveness', 'Perform availability modeling [RAM]', 'Execute reliability predictions [RAM]', 'Support safety case development [Safety]']
        },
        deliverables: {
            basic: ['Simple analysis reports', 'Analysis data', 'Basic methodology documentation'],
            standard: ['Analysis plan', 'Analysis methodologies documentation', 'Analysis reports with recommendations', 'Tool usage guidelines', 'Decision support documentation', 'RAM Analysis Report (FMEA/FMECA) [RAM]', 'RAMS Trade Study Reports [RAM]', 'Safety Risk Analysis [Safety]'],
            comprehensive: ['Analysis strategy', 'Analysis scope, assumptions, and acceptance criteria', 'Models and results where used', 'Detailed methodology with validation', 'Tool environment documentation', 'Uncertainty quantification', 'Analysis effectiveness metrics', 'Decision support with sensitivity analysis', 'Availability Model and Analysis [RAM]', 'Reliability Prediction Reports [RAM]', 'Hazard analysis and results using methods suited to the hazards [Safety]', 'Safety Case Evidence [Safety]']
        },
        outputs: [
            { name: 'Analysis reports', feedsInto: 'Decision Management, Architecture Definition' },
            { name: 'Trade study results', feedsInto: 'Design Definition, Risk Management' },
            { name: 'Safety analysis', feedsInto: 'Risk Management, Verification' }
        ],
        useInTailoring: 'In tailoring, the main levers are the analysis breadth, methodology rigor, and trade study documentation formality.'
    },
    23: {
        activities: {
            basic: ['(*) Build per specifications', '(*) Perform basic acceptance testing', 'Document product'],
            standard: ['(*) Plan implementation with procedures', '(*) Track progress', 'Execute acceptance tests', 'Record the build configuration and deviations', 'Conduct implementation reviews', 'Perform safety-related inspections [Safety]', 'Execute component safety testing [Safety]'],
            comprehensive: ['(*) Develop implementation strategy', '(*) Control build variation, deviations, and acceptance across suppliers or increments', 'Monitor build and acceptance indicators where they affect release decisions', 'Comprehensive acceptance testing', 'Link build configuration, deviations, and acceptance evidence', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Maintain safety traceability [Safety]']
        },
        deliverables: {
            basic: ['Implementation plan', 'Implementation records', 'Basic acceptance documentation', 'Product documentation'],
            standard: ['Detailed implementation plan', 'Progress reports', 'Acceptance test procedures/results', 'Build configuration and deviation record', 'Implementation review records', 'Safety Inspection Records [Safety]', 'Component Safety Test Reports [Safety]'],
            comprehensive: ['Implementation strategy', 'Controlled procedures for the risks and interfaces involved', 'Build and acceptance indicators used in release decisions', 'Traceable acceptance evidence', 'Linked build configuration, deviations, and acceptance evidence', 'Formal review documentation', 'Implementation effectiveness metrics', 'Lessons learned']
        },
        outputs: [
            { name: 'Implemented product', feedsInto: 'Integration, Verification' },
            { name: 'Implementation records', feedsInto: 'Configuration Management, Quality Assurance' }
        ],
        useInTailoring: 'In tailoring, the main levers are the implementation standards compliance, coding/production rigor, and unit verification depth.'
    },
    24: {
        activities: {
            basic: ['(*) Integrate system elements', '(*) Verify interfaces', '(*) Perform integration testing', 'Track integration issues'],
            standard: ['(*) Plan integration with sequence', '(*) Specify integration environment', '(*) Execute procedures', 'Verify with records', 'Track issues to resolution', 'Conduct reviews', 'Perform RAM testing [RAM]', 'Execute safety integration tests [Safety]', 'Verify safety functions [Safety]'],
            comprehensive: ['(*) Develop integration strategy', '(*) Plan with risk assessment', '(*) Manage integration environment', 'Comprehensive verification', 'Analyze recurring or release-critical integration issues', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Update Hazard Log with integration findings [Safety]']
        },
        deliverables: {
            basic: ['Integration plan', 'Integration records', 'Issue log', 'Integration report'],
            standard: ['Detailed integration plan with sequence', 'Integration environment specification', 'Integration procedures', 'Verification records', 'Issue and resolution record', 'Integration review documentation', 'RAM Test Reports [RAM]', 'Safety Integration Test Reports [Safety]'],
            comprehensive: ['Integration strategy', 'Advanced plan with risk assessment', 'Detailed environment management plan', 'Comprehensive verification results', 'Integration issue and resolution history', 'Formal review documentation', 'Integration effectiveness metrics', 'Lessons learned', 'Updated Hazard Log [Safety]']
        },
        outputs: [
            { name: 'Integrated system', feedsInto: 'Verification, Transition' },
            { name: 'Issue log', feedsInto: 'Quality Assurance, Risk Management' },
            { name: 'Interface verification records', feedsInto: 'Configuration Management, Design Definition' }
        ],
        useInTailoring: 'In tailoring, the main levers are the integration strategy formality, interface verification depth, and incremental integration planning.'
    },
    25: {
        activities: {
            basic: ['(*) Identify the requirements to check and how to check them', '(*) Perform the checks and record results and anomalies'],
            standard: ['(*) Select justified methods: test, demonstration, inspection, or analysis', '(*) Specify verification environment', '(*) Execute verification and link the results to the covered requirements', 'Track anomalies and their disposition', 'Conduct reviews', 'Verify RAMS requirements [RAM]', 'Conduct safety function testing [Safety]', 'Verify allocated safety requirements and applicable integrity obligations [Safety]'],
            comprehensive: ['(*) Set verification depth and coverage by risk and consequence', '(*) Link requirements, methods, results, and exceptions', '(*) Control the test configuration and conditions needed for repeatable results', 'Investigate recurring or decision-critical anomalies', 'Review coverage and unresolved exceptions with the acceptance owner', 'Prepare safety verification evidence [Safety]']
        },
        deliverables: {
            basic: ['Requirements checked, methods, results, and anomaly records'],
            standard: ['Detailed verification plan', 'Verification procedures (methods selected for the requirements)', 'Verification environment specification', 'Controlled verification results and coverage', 'Anomaly and disposition record', 'Verification review records', 'RAMS Verification Reports [RAM]', 'Safety Function Test Records [Safety]', 'Verification evidence for allocated safety and integrity obligations [Safety]'],
            comprehensive: ['Risk-based coverage and method record', 'Controlled procedures and test configuration', 'Traceable verification results and exceptions', 'Disposition of significant anomalies and coverage gaps', 'Safety Verification Evidence Package [Safety]']
        },
        outputs: [
            { name: 'Verification reports', feedsInto: 'Transition, Validation' },
            { name: 'Defect records', feedsInto: 'Quality Assurance, Risk Management' },
            { name: 'Verification evidence', feedsInto: 'Validation, Configuration Management' }
        ],
        useInTailoring: 'In tailoring, the main levers are the verification method rigor, independence of verification, and traceability to requirements.'
    },
    26: {
        activities: {
            basic: ['(*) Plan transition', '(*) Install system', 'Provide basic training', 'Report transition'],
            standard: ['(*) Plan detailed transition', '(*) Install against agreed steps and readiness criteria', 'Verify operational readiness', 'Conduct training program', 'Review transition', 'Prepare documentation package', 'Conduct safety acceptance [Safety]', 'Transfer safety documentation [Safety]'],
            comprehensive: ['(*) Develop transition strategy', '(*) Plan with risk assessment', 'Install with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal reviews', 'Complete transition package', 'Measure effectiveness', 'Obtain safety acceptance and any Safety Case approval required by the applicable regime [Safety]', 'Conduct safety training for operators [Safety]']
        },
        deliverables: {
            basic: ['Transition plan', 'Installation procedures', 'Training materials', 'Transition report'],
            standard: ['Detailed transition plan', 'Controlled installation procedures', 'Operational readiness verification plan', 'Training program', 'Transition review documentation', 'Transition documentation package', 'Safety Acceptance Records [Safety]', 'Safety Documentation Package [Safety]'],
            comprehensive: ['Transition strategy', 'Detailed plan with risk assessment', 'Installation procedures with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal review documentation', 'Complete transition package', 'Transition effectiveness metrics', 'Safety acceptance record and approved Safety Case where required by the applicable regime [Safety]', 'Safety Training Records [Safety]']
        },
        outputs: [
            { name: 'Deployed system', feedsInto: 'Operation, Maintenance' },
            { name: 'Training materials', feedsInto: 'Operation, Knowledge Management' },
            { name: 'Operational readiness', feedsInto: 'Operation, Validation' }
        ],
        useInTailoring: 'In tailoring, the main levers are the transition planning formality, training depth, and operational readiness verification.'
    },
    27: {
        activities: {
            basic: ['(*) Agree the intended use and what would show it works', '(*) Check a representative use scenario and record the outcome with the user or their representative'],
            standard: ['(*) Choose validation methods suited to intended use and stakeholder needs', '(*) Specify validation environment', '(*) Exercise the intended use and record results against agreed criteria', 'Plan stakeholder involvement', 'Track anomalies and their disposition', 'Conduct reviews', 'Validate reliability, availability, and maintainability performance against intended use and stakeholder needs [RAM]', 'Validate safety functions in operational context [Safety]'],
            comprehensive: ['(*) Cover consequential operating scenarios with the stakeholders who rely on the system', '(*) Justify the representativeness of the conditions and methods', '(*) Link results and exceptions to intended use and acceptance criteria', 'Investigate gaps that could change the acceptance decision', 'Agree responsibility and follow-up for unresolved exceptions', 'Obtain safety sign-off required by the applicable regime [Safety]', 'Develop RAMS validation plan [RAM]']
        },
        deliverables: {
            basic: ['Use scenario, success criteria, user or representative feedback, and any gaps'],
            standard: ['Detailed validation plan', 'Validation methods and criteria for intended use', 'Validation environment specification', 'Controlled validation results against intended use', 'Stakeholder involvement plan', 'Anomaly and disposition record', 'Validation review records', 'RAMS Validation Reports [RAM]', 'Operational Safety Validation Report [Safety]'],
            comprehensive: ['Scenario coverage, conditions, and method rationale', 'Results linked to intended use and acceptance criteria', 'Disposition and ownership of material gaps', 'Safety acceptance evidence (Safety Acceptance Certificate where required by the applicable regime) [Safety]', 'RAMS Validation Plan [RAM]']
        },
        outputs: [
            { name: 'Validation reports', feedsInto: 'Stakeholder Needs, System Requirements Definition' },
            { name: 'Stakeholder acceptance', feedsInto: 'Transition, Quality Assurance' },
            { name: 'Defect records', feedsInto: 'Risk Management, Quality Assurance' }
        ],
        useInTailoring: 'In tailoring, the main levers are the stakeholder involvement depth, scenario coverage, and formality of validation evidence.'
    },
    28: {
        activities: {
            basic: ['(*) Execute operational procedures', '(*) Monitor performance', '(*) Track problems', 'Provide user support'],
            standard: ['(*) Plan operations', '(*) Follow operational procedures and record deviations', '(*) Track indicators that support operational decisions', 'Analyze performance', 'Manage problems', 'Provide user support procedures', 'Conduct reviews', 'Train operators', 'Monitor RAM performance [RAM]', 'Track operational failures, causes, and corrective actions using a suitable record [RAM]', 'Maintain operational Hazard Log [Safety]'],
            comprehensive: ['(*) Develop operational strategy', '(*) Detailed procedures with contingencies', '(*) Performance monitoring framework', 'Analyze trends or recurring problems where they affect operational decisions', 'Problem management with root cause', 'Comprehensive user support', 'Formal reviews', 'Advanced training', 'Measure operational effectiveness', 'Continuous RAMS monitoring [RAM]', 'Conduct periodic safety reviews [Safety]']
        },
        deliverables: {
            basic: ['Operational procedures', 'Performance reports', 'Problem records', 'User support documentation'],
            standard: ['Operational plan', 'Controlled procedures', 'Performance monitoring plan', 'Performance analysis reports', 'Problem management process', 'User support procedures', 'Operational review records', 'Training program', 'Failure and corrective-action evidence, such as a FRACAS record [RAM]', 'Operational Hazard Log [Safety]'],
            comprehensive: ['Operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Performance trends and decisions', 'Problem management with root cause', 'Comprehensive user support infrastructure', 'Formal review documentation', 'Advanced training with evaluation', 'Operational effectiveness metrics', 'Operational RAM performance evidence [RAM]', 'Periodic Safety Review Reports [Safety]']
        },
        outputs: [
            { name: 'Operational data', feedsInto: 'Maintenance, Measurement' },
            { name: 'Problem records', feedsInto: 'Quality Assurance, Knowledge Management' },
            { name: 'FRACAS data', feedsInto: 'Design Definition, System Analysis' }
        ],
        useInTailoring: 'In tailoring, the main levers are the operational monitoring depth, maintenance planning integration, and performance tracking formality.'
    },
    29: {
        activities: {
            basic: ['(*) Plan maintenance', '(*) Execute maintenance procedures', '(*) Track problems', 'Report maintenance'],
            standard: ['(*) Plan detailed maintenance', '(*) Carry out maintenance and confirm readiness to return to service', '(*) Manage maintenance environment', 'Track problems and corrective actions to closure', 'Conduct reviews', 'Prepare documentation package', 'Update Hazard Log post-maintenance [Safety]', 'Review reliability trends when they inform maintenance decisions [RAM]'],
            comprehensive: ['(*) Develop maintenance strategy', '(*) Control maintenance procedures that affect safety, reliability, or return to service', '(*) Justify maintenance methods and intervals using risk and observed condition', 'Manage maintenance environment', 'Investigate significant or recurring failures', 'Formal reviews', 'Controlled maintenance evidence linked to changes and release decisions', 'Measure effectiveness', 'Conduct change impact analysis for safety [Safety]', 'RAMS performance review & optimization [RAM]']
        },
        deliverables: {
            basic: ['Maintenance plan', 'Maintenance procedures', 'Problem records', 'Maintenance reports'],
            standard: ['Detailed maintenance plan', 'Controlled procedures', 'Maintenance environment specification', 'Problem and corrective-action records', 'Maintenance review records', 'Maintenance documentation package', 'Updated Hazard Log [Safety]', 'Reliability trends and maintenance decisions where useful [RAM]'],
            comprehensive: ['Maintenance strategy', 'Controlled procedures for the risks and interfaces involved', 'Justified maintenance methods and intervals', 'Maintenance environment controls', 'Failure investigation and corrective-action evidence', 'Review and release decisions', 'Controlled maintenance evidence linked to changes and release decisions', 'Maintenance effectiveness metrics', 'Safety Change Impact Analysis [Safety]', 'RAMS Performance Report [RAM]']
        },
        outputs: [
            { name: 'Maintenance records', feedsInto: 'Operation, Configuration Management' },
            { name: 'Problem trends', feedsInto: 'Quality Assurance, Risk Management' },
            { name: 'Reliability data', feedsInto: 'System Analysis, Design Definition' }
        ],
        useInTailoring: 'In tailoring, the main levers are the maintenance planning formality, failure analysis depth, and upgrade management rigor.'
    },
    30: {
        activities: {
            basic: ['(*) Plan disposal', '(*) Execute disposal procedures', 'Archive records', 'Report disposal'],
            standard: ['(*) Plan detailed disposal', '(*) Carry out disposal and record how materials and records were handled', 'Assess environmental impact', 'Address health and safety', 'Conduct reviews', 'Plan archiving', 'Prepare documentation', 'Identify and manage hazardous materials [Safety]', 'Close or transfer remaining hazards to an accountable owner [Safety]'],
            comprehensive: ['(*) Develop disposal strategy', '(*) Detailed procedures with risk assessment', 'Comprehensive environmental analysis', 'Detailed health and safety plan', 'Formal reviews', 'Complete disposal documentation', 'Agree record retention, ownership, and access after disposal', 'Measure effectiveness', 'Provide the disposal safety evidence required by the applicable regime [Safety]', 'Archive safety records [Safety]']
        },
        deliverables: {
            basic: ['Disposal plan', 'Disposal procedures', 'Disposal report', 'Archive list'],
            standard: ['Detailed disposal plan', 'Comprehensive disposal procedures', 'Environmental assessment', 'Health and safety procedures', 'Disposal review records', 'Archiving plan', 'Disposal documentation package', 'Hazardous Materials Inventory [Safety]', 'Hazard closure and transfer records [Safety]'],
            comprehensive: ['Disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental impact analysis', 'Detailed health and safety plan', 'Formal review documentation', 'Complete disposal documentation', 'Retention, ownership, and access record', 'Disposal effectiveness metrics', 'Disposal safety evidence required by the applicable regime [Safety]', 'Archived Safety Records [Safety]']
        },
        outputs: [
            { name: 'Disposal records', feedsInto: 'Information Management, Knowledge Management' },
            { name: 'Archive', feedsInto: 'Knowledge Management' },
            { name: 'Environmental assessment', feedsInto: 'Risk Management, Quality Assurance' }
        ],
        useInTailoring: 'In tailoring, the main levers are the disposal planning formality, environmental compliance depth, and data retention requirements.'
    }
};

/**
 * Advisory content overlays for already-mapped Security (M8) and scoped
 * External Governance & Assurance (M15) contexts. These prompts describe what
 * practitioners should make visible when an existing mapping is active. They
 * do not change a process level, create a floor, or expand the mapping matrix.
 */
export const PROCESS_CONTEXT_OVERLAYS = {
    12: {
        security: {
            activities: ['Identify security-origin risk scenarios and affected assets', 'Trace security risk treatments to owners and verification evidence'],
            evidence: ['Security risk register entries', 'Security risk treatment and acceptance records']
        },
        assurance: {
            activities: ['Trace obligation-driven risks to the applicable source and decision authority'],
            evidence: ['Obligation-to-risk trace and disposition record']
        }
    },
    13: {
        security: {
            activities: ['Place security-relevant items, configurations, dependencies, and changes under controlled baselines'],
            evidence: ['Security-relevant configuration index', 'Authorized change and component-provenance records']
        },
        assurance: {
            activities: ['Identify assurance evidence as controlled configuration items with retention and approval status'],
            evidence: ['Assurance evidence configuration index', 'Auditable baseline and change history']
        }
    },
    14: {
        security: {
            activities: ['Apply classification, access, integrity, retention, and recovery controls to security-relevant information'],
            evidence: ['Security information handling plan', 'Access, integrity, backup, and recovery evidence']
        },
        assurance: {
            activities: ['Maintain a retrievable evidence repository linked to obligation sources, owners, and approvals'],
            evidence: ['Assurance evidence index', 'Retention, access, and submission records']
        }
    },
    16: {
        assurance: {
            activities: ['Audit the process and evidence obligations within the confirmed assurance scope'],
            evidence: ['Obligation-scoped audit plan', 'Findings, corrective actions, and closure evidence']
        }
    },
    20: {
        security: {
            activities: ['Define security-relevant trust boundaries, protection responsibilities, and architecture decisions', 'Evaluate security consequences and treatments in architecture trade studies'],
            evidence: ['Security architecture views and decision records', 'Threat-informed architecture evaluation evidence']
        }
    },
    25: {
        security: {
            activities: ['Define and execute verification methods for allocated security requirements and treatments'],
            evidence: ['Security verification trace', 'Security test, analysis, inspection, or demonstration records']
        },
        assurance: {
            activities: ['Map required assurance evidence and acceptance criteria to verification results'],
            evidence: ['Obligation-to-verification evidence matrix', 'Independent review or acceptance record where required']
        }
    },
    27: {
        assurance: {
            activities: ['Validate obligation-relevant outcomes and acceptance criteria with the designated authority or stakeholder'],
            evidence: ['Obligation-scoped validation and acceptance record']
        }
    },
    30: {
        assurance: {
            activities: ['Close or transfer applicable obligations, approvals, records, and retained liabilities before disposal completion'],
            evidence: ['Assurance closeout or transfer record', 'Required archive and authority acceptance evidence']
        }
    }
};

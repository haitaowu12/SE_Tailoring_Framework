/**
 * SE Tailoring Model — Process Activities & Deliverables
 * _VERSION: 3.2 | _LAST_UPDATED: 2026-02
 * _SOURCE: 02-PRACTICAL/Process-Tailoring-Tables.md
 * 
 * Structure: { processId: { activities: {basic:[], standard:[], comprehensive:[]}, deliverables: {...}, outputs: [...], saActivities: [...], saDeliverables: [...] } }
 * Activities prefixed with (*) are essential/core even at Basic level.
 * SA = System Assurance (RAMS - Reliability, Availability, Maintainability, Safety)
 */

export const PROCESS_DETAILS = {
    9: {
        activities: {
            basic: ['(*) Develop basic project plan', '(*) Create simple schedule (milestone-based)', 'List resources', 'Estimate costs (high-level)'],
            standard: ['Create project management plan (PMP)', 'Develop Work Breakdown Structure (WBS)', 'Develop Integrated Master Schedule (IMS)', 'Plan resources in detail', 'Register risks formally'],
            comprehensive: ['Integrate multi-view planning', 'Perform probabilistic schedule analysis', 'Optimize resources with capacity modeling', 'Develop stakeholder communication plan', 'Create risk-based estimates']
        },
        deliverables: {
            basic: ['Basic project plan', 'Simple schedule', 'Resource list', 'Cost estimate'],
            standard: ['Project Management Plan (PMP)', 'Work Breakdown Structure (WBS)', 'Integrated Master Schedule (IMS)', 'Resource management plan', 'Risk register'],
            comprehensive: ['Integrated planning documentation', 'Multi-view WBS', 'Probabilistic schedule analysis', 'Resource optimization analysis', 'Risk-based estimates', 'Stakeholder communication plan']
        },
        outputs: [
            { name: 'Project plans', feedsInto: 'Project Assessment (all levels), Infrastructure Management (Basic)' },
            { name: 'Schedule', feedsInto: 'All Technical Processes (for planning), Measurement (Basic)' },
            { name: 'Resource plan', feedsInto: 'HR Management (Basic), Infrastructure Management (Standard)' },
            { name: 'Risk register', feedsInto: 'Risk Management (Standard), Decision Management (Standard)' }
        ],
        saActivities: ['Include SA resource requirements in plan', 'Schedule SA milestones and reviews', 'Budget for SA activities and tools', 'Identify SA roles and responsibilities'],
        saDeliverables: ['SA Resource Allocation', 'SA Milestone Schedule', 'SA Budget Estimate', 'SA Roles Matrix']
    },
    10: {
        activities: {
            basic: ['(*) Report project status', '(*) Log issues (simple tracking)', 'Minute meetings', 'Log changes (record only)'],
            standard: ['Measure performance against baselines', 'Track issues with severity and ownership', 'Review actions with owners and deadlines', 'Control changes through formal process', 'Plan corrections with impact assessment'],
            comprehensive: ['Dashboard performance monitoring with KPIs', 'Track issues with metrics and trend analysis', 'Analyze trends for early warning', 'Model predictions for corrective actions', 'Implement continuous improvement']
        },
        deliverables: {
            basic: ['Status reports', 'Issue log', 'Meeting minutes', 'Basic change log'],
            standard: ['Performance measurement reports (EVM)', 'Issue management database', 'Review records with action tracking', 'Change control documentation', 'Corrective action plans'],
            comprehensive: ['Integrated performance dashboard', 'Advanced issue tracking with root cause', 'Comprehensive review documentation', 'Change impact analyses', 'Trend analysis reports', 'Predictive performance models']
        },
        outputs: [
            { name: 'Status reports', feedsInto: 'Information Management (Basic), Portfolio Management (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Basic), Knowledge Management (Basic)' },
            { name: 'Change records', feedsInto: 'Configuration Management (Standard), Decision Management (Standard)' }
        ],
        saActivities: ['Track SA metrics and KPIs', 'Monitor SA action items', 'Report SA status to stakeholders', 'Control SA-related changes'],
        saDeliverables: ['SA Status Reports', 'SA Metrics Dashboard', 'SA Change Records', 'SA Action Tracking']
    },
    11: {
        activities: {
            basic: ['(*) Record key decisions (who, what, when)', 'Analyze basic alternatives (informal)', 'Minute decision outcomes'],
            standard: ['Plan decision process with criteria', 'Create decision criteria matrices with weights', 'Report analyses with rationale', 'Document rationale and trade-offs'],
            comprehensive: ['Govern decision framework with policies', 'Model advanced scenarios with sensitivity analysis', 'Analyze uncertainties with Monte Carlo', 'Measure decision effectiveness']
        },
        deliverables: {
            basic: ['Decision records', 'Basic alternatives analysis', 'Meeting minutes with decisions'],
            standard: ['Decision management plan', 'Decision criteria matrices', 'Alternatives analysis reports', 'Decision records with rationale', 'Stakeholder input documentation'],
            comprehensive: ['Decision governance framework', 'Advanced decision models', 'Comprehensive alternatives analysis', 'Uncertainty and sensitivity analyses', 'Decision effectiveness metrics']
        },
        outputs: [
            { name: 'Decision records', feedsInto: 'Configuration Management (Standard), System Analysis (Standard)' },
            { name: 'Alternatives analysis', feedsInto: 'Architecture Definition (Standard), Design Definition (Standard)' }
        ],
        saActivities: ['Document SA-related decisions', 'Analyze SA alternatives and trade-offs', 'Record rationale for SA choices', 'Track SA decision effectiveness'],
        saDeliverables: ['SA Decision Records', 'SA Trade-off Analysis', 'SA Decision Rationale', 'SA Decision Effectiveness Metrics']
    },
    12: {
        activities: {
            basic: ['(*) Register risks (incl. Problems & Obvious Risks)', 'Assess using simple matrix (H/M/L)', '(*) Report risks basically', 'Monitor via informal methods'],
            standard: ['Plan risk management formally', 'Detail risk register with probability/impact', 'Plan responses with triggers and owners', 'Report regularly to stakeholders', 'Review risks at milestones'],
            comprehensive: ['Document risk management framework', 'Model/simulate risks with distributions', 'Strategize responses with contingencies', 'Dashboard with leading indicators', 'Analyze risk management effectiveness']
        },
        deliverables: {
            basic: ['Simple risk register', 'Risk assessment matrix (H/M/L)', 'Basic risk reports'],
            standard: ['Risk Management Plan (RMP)', 'Detailed risk register', 'Risk response plans', 'Regular risk reports', 'Risk review records'],
            comprehensive: ['Risk management framework', 'Advanced risk models and simulations', 'Detailed risk response strategies', 'Risk dashboards with leading indicators', 'Integrated risk database', 'Risk management effectiveness metrics']
        },
        outputs: [
            { name: 'Risk register', feedsInto: 'Project Planning (Standard), Decision Management (Standard)' },
            { name: 'Risk assessment', feedsInto: 'System Analysis (Standard), Quality Assurance (Standard)' },
            { name: 'Risk response plans', feedsInto: 'Configuration Management (Comprehensive), Integration (Comprehensive)' }
        ],
        saActivities: ['Identify and assess safety risks', 'Integrate SA risks into project risk register', 'Develop SA risk responses', 'Monitor safety-critical risks', 'Track SA risk indicators'],
        saDeliverables: ['Safety Risk Register', 'SA Risk Assessment', 'SA Risk Response Plans', 'Safety Risk Dashboard', 'SA Risk Monitoring Reports']
    },
    13: {
        activities: {
            basic: ['(*) List configuration items (CIs)', 'Request changes simply (informal)', 'Report status (basic)', '(*) Control versions (manual or simple tool)'],
            standard: ['Plan configuration management', 'Identify configuration scheme', 'Control via Change Control Board (CCB)', 'Account status formally', 'Audit configurations'],
            comprehensive: ['Plan comprehensively with strategy', 'Systematically identify with structure', 'Analyze change impacts with traceability', 'Automate reports with dashboards', 'Integrate with PLM/ALM systems']
        },
        deliverables: {
            basic: ['Configuration item list', 'Simple change request forms', 'Basic configuration status reports', 'Version control records'],
            standard: ['Configuration Management Plan (CMP)', 'Configuration identification scheme', 'Change control board procedures', 'Configuration status accounting reports', 'Configuration audit reports', 'Baseline documentation'],
            comprehensive: ['Comprehensive CM plan', 'Detailed configuration identification system', 'Advanced change control with impact analysis', 'Automated configuration status reports', 'Comprehensive audit documentation', 'Configuration metrics dashboard', 'PLM/ALM system integration']
        },
        outputs: [
            { name: 'CI list', feedsInto: 'Integration (Basic), Implementation (Standard)' },
            { name: 'Baselines', feedsInto: 'Verification (Standard), Validation (Standard)' },
            { name: 'Change records', feedsInto: 'Project Assessment (Standard), Quality Assurance (Standard)' }
        ],
        saActivities: ['Manage safety-related configuration items', 'Control safety baseline changes', 'Maintain SA documentation under CM', 'Track safety-critical item versions'],
        saDeliverables: ['Safety CI List', 'Safety Baseline Records', 'SA Change Control Records', 'Safety Documentation Version Control']
    },
    14: {
        activities: {
            basic: ['(*) Structure repository', 'List access controls', '(*) Backup data', 'Inventory information'],
            standard: ['Plan information management', 'Categorize scheme with classification', 'Control access with procedures', 'Plan recovery with procedures', 'Protocol exchanges with stakeholders'],
            comprehensive: ['Document information architecture', 'Schema metadata with relationships', 'Matrix access with audit procedures', 'Plan continuity with contingencies', 'Agree exchanges with formal agreements']
        },
        deliverables: {
            basic: ['Information repository structure', 'Basic access control list', 'Backup procedures', 'Simple information inventory'],
            standard: ['Information management plan', 'Information categorization scheme', 'Access control procedures', 'Backup and recovery plan', 'Information exchange protocols', 'Information security procedures'],
            comprehensive: ['Information architecture documentation', 'Metadata schema and relationships', 'Access control matrix with audit', 'Comprehensive backup/recovery/continuity plan', 'Information exchange agreements', 'Information security framework', 'Information lifecycle policies', 'Information quality metrics']
        },
        outputs: [
            { name: 'Repository structure', feedsInto: 'Knowledge Management (Basic), all processes (storage)' },
            { name: 'Access controls', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Manage SA documentation repository', 'Control access to safety information', 'Backup safety-critical data', 'Maintain SA information inventory'],
        saDeliverables: ['SA Document Repository', 'SA Access Control List', 'SA Data Backup Records', 'SA Information Inventory']
    },
    15: {
        activities: {
            basic: ['(*) Define simple metrics (schedule, cost, quality)', '(*) Collect data (manual)', 'Report measurements (basic)'],
            standard: ['Plan measurement with objectives', 'Define measurement constructs', 'Procedure collection with automation', 'Analyze trends', 'Review measures periodically'],
            comprehensive: ['Plan comprehensively with strategy', 'Framework measurement with models', 'Automate tools with dashboards', 'Analyze methods with statistics', 'Evaluate effectiveness continuously']
        },
        deliverables: {
            basic: ['Simple metrics definitions', 'Basic data collection forms', 'Measurement reports'],
            standard: ['Measurement plan', 'Measurement construct definitions', 'Data collection procedures', 'Analysis reports with trends', 'Measurement review records'],
            comprehensive: ['Comprehensive measurement plan', 'Advanced measurement framework', 'Automated data collection tools', 'Statistical analysis methodologies', 'Predictive models documentation', 'Measurement effectiveness evaluation', 'Integrated measurement dashboard']
        },
        outputs: [
            { name: 'Metrics definitions', feedsInto: 'Project Assessment (Standard), Portfolio Management (Standard)' },
            { name: 'Trend analysis', feedsInto: 'Decision Management (Standard), Risk Management (Comprehensive)' }
        ],
        saActivities: ['Define SA metrics (RAMS indicators)', 'Collect SA performance data', 'Analyze SA trends', 'Report SA measurement results'],
        saDeliverables: ['SA Metrics Definitions', 'SA Data Collection Records', 'SA Trend Analysis Reports', 'SA Measurement Dashboard']
    },
    16: {
        activities: {
            basic: ['(*) Plan basic assurance', '(*) Conduct audits (informal)', '(*) Report non-conformances', 'Track resolutions (simple)'],
            standard: ['Develop assurance plan', 'Perform evaluations with criteria', 'Report regularly to stakeholders', 'Initiate improvements with actions'],
            comprehensive: ['Strategize assurance with objectives', 'Conduct comprehensive audits with methodology', 'Analyze trends for early warning', 'Drive improvement initiatives with metrics']
        },
        deliverables: {
            basic: ['Quality assurance plan', 'Audit reports', 'Non-conformance records', 'Resolution tracking'],
            standard: ['Detailed quality assurance plan', 'Evaluation procedures and results', 'Regular quality reports', 'Improvement action plans'],
            comprehensive: ['Quality assurance strategy', 'Comprehensive evaluation program', 'Quality trend analyses', 'Formal improvement initiative documentation', 'Assurance effectiveness metrics']
        },
        outputs: [
            { name: 'Audit reports', feedsInto: 'Stakeholder Needs (Standard), Validation (Standard)' },
            { name: 'Non-conformance records', feedsInto: 'Project Assessment (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Conduct SA audits', 'Verify SA process compliance', 'Track SA non-conformances', 'Review safety documentation quality'],
        saDeliverables: ['SA Audit Reports', 'SA Compliance Records', 'SA Non-conformance Log', 'SA Quality Review Records']
    },
    17: {
        activities: {
            basic: ['(*) Define problem statement', '(*) Explore solution alternatives (informal)', '(*) Identify initial stakeholders (~3 groups)'],
            standard: ['Develop analysis plan', 'Map stakeholders (3-4 groups)', 'Analyze problems with context', 'Define initial concepts'],
            comprehensive: ['Perform comprehensive analysis', 'Model stakeholder value (5+ groups)', 'Conduct opportunity analysis with PESTEL', 'Develop business cases with ROI']
        },
        deliverables: {
            basic: ['Problem statement', 'Solution alternatives', 'Initial stakeholder list', 'ConOps (can be part of SRD)'],
            standard: ['Business/mission analysis plan', 'Stakeholder maps', 'Problem definition document', 'Initial Concept of Operations'],
            comprehensive: ['Comprehensive problem analysis', 'Stakeholder value models', 'Opportunity/risk profiles', 'Detailed business case documentation']
        },
        outputs: [
            { name: 'Problem statement', feedsInto: 'Stakeholder Needs (Basic), Portfolio Management (Standard)' },
            { name: 'Solution alternatives', feedsInto: 'System Requirements (Basic), Architecture Definition (Basic)' }
        ],
        saActivities: ['SA scoping and boundary definition', 'Preliminary hazard identification', 'Initial SA Criticality assessment', 'Identify safety-related stakeholders'],
        saDeliverables: ['SA Scoping Statement', 'Preliminary Hazard List (PHL)', 'SA Criticality Tier determination', 'Safety stakeholder register']
    },
    18: {
        activities: {
            basic: ['(*) List stakeholders', '(*) Elicit basic needs (interviews)', 'Validate simply (review)', 'Note constraints'],
            standard: ['Analyze stakeholders with influence', 'Elicit needs formally with techniques', 'Validate with plan and criteria', 'Analyze constraints with impact', 'Resolve conflicts with stakeholders'],
            comprehensive: ['Map stakeholder influence comprehensively', 'Model comprehensive needs', 'Apply multiple validation techniques', 'Strategize validation with engagement', 'Analyze constraint impacts comprehensively']
        },
        deliverables: {
            basic: ['Stakeholder list', 'Needs statements', 'Simple validation records', 'Basic constraints list'],
            standard: ['Stakeholder analysis document', 'Stakeholder needs specification', 'Elicitation records', 'Validation plan and results', 'Constraints analysis', 'Conflict resolution records'],
            comprehensive: ['Detailed stakeholder influence maps', 'Comprehensive needs models', 'Multiple elicitation technique results', 'Formal validation strategy', 'Extensive constraints impact analysis', 'Conflict resolution process documentation', 'Stakeholder engagement plan']
        },
        outputs: [
            { name: 'Stakeholder list', feedsInto: 'Project Planning (Standard), System Requirements (Basic)' },
            { name: 'Needs statements', feedsInto: 'System Requirements (Basic), Validation (Basic)' }
        ],
        saActivities: ['Capture safety needs from stakeholders', 'Define mission profile and operational scenarios', 'Establish preliminary RAM targets', 'Identify safety constraints'],
        saDeliverables: ['Safety needs register', 'Mission profile documentation', 'Preliminary RAM targets', 'Safety constraints list']
    },
    19: {
        activities: {
            basic: ['(*) Document requirements (simple list)', 'Trace simply with matrix', 'Review requirements (informal)', 'Identify basic Safety & RAM targets'],
            standard: ['Plan requirements development', 'Specify requirements with attributes', 'Attribute in database', 'Trace with matrix', 'Validate records', 'Plan verification', 'Identify Safety & RAM Requirements'],
            comprehensive: ['Model behaviors with formal notation', 'Specify formally with models', 'Manage comprehensive database', 'Document traceability network', 'Strategize validation', 'Plan verification comprehensively', 'Formal Safety & RAM Requirements (EN 50126 Phase 3/4)']
        },
        deliverables: {
            basic: ['System Requirements Document (SRD)', 'Simple traceability matrix', 'Requirements review records', 'Preliminary Hazard List (PHL)', 'Basic RAM Targets'],
            standard: ['Requirements development plan', 'System Specification (SS)', 'Requirements database with attributes', 'Traceability matrix', 'Validation records', 'Verification planning documentation', 'Change management records', 'Safety Requirement Specification (SRS) - Preliminary'],
            comprehensive: ['Requirements models (behavior, functional)', 'Formal requirements specification', 'Comprehensive requirements database', 'Complete traceability network', 'Detailed validation strategy', 'Comprehensive verification planning', 'Change impact analysis methodology', 'Requirements quality metrics', 'Safety Case (per EN 50126)']
        },
        outputs: [
            { name: 'Requirements document', feedsInto: 'Architecture Definition (Basic), Verification (Basic)' },
            { name: 'Traceability matrix', feedsInto: 'Verification (Standard), Validation (Standard)' }
        ],
        saActivities: ['Perform risk analysis (PHA)', 'Define RAMS requirements', 'Establish and maintain Hazard Log', 'Allocate safety integrity levels', 'Define safety functional requirements'],
        saDeliverables: ['Preliminary Hazard Analysis (PHA)', 'RAMS Requirements Specification', 'Hazard Log', 'SIL Allocation Matrix', 'Safety Requirements Specification']
    },
    20: {
        activities: {
            basic: ['(*) Define concepts (block diagrams)', '(*) List interfaces', 'Evaluate options (informal)', 'Document architecture'],
            standard: ['Plan architecture development', 'Develop with viewpoints per ISO 42010', 'Create interface control documents', 'Evaluate alternatives with trade studies', 'Plan architecture governance'],
            comprehensive: ['Model architectures in formal notation', 'Develop comprehensive description', 'Specify interfaces in detail', 'Evaluate with formal methodology', 'Govern architecture decisions', 'Measure architecture quality']
        },
        deliverables: {
            basic: ['Simple architecture description', 'Basic interface list', 'Architecture diagrams', 'Evaluation notes'],
            standard: ['Architecture development plan', 'Architecture description with views', 'Interface control document', 'Architecture alternatives analysis', 'Architecture evaluation results', 'Architecture governance plan'],
            comprehensive: ['Architecture models in formal notation', 'Comprehensive architecture description', 'Detailed interface specifications', 'Extensive alternatives analysis with trade studies', 'Formal evaluation report', 'Architecture governance documentation', 'Architecture metrics', 'Patterns and reference architectures']
        },
        outputs: [
            { name: 'Architecture description', feedsInto: 'Design Definition (Basic), System Requirements (Standard)' },
            { name: 'Interface specifications', feedsInto: 'Integration (Standard), Verification (Standard)' }
        ],
        saActivities: ['Perform RAMS apportionment', 'Allocate SIL to subsystems', 'Define redundancy and fault tolerance strategies', 'Conduct architecture safety reviews', 'Define safety partitioning and isolation'],
        saDeliverables: ['RAMS Apportionment Document', 'SIL Allocation to Architecture Elements', 'Fault Tolerance Strategy Document', 'Architecture Safety Review Records', 'Safety Partitioning Specification']
    },
    21: {
        activities: {
            basic: ['(*) Create design documentation', '(*) Create design diagrams', 'Select technologies', 'Basic verification'],
            standard: ['Plan design process', 'Develop comprehensive documentation', 'Analyze alternatives', 'Verify designs with analysis', 'Assess technologies', 'Conduct design reviews'],
            comprehensive: ['Model designs in formal notation', 'Develop detailed multi-view documentation', 'Optimize with extensive analysis', 'Comprehensive verification strategy', 'Advanced technology assessment with roadmap', 'Formal design reviews']
        },
        deliverables: {
            basic: ['Design documentation', 'Design diagrams', 'Technology selections', 'Basic verification records'],
            standard: ['Design plan', 'Comprehensive design documentation', 'Design alternatives analysis', 'Verification results', 'Technology assessment report', 'Design review records'],
            comprehensive: ['Design models in formal notation', 'Detailed multi-view documentation', 'Extensive alternatives analysis', 'Comprehensive verification results', 'Advanced technology roadmap', 'Formal design review documentation', 'Design patterns catalog', 'Design quality metrics']
        },
        outputs: [
            { name: 'Design documentation', feedsInto: 'Implementation (Basic), Integration (Standard)' },
            { name: 'Technology assessment', feedsInto: 'Risk Management (Standard), Decision Management (Standard)' }
        ],
        saActivities: ['Perform FMEA/FMECA', 'Conduct maintainability analysis', 'Execute safety design reviews', 'Define diagnostic and test provisions', 'Analyze failure modes and effects'],
        saDeliverables: ['FMEA/FMECA Report', 'Maintainability Analysis Report', 'Safety Design Review Records', 'Diagnostic Strategy Document', 'Failure Modes Analysis']
    },
    22: {
        activities: {
            basic: ['(*) Perform basic analyses', 'Document analysis data', 'Document methodology', 'Identify preliminary hazards'],
            standard: ['Plan analysis activities', 'Define analysis methodologies', 'Conduct analyses with recommendations', 'Define tool usage', 'Support decisions', 'Perform RAM Analysis (FMEA)'],
            comprehensive: ['Develop analysis strategy', 'Create comprehensive framework', 'Perform advanced modeling/simulation', 'Validate methodologies', 'Document tool environments', 'Quantify uncertainties', 'Measure analysis effectiveness', 'Functional Safety Analysis & RAM Modeling (EN 50126 Phase 5)']
        },
        deliverables: {
            basic: ['Simple analysis reports', 'Analysis data', 'Basic methodology documentation'],
            standard: ['Analysis plan', 'Analysis methodologies documentation', 'Analysis reports with recommendations', 'Tool usage guidelines', 'Decision support documentation', 'Hazard Log (Standardized)', 'RAM Analysis (FMEA/FMECA)'],
            comprehensive: ['Analysis strategy', 'Comprehensive analysis framework', 'Advanced modeling/simulation documentation', 'Detailed methodology with validation', 'Tool environment documentation', 'Uncertainty quantification', 'Analysis effectiveness metrics', 'Decision support with sensitivity analysis', 'Full Hazard Log & Analysis (HAZOP/FTA)', 'RAM Modeling & Prediction']
        },
        outputs: [
            { name: 'Analysis reports', feedsInto: 'Decision Management (Basic), Architecture Definition (Standard)' },
            { name: 'Trade study results', feedsInto: 'Design Definition (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Conduct RAMS trade studies', 'Perform availability modeling', 'Execute reliability predictions', 'Analyze safety risks', 'Support safety case development'],
        saDeliverables: ['RAMS Trade Study Reports', 'Availability Model and Analysis', 'Reliability Prediction Reports', 'Safety Risk Analysis', 'Safety Case Evidence']
    },
    23: {
        activities: {
            basic: ['(*) Build per specifications', 'Basic acceptance testing', 'Document product'],
            standard: ['Plan implementation with procedures', 'Track progress', 'Execute acceptance tests', 'Create comprehensive documentation', 'Conduct implementation reviews'],
            comprehensive: ['Develop implementation strategy', 'Optimize with advanced techniques', 'Continuous monitoring dashboard', 'Comprehensive acceptance testing', 'Extensive documentation suite', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned']
        },
        deliverables: {
            basic: ['Implementation plan', 'Implementation records', 'Basic acceptance documentation', 'Product documentation'],
            standard: ['Detailed implementation plan', 'Progress reports', 'Acceptance test procedures/results', 'Comprehensive product documentation', 'Implementation review records'],
            comprehensive: ['Implementation strategy', 'Detailed procedures with optimization', 'Continuous monitoring dashboard', 'Comprehensive acceptance package', 'Extensive documentation suite', 'Formal review documentation', 'Implementation effectiveness metrics', 'Lessons learned']
        },
        outputs: [
            { name: 'Implemented product', feedsInto: 'Integration (Basic), Verification (Basic)' },
            { name: 'Implementation records', feedsInto: 'Configuration Management (Standard), Quality Assurance (Standard)' }
        ],
        saActivities: ['Implement RAMS QA procedures', 'Conduct manufacturing FMEA', 'Perform safety-related inspections', 'Execute component safety testing', 'Maintain safety traceability'],
        saDeliverables: ['RAMS QA Records', 'Manufacturing FMEA Report', 'Safety Inspection Records', 'Component Safety Test Reports', 'Safety Traceability Records']
    },
    24: {
        activities: {
            basic: ['(*) Integrate system elements', '(*) Verify interfaces', 'Perform integration testing', 'Track integration issues'],
            standard: ['Plan integration with sequence', 'Specify integration environment', 'Execute procedures', 'Verify with records', 'Track issues in database', 'Conduct reviews'],
            comprehensive: ['Develop integration strategy', 'Plan with risk assessment', 'Manage integration environment', 'Comprehensive verification', 'Advanced issue analytics', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned']
        },
        deliverables: {
            basic: ['Integration plan', 'Integration records', 'Issue log', 'Integration report'],
            standard: ['Detailed integration plan with sequence', 'Integration environment specification', 'Integration procedures', 'Verification records', 'Issue tracking database', 'Integration review documentation'],
            comprehensive: ['Integration strategy', 'Advanced plan with risk assessment', 'Detailed environment management plan', 'Comprehensive verification results', 'Advanced issue tracking with analytics', 'Formal review documentation', 'Integration effectiveness metrics', 'Lessons learned']
        },
        outputs: [
            { name: 'Integrated system', feedsInto: 'Verification (Basic), Transition (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Conduct interface safety analysis', 'Perform RAM testing', 'Execute safety integration tests', 'Verify safety functions', 'Update Hazard Log with integration findings'],
        saDeliverables: ['Interface Safety Analysis Report', 'RAM Test Reports', 'Safety Integration Test Reports', 'Safety Function Verification Records', 'Updated Hazard Log']
    },
    25: {
        activities: {
            basic: ['(*) Plan verification', '(*) Execute verification procedures', '(*) Report results', 'Log defects'],
            standard: ['Plan with multiple methods', 'Specify verification environment', 'Execute comprehensive procedures', 'Track defects in database', 'Conduct reviews'],
            comprehensive: ['Develop verification strategy', 'Plan risk-based approach', 'Execute comprehensive procedures', 'Manage verification environment', 'Comprehensive reporting with traceability', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness']
        },
        deliverables: {
            basic: ['Verification plan', 'Verification procedures', 'Verification reports', 'Defect log'],
            standard: ['Detailed verification plan', 'Verification procedures (multiple methods)', 'Verification environment specification', 'Comprehensive verification reports', 'Defect tracking database', 'Verification review records'],
            comprehensive: ['Verification strategy', 'Detailed risk-based plans', 'Comprehensive procedures', 'Verification environment management', 'Extensive reports with complete traceability', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Verification effectiveness metrics']
        },
        outputs: [
            { name: 'Verification reports', feedsInto: 'Transition (Standard), Validation (Basic)' },
            { name: 'Defect records', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Verify RAMS requirements', 'Execute safety validation tests', 'Conduct safety function testing', 'Verify SIL compliance', 'Prepare safety verification evidence'],
        saDeliverables: ['RAMS Verification Reports', 'Safety Validation Test Reports', 'Safety Function Test Records', 'SIL Verification Evidence', 'Safety Verification Evidence Package']
    },
    26: {
        activities: {
            basic: ['(*) Plan transition', '(*) Install system', 'Provide basic training', 'Report transition'],
            standard: ['Plan detailed transition', 'Execute comprehensive installation', 'Verify operational readiness', 'Conduct training program', 'Review transition', 'Prepare documentation package'],
            comprehensive: ['Develop transition strategy', 'Plan with risk assessment', 'Install with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal reviews', 'Complete transition package', 'Measure effectiveness']
        },
        deliverables: {
            basic: ['Transition plan', 'Installation procedures', 'Training materials', 'Transition report'],
            standard: ['Detailed transition plan', 'Comprehensive installation procedures', 'Operational readiness verification plan', 'Training program', 'Transition review documentation', 'Transition documentation package'],
            comprehensive: ['Transition strategy', 'Detailed plan with risk assessment', 'Installation procedures with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal review documentation', 'Complete transition package', 'Transition effectiveness metrics']
        },
        outputs: [
            { name: 'Deployed system', feedsInto: 'Operation (Basic), Maintenance (Basic)' },
            { name: 'Training materials', feedsInto: 'Operation (Standard), Knowledge Management (Standard)' }
        ],
        saActivities: ['Conduct safety acceptance activities', 'Obtain Safety Case approval', 'Execute operational safety validation', 'Transfer safety documentation', 'Conduct safety training for operators'],
        saDeliverables: ['Safety Acceptance Records', 'Approved Safety Case', 'Operational Safety Validation Report', 'Safety Documentation Package', 'Safety Training Records']
    },
    27: {
        activities: {
            basic: ['(*) Plan validation', '(*) Execute validation procedures', '(*) Report results', 'Log defects'],
            standard: ['Plan with multiple methods', 'Specify validation environment', 'Execute comprehensive procedures', 'Plan stakeholder involvement', 'Track defects in database', 'Conduct reviews'],
            comprehensive: ['Develop validation strategy', 'Plan with stakeholder focus', 'Execute comprehensive procedures', 'Manage validation environment', 'Comprehensive reporting with acceptance', 'Stakeholder involvement strategy', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness']
        },
        deliverables: {
            basic: ['Validation plan', 'Validation procedures', 'Validation reports', 'Defect log'],
            standard: ['Detailed validation plan', 'Validation procedures (multiple methods)', 'Validation environment specification', 'Comprehensive reports', 'Stakeholder involvement plan', 'Defect tracking database', 'Validation review records'],
            comprehensive: ['Validation strategy', 'Detailed plans with stakeholder focus', 'Comprehensive procedures', 'Validation environment management', 'Extensive reports with stakeholder acceptance', 'Stakeholder involvement strategy', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Validation effectiveness metrics']
        },
        outputs: [
            { name: 'Validation reports', feedsInto: 'Stakeholder Needs (Standard), System Requirements (Standard)' },
            { name: 'Stakeholder acceptance', feedsInto: 'Transition (Standard), Quality Assurance (Standard)' }
        ],
        saActivities: ['Validate RAMS requirements', 'Develop RAMS validation plan', 'Integrate ISA activities', 'Validate safety functions in operational context', 'Obtain safety sign-off'],
        saDeliverables: ['RAMS Validation Reports', 'RAMS Validation Plan', 'ISA Integration Records', 'Operational Safety Validation Report', 'Safety Acceptance Certificate']
    },
    28: {
        activities: {
            basic: ['(*) Execute operational procedures', '(*) Monitor performance', '(*) Track problems', 'Provide user support', 'Monitor basic RAM performance'],
            standard: ['Plan operations', 'Execute comprehensive procedures', 'Monitor with KPIs', 'Analyze performance', 'Manage problems', 'Provide user support procedures', 'Conduct reviews', 'Train operators', 'Track RAM & maintain Hazard Log'],
            comprehensive: ['Develop operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Advanced analytics', 'Problem management with root cause', 'Comprehensive user support', 'Formal reviews', 'Advanced training', 'Measure operational effectiveness', 'Continuous RAMS monitoring & FRACAS']
        },
        deliverables: {
            basic: ['Operational procedures', 'Performance reports', 'Problem records', 'User support documentation'],
            standard: ['Operational plan', 'Comprehensive procedures', 'Performance monitoring plan', 'Performance analysis reports', 'Problem management process', 'User support procedures', 'Operational review records', 'Training program'],
            comprehensive: ['Operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Advanced performance analytics', 'Problem management with root cause', 'Comprehensive user support infrastructure', 'Formal review documentation', 'Advanced training with evaluation', 'Operational effectiveness metrics', 'RAMS Validation Report']
        },
        outputs: [
            { name: 'Operational data', feedsInto: 'Maintenance (Basic), Measurement (Standard)' },
            { name: 'Problem records', feedsInto: 'Quality Assurance (Standard), Knowledge Management (Standard)' }
        ],
        saActivities: ['Implement FRACAS system', 'Monitor safety performance', 'Track and analyze failures', 'Maintain operational Hazard Log', 'Conduct periodic safety reviews'],
        saDeliverables: ['FRACAS Reports and Database', 'Safety Performance Monitoring Reports', 'Failure Analysis Reports', 'Operational Hazard Log', 'Periodic Safety Review Reports']
    },
    29: {
        activities: {
            basic: ['(*) Plan maintenance', '(*) Execute maintenance procedures', '(*) Track problems', 'Report maintenance', 'Address basic hazard controls'],
            standard: ['Plan detailed maintenance', 'Execute comprehensive procedures', 'Manage maintenance environment', 'Track problems in database', 'Conduct reviews', 'Prepare documentation package', 'Update Hazard Log post-maintenance'],
            comprehensive: ['Develop maintenance strategy', 'Detailed procedures with optimization', 'Predictive maintenance methodology', 'Manage maintenance environment', 'Advanced problem tracking/analysis', 'Formal reviews', 'Complete maintenance package', 'Measure effectiveness', 'RAMS performance review & optimization']
        },
        deliverables: {
            basic: ['Maintenance plan', 'Maintenance procedures', 'Problem records', 'Maintenance reports'],
            standard: ['Detailed maintenance plan', 'Comprehensive procedures', 'Maintenance environment specification', 'Problem tracking database', 'Maintenance review records', 'Maintenance documentation package'],
            comprehensive: ['Maintenance strategy', 'Detailed procedures with optimization', 'Predictive maintenance methodology', 'Maintenance environment management', 'Advanced problem tracking/analysis', 'Formal review documentation', 'Complete maintenance package', 'Maintenance effectiveness metrics']
        },
        outputs: [
            { name: 'Maintenance records', feedsInto: 'Operation (Basic), Configuration Management (Standard)' },
            { name: 'Problem trends', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ],
        saActivities: ['Track reliability growth', 'Conduct change impact analysis for safety', 'Perform post-maintenance safety verification', 'Update safety documentation', 'Analyze maintenance-related safety events'],
        saDeliverables: ['Reliability Growth Analysis', 'Safety Change Impact Analysis', 'Post-Maintenance Safety Verification Records', 'Updated Safety Documentation', 'Maintenance Safety Event Analysis']
    },
    30: {
        activities: {
            basic: ['(*) Plan disposal', '(*) Execute disposal procedures', 'Archive records', 'Report disposal'],
            standard: ['Plan detailed disposal', 'Execute comprehensive procedures', 'Assess environmental impact', 'Address health and safety', 'Conduct reviews', 'Plan archiving', 'Prepare documentation'],
            comprehensive: ['Develop disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental analysis', 'Detailed health and safety plan', 'Formal reviews', 'Complete disposal documentation', 'Advanced archiving strategy', 'Measure effectiveness']
        },
        deliverables: {
            basic: ['Disposal plan', 'Disposal procedures', 'Disposal report', 'Archive list'],
            standard: ['Detailed disposal plan', 'Comprehensive disposal procedures', 'Environmental assessment', 'Health and safety procedures', 'Disposal review records', 'Archiving plan', 'Disposal documentation package'],
            comprehensive: ['Disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental impact analysis', 'Detailed health and safety plan', 'Formal review documentation', 'Complete disposal documentation', 'Advanced archiving strategy', 'Disposal effectiveness metrics']
        },
        outputs: [
            { name: 'Disposal records', feedsInto: 'Information Management (Standard), Knowledge Management (Standard)' },
            { name: 'Archive', feedsInto: 'Knowledge Management (Basic)' }
        ],
        saActivities: ['Develop disposal safety case', 'Identify and manage hazardous materials', 'Conduct disposal safety assessment', 'Archive safety records', 'Close out Hazard Log'],
        saDeliverables: ['Disposal Safety Case', 'Hazardous Materials Inventory and Plan', 'Disposal Safety Assessment Report', 'Archived Safety Records', 'Hazard Log Closure Report']
    }
};

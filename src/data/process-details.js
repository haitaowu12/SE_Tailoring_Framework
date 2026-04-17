/**
 * SE Tailoring Model — Process Activities & Deliverables
 * _VERSION: 4.0 | _LAST_UPDATED: 2026-02
 * _SOURCE: 02-PRACTICAL/Process-Tailoring-Tables.md
 * 
 * Structure: { processId: { activities: {basic:[], standard:[], comprehensive:[]}, deliverables: {...}, outputs: [...] } }
 * Activities prefixed with (*) are essential/core even at Basic level.
 * Tags: [Safety] = gated by M5 ≥ 3; [RAM] = gated by M6 ≥ 3
 */

export const PROCESS_DETAILS = {
    9: {
        activities: {
            basic: ['(*) Develop basic project plan', '(*) Create simple schedule (milestone-based)', 'List resources', 'Estimate costs (high-level)'],
            standard: ['(*) Create Project Management Plan (PMP)', '(*) Develop Work Breakdown Structure (WBS)', 'Develop Integrated Master Schedule (IMS)', 'Plan resources in detail', 'Register risks formally', 'Schedule SA milestones and reviews [Safety]', 'Budget for SA activities [Safety]'],
            comprehensive: ['(*) Integrate multi-view planning', '(*) Perform probabilistic schedule analysis', 'Optimize resources with capacity modeling', 'Develop stakeholder communication plan', 'Create risk-based estimates', 'Integrate SA planning into project baseline [Safety]']
        },
        deliverables: {
            basic: ['Basic project plan', 'Simple schedule', 'Resource list', 'Cost estimate'],
            standard: ['Project Management Plan (PMP)', 'Work Breakdown Structure (WBS)', 'Integrated Master Schedule (IMS)', 'Resource management plan', 'Risk register', 'SA Milestone Schedule [Safety]'],
            comprehensive: ['Integrated planning documentation', 'Multi-view WBS', 'Probabilistic schedule analysis', 'Resource optimization analysis', 'Risk-based estimates', 'Stakeholder communication plan']
        },
        outputs: [
            { name: 'Project plans', feedsInto: 'Project Assessment (all levels), Infrastructure Management (Basic)' },
            { name: 'Schedule', feedsInto: 'All Technical Processes (for planning), Measurement (Basic)' },
            { name: 'Resource plan', feedsInto: 'HR Management (Basic), Infrastructure Management (Standard)' },
            { name: 'Risk register', feedsInto: 'Risk Management (Standard), Decision Management (Standard)' }
        ]
    },
    10: {
        activities: {
            basic: ['(*) Report project status', '(*) Log issues (simple tracking)', 'Minute meetings', 'Log changes (record only)'],
            standard: ['(*) Measure performance against baselines (EVM)', '(*) Track issues with severity and ownership', 'Review actions with owners and deadlines', 'Control changes through formal process', 'Plan corrections with impact assessment', 'Track SA metrics and KPIs [Safety]', 'Monitor SA action items [Safety]'],
            comprehensive: ['(*) Dashboard performance monitoring with KPIs', '(*) Track issues with metrics and trend analysis', 'Analyze trends for early warning', 'Model predictions for corrective actions', 'Implement continuous improvement', 'Report SA status with dashboards [Safety]']
        },
        deliverables: {
            basic: ['Status reports', 'Issue log', 'Meeting minutes', 'Basic change log'],
            standard: ['Performance measurement reports (EVM)', 'Issue management database', 'Review records with action tracking', 'Change control documentation', 'Corrective action plans', 'SA Status Reports [Safety]'],
            comprehensive: ['Integrated performance dashboard', 'Advanced issue tracking with root cause', 'Comprehensive review documentation', 'Change impact analyses', 'Trend analysis reports', 'Predictive performance models']
        },
        outputs: [
            { name: 'Status reports', feedsInto: 'Information Management (Basic), Portfolio Management (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Basic), Knowledge Management (Basic)' },
            { name: 'Change records', feedsInto: 'Configuration Management (Standard), Decision Management (Standard)' }
        ]
    },
    11: {
        activities: {
            basic: ['(*) Analyze basic alternatives (informal)', '(*) Record decision outcomes'],
            standard: ['(*) Plan decision process with criteria', '(*) Create decision criteria matrices with weights', 'Report analyses with rationale', 'Document rationale and trade-offs', 'Analyze SA alternatives and trade-offs [Safety]'],
            comprehensive: ['(*) Govern decision framework with policies', '(*) Model advanced scenarios with sensitivity analysis', 'Analyze uncertainties with Monte Carlo', 'Measure decision effectiveness', 'Record rationale for SA choices [Safety]']
        },
        deliverables: {
            basic: ['Decision records', 'Basic alternatives analysis', 'Meeting minutes with decisions'],
            standard: ['Decision management plan', 'Decision criteria matrices', 'Alternatives analysis reports', 'Decision records with rationale', 'Stakeholder input documentation', 'SA Trade-off Analysis [Safety]'],
            comprehensive: ['Decision governance framework', 'Advanced decision models', 'Comprehensive alternatives analysis', 'Uncertainty and sensitivity analyses', 'Decision effectiveness metrics']
        },
        outputs: [
            { name: 'Decision records', feedsInto: 'Configuration Management (Standard), System Analysis (Standard)' },
            { name: 'Alternatives analysis', feedsInto: 'Architecture Definition (Standard), Design Definition (Standard)' }
        ]
    },
    12: {
        activities: {
            basic: ['(*) Register risks (incl. obvious hazards)', '(*) Assess using simple matrix (H/M/L)', '(*) Report risks basically', 'Monitor via informal methods'],
            standard: ['(*) Plan risk management formally', '(*) Detail risk register with probability/impact', '(*) Plan responses with triggers and owners', 'Report regularly to stakeholders', 'Review risks at milestones', 'Identify and assess safety hazards [Safety]', 'Develop SA risk responses [Safety]'],
            comprehensive: ['(*) Document risk management framework', '(*) Model/simulate risks with distributions', '(*) Strategize responses with contingencies', 'Dashboard with leading indicators', 'Analyze risk management effectiveness', 'Integrate SA risks into quantitative models [Safety]', 'Track SA risk indicators [Safety]']
        },
        deliverables: {
            basic: ['Simple risk register', 'Risk assessment matrix (H/M/L)', 'Basic risk reports'],
            standard: ['Risk Management Plan (RMP)', 'Detailed risk register', 'Risk response plans', 'Regular risk reports', 'Risk review records', 'Safety Hazard Register [Safety]', 'SA Risk Response Plans [Safety]'],
            comprehensive: ['Risk management framework', 'Advanced risk models and simulations', 'Detailed risk response strategies', 'Risk dashboards with leading indicators', 'Integrated risk database', 'Risk management effectiveness metrics']
        },
        outputs: [
            { name: 'Risk register', feedsInto: 'Project Planning (Standard), Decision Management (Standard)' },
            { name: 'Risk assessment', feedsInto: 'System Analysis (Standard), Quality Assurance (Standard)' },
            { name: 'Risk response plans', feedsInto: 'Configuration Management (Comprehensive), Integration (Comprehensive)' }
        ]
    },
    13: {
        activities: {
            basic: ['(*) List configuration items (CIs)', '(*) Control versions (manual or simple tool)', 'Request changes simply (informal)', 'Report status (basic)'],
            standard: ['(*) Plan configuration management', '(*) Identify configuration scheme', 'Control via Change Control Board (CCB)', 'Account status formally', 'Audit configurations', 'Manage safety-related CIs [Safety]', 'Control safety baseline changes [Safety]'],
            comprehensive: ['(*) Plan comprehensively with strategy', '(*) Systematically identify with structure', 'Analyze change impacts with traceability', 'Automate reports with dashboards', 'Integrate with PLM/ALM systems', 'Maintain SA documentation under CM [Safety]']
        },
        deliverables: {
            basic: ['Configuration item list', 'Simple change request forms', 'Basic configuration status reports', 'Version control records'],
            standard: ['Configuration Management Plan (CMP)', 'Configuration identification scheme', 'Change control board procedures', 'Configuration status accounting reports', 'Configuration audit reports', 'Baseline documentation', 'Safety CI List [Safety]'],
            comprehensive: ['Comprehensive CM plan', 'Detailed configuration identification system', 'Advanced change control with impact analysis', 'Automated configuration status reports', 'Comprehensive audit documentation', 'Configuration metrics dashboard', 'PLM/ALM system integration']
        },
        outputs: [
            { name: 'CI list', feedsInto: 'Integration (Basic), Implementation (Standard)' },
            { name: 'Baselines', feedsInto: 'Verification (Standard), Validation (Standard)' },
            { name: 'Change records', feedsInto: 'Project Assessment (Standard), Quality Assurance (Standard)' }
        ]
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
            { name: 'Repository structure', feedsInto: 'Knowledge Management (Basic), all processes (storage)' },
            { name: 'Access controls', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ]
    },
    15: {
        activities: {
            basic: ['(*) Define simple metrics (schedule, cost, quality)', '(*) Collect data (manual)', 'Report measurements (basic)'],
            standard: ['(*) Plan measurement with objectives', '(*) Define measurement constructs', 'Procedure collection with automation', 'Analyze trends', 'Review measures periodically', 'Define SA metrics (RAMS indicators) [Safety]'],
            comprehensive: ['(*) Plan comprehensively with strategy', '(*) Framework measurement with models', 'Automate tools with dashboards', 'Analyze methods with statistics', 'Evaluate effectiveness continuously', 'Collect and report SA performance data [Safety]']
        },
        deliverables: {
            basic: ['Simple metrics definitions', 'Basic data collection forms', 'Measurement reports'],
            standard: ['Measurement plan', 'Measurement construct definitions', 'Data collection procedures', 'Analysis reports with trends', 'Measurement review records', 'SA Metrics Definitions [Safety]'],
            comprehensive: ['Comprehensive measurement plan', 'Advanced measurement framework', 'Automated data collection tools', 'Statistical analysis methodologies', 'Predictive models documentation', 'Measurement effectiveness evaluation', 'Integrated measurement dashboard']
        },
        outputs: [
            { name: 'Metrics definitions', feedsInto: 'Project Assessment (Standard), Portfolio Management (Standard)' },
            { name: 'Trend analysis', feedsInto: 'Decision Management (Standard), Risk Management (Comprehensive)' }
        ]
    },
    16: {
        activities: {
            basic: ['(*) Plan basic quality assurance', '(*) Conduct audits (informal)', '(*) Report non-conformances', 'Track resolutions (simple)'],
            standard: ['(*) Develop quality assurance plan', '(*) Perform evaluations with criteria', '(*) Report regularly to stakeholders', 'Initiate improvements with actions', 'Conduct SA audits [Safety]', 'Verify SA process compliance [Safety]'],
            comprehensive: ['(*) Strategize assurance with objectives', '(*) Conduct comprehensive audits with methodology', '(*) Analyze trends for early warning', 'Drive improvement initiatives with metrics', 'Review safety documentation quality [Safety]']
        },
        deliverables: {
            basic: ['Quality assurance plan', 'Audit reports', 'Non-conformance records', 'Resolution tracking'],
            standard: ['Detailed quality assurance plan', 'Evaluation procedures and results', 'Regular quality reports', 'Improvement action plans', 'SA Audit Reports [Safety]', 'SA Compliance Records [Safety]'],
            comprehensive: ['Quality assurance strategy', 'Comprehensive evaluation program', 'Quality trend analyses', 'Formal improvement initiative documentation', 'Assurance effectiveness metrics']
        },
        outputs: [
            { name: 'Audit reports', feedsInto: 'Stakeholder Needs (Standard), Validation (Standard)' },
            { name: 'Non-conformance records', feedsInto: 'Project Assessment (Standard), Risk Management (Standard)' }
        ]
    },
    17: {
        activities: {
            basic: ['(*) Define problem statement', '(*) Explore solution alternatives (informal)', '(*) Identify initial stakeholders (~3 groups)'],
            standard: ['(*) Develop analysis plan', '(*) Map stakeholders (3-4 groups)', '(*) Analyze problems with context', 'Define initial concepts', 'Preliminary hazard identification [Safety]', 'Initial SA criticality assessment [Safety]'],
            comprehensive: ['(*) Perform comprehensive analysis', '(*) Model stakeholder value (5+ groups)', '(*) Conduct opportunity analysis with PESTEL', 'Develop business cases with ROI', 'Identify safety-related stakeholders [Safety]']
        },
        deliverables: {
            basic: ['Problem statement', 'Solution alternatives', 'Initial stakeholder list', 'ConOps (can be part of SRD)'],
            standard: ['Business/mission analysis plan', 'Stakeholder maps', 'Problem definition document', 'Initial Concept of Operations', 'Preliminary Hazard List (PHL) [Safety]', 'SA Criticality Tier determination [Safety]'],
            comprehensive: ['Comprehensive problem analysis', 'Stakeholder value models', 'Opportunity/risk profiles', 'Detailed business case documentation']
        },
        outputs: [
            { name: 'Problem statement', feedsInto: 'Stakeholder Needs (Basic), Portfolio Management (Standard)' },
            { name: 'Solution alternatives', feedsInto: 'System Requirements Definition (Basic), Architecture Definition (Basic)' },
            { name: 'ConOps', feedsInto: 'Stakeholder Needs (Standard), Validation (Standard)' }
        ]
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
            { name: 'Stakeholder list', feedsInto: 'Project Planning (Standard), System Requirements (Basic)' },
            { name: 'Needs statements', feedsInto: 'System Requirements (Basic), Validation (Basic)' },
            { name: 'Constraints list', feedsInto: 'Architecture Definition (Standard), System Requirements (Standard)' }
        ]
    },
    19: {
        activities: {
            basic: ['(*) Document requirements (simple list)', '(*) Trace simply with matrix', 'Review requirements (informal)'],
            standard: ['(*) Plan requirements development', '(*) Specify requirements with attributes', 'Manage requirements in database', 'Trace with matrix', 'Validate requirements records', 'Plan verification', 'Identify safety requirements [Safety]', 'Define RAM requirements [RAM]', 'Establish and maintain Hazard Log [Safety]', 'Allocate safety integrity levels (SIL) [Safety]'],
            comprehensive: ['(*) Model behaviors with formal notation', '(*) Specify formally with models', 'Manage comprehensive database', 'Document traceability network', 'Strategize validation', 'Plan verification comprehensively', 'Define safety functional requirements [Safety]', 'Formal RAMS requirements per EN 50126 [RAM]']
        },
        deliverables: {
            basic: ['System Requirements Document (SRD)', 'Simple traceability matrix', 'Requirements review records'],
            standard: ['Requirements development plan', 'System Specification (SS)', 'Requirements database with attributes', 'Traceability matrix', 'Validation records', 'Verification planning documentation', 'Preliminary Hazard Analysis (PHA) [Safety]', 'RAMS Requirements Specification [RAM]', 'Hazard Log [Safety]', 'SIL Allocation Matrix [Safety]'],
            comprehensive: ['Formal requirements specification', 'Comprehensive requirements database', 'Complete traceability network', 'Detailed validation strategy', 'Comprehensive verification planning', 'Change impact analysis methodology', 'Requirements quality metrics', 'Safety Requirements Specification [Safety]', 'Safety Case (per EN 50126) [Safety]']
        },
        outputs: [
            { name: 'Requirements document', feedsInto: 'Architecture Definition (Basic), Verification (Basic)' },
            { name: 'Traceability matrix', feedsInto: 'Verification (Standard), Validation (Standard)' },
            { name: 'Hazard Log', feedsInto: 'Risk Management (Standard), System Analysis (Standard), Validation (Standard)' }
        ]
    },
    20: {
        activities: {
            basic: ['(*) Define concepts (block diagrams)', '(*) List interfaces', 'Evaluate options (informal)', 'Document architecture'],
            standard: ['(*) Plan architecture development', '(*) Develop with viewpoints per ISO 42010', 'Create interface control documents (ICDs)', 'Evaluate alternatives with trade studies', 'Plan architecture governance', 'Perform RAMS apportionment [RAM]', 'Allocate SIL to subsystems [Safety]', 'Define safety partitioning and isolation [Safety]'],
            comprehensive: ['(*) Model architectures in formal notation', '(*) Develop comprehensive description', 'Specify interfaces in detail', 'Evaluate with formal methodology', 'Govern architecture decisions', 'Measure architecture quality', 'Define redundancy and fault tolerance strategies [RAM]', 'Conduct architecture safety reviews [Safety]']
        },
        deliverables: {
            basic: ['Simple architecture description', 'Basic interface list', 'Architecture diagrams', 'Evaluation notes'],
            standard: ['Architecture development plan', 'Architecture description with views', 'Interface control document (ICD)', 'Architecture alternatives analysis', 'Architecture evaluation results', 'Architecture governance plan', 'RAMS Apportionment Document [RAM]', 'SIL Allocation to Architecture Elements [Safety]'],
            comprehensive: ['Architecture models in formal notation', 'Comprehensive architecture description', 'Detailed interface specifications', 'Extensive alternatives analysis with trade studies', 'Formal evaluation report', 'Architecture governance documentation', 'Architecture metrics', 'Patterns and reference architectures', 'Fault Tolerance Strategy Document [RAM]', 'Safety Partitioning Specification [Safety]']
        },
        outputs: [
            { name: 'Architecture description', feedsInto: 'Design Definition (Basic), System Requirements Definition (Standard)' },
            { name: 'Interface specifications', feedsInto: 'Integration (Standard), Verification (Standard)' },
            { name: 'RAMS apportionment', feedsInto: 'Design Definition (Standard), Verification (Standard)' }
        ]
    },
    21: {
        activities: {
            basic: ['(*) Create design documentation', '(*) Create design diagrams', 'Select technologies', 'Basic verification'],
            standard: ['(*) Plan design process', '(*) Develop comprehensive documentation', 'Analyze alternatives', 'Verify designs with analysis', 'Assess technologies', 'Conduct design reviews', 'Perform FMEA/FMECA [RAM]', 'Conduct maintainability analysis [RAM]', 'Execute safety design reviews [Safety]'],
            comprehensive: ['(*) Model designs in formal notation', '(*) Develop detailed multi-view documentation', 'Optimize with extensive analysis', 'Comprehensive verification strategy', 'Advanced technology assessment with roadmap', 'Formal design reviews', 'Define diagnostic and test provisions [RAM]', 'Analyze failure modes and effects [RAM]']
        },
        deliverables: {
            basic: ['Design documentation', 'Design diagrams', 'Technology selections', 'Basic verification records'],
            standard: ['Design plan', 'Comprehensive design documentation', 'Design alternatives analysis', 'Verification results', 'Technology assessment report', 'Design review records', 'FMEA/FMECA Report [RAM]', 'Maintainability Analysis Report [RAM]', 'Safety Design Review Records [Safety]'],
            comprehensive: ['Design models in formal notation', 'Detailed multi-view documentation', 'Extensive alternatives analysis', 'Comprehensive verification results', 'Advanced technology roadmap', 'Formal design review documentation', 'Design patterns catalog', 'Design quality metrics', 'Diagnostic Strategy Document [RAM]']
        },
        outputs: [
            { name: 'Design documentation', feedsInto: 'Implementation (Basic), Integration (Standard)' },
            { name: 'Technology assessment', feedsInto: 'Risk Management (Standard), Decision Management (Standard)' },
            { name: 'FMEA/FMECA results', feedsInto: 'Risk Management (Standard), System Analysis (Standard)' }
        ]
    },
    22: {
        activities: {
            basic: ['(*) Perform basic analyses', '(*) Document analysis data', 'Document methodology'],
            standard: ['(*) Plan analysis activities', '(*) Define analysis methodologies', 'Conduct analyses with recommendations', 'Define tool usage', 'Support decisions', 'Perform RAM analysis (FMEA/FMECA) [RAM]', 'Conduct RAMS trade studies [RAM]', 'Analyze safety risks [Safety]'],
            comprehensive: ['(*) Develop analysis strategy', '(*) Create comprehensive framework', 'Perform advanced modeling/simulation', 'Validate methodologies', 'Document tool environments', 'Quantify uncertainties', 'Measure analysis effectiveness', 'Perform availability modeling [RAM]', 'Execute reliability predictions [RAM]', 'Support safety case development [Safety]']
        },
        deliverables: {
            basic: ['Simple analysis reports', 'Analysis data', 'Basic methodology documentation'],
            standard: ['Analysis plan', 'Analysis methodologies documentation', 'Analysis reports with recommendations', 'Tool usage guidelines', 'Decision support documentation', 'RAM Analysis Report (FMEA/FMECA) [RAM]', 'RAMS Trade Study Reports [RAM]', 'Safety Risk Analysis [Safety]'],
            comprehensive: ['Analysis strategy', 'Comprehensive analysis framework', 'Advanced modeling/simulation documentation', 'Detailed methodology with validation', 'Tool environment documentation', 'Uncertainty quantification', 'Analysis effectiveness metrics', 'Decision support with sensitivity analysis', 'Availability Model and Analysis [RAM]', 'Reliability Prediction Reports [RAM]', 'Full Hazard Log & Analysis (HAZOP/FTA) [Safety]', 'Safety Case Evidence [Safety]']
        },
        outputs: [
            { name: 'Analysis reports', feedsInto: 'Decision Management (Basic), Architecture Definition (Standard)' },
            { name: 'Trade study results', feedsInto: 'Design Definition (Standard), Risk Management (Standard)' },
            { name: 'Safety analysis', feedsInto: 'Risk Management (Standard), Verification (Standard)' }
        ]
    },
    23: {
        activities: {
            basic: ['(*) Build per specifications', '(*) Perform basic acceptance testing', 'Document product'],
            standard: ['(*) Plan implementation with procedures', '(*) Track progress', 'Execute acceptance tests', 'Create comprehensive documentation', 'Conduct implementation reviews', 'Perform safety-related inspections [Safety]', 'Execute component safety testing [Safety]'],
            comprehensive: ['(*) Develop implementation strategy', '(*) Optimize with advanced techniques', 'Continuous monitoring dashboard', 'Comprehensive acceptance testing', 'Extensive documentation suite', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Maintain safety traceability [Safety]']
        },
        deliverables: {
            basic: ['Implementation plan', 'Implementation records', 'Basic acceptance documentation', 'Product documentation'],
            standard: ['Detailed implementation plan', 'Progress reports', 'Acceptance test procedures/results', 'Comprehensive product documentation', 'Implementation review records', 'Safety Inspection Records [Safety]', 'Component Safety Test Reports [Safety]'],
            comprehensive: ['Implementation strategy', 'Detailed procedures with optimization', 'Continuous monitoring dashboard', 'Comprehensive acceptance package', 'Extensive documentation suite', 'Formal review documentation', 'Implementation effectiveness metrics', 'Lessons learned']
        },
        outputs: [
            { name: 'Implemented product', feedsInto: 'Integration (Basic), Verification (Basic)' },
            { name: 'Implementation records', feedsInto: 'Configuration Management (Standard), Quality Assurance (Standard)' }
        ]
    },
    24: {
        activities: {
            basic: ['(*) Integrate system elements', '(*) Verify interfaces', '(*) Perform integration testing', 'Track integration issues'],
            standard: ['(*) Plan integration with sequence', '(*) Specify integration environment', '(*) Execute procedures', 'Verify with records', 'Track issues in database', 'Conduct reviews', 'Perform RAM testing [RAM]', 'Execute safety integration tests [Safety]', 'Verify safety functions [Safety]'],
            comprehensive: ['(*) Develop integration strategy', '(*) Plan with risk assessment', '(*) Manage integration environment', 'Comprehensive verification', 'Advanced issue analytics', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Update Hazard Log with integration findings [Safety]']
        },
        deliverables: {
            basic: ['Integration plan', 'Integration records', 'Issue log', 'Integration report'],
            standard: ['Detailed integration plan with sequence', 'Integration environment specification', 'Integration procedures', 'Verification records', 'Issue tracking database', 'Integration review documentation', 'RAM Test Reports [RAM]', 'Safety Integration Test Reports [Safety]'],
            comprehensive: ['Integration strategy', 'Advanced plan with risk assessment', 'Detailed environment management plan', 'Comprehensive verification results', 'Advanced issue tracking with analytics', 'Formal review documentation', 'Integration effectiveness metrics', 'Lessons learned', 'Updated Hazard Log [Safety]']
        },
        outputs: [
            { name: 'Integrated system', feedsInto: 'Verification (Basic), Transition (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' },
            { name: 'Interface verification records', feedsInto: 'Configuration Management (Standard), Design Definition (Standard)' }
        ]
    },
    25: {
        activities: {
            basic: ['(*) Plan verification', '(*) Execute verification procedures', '(*) Report results', 'Log defects'],
            standard: ['(*) Plan with multiple methods (T/D/I/A)', '(*) Specify verification environment', '(*) Execute comprehensive procedures', 'Track defects in database', 'Conduct reviews', 'Verify RAMS requirements [RAM]', 'Conduct safety function testing [Safety]', 'Verify SIL compliance [Safety]'],
            comprehensive: ['(*) Develop verification strategy', '(*) Plan risk-based approach', '(*) Execute comprehensive procedures', 'Manage verification environment', 'Comprehensive reporting with traceability', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness', 'Prepare safety verification evidence [Safety]']
        },
        deliverables: {
            basic: ['Verification plan', 'Verification procedures', 'Verification reports', 'Defect log'],
            standard: ['Detailed verification plan', 'Verification procedures (multiple methods)', 'Verification environment specification', 'Comprehensive verification reports', 'Defect tracking database', 'Verification review records', 'RAMS Verification Reports [RAM]', 'Safety Function Test Records [Safety]', 'SIL Verification Evidence [Safety]'],
            comprehensive: ['Verification strategy', 'Detailed risk-based plans', 'Comprehensive procedures', 'Verification environment management', 'Extensive reports with complete traceability', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Verification effectiveness metrics', 'Safety Verification Evidence Package [Safety]']
        },
        outputs: [
            { name: 'Verification reports', feedsInto: 'Transition (Standard), Validation (Basic)' },
            { name: 'Defect records', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' },
            { name: 'Verification evidence', feedsInto: 'Validation (Standard), Configuration Management (Standard)' }
        ]
    },
    26: {
        activities: {
            basic: ['(*) Plan transition', '(*) Install system', 'Provide basic training', 'Report transition'],
            standard: ['(*) Plan detailed transition', '(*) Execute comprehensive installation', 'Verify operational readiness', 'Conduct training program', 'Review transition', 'Prepare documentation package', 'Conduct safety acceptance [Safety]', 'Transfer safety documentation [Safety]'],
            comprehensive: ['(*) Develop transition strategy', '(*) Plan with risk assessment', 'Install with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal reviews', 'Complete transition package', 'Measure effectiveness', 'Obtain Safety Case approval [Safety]', 'Conduct safety training for operators [Safety]']
        },
        deliverables: {
            basic: ['Transition plan', 'Installation procedures', 'Training materials', 'Transition report'],
            standard: ['Detailed transition plan', 'Comprehensive installation procedures', 'Operational readiness verification plan', 'Training program', 'Transition review documentation', 'Transition documentation package', 'Safety Acceptance Records [Safety]', 'Safety Documentation Package [Safety]'],
            comprehensive: ['Transition strategy', 'Detailed plan with risk assessment', 'Installation procedures with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal review documentation', 'Complete transition package', 'Transition effectiveness metrics', 'Approved Safety Case [Safety]', 'Safety Training Records [Safety]']
        },
        outputs: [
            { name: 'Deployed system', feedsInto: 'Operation (Basic), Maintenance (Basic)' },
            { name: 'Training materials', feedsInto: 'Operation (Standard), Knowledge Management (Standard)' },
            { name: 'Operational readiness', feedsInto: 'Operation (Standard), Validation (Standard)' }
        ]
    },
    27: {
        activities: {
            basic: ['(*) Plan validation', '(*) Execute validation procedures', '(*) Report results', 'Log defects'],
            standard: ['(*) Plan with multiple methods', '(*) Specify validation environment', '(*) Execute comprehensive procedures', 'Plan stakeholder involvement', 'Track defects in database', 'Conduct reviews', 'Validate RAMS requirements [RAM]', 'Validate safety functions in operational context [Safety]'],
            comprehensive: ['(*) Develop validation strategy', '(*) Plan with stakeholder focus', '(*) Execute comprehensive procedures', 'Manage validation environment', 'Comprehensive reporting with acceptance', 'Stakeholder involvement strategy', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness', 'Obtain safety sign-off [Safety]', 'Develop RAMS validation plan [RAM]']
        },
        deliverables: {
            basic: ['Validation plan', 'Validation procedures', 'Validation reports', 'Defect log'],
            standard: ['Detailed validation plan', 'Validation procedures (multiple methods)', 'Validation environment specification', 'Comprehensive reports', 'Stakeholder involvement plan', 'Defect tracking database', 'Validation review records', 'RAMS Validation Reports [RAM]', 'Operational Safety Validation Report [Safety]'],
            comprehensive: ['Validation strategy', 'Detailed plans with stakeholder focus', 'Comprehensive procedures', 'Validation environment management', 'Extensive reports with stakeholder acceptance', 'Stakeholder involvement strategy', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Validation effectiveness metrics', 'Safety Acceptance Certificate [Safety]', 'RAMS Validation Plan [RAM]']
        },
        outputs: [
            { name: 'Validation reports', feedsInto: 'Stakeholder Needs (Standard), System Requirements Definition (Standard)' },
            { name: 'Stakeholder acceptance', feedsInto: 'Transition (Standard), Quality Assurance (Standard)' },
            { name: 'Defect records', feedsInto: 'Risk Management (Standard), Quality Assurance (Standard)' }
        ]
    },
    28: {
        activities: {
            basic: ['(*) Execute operational procedures', '(*) Monitor performance', '(*) Track problems', 'Provide user support'],
            standard: ['(*) Plan operations', '(*) Execute comprehensive procedures', '(*) Monitor with KPIs', 'Analyze performance', 'Manage problems', 'Provide user support procedures', 'Conduct reviews', 'Train operators', 'Monitor RAM performance [RAM]', 'Implement FRACAS [RAM]', 'Maintain operational Hazard Log [Safety]'],
            comprehensive: ['(*) Develop operational strategy', '(*) Detailed procedures with contingencies', '(*) Performance monitoring framework', 'Advanced analytics', 'Problem management with root cause', 'Comprehensive user support', 'Formal reviews', 'Advanced training', 'Measure operational effectiveness', 'Continuous RAMS monitoring [RAM]', 'Conduct periodic safety reviews [Safety]']
        },
        deliverables: {
            basic: ['Operational procedures', 'Performance reports', 'Problem records', 'User support documentation'],
            standard: ['Operational plan', 'Comprehensive procedures', 'Performance monitoring plan', 'Performance analysis reports', 'Problem management process', 'User support procedures', 'Operational review records', 'Training program', 'FRACAS Reports and Database [RAM]', 'Operational Hazard Log [Safety]'],
            comprehensive: ['Operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Advanced performance analytics', 'Problem management with root cause', 'Comprehensive user support infrastructure', 'Formal review documentation', 'Advanced training with evaluation', 'Operational effectiveness metrics', 'RAMS Validation Report [RAM]', 'Periodic Safety Review Reports [Safety]']
        },
        outputs: [
            { name: 'Operational data', feedsInto: 'Maintenance (Basic), Measurement (Standard)' },
            { name: 'Problem records', feedsInto: 'Quality Assurance (Standard), Knowledge Management (Standard)' },
            { name: 'FRACAS data', feedsInto: 'Design Definition (Standard), System Analysis (Standard)' }
        ]
    },
    29: {
        activities: {
            basic: ['(*) Plan maintenance', '(*) Execute maintenance procedures', '(*) Track problems', 'Report maintenance'],
            standard: ['(*) Plan detailed maintenance', '(*) Execute comprehensive procedures', '(*) Manage maintenance environment', 'Track problems in database', 'Conduct reviews', 'Prepare documentation package', 'Update Hazard Log post-maintenance [Safety]', 'Track reliability growth [RAM]'],
            comprehensive: ['(*) Develop maintenance strategy', '(*) Detailed procedures with optimization', '(*) Predictive maintenance methodology', 'Manage maintenance environment', 'Advanced problem tracking/analysis', 'Formal reviews', 'Complete maintenance package', 'Measure effectiveness', 'Conduct change impact analysis for safety [Safety]', 'RAMS performance review & optimization [RAM]']
        },
        deliverables: {
            basic: ['Maintenance plan', 'Maintenance procedures', 'Problem records', 'Maintenance reports'],
            standard: ['Detailed maintenance plan', 'Comprehensive procedures', 'Maintenance environment specification', 'Problem tracking database', 'Maintenance review records', 'Maintenance documentation package', 'Updated Hazard Log [Safety]', 'Reliability Growth Analysis [RAM]'],
            comprehensive: ['Maintenance strategy', 'Detailed procedures with optimization', 'Predictive maintenance methodology', 'Maintenance environment management', 'Advanced problem tracking/analysis', 'Formal review documentation', 'Complete maintenance package', 'Maintenance effectiveness metrics', 'Safety Change Impact Analysis [Safety]', 'RAMS Performance Report [RAM]']
        },
        outputs: [
            { name: 'Maintenance records', feedsInto: 'Operation (Basic), Configuration Management (Standard)' },
            { name: 'Problem trends', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' },
            { name: 'Reliability data', feedsInto: 'System Analysis (Standard), Design Definition (Comprehensive)' }
        ]
    },
    30: {
        activities: {
            basic: ['(*) Plan disposal', '(*) Execute disposal procedures', 'Archive records', 'Report disposal'],
            standard: ['(*) Plan detailed disposal', '(*) Execute comprehensive procedures', 'Assess environmental impact', 'Address health and safety', 'Conduct reviews', 'Plan archiving', 'Prepare documentation', 'Identify and manage hazardous materials [Safety]', 'Close out Hazard Log [Safety]'],
            comprehensive: ['(*) Develop disposal strategy', '(*) Detailed procedures with risk assessment', 'Comprehensive environmental analysis', 'Detailed health and safety plan', 'Formal reviews', 'Complete disposal documentation', 'Advanced archiving strategy', 'Measure effectiveness', 'Develop disposal safety case [Safety]', 'Archive safety records [Safety]']
        },
        deliverables: {
            basic: ['Disposal plan', 'Disposal procedures', 'Disposal report', 'Archive list'],
            standard: ['Detailed disposal plan', 'Comprehensive disposal procedures', 'Environmental assessment', 'Health and safety procedures', 'Disposal review records', 'Archiving plan', 'Disposal documentation package', 'Hazardous Materials Inventory [Safety]', 'Hazard Log Closure Report [Safety]'],
            comprehensive: ['Disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental impact analysis', 'Detailed health and safety plan', 'Formal review documentation', 'Complete disposal documentation', 'Advanced archiving strategy', 'Disposal effectiveness metrics', 'Disposal Safety Case [Safety]', 'Archived Safety Records [Safety]']
        },
        outputs: [
            { name: 'Disposal records', feedsInto: 'Information Management (Standard), Knowledge Management (Standard)' },
            { name: 'Archive', feedsInto: 'Knowledge Management (Basic)' },
            { name: 'Environmental assessment', feedsInto: 'Risk Management (Standard), Quality Assurance (Standard)' }
        ]
    }
};

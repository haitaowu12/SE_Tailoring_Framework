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
            basic: ['(*) Develop basic project plan', '(*) Create simple schedule (milestone-based)', 'List resources', 'Estimate costs (high-level)', 'Include SA resource requirements in plan [Safety]'],
            standard: ['Create project management plan (PMP)', 'Develop Work Breakdown Structure (WBS)', 'Develop Integrated Master Schedule (IMS)', 'Plan resources in detail', 'Register risks formally', 'Include SA resource requirements in plan [Safety]', 'Schedule SA milestones and reviews [Safety]', 'Budget for SA activities and tools [Safety]', 'Identify SA roles and responsibilities [Safety]'],
            comprehensive: ['Integrate multi-view planning', 'Perform probabilistic schedule analysis', 'Optimize resources with capacity modeling', 'Develop stakeholder communication plan', 'Create risk-based estimates', 'Include SA resource requirements in plan [Safety]', 'Schedule SA milestones and reviews [Safety]', 'Budget for SA activities and tools [Safety]', 'Identify SA roles and responsibilities [Safety]']
        },
        deliverables: {
            basic: ['Basic project plan', 'Simple schedule', 'Resource list', 'Cost estimate', 'SA Resource Allocation [Safety]'],
            standard: ['Project Management Plan (PMP)', 'Work Breakdown Structure (WBS)', 'Integrated Master Schedule (IMS)', 'Resource management plan', 'Risk register', 'SA Resource Allocation [Safety]', 'SA Milestone Schedule [Safety]', 'SA Budget Estimate [Safety]', 'SA Roles Matrix [Safety]'],
            comprehensive: ['Integrated planning documentation', 'Multi-view WBS', 'Probabilistic schedule analysis', 'Resource optimization analysis', 'Risk-based estimates', 'Stakeholder communication plan', 'SA Resource Allocation [Safety]', 'SA Milestone Schedule [Safety]', 'SA Budget Estimate [Safety]', 'SA Roles Matrix [Safety]']
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
            basic: ['(*) Report project status', '(*) Log issues (simple tracking)', 'Minute meetings', 'Log changes (record only)', 'Track SA metrics and KPIs [Safety]'],
            standard: ['Measure performance against baselines', 'Track issues with severity and ownership', 'Review actions with owners and deadlines', 'Control changes through formal process', 'Plan corrections with impact assessment', 'Track SA metrics and KPIs [Safety]', 'Monitor SA action items [Safety]', 'Report SA status to stakeholders [Safety]', 'Control SA-related changes'],
            comprehensive: ['Dashboard performance monitoring with KPIs', 'Track issues with metrics and trend analysis', 'Analyze trends for early warning', 'Model predictions for corrective actions', 'Implement continuous improvement', 'Track SA metrics and KPIs [Safety]', 'Monitor SA action items [Safety]', 'Report SA status to stakeholders [Safety]', 'Control SA-related changes']
        },
        deliverables: {
            basic: ['Status reports', 'Issue log', 'Meeting minutes', 'Basic change log', 'SA Status Reports [Safety]'],
            standard: ['Performance measurement reports (EVM)', 'Issue management database', 'Review records with action tracking', 'Change control documentation', 'Corrective action plans', 'SA Status Reports [Safety]', 'SA Metrics Dashboard [Safety]', 'SA Change Records [Safety]', 'SA Action Tracking [Safety]'],
            comprehensive: ['Integrated performance dashboard', 'Advanced issue tracking with root cause', 'Comprehensive review documentation', 'Change impact analyses', 'Trend analysis reports', 'Predictive performance models', 'SA Status Reports [Safety]', 'SA Metrics Dashboard [Safety]', 'SA Change Records [Safety]', 'SA Action Tracking [Safety]']
        },
        outputs: [
            { name: 'Status reports', feedsInto: 'Information Management (Basic), Portfolio Management (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Basic), Knowledge Management (Basic)' },
            { name: 'Change records', feedsInto: 'Configuration Management (Standard), Decision Management (Standard)' }
        ]
    },
    11: {
        activities: {
            basic: ['Analyze basic alternatives (informal)', 'Minute decision outcomes', 'Document SA-related decisions'],
            standard: ['Plan decision process with criteria', 'Create decision criteria matrices with weights', 'Report analyses with rationale', 'Document rationale and trade-offs', 'Document SA-related decisions', 'Analyze SA alternatives and trade-offs [Safety]', 'Record rationale for SA choices [Safety]', 'Track SA decision effectiveness [Safety]'],
            comprehensive: ['Govern decision framework with policies', 'Model advanced scenarios with sensitivity analysis', 'Analyze uncertainties with Monte Carlo', 'Measure decision effectiveness', 'Document SA-related decisions', 'Analyze SA alternatives and trade-offs [Safety]', 'Record rationale for SA choices [Safety]', 'Track SA decision effectiveness [Safety]']
        },
        deliverables: {
            basic: ['Decision records', 'Basic alternatives analysis', 'Meeting minutes with decisions', 'SA Decision Records [Safety]'],
            standard: ['Decision management plan', 'Decision criteria matrices', 'Alternatives analysis reports', 'Decision records with rationale', 'Stakeholder input documentation', 'SA Decision Records [Safety]', 'SA Trade-off Analysis [Safety]', 'SA Decision Rationale [Safety]', 'SA Decision Effectiveness Metrics [Safety]'],
            comprehensive: ['Decision governance framework', 'Advanced decision models', 'Comprehensive alternatives analysis', 'Uncertainty and sensitivity analyses', 'Decision effectiveness metrics', 'SA Decision Records [Safety]', 'SA Trade-off Analysis [Safety]', 'SA Decision Rationale [Safety]', 'SA Decision Effectiveness Metrics [Safety]']
        },
        outputs: [
            { name: 'Decision records', feedsInto: 'Configuration Management (Standard), System Analysis (Standard)' },
            { name: 'Alternatives analysis', feedsInto: 'Architecture Definition (Standard), Design Definition (Standard)' }
        ]
    },
    12: {
        activities: {
            basic: ['(*) Register risks (incl. Problems & Obvious Risks)', 'Assess using simple matrix (H/M/L)', '(*) Report risks basically', 'Monitor via informal methods', 'Identify and assess safety risks [Safety]'],
            standard: ['Plan risk management formally', 'Detail risk register with probability/impact', 'Plan responses with triggers and owners', 'Report regularly to stakeholders', 'Review risks at milestones', 'Identify and assess safety risks [Safety]', 'Integrate SA risks into project risk register [Safety]', 'Develop SA risk responses [Safety]', 'Monitor safety-critical risks [Safety]', 'Track SA risk indicators [Safety]'],
            comprehensive: ['Document risk management framework', 'Model/simulate risks with distributions', 'Strategize responses with contingencies', 'Dashboard with leading indicators', 'Analyze risk management effectiveness', 'Identify and assess safety risks [Safety]', 'Integrate SA risks into project risk register [Safety]', 'Develop SA risk responses [Safety]', 'Monitor safety-critical risks [Safety]', 'Track SA risk indicators [Safety]']
        },
        deliverables: {
            basic: ['Simple risk register', 'Risk assessment matrix (H/M/L)', 'Basic risk reports', 'Safety Risk Register [Safety]'],
            standard: ['Risk Management Plan (RMP)', 'Detailed risk register', 'Risk response plans', 'Regular risk reports', 'Risk review records', 'Safety Risk Register [Safety]', 'SA Risk Assessment [Safety]', 'SA Risk Response Plans [Safety]', 'Safety Risk Dashboard [Safety]', 'SA Risk Monitoring Reports [Safety]'],
            comprehensive: ['Risk management framework', 'Advanced risk models and simulations', 'Detailed risk response strategies', 'Risk dashboards with leading indicators', 'Integrated risk database', 'Risk management effectiveness metrics', 'Safety Risk Register [Safety]', 'SA Risk Assessment [Safety]', 'SA Risk Response Plans [Safety]', 'Safety Risk Dashboard [Safety]', 'SA Risk Monitoring Reports [Safety]']
        },
        outputs: [
            { name: 'Risk register', feedsInto: 'Project Planning (Standard), Decision Management (Standard)' },
            { name: 'Risk assessment', feedsInto: 'System Analysis (Standard), Quality Assurance (Standard)' },
            { name: 'Risk response plans', feedsInto: 'Configuration Management (Comprehensive), Integration (Comprehensive)' }
        ]
    },
    13: {
        activities: {
            basic: ['(*) List configuration items (CIs)', 'Request changes simply (informal)', 'Report status (basic)', '(*) Control versions (manual or simple tool)', 'Manage safety-related configuration items [Safety]'],
            standard: ['Plan configuration management', 'Identify configuration scheme', 'Control via Change Control Board (CCB)', 'Account status formally', 'Audit configurations', 'Manage safety-related configuration items [Safety]', 'Control safety baseline changes [Safety]', 'Maintain SA documentation under CM [Safety]', 'Track safety-critical item versions [Safety]'],
            comprehensive: ['Plan comprehensively with strategy', 'Systematically identify with structure', 'Analyze change impacts with traceability', 'Automate reports with dashboards', 'Integrate with PLM/ALM systems', 'Manage safety-related configuration items [Safety]', 'Control safety baseline changes [Safety]', 'Maintain SA documentation under CM [Safety]', 'Track safety-critical item versions [Safety]']
        },
        deliverables: {
            basic: ['Configuration item list', 'Simple change request forms', 'Basic configuration status reports', 'Version control records', 'Safety CI List [Safety]'],
            standard: ['Configuration Management Plan (CMP)', 'Configuration identification scheme', 'Change control board procedures', 'Configuration status accounting reports', 'Configuration audit reports', 'Baseline documentation', 'Safety CI List [Safety]', 'Safety Baseline Records [Safety]', 'SA Change Control Records [Safety]', 'Safety Documentation Version Control [Safety]'],
            comprehensive: ['Comprehensive CM plan', 'Detailed configuration identification system', 'Advanced change control with impact analysis', 'Automated configuration status reports', 'Comprehensive audit documentation', 'Configuration metrics dashboard', 'PLM/ALM system integration', 'Safety CI List [Safety]', 'Safety Baseline Records [Safety]', 'SA Change Control Records [Safety]', 'Safety Documentation Version Control [Safety]']
        },
        outputs: [
            { name: 'CI list', feedsInto: 'Integration (Basic), Implementation (Standard)' },
            { name: 'Baselines', feedsInto: 'Verification (Standard), Validation (Standard)' },
            { name: 'Change records', feedsInto: 'Project Assessment (Standard), Quality Assurance (Standard)' }
        ]
    },
    14: {
        activities: {
            basic: ['(*) Structure repository', 'List access controls', '(*) Backup data', 'Inventory information', 'Manage SA documentation repository [Safety]'],
            standard: ['Plan information management', 'Categorize scheme with classification', 'Control access with procedures', 'Plan recovery with procedures', 'Protocol exchanges with stakeholders', 'Manage SA documentation repository [Safety]', 'Control access to safety information [Safety]', 'Backup safety-critical data [Safety]', 'Maintain SA information inventory [Safety]'],
            comprehensive: ['Document information architecture', 'Schema metadata with relationships', 'Matrix access with audit procedures', 'Plan continuity with contingencies', 'Agree exchanges with formal agreements', 'Manage SA documentation repository [Safety]', 'Control access to safety information [Safety]', 'Backup safety-critical data [Safety]', 'Maintain SA information inventory [Safety]']
        },
        deliverables: {
            basic: ['Information repository structure', 'Basic access control list', 'Backup procedures', 'Simple information inventory', 'SA Document Repository [Safety]'],
            standard: ['Information management plan', 'Information categorization scheme', 'Access control procedures', 'Backup and recovery plan', 'Information exchange protocols', 'Information security procedures', 'SA Document Repository [Safety]', 'SA Access Control List [Safety]', 'SA Data Backup Records [Safety]', 'SA Information Inventory [Safety]'],
            comprehensive: ['Information architecture documentation', 'Metadata schema and relationships', 'Access control matrix with audit', 'Comprehensive backup/recovery/continuity plan', 'Information exchange agreements', 'Information security framework', 'Information lifecycle policies', 'Information quality metrics', 'SA Document Repository [Safety]', 'SA Access Control List [Safety]', 'SA Data Backup Records [Safety]', 'SA Information Inventory [Safety]']
        },
        outputs: [
            { name: 'Repository structure', feedsInto: 'Knowledge Management (Basic), all processes (storage)' },
            { name: 'Access controls', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ]
    },
    15: {
        activities: {
            basic: ['(*) Collect data (manual)', 'Report measurements (basic)', 'Define SA metrics (RAMS indicators) [Safety]'],
            standard: ['Plan measurement with objectives', 'Define measurement constructs', 'Procedure collection with automation', 'Analyze trends', 'Review measures periodically', 'Define SA metrics (RAMS indicators) [Safety]', 'Collect SA performance data [Safety]', 'Analyze SA trends [Safety]', 'Report SA measurement results [Safety]'],
            comprehensive: ['Plan comprehensively with strategy', 'Framework measurement with models', 'Automate tools with dashboards', 'Analyze methods with statistics', 'Evaluate effectiveness continuously', 'Define SA metrics (RAMS indicators) [Safety]', 'Collect SA performance data [Safety]', 'Analyze SA trends [Safety]', 'Report SA measurement results [Safety]']
        },
        deliverables: {
            basic: ['Simple metrics definitions', 'Basic data collection forms', 'Measurement reports', 'SA Metrics Definitions [Safety]'],
            standard: ['Measurement plan', 'Measurement construct definitions', 'Data collection procedures', 'Analysis reports with trends', 'Measurement review records', 'SA Metrics Definitions [Safety]', 'SA Data Collection Records [Safety]', 'SA Trend Analysis Reports [Safety]', 'SA Measurement Dashboard [Safety]'],
            comprehensive: ['Comprehensive measurement plan', 'Advanced measurement framework', 'Automated data collection tools', 'Statistical analysis methodologies', 'Predictive models documentation', 'Measurement effectiveness evaluation', 'Integrated measurement dashboard', 'SA Metrics Definitions [Safety]', 'SA Data Collection Records [Safety]', 'SA Trend Analysis Reports [Safety]', 'SA Measurement Dashboard [Safety]']
        },
        outputs: [
            { name: 'Metrics definitions', feedsInto: 'Project Assessment (Standard), Portfolio Management (Standard)' },
            { name: 'Trend analysis', feedsInto: 'Decision Management (Standard), Risk Management (Comprehensive)' }
        ]
    },
    16: {
        activities: {
            basic: ['(*) Plan basic assurance', '(*) Conduct audits (informal)', '(*) Report non-conformances', 'Track resolutions (simple)', 'Conduct SA audits [Safety]'],
            standard: ['Develop assurance plan', 'Perform evaluations with criteria', 'Report regularly to stakeholders', 'Initiate improvements with actions', 'Conduct SA audits [Safety]', 'Verify SA process compliance [Safety]', 'Track SA non-conformances [Safety]', 'Review safety documentation quality [Safety]'],
            comprehensive: ['Strategize assurance with objectives', 'Conduct comprehensive audits with methodology', 'Analyze trends for early warning', 'Drive improvement initiatives with metrics', 'Conduct SA audits [Safety]', 'Verify SA process compliance [Safety]', 'Track SA non-conformances [Safety]', 'Review safety documentation quality [Safety]']
        },
        deliverables: {
            basic: ['Quality assurance plan', 'Audit reports', 'Non-conformance records', 'Resolution tracking', 'SA Audit Reports [Safety]'],
            standard: ['Detailed quality assurance plan', 'Evaluation procedures and results', 'Regular quality reports', 'Improvement action plans', 'SA Audit Reports [Safety]', 'SA Compliance Records [Safety]', 'SA Non-conformance Log [Safety]', 'SA Quality Review Records [Safety]'],
            comprehensive: ['Quality assurance strategy', 'Comprehensive evaluation program', 'Quality trend analyses', 'Formal improvement initiative documentation', 'Assurance effectiveness metrics', 'SA Audit Reports [Safety]', 'SA Compliance Records [Safety]', 'SA Non-conformance Log [Safety]', 'SA Quality Review Records [Safety]']
        },
        outputs: [
            { name: 'Audit reports', feedsInto: 'Stakeholder Needs (Standard), Validation (Standard)' },
            { name: 'Non-conformance records', feedsInto: 'Project Assessment (Standard), Risk Management (Standard)' }
        ]
    },
    17: {
        activities: {
            basic: ['(*) Define problem statement', '(*) Explore solution alternatives (informal)', '(*) Identify initial stakeholders (~3 groups)', 'SA scoping and boundary definition [Safety]'],
            standard: ['Develop analysis plan', 'Map stakeholders (3-4 groups)', 'Analyze problems with context', 'Define initial concepts', 'SA scoping and boundary definition [Safety]', 'Preliminary hazard identification [Safety]', 'Initial SA Criticality assessment [Safety]', 'Identify safety-related stakeholders [Safety]'],
            comprehensive: ['Perform comprehensive analysis', 'Model stakeholder value (5+ groups)', 'Conduct opportunity analysis with PESTEL', 'Develop business cases with ROI', 'SA scoping and boundary definition [Safety]', 'Preliminary hazard identification [Safety]', 'Initial SA Criticality assessment [Safety]', 'Identify safety-related stakeholders [Safety]']
        },
        deliverables: {
            basic: ['Problem statement', 'Solution alternatives', 'Initial stakeholder list', 'ConOps (can be part of SRD)', 'SA Scoping Statement [Safety]'],
            standard: ['Business/mission analysis plan', 'Stakeholder maps', 'Problem definition document', 'Initial Concept of Operations', 'SA Scoping Statement [Safety]', 'Preliminary Hazard List (PHL) [Safety]', 'SA Criticality Tier determination [Safety]', 'Safety stakeholder register [Safety]'],
            comprehensive: ['Comprehensive problem analysis', 'Stakeholder value models', 'Opportunity/risk profiles', 'Detailed business case documentation', 'SA Scoping Statement [Safety]', 'Preliminary Hazard List (PHL) [Safety]', 'SA Criticality Tier determination [Safety]', 'Safety stakeholder register [Safety]']
        },
        outputs: [
            { name: 'Problem statement', feedsInto: 'Stakeholder Needs (Basic), Portfolio Management (Standard)' },
            { name: 'Solution alternatives', feedsInto: 'System Requirements (Basic), Architecture Definition (Basic)' }
        ]
    },
    18: {
        activities: {
            basic: ['(*) List stakeholders', '(*) Elicit basic needs (interviews)', 'Validate simply (review)', 'Note constraints', 'Capture safety needs from stakeholders [Safety]'],
            standard: ['Analyze stakeholders with influence', 'Elicit needs formally with techniques', 'Validate with plan and criteria', 'Analyze constraints with impact', 'Resolve conflicts with stakeholders', 'Capture safety needs from stakeholders [Safety]', 'Define mission profile and operational scenarios', 'Establish preliminary [RAM] targets', 'Identify safety constraints [Safety]'],
            comprehensive: ['Map stakeholder influence comprehensively', 'Model comprehensive needs', 'Apply multiple validation techniques', 'Strategize validation with engagement', 'Analyze constraint impacts comprehensively', 'Capture safety needs from stakeholders [Safety]', 'Define mission profile and operational scenarios', 'Establish preliminary [RAM] targets', 'Identify safety constraints [Safety]']
        },
        deliverables: {
            basic: ['Stakeholder list', 'Needs statements', 'Simple validation records', 'Basic constraints list', 'Safety needs register [Safety]'],
            standard: ['Stakeholder analysis document', 'Stakeholder needs specification', 'Elicitation records', 'Validation plan and results', 'Constraints analysis', 'Conflict resolution records', 'Safety needs register [Safety]', 'Mission profile documentation', 'Preliminary [RAM] targets', 'Safety constraints list [Safety]'],
            comprehensive: ['Detailed stakeholder influence maps', 'Comprehensive needs models', 'Multiple elicitation technique results', 'Formal validation strategy', 'Extensive constraints impact analysis', 'Conflict resolution process documentation', 'Stakeholder engagement plan', 'Safety needs register [Safety]', 'Mission profile documentation', 'Preliminary [RAM] targets', 'Safety constraints list [Safety]']
        },
        outputs: [
            { name: 'Stakeholder list', feedsInto: 'Project Planning (Standard), System Requirements (Basic)' },
            { name: 'Needs statements', feedsInto: 'System Requirements (Basic), Validation (Basic)' }
        ]
    },
    19: {
        activities: {
            basic: ['(*) Document requirements (simple list)', 'Trace simply with matrix', 'Review requirements (informal)', 'Identify basic Safety & [RAM] targets [Safety]', 'Perform risk analysis (PHA)'],
            standard: ['Plan requirements development', 'Specify requirements with attributes', 'Attribute in database', 'Trace with matrix', 'Validate records', 'Plan verification', 'Identify Safety & [RAM] Requirements [Safety]', 'Perform risk analysis (PHA)', 'Define RAMS requirements [RAM]', 'Establish and maintain Hazard Log [Safety]', 'Allocate safety integrity levels [Safety]', 'Define safety functional requirements [Safety]'],
            comprehensive: ['Model behaviors with formal notation', 'Specify formally with models', 'Manage comprehensive database', 'Document traceability network', 'Strategize validation', 'Plan verification comprehensively', 'Formal Safety & [RAM] Requirements (EN 50126 Phase 3/4) [Safety]', 'Perform risk analysis (PHA)', 'Define RAMS requirements [RAM]', 'Establish and maintain Hazard Log [Safety]', 'Allocate safety integrity levels [Safety]', 'Define safety functional requirements [Safety]']
        },
        deliverables: {
            basic: ['System Requirements Document (SRD)', 'Simple traceability matrix', 'Requirements review records', 'Preliminary Hazard List (PHL) [Safety]', 'Basic [RAM] Targets', 'Preliminary Hazard Analysis (PHA) [Safety]'],
            standard: ['Requirements development plan', 'System Specification (SS)', 'Requirements database with attributes', 'Traceability matrix', 'Validation records', 'Verification planning documentation', 'Change management records', 'Safety Requirement Specification (SRS) - Preliminary [Safety]', 'Preliminary Hazard Analysis (PHA) [Safety]', 'RAMS Requirements Specification [RAM]', 'Hazard Log [Safety]', 'SIL Allocation Matrix', 'Safety Requirements Specification [Safety]'],
            comprehensive: ['Formal requirements specification', 'Comprehensive requirements database', 'Complete traceability network', 'Detailed validation strategy', 'Comprehensive verification planning', 'Change impact analysis methodology', 'Requirements quality metrics', 'Safety Case (per EN 50126) [Safety]', 'Preliminary Hazard Analysis (PHA) [Safety]', 'RAMS Requirements Specification [RAM]', 'Hazard Log [Safety]', 'SIL Allocation Matrix', 'Safety Requirements Specification [Safety]']
        },
        outputs: [
            { name: 'Requirements document', feedsInto: 'Architecture Definition (Basic), Verification (Basic)' },
            { name: 'Traceability matrix', feedsInto: 'Verification (Standard), Validation (Standard)' }
        ]
    },
    20: {
        activities: {
            basic: ['(*) Define concepts (block diagrams) [RAM]', '(*) List interfaces', 'Evaluate options (informal)', 'Document architecture', 'Perform RAMS apportionment [RAM]'],
            standard: ['Plan architecture development', 'Develop with viewpoints per ISO 42010', 'Create interface control documents', 'Evaluate alternatives with trade studies', 'Plan architecture governance', 'Perform RAMS apportionment [RAM]', 'Allocate SIL to subsystems', 'Define redundancy and fault tolerance strategies', 'Conduct architecture safety reviews [Safety]', 'Define safety partitioning and isolation [Safety]'],
            comprehensive: ['Model architectures in formal notation', 'Develop comprehensive description', 'Specify interfaces in detail', 'Evaluate with formal methodology', 'Govern architecture decisions', 'Measure architecture quality', 'Perform RAMS apportionment [RAM]', 'Allocate SIL to subsystems', 'Define redundancy and fault tolerance strategies', 'Conduct architecture safety reviews [Safety]', 'Define safety partitioning and isolation [Safety]']
        },
        deliverables: {
            basic: ['Simple architecture description', 'Basic interface list', 'Architecture diagrams [RAM]', 'Evaluation notes', 'RAMS Apportionment Document [RAM]'],
            standard: ['Architecture development plan', 'Architecture description with views', 'Interface control document', 'Architecture alternatives analysis', 'Architecture evaluation results', 'Architecture governance plan', 'RAMS Apportionment Document [RAM]', 'SIL Allocation to Architecture Elements', 'Fault Tolerance Strategy Document', 'Architecture Safety Review Records [Safety]', 'Safety Partitioning Specification [Safety]'],
            comprehensive: ['Architecture models in formal notation', 'Comprehensive architecture description', 'Detailed interface specifications', 'Extensive alternatives analysis with trade studies', 'Formal evaluation report', 'Architecture governance documentation', 'Architecture metrics', 'Patterns and reference architectures', 'RAMS Apportionment Document [RAM]', 'SIL Allocation to Architecture Elements', 'Fault Tolerance Strategy Document', 'Architecture Safety Review Records [Safety]', 'Safety Partitioning Specification [Safety]']
        },
        outputs: [
            { name: 'Architecture description', feedsInto: 'Design Definition (Basic), System Requirements (Standard)' },
            { name: 'Interface specifications', feedsInto: 'Integration (Standard), Verification (Standard)' }
        ]
    },
    21: {
        activities: {
            basic: ['(*) Create design documentation', '(*) Create design diagrams [RAM]', 'Select technologies', 'Basic verification', 'Perform FMEA/FMECA'],
            standard: ['Plan design process', 'Develop comprehensive documentation', 'Analyze alternatives', 'Verify designs with analysis', 'Assess technologies', 'Conduct design reviews', 'Perform FMEA/FMECA', 'Conduct maintainability analysis [RAM]', 'Execute safety design reviews [Safety]', 'Define diagnostic and test provisions', 'Analyze failure modes and effects'],
            comprehensive: ['Model designs in formal notation', 'Develop detailed multi-view documentation', 'Optimize with extensive analysis', 'Comprehensive verification strategy', 'Advanced technology assessment with roadmap', 'Formal design reviews', 'Perform FMEA/FMECA', 'Conduct maintainability analysis [RAM]', 'Execute safety design reviews [Safety]', 'Define diagnostic and test provisions', 'Analyze failure modes and effects']
        },
        deliverables: {
            basic: ['Design documentation', 'Design diagrams [RAM]', 'Technology selections', 'Basic verification records', 'FMEA/FMECA Report'],
            standard: ['Design plan', 'Comprehensive design documentation', 'Design alternatives analysis', 'Verification results', 'Technology assessment report', 'Design review records', 'FMEA/FMECA Report', 'Maintainability Analysis Report [RAM]', 'Safety Design Review Records [Safety]', 'Diagnostic Strategy Document', 'Failure Modes Analysis'],
            comprehensive: ['Design models in formal notation', 'Detailed multi-view documentation', 'Extensive alternatives analysis', 'Comprehensive verification results', 'Advanced technology roadmap', 'Formal design review documentation', 'Design patterns catalog', 'Design quality metrics', 'FMEA/FMECA Report', 'Maintainability Analysis Report [RAM]', 'Safety Design Review Records [Safety]', 'Diagnostic Strategy Document', 'Failure Modes Analysis']
        },
        outputs: [
            { name: 'Design documentation', feedsInto: 'Implementation (Basic), Integration (Standard)' },
            { name: 'Technology assessment', feedsInto: 'Risk Management (Standard), Decision Management (Standard)' }
        ]
    },
    22: {
        activities: {
            basic: ['(*) Perform basic analyses', 'Document analysis data', 'Document methodology', 'Identify preliminary hazards [Safety]', 'Conduct RAMS trade studies [RAM]'],
            standard: ['Plan analysis activities', 'Define analysis methodologies', 'Conduct analyses with recommendations', 'Define tool usage', 'Support decisions', 'Perform RAM Analysis (FMEA) [RAM]', 'Conduct RAMS trade studies [RAM]', 'Perform availability modeling [RAM]', 'Execute reliability predictions [RAM]', 'Analyze safety risks [Safety]', 'Support safety case development [Safety]'],
            comprehensive: ['Develop analysis strategy', 'Create comprehensive framework', 'Perform advanced modeling/simulation', 'Validate methodologies', 'Document tool environments', 'Quantify uncertainties', 'Measure analysis effectiveness', 'Functional Safety Analysis & [RAM] Modeling (EN 50126 Phase 5) [Safety]', 'Conduct RAMS trade studies [RAM]', 'Perform availability modeling [RAM]', 'Execute reliability predictions [RAM]', 'Analyze safety risks [Safety]', 'Support safety case development [Safety]']
        },
        deliverables: {
            basic: ['Simple analysis reports', 'Analysis data', 'Basic methodology documentation', 'RAMS Trade Study Reports [RAM]'],
            standard: ['Analysis plan', 'Analysis methodologies documentation', 'Analysis reports with recommendations', 'Tool usage guidelines', 'Decision support documentation', 'Hazard Log (Standardized) [Safety]', 'RAM Analysis (FMEA/FMECA) [RAM]', 'RAMS Trade Study Reports [RAM]', 'Availability Model and Analysis [RAM]', 'Reliability Prediction Reports [RAM]', 'Safety Risk Analysis [Safety]', 'Safety Case Evidence [Safety]'],
            comprehensive: ['Analysis strategy', 'Comprehensive analysis framework', 'Advanced modeling/simulation documentation', 'Detailed methodology with validation', 'Tool environment documentation', 'Uncertainty quantification', 'Analysis effectiveness metrics', 'Decision support with sensitivity analysis', 'Full Hazard Log & Analysis (HAZOP/FTA) [Safety]', '[RAM] Modeling & Prediction', 'RAMS Trade Study Reports [RAM]', 'Availability Model and Analysis [RAM]', 'Reliability Prediction Reports [RAM]', 'Safety Risk Analysis [Safety]', 'Safety Case Evidence [Safety]']
        },
        outputs: [
            { name: 'Analysis reports', feedsInto: 'Decision Management (Basic), Architecture Definition (Standard)' },
            { name: 'Trade study results', feedsInto: 'Design Definition (Standard), Risk Management (Standard)' }
        ]
    },
    23: {
        activities: {
            basic: ['(*) Build per specifications', 'Basic acceptance testing', 'Document product', 'Implement RAMS QA procedures [RAM]'],
            standard: ['Plan implementation with procedures', 'Track progress', 'Execute acceptance tests', 'Create comprehensive documentation', 'Conduct implementation reviews', 'Implement RAMS QA procedures [RAM]', 'Conduct manufacturing FMEA', 'Perform safety-related inspections [Safety]', 'Execute component safety testing [Safety]', 'Maintain safety traceability [Safety]'],
            comprehensive: ['Develop implementation strategy', 'Optimize with advanced techniques', 'Continuous monitoring dashboard', 'Comprehensive acceptance testing', 'Extensive documentation suite', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Implement RAMS QA procedures [RAM]', 'Conduct manufacturing FMEA', 'Perform safety-related inspections [Safety]', 'Execute component safety testing [Safety]', 'Maintain safety traceability [Safety]']
        },
        deliverables: {
            basic: ['Implementation plan', 'Implementation records', 'Basic acceptance documentation', 'Product documentation', 'RAMS QA Records [RAM]'],
            standard: ['Detailed implementation plan', 'Progress reports', 'Acceptance test procedures/results', 'Comprehensive product documentation', 'Implementation review records', 'RAMS QA Records [RAM]', 'Manufacturing FMEA Report', 'Safety Inspection Records [Safety]', 'Component Safety Test Reports [Safety]', 'Safety Traceability Records [Safety]'],
            comprehensive: ['Implementation strategy', 'Detailed procedures with optimization', 'Continuous monitoring dashboard', 'Comprehensive acceptance package', 'Extensive documentation suite', 'Formal review documentation', 'Implementation effectiveness metrics', 'Lessons learned', 'RAMS QA Records [RAM]', 'Manufacturing FMEA Report', 'Safety Inspection Records [Safety]', 'Component Safety Test Reports [Safety]', 'Safety Traceability Records [Safety]']
        },
        outputs: [
            { name: 'Implemented product', feedsInto: 'Integration (Basic), Verification (Basic)' },
            { name: 'Implementation records', feedsInto: 'Configuration Management (Standard), Quality Assurance (Standard)' }
        ]
    },
    24: {
        activities: {
            basic: ['(*) Integrate system elements', '(*) Verify interfaces', 'Perform integration testing', 'Track integration issues', 'Conduct interface safety analysis [Safety]'],
            standard: ['Plan integration with sequence', 'Specify integration environment', 'Execute procedures', 'Verify with records', 'Track issues in database', 'Conduct reviews', 'Conduct interface safety analysis [Safety]', 'Perform [RAM] testing', 'Execute safety integration tests [Safety]', 'Verify safety functions [Safety]', 'Update Hazard Log with integration findings [Safety]'],
            comprehensive: ['Develop integration strategy', 'Plan with risk assessment', 'Manage integration environment', 'Comprehensive verification', 'Advanced issue analytics', 'Formal reviews', 'Measure effectiveness', 'Capture lessons learned', 'Conduct interface safety analysis [Safety]', 'Perform [RAM] testing', 'Execute safety integration tests [Safety]', 'Verify safety functions [Safety]', 'Update Hazard Log with integration findings [Safety]']
        },
        deliverables: {
            basic: ['Integration plan', 'Integration records', 'Issue log', 'Integration report', 'Interface Safety Analysis Report [Safety]'],
            standard: ['Detailed integration plan with sequence', 'Integration environment specification', 'Integration procedures', 'Verification records', 'Issue tracking database', 'Integration review documentation', 'Interface Safety Analysis Report [Safety]', '[RAM] Test Reports', 'Safety Integration Test Reports [Safety]', 'Safety Function Verification Records [Safety]', 'Updated Hazard Log [Safety]'],
            comprehensive: ['Integration strategy', 'Advanced plan with risk assessment', 'Detailed environment management plan', 'Comprehensive verification results', 'Advanced issue tracking with analytics', 'Formal review documentation', 'Integration effectiveness metrics', 'Lessons learned', 'Interface Safety Analysis Report [Safety]', '[RAM] Test Reports', 'Safety Integration Test Reports [Safety]', 'Safety Function Verification Records [Safety]', 'Updated Hazard Log [Safety]']
        },
        outputs: [
            { name: 'Integrated system', feedsInto: 'Verification (Basic), Transition (Standard)' },
            { name: 'Issue log', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ]
    },
    25: {
        activities: {
            basic: ['(*) Plan verification', '(*) Execute verification procedures', '(*) Report results', 'Log defects', 'Verify RAMS requirements [RAM]'],
            standard: ['Plan with multiple methods', 'Specify verification environment', 'Execute comprehensive procedures', 'Track defects in database', 'Conduct reviews', 'Verify RAMS requirements [RAM]', 'Execute safety validation tests [Safety]', 'Conduct safety function testing [Safety]', 'Verify SIL compliance', 'Prepare safety verification evidence [Safety]'],
            comprehensive: ['Develop verification strategy', 'Plan risk-based approach', 'Execute comprehensive procedures', 'Manage verification environment', 'Comprehensive reporting with traceability', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness', 'Verify RAMS requirements [RAM]', 'Execute safety validation tests [Safety]', 'Conduct safety function testing [Safety]', 'Verify SIL compliance', 'Prepare safety verification evidence [Safety]']
        },
        deliverables: {
            basic: ['Verification plan', 'Verification procedures', 'Verification reports', 'Defect log', 'RAMS Verification Reports [RAM]'],
            standard: ['Detailed verification plan', 'Verification procedures (multiple methods)', 'Verification environment specification', 'Comprehensive verification reports', 'Defect tracking database', 'Verification review records', 'RAMS Verification Reports [RAM]', 'Safety Validation Test Reports [Safety]', 'Safety Function Test Records [Safety]', 'SIL Verification Evidence', 'Safety Verification Evidence Package [Safety]'],
            comprehensive: ['Verification strategy', 'Detailed risk-based plans', 'Comprehensive procedures', 'Verification environment management', 'Extensive reports with complete traceability', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Verification effectiveness metrics', 'RAMS Verification Reports [RAM]', 'Safety Validation Test Reports [Safety]', 'Safety Function Test Records [Safety]', 'SIL Verification Evidence', 'Safety Verification Evidence Package [Safety]']
        },
        outputs: [
            { name: 'Verification reports', feedsInto: 'Transition (Standard), Validation (Basic)' },
            { name: 'Defect records', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ]
    },
    26: {
        activities: {
            basic: ['(*) Plan transition', '(*) Install system', 'Provide basic training', 'Report transition', 'Conduct safety acceptance activities [Safety]'],
            standard: ['Plan detailed transition', 'Execute comprehensive installation', 'Verify operational readiness', 'Conduct training program', 'Review transition', 'Prepare documentation package', 'Conduct safety acceptance activities [Safety]', 'Obtain Safety Case approval [Safety]', 'Execute operational safety validation [Safety]', 'Transfer safety documentation [Safety]', 'Conduct safety training for operators [Safety]'],
            comprehensive: ['Develop transition strategy', 'Plan with risk assessment', 'Install with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal reviews', 'Complete transition package', 'Measure effectiveness', 'Conduct safety acceptance activities [Safety]', 'Obtain Safety Case approval [Safety]', 'Execute operational safety validation [Safety]', 'Transfer safety documentation [Safety]', 'Conduct safety training for operators [Safety]']
        },
        deliverables: {
            basic: ['Transition plan', 'Installation procedures', 'Training materials', 'Transition report', 'Safety Acceptance Records [Safety]'],
            standard: ['Detailed transition plan', 'Comprehensive installation procedures', 'Operational readiness verification plan', 'Training program', 'Transition review documentation', 'Transition documentation package', 'Safety Acceptance Records [Safety]', 'Approved Safety Case [Safety]', 'Operational Safety Validation Report [Safety]', 'Safety Documentation Package [Safety]', 'Safety Training Records [Safety]'],
            comprehensive: ['Transition strategy', 'Detailed plan with risk assessment', 'Installation procedures with contingencies', 'Comprehensive readiness verification', 'Advanced training with evaluation', 'Formal review documentation', 'Complete transition package', 'Transition effectiveness metrics', 'Safety Acceptance Records [Safety]', 'Approved Safety Case [Safety]', 'Operational Safety Validation Report [Safety]', 'Safety Documentation Package [Safety]', 'Safety Training Records [Safety]']
        },
        outputs: [
            { name: 'Deployed system', feedsInto: 'Operation (Basic), Maintenance (Basic)' },
            { name: 'Training materials', feedsInto: 'Operation (Standard), Knowledge Management (Standard)' }
        ]
    },
    27: {
        activities: {
            basic: ['(*) Plan validation', '(*) Execute validation procedures', '(*) Report results', 'Log defects', 'Validate RAMS requirements [RAM]'],
            standard: ['Plan with multiple methods', 'Specify validation environment', 'Execute comprehensive procedures', 'Plan stakeholder involvement', 'Track defects in database', 'Conduct reviews', 'Validate RAMS requirements [RAM]', 'Develop RAMS validation plan [RAM]', 'Integrate ISA activities [Safety]', 'Validate safety functions in operational context [Safety]', 'Obtain safety sign-off [Safety]'],
            comprehensive: ['Develop validation strategy', 'Plan with stakeholder focus', 'Execute comprehensive procedures', 'Manage validation environment', 'Comprehensive reporting with acceptance', 'Stakeholder involvement strategy', 'Advanced defect analysis', 'Formal reviews', 'Measure effectiveness', 'Validate RAMS requirements [RAM]', 'Develop RAMS validation plan [RAM]', 'Integrate ISA activities [Safety]', 'Validate safety functions in operational context [Safety]', 'Obtain safety sign-off [Safety]']
        },
        deliverables: {
            basic: ['Validation plan', 'Validation procedures', 'Validation reports', 'Defect log', 'RAMS Validation Reports [RAM]'],
            standard: ['Detailed validation plan', 'Validation procedures (multiple methods)', 'Validation environment specification', 'Comprehensive reports', 'Stakeholder involvement plan', 'Defect tracking database', 'Validation review records', 'RAMS Validation Reports [RAM]', 'RAMS Validation Plan [RAM]', 'ISA Integration Records [Safety]', 'Operational Safety Validation Report [Safety]', 'Safety Acceptance Certificate [Safety]'],
            comprehensive: ['Validation strategy', 'Detailed plans with stakeholder focus', 'Comprehensive procedures', 'Validation environment management', 'Extensive reports with stakeholder acceptance', 'Stakeholder involvement strategy', 'Advanced defect tracking/analysis', 'Formal review documentation', 'Validation effectiveness metrics', 'RAMS Validation Reports [RAM]', 'RAMS Validation Plan [RAM]', 'ISA Integration Records [Safety]', 'Operational Safety Validation Report [Safety]', 'Safety Acceptance Certificate [Safety]']
        },
        outputs: [
            { name: 'Validation reports', feedsInto: 'Stakeholder Needs (Standard), System Requirements (Standard)' },
            { name: 'Stakeholder acceptance', feedsInto: 'Transition (Standard), Quality Assurance (Standard)' }
        ]
    },
    28: {
        activities: {
            basic: ['(*) Execute operational procedures', '(*) Monitor performance', '(*) Track problems', 'Provide user support', 'Monitor basic [RAM] performance', 'Implement FRACAS system'],
            standard: ['Plan operations', 'Execute comprehensive procedures', 'Monitor with KPIs', 'Analyze performance', 'Manage problems', 'Provide user support procedures', 'Conduct reviews', 'Train operators', 'Track [RAM] & maintain Hazard Log [Safety]', 'Implement FRACAS system', 'Monitor safety performance [Safety]', 'Track and analyze failures', 'Maintain operational Hazard Log [Safety]', 'Conduct periodic safety reviews [Safety]'],
            comprehensive: ['Develop operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Advanced analytics', 'Problem management with root cause', 'Comprehensive user support', 'Formal reviews', 'Advanced training', 'Measure operational effectiveness', 'Continuous RAMS monitoring & FRACAS [RAM]', 'Implement FRACAS system', 'Monitor safety performance [Safety]', 'Track and analyze failures', 'Maintain operational Hazard Log [Safety]', 'Conduct periodic safety reviews [Safety]']
        },
        deliverables: {
            basic: ['Operational procedures', 'Performance reports', 'Problem records', 'User support documentation', 'FRACAS Reports and Database'],
            standard: ['Operational plan', 'Comprehensive procedures', 'Performance monitoring plan', 'Performance analysis reports', 'Problem management process', 'User support procedures', 'Operational review records', 'Training program', 'FRACAS Reports and Database', 'Safety Performance Monitoring Reports [Safety]', 'Failure Analysis Reports', 'Operational Hazard Log [Safety]', 'Periodic Safety Review Reports [Safety]'],
            comprehensive: ['Operational strategy', 'Detailed procedures with contingencies', 'Performance monitoring framework', 'Advanced performance analytics', 'Problem management with root cause', 'Comprehensive user support infrastructure', 'Formal review documentation', 'Advanced training with evaluation', 'Operational effectiveness metrics', 'RAMS Validation Report [RAM]', 'FRACAS Reports and Database', 'Safety Performance Monitoring Reports [Safety]', 'Failure Analysis Reports', 'Operational Hazard Log [Safety]', 'Periodic Safety Review Reports [Safety]']
        },
        outputs: [
            { name: 'Operational data', feedsInto: 'Maintenance (Basic), Measurement (Standard)' },
            { name: 'Problem records', feedsInto: 'Quality Assurance (Standard), Knowledge Management (Standard)' }
        ]
    },
    29: {
        activities: {
            basic: ['(*) Plan maintenance', '(*) Execute maintenance procedures', '(*) Track problems', 'Report maintenance', 'Address basic hazard controls [Safety]', 'Track reliability growth [RAM]'],
            standard: ['Plan detailed maintenance', 'Execute comprehensive procedures', 'Manage maintenance environment', 'Track problems in database', 'Conduct reviews', 'Prepare documentation package', 'Update Hazard Log post-maintenance [Safety]', 'Track reliability growth [RAM]', 'Conduct change impact analysis for safety [Safety]', 'Perform post-maintenance safety verification [Safety]', 'Update safety documentation [Safety]', 'Analyze maintenance-related safety events [Safety]'],
            comprehensive: ['Develop maintenance strategy', 'Detailed procedures with optimization', 'Predictive maintenance methodology', 'Manage maintenance environment', 'Advanced problem tracking/analysis', 'Formal reviews', 'Complete maintenance package', 'Measure effectiveness', 'RAMS performance review & optimization [RAM]', 'Track reliability growth [RAM]', 'Conduct change impact analysis for safety [Safety]', 'Perform post-maintenance safety verification [Safety]', 'Update safety documentation [Safety]', 'Analyze maintenance-related safety events [Safety]']
        },
        deliverables: {
            basic: ['Maintenance plan', 'Maintenance procedures', 'Problem records', 'Maintenance reports', 'Reliability Growth Analysis [RAM]'],
            standard: ['Detailed maintenance plan', 'Comprehensive procedures', 'Maintenance environment specification', 'Problem tracking database', 'Maintenance review records', 'Maintenance documentation package', 'Reliability Growth Analysis [RAM]', 'Safety Change Impact Analysis [Safety]', 'Post-Maintenance Safety Verification Records [Safety]', 'Updated Safety Documentation [Safety]', 'Maintenance Safety Event Analysis [Safety]'],
            comprehensive: ['Maintenance strategy', 'Detailed procedures with optimization', 'Predictive maintenance methodology', 'Maintenance environment management', 'Advanced problem tracking/analysis', 'Formal review documentation', 'Complete maintenance package', 'Maintenance effectiveness metrics', 'Reliability Growth Analysis [RAM]', 'Safety Change Impact Analysis [Safety]', 'Post-Maintenance Safety Verification Records [Safety]', 'Updated Safety Documentation [Safety]', 'Maintenance Safety Event Analysis [Safety]']
        },
        outputs: [
            { name: 'Maintenance records', feedsInto: 'Operation (Basic), Configuration Management (Standard)' },
            { name: 'Problem trends', feedsInto: 'Quality Assurance (Standard), Risk Management (Standard)' }
        ]
    },
    30: {
        activities: {
            basic: ['(*) Plan disposal', '(*) Execute disposal procedures', 'Archive records', 'Report disposal', 'Develop disposal safety case [Safety]'],
            standard: ['Plan detailed disposal', 'Execute comprehensive procedures', 'Assess environmental impact', 'Address health and safety [Safety]', 'Conduct reviews', 'Plan archiving', 'Prepare documentation', 'Develop disposal safety case [Safety]', 'Identify and manage hazardous materials [Safety]', 'Conduct disposal safety assessment [Safety]', 'Archive safety records [Safety]', 'Close out Hazard Log [Safety]'],
            comprehensive: ['Develop disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental analysis', 'Detailed health and safety plan [Safety]', 'Formal reviews', 'Complete disposal documentation', 'Advanced archiving strategy', 'Measure effectiveness', 'Develop disposal safety case [Safety]', 'Identify and manage hazardous materials [Safety]', 'Conduct disposal safety assessment [Safety]', 'Archive safety records [Safety]', 'Close out Hazard Log [Safety]']
        },
        deliverables: {
            basic: ['Disposal plan', 'Disposal procedures', 'Disposal report', 'Archive list', 'Disposal Safety Case [Safety]'],
            standard: ['Detailed disposal plan', 'Comprehensive disposal procedures', 'Environmental assessment', 'Health and safety procedures [Safety]', 'Disposal review records', 'Archiving plan', 'Disposal documentation package', 'Disposal Safety Case [Safety]', 'Hazardous Materials Inventory and Plan [Safety]', 'Disposal Safety Assessment Report [Safety]', 'Archived Safety Records [Safety]', 'Hazard Log Closure Report [Safety]'],
            comprehensive: ['Disposal strategy', 'Detailed procedures with risk assessment', 'Comprehensive environmental impact analysis', 'Detailed health and safety plan [Safety]', 'Formal review documentation', 'Complete disposal documentation', 'Advanced archiving strategy', 'Disposal effectiveness metrics', 'Disposal Safety Case [Safety]', 'Hazardous Materials Inventory and Plan [Safety]', 'Disposal Safety Assessment Report [Safety]', 'Archived Safety Records [Safety]', 'Hazard Log Closure Report [Safety]']
        },
        outputs: [
            { name: 'Disposal records', feedsInto: 'Information Management (Standard), Knowledge Management (Standard)' },
            { name: 'Archive', feedsInto: 'Knowledge Management (Basic)' }
        ]
    }
};

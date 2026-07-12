/**
 * Process Explorer View — Searchable/filterable process detail browser
 */
import { BINDING_ASSURANCE_QUALIFIERS, CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META, METRIC_PROCESS_MAP, METRICS } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS, PROCESS_CONTEXT_OVERLAYS } from '../data/process-details.js';
import { getState } from '../state.js';
import { getCurrentRouteContext, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';

let filterGroup = 'all';
let searchQuery = '';

const LEVEL_KEYS = ['basic', 'standard', 'comprehensive'];
const LEVEL_SET = new Set(LEVEL_KEYS);
const PROCESS_ID_SET = new Set(CORE_PROCESSES.map(process => process.id));
const ROUTE_PARAM_KEYS = new Set(['process', 'level', 'source']);
const VALID_PROCESS_SOURCES = new Set([
  'assessment',
  'report',
  'elements',
  'system-elements',
  'vee-model',
  'matrix',
  'deliverables',
  'adjust',
  'manual-adjust',
  'interdependency',
  'dashboard',
  'process-explorer',
  'direct'
]);

const MINI_CARDS = {
  'risk-management': {
    upstream: [
      { process: 'Project Planning', level: 'Basic' },
      { process: 'Project Assessment', level: 'Basic' },
      { process: 'System Analysis', level: 'Standard', note: 'for quantitative' }
    ],
    downstream: {
      standard: [{ process: 'Decision Management', constraint: 'can be up to Standard' }],
      comprehensive: [{ process: 'Decision Management', level: 'Standard', type: 'WN' }]
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive',
    outputs: ['Risk register', 'Hazard log', 'Risk treatment plan']
  },
  'stakeholder-needs': {
    upstream: [
      { process: 'Business/Mission Analysis', level: 'Basic' },
      { process: 'Validation', level: 'Basic', note: 'for feedback' }
    ],
    downstream: {
      standard: [],
      comprehensive: [{ process: 'System Requirements Definition', level: 'Standard', type: 'HC' }]
    },
    override: 'None direct; elevated via validation chain',
    outputs: ['Stakeholder requirements', 'Concept of operations', 'Validation criteria']
  },
  'system-requirements': {
    upstream: [
      { process: 'Stakeholder Needs', level: 'Basic' },
      { process: 'Architecture', level: 'Basic', note: 'for allocation' },
      { process: 'Validation', level: 'Basic' }
    ],
    downstream: {
      standard: [{ process: 'Verification', level: 'Basic', type: 'WN' }],
      comprehensive: [
        { process: 'Verification', level: 'Standard', type: 'HC' },
        { process: 'Validation', level: 'Standard', type: 'HC' },
        { process: 'Configuration Management', level: 'Standard', type: 'HC' }
      ]
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; M6 ≥ 4 → Standard',
    outputs: ['System requirements spec', 'Requirements traceability matrix', 'Interface requirements']
  },
  'architecture-definition': {
    upstream: [
      { process: 'System Requirements Definition', level: 'Basic' },
      { process: 'System Analysis', level: 'Basic' },
      { process: 'Verification', level: 'Basic' }
    ],
    downstream: {
      standard: [],
      comprehensive: [
        { process: 'Design Definition', level: 'Standard', type: 'HC' },
        { process: 'Integration', level: 'Standard', type: 'WN' }
      ]
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; M6 ≥ 4 → Standard',
    outputs: ['Architecture description', 'Interface control documents', 'Integration strategy']
  },
  'integration': {
    upstream: [
      { process: 'Implementation', level: 'Basic' },
      { process: 'Configuration Management', level: 'Basic' },
      { process: 'Verification', level: 'Basic' }
    ],
    downstream: {
      standard: [],
      comprehensive: [{ process: 'Verification', level: 'Standard', type: 'HC' }]
    },
    override: 'None direct; elevated via architecture chain',
    outputs: ['Integrated system', 'Integration logs', 'Interface verification records']
  },
  'verification': {
    upstream: [
      { process: 'Integration', level: 'Basic' },
      { process: 'System Requirements Definition', level: 'Basic' },
      { process: 'Configuration Management', level: 'Basic' }
    ],
    downstream: {
      standard: [],
      comprehensive: [
        { process: 'System Requirements Definition', level: 'Standard', type: 'HC' },
        { process: 'Validation', level: 'Standard', type: 'WN' }
      ]
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; M8 ≥ 4 → Standard; scoped binding M15 ≥ 4 → Standard',
    outputs: ['Verification results', 'Test reports', 'Traceability to requirements']
  },
  'validation': {
    upstream: [
      { process: 'Stakeholder Needs', level: 'Basic' },
      { process: 'Verification', level: 'Basic' },
      { process: 'Quality Assurance', level: 'Basic' }
    ],
    downstream: {
      standard: [],
      comprehensive: [{ process: 'System Requirements Definition', level: 'Standard', type: 'HC' }]
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive',
    outputs: ['Validation report', 'Acceptance records', 'Stakeholder sign-off']
  },
  'configuration-management': {
    upstream: [
      { process: 'Information Management', level: 'Basic' },
      { process: 'Quality Management', level: 'Standard' },
      { process: 'Project Planning', level: 'Basic' }
    ],
    downstream: {
      standard: [],
      comprehensive: []
    },
    override: 'M8 ≥ 4 → Standard; M7 = 5 → Standard; scoped binding M15 ≥ 4 → Standard',
    outputs: ['Configuration baselines', 'Change control records', 'Version history']
  },
  'project-planning': {
    upstream: [
      { process: 'Portfolio Management', level: 'Basic' },
      { process: 'System Requirements Definition', level: 'Basic', note: 'for scope' }
    ],
    downstream: {
      basic: [{ process: 'All Technical Processes', constraint: '≤ Basic (HC)' }],
      standard: [{ process: 'Technical Processes', constraint: 'supports up to Standard' }],
      comprehensive: [{ process: 'Technical Processes', constraint: 'supports any level' }]
    },
    override: 'None direct; constrained by Rule 12 (HC)',
    outputs: ['Project plan', 'Work breakdown structure', 'Integrated master schedule']
  },
  'quality-assurance': {
    upstream: [
      { process: 'Life Cycle Model Mgmt', level: 'Basic' },
      { process: 'Quality Management', level: 'Standard' },
      { process: 'Configuration Management', level: 'Standard' }
    ],
    downstream: {
      standard: [],
      comprehensive: []
    },
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; scoped binding M15 ≥ 4 → Standard',
    outputs: ['QA audit reports', 'Process compliance records', 'Non-conformance reports']
  }
};

const MINIMAL_BASIC_CHECKLISTS = {
  12: {
    title: 'Risk Management – Minimal Basic Checklist',
    items: [
      '✓ Identify obvious risks and hazards (brainstorm with team)',
      '✓ Create simple risk register (risk name, H/M/L rating, owner)',
      '✓ Assess each risk using H/M/L matrix',
      '✓ Define basic mitigation actions for high risks',
      '✓ Review risks at least monthly',
      '✓ Report top 5-10 risks to project leadership'
    ]
  },
  19: {
    title: 'System Requirements Definition – Minimal Basic Checklist',
    items: [
      '✓ Document requirements in a simple list or spreadsheet',
      '✓ Each requirement has: ID, description, source, priority',
      '✓ Review requirements with key stakeholders',
      '✓ Create basic traceability (requirement → source)',
      '✓ Identify safety-related requirements (if M5 ≥ 3)',
      '✓ Establish baseline before design begins'
    ]
  },
  20: {
    title: 'Architecture Definition – Minimal Basic Checklist',
    items: [
      '✓ Create block diagram showing major system elements',
      '✓ List all interfaces between elements',
      '✓ Document key architectural decisions',
      '✓ Review with technical team',
      '✓ Ensure architecture covers all requirements',
      '✓ Establish architecture baseline'
    ]
  },
  24: {
    title: 'Integration – Minimal Basic Checklist',
    items: [
      '✓ Define integration sequence (what integrates with what)',
      '✓ Verify each interface before integration',
      '✓ Test each integration step',
      '✓ Log integration issues and resolutions',
      '✓ Document integration results',
      '✓ Verify complete system before verification'
    ]
  },
  25: {
    title: 'Verification – Minimal Basic Checklist',
    items: [
      '✓ Create verification plan (what to test, how, when)',
      '✓ Each requirement has at least one verification method',
      '✓ Execute verification procedures',
      '✓ Log all defects with severity',
      '✓ Track defects to closure',
      '✓ Produce verification report'
    ]
  },
  27: {
    title: 'Validation – Minimal Basic Checklist',
    items: [
      '✓ Define acceptance criteria from stakeholder needs',
      '✓ Create validation plan (scenarios, methods)',
      '✓ Involve stakeholders in validation',
      '✓ Execute validation procedures',
      '✓ Log defects and track to closure',
      '✓ Obtain stakeholder acceptance sign-off'
    ]
  },
  13: {
    title: 'Configuration Management – Minimal Basic Checklist',
    items: [
      '✓ Identify configuration items (CIs)',
      '✓ Establish version control for all CIs',
      '✓ Create simple change request form',
      '✓ Track changes in a log',
      '✓ Maintain baseline after each milestone',
      '✓ Back up configuration regularly'
    ]
  },
  9: {
    title: 'Project Planning – Minimal Basic Checklist',
    items: [
      '✓ Define project scope and objectives',
      '✓ Create milestone-based schedule',
      '✓ Identify required resources',
      '✓ Estimate costs (order of magnitude)',
      '✓ Identify key risks',
      '✓ Establish project baseline'
    ]
  },
  16: {
    title: 'Quality Assurance – Minimal Basic Checklist',
    items: [
      '✓ Define quality objectives',
      '✓ Plan basic audits (schedule, scope)',
      '✓ Conduct audits per plan',
      '✓ Log non-conformances',
      '✓ Track non-conformances to resolution',
      '✓ Report quality status to leadership'
    ]
  }
};

const CULTURE_TACTICS = {
  12: {
    title: 'Risk Management – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Frame risks as "What could go wrong?" rather than formal risk management',
          'Use guerrilla tactics: maintain informal risk list, share selectively',
          'Focus on high-impact risks that affect project success directly',
          'Present risk mitigation as "problem prevention" not process compliance'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Demonstrate ROI of risk management with past project examples',
          'Use internal champions to advocate for structured approach',
          'Start with simple risk register, expand as value becomes clear',
          'Report risk management benefits in project status meetings'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement quantitative risk analysis with probability distributions',
          'Create risk dashboards with leading indicators',
          'Integrate risk management into project governance',
          'Conduct regular risk reviews with cross-functional team'
        ]
      }
    ]
  },
  18: {
    title: 'Stakeholder Needs – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Use informal interviews rather than formal elicitation sessions',
          'Document needs in familiar formats (email threads, meeting notes)',
          'Focus on key stakeholders only, expand later'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how stakeholder analysis prevents scope creep',
          'Use visual stakeholder maps to communicate findings',
          'Start with 3-4 stakeholder groups, expand as needed'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Develop comprehensive stakeholder engagement plan',
          'Use multiple elicitation techniques (interviews, workshops, surveys)',
          'Create stakeholder influence maps with power/interest grids'
        ]
      }
    ]
  },
  19: {
    title: 'System Requirements – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Use simple spreadsheets instead of requirements databases',
          'Focus on functional requirements first',
          'Avoid formal notation, use natural language'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how traceability prevents requirements churn',
          'Use requirements attributes that add visible value',
          'Start with basic traceability matrix'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement requirements database with full attributes',
          'Use model-based requirements (SysML)',
          'Create comprehensive traceability network'
        ]
      }
    ]
  },
  20: {
    title: 'Architecture Definition – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Use simple block diagrams instead of formal architecture frameworks',
          'Focus on key interfaces only',
          'Document decisions in meeting notes'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how architecture prevents integration problems',
          'Use ISO 42010 viewpoints as communication tool',
          'Start with 2-3 key views'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement formal architecture framework (DoDAF, MODAF, TOGAF)',
          'Use model-based architecture (SysML, UML)',
          'Create architecture governance process'
        ]
      }
    ]
  },
  24: {
    title: 'Integration – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Focus on "build it and test it" approach',
          'Use simple integration checklists',
          'Log issues in shared spreadsheet'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how planned integration reduces rework',
          'Create integration sequence diagram',
          'Track integration metrics'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Develop comprehensive integration strategy',
          'Use continuous integration tools',
          'Create integration risk assessment'
        ]
      }
    ]
  },
  25: {
    title: 'Verification – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Focus on testing, avoid formal verification terminology',
          'Use simple test case templates',
          'Log defects in shared spreadsheet'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how traceability reduces test gaps',
          'Use multiple verification methods (T/D/I/A)',
          'Create verification metrics dashboard'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement risk-based verification strategy',
          'Use automated test frameworks',
          'Create comprehensive traceability to requirements'
        ]
      }
    ]
  },
  27: {
    title: 'Validation – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Focus on "user acceptance testing"',
          'Use informal stakeholder reviews',
          'Document acceptance in email'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how validation prevents late-stage changes',
          'Create stakeholder involvement plan',
          'Use multiple validation methods'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Develop comprehensive validation strategy',
          'Create stakeholder acceptance criteria',
          'Use operational scenarios for validation'
        ]
      }
    ]
  },
  13: {
    title: 'Configuration Management – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Use simple version control (Git, shared drive)',
          'Focus on key documents only',
          'Track changes informally'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how CM prevents "wrong version" problems',
          'Create simple change request process',
          'Establish baselines at key milestones'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement formal CM with CCB',
          'Use PLM/ALM tools',
          'Create comprehensive change impact analysis'
        ]
      }
    ]
  },
  9: {
    title: 'Project Planning – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Use simple milestone list',
          'Focus on key deliverables',
          'Avoid formal WBS terminology'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how WBS improves estimation',
          'Create basic IMS',
          'Use risk register for planning'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Develop integrated multi-view plans',
          'Use probabilistic scheduling',
          'Create resource optimization models'
        ]
      }
    ]
  },
  16: {
    title: 'Quality Assurance – Culture-Specific Tactics',
    cultures: [
      {
        type: 'Resistant',
        icon: '🚧',
        description: 'Organization views SE as overhead',
        tactics: [
          'Focus on "peer reviews" rather than audits',
          'Use simple checklists',
          'Track issues informally'
        ]
      },
      {
        type: 'Tolerant',
        icon: '🤝',
        description: 'Organization accepts SE if value is demonstrated',
        tactics: [
          'Show how QA prevents rework',
          'Create basic audit schedule',
          'Track non-conformances'
        ]
      },
      {
        type: 'Supportive',
        icon: '✅',
        description: 'Organization actively invests in SE',
        tactics: [
          'Implement comprehensive QA program',
          'Use quality metrics and trend analysis',
          'Create continuous improvement process'
        ]
      }
    ]
  }
};

function hasEntries(value) {
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}

function getProcessViewContext(state) {
  const tree = state.assessmentTree;
  const activeNode = tree?.nodes?.[tree.activeId] || tree?.nodes?.[tree.rootId] || null;
  const isRootContext = !activeNode || activeNode.id === tree?.rootId;
  const assessmentResult = activeNode?.assessmentResult || {};
  const levels = hasEntries(activeNode?.levels)
    ? activeNode.levels
    : hasEntries(assessmentResult.levels)
      ? assessmentResult.levels
      : isRootContext
        ? (state.levels || {})
        : {};
  const scores = hasEntries(activeNode?.scores)
    ? activeNode.scores
    : isRootContext
      ? (state.scores || {})
      : {};
  const metricAssessments = hasEntries(activeNode?.metricAssessments)
    ? activeNode.metricAssessments
    : isRootContext
      ? (state.metricAssessments || {})
      : {};

  return {
    elementId: activeNode?.id || null,
    elementName: activeNode?.name || 'Current assessment',
    levels,
    scores,
    metricAssessments,
    manualAdjustments: {
      ...(isRootContext ? (state.manualAdjustments || {}) : {}),
      ...(activeNode?.manualAdjustments || {})
    },
    assuranceObligations: Array.isArray(activeNode?.assuranceObligations)
      ? (isRootContext && activeNode.assuranceObligations.length === 0 && (state.assuranceObligations || []).length > 0
        ? state.assuranceObligations
        : activeNode.assuranceObligations)
      : isRootContext
        ? (state.assuranceObligations || [])
        : [],
    derivationDetails: assessmentResult.derivationDetails || (isRootContext ? state.derivationDetails : {}) || {},
    overrides: assessmentResult.overrides || (isRootContext ? state.overrides : []) || [],
    fixes: assessmentResult.fixes || (isRootContext ? state.fixes : []) || []
  };
}

function getAdjustmentLevel(manualAdjustments, processId) {
  const adjustment = manualAdjustments?.[processId] || manualAdjustments?.[String(processId)];
  const level = typeof adjustment === 'string' ? adjustment : adjustment?.level || adjustment?.to;
  return LEVEL_SET.has(level) ? level : null;
}

function getAssignedProcessLevel(viewContext, processId) {
  const adjustedLevel = getAdjustmentLevel(viewContext.manualAdjustments, processId);
  if (adjustedLevel) return adjustedLevel;
  const level = viewContext.levels?.[processId] || viewContext.levels?.[String(processId)];
  return LEVEL_SET.has(level) ? level : null;
}

function readSingleRouteParam(params, key, issues) {
  const values = params.getAll(key);
  if (values.length > 1) {
    issues.push(`The ${key} parameter must appear only once.`);
    return null;
  }
  return values.length === 1 ? values[0] : null;
}

export function resolveProcessExplorerRoute(routeContext = getCurrentRouteContext(), state = getState()) {
  const params = routeContext?.params instanceof URLSearchParams
    ? routeContext.params
    : new URLSearchParams();
  const issues = [];
  for (const key of new Set(params.keys())) {
    if (!ROUTE_PARAM_KEYS.has(key)) issues.push(`Unsupported route parameter ignored: ${key}.`);
  }

  const processValue = readSingleRouteParam(params, 'process', issues);
  const levelValue = readSingleRouteParam(params, 'level', issues);
  const sourceValue = readSingleRouteParam(params, 'source', issues);
  const processId = processValue !== null
    && /^(?:0|[1-9]\d*)$/.test(processValue)
    && PROCESS_ID_SET.has(Number(processValue))
    ? Number(processValue)
    : null;
  if (processValue !== null && processId === null) {
    issues.push('The requested process is not part of the 22-process executable core.');
  }

  const source = sourceValue === null
    ? null
    : VALID_PROCESS_SOURCES.has(sourceValue)
      ? sourceValue
      : null;
  if (sourceValue !== null && source === null) issues.push('The process-detail source is not recognized.');

  const viewContext = getProcessViewContext(state);
  const assignedLevel = processId ? getAssignedProcessLevel(viewContext, processId) : null;
  const requestedLevel = levelValue !== null && LEVEL_SET.has(levelValue) ? levelValue : null;
  if (levelValue !== null && requestedLevel === null) {
    issues.push('The requested tailoring level must be basic, standard, or comprehensive.');
  }
  if (!processId && levelValue !== null) issues.push('A tailoring level can only be opened with a valid process.');

  return {
    processId,
    assignedLevel,
    viewLevel: processId ? (requestedLevel || assignedLevel || 'basic') : null,
    source,
    issues,
    viewContext
  };
}

function getFilteredProcesses() {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  return CORE_PROCESSES.filter(process => {
    if (filterGroup !== 'all' && process.group !== filterGroup) return false;
    if (normalizedSearch && !`${process.id} ${process.name} ${process.purpose}`.toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });
}

function renderProcessListMarkup(selection) {
  const filtered = getFilteredProcesses();
  if (!filtered.length) return '<div class="empty-state process-list-empty"><p class="text-secondary">No processes match this filter.</p></div>';
  return filtered.map(process => {
    const assignedLevel = getAssignedProcessLevel(selection.viewContext, process.id);
    const browseLevel = assignedLevel || 'basic';
    return `
      <a class="process-list-card ${selection.processId === process.id ? 'selected' : ''} hover-lift"
         href="${escapeHtml(processDetailsHref(process.id, browseLevel, selection.source))}"
         ${selection.processId === process.id ? 'aria-current="page"' : ''}
         aria-label="Open ${escapeHtml(process.name)} at ${escapeHtml(FRAMEWORK_META.levelLabels[browseLevel])} detail">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-sm">
            <span class="process-id">${process.id}</span>
            <span class="font-bold">${escapeHtml(process.name)}</span>
          </div>
          ${assignedLevel ? `<span class="level-badge ${escapeHtml(assignedLevel)}" title="Recommended for ${escapeHtml(selection.viewContext.elementName)}">${assignedLevel[0].toUpperCase()}</span>` : ''}
        </div>
        <div class="text-xs text-secondary mt-sm">${escapeHtml(process.purpose)}</div>
      </a>`;
  }).join('');
}

function updateProcessList(container, selection) {
  const panel = container.querySelector('#process-list-panel');
  if (panel) panel.innerHTML = renderProcessListMarkup(selection);
}

export function renderProcessExplorer(container, routeContext = getCurrentRouteContext()) {
  const state = getState();
  const selection = resolveProcessExplorerRoute(routeContext, state);

  container.innerHTML = `
    <h2 class="mb-lg">🔍 Process Explorer</h2>
    ${selection.issues.length ? `
      <div class="callout process-route-warning mb-lg" role="status">
        <strong>Some process-detail link information was ignored.</strong>
        <div class="text-xs text-secondary mt-sm">${selection.issues.map(issue => escapeHtml(issue)).join('<br>')}</div>
      </div>` : ''}
    <div class="explorer-controls mb-lg">
      <input class="input" id="process-search" placeholder="Search processes..." value="${escapeHtml(searchQuery)}" style="max-width:300px" aria-label="Search processes" type="search">
      <div class="tabs" id="group-tabs" role="group" aria-label="Process group filter">
        <button class="tab ${filterGroup === 'all' ? 'active' : ''}" data-group="all" type="button" aria-pressed="${filterGroup === 'all'}">All (${CORE_PROCESSES.length})</button>
        <button class="tab ${filterGroup === 'tech_mgmt' ? 'active' : ''}" data-group="tech_mgmt" type="button" aria-pressed="${filterGroup === 'tech_mgmt'}">Tech Management</button>
        <button class="tab ${filterGroup === 'technical' ? 'active' : ''}" data-group="technical" type="button" aria-pressed="${filterGroup === 'technical'}">Technical</button>
      </div>
    </div>
    <div class="explorer-layout">
      <nav class="process-list-panel" id="process-list-panel" aria-label="Processes">
        ${renderProcessListMarkup(selection)}
      </nav>
      <div class="process-detail-panel" id="process-detail">
        ${selection.processId
          ? renderProcessDetail(selection.processId, state, selection.viewContext, selection.viewLevel, selection.source)
          : '<div class="empty-state"><p class="text-secondary">Select a process to view its Basic, Standard, and Comprehensive content.</p></div>'}
      </div>
    </div>
  `;

  // Inject styles only once (avoid re-injecting on every re-render)
  if (!document.getElementById('process-explorer-styles')) {
    const style = document.createElement('style');
    style.id = 'process-explorer-styles';
    style.textContent = `
      .explorer-controls { display: flex; flex-direction: column; gap: 12px; }
      .explorer-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
      .process-list-panel { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 8px; }
      .process-list-card { display: block; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: all var(--transition-fast); color: inherit; text-decoration: none; }
      .process-list-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.08); }
      .process-list-card:hover { border-color: var(--border-medium); }
      .process-list-card:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .process-list-empty { min-height: 140px; }
      .process-detail-panel { min-height: 500px; }
      .empty-state { display: flex; align-items: center; justify-content: center; min-height: 400px; }
      .detail-section { margin-bottom: var(--space-xl); }
      .detail-section h4 { margin-bottom: var(--space-md); color: var(--accent-primary-light); }
      .process-detail-header { align-items: flex-start; gap: var(--space-lg); }
      .process-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .process-meta-pill { border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 3px 9px; font-size: 11px; color: var(--text-secondary); }
      .level-selector-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap; padding: 12px 0 18px; margin-bottom: var(--space-xl); border-bottom: 1px solid var(--border-subtle); }
      .level-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0; }
      .level-tab { display: inline-block; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all var(--transition-fast); text-decoration: none; }
      .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
      .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
      .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
      .level-tab:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .detail-empty-line { color: var(--text-tertiary); font-size: var(--font-size-sm); padding: 8px 0; }
      .activity-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
      .activity-item.essential { color: var(--text-primary); font-weight: 500; }
      .deliverable-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
      .output-item { background: rgba(34,211,238,0.06); border-radius: var(--radius-md); padding: 10px; margin-bottom: 8px; font-size: var(--font-size-xs); }
      .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
      .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
      .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
      .mini-card { background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-lg); margin-bottom: var(--space-xl); }
      .mini-card-item { padding: 4px 0; font-size: var(--font-size-xs); }
      .implementation-aids { border-top: 1px solid var(--border-subtle); padding-top: var(--space-xl); }
      .aid-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-md); }
      .aid-panel { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-md); background: rgba(255,255,255,0.025); }
      .aid-panel.basic { border-color: rgba(59,130,246,0.25); background: rgba(59,130,246,0.055); }
      .aid-panel.culture { border-color: rgba(139,92,246,0.24); background: rgba(139,92,246,0.05); }
      .aid-panel h5 { margin-bottom: 10px; color: var(--text-primary); font-size: var(--font-size-sm); }
      .aid-checklist { display: grid; gap: 6px; font-size: var(--font-size-xs); color: var(--text-secondary); }
      .culture-tactic { padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.06); }
      .culture-tactic:first-of-type { border-top: 0; padding-top: 0; }
      .culture-tactic ul { margin: 6px 0 0 18px; color: var(--text-secondary); font-size: var(--font-size-xs); }
      .culture-tactic li { margin: 3px 0; }
      @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
    `;
    document.head.appendChild(style);
  }

  // Event handlers
  container.querySelector('#process-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateProcessList(container, selection);
  });
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterGroup = tab.dataset.group;
      container.querySelectorAll('.tab').forEach(button => {
        const active = button.dataset.group === filterGroup;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      updateProcessList(container, selection);
    });
  });

  if (selection.processId && selection.source) {
    window.requestAnimationFrame(() => {
      const heading = container.querySelector('#process-detail-heading');
      if (!heading) return;
      heading.focus({ preventScroll: true });
      const mobileLayout = window.matchMedia?.('(max-width: 900px)').matches;
      if (mobileLayout) {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }
}

export function getContextScore(viewContext, metricId) {
  const assessment = viewContext?.metricAssessments?.[metricId];
  if (!['assessed', 'inherited-confirmed'].includes(assessment?.status)) return null;
  const assessmentScore = Number(assessment?.score);
  const contextScore = Number(viewContext?.scores?.[metricId]);
  const validAssessmentScore = Number.isInteger(assessmentScore) && assessmentScore >= 1 && assessmentScore <= 5;
  const validContextScore = Number.isInteger(contextScore) && contextScore >= 1 && contextScore <= 5;
  if (validAssessmentScore && validContextScore && assessmentScore !== contextScore) return null;
  if (validAssessmentScore) return assessmentScore;
  return validContextScore ? contextScore : null;
}

function getConditionalContentState(text, viewContext) {
  const metricId = text.includes('[Safety]') ? 'M5' : text.includes('[RAM]') ? 'M6' : null;
  if (!metricId) return { disabled: false, note: '' };
  const score = getContextScore(viewContext, metricId);
  if (score === null) return { disabled: false, note: `${metricId} context unconfirmed` };
  return score < 3
    ? { disabled: true, note: `Not required (${metricId} < 3)` }
    : { disabled: false, note: '' };
}

function renderContextNote(note, disabled) {
  if (!note) return '';
  return `<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${disabled ? '' : '⚠ '}${escapeHtml(note)}</span>`;
}

function renderProcessDetail(processId, state, viewContext, viewLevel, source) {
  const p = CORE_PROCESSES.find(x => x.id === processId);
  if (!p) return '';
  const details = PROCESS_DETAILS[processId];
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const map = matrixMap[processId] || {};
  const level = getAssignedProcessLevel(viewContext, processId);
  const miniCard = MINI_CARDS[p.slug];
  const basicChecklist = MINIMAL_BASIC_CHECKLISTS[processId];
  const cultureTactics = CULTURE_TACTICS[processId];

  const activities = details?.activities?.[viewLevel] || [];
  const deliverables = details?.deliverables?.[viewLevel] || [];
  const outputs = details?.outputs || [];
  const contextOverlays = PROCESS_CONTEXT_OVERLAYS[processId] || {};
  const securityScore = getContextScore(viewContext, 'M8');
  const securityOverlay = securityScore !== null && securityScore >= 3 ? contextOverlays.security : null;
  const assuranceOverlay = (viewContext.assuranceObligations || []).some(obligation =>
    obligation?.bindingStatus === 'confirmed'
      && BINDING_ASSURANCE_QUALIFIERS.includes(obligation.type)
      && String(obligation.authority || '').trim()
      && String(obligation.sourceRef || '').trim()
      && Array.isArray(obligation.processScope)
      && obligation.processScope.map(Number).includes(Number(processId))
  ) ? contextOverlays.assurance : null;
  const activeContextOverlays = [
    securityOverlay ? { label: 'Security evidence overlay', metric: 'M8', ...securityOverlay } : null,
    assuranceOverlay ? { label: 'Binding assurance overlay', metric: 'M15', ...assuranceOverlay } : null
  ].filter(Boolean);
  const levelLabel = FRAMEWORK_META.levelLabels[level] || level;
  const viewLevelLabel = FRAMEWORK_META.levelLabels[viewLevel] || viewLevel;
  const groupLabel = PROCESS_GROUPS[p.group.toUpperCase()]?.name || p.group;
  const scopeLabel = p.iso?.scope === 'executable-core' ? 'Executable core' : 'Reference scope';

  return `
    <div class="card animate-fade-in">
      <div class="flex justify-between process-detail-header mb-lg">
        <div>
          <h3 id="process-detail-heading" tabindex="-1">${escapeHtml(p.name)}</h3>
          <p class="text-sm text-secondary mt-sm">${escapeHtml(p.purpose)}</p>
          <div class="process-meta-row">
            <span class="process-meta-pill">P${p.id}</span>
            <span class="process-meta-pill">${escapeHtml(groupLabel)}</span>
            <span class="process-meta-pill">${escapeHtml(scopeLabel)}</span>
            <span class="process-meta-pill">Context: ${escapeHtml(viewContext.elementName)}</span>
            <span class="process-meta-pill">${activities.length} activities · ${deliverables.length} deliverables at ${escapeHtml(viewLevelLabel)}</span>
          </div>
        </div>
        ${level
          ? `<span class="level-badge ${escapeHtml(level)}" title="Recommended tailoring level for ${escapeHtml(viewContext.elementName)}">Recommended: ${escapeHtml(levelLabel)}</span>`
          : '<span class="process-meta-pill">No assessment assignment</span>'}
      </div>

      <div class="level-selector-bar">
        <div>
          <div class="text-xs text-secondary">Viewing process content at</div>
          <div class="text-sm">${level
            ? `The recommendation is ${escapeHtml(levelLabel)}. Switch levels for comparison.`
            : `No recommendation is assigned. ${escapeHtml(viewLevelLabel)} is shown for browsing only.`}</div>
        </div>
        <nav class="level-tabs" aria-label="Tailoring level detail selector">
          ${LEVEL_KEYS.map(l => `
            <a class="level-tab ${viewLevel === l ? 'active-' + escapeHtml(l) : ''}"
               href="${escapeHtml(processDetailsHref(processId, l, source))}"
               ${viewLevel === l ? 'aria-current="page"' : ''}
               aria-label="View ${escapeHtml(FRAMEWORK_META.levelLabels[l])} level content">${escapeHtml(FRAMEWORK_META.levelLabels[l])}</a>
          `).join('')}
        </nav>
      </div>

      ${p.definition ? `
      <div class="detail-section">
        <h4>Definition at ${escapeHtml(viewLevelLabel)}</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.definition[viewLevel] || '—')}</p>
      </div>` : ''}

      <div class="detail-section">
        <h4>Activities (${activities.length}) <span class="text-xs text-secondary font-normal ml-sm">(⭐ = Essential core activity)</span></h4>
        ${activities.length ? activities.map(a => {
    let isEssential = a.startsWith('(*)');
    let text = isEssential ? a.slice(4) : a;
    const contentState = getConditionalContentState(text, viewContext);
    const { disabled } = contentState;
    return `<div class="activity-item ${isEssential ? 'essential' : ''}" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            ${isEssential ? '⭐ ' : '• '} <span style="${disabled ? 'text-decoration: line-through;' : ''}">${escapeHtml(text)}</span>
            ${renderContextNote(contentState.note, disabled)}
          </div>`;
  }).join('') : '<div class="detail-empty-line">No activity detail is defined for this process level yet.</div>'}
      </div>

      <div class="detail-section">
        <h4>Deliverables (${deliverables.length})</h4>
        ${deliverables.length ? deliverables.map(d => {
    let text = d;
    const contentState = getConditionalContentState(text, viewContext);
    const { disabled } = contentState;
    return `<div class="deliverable-item" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            📄 <span style="${disabled ? 'text-decoration: line-through;' : ''}">${escapeHtml(text)}</span>
            ${renderContextNote(contentState.note, disabled)}
          </div>`;
  }).join('') : '<div class="detail-empty-line">No deliverable detail is defined for this process level yet.</div>'}
      </div>

      <div class="detail-section">
        <h4>Outputs & Feeds Into</h4>
        ${outputs.length ? outputs.map(o => `<div class="output-item"><strong>${escapeHtml(o.name)}</strong> → ${escapeHtml(o.feedsInto)}</div>`).join('') : '<div class="detail-empty-line">No output flow detail is defined for this process yet.</div>'}
      </div>

      ${activeContextOverlays.length ? `
      <div class="detail-section" style="border-left: 3px solid var(--accent-warning); padding-left: 14px;">
        <h4>Conditional Context Evidence</h4>
        <p class="text-xs text-secondary mb-md">These prompts operationalize an existing mapped context. They do not change the assigned process level or create a new metric-to-process relationship.</p>
        ${activeContextOverlays.map(overlay => `
          <div class="mb-md">
            <div class="text-sm font-bold">${escapeHtml(overlay.label)} <span class="metric-tag secondary">${escapeHtml(overlay.metric)}</span></div>
            ${(overlay.activities || []).map(activity => `<div class="activity-item">• ${escapeHtml(activity)}</div>`).join('')}
            ${(overlay.evidence || []).map(item => `<div class="deliverable-item">📄 ${escapeHtml(item)}</div>`).join('')}
          </div>
        `).join('')}
      </div>` : ''}

      ${miniCard ? `
      <div class="detail-section">
        <h4>Practitioner Dependency Context (Non-Normative)</h4>
        <p class="text-xs text-secondary mb-md">This hand-authored aid highlights selected workflow considerations. It is not the executable rule registry and does not change the recommendation.</p>
        ${renderMiniCard(miniCard, level)}
      </div>` : ''}

      ${renderImplementationAids(basicChecklist, cultureTactics)}

      <div class="detail-section">
        <h4>Metric Applicability</h4>
        <div class="flex" style="flex-wrap:wrap">
          ${Object.entries(map).map(([mid, role]) => {
    const m = METRICS.find(x => x.id === mid);
    return `<span class="metric-tag ${escapeHtml(role)}">${escapeHtml(role)} ${escapeHtml(mid)}: ${escapeHtml(m?.name || mid)}</span>`;
  }).join('')}
        </div>
      </div>

      ${p.whenToElevate ? `
      <div class="detail-section">
        <h4>When to Elevate</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.whenToElevate)}</p>
      </div>` : ''}
    </div>
  `;
}

function renderImplementationAids(basicChecklist, cultureTactics) {
  if (!basicChecklist && !cultureTactics) return '';

  return `
      <div class="detail-section implementation-aids">
        <h4>Implementation Aids</h4>
        <div class="aid-grid">
          ${basicChecklist ? `
          <div class="aid-panel basic">
            <h5>${escapeHtml(basicChecklist.title)}</h5>
            <div class="aid-checklist">
              ${basicChecklist.items.map(item => `<div>${escapeHtml(item)}</div>`).join('')}
            </div>
          </div>` : ''}
          ${cultureTactics ? `
          <div class="aid-panel culture">
            <h5>${escapeHtml(cultureTactics.title)}</h5>
            ${cultureTactics.cultures.map(c => `
              <div class="culture-tactic">
                <div class="flex items-center gap-sm">
                  <span>${escapeHtml(c.icon)}</span>
                  <span class="font-bold text-sm">${escapeHtml(c.type)}</span>
                  <span class="text-xs text-secondary">${escapeHtml(c.description)}</span>
                </div>
                <ul>
                  ${c.tactics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>` : ''}
        </div>
      </div>
  `;
}

function renderMiniCard(card, currentLevel) {
  const getLevelBadge = (lvl) => {
    const colors = { Basic: 'var(--level-basic)', Standard: 'var(--level-standard)', Comprehensive: 'var(--level-comprehensive)' };
    return `<span style="background:${colors[lvl] || 'var(--bg-tertiary)'}; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${escapeHtml(lvl)}</span>`;
  };
  const getTypeBadge = (type) => {
    if (!type) return '';
    const isHC = type === 'HC';
    return `<span style="background:${isHC ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)'}; color:${isHC ? '#ef4444' : '#f59e0b'}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">${escapeHtml(type)}</span>`;
  };

  const downstreamItems = [];
  if (card.downstream.basic) {
    card.downstream.basic.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Basic')} → ${escapeHtml(d.process)} <span class="text-secondary">${escapeHtml(d.constraint)}</span></div>`);
    });
  }
  if (card.downstream.standard) {
    card.downstream.standard.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Standard')} → ${escapeHtml(d.process)} ${d.level ? getLevelBadge(d.level) : ''} ${getTypeBadge(d.type)} <span class="text-secondary">${escapeHtml(d.constraint || '')}</span></div>`);
    });
  }
  if (card.downstream.comprehensive) {
    card.downstream.comprehensive.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Comprehensive')} → ${escapeHtml(d.process)} ${d.level ? getLevelBadge(d.level) : ''} ${getTypeBadge(d.type)} <span class="text-secondary">${escapeHtml(d.constraint || '')}</span></div>`);
    });
  }

  return `
    <div class="mini-card">
      <div class="flex gap-lg" style="flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <h5 style="color:var(--accent-primary-light); margin-bottom:10px; font-size:13px;">⬆️ Upstream Must Be At Least</h5>
          ${card.upstream.map(u => `
            <div class="mini-card-item" style="padding:4px 0; font-size:12px;">
              ${getLevelBadge(u.level)} ${escapeHtml(u.process)} ${u.note ? `<span class="text-secondary">(${escapeHtml(u.note)})</span>` : ''}
            </div>
          `).join('')}
        </div>
        <div style="flex:1; min-width:200px;">
          <h5 style="color:var(--accent-primary-light); margin-bottom:10px; font-size:13px;">⬇️ If This Process Is...</h5>
          ${downstreamItems.length > 0 ? downstreamItems.join('') : '<div class="text-secondary" style="font-size:12px;">No mandatory downstream propagation</div>'}
        </div>
      </div>
      <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(99,102,241,0.1);">
        <div class="flex gap-lg" style="flex-wrap:wrap;">
          <div style="flex:1;">
            <span style="font-size:11px; color:var(--text-secondary);">🛡️ Criticality Override:</span>
            <span style="font-size:12px; margin-left:6px;">${escapeHtml(card.override)}</span>
          </div>
          <div style="flex:1;">
            <span style="font-size:11px; color:var(--text-secondary);">📤 Key Outputs:</span>
            <span style="font-size:12px; margin-left:6px;">${escapeHtml(card.outputs.join(', '))}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

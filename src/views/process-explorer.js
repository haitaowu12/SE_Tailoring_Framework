/**
 * Process Explorer View — Searchable/filterable process detail browser
 */
import { CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META, METRIC_PROCESS_MAP, METRICS } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS } from '../data/process-details.js';
import { getState, setState } from '../state.js';

let activeProcess = null;
let activeLevel = 'basic';
let filterGroup = 'all';
let searchQuery = '';

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
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; M8 ≥ 4 → Standard',
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
    override: 'M8 ≥ 4 → Standard; M7 = 5 → Standard',
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
    override: 'M5 ≥ 4 → Standard; M5 = 5 → Comprehensive; M8 ≥ 4 → Standard',
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

export function renderProcessExplorer(container) {
  const state = getState();

  // If navigated here from Elements tab with a specific process target
  if (state.activeProcessExplorerId) {
    activeProcess = state.activeProcessExplorerId;
    setState({ activeProcessExplorerId: null });
  }

  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const filtered = CORE_PROCESSES.filter(p => {
    if (filterGroup !== 'all' && p.group !== filterGroup) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  container.innerHTML = `
    <h2 class="mb-lg">🔍 Process Explorer</h2>
    <div class="explorer-controls mb-lg">
      <input class="input" id="process-search" placeholder="Search processes..." value="${searchQuery}" style="max-width:300px">
      <div class="tabs" id="group-tabs">
        <button class="tab ${filterGroup === 'all' ? 'active' : ''}" data-group="all">All (${CORE_PROCESSES.length})</button>
        <button class="tab ${filterGroup === 'tech_mgmt' ? 'active' : ''}" data-group="tech_mgmt">Tech Management</button>
        <button class="tab ${filterGroup === 'technical' ? 'active' : ''}" data-group="technical">Technical</button>
      </div>
    </div>
    <div class="explorer-layout">
      <div class="process-list-panel">
        ${filtered.map(p => {
    const level = state.levels[p.id];
    return `
          <div class="process-list-card ${activeProcess === p.id ? 'selected' : ''} hover-lift" data-pid="${p.id}">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-sm">
                <span class="process-id">${p.id}</span>
                <span class="font-bold">${p.name}</span>
              </div>
              ${level ? `<span class="level-badge ${level}">${level[0].toUpperCase()}</span>` : ''}
            </div>
            <div class="text-xs text-secondary mt-sm">${p.purpose}</div>
          </div>`;
  }).join('')}
      </div>
      <div class="process-detail-panel" id="process-detail">
        ${activeProcess ? renderProcessDetail(activeProcess, state) : '<div class="empty-state"><p class="text-secondary">← Select a process to view details</p></div>'}
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .explorer-controls { display: flex; flex-direction: column; gap: 12px; }
    .explorer-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
    .process-list-panel { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 8px; }
    .process-list-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .process-list-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.08); }
    .process-list-card:hover { border-color: var(--border-medium); }
    .process-detail-panel { min-height: 500px; }
    .empty-state { display: flex; align-items: center; justify-content: center; min-height: 400px; }
    .detail-section { margin-bottom: 24px; }
    .detail-section h4 { margin-bottom: 12px; color: var(--accent-primary-light); }
    .level-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .level-tab { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all 0.2s; }
    .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
    .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
    .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
    .activity-item { padding: 6px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
    .activity-item.essential { color: var(--text-primary); font-weight: 500; }
    .deliverable-item { padding: 6px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
    .output-item { background: rgba(34,211,238,0.06); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 13px; }
    .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
    .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
    @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
  `;
  container.appendChild(style);

  // Event handlers
  container.querySelector('#process-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProcessExplorer(container);
  });
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => { filterGroup = tab.dataset.group; renderProcessExplorer(container); });
  });
  container.querySelectorAll('.process-list-card').forEach(card => {
    card.addEventListener('click', () => {
      activeProcess = parseInt(card.dataset.pid);
      activeLevel = 'basic';
      renderProcessExplorer(container);
    });
  });
}

function renderProcessDetail(processId, state) {
  const p = CORE_PROCESSES.find(x => x.id === processId);
  if (!p) return '';
  const details = PROCESS_DETAILS[processId];
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const map = matrixMap[processId] || {};
  const level = state.levels[processId];
  const miniCard = MINI_CARDS[p.slug];
  const basicChecklist = MINIMAL_BASIC_CHECKLISTS[processId];
  const cultureTactics = CULTURE_TACTICS[processId];

  const activities = details?.activities?.[activeLevel] || [];
  const deliverables = details?.deliverables?.[activeLevel] || [];
  const outputs = details?.outputs || [];

  return `
    <div class="card animate-fade-in">
      <div class="flex justify-between items-center mb-lg">
        <div>
          <h3>${p.name}</h3>
          <p class="text-sm text-secondary mt-sm">${p.purpose}</p>
        </div>
        ${level ? `<span class="level-badge ${level}">${FRAMEWORK_META.levelLabels[level]}</span>` : ''}
      </div>

      ${miniCard ? renderMiniCard(miniCard, level) : ''}

      ${basicChecklist ? `
      <div class="detail-section" style="background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <h4 style="color: var(--level-basic); margin-bottom: 12px;">📋 ${basicChecklist.title}</h4>
        <div style="font-size: 13px;">
          ${basicChecklist.items.map(item => `<div style="padding: 4px 0; color: var(--text-secondary);">${item}</div>`).join('')}
        </div>
      </div>` : ''}

      ${cultureTactics ? `
      <div class="detail-section" style="background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <h4 style="color: #a78bfa; margin-bottom: 12px;">🎯 ${cultureTactics.title}</h4>
        <div style="display: grid; gap: 12px;">
          ${cultureTactics.cultures.map(c => `
            <div style="background: var(--bg-card); border-radius: 8px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 16px;">${c.icon}</span>
                <span style="font-weight: 600; font-size: 13px;">${c.type}</span>
                <span style="font-size: 11px; color: var(--text-tertiary);">— ${c.description}</span>
              </div>
              <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--text-secondary);">
                ${c.tactics.map(t => `<li style="margin: 3px 0;">${t}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${p.definition ? `
      <div class="detail-section">
        <h4>Definition at ${FRAMEWORK_META.levelLabels[activeLevel]}</h4>
        <p class="text-sm text-secondary">${p.definition[activeLevel] || '—'}</p>
      </div>` : ''}

      <div class="level-tabs">
        ${['basic', 'standard', 'comprehensive'].map(l => `
          <button class="level-tab ${activeLevel === l ? 'active-' + l : ''}" data-level="${l}" onclick="document.dispatchEvent(new CustomEvent('setLevel',{detail:'${l}'}))">${FRAMEWORK_META.levelLabels[l]}</button>
        `).join('')}
      </div>

      <div class="detail-section">
        <h4>Activities (${activities.length}) <span class="text-xs text-secondary font-normal ml-sm">(⭐ = Essential core activity)</span></h4>
        ${activities.map(a => {
    let isEssential = a.startsWith('(*)');
    let text = isEssential ? a.slice(4) : a;
    let disabled = false; let reason = '';
    const m5Score = state.scores?.M5 || 3;
    const m6Score = state.scores?.M6 || 3;
    if (text.includes('[Safety]') && m5Score < 3) { disabled = true; reason = '(M5 < 3)'; }
    if (text.includes('[RAM]') && m6Score < 3) { disabled = true; reason = '(M6 < 3)'; }
    return `<div class="activity-item ${isEssential ? 'essential' : ''}" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            ${isEssential ? '⭐ ' : '• '} <span style="${disabled ? 'text-decoration: line-through;' : ''}">${text}</span>
            ${disabled ? `<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">Not Required ${reason}</span>` : ''}
          </div>`;
  }).join('')}
      </div>

      <div class="detail-section">
        <h4>Deliverables (${deliverables.length})</h4>
        ${deliverables.map(d => {
    let text = d;
    let disabled = false; let reason = '';
    const m5Score = state.scores?.M5 || 3;
    const m6Score = state.scores?.M6 || 3;
    if (text.includes('[Safety]') && m5Score < 3) { disabled = true; reason = '(M5 < 3)'; }
    if (text.includes('[RAM]') && m6Score < 3) { disabled = true; reason = '(M6 < 3)'; }
    return `<div class="deliverable-item" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            📄 <span style="${disabled ? 'text-decoration: line-through;' : ''}">${text}</span>
            ${disabled ? `<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">Not Required ${reason}</span>` : ''}
          </div>`;
  }).join('')}
      </div>

      <div class="detail-section">
        <h4>Outputs & Feeds Into</h4>
        ${outputs.map(o => `<div class="output-item"><strong>${o.name}</strong> → ${o.feedsInto}</div>`).join('')}
      </div>

      <div class="detail-section">
        <h4>Metric Applicability</h4>
        <div class="flex" style="flex-wrap:wrap">
          ${Object.entries(map).map(([mid, role]) => {
    const m = METRICS.find(x => x.id === mid);
    return `<span class="metric-tag ${role}">${role} ${mid}: ${m?.name || mid}</span>`;
  }).join('')}
        </div>
      </div>

      ${p.whenToElevate ? `
      <div class="detail-section">
        <h4>When to Elevate</h4>
        <p class="text-sm text-secondary">${p.whenToElevate}</p>
      </div>` : ''}
    </div>
  `;
}

function renderMiniCard(card, currentLevel) {
  const getLevelBadge = (lvl) => {
    const colors = { Basic: 'var(--level-basic)', Standard: 'var(--level-standard)', Comprehensive: 'var(--level-comprehensive)' };
    return `<span style="background:${colors[lvl] || 'var(--bg-tertiary)'}; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${lvl}</span>`;
  };
  const getTypeBadge = (type) => {
    if (!type) return '';
    const isHC = type === 'HC';
    return `<span style="background:${isHC ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)'}; color:${isHC ? '#ef4444' : '#f59e0b'}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">${type}</span>`;
  };

  const downstreamItems = [];
  if (card.downstream.basic) {
    card.downstream.basic.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Basic')} → ${d.process} <span class="text-secondary">${d.constraint}</span></div>`);
    });
  }
  if (card.downstream.standard) {
    card.downstream.standard.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Standard')} → ${d.process} ${d.level ? getLevelBadge(d.level) : ''} ${getTypeBadge(d.type)} <span class="text-secondary">${d.constraint || ''}</span></div>`);
    });
  }
  if (card.downstream.comprehensive) {
    card.downstream.comprehensive.forEach(d => {
      downstreamItems.push(`<div class="mini-card-item">${getLevelBadge('Comprehensive')} → ${d.process} ${d.level ? getLevelBadge(d.level) : ''} ${getTypeBadge(d.type)} <span class="text-secondary">${d.constraint || ''}</span></div>`);
    });
  }

  return `
    <div class="mini-card" style="background:linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%); border:1px solid rgba(99,102,241,0.15); border-radius:12px; padding:16px; margin-bottom:20px;">
      <div class="flex gap-lg" style="flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <h5 style="color:var(--accent-primary-light); margin-bottom:10px; font-size:13px;">⬆️ Upstream Must Be At Least</h5>
          ${card.upstream.map(u => `
            <div class="mini-card-item" style="padding:4px 0; font-size:12px;">
              ${getLevelBadge(u.level)} ${u.process} ${u.note ? `<span class="text-secondary">(${u.note})</span>` : ''}
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
            <span style="font-size:12px; margin-left:6px;">${card.override}</span>
          </div>
          <div style="flex:1;">
            <span style="font-size:11px; color:var(--text-secondary);">📤 Key Outputs:</span>
            <span style="font-size:12px; margin-left:6px;">${card.outputs.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Listen for level tab changes
document.addEventListener('setLevel', (e) => {
  activeLevel = e.detail;
  const panel = document.getElementById('process-detail');
  if (panel && activeProcess) {
    panel.innerHTML = renderProcessDetail(activeProcess, getState());
  }
});

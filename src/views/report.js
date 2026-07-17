/**
 * Report View — Assessment summary & export
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, FRAMEWORK_META, PROCESS_GROUPS, OVERRIDE_CONDITIONS, PROPAGATION_RULES } from '../data/se-tailoring-data.js';
import { getDriverAttribution, runFullAssessment } from '../utils/assessment-engine.js';
import { generateReport, exportConfig } from '../utils/export-import.js';
import { renderOrdinalMetricProfile } from '../utils/report-visuals.js';
import * as data from '../data/se-tailoring-data.js';
import { getState, setState, showToast, getElementsFlat } from '../state.js';
import { navigateTo, processDetailsHref } from '../router.js';
import { escapeHtml, safeText } from '../utils/safe-text.js';
import { getAssessmentDisposition } from '../utils/assessment-integrity.js';
import { assessRule11Disposition, assessWarningDispositions, GENERAL_WARNING_OUTCOMES, RULE_11_OUTCOMES } from '../utils/rule-dispositions.js';
import { assessCsiResponse, CSI_RESPONSE_ACTIONS } from '../utils/csi-response.js';
import { assessSafetyAllocationDecision } from '../utils/inheritance-engine.js';
import { assessHierarchyDisposition } from '../utils/hierarchy-dispositions.js';
import { createRightSizingApprovalSnapshot, getRightSizingApprovalRequirements, RIGHT_SIZING_APPROVAL_ROLES } from '../utils/right-sizing-governance.js';

let removeReportPrintHandlers = () => {};

function renderRightSizingApprovalForm(proposal, state) {
  const proposalProcessName = CORE_PROCESSES.find(process => process.id === Number(proposal.processId))?.name || `Process ${proposal.processId}`;
  const target = proposal.proposedTo || proposal.to;
  const requirements = getRightSizingApprovalRequirements(proposal, state.assessmentTree);
  const evaluation = (state.rightSizingApprovalEvaluations || []).find(item => Number(item.proposal?.processId) === Number(proposal.processId));
  const assessedRecord = evaluation?.effective || evaluation?.records?.[0];
  const record = assessedRecord?.record || (state.rightSizingApprovalRecords || []).find(item => Number(item.processId) === Number(proposal.processId)) || {};
  const status = assessedRecord?.assessment?.status || 'not-recorded';
  const reasons = assessedRecord?.assessment?.reasons || [];
  const roleFields = requirements.requiredRoles.map(role => `
    <div class="grid-2 mb-sm">
      <label class="text-xs">${escapeHtml(RIGHT_SIZING_APPROVAL_ROLES[role])} — asserted role<input class="input" name="${role}-identity" placeholder="Asserted approver role (not verified)" value="${escapeHtml(record.approvals?.[role]?.identity || '')}"></label>
      <label class="text-xs">Authority basis<input class="input" name="${role}-basis" placeholder="Role charter, delegation, or acceptance authority" value="${escapeHtml(record.approvals?.[role]?.authorityBasis || '')}"></label>
    </div>`).join('');
  return `
    <details class="mt-sm" style="border-top:1px solid rgba(99,102,241,.2);padding-top:8px;">
      <summary class="text-sm"><strong>${escapeHtml(proposalProcessName)}</strong>: ${escapeHtml(proposal.from)} → ${escapeHtml(target)} · approval ${escapeHtml(status)}</summary>
      <form class="right-sizing-approval-form mt-sm" data-process-id="${proposal.processId}">
        <div class="text-xs text-secondary mb-sm">Required asserted roles: ${requirements.requiredRoles.map(role => escapeHtml(RIGHT_SIZING_APPROVAL_ROLES[role])).join(' · ')}. ${requirements.crossElement ? `Boundary: ${escapeHtml(requirements.governingBoundaryElementId || 'unresolved')}.` : ''} The static prototype cannot authenticate identities or verify external approval.</div>
        ${reasons.length ? `<div class="text-xs mb-sm" style="color:var(--accent-warning);">Current record: ${reasons.map(escapeHtml).join(', ')}</div>` : ''}
        <label class="text-xs">Rationale<textarea class="input" name="rationale" rows="2">${escapeHtml(record.rationale || '')}</textarea></label>
        <label class="text-xs">Protected outputs and evidence<textarea class="input" name="protectedOutputs" rows="2">${escapeHtml(record.protectedOutputs || '')}</textarea></label>
        <div class="grid-2">
          <label class="text-xs">Residual risks<textarea class="input" name="residualRisks" rows="2">${escapeHtml(record.residualRisks || '')}</textarea></label>
          <label class="text-xs">Risk acceptance owner<input class="input" name="riskAcceptanceOwner" value="${escapeHtml(record.riskAcceptanceOwner || '')}"></label>
          <label class="text-xs">Compensating controls<textarea class="input" name="compensatingControls" rows="2">${escapeHtml(record.compensatingControls || '')}</textarea></label>
          <label class="text-xs">Rejected alternatives<textarea class="input" name="rejectedAlternatives" rows="2">${escapeHtml(record.rejectedAlternatives || '')}</textarea></label>
          <label class="text-xs">Evidence reference<input class="input" name="evidenceRef" value="${escapeHtml(record.evidenceRef || '')}"></label>
          <label class="text-xs">Valid through / review date<input class="input" type="date" name="reviewDate" value="${escapeHtml(record.reviewDate || '')}"></label>
        </div>
        ${roleFields}
        <button class="btn btn-primary btn-sm" type="submit">Record asserted approval and re-evaluate</button>
      </form>
    </details>`;
}
import { assessCorrelatedEvidence } from '../utils/correlated-evidence.js';

function findDirectReportCard(container, titleText) {
  return [...container.querySelectorAll(':scope > .card.mb-xl')]
    .find(section => section.querySelector('h4')?.textContent?.includes(titleText));
}

function makeReportSectionCollapsible(container, section, title, description, open = true) {
  if (!section) return;

  const details = document.createElement('details');
  details.className = 'report-section';
  if (open) details.open = true;

  const summary = document.createElement('summary');
  summary.innerHTML = `
    <span class="report-section-labels">
      <span class="report-section-title">${title}</span>
      <span class="report-section-description">${description}</span>
    </span>
  `;

  const body = document.createElement('div');
  body.className = 'report-section-body';

  section.replaceWith(details);
  details.append(summary, body);
  body.appendChild(section);
}

function enhanceReportSections(container) {
  const summaryPanel = container.querySelector('.report-summary-panel');
  if (!summaryPanel) return;

  summaryPanel.insertAdjacentHTML('afterend', `
    <div class="report-section-toolbar" aria-label="Report section controls">
      <span>Report sections</span>
      <button class="btn btn-secondary btn-sm" id="btn-expand-report-sections">Expand all</button>
      <button class="btn btn-secondary btn-sm" id="btn-collapse-report-sections">Collapse all</button>
    </div>
  `);

  const sectionConfigs = [
    {
      section: container.querySelector(':scope > .grid-2.mb-xl'),
      title: 'Project and Level Distribution',
      description: 'Project metadata and final profile count.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'System Element Tailoring Overview'),
      title: 'System Element Tailoring Overview',
      description: 'Hierarchy and element-level assessment status.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Right-Sizing Analysis'),
      title: 'Right-Sizing Analysis',
      description: 'PSI, CSI, CRI, and non-binding right-sizing proposals.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Safety Assurance Criticality'),
      title: 'Safety Assurance Criticality',
      description: 'Safety tier and rigor floor.',
      open: true
    },
    {
      section: container.querySelector(':scope > .report-overview-panel'),
      title: 'Grouped Ordinal Profile',
      description: 'Independent anchor positions and judgment states by dimension.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Floor Elevations'),
      title: 'Floor Elevations',
      description: 'Triggered floors that actually raised a process level.',
      open: false
    },
    {
      section: findDirectReportCard(container, 'Active Mandatory Floors'),
      title: 'Active Mandatory Floors',
      description: 'Triggered floors, including those already satisfied by derivation.',
      open: false
    },
    {
      section: findDirectReportCard(container, 'Correlated Evidence Review'),
      title: 'Correlated Evidence Review',
      description: 'Warning-only review of shared M5, M6, and M8 evidence.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Consistency Warnings'),
      title: 'Consistency Warnings',
      description: 'Rules that need review or follow-up.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Rule 11 Disposition'),
      title: 'Rule 11 Disposition',
      description: 'Recorded outcome, rationale, authority, evidence, and review date.',
      open: true
    },
    {
      section: findDirectReportCard(container, 'Full Process Tailoring Profile'),
      title: 'Full Process Tailoring Profile',
      description: 'One process view with derived, manual, governed, final, evidence, and driver context.',
      open: false
    },
    {
      section: findDirectReportCard(container, 'Override Chain Documentation'),
      title: 'Override Chain Documentation',
      description: 'Traceability from thresholds to process floors.',
      open: false
    },
    {
      section: findDirectReportCard(container, 'Propagation Chain Documentation'),
      title: 'Propagation Chain Documentation',
      description: 'Consistency rule enforcement and dependency resolution.',
      open: false
    },
    {
      section: findDirectReportCard(container, 'Metric Scores Detail'),
      title: 'Metric Scores Detail',
      description: 'All metric scores with dimension and anchor text.',
      open: false
    }
  ];

  sectionConfigs.forEach(config => {
    makeReportSectionCollapsible(container, config.section, config.title, config.description, config.open);
  });

  container.querySelector('#btn-expand-report-sections')?.addEventListener('click', () => {
    container.querySelectorAll('.report-section').forEach(section => { section.open = true; });
  });

  container.querySelector('#btn-collapse-report-sections')?.addEventListener('click', () => {
    container.querySelectorAll('.report-section').forEach(section => { section.open = false; });
  });

  // Chromium's print engine does not reliably honor CSS that attempts to expose
  // descendants of a closed <details> element. Expand every report section for
  // printing, then restore the assessor's on-screen disclosure state.
  removeReportPrintHandlers();
  let prePrintOpenState = [];
  const beforePrint = () => {
    const sections = [...container.querySelectorAll('.report-section')];
    prePrintOpenState = sections.map(section => section.open);
    sections.forEach(section => { section.open = true; });
  };
  const afterPrint = () => {
    const sections = [...container.querySelectorAll('.report-section')];
    sections.forEach((section, index) => {
      section.open = prePrintOpenState[index] ?? section.open;
    });
    prePrintOpenState = [];
  };
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);
  removeReportPrintHandlers = () => {
    window.removeEventListener('beforeprint', beforePrint);
    window.removeEventListener('afterprint', afterPrint);
  };
}

export function renderReport(container) {
  removeReportPrintHandlers();
  const state = getState();
  const integrity = getAssessmentDisposition(state);
  if (!integrity.complete) {
    container.innerHTML = `<div class="card text-center" style="padding:80px 40px"><h3>Assessment Work in Progress</h3><p class="text-secondary mt-md">${integrity.completeCount}/${METRICS.length} metric judgments are confirmed. Preview values are not a completed pilot record and cannot generate a report.</p>${integrity.incompleteMetricIds.length ? `<p class="text-xs text-secondary mt-sm">Remaining: ${escapeHtml(integrity.incompleteMetricIds.join(', '))}</p>` : ''}<p class="text-xs text-secondary mt-sm">Pilot record — not an authoritative organizational baseline.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Continue Assessment</button></div>`;
    container.querySelector('#btn-go-assess')?.addEventListener('click', () => navigateTo('assessment'));
    return;
  }

  const elements = getElementsFlat();
  const tree = state.assessmentTree;
  const scores = state.scores || {};
  const levels = state.levels || {};
  const derivedLevels = state.derived || {};
  const derivationDetails = state.derivationDetails || {};
  const confidence = state.confidence || {};
  const projectName = escapeHtml(safeText(state.projectInfo.name, 'Project'));
  const projectDate = escapeHtml(safeText(state.projectInfo.date, new Date().toLocaleDateString()));
  const projectTeam = escapeHtml(safeText(state.projectInfo.team, '—'));
  const projectPhase = escapeHtml(safeText(state.projectInfo.phase, 'N/A'));

  const basicCount = Object.values(levels).filter(l => l === 'basic').length;
  const stdCount = Object.values(levels).filter(l => l === 'standard').length;
  const compCount = Object.values(levels).filter(l => l === 'comprehensive').length;

  const ordinalOverview = renderOrdinalMetricProfile(scores, state.metricAssessments, METRICS, DIMENSIONS);
  const overrideCount = state.overrides?.length || 0;
  const warningCount = state.violations?.length || 0;
  const fixCount = state.fixes?.length || 0;
  const adoptionRiskCount = state.adoptionRisks?.length || 0;
  const rule11Disposition = assessRule11Disposition(state.violations, state.ruleDispositions, state.levels);
  const warningDispositions = assessWarningDispositions(state.violations, state.ruleDispositions, state.levels);
  const rule11Record = state.ruleDispositions?.['11'] || state.ruleDispositions?.[11];
  const rule11Adjustment = state.manualAdjustments?.[27] || state.manualAdjustments?.['27'];
  const rule11OutcomeLabel = RULE_11_OUTCOMES.find(option => option.id === rule11Record?.outcome)?.label || rule11Record?.outcome || '—';
  const generalWarningAssessments = warningDispositions.assessments.filter(assessment => assessment.ruleId !== '11');
  const csiReadiness = assessCsiResponse(scores, state.csiResponse);
  const csiRecord = csiReadiness.response;
  const csiActionLabels = new Map(CSI_RESPONSE_ACTIONS.map(action => [action.id, action.label]));
  const justificationCount = Object.values(confidence).filter(value => value === 'available-with-justification').length;
  const metricNotesCount = METRICS.filter(metric => String(state.metricAssessments?.[metric.id]?.rationale || '').trim()).length;
  const floorAppliedCount = Object.values(confidence).filter(value => value === 'floor-applied').length;
  const highPressureMetrics = METRICS
    .filter(metric => (scores[metric.id] ?? 3) >= 4)
    .map(metric => metric.id);
  const correlatedEvidence = assessCorrelatedEvidence(state.metricAssessments);
  const gateLabel = status => ({
    passed: 'Passed',
    incomplete: 'Incomplete',
    'not-implemented': 'Not implemented',
    'not-recorded': 'Not recorded',
    'not-available': 'Not available'
  }[status] || status);

  const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;
  const processRefName = (ref) => {
    if (ref === 'any_technical') return 'Any Technical Process';
    if (ref === 'all_technical') return 'All Technical Processes';
    if (Array.isArray(ref)) return ref.map(processName).join(', ');
    return processName(ref);
  };

  container.innerHTML = `
    <div class="flex justify-between items-center mb-lg">
      <div>
        <h2>Pilot Tailoring Record</h2>
        <p class="text-secondary text-sm mt-sm">${projectName} · ${projectDate}</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-json">Minimum-data JSON</button>
        <button class="btn btn-primary btn-sm" id="btn-export-html" title="Software completeness only; removes direct display labels but retains free text and evidence references">Download pilot HTML record</button>
      </div>
    </div>

    <div class="pilot-record-banner mb-xl" role="note">
      <strong>Pilot record — not an authoritative organizational baseline</strong>
      <span>Software completeness checks passed. External approval not verified.</span>
    </div>

    <h3 class="report-layer-heading">1. Decision summary</h3>
    <div class="card mb-xl report-summary-panel">
      <div>
        <h4 class="mb-md">Executive Summary</h4>
        <p class="text-secondary text-sm">Top-level report state before reviewing detailed process evidence.</p>
      </div>
      <div class="report-summary-grid">
        <div class="report-summary-item">
          <span class="summary-value">Passed</span>
          <span class="summary-label">Software completeness checks</span>
        </div>
        <div class="report-summary-item">
          <span class="summary-value">${overrideCount}</span>
          <span class="summary-label">Override floors</span>
        </div>
        <div class="report-summary-item">
          <span class="summary-value">${warningCount}</span>
          <span class="summary-label">Warnings</span>
        </div>
        <div class="report-summary-item">
          <span class="summary-value">${justificationCount}</span>
          <span class="summary-label">Justifications needed</span>
        </div>
        <div class="report-summary-item">
          <span class="summary-value">${floorAppliedCount}</span>
          <span class="summary-label">Rule floors</span>
        </div>
        <div class="report-summary-item">
          <span class="summary-value">${adoptionRiskCount}</span>
          <span class="summary-label">Adoption gaps</span>
        </div>
      </div>
      <div class="report-summary-notes">
        <span><strong>Final profile:</strong> ${basicCount} Basic · ${stdCount} Standard · ${compCount} Comprehensive.</span>
        <span><strong>High-pressure metrics:</strong> ${highPressureMetrics.length ? highPressureMetrics.join(', ') : 'None at 4 or 5'}.</span>
        <span><strong>Metric notes:</strong> ${metricNotesCount} of ${METRICS.length} recorded.</span>
        <span><strong>Consistency fixes:</strong> ${fixCount} automatic propagation adjustment${fixCount === 1 ? '' : 's'}.</span>
      </div>
      <div class="report-scope-note">
        <strong>Scope and evidence maturity:</strong> This executable assessment covers ${CORE_PROCESSES.length} project-facing Technical and Technical Management processes. Agreement and Organizational Project-Enabling processes are reference scope unless explicitly reviewed. Current evidence supports structured decision aid use; empirical project-outcome effectiveness is not yet demonstrated.
      </div>
      <div class="report-gate-grid" aria-label="Record gate statuses">
        ${integrity.gates.map(gate => `<div class="report-gate ${escapeHtml(gate.status)}"><span>${escapeHtml(gate.label)}</span><strong>${escapeHtml(gateLabel(gate.status))}</strong><small>${escapeHtml(gate.detail)}</small></div>`).join('')}
      </div>
    </div>

    <div class="grid-2 mb-xl">
      <div class="card">
        <h4 class="mb-md">Project Details</h4>
        <table class="data-table">
          <tr><td class="text-secondary">Name</td><td>${projectName}</td></tr>
          <tr><td class="text-secondary">Date</td><td>${projectDate}</td></tr>
          <tr><td class="text-secondary">Team</td><td>${projectTeam}</td></tr>
          <tr><td class="text-secondary">Phase</td><td>${projectPhase}</td></tr>
        </table>
      </div>
      <div class="card">
        <h4 class="mb-md">Level Distribution</h4>
        <div class="level-bar-chart">
          <div class="level-bar">
            <div class="level-bar-fill basic-bar" style="width: ${basicCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${basicCount} Basic</span>
          </div>
          <div class="level-bar">
            <div class="level-bar-fill standard-bar" style="width: ${stdCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${stdCount} Standard</span>
          </div>
          <div class="level-bar">
            <div class="level-bar-fill comp-bar" style="width: ${compCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${compCount} Comprehensive</span>
          </div>
        </div>
      </div>
    </div>

    ${elements.length > 1 ? `
    <div class="card mb-xl">
      <h4 class="mb-md">System Element Tailoring Overview</h4>
      <p class="text-xs text-secondary mb-md">Hierarchical breakdown of system elements and their targeted tailoring assessments.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Assessment Type</th>
              <th>Status</th>
              <th>Safety allocation</th>
              <th>M8 child disposition</th>
              <th>M15 child disposition</th>
              <th>Process Levels (B / S / C)</th>
            </tr>
          </thead>
          <tbody>
            ${elements.map(e => {
              const bCount = Object.values(e.levels || {}).filter(l => l === 'basic').length;
              const sCount = Object.values(e.levels || {}).filter(l => l === 'standard').length;
              const cCount = Object.values(e.levels || {}).filter(l => l === 'comprehensive').length;
              const hasResult = e.assessmentResult != null;
              const indent = e.depth * 20;
              const elementName = escapeHtml(e.name);
              const assessmentType = ['full', 'quick', 'inherited'].includes(e.assessmentType) ? e.assessmentType : 'full';
              const status = ['draft', 'under_review', 'approved', 'baselined'].includes(e.status) ? e.status : 'draft';
              const safetyAllocation = e.parentId
                ? assessSafetyAllocationDecision(e.safetyAllocationDecision ?? (e.hasIndependentSafetyAnalysis === true ? true : null))
                : null;
              const securityDisposition = e.parentId
                ? assessHierarchyDisposition('M8', e.securityHierarchyDisposition ?? (e.hasIndependentSecurityAnalysis === true ? true : null))
                : null;
              const assuranceDisposition = e.parentId
                ? assessHierarchyDisposition('M15', e.assuranceHierarchyDisposition ?? (e.hasScopedAssuranceDecision === true ? true : null))
                : null;
              const hierarchyStatus = assessment => !assessment
                ? '—'
                : assessment.valid
                  ? 'Confirmed decision; evidence not verified'
                  : assessment.legacyMigrationInput ? 'Legacy unconfirmed' : 'Incomplete';
              
              const levelsBadgeHtml = hasResult 
                ? '<div class="se-level-counts text-xs" style="display: flex; gap: 4px;">' +
                  '<span class="level-badge basic" title="Basic Processes" style="padding: 2px 6px;">' + bCount + ' B</span>' +
                  '<span class="level-badge standard" title="Standard Processes" style="padding: 2px 6px;">' + sCount + ' S</span>' +
                  '<span class="level-badge comprehensive" title="Comprehensive Processes" style="padding: 2px 6px;">' + cCount + ' C</span>' +
                  '</div>' 
                : '<span class="text-tertiary text-xs">Not assessed</span>';

              return `
                <tr>
                  <td style="padding-left: ${indent + 12}px">
                    <strong style="${e.id === tree.rootId ? 'color: var(--accent-primary-light);' : ''}">${elementName}</strong>
                  </td>
                  <td><span class="se-type-badge ${assessmentType}">${assessmentType}</span></td>
                  <td><span class="se-status-badge ${status}">${status}</span></td>
                  <td>${!safetyAllocation ? '—' : safetyAllocation.valid ? 'Confirmed parent-retained' : safetyAllocation.legacyMigrationInput ? 'Legacy unconfirmed' : 'Incomplete'}</td>
                  <td>${hierarchyStatus(securityDisposition)}</td>
                  <td>${hierarchyStatus(assuranceDisposition)}</td>
                  <td>${levelsBadgeHtml}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <h3 class="report-layer-heading">2. Action record</h3>
    ${csiReadiness.required ? `
    <div class="card mb-xl" style="border-left:3px solid ${csiReadiness.complete ? 'var(--accent-success)' : 'var(--accent-warning)'};">
      <h4 class="mb-md">CSI ${csiReadiness.csi} Constraint Response — ${csiReadiness.complete ? 'Complete' : 'Incomplete'}</h4>
      <p class="text-xs text-secondary mb-md">${csiReadiness.expectedResponseType === 'sponsor-escalation' ? 'Sponsor escalation' : 'Feasibility review'} record. It does not change the process profile or approve right-sizing proposals.</p>
      <table class="data-table"><tbody>
        <tr><th>Actions</th><td>${escapeHtml((csiRecord.selectedActions || []).map(action => csiActionLabels.get(action) || action).join(', ') || '—')}</td></tr>
        <tr><th>Protected outputs/evidence</th><td>${escapeHtml(csiRecord.protectedOutputs || '—')}</td></tr>
        <tr><th>Rationale/decision</th><td>${escapeHtml(csiRecord.rationaleDecision || '—')}</td></tr>
        <tr><th>Asserted owner/approver role</th><td>${escapeHtml(csiRecord.ownerApprover || '—')}</td></tr>
        <tr><th>Evidence reference</th><td>${escapeHtml(csiRecord.evidenceRef || '—')}</td></tr>
        <tr><th>Review date</th><td>${escapeHtml(csiRecord.reviewDate || '—')}</td></tr>
      </tbody></table>
    </div>` : ''}

    <div class="card mb-xl" style="border-left: 3px solid ${state.rightSizingProposals?.length > 0 ? '#6366f1' : '#34d399'};">
      <h4 class="mb-md">Right-Sizing Analysis</h4>
      <div class="grid-3 mb-md">
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #6366f1;">${state.indices?.psi || '—'}</div>
          <div class="text-xs text-secondary">PSI (Project Scale)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.psi || 3) <= 2 ? 'Small' : (state.indices?.psi || 3) <= 3 ? 'Medium' : 'Large/Mega'}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #f59e0b;">${state.indices?.csi || '—'}</div>
          <div class="text-xs text-secondary">CSI (Constraint Stress)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.csi || 3) >= 4 ? 'High Pressure' : (state.indices?.csi || 3) >= 3 ? 'Moderate' : 'Low'}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #22d3ee;">${state.indices?.cri || '—'}</div>
          <div class="text-xs text-secondary">CRI (Adoption Readiness)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.cri || 2) <= 1 ? 'Constrained conditions' : (state.indices?.cri || 2) <= 2 ? 'Mixed conditions' : 'Strong conditions'}</div>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Level Distribution:</strong> ${basicCount} Basic · ${stdCount} Standard · ${compCount} Comprehensive (${Math.round(compCount / CORE_PROCESSES.length * 100)}% Comprehensive)
      </div>
      ${state.rightSizingProposals?.length > 0 ? `
      <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #6366f1; font-size: 13px; margin-bottom: 6px;">${state.rightSizingProposals.length} Right-Sizing Proposal${state.rightSizingProposals.length === 1 ? '' : 's'} — Not Applied</div>
        <div class="text-xs text-secondary mb-sm">The final profile remains normative. Each reduction requires an explicit accept/reject decision, rationale, approver, and residual-risk record.</div>
        ${state.rightSizingProposals.map(a => `<div class="text-sm mb-sm">• <strong>${escapeHtml(processName(a.processId))}</strong>: ${escapeHtml(a.from)} → proposed ${escapeHtml(a.proposedTo || a.to)} <span class="text-xs text-secondary">(${escapeHtml(a.reason)})</span></div>${renderRightSizingApprovalForm(a, state)}`).join('')}
      </div>` : ''}
      ${state.effectiveRightSizingApprovalCount > 0 ? `<div style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.3);border-radius:8px;padding:12px;margin-top:8px;"><strong>${state.effectiveRightSizingApprovalCount} effective governed reduction approval(s)</strong><div class="text-xs text-secondary mt-sm">The displayed final profile includes these snapshot-bound decisions after mandatory closure was re-applied.</div></div>` : ''}
      ${state.rightSizingActions?.length > 0 ? `<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.3);border-radius:8px;padding:12px;margin-top:8px;"><div style="font-weight:700;font-size:13px;">Historical right-sizing actions (${state.rightSizingActions.length})</div><div class="text-xs text-secondary mt-sm">Preserved from a legacy import for audit only; not treated as approved v4 reductions.</div></div>` : ''}
      ${state.blockedRightSizingCandidates?.length > 0 ? `<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:12px;margin-top:8px;"><div style="font-weight:700;font-size:13px;">Blocked reduction candidates (${state.blockedRightSizingCandidates.length})</div><div class="text-xs text-secondary mt-sm">Mandatory closure would restore these candidate levels, so they are not offered for approval.</div></div>` : ''}
      ${state.budgetStatus && !state.budgetStatus.withinBudget ? `
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #f59e0b; font-size: 13px;">Final Rigor-Budget Exception</div>
        <div class="text-sm mt-sm">The final protected profile exceeds the configured PSI guidance by ${state.budgetStatus.comprehensiveExcess} Comprehensive and ${state.budgetStatus.standardExcess} Standard process(es). This exception requires governance review; it is not a failed safety or mandatory-rule closure.</div>
      </div>` : !state.rightSizingProposals?.length ? `
      <div class="text-sm" style="color: #34d399;">✓ Final profile is within configured rigor-budget guidance; no reduction proposal is needed.</div>` : ''}
      ${state.adoptionRisks?.length > 0 ? `
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #f59e0b; font-size: 13px; margin-bottom: 6px;">${state.adoptionRisks.length} Adoption Readiness Gap${state.adoptionRisks.length === 1 ? '' : 's'}</div>
        <div class="text-xs text-secondary mb-sm">Required rigor is preserved. These gaps identify support needed to execute the selected profile.</div>
        ${state.adoptionRisks.slice(0, 10).map(r => `<div class="text-sm mb-sm">• <strong>${escapeHtml(processName(r.processId))}</strong>: ${escapeHtml(r.level)} <span class="text-xs text-secondary">(${escapeHtml(r.guidance || r.reason)})</span></div>`).join('')}
        ${state.adoptionRisks.length > 10 ? `<div class="text-xs text-secondary">+ ${state.adoptionRisks.length - 10} more readiness gaps.</div>` : ''}
      </div>` : ''}
    </div>

    ${state.saTier ? `
    <div class="card mb-xl" style="border-left: 3px solid #ef4444; background: rgba(239,68,68,0.04);">
      <h4 class="mb-md">Safety Assurance Criticality</h4>
      <div class="flex items-center gap-lg">
        <div class="sa-tier-badge tier-${state.saTier.tier}" style="font-size: 24px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">
          ${state.saTier.tier}
        </div>
        <div>
          <div class="font-bold">${escapeHtml(state.saTier.name)}</div>
          <div class="text-sm text-secondary">${escapeHtml(state.saTier.description)}</div>
          <div class="text-sm mt-sm"><strong>Minimum Rigor Floor:</strong> ${escapeHtml(state.saTier.floor || 'None')}</div>
        </div>
      </div>
    </div>` : ''}

    ${state.overrides.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-warning)">
      <h4 class="mb-md">Floor Elevations (${state.overrides.length})</h4>
      ${state.overrides.map(o => `<div class="text-sm mb-sm"><strong>${escapeHtml(processName(o.processId))}</strong>: ${escapeHtml(o.from)} → ${escapeHtml(o.to)} — ${escapeHtml(o.reason)}${o.condition ? ` (${escapeHtml(o.condition)})` : ''}</div>`).join('')}
    </div>` : ''}

    ${state.activeFloors?.length > 0 ? `
    <div class="card mb-xl" style="border-left:3px solid var(--accent-info)">
      <h4 class="mb-md">Active Mandatory Floors (${state.activeFloors.length})</h4>
      <p class="text-xs text-secondary mb-md">Every triggered floor is retained for provenance. A floor may already be satisfied and therefore produce no elevation event.</p>
      ${state.activeFloors.map(floor => {
        const elevation = state.overrides.find(override => override.processId === floor.processId && (override.overrideId === floor.overrideId || override.reason === floor.reason || override.reason === floor.label));
        return `<div class="text-sm mb-sm"><strong>${escapeHtml(processName(floor.processId))}</strong>: minimum ${escapeHtml(floor.minLevel || floor.requiredLevel || floor.to || 'active')} — <span style="color:${elevation ? 'var(--accent-warning)' : 'var(--accent-success)'}">${elevation ? 'elevated' : 'already satisfied'}</span> <span class="text-xs text-secondary">(${escapeHtml(floor.label || floor.reason || floor.condition || floor.overrideId || 'mandatory floor')})</span></div>`;
      }).join('')}
    </div>` : ''}

    ${state.violations.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-error)">
      <h4 class="mb-md">Consistency Warnings (${state.violations.length})</h4>
      ${state.violations.map(v => `<div class="text-sm mb-sm"><strong>[${escapeHtml(v.type)}] Rule ${escapeHtml(v.ruleId)}</strong>: ${escapeHtml(v.label)}</div>`).join('')}
    </div>` : ''}

    ${correlatedEvidence.warningCount ? `
    <div class="card mb-xl" style="border-left:3px solid var(--accent-warning)">
      <h4 class="mb-md">Correlated Evidence Review (${correlatedEvidence.warningCount})</h4>
      <p class="text-xs text-secondary mb-md">Shared evidence is permitted, but it is not independent corroboration unless each metric has a distinct documented consequence analysis. This warning does not change scores, recommended levels, or closure.</p>
      ${correlatedEvidence.warnings.map(warning => `<div class="text-sm mb-sm"><strong>${escapeHtml(warning.metricIds.join(', '))}</strong>: ${escapeHtml(warning.message)}</div>`).join('')}
    </div>` : ''}

    ${rule11Disposition.required ? `
    <div class="card mb-xl" style="border-left:3px solid ${rule11Disposition.complete ? 'var(--accent-success)' : 'var(--accent-warning)'}">
      <h4 class="mb-md">Rule 11 Disposition — ${rule11Disposition.complete ? 'Complete' : 'Incomplete'}</h4>
      <p class="text-xs text-secondary mb-md">Rule 11 remains a warning and P12 remains recommended; this record does not suppress the warning or create automatic closure.</p>
      <table class="data-table"><tbody>
        <tr><th>Outcome</th><td>${escapeHtml(rule11OutcomeLabel)}</td></tr>
        <tr><th>Rationale / controls</th><td>${escapeHtml(rule11Record?.rationale || '—')}</td></tr>
        <tr><th>Asserted owner / approver role</th><td>${escapeHtml(rule11Record?.ownerApprover || '—')}</td></tr>
        <tr><th>Evidence</th><td>${escapeHtml(rule11Record?.evidenceRef || '—')}</td></tr>
        <tr><th>Review date</th><td>${escapeHtml(rule11Record?.reviewDate || '—')}</td></tr>
        <tr><th>Final Validation level</th><td>${escapeHtml(levels[27] || '—')}</td></tr>
        <tr><th>Adjustment provenance</th><td>${rule11Adjustment?.source === 'rule-disposition'
          ? `${escapeHtml(rule11Adjustment.source)} · Rule ${escapeHtml(rule11Adjustment.ruleId)} / ${escapeHtml(rule11Adjustment.propagationId)}`
          : '—'}</td></tr>
      </tbody></table>
    </div>` : ''}

    ${generalWarningAssessments.length ? `
    <div class="card mb-xl" style="border-left:3px solid ${generalWarningAssessments.every(item => item.complete) ? 'var(--accent-success)' : 'var(--accent-warning)'}">
      <h4 class="mb-md">Governed Warning Dispositions — ${generalWarningAssessments.every(item => item.complete) ? 'Complete' : 'Incomplete'}</h4>
      <p class="text-xs text-secondary mb-md">Each triggered, unsatisfied warning is consciously dispositioned before software completeness can pass. The records do not suppress warnings or change process levels.</p>
      ${generalWarningAssessments.map(assessment => {
        const record = assessment.record || {};
        const outcome = GENERAL_WARNING_OUTCOMES.find(option => option.id === record.outcome)?.label || record.outcome || '—';
        return `<details class="mb-sm"><summary class="text-sm"><strong>Rule ${escapeHtml(assessment.ruleId)}</strong> — ${assessment.complete ? 'complete' : `missing ${escapeHtml(assessment.missingFields.join(', '))}`}</summary>
          <table class="data-table mt-sm"><tbody>
            <tr><th>Outcome</th><td>${escapeHtml(outcome)}</td></tr>
            <tr><th>Rationale / controls</th><td>${escapeHtml(record.rationale || '—')}</td></tr>
            <tr><th>Asserted owner / approver role</th><td>${escapeHtml(record.ownerApprover || '—')}</td></tr>
            <tr><th>Evidence</th><td>${escapeHtml(record.evidenceRef || '—')}</td></tr>
            <tr><th>Review date</th><td>${escapeHtml(record.reviewDate || '—')}</td></tr>
          </tbody></table></details>`;
      }).join('')}
    </div>` : ''}

    <h3 class="report-layer-heading">3. Trace appendix</h3>
    <div class="card mb-xl report-overview-panel">
      ${ordinalOverview}
    </div>

    <div class="card mb-xl">
      <h4 class="mb-md">Full Process Tailoring Profile</h4>
      <p class="text-xs text-secondary mb-md">One process-level view: derived level, governed changes, final assignment, evidence status, and top drivers.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Process</th>
              <th>Group</th>
              <th>Derived</th>
              <th>Manual adjustment</th>
              <th>Override</th>
              <th>Fix</th>
              <th>Final</th>
              <th>Evidence Status</th>
              <th>Top drivers</th>
            </tr>
          </thead>
          <tbody>
            ${CORE_PROCESSES.map(p => {
    const derived = derivedLevels[p.id] || 'basic';
    const final_ = levels[p.id] || 'basic';
    const manualAdjustment = state.manualAdjustments?.[p.id]
      || state.manualAdjustments?.[String(p.id)]
      || tree?.nodes?.[tree.rootId]?.manualAdjustments?.[p.id]
      || tree?.nodes?.[tree.rootId]?.manualAdjustments?.[String(p.id)];
    const override = state.overrides?.find(o => o.processId === p.id);
    const fix = state.fixes?.find(f => f.processId === p.id);
    const groupInfo = PROCESS_GROUPS[p.group.toUpperCase()];
    const conf = confidence[p.id] || 'high';
    const detail = derivationDetails[p.id] || {};
    const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
      ? detail.triggerMetrics.join(', ')
      : '—';
    const drivers = getDriverAttribution(p.id, scores, state.matrixMap, {
      ...state.projectInfo,
      metricAssessments: state.metricAssessments || {},
      assuranceObligations: state.assuranceObligations || []
    });
    const confBadge = conf === 'corroborated'
      ? '<span class="confidence-badge-inline corroborated" title="Corroborated by multiple metrics">Corroborated</span>'
      : conf === 'available-with-justification'
        ? '<span class="confidence-badge-inline available-with-justification" title="Comprehensive available with documented justification">Needs note</span>'
        : conf === 'floor-applied'
          ? '<span class="confidence-badge-inline floor-applied" title="Comprehensive level set by safety, regulatory, or consistency floor">Floor</span>'
          : '<span class="confidence-badge-inline high" title="Supported by drivers/rules">Supported</span>';
    const justificationFlag = conf === 'available-with-justification'
      ? ' <span class="justification-flag" title="Justification required for Comprehensive level">Justification required</span>'
      : '';
    const manualHtml = manualAdjustment
      ? `<span class="manual-adjustment-cell"><strong>${escapeHtml(manualAdjustment.level || final_)}</strong><span class="text-xs text-secondary">${escapeHtml(manualAdjustment.justification || 'No justification recorded')}</span></span>`
      : '<span class="text-tertiary">—</span>';
    return `<tr>
                <td><span class="process-id">${p.id}</span></td>
                <td><a href="${escapeHtml(processDetailsHref(p.id, final_, 'report'))}" aria-label="View ${escapeHtml(FRAMEWORK_META.levelLabels[final_] || final_)} details for ${escapeHtml(p.name)}" style="color:var(--accent-primary-light);text-decoration:underline;text-underline-offset:2px;">${escapeHtml(p.name)}</a>${justificationFlag}</td>
                <td style="color:${groupInfo?.color || 'inherit'}">${groupInfo?.name || p.group}</td>
                <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                <td>${manualHtml}</td>
                <td>${override ? `<span style="color:var(--accent-warning); font-size:11px;">${override.from}→${override.to}</span>` : '<span class="text-tertiary">—</span>'}</td>
                <td>${fix ? `<span style="color:var(--accent-success); font-size:11px;">${fix.from}→${fix.to}</span>` : '<span class="text-tertiary">—</span>'}</td>
                <td><span class="level-badge ${final_}" style="font-weight:700;">${final_[0].toUpperCase()}</span></td>
                <td>${confBadge}</td>
                <td class="text-xs text-secondary">${escapeHtml(triggerMetrics)}${detail.triggerScore ? ` (${detail.triggerScore})` : ''}<br>${escapeHtml(drivers.slice(0, 3).map(d => `${d.metric}=${d.value} (${d.role})`).join(', ') || '—')}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${state.overrides.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-warning)">
      <h4 class="mb-md">Override Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Traceability from metric thresholds to process level floors.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Override Condition</th>
              <th>Trigger</th>
              <th>Affected Process</th>
              <th>Change</th>
              <th>Source Standard</th>
            </tr>
          </thead>
          <tbody>
            ${state.overrides.map(o => {
    const overrideDef = OVERRIDE_CONDITIONS.find(oc => oc.id === o.overrideId || oc.label === o.reason);
    const triggerText = o.condition || overrideDef?.condition || '—';
    return `<tr>
                <td><strong>${escapeHtml(o.reason)}</strong></td>
                <td><code style="font-size:11px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${escapeHtml(triggerText)}</code></td>
                <td>${escapeHtml(processName(o.processId))}</td>
                <td><span class="level-badge ${o.from}" style="opacity:0.6;">${escapeHtml(o.from?.[0]?.toUpperCase() || '')}</span> → <span class="level-badge ${o.to}">${escapeHtml(o.to?.[0]?.toUpperCase() || '')}</span></td>
                <td class="text-xs text-secondary">${escapeHtml(overrideDef?.source || '—')}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    ${(state.fixes?.length > 0 || state.violations?.length > 0) ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-info)">
      <h4 class="mb-md">Propagation Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Consistency rule enforcement showing how process dependencies were resolved.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Type</th>
              <th>Trigger Process</th>
              <th>Required Process</th>
              <th>Action</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${state.fixes?.map(f => {
    const rule = data.CONSISTENCY_RULES?.find(r => r.label?.includes(f.reason) || r.id === f.ruleId);
    return `<tr style="background: rgba(52,211,153,0.05);">
                <td><strong>Rule ${rule?.id || '—'}</strong></td>
                <td><span style="background: rgba(239,68,68,0.15); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">HC</span></td>
                <td>${escapeHtml(rule?.trigger?.process ? processRefName(rule.trigger.process) : '—')}</td>
                <td>${escapeHtml(processName(f.processId))}</td>
                <td><span class="level-badge ${f.from}" style="opacity:0.6;">${escapeHtml(f.from?.[0]?.toUpperCase() || '')}</span> → <span class="level-badge ${f.to}">${escapeHtml(f.to?.[0]?.toUpperCase() || '')}</span></td>
                <td class="text-xs text-secondary">${escapeHtml(rule?.rationale?.substring(0, 80) || '—')}...</td>
              </tr>`;
  }).join('') || ''}
            ${state.violations?.filter(v => v.type === 'WN').map(v => {
    const rule = data.CONSISTENCY_RULES?.find(r => r.id === v.ruleId);
    return `<tr style="background: rgba(251,191,36,0.05);">
                <td><strong>Rule ${v.ruleId}</strong></td>
                <td><span style="background: rgba(251,191,36,0.15); color:#f59e0b; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">WN</span></td>
                <td>${escapeHtml(rule?.trigger?.process ? processRefName(rule.trigger.process) : '—')}</td>
                <td>${escapeHtml(processName(v.affectedProcess))}</td>
                <td><span style="color:var(--accent-warning); font-size:11px;">Review recommended</span></td>
                <td class="text-xs text-secondary">${escapeHtml(v.rationale?.substring(0, 80) || v.label)}...</td>
              </tr>`;
  }).join('') || ''}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="card mb-xl">
      <h4 class="mb-md">Metric Scores Detail</h4>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Dimension</th><th>Score</th><th>Description</th><th>Justification note</th></tr></thead>
          <tbody>
            ${METRICS.map(m => {
    const s = scores[m.id] || '—';
    const dim = DIMENSIONS.find(d => d.id === m.dimension);
    const rationale = state.metricAssessments?.[m.id]?.rationale || '';
    return `<tr>
                <td><strong>${m.id}</strong> ${m.name}</td>
                <td style="color:${dim.color}">${dim.name}</td>
                <td><strong>${s}</strong></td>
                <td class="text-xs text-secondary">${m.anchors[s] || ''}</td>
                <td class="text-xs text-secondary metric-note-cell">${escapeHtml(rationale || '—')}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .level-bar-chart { display: flex; flex-direction: column; gap: 10px; }
    .level-bar { position: relative; height: 28px; background: var(--bg-tertiary); border-radius: 6px; overflow: hidden; display: flex; align-items: center; }
    .level-bar span { position: relative; z-index: 1; padding-left: 10px; font-size: 12px; font-weight: 600; }
    .level-bar-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; transition: width 0.5s ease; }
    .basic-bar { background: rgba(59,130,246,0.3); }
    .standard-bar { background: rgba(245,158,11,0.3); }
    .comp-bar { background: rgba(239,68,68,0.3); }
    .se-type-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .se-status-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .se-status-badge.draft { background: rgba(148,163,184,0.15); color: var(--text-secondary); }
    .se-status-badge.under_review { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-status-badge.approved { background: rgba(52,211,153,0.15); color: #34d399; }
    .confidence-badge-inline { display:inline-flex; align-items:center; width:max-content; padding:2px 6px; border:1px solid var(--border-subtle); border-radius:4px; font-size:10px; font-weight:700; cursor:help; }
    .confidence-badge-inline.corroborated { color: #22c55e; }
    .confidence-badge-inline.available-with-justification { color: #f59e0b; }
    .confidence-badge-inline.floor-applied { color: #60a5fa; }
    .confidence-badge-inline.high { color: var(--text-tertiary); }
    .justification-flag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(245,158,11,0.15); color: #f59e0b; font-weight: 600; margin-left: 4px; cursor: help; }
    .manual-adjustment-cell { display:grid; gap:2px; min-width:160px; }
    .metric-note-cell { min-width: 240px; max-width: 420px; white-space: pre-wrap; }
    .report-scope-note { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
    .pilot-record-banner { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; padding:12px 16px; border:1px solid rgba(245,158,11,.4); border-radius:10px; background:rgba(245,158,11,.08); }
    .pilot-record-banner strong,.pilot-record-banner span { grid-column:1; }
    .pilot-record-banner span { color:var(--text-secondary); font-size:12px; }
    .pilot-record-banner::after { content:'PILOT / WIP'; grid-column:2; grid-row:1 / span 2; color:var(--accent-warning); font-size:11px; font-weight:800; letter-spacing:.1em; transform:rotate(-3deg); }
    .report-layer-heading { margin:30px 0 12px; color:var(--text-primary); font-size:18px; }
    .report-gate-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; margin-top:14px; }
    .report-gate { display:grid; gap:3px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px; }
    .report-gate > span,.report-gate small { color:var(--text-secondary); font-size:11px; }
    .report-gate.passed strong { color:var(--accent-success); }
    .report-gate.incomplete strong { color:var(--accent-warning); }
  `;
  container.appendChild(style);
  enhanceReportSections(container);

  container.querySelectorAll('.right-sizing-approval-form').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const current = getState();
      const processId = Number(form.dataset.processId);
      const proposal = (current.rightSizingProposals || []).find(item => Number(item.processId) === processId);
      if (!proposal) {
        showToast('This proposal is no longer current. Re-run the assessment.', 'warning');
        return;
      }
      const formData = new FormData(form);
      const requirements = getRightSizingApprovalRequirements(proposal, current.assessmentTree);
      const approvals = Object.fromEntries(requirements.requiredRoles.map(role => [role, {
        identity: String(formData.get(`${role}-identity`) || '').trim(),
        authorityBasis: String(formData.get(`${role}-basis`) || '').trim()
      }]));
      const approvalContext = {
        assessmentTree: current.assessmentTree,
        scores: current.scores,
        assuranceObligations: current.assuranceObligations,
        activeFloors: current.activeFloors,
        normativeLevels: current.normativeLevels || current.levels,
        frameworkVersion: FRAMEWORK_META.version,
        metricDefinitionSet: FRAMEWORK_META.metricDefinitionSet
      };
      const record = {
        id: `RS-${proposal.elementId || current.assessmentTree?.activeId || 'default'}-${processId}`,
        decision: 'approved',
        processId,
        scopeElementIds: requirements.scopeElementIds,
        governingBoundaryElementId: requirements.governingBoundaryElementId,
        from: proposal.from,
        to: proposal.proposedTo || proposal.to,
        snapshot: createRightSizingApprovalSnapshot(proposal, approvalContext),
        rationale: String(formData.get('rationale') || '').trim(),
        protectedOutputs: String(formData.get('protectedOutputs') || '').trim(),
        protectedOutputImpact: proposal.protectedOutputImpact === true,
        residualRisks: String(formData.get('residualRisks') || '').trim(),
        riskAcceptanceOwner: String(formData.get('riskAcceptanceOwner') || '').trim(),
        compensatingControls: String(formData.get('compensatingControls') || '').trim(),
        rejectedAlternatives: String(formData.get('rejectedAlternatives') || '').trim(),
        evidenceRef: String(formData.get('evidenceRef') || '').trim(),
        reviewDate: String(formData.get('reviewDate') || ''),
        approvedAt: new Date().toISOString(),
        approvals
      };
      const records = [...(current.rightSizingApprovalRecords || []).filter(item => item.id !== record.id), record];
      const activeElementId = current.assessmentTree?.activeId || 'default';
      const assessmentContext = {
        ...current.projectInfo,
        metricAssessments: current.metricAssessments,
        assuranceObligations: current.assuranceObligations,
        rightSizingApprovalRecords: records,
        activeElementId,
        assessmentTree: current.assessmentTree,
        frameworkVersion: FRAMEWORK_META.version,
        metricDefinitionSet: FRAMEWORK_META.metricDefinitionSet
      };
      const result = runFullAssessment(current.scores, current.matrixMap, assessmentContext);
      const activeNode = current.assessmentTree?.nodes?.[activeElementId];
      if (activeNode) {
        activeNode.rightSizingApprovalRecords = JSON.parse(JSON.stringify(records));
        activeNode.assessmentResult = result;
        activeNode.levels = { ...result.levels };
      }
      setState({
        levels: result.levels,
        normativeLevels: result.normativeLevels,
        rightSizingApprovalRecords: records,
        rightSizingApprovalEvaluations: result.rightSizingApprovalEvaluations,
        approvedRightSizedLevels: result.approvedRightSizedLevels,
        effectiveRightSizingApprovalCount: result.effectiveRightSizingApprovalCount,
        budgetStatus: result.budgetStatus,
        fixes: result.fixes,
        violations: result.violations,
        confidence: result.confidence,
        assessmentTree: current.assessmentTree
      });
      const effective = result.rightSizingApprovalEvaluations?.find(item => Number(item.proposal?.processId) === processId)?.effective;
      showToast(effective ? 'Asserted approval recorded and mandatory closure rechecked. External approval is not verified.' : 'Asserted approval record saved but remains invalid or incomplete.', effective ? 'success' : 'warning');
      renderReport(container);
    });
  });

  // Export handlers
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    exportConfig(state);
    showToast('Minimum-data JSON exported. It is not an authoritative organizational record.', 'success');
  });
  container.querySelector('#btn-export-html').addEventListener('click', () => {
    generateReport(state, data);
    showToast('Identifier-reduced HTML downloaded. It retains free text and evidence and is not de-identified.', 'warning');
  });
}

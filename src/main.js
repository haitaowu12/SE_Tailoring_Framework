/**
 * Main Entry Point — SE Tailoring Model App
 */
import './styles/index.css';
import './styles/animations.css';
import { registerRoute, initRouter, navigateTo } from './router.js';
import { getState, setState, loadAutosave, clearAutosave } from './state.js';
import { importConfig, exportConfig, normalizeImportedConfig } from './utils/export-import.js';
import { showToast } from './state.js';
import { renderDashboard } from './views/dashboard.js';
import { renderAssessment } from './views/assessment.js';
import { renderProcessExplorer } from './views/process-explorer.js';
import { renderVeeModel } from './views/vee-model.js';
import { renderInterdependency } from './views/interdependency.js';
import { renderMatrixView } from './views/matrix-view.js';
import { renderManualAdjust } from './views/manual-adjust.js';
import { renderDeliverables } from './views/deliverables.js';
import { renderReport } from './views/report.js';
import { renderSystemElements } from './views/system-elements.js';
import { renderOutputSufficiency } from './views/output-sufficiency.js';
import { escapeHtml } from './utils/safe-text.js';
import { FRAMEWORK_META } from './data/se-tailoring-data.js';

const AUTHOR_URL = 'https://haitaowu12.github.io/tony-wu-home/';

// Register all routes
registerRoute('dashboard', renderDashboard);
registerRoute('elements', renderSystemElements);
registerRoute('assessment', renderAssessment);
registerRoute('processes', renderProcessExplorer);
registerRoute('vee-model', renderVeeModel);
registerRoute('interdependency', renderInterdependency);
registerRoute('matrix', renderMatrixView);
registerRoute('adjust', renderManualAdjust);
registerRoute('deliverables', renderDeliverables);
registerRoute('handoffs', renderOutputSufficiency);
registerRoute('report', renderReport);

// Build the navbar
function buildNavbar() {
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = `
    <button class="nav-brand nav-brand-button" id="btn-nav-home" type="button" aria-label="Go to dashboard">
      <div class="brand-icon">SE</div>
      <span>Tailoring Model <small style="font-size:10px;color:var(--text-tertiary);font-weight:400;">v${escapeHtml(FRAMEWORK_META.version)}</small></span>
    </button>
    <div class="nav-links">
      <button class="nav-link" data-route="dashboard">Dashboard</button>
      <button class="nav-link" data-route="elements">Elements</button>
      <button class="nav-link" data-route="assessment">Assessment</button>
      <div class="nav-dropdown">
        <button class="nav-dropdown-trigger" aria-haspopup="true" aria-expanded="false">Analysis ▾</button>
        <div class="nav-dropdown-menu" role="menu">
          <button class="nav-link" data-route="processes" role="menuitem">Process Explorer</button>
          <button class="nav-link" data-route="vee-model" role="menuitem">Vee Model</button>
          <button class="nav-link" data-route="interdependency" role="menuitem">Dependencies</button>
          <button class="nav-link" data-route="matrix" role="menuitem">Matrix View</button>
        </div>
      </div>
      <div class="nav-dropdown">
        <button class="nav-dropdown-trigger" aria-haspopup="true" aria-expanded="false">Output ▾</button>
        <div class="nav-dropdown-menu" role="menu">
          <button class="nav-link" data-route="adjust" role="menuitem">Manual Adjust</button>
          <button class="nav-link" data-route="deliverables" role="menuitem">Deliverables</button>
          <button class="nav-link" data-route="handoffs" role="menuitem">Artifact Handoffs</button>
          <button class="nav-link" data-route="report" role="menuitem">Report</button>
        </div>
      </div>
    </div>
    <label class="mobile-route-select-label" for="mobile-route-select">Route</label>
    <select class="mobile-route-select" id="mobile-route-select" aria-label="Navigate app section">
      <option value="dashboard">Dashboard</option>
      <option value="elements">Elements</option>
      <option value="assessment">Assessment</option>
      <option value="processes">Process Explorer</option>
      <option value="vee-model">Vee Model</option>
      <option value="interdependency">Dependencies</option>
      <option value="matrix">Matrix View</option>
      <option value="adjust">Manual Adjust</option>
      <option value="deliverables">Deliverables</option>
      <option value="handoffs">Artifact Handoffs</option>
      <option value="report">Report</option>
    </select>
    <div class="nav-actions">
      <a
        class="author-link"
        href="${AUTHOR_URL}"
        aria-label="Know the author: Tony Wu, systems engineer and builder of this project"
      >TW · About</a>
      <button class="btn btn-ghost btn-sm" id="btn-import" title="Import Config">Import</button>
      <button class="btn btn-ghost btn-sm" id="btn-export" title="Export a pilot-safe configuration without project, team, or element names">Safe Export</button>
      <button class="btn btn-danger btn-sm" id="btn-end-session" type="button" title="Erase the assessment saved in this browser">End Session</button>
    </div>
  `;

    // Nav link click handlers (includes dropdown items)
    navbar.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.route));
    });

    navbar.querySelector('#btn-nav-home')?.addEventListener('click', () => navigateTo('dashboard'));

    const mobileRouteSelect = navbar.querySelector('#mobile-route-select');
    mobileRouteSelect.addEventListener('change', () => navigateTo(mobileRouteSelect.value));

    // Import button
    navbar.querySelector('#btn-import').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const config = await importConfig(e.target.files[0]);
                setState(normalizeImportedConfig(config, getState().assessmentTree));
                showToast('Configuration imported successfully!', 'success');
                navigateTo('dashboard');
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
        input.click();
    });

    // Export button
    navbar.querySelector('#btn-export').addEventListener('click', async () => {
        exportConfig(getState());
        showToast('Pilot-safe configuration exported. Review free text before sharing.', 'success');
    });

    navbar.querySelector('#btn-end-session').addEventListener('click', showEndSessionDialog);

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
    });

    window.addEventListener('app:route-rendered', (event) => {
        const route = event.detail?.route || 'dashboard';
        if (mobileRouteSelect.value !== route) {
            mobileRouteSelect.value = route;
        }
    });
}

function buildPilotNotice() {
    const notice = document.getElementById('pilot-notice');
    notice.innerHTML = `
      <div class="pilot-notice-inner">
        <strong>Formative pilot — not a validated decision authority.</strong>
        <span>Use a non-identifying project code and avoid personal, confidential, export-controlled, or operationally sensitive information. Work auto-saves only in this browser. Safe Export removes project, team, and element names, but you must review free text and evidence references before sharing.</span>
      </div>
    `;
}

function showEndSessionDialog() {
    const overlay = document.getElementById('modal-overlay');
    overlay.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="end-session-title" aria-describedby="end-session-description">
        <h2 id="end-session-title">End session and erase local assessment?</h2>
        <p id="end-session-description" class="text-secondary mt-md">This removes the assessment auto-saved by this app in this browser and starts a blank session. Download a pilot-safe export first if you need to retain the work.</p>
        <div class="modal-actions mt-xl">
          <button class="btn btn-secondary" id="btn-end-session-cancel" type="button">Keep working</button>
          <button class="btn btn-danger" id="btn-end-session-confirm" type="button">End session—erase local assessment</button>
        </div>
      </section>
    `;
    overlay.classList.add('active');
    const cancel = overlay.querySelector('#btn-end-session-cancel');
    const confirm = overlay.querySelector('#btn-end-session-confirm');
    const close = () => {
        overlay.classList.remove('active');
        overlay.innerHTML = '';
    };
    cancel.addEventListener('click', close);
    confirm.addEventListener('click', () => {
        clearAutosave();
        window.location.reload();
    });
    cancel.focus();
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    buildNavbar();
    buildPilotNotice();
    initRouter(document.getElementById('main-content'));

    const saved = loadAutosave();
    if (saved && (saved.assessmentComplete || saved.assessmentDisposition || Object.keys(saved.scores || {}).length > 0)) {
        const savedDate = saved.savedAt ? new Date(saved.savedAt).toLocaleString() : 'unknown time';
        const overlay = document.createElement('div');
        overlay.id = 'autosave-restore-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:12px;padding:32px;max-width:440px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <div style="font-size:2rem;margin-bottom:12px;">💾</div>
                <h3 style="margin-bottom:8px;">Saved Assessment Work Found</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px;">Auto-saved ${saved.assessmentComplete ? 'baseline work' : 'work in progress'} from <strong>${escapeHtml(savedDate)}</strong> was found in this browser. Restore it only if this is your session.</p>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" id="btn-restore-yes">Restore</button>
                    <button class="btn btn-secondary" id="btn-restore-no">Start Fresh</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#btn-restore-yes').addEventListener('click', () => {
            const isCurrentSemanticAutosave = saved.semantics?.metricDefinitionSet === FRAMEWORK_META.metricDefinitionSet;
            if (!isCurrentSemanticAutosave) {
                setState(normalizeImportedConfig({
                    _format: 'se-tailoring-config',
                    _version: '1.1',
                    projectInfo: saved.projectInfo || {},
                    metricScores: saved.scores || {},
                    processLevels: saved.levels || {},
                    derivedLevels: saved.derived || {},
                    derivationDetails: saved.derivationDetails || {},
                    overrides: saved.overrides || [],
                    violations: saved.violations || [],
                    fixes: saved.fixes || [],
                    activeFloors: saved.activeFloors || [],
                    ruleDispositions: saved.ruleDispositions || {},
                    csiResponse: saved.csiResponse || {},
                    rightSizingProposals: saved.rightSizingProposals || [],
                    blockedRightSizingCandidates: saved.blockedRightSizingCandidates || [],
                    proposedRightSizedLevels: saved.proposedRightSizedLevels || {},
                    proposalClosureFixes: saved.proposalClosureFixes || [],
                    proposalBudgetStatus: saved.proposalBudgetStatus || null,
                    rightSizingApprovalRecords: saved.rightSizingApprovalRecords || [],
                    rightSizingApprovalEvaluations: saved.rightSizingApprovalEvaluations || [],
                    approvedRightSizedLevels: saved.approvedRightSizedLevels || {},
                    normativeLevels: saved.normativeLevels || saved.levels || {},
                    effectiveRightSizingApprovalCount: saved.effectiveRightSizingApprovalCount || 0,
                    rightSizingActions: saved.rightSizingActions || [],
                    budgetStatus: saved.budgetStatus || null,
                    adoptionRisks: saved.adoptionRisks || [],
                    confidence: saved.confidence || {},
                    assessmentComplete: saved.assessmentComplete || false
                }, saved.assessmentTree || getState().assessmentTree));
            } else setState({
                projectInfo: saved.projectInfo || {},
                scores: saved.scores || {},
                metricAssessments: saved.metricAssessments || {},
                assuranceObligations: saved.assuranceObligations || [],
                ruleDispositions: saved.ruleDispositions || {},
                csiResponse: saved.csiResponse || {},
                semanticMigration: saved.semanticMigration || null,
                saResponses: saved.saResponses || {},
                saTier: saved.saTier || null,
                derived: saved.derived || {},
                derivationDetails: saved.derivationDetails || {},
                levels: saved.levels || {},
                overrides: saved.overrides || [],
                activeFloors: saved.activeFloors || [],
                violations: saved.violations || [],
                fixes: saved.fixes || [],
                rightSizingProposals: saved.rightSizingProposals || [],
                blockedRightSizingCandidates: saved.blockedRightSizingCandidates || [],
                proposedRightSizedLevels: saved.proposedRightSizedLevels || {},
                proposalClosureFixes: saved.proposalClosureFixes || [],
                proposalBudgetStatus: saved.proposalBudgetStatus || null,
                rightSizingApprovalRecords: saved.rightSizingApprovalRecords || [],
                rightSizingApprovalEvaluations: saved.rightSizingApprovalEvaluations || [],
                approvedRightSizedLevels: saved.approvedRightSizedLevels || {},
                normativeLevels: saved.normativeLevels || saved.levels || {},
                effectiveRightSizingApprovalCount: saved.effectiveRightSizingApprovalCount || 0,
                rightSizingActions: saved.rightSizingActions || [],
                budgetStatus: saved.budgetStatus || null,
                adoptionRisks: saved.adoptionRisks || [],
                manualAdjustments: saved.manualAdjustments || {},
                tradeoffs: saved.tradeoffs || [],
                cultureType: saved.cultureType || null,
                notes: saved.notes || '',
                assessmentComplete: saved.assessmentComplete || false,
                assessmentDisposition: saved.assessmentDisposition || 'work-in-progress',
                confidence: saved.confidence || {},
                assessmentTree: saved.assessmentTree || getState().assessmentTree,
                deliverablesChecked: saved.deliverablesChecked || [],
                artifactHandoffs: normalizeImportedConfig({
                    _format: 'se-tailoring-config',
                    _version: '2.0',
                    semantics: saved.semantics,
                    metricScores: saved.scores || {},
                    processLevels: saved.levels || {},
                    artifactHandoffs: saved.artifactHandoffs
                }, saved.assessmentTree || getState().assessmentTree).artifactHandoffs
            });
            overlay.remove();
            showToast(isCurrentSemanticAutosave ? 'Assessment restored from auto-save!' : 'Legacy assessment preserved; M6, M8, and M15 require semantic reassessment.', isCurrentSemanticAutosave ? 'success' : 'warning');
            navigateTo('dashboard');
        });

        overlay.querySelector('#btn-restore-no').addEventListener('click', () => {
            clearAutosave();
            overlay.remove();
        });
    }
});

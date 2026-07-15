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
import { escapeHtml } from './utils/safe-text.js';
import { FRAMEWORK_META } from './data/se-tailoring-data.js';
import { APP_RUNTIME_META, getLocalDiagnostics, installRuntimeIssueCapture } from './utils/runtime-operations.js';

const AUTHOR_URL = 'https://haitaowu12.github.io/tony-wu-home/';
const PILOT_NOTICE_DISMISSED_KEY = 'se-tailoring-pilot-notice-dismissed';

function keepFocusWithinDialog(event, dialog) {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

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
      <option value="report">Report</option>
    </select>
    <div class="nav-actions">
      <a
        class="author-link"
        href="${AUTHOR_URL}"
        aria-label="Know the author: Tony Wu, systems engineer and builder of this project"
      >TW · About</a>
      <button class="btn btn-ghost btn-sm desktop-session-action" id="btn-import" data-session-action="import" title="Import Config">Import</button>
      <button class="btn btn-ghost btn-sm desktop-session-action" id="btn-export" data-session-action="export" title="Export a minimum-data configuration without identifiers, free text, evidence references, or asserted identities">Minimum-data Export</button>
      <button class="btn btn-ghost btn-sm desktop-session-action" id="btn-diagnostics" data-session-action="diagnostics" type="button" title="View release identity and local-only runtime diagnostics">Diagnostics</button>
      <button class="btn btn-danger btn-sm desktop-session-action" id="btn-end-session" data-session-action="end-session" type="button" title="Erase the assessment saved in this browser">End Session</button>
      <div class="nav-dropdown mobile-session-menu">
        <button class="nav-dropdown-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Session actions">Session ▾</button>
        <div class="nav-dropdown-menu" role="menu">
          <button class="mobile-session-action" data-session-action="import" type="button" role="menuitem">Import</button>
          <button class="mobile-session-action" data-session-action="export" type="button" role="menuitem">Minimum-data Export</button>
          <button class="mobile-session-action" data-session-action="diagnostics" type="button" role="menuitem">Diagnostics</button>
          <button class="mobile-session-action danger" data-session-action="end-session" type="button" role="menuitem">End Session</button>
        </div>
      </div>
    </div>
  `;

    // Nav link click handlers (includes dropdown items)
    navbar.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.route));
    });

    navbar.querySelectorAll('.nav-dropdown').forEach((dropdown, dropdownIndex) => {
        const trigger = dropdown.querySelector('.nav-dropdown-trigger');
        const menu = dropdown.querySelector('.nav-dropdown-menu');
        if (trigger && menu) {
            menu.id = `nav-dropdown-menu-${dropdownIndex}`;
            trigger.setAttribute('aria-controls', menu.id);
        }
        const closeMenu = () => {
            dropdown.classList.remove('open');
            trigger?.setAttribute('aria-expanded', 'false');
        };
        trigger?.addEventListener('click', () => {
            const opening = !dropdown.classList.contains('open');
            navbar.querySelectorAll('.nav-dropdown.open').forEach(open => {
                open.classList.remove('open');
                open.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            });
            dropdown.classList.toggle('open', opening);
            trigger.setAttribute('aria-expanded', String(opening));
        });
        trigger?.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeMenu();
                trigger.focus();
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                dropdown.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                const items = [...dropdown.querySelectorAll('[role="menuitem"]')];
                (event.key === 'ArrowDown' ? items[0] : items.at(-1))?.focus();
            }
        });
        dropdown.addEventListener('keydown', event => {
            const items = [...dropdown.querySelectorAll('[role="menuitem"]')];
            const index = items.indexOf(document.activeElement);
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu();
                trigger?.focus();
            } else if (index >= 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault();
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                items[(index + direction + items.length) % items.length]?.focus();
            }
        });
        dropdown.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!dropdown.contains(document.activeElement)) closeMenu();
            }, 0);
        });
        dropdown.querySelectorAll('[role="menuitem"]').forEach(item => item.addEventListener('click', closeMenu));
    });
    document.addEventListener('pointerdown', event => {
        if (!navbar.contains(event.target)) {
            navbar.querySelectorAll('.nav-dropdown.open').forEach(open => {
                open.classList.remove('open');
                open.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            });
        }
    });

    navbar.querySelector('#btn-nav-home')?.addEventListener('click', () => navigateTo('dashboard'));

    const mobileRouteSelect = navbar.querySelector('#mobile-route-select');
    mobileRouteSelect.addEventListener('change', () => navigateTo(mobileRouteSelect.value));

    // Import action
    const handleImport = () => {
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
    };
    navbar.querySelectorAll('[data-session-action="import"]').forEach(button => button.addEventListener('click', handleImport));

    // Export action
    const handleExport = () => {
        exportConfig(getState());
        showToast('Minimum-data configuration exported. It is not a completed-baseline record.', 'success');
    };
    navbar.querySelectorAll('[data-session-action="export"]').forEach(button => button.addEventListener('click', handleExport));

    navbar.querySelectorAll('[data-session-action="end-session"]').forEach(button => button.addEventListener('click', showEndSessionDialog));
    navbar.querySelectorAll('[data-session-action="diagnostics"]').forEach(button => button.addEventListener('click', showDiagnosticsDialog));

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
    let dismissed = false;
    try {
        dismissed = localStorage.getItem(PILOT_NOTICE_DISMISSED_KEY) === 'true';
    } catch {
        dismissed = false;
    }
    if (dismissed) {
        notice.hidden = true;
        return;
    }
    notice.innerHTML = `
      <div class="pilot-notice-inner">
        <div class="pilot-notice-copy">
          <strong>Pilot prototype.</strong>
          <span>Use a non-identifying project code; do not enter sensitive information.</span>
        </div>
        <button class="btn btn-ghost btn-sm pilot-notice-dismiss" id="btn-dismiss-pilot-notice" type="button">Dismiss</button>
      </div>
    `;
    notice.querySelector('#btn-dismiss-pilot-notice')?.addEventListener('click', () => {
        notice.hidden = true;
        try {
            localStorage.setItem(PILOT_NOTICE_DISMISSED_KEY, 'true');
        } catch {
            // The notice can still be dismissed for the current page if storage is unavailable.
        }
    });
}

function downloadDiagnostics(diagnostics) {
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `se-tailoring-local-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function showDiagnosticsDialog() {
    const diagnostics = getLocalDiagnostics();
    const overlay = document.getElementById('modal-overlay');
    const invoker = document.activeElement;
    const issueRows = diagnostics.issues.length
        ? diagnostics.issues.map(issue => `<tr><td>${escapeHtml(issue.time)}</td><td>${escapeHtml(issue.operation)}</td><td>${escapeHtml(issue.id)}</td></tr>`).join('')
        : '<tr><td colspan="3">No runtime issues captured in this page session.</td></tr>';
    overlay.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="diagnostics-title" aria-describedby="diagnostics-description">
        <h2 id="diagnostics-title">Release and local diagnostics</h2>
        <p id="diagnostics-description" class="text-secondary mt-sm">This information stays in your browser unless you download and share it. It excludes assessment values, project text, evidence, and identities. The app sends no telemetry.</p>
        <dl class="runtime-diagnostic-list mt-lg">
          <div><dt>App release</dt><dd>${escapeHtml(APP_RUNTIME_META.appRelease)}</dd></div>
          <div><dt>Framework semantics</dt><dd>${escapeHtml(APP_RUNTIME_META.frameworkVersion)}</dd></div>
          <div><dt>Metric definition set</dt><dd>${escapeHtml(APP_RUNTIME_META.metricDefinitionSet)}</dd></div>
          <div><dt>Exchange schema</dt><dd>${escapeHtml(APP_RUNTIME_META.exchangeSchemaVersion)}</dd></div>
          <div><dt>Build identity</dt><dd>${escapeHtml(APP_RUNTIME_META.buildId)}</dd></div>
          <div><dt>Runtime profile</dt><dd>${escapeHtml(APP_RUNTIME_META.operatingProfile)}</dd></div>
          <div><dt>Local save</dt><dd>${diagnostics.runtime.localStorageAvailable ? (diagnostics.runtime.savedWorkPresent ? 'Available; saved work present' : 'Available; no saved work detected') : 'Unavailable'}</dd></div>
        </dl>
        <h3 class="mt-lg">Session issues</h3>
        <div class="matrix-table-wrapper mt-sm"><table class="matrix-table"><thead><tr><th>Time</th><th>Operation</th><th>Local ID</th></tr></thead><tbody>${issueRows}</tbody></table></div>
        <div class="modal-actions mt-xl">
          <button class="btn btn-secondary" id="btn-diagnostics-close" type="button">Close</button>
          <button class="btn btn-primary" id="btn-diagnostics-download" type="button">Download local diagnostics</button>
        </div>
      </section>
    `;
    overlay.classList.add('active');
    const closeButton = overlay.querySelector('#btn-diagnostics-close');
    const close = () => {
        document.removeEventListener('keydown', handleKeydown);
        overlay.classList.remove('active');
        overlay.innerHTML = '';
        if (invoker instanceof HTMLElement) invoker.focus();
    };
    const handleKeydown = event => {
        if (event.key === 'Escape') close();
        else keepFocusWithinDialog(event, overlay);
    };
    document.addEventListener('keydown', handleKeydown);
    closeButton.addEventListener('click', close);
    overlay.querySelector('#btn-diagnostics-download').addEventListener('click', () => downloadDiagnostics(diagnostics));
    closeButton.focus();
}

function showStorageFailure(operation) {
    const status = document.getElementById('runtime-status');
    status.innerHTML = `
      <div class="runtime-status-inner">
        <strong>Local ${escapeHtml(operation)} failed.</strong>
        Do not rely on this browser to retain the assessment. Open Diagnostics, record the local issue ID, and stop consequential work until storage is restored.
      </div>
    `;
    status.classList.add('active');
}

function showEndSessionDialog() {
    const overlay = document.getElementById('modal-overlay');
    const invoker = document.activeElement;
    overlay.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="end-session-title" aria-describedby="end-session-description">
        <h2 id="end-session-title">End session and erase local assessment?</h2>
        <p id="end-session-description" class="text-secondary mt-md">This removes the assessment auto-saved by this app in this browser and starts a blank session. Download a minimum-data export first if you need to retain a non-baseline analysis record.</p>
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
        document.removeEventListener('keydown', handleKeydown);
        overlay.classList.remove('active');
        overlay.innerHTML = '';
        if (invoker instanceof HTMLElement) invoker.focus();
    };
    const handleKeydown = event => {
        if (event.key === 'Escape') close();
        else keepFocusWithinDialog(event, overlay);
    };
    document.addEventListener('keydown', handleKeydown);
    cancel.addEventListener('click', close);
    confirm.addEventListener('click', () => {
        clearAutosave();
        window.location.reload();
    });
    cancel.focus();
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    installRuntimeIssueCapture();
    window.addEventListener('app:open-diagnostics', showDiagnosticsDialog);
    window.addEventListener('app:storage-failure', event => showStorageFailure(event.detail?.operation || 'storage operation'));
    buildNavbar();
    buildPilotNotice();
    initRouter(document.getElementById('main-content'));

    const saved = loadAutosave();
    if (saved && (saved.assessmentComplete || saved.assessmentDisposition || Object.keys(saved.scores || {}).length > 0)) {
        const savedDate = saved.savedAt ? new Date(saved.savedAt).toLocaleString() : 'unknown time';
        const overlay = document.createElement('div');
        overlay.id = 'autosave-restore-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'autosave-restore-title');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:12px;padding:32px;max-width:440px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <div class="modal-kicker">Saved session</div>
                <h3 id="autosave-restore-title" style="margin-bottom:8px;">Saved Assessment Work Found</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px;">Auto-saved ${saved.assessmentComplete ? 'baseline work' : 'work in progress'} from <strong>${escapeHtml(savedDate)}</strong> was found in this browser. Restore it only if this is your session.</p>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" id="btn-restore-yes">Restore</button>
                    <button class="btn btn-secondary" id="btn-restore-no">Start Fresh</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const handleRestoreKeydown = event => keepFocusWithinDialog(event, overlay);
        document.addEventListener('keydown', handleRestoreKeydown);

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
                    derivationStatus: saved.derivationStatus || saved.confidence || {},
                    confidence: saved.confidence || saved.derivationStatus || {},
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
                derivationStatus: saved.derivationStatus || saved.confidence || {},
                confidence: saved.confidence || saved.derivationStatus || {},
                assessmentTree: saved.assessmentTree || getState().assessmentTree,
                deliverablesChecked: saved.deliverablesChecked || []
            });
            document.removeEventListener('keydown', handleRestoreKeydown);
            overlay.remove();
            showToast(isCurrentSemanticAutosave ? 'Assessment restored from auto-save!' : 'Legacy assessment preserved; M6, M8, and M15 require semantic reassessment.', isCurrentSemanticAutosave ? 'success' : 'warning');
            navigateTo('dashboard');
        });

        overlay.querySelector('#btn-restore-no').addEventListener('click', () => {
            clearAutosave();
            document.removeEventListener('keydown', handleRestoreKeydown);
            overlay.remove();
        });
        overlay.querySelector('#btn-restore-yes').focus();
    }
});

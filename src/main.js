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
import { autosaveRestoreNotice, buildAutosaveImportConfig, isCurrentAutosaveSemantics } from './utils/autosave-restore.js';

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

function restoreDialogInvokerFocus(invoker) {
    if (!(invoker instanceof HTMLElement)) return;
    const dropdown = invoker.closest('.nav-dropdown');
    const trigger = dropdown?.querySelector('.nav-dropdown-trigger');
    const target = dropdown && trigger instanceof HTMLElement ? trigger : invoker;
    target.focus();
    requestAnimationFrame(() => {
        if (target.isConnected) target.focus();
    });
}

// Register all routes
registerRoute('dashboard', renderDashboard);
registerRoute('elements', renderSystemElements);
registerRoute('assessment', renderAssessment);
registerRoute('review', (container, routeContext) => renderAssessment(container, { ...routeContext, assessmentMode: 'review' }));
registerRoute('issues', (container, routeContext) => renderAssessment(container, { ...routeContext, assessmentMode: 'issues' }));
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
      <button class="nav-link" data-route="assessment">Assess</button>
      <button class="nav-link" data-route="review">Review recommendations</button>
      <button class="nav-link" data-route="issues">Resolve issues</button>
      <button class="nav-link" data-route="report">Report</button>
      <div class="nav-dropdown">
        <button class="nav-dropdown-trigger" type="button" aria-expanded="false">Framework reference ▾</button>
        <div class="nav-dropdown-menu">
          <button class="nav-link" data-route="processes">Process Explorer</button>
          <button class="nav-link" data-route="vee-model">Vee Model</button>
          <button class="nav-link" data-route="interdependency">Dependencies</button>
          <button class="nav-link" data-route="matrix">Matrix View</button>
          <button class="nav-link" data-route="elements">System Elements (advanced)</button>
          <button class="nav-link" data-route="deliverables">Reference Deliverables</button>
        </div>
      </div>
    </div>
    <label class="mobile-route-select-label" for="mobile-route-select">Go to section</label>
    <select class="mobile-route-select" id="mobile-route-select" aria-label="Go to section">
      <option value="assessment">Assess</option>
      <option value="review">Review recommendations</option>
      <option value="issues">Resolve issues</option>
      <option value="report">Report</option>
      <option value="processes">Process Explorer</option>
      <option value="vee-model">Vee Model</option>
      <option value="interdependency">Dependencies</option>
      <option value="matrix">Matrix View</option>
      <option value="elements">System Elements (advanced)</option>
      <option value="deliverables">Reference Deliverables</option>
    </select>
    <div class="nav-actions">
      <a
        class="author-link"
        href="${AUTHOR_URL}"
        aria-label="Know the author: Tony Wu, systems engineer and builder of this project"
      >TW · About</a>
      <div class="nav-dropdown session-menu">
        <button class="nav-dropdown-trigger" type="button" aria-expanded="false" aria-label="Session actions">Session ▾</button>
        <div class="nav-dropdown-menu">
          <button class="session-action" id="btn-import" data-session-action="import" type="button">Import</button>
          <button class="session-action" id="btn-export" data-session-action="export" type="button">Minimum-data Export</button>
          <button class="session-action" id="btn-diagnostics" data-session-action="diagnostics" type="button">Diagnostics</button>
          <button class="session-action danger" id="btn-end-session" data-session-action="end-session" type="button">End Session</button>
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
            }
        });
        dropdown.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu();
                trigger?.focus();
            }
        });
        dropdown.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!dropdown.contains(document.activeElement)) closeMenu();
            }, 0);
        });
        dropdown.querySelectorAll('.nav-dropdown-menu button, .nav-dropdown-menu a').forEach(item => item.addEventListener('click', closeMenu));
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
          <strong>Pilot research instrument.</strong>
          <span>Not an authoritative organizational baseline. Use a non-identifying project code; do not enter sensitive information.</span>
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
        restoreDialogInvokerFocus(invoker);
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
        restoreDialogInvokerFocus(invoker);
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
    const mainContent = document.getElementById('main-content');
    document.querySelector('.skip-link')?.addEventListener('click', event => {
        event.preventDefault();
        mainContent.focus();
    });
    initRouter(mainContent);

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
            <div style="background:var(--bg-secondary);border:1px solid var(--border-medium);border-radius:12px;padding:32px;max-width:440px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
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
            const isCurrentSemanticAutosave = isCurrentAutosaveSemantics(saved);
            let normalizedRestore = null;
            if (!isCurrentSemanticAutosave) {
                normalizedRestore = normalizeImportedConfig(
                    buildAutosaveImportConfig(saved),
                    saved.assessmentTree || getState().assessmentTree
                );
                setState(normalizedRestore);
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
                locallyAdjustedLevels: saved.locallyAdjustedLevels || {},
                localScenarioClosureFixes: saved.localScenarioClosureFixes || [],
                localScenarioBudgetStatus: saved.localScenarioBudgetStatus || null,
                locallyCompleteRightSizingRecordCount: saved.locallyCompleteRightSizingRecordCount || 0,
                approvedRightSizedLevels: {},
                normativeLevels: saved.normativeLevels || saved.levels || {},
                effectiveRightSizingApprovalCount: 0,
                rightSizingActions: saved.rightSizingActions || [],
                budgetStatus: saved.budgetStatus || null,
                adoptionRisks: saved.adoptionRisks || [],
                manualAdjustments: saved.manualAdjustments || {},
                tradeoffs: saved.tradeoffs || [],
                notes: saved.notes || '',
                assessmentComplete: saved.assessmentComplete || false,
                assessmentDisposition: saved.assessmentDisposition || 'work-in-progress',
                derivationStatus: saved.derivationStatus || saved.confidence || {},
                confidence: saved.confidence || saved.derivationStatus || {},
                assessmentTree: saved.assessmentTree || getState().assessmentTree
            });
            document.removeEventListener('keydown', handleRestoreKeydown);
            overlay.remove();
            const notice = autosaveRestoreNotice(isCurrentSemanticAutosave, normalizedRestore || {});
            showToast(notice.message, notice.type);
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

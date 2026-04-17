/**
 * Main Entry Point — SE Tailoring Model App
 */
import './styles/index.css';
import './styles/animations.css';
import { registerRoute, initRouter, navigateTo } from './router.js';
import { getState, setState, loadAutosave, clearAutosave } from './state.js';
import { importConfig } from './utils/export-import.js';
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
    <div class="nav-brand" onclick="location.hash='dashboard'">
      <div class="brand-icon">SE</div>
      <span>Tailoring Model <small style="font-size:10px;color:var(--text-tertiary);font-weight:400;">v3.3.0</small></span>
    </div>
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
    <div class="nav-actions">
      <button class="btn btn-ghost btn-sm" id="btn-import" title="Import Config">📥</button>
      <button class="btn btn-ghost btn-sm" id="btn-export" title="Export Config">📤</button>
    </div>
  `;

    // Nav link click handlers (includes dropdown items)
    navbar.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.route));
    });

    // Import button
    navbar.querySelector('#btn-import').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const config = await importConfig(e.target.files[0]);
                const { setState } = await import('./state.js');
                setState({
                    projectInfo: { ...(config.projectInfo || {}) },
                    scores: config.metricScores || {},
                    levels: config.processLevels || {},
                    derived: config.derivedLevels || {},
                    derivationDetails: config.derivationDetails || {},
                    overrides: config.overrides || [],
                    manualAdjustments: config.manualAdjustments || {},
                    tradeoffs: config.tradeoffs || [],
                    matrixMap: config.matrixMap || null,
                    cultureType: config.cultureType || null,
                    notes: config.notes || '',
                    confidence: config.confidence || {},
                    assessmentComplete: Object.keys(config.metricScores || {}).length > 0
                });
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
        const { exportConfig } = await import('./utils/export-import.js');
        exportConfig(getState());
        showToast('Configuration exported!', 'success');
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Highlight dropdown trigger when a child route is active
    function updateDropdownHighlights() {
        navbar.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            const hasActive = dropdown.querySelector('.nav-link.active');
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            trigger.classList.toggle('has-active', !!hasActive);
        });
    }
    window.addEventListener('hashchange', () => setTimeout(updateDropdownHighlights, 50));
    setTimeout(updateDropdownHighlights, 50);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    buildNavbar();
    initRouter(document.getElementById('main-content'));

    const saved = loadAutosave();
    if (saved && saved.assessmentComplete) {
        const savedDate = saved.savedAt ? new Date(saved.savedAt).toLocaleString() : 'unknown time';
        const overlay = document.createElement('div');
        overlay.id = 'autosave-restore-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:12px;padding:32px;max-width:440px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <div style="font-size:2rem;margin-bottom:12px;">💾</div>
                <h3 style="margin-bottom:8px;">Saved Assessment Found</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px;">An auto-saved assessment from <strong>${savedDate}</strong> was found for project "<strong>${saved.projectInfo?.name || 'Untitled'}</strong>".</p>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" id="btn-restore-yes">Restore</button>
                    <button class="btn btn-secondary" id="btn-restore-no">Start Fresh</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#btn-restore-yes').addEventListener('click', () => {
            setState({
                projectInfo: saved.projectInfo || {},
                scores: saved.scores || {},
                saResponses: saved.saResponses || {},
                saTier: saved.saTier || null,
                derived: saved.derived || {},
                derivationDetails: saved.derivationDetails || {},
                levels: saved.levels || {},
                overrides: saved.overrides || [],
                violations: saved.violations || [],
                fixes: saved.fixes || [],
                manualAdjustments: saved.manualAdjustments || {},
                tradeoffs: saved.tradeoffs || [],
                cultureType: saved.cultureType || null,
                notes: saved.notes || '',
                assessmentComplete: saved.assessmentComplete || false,
                confidence: saved.confidence || {},
                assessmentTree: saved.assessmentTree || state.assessmentTree
            });
            overlay.remove();
            showToast('Assessment restored from auto-save!', 'success');
            navigateTo('dashboard');
        });

        overlay.querySelector('#btn-restore-no').addEventListener('click', () => {
            clearAutosave();
            overlay.remove();
        });
    }
});

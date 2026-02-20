/**
 * Main Entry Point — SE Tailoring Model App
 */
import './styles/index.css';
import './styles/animations.css';
import { registerRoute, initRouter, navigateTo } from './router.js';
import { getState } from './state.js';
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

// Register all routes
registerRoute('dashboard', renderDashboard);
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
      <span>Tailoring Model</span>
    </div>
    <div class="nav-links">
      <button class="nav-link" data-route="dashboard">Dashboard</button>
      <button class="nav-link" data-route="assessment">Assessment</button>
      <button class="nav-link" data-route="processes">Processes</button>
      <button class="nav-link" data-route="vee-model">Vee Model</button>
      <button class="nav-link" data-route="interdependency">Dependencies</button>
      <button class="nav-link" data-route="matrix">Matrix</button>
      <button class="nav-link" data-route="adjust">Adjust</button>
      <button class="nav-link" data-route="deliverables">Deliverables</button>
      <button class="nav-link" data-route="report">Report</button>
    </div>
    <div class="nav-actions">
      <button class="btn btn-ghost btn-sm" id="btn-import" title="Import Config">📥</button>
      <button class="btn btn-ghost btn-sm" id="btn-export" title="Export Config">📤</button>
    </div>
  `;

    // Nav link click handlers
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
                    projectInfo: config.projectInfo,
                    scores: config.metricScores,
                    levels: config.processLevels,
                    derived: config.derivedLevels,
                    overrides: config.overrides,
                    manualAdjustments: config.manualAdjustments || {},
                    tradeoffs: config.tradeoffs || [],
                    matrixMap: config.matrixMap || null,
                    cultureType: config.cultureType,
                    notes: config.notes || '',
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
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    buildNavbar();
    initRouter(document.getElementById('main-content'));
});

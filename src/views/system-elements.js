/**
 * System Elements View — Hierarchical system breakdown builder
 *
 * Lets users build a system element tree, navigate to per-element assessments,
 * propagate defaults bidirectionally, and resolve conflicts.
 */
import { METRICS, CORE_PROCESSES } from '../data/se-tailoring-data.js';
import {
  getState, showToast, addChildElement, removeElement,
  setActiveElement, getActiveNode, getElementBreadcrumbs,
  getElementCount, getElementsFlat, renameElement
} from '../state.js';
import { propagateDownstream, suggestUpstream } from '../utils/inheritance-engine.js';
import { navigateTo } from '../router.js';

export function renderSystemElements(container) {
  const state = getState();
  const tree = state.assessmentTree;
  const elements = getElementsFlat();
  const activeNode = getActiveNode();
  const crumbs = getElementBreadcrumbs(tree.activeId);
  const elementCount = getElementCount();

  // Collect pending conflicts for active node
  const parentNode = activeNode.parentId ? tree.nodes[activeNode.parentId] : null;
  const childNodes = activeNode.childIds.map(id => tree.nodes[id]).filter(Boolean);
  const hasChildren = childNodes.length > 0;

  container.innerHTML = `
    <div class="se-elements-container">
      <div class="se-header">
        <h2>🏗️ System Element Breakdown</h2>
        <p class="text-secondary">Build your system hierarchy and perform targeted assessments at each level</p>
      </div>

      <!-- Breadcrumbs -->
      <div class="se-breadcrumbs mb-lg">
        ${crumbs.map((c, i) => `
          <span class="se-crumb ${c.id === tree.activeId ? 'active' : ''}" data-id="${c.id}">${c.name}</span>
          ${i < crumbs.length - 1 ? '<span class="se-crumb-sep">›</span>' : ''}
        `).join('')}
      </div>

      <div class="se-layout">
        <!-- Left: Tree View -->
        <div class="se-tree-panel">
          <div class="se-panel-header">
            <h3>System Tree <span class="badge-count">${elementCount}</span></h3>
          </div>
          <div class="se-tree" id="se-tree">
            ${renderTreeNodes(tree.nodes, tree.rootId, tree.activeId, 0)}
          </div>
          <div class="se-add-panel">
            <h4>Add Element</h4>
            <input class="input" id="new-element-name" placeholder="Element name..." type="text" />
            <select class="select" id="new-element-type">
              <option value="quick">Quick Assessment (M1-M6 override)</option>
              <option value="full">Full Assessment (all metrics)</option>
              <option value="inherited">Inherited (all from parent)</option>
            </select>
            <button class="btn btn-primary btn-sm" id="btn-add-element">+ Add to ${activeNode.name}</button>
          </div>
        </div>

        <!-- Right: Element Detail -->
        <div class="se-detail-panel">
          <div class="se-detail-header">
            <div>
              <h3>${activeNode.name}</h3>
              <span class="se-type-badge ${activeNode.assessmentType}">${activeNode.assessmentType}</span>
              <span class="se-status-badge ${activeNode.status}">${activeNode.status}</span>
              ${activeNode.parentId ? `<span class="text-xs text-secondary">Parent: ${tree.nodes[activeNode.parentId]?.name || '—'}</span>` : '<span class="text-xs text-secondary">Root element</span>'}
            </div>
            <div class="se-detail-actions">
              <button class="btn btn-primary btn-sm" id="btn-assess-element">🎯 Assess This Element</button>
              ${activeNode.id !== tree.rootId ? '<button class="btn btn-danger btn-sm" id="btn-remove-element">🗑 Remove</button>' : ''}
            </div>
          </div>

          <!-- Conflict Banner -->
          <div id="se-conflict-banner"></div>

          <!-- Metric Summary -->
          <div class="se-metric-summary">
            <h4>Metric Scores</h4>
            <div class="se-metric-grid">
              ${METRICS.map(m => {
    const val = activeNode.scores?.[m.id] ?? 3;
    const isInherited = activeNode.inheritedMetrics?.[m.id];
    const isManual = activeNode.manualMetrics?.includes(m.id);
    const scoreColor = val >= 4 ? 'var(--level-comprehensive)' : val >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
    return `
                <div class="se-metric-chip ${isInherited ? 'inherited' : ''} ${isManual ? 'manual' : ''}">
                  <span class="se-metric-id">${m.id}</span>
                  <span class="se-metric-val" style="color:${scoreColor}">${val}</span>
                  ${isInherited ? '<span class="se-inherit-icon" title="Inherited from parent">↑</span>' : ''}
                  ${isManual ? '<span class="se-manual-icon" title="Manually set (protected)">🔒</span>' : ''}
                </div>`;
  }).join('')}
            </div>
          </div>

          <!-- Assessment Result Summary -->
          ${activeNode.assessmentResult ? `
          <details class="se-result-summary-details">
            <summary class="se-result-summary-header" title="Click to expand/collapse process details">
              <div class="se-result-summary-title">
                <h4>Assessment Results</h4>
                <div class="se-level-counts">
                  <span class="level-badge basic">${Object.values(activeNode.levels).filter(l => l === 'basic').length} B</span>
                  <span class="level-badge standard">${Object.values(activeNode.levels).filter(l => l === 'standard').length} S</span>
                  <span class="level-badge comprehensive">${Object.values(activeNode.levels).filter(l => l === 'comprehensive').length} C</span>
                  <span style="font-size: 10px; margin-left: 4px; color: var(--text-tertiary);">▼</span>
                </div>
              </div>
            </summary>
            <div class="se-result-summary-content">
              <table class="data-table" style="font-size: 12px; margin-top: 8px;">
                <thead>
                  <tr>
                    <th>Process</th>
                    <th>Final Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${CORE_PROCESSES.map(p => {
    const level = activeNode.levels[p.id] || 'basic';
    return `
                    <tr>
                      <td title="${p.name}">
                        <span class="process-id" style="font-size: 10px; padding: 1px 4px;">${p.id}</span> 
                        <span style="max-width: 160px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle;">${p.name}</span>
                      </td>
                      <td><span class="level-badge ${level}" style="font-size: 10px; padding: 2px 4px;">${level.toUpperCase()}</span></td>
                    </tr>`;
  }).join('')}
                </tbody>
              </table>
            </div>
          </details>` : `
          <div class="se-no-result">
            <p class="text-secondary">No assessment completed yet. Click "Assess This Element" to begin.</p>
          </div>`}

          <!-- Propagation Controls -->
          <div class="se-propagation">
            <h4>Propagation</h4>
            <div class="se-prop-actions">
              ${hasChildren ? `
              <button class="btn btn-secondary btn-sm" id="btn-propagate-down" title="Push this element's scores to children (respects manual values)">
                ⬇ Propagate Defaults Down
              </button>` : ''}
              ${parentNode && hasChildren ? `
              <button class="btn btn-secondary btn-sm" id="btn-suggest-up" title="Suggest parent defaults from MAX of children">
                ⬆ Suggest Upstream Defaults
              </button>` : ''}
              ${parentNode ? `
              <button class="btn btn-secondary btn-sm" id="btn-pull-parent" title="Pull parent's scores as defaults (respects manual values)">
                ⬇ Pull from Parent
              </button>` : ''}
            </div>
          </div>

          <!-- Children List -->
          ${hasChildren ? `
          <div class="se-children">
            <h4>Child Elements (${childNodes.length})</h4>
            <div class="se-children-list">
              ${childNodes.map(child => `
              <div class="se-child-card" data-id="${child.id}">
                <div class="se-child-info">
                  <span class="se-child-name">${child.name}</span>
                  <span class="se-type-badge ${child.assessmentType}">${child.assessmentType}</span>
                  <span class="se-status-badge ${child.status}">${child.status}</span>
                </div>
                <div class="se-child-actions">
                  <button class="btn btn-ghost btn-sm se-nav-child" data-id="${child.id}">Navigate →</button>
                </div>
              </div>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>
    `;

  // === Styles ===
  const style = document.createElement('style');
  style.textContent = `
      .se-elements-container { max-width: 1200px; margin: 0 auto; }
      .se-header { text-align: center; margin-bottom: 24px; }
      .se-breadcrumbs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 10px 14px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-subtle); }
      .se-crumb { font-size: 13px; cursor: pointer; padding: 3px 8px; border-radius: 4px; transition: all 0.2s; color: var(--text-secondary); }
      .se-crumb:hover { background: rgba(99,102,241,0.1); color: var(--text-primary); }
      .se-crumb.active { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); font-weight: 600; }
      .se-crumb-sep { color: var(--text-tertiary); font-size: 14px; }
      .se-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
      @media (max-width: 900px) { .se-layout { grid-template-columns: 1fr; } }

      .se-tree-panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; position: sticky; top: 80px; }
      .se-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .badge-count { font-size: 12px; background: rgba(99,102,241,0.15); color: var(--accent-primary-light); padding: 2px 8px; border-radius: 10px; font-weight: 700; }
      .se-tree { max-height: 400px; overflow-y: auto; margin-bottom: 16px; }

      .se-tree-node { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: all 0.15s; font-size: 13px; }
      .se-tree-node:hover { background: rgba(99,102,241,0.08); }
      .se-tree-node.active { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); font-weight: 600; }
      .se-tree-node .node-icon { font-size: 14px; opacity: 0.7; }
      .se-tree-node .node-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .se-tree-node .node-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: 600; text-transform: uppercase; }
      .se-tree-node .node-status { width: 8px; height: 8px; border-radius: 50%; }
      .node-status.draft { background: var(--text-tertiary); }
      .node-status.under_review { background: var(--accent-warning); }
      .node-status.approved { background: var(--accent-success); }
      .node-status.baselined { background: var(--accent-primary); }

      .se-add-panel { border-top: 1px solid var(--border-subtle); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }
      .se-add-panel h4 { font-size: 13px; margin-bottom: 2px; }

      .se-detail-panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; }
      .se-detail-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
      .se-detail-actions { display: flex; gap: 8px; }

      .se-type-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
      .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
      .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
      .se-status-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
      .se-status-badge.draft { background: rgba(148,163,184,0.15); color: var(--text-secondary); }
      .se-status-badge.under_review { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .se-status-badge.approved { background: rgba(52,211,153,0.15); color: #34d399; }

      .se-metric-summary { margin-bottom: 20px; }
      .se-metric-summary h4 { font-size: 14px; margin-bottom: 10px; }
      .se-metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; }
      .se-metric-chip { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--bg-tertiary); border-radius: 6px; font-size: 12px; position: relative; transition: all 0.15s; }
      .se-metric-chip.inherited { border-left: 2px solid rgba(52,211,153,0.5); }
      .se-metric-chip.manual { border-left: 2px solid rgba(245,158,11,0.5); }
      .se-metric-id { font-weight: 700; color: var(--text-secondary); font-size: 11px; }
      .se-metric-val { font-weight: 800; font-size: 15px; }
      .se-inherit-icon { font-size: 10px; color: #34d399; }
      .se-manual-icon { font-size: 10px; }

      .se-result-summary-details { margin-bottom: 20px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid rgba(99,102,241,0.1); }
      .se-result-summary-header { padding: 14px; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; user-select: none; }
      .se-result-summary-header::-webkit-details-marker { display: none; }
      .se-result-summary-title { display: flex; align-items: center; justify-content: space-between; width: 100%; }
      .se-result-summary-title h4 { font-size: 14px; margin: 0; padding: 0; color: var(--text-primary); }
      .se-result-summary-content { padding: 0 14px 14px 14px; }
      details[open] .se-result-summary-header { border-bottom: 1px dashed rgba(99,102,241,0.2); margin-bottom: 8px; }
      .se-level-counts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
      .se-no-result { padding: 20px; text-align: center; background: rgba(148,163,184,0.05); border-radius: 8px; margin-bottom: 20px; }

      .se-propagation { margin-bottom: 20px; }
      .se-propagation h4 { font-size: 14px; margin-bottom: 10px; }
      .se-prop-actions { display: flex; gap: 8px; flex-wrap: wrap; }

      .se-children { margin-bottom: 20px; }
      .se-children h4 { font-size: 14px; margin-bottom: 10px; }
      .se-children-list { display: flex; flex-direction: column; gap: 6px; }
      .se-child-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-tertiary); border-radius: 8px; transition: all 0.15s; }
      .se-child-card:hover { background: rgba(99,102,241,0.08); }
      .se-child-info { display: flex; align-items: center; gap: 8px; }
      .se-child-name { font-weight: 600; font-size: 13px; }

      .se-conflict-banner { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
      .se-conflict-title { font-weight: 700; font-size: 14px; color: var(--accent-warning); margin-bottom: 8px; }
      .se-conflict-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(245,158,11,0.15); font-size: 13px; gap: 8px; }
      .se-conflict-actions { display: flex; gap: 6px; }
      .se-conflict-bulk { display: flex; gap: 8px; margin-top: 10px; }

      .btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .btn-danger:hover { background: rgba(239,68,68,0.25); }
      .btn-accept { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
      .btn-reject { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
    `;
  container.appendChild(style);

  // === Event Handlers ===

  // Tree node click
  container.querySelectorAll('.se-tree-node').forEach(node => {
    node.addEventListener('click', () => {
      setActiveElement(node.dataset.id);
      renderSystemElements(container);
    });
  });

  // Breadcrumb navigation
  container.querySelectorAll('.se-crumb').forEach(crumb => {
    crumb.addEventListener('click', () => {
      setActiveElement(crumb.dataset.id);
      renderSystemElements(container);
    });
  });

  // Add element
  container.querySelector('#btn-add-element')?.addEventListener('click', () => {
    const nameInput = container.querySelector('#new-element-name');
    const typeSelect = container.querySelector('#new-element-type');
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Please enter an element name', 'warning');
      return;
    }
    const id = addChildElement(tree.activeId, name, typeSelect.value);
    if (id) {
      showToast(`Added "${name}" as child of "${activeNode.name}"`, 'success');
      renderSystemElements(container);
    }
  });

  // Remove element
  container.querySelector('#btn-remove-element')?.addEventListener('click', () => {
    const confirmed = confirm(`Remove "${activeNode.name}" and all its children? This cannot be undone.`);
    if (confirmed) {
      removeElement(activeNode.id);
      showToast(`Removed "${activeNode.name}"`, 'success');
      renderSystemElements(container);
    }
  });

  // Assess element — navigate to assessment view for the active element
  container.querySelector('#btn-assess-element')?.addEventListener('click', () => {
    setActiveElement(activeNode.id);
    navigateTo('assessment');
  });

  // Navigate to child
  container.querySelectorAll('.se-nav-child').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveElement(btn.dataset.id);
      renderSystemElements(container);
    });
  });

  // Propagate downstream
  container.querySelector('#btn-propagate-down')?.addEventListener('click', () => {
    let totalApplied = 0;
    let totalConflicts = [];

    for (const child of childNodes) {
      const result = propagateDownstream(activeNode, child);
      // Apply non-conflicting scores
      for (const [m, val] of Object.entries(result.applied)) {
        child.scores[m] = val;
      }
      totalApplied += Object.keys(result.applied).length;
      totalConflicts = totalConflicts.concat(
        result.conflicts.map(c => ({ ...c, childName: child.name, childId: child.id }))
      );
    }

    if (totalConflicts.length > 0) {
      showConflictBanner(container, totalConflicts, 'downstream');
    }
    showToast(`Propagated ${totalApplied} metrics to ${childNodes.length} children` +
      (totalConflicts.length ? ` (${totalConflicts.length} conflicts)` : ''), 'success');
    renderSystemElements(container);
  });

  // Pull from parent
  container.querySelector('#btn-pull-parent')?.addEventListener('click', () => {
    if (!parentNode) return;
    const result = propagateDownstream(parentNode, activeNode);
    for (const [m, val] of Object.entries(result.applied)) {
      activeNode.scores[m] = val;
    }
    if (result.conflicts.length > 0) {
      showConflictBanner(container, result.conflicts.map(c => ({
        ...c, childName: activeNode.name, childId: activeNode.id
      })), 'downstream');
    }
    showToast(`Pulled ${Object.keys(result.applied).length} metrics from parent` +
      (result.conflicts.length ? ` (${result.conflicts.length} conflicts)` : ''), 'success');
    renderSystemElements(container);
  });

  // Suggest upstream
  container.querySelector('#btn-suggest-up')?.addEventListener('click', () => {
    if (!parentNode) return;
    const result = suggestUpstream(childNodes, parentNode);
    for (const [m, val] of Object.entries(result.suggested)) {
      parentNode.scores[m] = val;
    }
    if (result.conflicts.length > 0) {
      showConflictBanner(container, result.conflicts.map(c => ({
        metric: c.metric,
        parentValue: c.parentValue,
        childValue: c.suggestedValue,
        source: 'manual',
        childName: parentNode.name,
        childId: parentNode.id,
        message: c.message
      })), 'upstream');
    }
    showToast(`Suggested ${Object.keys(result.suggested).length} metrics upstream to "${parentNode.name}"` +
      (result.conflicts.length ? ` (${result.conflicts.length} conflicts)` : ''), 'success');
    renderSystemElements(container);
  });
}

/**
 * Render tree nodes recursively as indented clickable items.
 */
function renderTreeNodes(nodes, nodeId, activeId, depth) {
  const node = nodes[nodeId];
  if (!node) return '';

  const indent = depth * 16;
  const isActive = nodeId === activeId;
  const hasChildren = node.childIds && node.childIds.length > 0;
  const icon = hasChildren ? '📂' : '📄';

  let html = `
    <div class="se-tree-node ${isActive ? 'active' : ''}" data-id="${nodeId}" style="padding-left: ${indent + 8}px">
      <span class="node-icon">${icon}</span>
      <span class="node-name">${node.name}</span>
      <span class="node-status ${node.status}" title="${node.status}"></span>
    </div>`;

  if (hasChildren) {
    for (const childId of node.childIds) {
      html += renderTreeNodes(nodes, childId, activeId, depth + 1);
    }
  }

  return html;
}

/**
 * Show conflict resolution banner.
 */
function showConflictBanner(container, conflicts, direction) {
  const banner = container.querySelector('#se-conflict-banner');
  if (!banner || conflicts.length === 0) return;

  const dirLabel = direction === 'downstream' ? 'Downstream Propagation' : 'Upstream Suggestion';

  banner.innerHTML = `
    <div class="se-conflict-banner">
      <div class="se-conflict-title">⚠ ${dirLabel} — ${conflicts.length} Conflict(s) Detected</div>
      <p class="text-xs text-secondary mb-md">These metrics have manually-set values that differ from the proposed propagation. Choose how to resolve each conflict.</p>
      ${conflicts.map((c, i) => `
      <div class="se-conflict-item" id="conflict-${i}">
        <div>
          <strong>${c.metric}</strong>: Current manual value = <strong>${c.childValue ?? c.parentValue}</strong>,
          Proposed = <strong>${c.parentValue ?? c.childValue}</strong>
          ${c.childName ? `(${c.childName})` : ''}
        </div>
        <div class="se-conflict-actions">
          <button class="btn-accept" data-idx="${i}" data-action="accept">Accept</button>
          <button class="btn-reject" data-idx="${i}" data-action="reject">Keep Manual</button>
        </div>
      </div>`).join('')}
      <div class="se-conflict-bulk">
        <button class="btn btn-sm btn-secondary" id="btn-accept-all">Accept All</button>
        <button class="btn btn-sm btn-secondary" id="btn-reject-all">Keep All Manual</button>
      </div>
    </div>`;

  // Per-conflict resolution
  banner.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const conflict = conflicts[idx];
      const node = getState().assessmentTree.nodes[conflict.childId];
      if (btn.dataset.action === 'accept' && node) {
        node.scores[conflict.metric] = direction === 'downstream'
          ? conflict.parentValue : conflict.childValue;
        // Remove from manual since user accepted override
        node.manualMetrics = node.manualMetrics.filter(m => m !== conflict.metric);
      }
      const item = banner.querySelector(`#conflict-${idx}`);
      if (item) item.style.opacity = '0.3';
      item.querySelector('[data-action="accept"]')?.setAttribute('disabled', 'true');
      item.querySelector('[data-action="reject"]')?.setAttribute('disabled', 'true');
    });
  });

  // Bulk actions
  banner.querySelector('#btn-accept-all')?.addEventListener('click', () => {
    for (const c of conflicts) {
      const node = getState().assessmentTree.nodes[c.childId];
      if (node) {
        node.scores[c.metric] = direction === 'downstream' ? c.parentValue : c.childValue;
        node.manualMetrics = node.manualMetrics.filter(m => m !== c.metric);
      }
    }
    showToast('Accepted all propagated values', 'success');
    renderSystemElements(container);
  });

  banner.querySelector('#btn-reject-all')?.addEventListener('click', () => {
    showToast('Kept all manual values', 'info');
    banner.innerHTML = '';
  });
}

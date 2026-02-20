/**
 * Vee Model View — SVG lifecycle diagram with process nodes
 */
import { VEE_PROCESS_MAP, VEE_HORIZONTAL_LINKS, VEE_MGMT_PROCESSES, VEE_PHASES, CORE_PROCESSES, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { navigateTo } from '../router.js';

export function renderVeeModel(container) {
  const state = getState();
  const W = 1000, H = 600;
  const OFFSET_Y = 120; // push vee down to make room for mgmt

  function nodeColor(pid) {
    const lvl = state.levels[pid];
    if (lvl) return FRAMEWORK_META.levelColors[lvl];
    const p = CORE_PROCESSES.find(x => x.id === pid);
    return p?.group === 'tech_mgmt' ? '#6366f1' : '#22d3ee';
  }

  // Build Vee path points
  const veePoints = VEE_PROCESS_MAP.map(n => ({
    ...n,
    cx: n.x / 100 * W,
    cy: n.y / 100 * (H - OFFSET_Y) + OFFSET_Y
  }));

  const mgmtNodes = VEE_MGMT_PROCESSES.map(n => {
    // Row 1: y: -8 -> OFFSET_Y - 40 = 80
    // Row 2: y: -16 -> OFFSET_Y - 90 = 30
    const py = n.y === -8 ? 85 : 35;
    return {
      ...n,
      cx: n.x / 100 * W,
      cy: py,
      row: n.y === -8 ? 1 : 2
    };
  });

  // SVG Vee Path
  const pathD = veePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');

  // Horizontal links
  const hLinks = VEE_HORIZONTAL_LINKS.map(link => {
    const from = veePoints.find(p => p.processId === link.from);
    const to = veePoints.find(p => p.processId === link.to);
    if (!from || !to) return '';
    return `<line x1="${from.cx}" y1="${from.cy}" x2="${to.cx}" y2="${to.cy}" stroke="rgba(244,114,182,0.3)" stroke-width="1.5" stroke-dasharray="6 4" class="flow-arrow">
      <title>${link.label}</title>
    </line>`;
  }).join('');

  container.innerHTML = `
    <div class="vee-header">
      <h2>📐 Vee Model Lifecycle View</h2>
      <p class="text-secondary text-sm">Click any process node to explore details. Colors indicate current tailoring levels.</p>
      <div class="vee-legend flex gap-lg mt-md">
        ${Object.entries(FRAMEWORK_META.levelLabels).map(([k, v]) => `
          <div class="flex items-center gap-sm text-sm">
            <div style="width:12px;height:12px;border-radius:50%;background:${FRAMEWORK_META.levelColors[k]}"></div>
            <span>${v}</span>
          </div>`).join('')}
        <div class="flex items-center gap-sm text-sm">
          <div style="width:12px;height:12px;border-radius:50%;background:#6366f1;opacity:0.5"></div>
          <span>Not assessed</span>
        </div>
      </div>
    </div>
    <div class="vee-svg-container card mt-lg">
      <svg viewBox="0 0 ${W} ${H}" class="vee-svg" id="vee-svg">
        <!-- Vee path -->
        <path d="${pathD}" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="3" stroke-linecap="round"/>
        <!-- Horizontal V&V links -->
        ${hLinks}
        <!-- Management layer background -->
        <rect x="20" y="10" width="${W - 40}" height="${OFFSET_Y - 20}" rx="12" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.1)" stroke-width="1"/>
        <text x="50" y="30" fill="rgba(99,102,241,0.4)" font-size="11" font-weight="600">TECHNICAL MANAGEMENT</text>
        <!-- Management process nodes -->
        ${mgmtNodes.map(n => `
          <g class="vee-node" data-pid="${n.processId}" style="cursor:pointer">
            <circle cx="${n.cx}" cy="${n.cy}" r="16" fill="${nodeColor(n.processId)}" opacity="0.2" stroke="${nodeColor(n.processId)}" stroke-width="1.5"/>
            <circle cx="${n.cx}" cy="${n.cy}" r="11" fill="${nodeColor(n.processId)}" opacity="0.8"/>
            <text x="${n.cx}" y="${n.cy + 4}" text-anchor="middle" fill="white" font-size="9" font-weight="700">${n.processId}</text>
            <text x="${n.cx}" y="${n.cy + (n.row === 1 ? 28 : -22)}" text-anchor="middle" fill="var(--text-secondary)" font-size="9">${n.label}</text>
          </g>
        `).join('')}
        <!-- Phase labels -->
        <text x="${W * 0.15}" y="${OFFSET_Y + 10}" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Definition & Decomposition</text>
        <text x="${W * 0.85}" y="${OFFSET_Y + 10}" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Integration & Verification</text>
        <text x="${W * 0.5}" y="${H - 10}" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Implementation</text>
        <!-- Technical process nodes -->
        ${veePoints.map(n => `
          <g class="vee-node" data-pid="${n.processId}" style="cursor:pointer">
            <circle cx="${n.cx}" cy="${n.cy}" r="22" fill="${nodeColor(n.processId)}" opacity="0.15" stroke="${nodeColor(n.processId)}" stroke-width="2"/>
            <circle cx="${n.cx}" cy="${n.cy}" r="15" fill="${nodeColor(n.processId)}" opacity="0.9"/>
            <text x="${n.cx}" y="${n.cy + 4}" text-anchor="middle" fill="white" font-size="10" font-weight="700">${n.processId}</text>
            <text x="${n.cx}" y="${n.cy - 28}" text-anchor="middle" fill="var(--text-primary)" font-size="10" font-weight="500">${n.label}</text>
          </g>
        `).join('')}
        <!-- Vee arrows along path segments -->
        ${veePoints.slice(0, -1).map((p, i) => {
    const next = veePoints[i + 1];
    const mx = (p.cx + next.cx) / 2, my = (p.cy + next.cy) / 2;
    return `<line x1="${p.cx}" y1="${p.cy}" x2="${next.cx}" y2="${next.cy}" stroke="rgba(99,102,241,0.12)" stroke-width="1.5" marker-end="none"/>`;
  }).join('')}
      </svg>
    </div>
    <div id="vee-tooltip" class="vee-tooltip" style="display:none"></div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .vee-header { text-align: center; }
    .vee-legend { justify-content: center; flex-wrap: wrap; }
    .vee-svg-container { padding: 24px; overflow: auto; }
    .vee-svg { width: 100%; max-height: 70vh; }
    .vee-node:hover circle { filter: brightness(1.3); }
    .vee-node:hover text { fill: white !important; }
    .vee-tooltip { position: fixed; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: 10px; padding: 12px 16px; font-size: 13px; box-shadow: var(--shadow-lg); z-index: 100; pointer-events: none; max-width: 280px; }
  `;
  container.appendChild(style);

  // Click to navigate to process detail
  container.querySelectorAll('.vee-node').forEach(node => {
    node.addEventListener('click', () => {
      const pid = parseInt(node.dataset.pid);
      navigateTo('processes');
      setTimeout(() => document.dispatchEvent(new CustomEvent('selectProcess', { detail: pid })), 100);
    });
    // Tooltip
    node.addEventListener('mouseenter', (e) => {
      const pid = parseInt(node.dataset.pid);
      const p = CORE_PROCESSES.find(x => x.id === pid);
      const lvl = state.levels[pid];
      const tip = document.getElementById('vee-tooltip');
      tip.innerHTML = `<strong>${p?.name}</strong><br><span class="text-secondary">${p?.purpose || ''}</span>${lvl ? `<br><span class="level-badge ${lvl}" style="margin-top:6px">${FRAMEWORK_META.levelLabels[lvl]}</span>` : ''}`;
      tip.style.display = 'block';
      tip.style.left = e.clientX + 16 + 'px';
      tip.style.top = e.clientY + 16 + 'px';
    });
    node.addEventListener('mouseleave', () => {
      document.getElementById('vee-tooltip').style.display = 'none';
    });
  });
}

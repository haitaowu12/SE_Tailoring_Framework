import { CORE_PROCESSES, ACTIVE_CONSISTENCY_RULES, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { escapeHtml } from './safe-text.js';
import { processDetailsHref } from '../router.js';

const levelKeys = ['basic', 'standard', 'comprehensive'];
const processName = id => CORE_PROCESSES.find(process => process.id === id)?.name || `Process ${id}`;
const levelName = level => FRAMEWORK_META.levelLabels[level] || 'Unassessed';

/** Present the engine's direct effects without modifying, extending or applying them. */
export function renderDependencyPreview({ processId, proposedLevel, changes, levels = {} }) {
    const source = `<div class="dependency-origin"><span class="text-sm text-secondary">Your proposed change</span><h3>${escapeHtml(processName(processId))}</h3><span class="level-badge ${proposedLevel}">${escapeHtml(levelName(proposedLevel))}</span></div>`;
    if (!changes.length) return `${source}<div class="sim-result text-sm text-secondary">No directly affected processes for this change. Run the full assessment to check the whole profile and all required dependencies.</div><a class="dependency-next" href="#assessment">Return to assessment →</a>`;

    const processCount = new Set(changes.map(change => change.processId)).size;
    const effects = changes.map(change => {
        const assessed = levelKeys.includes(levels[change.processId]);
        const rule = ACTIVE_CONSISTENCY_RULES.find(item => String(item.id) === String(change.ruleId));
        const kind = change.type === 'mandatory' ? 'mandatory' : 'recommended';
        const current = assessed ? levelName(change.from) : 'Unassessed';
        const ticks = levelKeys.map(level => `<span class="dependency-level${assessed && level === change.from ? ' is-current' : ''}${level === change.to ? ' is-target' : ''}"><span>${levelName(level)}</span><small>${level === change.to ? 'Proposed' : assessed && level === change.from ? 'Current' : ' '}</small></span>`).join('');
        return `<li class="dependency-effect ${kind}"><div class="dependency-effect-heading"><h4><a href="${processDetailsHref(change.processId, change.to, 'interdependency')}">${escapeHtml(processName(change.processId))}</a></h4><span class="prop-type ${kind}">${kind}</span></div><p class="text-sm">${escapeHtml(current)} → <strong>${escapeHtml(levelName(change.to))}</strong> <span class="text-secondary">· Direct dependency · Rule ${escapeHtml(String(change.ruleId))}</span></p><div class="dependency-levels" aria-hidden="true">${ticks}</div>${!assessed ? '<p class="text-sm text-secondary">The preview uses Basic where no current level is recorded.</p>' : ''}${rule ? `<p class="text-sm text-secondary dependency-reason">${escapeHtml(rule.rationale)}</p>` : ''}</li>`;
    }).join('');
    return `<div class="dependency-preview">${source}<div class="dependency-outcomes"><p class="dependency-count">${changes.length} direct rule effect${changes.length === 1 ? '' : 's'} across ${processCount} process${processCount === 1 ? '' : 'es'}</p><ol class="dependency-effects">${effects}</ol></div></div><p class="text-sm text-secondary mt-md">These are direct effects only. Your assessment is unchanged; the full assessment also follows further required dependencies.</p><a class="dependency-next" href="#assessment">Return to assessment →</a>`;
}

/**
 * Export/Import — Configuration management (JSON)
 */
import { renderDimensionPatternCards, renderMetricSpiderwebSvg } from './report-visuals.js';
import { escapeHtml, safeText } from './safe-text.js';

const VALID_METRIC_IDS = new Set(Array.from({ length: 16 }, (_, index) => `M${index + 1}`));
const VALID_PROCESS_IDS = new Set(Array.from({ length: 22 }, (_, index) => String(index + 9)));
const VALID_LEVELS = new Set(['basic', 'standard', 'comprehensive']);
const VALID_ASSESSMENT_TYPES = new Set(['full', 'quick', 'inherited']);
const VALID_ELEMENT_STATUSES = new Set(['draft', 'under_review', 'approved', 'baselined']);
const VALID_MATRIX_ROLES = new Set(['P', 'S']);
const VALID_SA_TIERS = new Set(['I', 'II', 'III']);

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateLevelMap(map, fieldName, errors) {
    if (!isPlainObject(map)) return;
    for (const [processId, level] of Object.entries(map)) {
        if (!VALID_PROCESS_IDS.has(String(processId))) {
            if (fieldName === 'processLevels') errors.push(`Unknown process id: ${processId}`);
            else if (fieldName === 'derivedLevels') errors.push(`Unknown derived process id: ${processId}`);
            else errors.push(`${fieldName} has unknown process id: ${processId}`);
        }
        if (!VALID_LEVELS.has(level)) {
            if (fieldName === 'processLevels') errors.push(`Invalid level for process ${processId}: ${level}`);
            else if (fieldName === 'derivedLevels') errors.push(`Invalid derived level for process ${processId}: ${level}`);
            else errors.push(`${fieldName} has invalid level for process ${processId}: ${level}`);
        }
    }
}

function validateMatrixMap(matrixMap, errors) {
    if (!isPlainObject(matrixMap)) return;
    for (const [processId, metricMap] of Object.entries(matrixMap)) {
        if (!VALID_PROCESS_IDS.has(String(processId))) errors.push(`matrixMap has unknown process id: ${processId}`);
        if (!isPlainObject(metricMap)) {
            errors.push(`matrixMap[${processId}] must be an object`);
            continue;
        }
        for (const [metricId, role] of Object.entries(metricMap)) {
            if (!VALID_METRIC_IDS.has(metricId)) errors.push(`matrixMap[${processId}] has unknown metric id: ${metricId}`);
            if (!VALID_MATRIX_ROLES.has(role)) errors.push(`matrixMap[${processId}][${metricId}] must be P or S`);
        }
    }
}

function validateManualAdjustments(manualAdjustments, fieldName, errors) {
    if (!isPlainObject(manualAdjustments)) return;
    for (const [processId, adjustment] of Object.entries(manualAdjustments)) {
        if (!VALID_PROCESS_IDS.has(String(processId))) errors.push(`${fieldName} has unknown process id: ${processId}`);
        if (!isPlainObject(adjustment)) {
            errors.push(`${fieldName}[${processId}] must be an object`);
            continue;
        }
        if (!VALID_LEVELS.has(adjustment.level)) errors.push(`${fieldName}[${processId}] has invalid level`);
        if (adjustment.justification !== undefined && typeof adjustment.justification !== 'string') {
            errors.push(`${fieldName}[${processId}] justification must be a string`);
        }
    }
}

function clonePlain(value, fallback) {
    if (value === undefined || value === null) return fallback;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return fallback;
    }
}

function normalizeManualAdjustments(manualAdjustments = {}) {
    if (!isPlainObject(manualAdjustments)) return {};
    const normalized = {};
    for (const [processId, adjustment] of Object.entries(manualAdjustments)) {
        if (!VALID_PROCESS_IDS.has(String(processId)) || !isPlainObject(adjustment)) continue;
        const level = adjustment.level || adjustment.to;
        if (!VALID_LEVELS.has(level)) continue;
        normalized[processId] = {
            level,
            justification: typeof adjustment.justification === 'string' ? adjustment.justification : ''
        };
    }
    return normalized;
}

export function applyManualAdjustmentsToLevels(levels = {}, ...adjustmentMaps) {
    const finalLevels = { ...levels };
    for (const adjustments of adjustmentMaps) {
        const normalized = normalizeManualAdjustments(adjustments);
        for (const [processId, adjustment] of Object.entries(normalized)) {
            finalLevels[processId] = adjustment.level;
        }
    }
    return finalLevels;
}

function buildLegacyAssessmentResult(config, finalLevels) {
    return {
        derived: config.derivedLevels || {},
        derivationDetails: config.derivationDetails || {},
        levels: finalLevels,
        overrides: config.overrides || [],
        violations: config.violations || [],
        fixes: config.fixes || [],
        rightSizingActions: config.rightSizingActions || [],
        adoptionRisks: config.adoptionRisks || [],
        tradeoffs: config.tradeoffs || [],
        saTier: config.saTier || null,
        indices: config.indices || {},
        confidence: config.confidence || {}
    };
}

function makeDefaultAssessmentTree(config, finalLevels, manualAdjustments) {
    const assessmentComplete = config.assessmentComplete ?? Object.keys(config.metricScores || {}).length > 0;
    const assessmentResult = assessmentComplete
        ? buildLegacyAssessmentResult(config, finalLevels)
        : null;

    return {
        rootId: 'default',
        activeId: 'default',
        nodes: {
            default: {
                id: 'default',
                name: 'Program / SoS',
                parentId: null,
                childIds: [],
                assessmentType: 'full',
                inheritedMetrics: {},
                overriddenMetrics: {},
                downTailoringLog: [],
                status: assessmentResult ? 'under_review' : 'draft',
                scores: { ...(config.metricScores || {}) },
                levels: { ...finalLevels },
                manualMetrics: [],
                assessmentResult,
                hasIndependentSafetyAnalysis: false,
                manualAdjustments
            }
        }
    };
}

export function normalizeImportedConfig(config, fallbackTree = null) {
    const manualAdjustments = normalizeManualAdjustments(config.manualAdjustments || {});
    const finalLevels = applyManualAdjustmentsToLevels(config.processLevels || {}, manualAdjustments);
    const assessmentTree = clonePlain(config.assessmentTree, null)
        || clonePlain(fallbackTree, null)
        || makeDefaultAssessmentTree(config, finalLevels, manualAdjustments);
    const rootId = assessmentTree.rootId || 'default';
    const rootNode = assessmentTree.nodes?.[rootId];

    if (rootNode) {
        rootNode.scores = rootNode.scores && Object.keys(rootNode.scores).length
            ? rootNode.scores
            : { ...(config.metricScores || {}) };
        rootNode.levels = applyManualAdjustmentsToLevels(
            Object.keys(rootNode.levels || {}).length ? rootNode.levels : finalLevels,
            manualAdjustments,
            rootNode.manualAdjustments || {}
        );
        rootNode.manualAdjustments = {
            ...manualAdjustments,
            ...normalizeManualAdjustments(rootNode.manualAdjustments || {})
        };

        const importedComplete = config.assessmentComplete ?? Object.keys(config.metricScores || {}).length > 0;
        if (importedComplete && !rootNode.assessmentResult) {
            rootNode.assessmentResult = buildLegacyAssessmentResult(config, rootNode.levels);
            rootNode.status = rootNode.status === 'draft' ? 'under_review' : (rootNode.status || 'under_review');
        }
    }

    return {
        projectInfo: { ...(config.projectInfo || {}) },
        scores: config.metricScores || {},
        saResponses: config.saResponses || {},
        levels: rootNode?.levels || finalLevels,
        derived: config.derivedLevels || {},
        derivationDetails: config.derivationDetails || {},
        overrides: config.overrides || [],
        violations: config.violations || [],
        fixes: config.fixes || [],
        rightSizingActions: config.rightSizingActions || [],
        adoptionRisks: config.adoptionRisks || [],
        manualAdjustments,
        tradeoffs: config.tradeoffs || [],
        matrixMap: config.matrixMap || null,
        assessmentTree,
        cultureType: config.cultureType || null,
        saTier: config.saTier || null,
        indices: config.indices || {},
        notes: config.notes || '',
        confidence: config.confidence || {},
        deliverablesChecked: config.deliverablesChecked || [],
        assessmentComplete: config.assessmentComplete ?? Object.keys(config.metricScores || {}).length > 0
    };
}

export function buildExportConfig(state) {
    return {
        _format: 'se-tailoring-config',
        _version: '1.1',
        _exported: new Date().toISOString(),
        projectInfo: state.projectInfo || {},
        metricScores: state.scores || {},
        saResponses: state.saResponses || {},
        processLevels: state.levels || {},
        derivedLevels: state.derived || {},
        derivationDetails: state.derivationDetails || {},
        overrides: state.overrides || [],
        violations: state.violations || [],
        fixes: state.fixes || [],
        rightSizingActions: state.rightSizingActions || [],
        adoptionRisks: state.adoptionRisks || [],
        manualAdjustments: state.manualAdjustments || {},
        tradeoffs: state.tradeoffs || [],
        matrixMap: state.matrixMap || null,
        assessmentTree: state.assessmentTree || null,
        cultureType: state.cultureType || null,
        saTier: state.saTier || null,
        indices: state.indices || {},
        confidence: state.confidence || {},
        assessmentComplete: !!state.assessmentComplete,
        deliverablesChecked: state.deliverablesChecked || [],
        notes: state.notes || ''
    };
}

/** Export current state as JSON */
export function exportConfig(state) {
    const config = buildExportConfig(state);

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `se-tailoring-${(state.projectInfo?.name || 'config').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Import config from JSON file */
export function importConfig(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                const validation = validateConfig(config);
                if (!validation.valid) {
                    reject(new Error(`Invalid config: ${validation.errors.join(', ')}`));
                    return;
                }
                resolve(config);
            } catch (err) {
                reject(new Error(`Failed to parse JSON: ${err.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/** Validate config structure */
export function validateConfig(config) {
    const errors = [];
    if (!isPlainObject(config)) {
        return { valid: false, errors: ['Config must be a JSON object'] };
    }

    if (config._format !== 'se-tailoring-config') errors.push('Invalid format identifier');
    if (!isPlainObject(config.metricScores)) errors.push('Missing metricScores');
    if (!isPlainObject(config.processLevels)) errors.push('Missing processLevels');
    if (config.projectInfo !== undefined && !isPlainObject(config.projectInfo)) {
        errors.push('projectInfo must be an object');
    }

    if (isPlainObject(config.metricScores)) {
        for (const [k, v] of Object.entries(config.metricScores)) {
            if (!VALID_METRIC_IDS.has(k)) errors.push(`Unknown metric id: ${k}`);
            if (typeof v !== 'number' || v < 1 || v > 5) errors.push(`Invalid score for ${k}: ${v}`);
        }
    }

    if (isPlainObject(config.processLevels)) {
        validateLevelMap(config.processLevels, 'processLevels', errors);
    }

    for (const field of ['saResponses', 'derivedLevels', 'manualAdjustments', 'derivationDetails', 'matrixMap', 'assessmentTree', 'saTier', 'indices', 'confidence']) {
        if (config[field] !== undefined && config[field] !== null && !isPlainObject(config[field])) {
            errors.push(`${field} must be an object`);
        }
    }

    for (const field of ['overrides', 'violations', 'fixes', 'rightSizingActions', 'adoptionRisks', 'tradeoffs', 'deliverablesChecked']) {
        if (config[field] !== undefined && !Array.isArray(config[field])) {
            errors.push(`${field} must be an array`);
        }
    }

    if (Array.isArray(config.overrides)) {
        config.overrides.forEach((override, index) => {
            if (!isPlainObject(override)) {
                errors.push(`overrides[${index}] must be an object`);
                return;
            }
            if (override.processId !== undefined && !VALID_PROCESS_IDS.has(String(override.processId))) errors.push(`overrides[${index}] has invalid processId`);
            if (override.from !== undefined && !VALID_LEVELS.has(override.from)) errors.push(`overrides[${index}] has invalid from level`);
            if (override.to !== undefined && !VALID_LEVELS.has(override.to)) errors.push(`overrides[${index}] has invalid to level`);
        });
    }

    if (Array.isArray(config.fixes)) {
        config.fixes.forEach((fix, index) => {
            if (!isPlainObject(fix)) {
                errors.push(`fixes[${index}] must be an object`);
                return;
            }
            if (fix.processId !== undefined && !VALID_PROCESS_IDS.has(String(fix.processId))) errors.push(`fixes[${index}] has invalid processId`);
            if (fix.from !== undefined && !VALID_LEVELS.has(fix.from)) errors.push(`fixes[${index}] has invalid from level`);
            if (fix.to !== undefined && !VALID_LEVELS.has(fix.to)) errors.push(`fixes[${index}] has invalid to level`);
        });
    }

    if (Array.isArray(config.violations)) {
        config.violations.forEach((violation, index) => {
            if (!isPlainObject(violation)) {
                errors.push(`violations[${index}] must be an object`);
                return;
            }
            if (violation.affectedProcess !== undefined && !VALID_PROCESS_IDS.has(String(violation.affectedProcess))) errors.push(`violations[${index}] has invalid affectedProcess`);
            if (violation.currentLevel !== undefined && !VALID_LEVELS.has(violation.currentLevel)) errors.push(`violations[${index}] has invalid currentLevel`);
            if (violation.requiredLevel !== undefined && !VALID_LEVELS.has(violation.requiredLevel)) errors.push(`violations[${index}] has invalid requiredLevel`);
        });
    }

    if (Array.isArray(config.deliverablesChecked) && config.deliverablesChecked.some(key => typeof key !== 'string' || key.length > 80)) {
        errors.push('deliverablesChecked must contain short string keys');
    }

    if (config.assessmentComplete !== undefined && typeof config.assessmentComplete !== 'boolean') {
        errors.push('assessmentComplete must be a boolean');
    }

    if (isPlainObject(config.derivedLevels)) {
        validateLevelMap(config.derivedLevels, 'derivedLevels', errors);
    }

    validateMatrixMap(config.matrixMap, errors);
    validateManualAdjustments(config.manualAdjustments, 'manualAdjustments', errors);

    if (isPlainObject(config.saTier)) {
        if (!VALID_SA_TIERS.has(config.saTier.tier)) errors.push('saTier has invalid tier');
        if (config.saTier.name !== undefined && (typeof config.saTier.name !== 'string' || config.saTier.name.length > 80)) errors.push('saTier has invalid name');
        if (config.saTier.description !== undefined && (typeof config.saTier.description !== 'string' || config.saTier.description.length > 240)) errors.push('saTier has invalid description');
        if (config.saTier.floor !== null && config.saTier.floor !== undefined && !VALID_LEVELS.has(config.saTier.floor)) {
            errors.push('saTier has invalid floor');
        }
        if (config.saTier.score !== undefined && (typeof config.saTier.score !== 'number' || config.saTier.score < 1 || config.saTier.score > 5)) {
            errors.push('saTier has invalid score');
        }
    }

    if (isPlainObject(config.confidence)) {
        const validConfidence = new Set(['high', 'corroborated', 'available-with-justification', 'floor-applied']);
        for (const [k, v] of Object.entries(config.confidence)) {
            if (!VALID_PROCESS_IDS.has(String(k))) errors.push(`Unknown confidence process id: ${k}`);
            if (!validConfidence.has(v)) errors.push(`Invalid confidence value for process ${k}: ${v}`);
        }
    }

    if (isPlainObject(config.assessmentTree)) {
        const { rootId, activeId, nodes } = config.assessmentTree;
        if (typeof rootId !== 'string' || typeof activeId !== 'string' || !isPlainObject(nodes)) {
            errors.push('assessmentTree must include rootId, activeId, and nodes object');
        } else {
            if (!nodes[rootId]) errors.push('assessmentTree rootId must reference an existing node');
            if (!nodes[activeId]) errors.push('assessmentTree activeId must reference an existing node');
            for (const [id, node] of Object.entries(nodes)) {
                if (!isPlainObject(node)) {
                    errors.push(`assessmentTree node ${id} must be an object`);
                    continue;
                }
                if (node.id !== undefined && node.id !== id) errors.push(`assessmentTree node ${id} has mismatched id`);
                if (typeof node.name !== 'string' || node.name.length > 200) errors.push(`assessmentTree node ${id} has invalid name`);
                if (node.assessmentType !== undefined && !VALID_ASSESSMENT_TYPES.has(node.assessmentType)) errors.push(`assessmentTree node ${id} has invalid assessmentType`);
                if (node.status !== undefined && !VALID_ELEMENT_STATUSES.has(node.status)) errors.push(`assessmentTree node ${id} has invalid status`);
                if (node.childIds !== undefined && (!Array.isArray(node.childIds) || node.childIds.some(childId => typeof childId !== 'string'))) {
                    errors.push(`assessmentTree node ${id} childIds must be an array of strings`);
                }
                if (Array.isArray(node.childIds)) {
                    node.childIds.forEach(childId => {
                        if (!nodes[childId]) errors.push(`assessmentTree node ${id} references missing child ${childId}`);
                    });
                }
                if (node.parentId !== undefined && node.parentId !== null && !nodes[node.parentId]) {
                    errors.push(`assessmentTree node ${id} references missing parent`);
                }
                validateLevelMap(node.levels, `assessmentTree node ${id} levels`, errors);
                validateManualAdjustments(node.manualAdjustments, `assessmentTree node ${id} manualAdjustments`, errors);
                if (node.scores !== undefined) {
                    if (!isPlainObject(node.scores)) {
                        errors.push(`assessmentTree node ${id} scores must be an object`);
                    } else {
                        for (const [metricId, score] of Object.entries(node.scores)) {
                            if (!VALID_METRIC_IDS.has(metricId)) errors.push(`assessmentTree node ${id} has unknown metric ${metricId}`);
                            if (typeof score !== 'number' || score < 1 || score > 5) errors.push(`assessmentTree node ${id} has invalid score for ${metricId}`);
                        }
                    }
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/** Generate HTML report */
export function generateReport(state, data) {
    const {
        projectInfo = {},
        scores = {},
        levels = {},
        derived = {},
        derivationDetails = {},
        overrides = [],
        violations = [],
        confidence = {},
        adoptionRisks = []
    } = state;
    const safeScores = scores || {};
    const safeLevels = levels || {};
    const safeDerived = derived || {};
    const safeDerivationDetails = derivationDetails || {};
    const safeConfidence = confidence || {};
    const processMap = {};
    data.CORE_PROCESSES.forEach(p => processMap[p.id] = p);
    const metricMap = {};
    data.METRICS.forEach(m => metricMap[m.id] = m);

    const levelClass = l => l === 'comprehensive' ? 'color:#ef4444' : l === 'standard' ? 'color:#f59e0b' : 'color:#3b82f6';

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const projectName = safeText(projectInfo.name, 'Project');
    const projectDate = safeText(projectInfo.date, now);
    const projectTeam = safeText(projectInfo.team, '—');
    const projectPhase = safeText(projectInfo.phase, '—');

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SE Tailoring Report - ${escapeHtml(projectName)}</title>
<style>
body{font-family:Inter,-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.6}
h1{color:#4f46e5;border-bottom:3px solid #6366f1;padding-bottom:10px}
h2{color:#6366f1;margin-top:30px}
table{width:100%;border-collapse:collapse;margin:15px 0}
th{background:#f1f5f9;padding:8px 12px;text-align:left;font-size:13px;border-bottom:2px solid #e2e8f0}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase}
.basic{background:#dbeafe;color:#2563eb}
.standard{background:#fef3c7;color:#d97706}
.comprehensive{background:#fee2e2;color:#dc2626}
.override{background:#fef3c7;border-left:3px solid #f59e0b;padding:8px 12px;margin:5px 0;font-size:13px}
.violation{background:#fee2e2;border-left:3px solid #ef4444;padding:8px 12px;margin:5px 0;font-size:13px}
.info{background:#f0f9ff;border-left:3px solid #3b82f6;padding:8px 12px;margin:10px 0;font-size:13px}
.scope-note{background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 12px;margin:16px 0;font-size:12px;color:#475569}
.report-overview-panel{border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:24px 0;background:#f8fafc}
.spiderweb-figure{display:grid;grid-template-columns:260px 1fr;gap:18px;align-items:center;margin:0}
.spiderweb-copy h4{margin:0 0 6px;color:#1e293b}
.spiderweb-copy p,.spiderweb-figure figcaption{font-size:12px;color:#64748b;margin:0}
.spiderweb-chart{width:100%;max-width:460px}
.spiderweb-quadrant{fill:#ffffff}
.spiderweb-quadrant.q1{fill:#fff1f2}.spiderweb-quadrant.q2{fill:#fffbeb}.spiderweb-quadrant.q3{fill:#f0fdfa}.spiderweb-quadrant.q4{fill:#faf5ff}
.spiderweb-quadrant-line,.spiderweb-axis{stroke:#cbd5e1;stroke-width:1}
.spiderweb-ring{fill:none;stroke:#cbd5e1;stroke-width:1}.spiderweb-ring-mid{stroke:#64748b;stroke-width:1.4}
.spiderweb-profile{fill:rgba(14,165,233,.16);stroke:#0f766e;stroke-width:2}
.spiderweb-point{fill:#0f766e;stroke:#fff;stroke-width:2}.spiderweb-metric-label,.spiderweb-scale-label{fill:#475569;font-size:11px;font-weight:700}.spiderweb-dimension-label{fill:#334155;font-size:12px;font-weight:800}
.dimension-pattern-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
.dimension-pattern-card{border-top:3px solid var(--dimension-color);background:#fff;border-radius:8px;padding:10px}
.dimension-pattern-heading{font-size:12px;font-weight:700;color:#334155}.dimension-pattern-range{font-size:24px;font-weight:900;color:var(--dimension-color);line-height:1.1}.dimension-pattern-meta,.dimension-pattern-drivers{font-size:11px;color:#64748b}.dimension-pattern-drivers{display:flex;flex-direction:column;margin-top:5px}
@media print{body{padding:20px}h1{font-size:24px}}
@media (max-width:720px){.spiderweb-figure{grid-template-columns:1fr}.dimension-pattern-grid{grid-template-columns:1fr 1fr}}
</style></head><body>
<h1>SE Process Tailoring Report</h1>
<div class="info"><strong>Framework</strong>: SE Tailoring Model v${data.FRAMEWORK_META.version} (ISO/IEC/IEEE 15288:2023)</div>
<div class="scope-note"><strong>Scope and evidence maturity:</strong> This executable assessment covers 22 project-facing Technical and Technical Management processes. Agreement and Organizational Project-Enabling processes are reference scope unless explicitly reviewed. Current evidence supports structured decision aid use; empirical project-outcome effectiveness is not yet demonstrated.</div>
<table><tr><td><strong>Project</strong>: ${escapeHtml(projectName)}</td><td><strong>Date</strong>: ${escapeHtml(projectDate)}</td></tr>
<tr><td><strong>Team</strong>: ${escapeHtml(projectTeam)}</td><td><strong>Phase</strong>: ${escapeHtml(projectPhase)}</td></tr></table>

<h2>Assessment Overview</h2>
<div class="report-overview-panel">
    ${renderMetricSpiderwebSvg(safeScores, data.METRICS, data.DIMENSIONS, {
    title: 'Assessment overview',
    description: 'Sixteen metric scores plotted across four framework dimensions.'
})}
<div class="dimension-pattern-grid">
${renderDimensionPatternCards(scores, data.METRICS, data.DIMENSIONS)}
</div>
</div>

<h2>Metric Scores</h2><table><tr><th>Metric</th><th>Score</th><th>Description</th></tr>`;

    for (const m of data.METRICS) {
        const s = safeScores[m.id] || '—';
        html += `<tr><td><strong>${m.id}</strong> ${m.name}</td><td>${s}</td><td>${m.anchors[s] || ''}</td></tr>`;
    }
    html += '</table>';

    html += '<h2>Process Tailoring Levels</h2><table><tr><th>Process</th><th>Derived</th><th>Final</th><th>Trigger Metrics</th><th>Evidence Status</th><th>Level</th></tr>';
    for (const p of data.CORE_PROCESSES) {
        const d = safeDerived[p.id] || 'basic';
        const f = safeLevels[p.id] || 'basic';
        const detail = safeDerivationDetails[p.id] || {};
        const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
            ? detail.triggerMetrics.join(', ')
            : '—';
        const confidenceLabel = safeConfidence[p.id] === 'corroborated'
            ? 'Corroborated'
            : safeConfidence[p.id] === 'available-with-justification'
                ? 'Available with justification'
                : safeConfidence[p.id] === 'floor-applied'
                    ? 'Floor applied'
                    : 'Supported by drivers/rules';
        const changed = d !== f ? ' ⬆️' : '';
        html += `<tr><td>${p.id}. ${escapeHtml(p.name)}</td><td><span class="badge ${d}">${d}</span></td><td><span class="badge ${f}">${f}</span>${changed}</td><td>${escapeHtml(triggerMetrics)}</td><td>${confidenceLabel}</td><td style="${levelClass(f)}">${data.FRAMEWORK_META.levelLabels[f]}</td></tr>`;
    }
    html += '</table>';

    if (overrides.length > 0) {
        html += '<h2>Override Conditions Applied</h2>';
        for (const o of overrides) {
            html += `<div class="override"><strong>${escapeHtml(o.reason)}</strong> (${escapeHtml(o.condition)}): Process ${escapeHtml(o.processId)} elevated from ${escapeHtml(o.from)} to ${escapeHtml(o.to)}</div>`;
        }
    }

    if (violations.length > 0) {
        html += '<h2>Consistency Warnings</h2>';
        for (const v of violations) {
            html += `<div class="violation"><strong>Rule ${escapeHtml(v.ruleId)} [${escapeHtml(v.type)}]</strong>: ${escapeHtml(v.label)}<br>Process ${escapeHtml(v.affectedProcess)} is at ${escapeHtml(v.currentLevel)}, should be ${escapeHtml(v.requiredOp)} ${escapeHtml(v.requiredLevel)}</div>`;
        }
    }

    if (adoptionRisks.length > 0) {
        html += '<h2>Adoption Readiness Gaps</h2>';
        for (const risk of adoptionRisks) {
            html += `<div class="info"><strong>${escapeHtml(processMap[risk.processId]?.name || `Process ${risk.processId}`)}</strong>: required level remains ${escapeHtml(risk.level)}. ${escapeHtml(risk.guidance || risk.reason || '')}</div>`;
        }
    }

    html += `<hr><p style="font-size:12px;color:#94a3b8">Generated by SE Tailoring Model App on ${now}. Built by <a href="https://haitaowu12.github.io/tony-wu-home/" style="color:#6366f1">Tony Wu</a>.</p></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `se-tailoring-report-${projectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return html;
}

function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Export Matrix to CSV */
export function exportMatrixCSV(state, metrics, processes, defaultMap) {
    const map = state.matrixMap || defaultMap;
    const rows = [];
    const headers = ['Process ID', 'Process Name', ...metrics.map(m => m.id)];
    rows.push(headers);
    for (const p of processes) {
        const row = [p.id, p.name];
        for (const m of metrics) {
            row.push(map[p.id]?.[m.id] || '');
        }
        rows.push(row);
    }
    const csvContent = rows.map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `se-tailoring-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Export Matrix to PDF */
export async function exportMatrixPDF(state, metrics, processes, dimensions, defaultMap) {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF('landscape');
    const map = state.matrixMap || defaultMap;
    doc.text("Process-Metric Applicability Matrix Configuration", 14, 15);
    doc.setFontSize(10);
    doc.text("P = Primary Driver, S = Secondary Driver. Represents the exact matrix mapping used for assessment.", 14, 22);

    const headers = ['ID', 'Process', ...metrics.map(m => m.id)];
    const body = processes.map(p => {
        const row = [p.id, p.name];
        for (const m of metrics) {
            row.push(map[p.id]?.[m.id] || '-');
        }
        return row;
    });

    doc.autoTable({
        startY: 28,
        head: [headers],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        columnStyles: {
            0: { halign: 'left', cellWidth: 15 },
            1: { halign: 'left', cellWidth: 50 }
        }
    });

    doc.save(`se-tailoring-matrix-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Export System Breakdown and Tailoring to CSV */
export function exportSystemBreakdownCSV(state, CORE_PROCESSES) {
    const tree = state.assessmentTree;
    const rows = [];
    
    const headers = ['Depth', 'Element Name', 'Assessment Type', 'Status', ...CORE_PROCESSES.map(p => p.id)];
    rows.push(headers.join(','));
    
    const walk = (id, depth) => {
        const node = tree.nodes[id];
        if (!node) return;
        
        const row = [
            depth,
            `"${node.name.replace(/"/g, '""')}"`,
            node.assessmentType || 'full',
            node.status || 'draft'
        ];
        
        for (const p of CORE_PROCESSES) {
            const derivedLevel = node.levels[p.id] || 'unassessed';
            const manualAdj = node.manualAdjustments?.[p.id];
            const finalLevel = manualAdj ? manualAdj.level : derivedLevel;
            const justifyStr = manualAdj?.justification ? ` [${manualAdj.justification.replace(/"/g, '""')}]` : '';
            const levelLabel = finalLevel === 'unassessed' ? 'Unassessed' : finalLevel.charAt(0).toUpperCase();
            row.push(`"${levelLabel}${justifyStr}"`);
        }
        
        rows.push(row.join(','));
        for (const childId of node.childIds) walk(childId, depth + 1);
    };
    
    walk(tree.rootId, 0);
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `se-tailoring-breakdown-${(state.projectInfo?.name || 'project').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

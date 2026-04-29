/**
 * Export/Import — Configuration management (JSON)
 */

/** Export current state as JSON */
export function exportConfig(state) {
    const config = {
        _format: 'se-tailoring-config',
        _version: '1.0',
        _exported: new Date().toISOString(),
        projectInfo: state.projectInfo || {},
        metricScores: state.scores || {},
        processLevels: state.levels || {},
        derivedLevels: state.derived || {},
        derivationDetails: state.derivationDetails || {},
        overrides: state.overrides || [],
        manualAdjustments: state.manualAdjustments || {},
        tradeoffs: state.tradeoffs || [],
        matrixMap: state.matrixMap || null,
        assessmentTree: state.assessmentTree || null,
        cultureType: state.cultureType || null,
        notes: state.notes || ''
    };

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
    if (config._format !== 'se-tailoring-config') errors.push('Invalid format identifier');
    if (!config.metricScores || typeof config.metricScores !== 'object') errors.push('Missing metricScores');
    if (!config.processLevels || typeof config.processLevels !== 'object') errors.push('Missing processLevels');

    if (config.metricScores) {
        for (const [k, v] of Object.entries(config.metricScores)) {
            if (typeof v !== 'number' || v < 1 || v > 5) errors.push(`Invalid score for ${k}: ${v}`);
        }
    }

    const validLevels = ['basic', 'standard', 'comprehensive'];
    if (config.processLevels) {
        for (const [k, v] of Object.entries(config.processLevels)) {
            if (!validLevels.includes(v)) errors.push(`Invalid level for process ${k}: ${v}`);
        }
    }

    return { valid: errors.length === 0, errors };
}

/** Generate HTML report */
export function generateReport(state, data) {
    const { projectInfo = {}, scores = {}, levels = {}, derived = {}, derivationDetails = {}, overrides = [], violations = [], confidence = {} } = state;
    const processMap = {};
    data.CORE_PROCESSES.forEach(p => processMap[p.id] = p);
    const metricMap = {};
    data.METRICS.forEach(m => metricMap[m.id] = m);

    const levelClass = l => l === 'comprehensive' ? 'color:#ef4444' : l === 'standard' ? 'color:#f59e0b' : 'color:#3b82f6';

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SE Tailoring Report - ${projectInfo.name || 'Project'}</title>
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
@media print{body{padding:20px}h1{font-size:24px}}
</style></head><body>
<h1>SE Process Tailoring Report</h1>
<div class="info"><strong>Framework</strong>: SE Tailoring Model v${data.FRAMEWORK_META.version} (ISO/IEC/IEEE 15288:2023)</div>
<table><tr><td><strong>Project</strong>: ${projectInfo.name || '—'}</td><td><strong>Date</strong>: ${projectInfo.date || now}</td></tr>
<tr><td><strong>Team</strong>: ${projectInfo.team || '—'}</td><td><strong>Phase</strong>: ${projectInfo.phase || '—'}</td></tr></table>

<h2>Metric Scores</h2><table><tr><th>Metric</th><th>Score</th><th>Description</th></tr>`;

    for (const m of data.METRICS) {
        const s = scores[m.id] || '—';
        html += `<tr><td><strong>${m.id}</strong> ${m.name}</td><td>${s}</td><td>${m.anchors[s] || ''}</td></tr>`;
    }
    html += '</table>';

    html += '<h2>Process Tailoring Levels</h2><table><tr><th>Process</th><th>Derived</th><th>Final</th><th>Trigger Metrics</th><th>Corroboration</th><th>Level</th></tr>';
    for (const p of data.CORE_PROCESSES) {
        const d = derived[p.id] || 'basic';
        const f = levels[p.id] || 'basic';
        const detail = derivationDetails[p.id] || {};
        const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
            ? detail.triggerMetrics.join(', ')
            : '—';
        const confidenceLabel = confidence[p.id] === 'corroborated'
            ? 'Corroborated'
            : confidence[p.id] === 'available-with-justification'
                ? 'Available with justification'
                : 'High';
        const changed = d !== f ? ' ⬆️' : '';
        html += `<tr><td>${p.id}. ${p.name}</td><td><span class="badge ${d}">${d}</span></td><td><span class="badge ${f}">${f}</span>${changed}</td><td>${triggerMetrics}</td><td>${confidenceLabel}</td><td style="${levelClass(f)}">${data.FRAMEWORK_META.levelLabels[f]}</td></tr>`;
    }
    html += '</table>';

    if (overrides.length > 0) {
        html += '<h2>Override Conditions Applied</h2>';
        for (const o of overrides) {
            html += `<div class="override"><strong>${o.reason}</strong> (${o.condition}): Process ${o.processId} elevated from ${o.from} to ${o.to}</div>`;
        }
    }

    if (violations.length > 0) {
        html += '<h2>Consistency Warnings</h2>';
        for (const v of violations) {
            html += `<div class="violation"><strong>Rule ${v.ruleId} [${v.type}]</strong>: ${v.label}<br>Process ${v.affectedProcess} is at ${v.currentLevel}, should be ${v.requiredOp} ${v.requiredLevel}</div>`;
        }
    }

    html += `<hr><p style="font-size:12px;color:#94a3b8">Generated by SE Tailoring Model App on ${now}</p></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `se-tailoring-report-${(projectInfo.name || 'project').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return html;
}

/** Export Matrix to Excel */
export async function exportMatrixExcel(state, metrics, processes, defaultMap) {
    const XLSX = await import('xlsx');
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
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matrix Configuration");
    XLSX.writeFile(wb, `se-tailoring-matrix-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
            const derivedLevel = node.levels[p.id] || 'basic';
            const manualAdj = node.manualAdjustments?.[p.id];
            const finalLevel = manualAdj ? manualAdj.level : derivedLevel;
            const justifyStr = manualAdj?.justification ? ` [${manualAdj.justification.replace(/"/g, '""')}]` : '';
            row.push(`"${finalLevel.charAt(0).toUpperCase()}${justifyStr}"`);
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

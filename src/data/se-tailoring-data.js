/**
 * SE Tailoring Model — Central Data Index
 * =========================================
 * AI SYNC ENTRY POINT: When the SE Tailoring Model changes,
 * AI agents should update the individual data modules below.
 * This file re-exports everything for convenient import.
 *
 * Data modules and their source documents:
 *   processes.js       → 00-MASTER/SE-Tailoring-Model-Master-Index.md
 *   metrics.js         → 02-PRACTICAL/Assessment-Worksheet.md, Process-Metric-Applicability-Matrix.md
 *   process-details.js → 02-PRACTICAL/Process-Tailoring-Tables.md
 *   vee-model-layout.js → Derived from process lifecycle positions
 *   sa-methods.js      → 02-PRACTICAL/SA-Integration-Guide.md
 *
 * _FRAMEWORK_VERSION: 3.3.0
 * _LAST_SYNC: 2026-04
 * _SYNC_CONTRACT:
 *   - Process/metric applicability source: 02-PRACTICAL/Process-Metric-Applicability-Matrix.md
 *   - Consistency/override source: 02-PRACTICAL/Interdependency-Quick-Reference.md
 *   - Methodology narrative source: 01-PAPER/03-Methodology.md
 *   - Derivation model: conditional highest-tier (corroborated Comprehensive)
 *   - Rule baseline: 17 consistency rules (paper §6.5/§6.6 canonical set)
 *   - Override baseline: 8 override conditions, including project-context security trigger
 */

export * from './processes.js';
export * from './metrics.js';
export * from './process-details.js';
export * from './vee-model-layout.js';
export * from './sa-methods.js';

// Framework metadata
export const FRAMEWORK_META = {
    version: '3.3.0',
    name: 'SE Process Tailoring Framework',
    standard: 'ISO/IEC/IEEE 15288:2023',
    lastUpdated: '2026-04',
    coreProcessCount: 22,
    extendedProcessCount: 8,
    metricCount: 16,
    dimensionCount: 4,
    tailoringLevels: ['basic', 'standard', 'comprehensive'],
    levelLabels: { basic: 'Basic', standard: 'Standard', comprehensive: 'Comprehensive' },
    levelColors: { basic: '#3b82f6', standard: '#f59e0b', comprehensive: '#ef4444' },
    levelDescriptions: {
        basic: 'Essential activities only; informal documentation; reactive approach',
        standard: 'Structured activities with formal documentation; proactive planning',
        comprehensive: 'Full rigor with model-based approaches; predictive analytics'
    },
    saTierCount: 3,
    saMethodCount: 13
};

/**
 * SE Tailoring Model — Central Data Index
 * =========================================
 * AI SYNC ENTRY POINT: When the SE Tailoring Model changes,
 * AI agents should update the individual data modules below.
 * This file re-exports everything for convenient import.
 *
 * Data modules and their explanatory documents:
 *   processes.js       → 00-MASTER/SE-Tailoring-Model-Master-Index.md
 *   metrics.js         → 02-PRACTICAL/Assessment-Worksheet.md, Process-Metric-Applicability-Matrix.md
 *   process-details.js → 02-PRACTICAL/Process-Tailoring-Tables.md
 *   vee-model-layout.js → Derived from process lifecycle positions
 *   sa-methods.js      → 02-PRACTICAL/SA-Integration-Guide.md
 *
 * _FRAMEWORK_VERSION: 4.1.0
 * _LAST_SYNC: 2026-07-12
 * _SYNC_CONTRACT:
 *   - Normative semantic registry: metrics.js
 *   - Paper and practitioner files explain or render registry semantics.
 *   - Derivation model: max-tier with corroborated Comprehensive
 *   - Rule baseline: 18 active consistency rules plus 3 retained migration identifiers
 *   - Override baseline: 29 process-specific override conditions
 */

export * from './processes.js';
export * from './metrics.js';
export * from './process-details.js';
export * from './vee-model-layout.js';
export * from './sa-methods.js';

// Framework metadata
export const FRAMEWORK_META = {
    version: '4.1.0',
    appRelease: '3.6.0',
    metricDefinitionSet: 'se-tailoring-m1-m16-v3',
    name: 'SE Process Tailoring Framework',
    standard: 'ISO/IEC/IEEE 15288:2023',
    lastUpdated: '2026-07-12',
    coreProcessCount: 22,
    extendedProcessCount: 8,
    metricCount: 16,
    dimensionCount: 4,
    tailoringLevels: ['basic', 'standard', 'comprehensive'],
    levelLabels: { basic: 'Basic', standard: 'Standard', comprehensive: 'Comprehensive' },
    levelColors: { basic: '#3b82f6', standard: '#f59e0b', comprehensive: '#ef4444' },
    levelDescriptions: {
        basic: 'Essential activities only; lightweight documentation; reactive approach. Supports review against the 15288 process purpose without implying standalone compliance.',
        standard: 'Structured activities with formal documentation; proactive planning',
        comprehensive: 'High-rigor execution with stronger traceability, assurance evidence, and model-based support where useful. Safety-integrity claims still require domain-standard review.'
    },
    saTierCount: 3,
    saMethodCount: 13
};

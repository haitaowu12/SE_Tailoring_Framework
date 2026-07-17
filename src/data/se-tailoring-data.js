/**
 * SE Tailoring Model — Central Data Index
 * =========================================
 * AI SYNC ENTRY POINT: When the SE Tailoring Model changes,
 * AI agents should update the individual data modules below.
 * This file re-exports everything for convenient import.
 *
 * Data modules and their authority boundaries:
 *   processes.js       → 00-MASTER/SE-Tailoring-Model-Master-Index.md
 *   metrics.js         → normative executable semantic registry
 *   process-details.js → provisional authored implementation guidance
 *   vee-model-layout.js → Derived from process lifecycle positions
 *   sa-methods.js      → provisional reference-only safety-method content
 *
 * _FRAMEWORK_VERSION: imported from metrics.js
 * _LAST_SYNC: 2026-07-16
 * _SYNC_CONTRACT:
 *   - Normative semantic registry: metrics.js
 *   - The current paper, assessor manual, quick reference, and generated projection explain or render registry semantics.
 *   - Derivation model: max-tier with corroborated Comprehensive
 *   - Counts and identifiers below are computed from the normative registry.
 */

import { CORE_PROCESSES } from './processes.js';
import {
    ACTIVE_CONSISTENCY_RULES,
    ACTIVE_PROPAGATION_RULES,
    DIMENSIONS,
    FRAMEWORK_SEMANTIC_VERSION,
    METRICS,
    METRIC_DEFINITION_SET_ID,
    OVERRIDE_CONDITIONS
} from './metrics.js';

export * from './processes.js';
export * from './metrics.js';
export * from './process-details.js';
export * from './vee-model-layout.js';
export * from './sa-methods.js';

// Framework metadata
export const FRAMEWORK_META = {
    version: FRAMEWORK_SEMANTIC_VERSION,
    appRelease: '3.6.1',
    metricDefinitionSet: METRIC_DEFINITION_SET_ID,
    name: 'SE Process Tailoring Framework',
    standard: 'ISO/IEC/IEEE 15288:2023',
    lastUpdated: '2026-07-16',
    coreProcessCount: CORE_PROCESSES.length,
    extendedProcessCount: 8,
    metricCount: METRICS.length,
    dimensionCount: DIMENSIONS.length,
    activeRuleCount: ACTIVE_CONSISTENCY_RULES.length,
    activeDirectConsequenceCount: ACTIVE_PROPAGATION_RULES.length,
    processSpecificFloorCount: OVERRIDE_CONDITIONS.length,
    tailoringLevels: ['basic', 'standard', 'comprehensive'],
    levelLabels: { basic: 'Basic', standard: 'Standard', comprehensive: 'Comprehensive' },
    levelColors: { basic: '#3b82f6', standard: '#f59e0b', comprehensive: '#ef4444' },
    levelDescriptions: {
        basic: 'The essential purpose is considered, responsibilities and minimum decision evidence are visible, and records may be lightweight.',
        standard: 'Activities are planned and repeatable, baselines and decisions are controlled, outputs are reviewable, and normal traceability is present.',
        comprehensive: 'Stronger analytical depth, traceability, independence, assurance evidence, configuration control, or model-based support is applied where useful.'
    },
    saTierCount: 3,
    saMethodCount: 13
};

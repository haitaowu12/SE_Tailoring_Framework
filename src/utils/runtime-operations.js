/**
 * Local-only release diagnostics and runtime issue capture.
 *
 * Nothing in this module transmits data. The short in-memory issue list is
 * intentionally limited to operational metadata and sanitized messages; it
 * excludes assessment content, evidence, identities, and stack traces.
 */
import { FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { escapeHtml } from './safe-text.js';

export const EXCHANGE_SCHEMA_VERSION = '2.0';
export const OPERATING_PROFILE_ID = 'static-self-service-prototype';

const buildEnvironment = import.meta.env || {};
const suppliedBuildId = String(buildEnvironment.VITE_BUILD_ID || '').trim();

export const APP_RUNTIME_META = Object.freeze({
    application: 'se-tailoring-app',
    appRelease: FRAMEWORK_META.appRelease,
    frameworkVersion: FRAMEWORK_META.version,
    metricDefinitionSet: FRAMEWORK_META.metricDefinitionSet,
    exchangeSchemaVersion: EXCHANGE_SCHEMA_VERSION,
    buildId: suppliedBuildId || 'local-unattested',
    operatingProfile: OPERATING_PROFILE_ID,
    telemetry: 'none'
});

const runtimeIssues = [];
const MAX_RUNTIME_ISSUES = 5;
let issueSequence = 0;

function sanitizeIssueValue(value) {
    const text = String(value || 'Unspecified runtime failure')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.slice(0, 240) || 'Unspecified runtime failure';
}

export function recordRuntimeIssue(error, operation = 'runtime') {
    issueSequence += 1;
    const issue = {
        id: `issue-${Date.now().toString(36)}-${issueSequence.toString(36)}`,
        time: new Date().toISOString(),
        operation: sanitizeIssueValue(operation).slice(0, 80),
        // Do not retain exception messages: they can accidentally include an
        // imported value or project text. Operation + kind + local ID are the
        // safe reproduction handles.
        kind: sanitizeIssueValue(error?.name || typeof error || 'Error').slice(0, 80)
    };
    runtimeIssues.unshift(issue);
    runtimeIssues.splice(MAX_RUNTIME_ISSUES);
    return issue;
}

export function clearRuntimeIssues() {
    runtimeIssues.splice(0);
}

function inspectLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { available: false, savedWorkPresent: false };
    }
    try {
        return {
            available: true,
            savedWorkPresent: window.localStorage.getItem('se-tailoring-autosave') !== null
        };
    } catch {
        return { available: false, savedWorkPresent: false };
    }
}

export function getLocalDiagnostics() {
    const storage = inspectLocalStorage();
    return {
        generatedAt: new Date().toISOString(),
        release: { ...APP_RUNTIME_META },
        runtime: {
            route: typeof window === 'undefined' ? 'unavailable' : (window.location.hash.slice(1) || 'dashboard'),
            online: typeof navigator === 'undefined' ? null : navigator.onLine,
            localStorageAvailable: storage.available,
            savedWorkPresent: storage.savedWorkPresent
        },
        issues: runtimeIssues.map(issue => ({ ...issue })),
        privacy: 'Local diagnostic only. Contains no assessment values, project text, evidence references, approval identities, or telemetry.'
    };
}

export function installRuntimeIssueCapture() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', event => {
        recordRuntimeIssue(event.error || event.message, 'uncaught-error');
    });
    window.addEventListener('unhandledrejection', event => {
        recordRuntimeIssue(event.reason, 'unhandled-promise-rejection');
    });
}

export function buildRouteRecoveryMarkup(route, issueId) {
    return `
      <section class="card runtime-recovery" role="alert" aria-labelledby="runtime-recovery-title">
        <h1 id="runtime-recovery-title">This view could not be displayed safely</h1>
        <p class="text-secondary mt-md">The assessment has not been changed by this failed view render. Retry once. If the problem continues, download local diagnostics and return to the dashboard.</p>
        <dl class="runtime-diagnostic-list mt-md">
          <div><dt>View</dt><dd>${escapeHtml(route)}</dd></div>
          <div><dt>Local issue ID</dt><dd>${escapeHtml(issueId)}</dd></div>
        </dl>
        <div class="runtime-recovery-actions mt-lg">
          <button class="btn btn-primary" id="btn-runtime-retry" type="button">Retry view</button>
          <button class="btn btn-secondary" id="btn-runtime-dashboard" type="button">Return to dashboard</button>
          <button class="btn btn-secondary" id="btn-runtime-diagnostics" type="button">Open diagnostics</button>
        </div>
      </section>
    `;
}

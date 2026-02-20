/**
 * Shared App State
 */
const state = {
    projectInfo: { name: '', date: '', team: '', phase: '' },
    scores: {},
    derived: {},
    levels: {},
    overrides: [],
    violations: [],
    fixes: [],
    manualAdjustments: {},
    tradeoffs: [],
    cultureType: null,
    notes: '',
    assessmentComplete: false
};

const listeners = [];

export function getState() { return state; }

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

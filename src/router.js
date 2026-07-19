/**
 * Router — Hash-based SPA navigation
 */
import { buildRouteRecoveryMarkup, recordRuntimeIssue } from './utils/runtime-operations.js';

const routes = {};
let currentView = null;
let navigationSequence = 0;

function normalizeRoutePath(path) {
    const rawPath = String(path || '')
        .replace(/^#/, '')
        .split('?', 1)[0]
        .trim();
    return rawPath || 'dashboard';
}

function appendRouteParams(searchParams, params) {
    if (params instanceof URLSearchParams) {
        params.forEach((value, key) => searchParams.append(key, value));
        return;
    }
    for (const [key, rawValue] of Object.entries(params || {})) {
        if (rawValue === undefined || rawValue === null || rawValue === '') continue;
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        values.forEach(value => searchParams.append(key, String(value)));
    }
}

export function buildRouteHash(path, params = {}) {
    const normalizedPath = normalizeRoutePath(path);
    const searchParams = new URLSearchParams();
    appendRouteParams(searchParams, params);
    const query = searchParams.toString();
    return `#${encodeURIComponent(normalizedPath)}${query ? `?${query}` : ''}`;
}

export function processDetailsHref(processId, level, source) {
    return buildRouteHash('processes', {
        process: processId,
        level,
        source
    });
}

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export function navigateTo(path, params = {}, { replace = false } = {}) {
    const nextHash = buildRouteHash(path, params);
    if (replace) {
        const oldURL = window.location.href;
        window.history.replaceState(window.history.state, '', nextHash);
        const eventOptions = { oldURL, newURL: window.location.href };
        const event = typeof HashChangeEvent === 'function'
            ? new HashChangeEvent('hashchange', eventOptions)
            : new Event('hashchange');
        window.dispatchEvent(event);
        return;
    }
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
}

export function getCurrentRouteContext(hash = typeof window === 'undefined' ? '' : window.location.hash) {
    const rawHash = String(hash || '').replace(/^#/, '');
    const queryStart = rawHash.indexOf('?');
    const rawPath = queryStart >= 0 ? rawHash.slice(0, queryStart) : rawHash;
    const rawQuery = queryStart >= 0 ? rawHash.slice(queryStart + 1) : '';
    let path;
    try {
        path = decodeURIComponent(rawPath);
    } catch {
        path = rawPath;
    }
    return {
        path: normalizeRoutePath(path),
        params: new URLSearchParams(rawQuery)
    };
}

export function getCurrentRoute() {
    return getCurrentRouteContext().path;
}

function focusRouteHeading(container) {
    const heading = container.querySelector('h1, h2, h3');
    const target = heading || container;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
}

export function initRouter(container) {
    function updateNavState(route) {
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.toggle('active', el.dataset.route === route);
        });

        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            const hasActive = dropdown.querySelector('.nav-link.active');
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            trigger?.classList.toggle('has-active', !!hasActive);
        });

        const mobileRouteSelect = document.querySelector('#mobile-route-select');
        if (mobileRouteSelect && mobileRouteSelect.value !== route) {
            mobileRouteSelect.value = route;
        }
    }

    async function handleRoute() {
        const sequence = ++navigationSequence;
        const shouldMoveFocus = currentView !== null;
        const requestedContext = getCurrentRouteContext();
        const requestedRoute = requestedContext.path;
        const route = routes[requestedRoute] ? requestedRoute : 'dashboard';
        const handler = routes[route];
        if (!handler) return;

        // Animate out
        if (currentView) {
            container.classList.add('view-exit');
            await new Promise(r => setTimeout(r, 200));
            if (sequence !== navigationSequence) return;
            container.classList.remove('view-exit');
        }

        container.innerHTML = '';
        container.classList.add('view-enter');
        try {
            const routeContext = {
                path: route,
                params: route === requestedRoute ? requestedContext.params : new URLSearchParams()
            };
            await handler(container, routeContext);
            if (sequence !== navigationSequence) return;
            currentView = route;
        } catch (error) {
            if (sequence !== navigationSequence) return;
            const issue = recordRuntimeIssue(error, `render-route:${route}`);
            container.innerHTML = buildRouteRecoveryMarkup(route, issue.id);
            container.querySelector('#btn-runtime-retry')?.addEventListener('click', handleRoute);
            container.querySelector('#btn-runtime-dashboard')?.addEventListener('click', () => navigateTo('dashboard'));
            container.querySelector('#btn-runtime-diagnostics')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('app:open-diagnostics'));
            });
            currentView = 'runtime-error';
        }

        setTimeout(() => container.classList.remove('view-enter'), 400);

        updateNavState(route);
        window.dispatchEvent(new CustomEvent('app:route-rendered', {
            detail: { route, requestedRoute, params: requestedContext.params.toString() }
        }));
        if (shouldMoveFocus) focusRouteHeading(container);

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

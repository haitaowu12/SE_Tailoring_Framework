/**
 * Router — Hash-based SPA navigation
 */
const routes = {};
let currentView = null;

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export function navigateTo(path) {
    window.location.hash = path;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
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
        const requestedRoute = getCurrentRoute();
        const route = routes[requestedRoute] ? requestedRoute : 'dashboard';
        const handler = routes[route];
        if (!handler) return;

        // Animate out
        if (currentView) {
            container.classList.add('view-exit');
            await new Promise(r => setTimeout(r, 200));
            container.classList.remove('view-exit');
        }

        container.innerHTML = '';
        container.classList.add('view-enter');
        await handler(container);
        currentView = route;

        setTimeout(() => container.classList.remove('view-enter'), 400);

        updateNavState(route);
        window.dispatchEvent(new CustomEvent('app:route-rendered', {
            detail: { route, requestedRoute }
        }));

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

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
    async function handleRoute() {
        const route = getCurrentRoute();
        const handler = routes[route] || routes['dashboard'];
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

        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.toggle('active', el.dataset.route === route);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

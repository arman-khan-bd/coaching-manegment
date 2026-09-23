import { writable, get } from 'svelte/store';
import { currentView, activeTab } from './store';

export interface RouteState {
  path: string;
  view: 'landing' | 'login' | 'register' | 'checkout' | 'dashboard' | 'saas_admin';
  tab: string;
  step: number;
}

export const currentUrl = writable<string>('/');
export const registerStep = writable<number>(1);

// Mapping from dashboard tab ID to URL slug (and vice-versa)
const tabToSlug: Record<string, string> = {
  overview: 'overview',
  students: 'students',
  idcards: 'idcards',
  teachers: 'teachers',
  academics: 'academics',
  syllabus_routine: 'syllabus-routine',
  attendance: 'attendance',
  sms: 'sms',
  sms_templates: 'sms-templates',
  fees: 'fees',
  exams: 'exams',
  settings: 'settings',
};

const slugToTab: Record<string, string> = {
  overview: 'overview',
  students: 'students',
  idcards: 'idcards',
  teachers: 'teachers',
  academics: 'academics',
  'syllabus-routine': 'syllabus_routine',
  attendance: 'attendance',
  sms: 'sms',
  'sms-templates': 'sms_templates',
  fees: 'fees',
  exams: 'exams',
  settings: 'settings',
};

/**
 * Parse path and query parameters from window.location
 */
function parseLocation(): { path: string; search: string; step: number } {
  let path = window.location.pathname;
  let search = window.location.search;

  // Support hash routing fallback if hash is present (e.g. #/dashboard/students?step=2)
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const hashPart = window.location.hash.slice(1); // remove '#'
    const [hPath, hSearch] = hashPart.split('?');
    path = hPath || '/';
    search = hSearch ? `?${hSearch}` : '';
  }

  // Extract query parameters
  const params = new URLSearchParams(search);
  const stepParam = parseInt(params.get('step') || '1', 10);
  const step = isNaN(stepParam) || stepParam < 1 ? 1 : Math.min(stepParam, 4);

  return { path: path.toLowerCase() || '/', search, step };
}

/**
 * Resolve application view and active tab from current URL path
 */
export function resolveRoute(path: string, step: number = 1): RouteState {
  let rawPath = path || '/';
  let parsedStep = step;

  // Extract query parameters if present in the path string (e.g. /register?step=3)
  if (rawPath.includes('?')) {
    const [p, search] = rawPath.split('?');
    rawPath = p;
    const params = new URLSearchParams(search);
    const stepParam = parseInt(params.get('step') || '', 10);
    if (!isNaN(stepParam) && stepParam >= 1) {
      parsedStep = Math.min(stepParam, 4);
    }
  }

  const cleanPath = (rawPath.toLowerCase().replace(/\/+$/, '') || '/');

  // 1. Home / Landing
  if (cleanPath === '/' || cleanPath === '/home') {
    return { path: '/', view: 'landing', tab: 'overview', step: 1 };
  }

  // 2. Authentication: Login
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { path: '/login', view: 'login', tab: 'overview', step: 1 };
  }

  // 3. Step-by-Step Register
  if (cleanPath === '/register' || cleanPath === '/signup') {
    return { path: '/register', view: 'register', tab: 'overview', step: parsedStep };
  }

  // 4. Checkout
  if (cleanPath === '/checkout') {
    return { path: '/checkout', view: 'checkout', tab: 'overview', step: 1 };
  }

  // 5. SaaS Platform Super Admin (e.g. /admin or /saas-admin)
  if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/saas-admin')) {
    const parts = cleanPath.split('/').filter(Boolean); // ['admin', 'plans']
    const tab = parts[1] || 'overview';
    return {
      path: `/admin/${tab}`,
      view: 'saas_admin',
      tab,
      step: 1,
    };
  }

  // 7. Admin Dashboard (e.g. /dashboard or /dashboard/students)
  if (cleanPath.startsWith('/dashboard')) {
    const parts = cleanPath.split('/').filter(Boolean); // ['dashboard', 'students']
    const slug = parts[1] || 'overview';
    const tab = slugToTab[slug] || 'overview';
    return {
      path: `/dashboard/${tabToSlug[tab] || 'overview'}`,
      view: 'dashboard',
      tab,
      step: 1,
    };
  }

  // Fallback to landing
  return { path: '/', view: 'landing', tab: 'overview', step: 1 };
}

let isSyncing = false;

/**
 * Synchronize stores to URL state
 */
export function syncFromUrl() {
  if (typeof window === 'undefined') return;

  const { path, step } = parseLocation();
  const route = resolveRoute(path, step);

  isSyncing = true;
  currentUrl.set(route.path);
  currentView.set(route.view);
  activeTab.set(route.tab);
  registerStep.set(route.step);
  isSyncing = false;
}

/**
 * Navigate to a specific URL path programmatically
 */
export function navigate(targetPath: string, options: { replace?: boolean; step?: number } = {}) {
  if (typeof window === 'undefined') return;

  let finalPath = targetPath;
  let step = options.step !== undefined ? options.step : 1;

  if (targetPath.includes('?')) {
    const [p, search] = targetPath.split('?');
    const params = new URLSearchParams(search);
    const stepParam = parseInt(params.get('step') || '', 10);
    if (!isNaN(stepParam) && stepParam >= 1) {
      step = stepParam;
    }
  }

  if (targetPath.startsWith('/register') && step > 1 && !finalPath.includes('?')) {
    finalPath = `/register?step=${step}`;
  }

  const route = resolveRoute(targetPath, step);

  isSyncing = true;
  currentUrl.set(finalPath);
  currentView.set(route.view);
  activeTab.set(route.tab);
  registerStep.set(route.step);

  if (options.replace) {
    window.history.replaceState({ path: finalPath }, '', finalPath);
  } else {
    window.history.pushState({ path: finalPath }, '', finalPath);
  }

  isSyncing = false;
}

/**
 * Update step query param when in register view
 */
export function setRegisterStep(step: number) {
  const clamped = Math.max(1, Math.min(step, 4));
  registerStep.set(clamped);
  const target = `/register?step=${clamped}`;
  currentUrl.set(target);
  window.history.pushState({ path: target }, '', target);
}

/**
 * Initialize Router listeners and watchers
 */
export function initRouter() {
  if (typeof window === 'undefined') return;

  // 1. Initial resolution on page load
  syncFromUrl();

  // 2. Listen to browser Back / Forward buttons
  window.addEventListener('popstate', () => {
    syncFromUrl();
  });

  // 3. Keep URL synced if store changes internally (e.g. sidebar tab click)
  activeTab.subscribe((tab) => {
    if (isSyncing) return;
    const view = get(currentView);
    if (view === 'dashboard') {
      const slug = tabToSlug[tab] || 'overview';
      const targetUrl = `/dashboard/${slug}`;
      if (window.location.pathname !== targetUrl && window.location.hash !== `#${targetUrl}`) {
        currentUrl.set(targetUrl);
        window.history.pushState({ path: targetUrl }, '', targetUrl);
      }
    } else if (view === 'saas_admin') {
      const targetUrl = `/admin/${tab || 'overview'}`;
      if (window.location.pathname !== targetUrl && window.location.hash !== `#${targetUrl}`) {
        currentUrl.set(targetUrl);
        window.history.pushState({ path: targetUrl }, '', targetUrl);
      }
    }
  });

  currentView.subscribe((view) => {
    if (isSyncing) return;
    if (view === 'landing') {
      if (window.location.pathname !== '/') {
        navigate('/', { replace: false });
      }
    } else if (view === 'login') {
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: false });
      }
    } else if (view === 'register') {
      const step = get(registerStep) || 1;
      const target = step > 1 ? `/register?step=${step}` : '/register';
      if (!window.location.pathname.startsWith('/register')) {
        navigate(target, { replace: false, step });
      }
    } else if (view === 'checkout') {
      if (window.location.pathname !== '/checkout') {
        navigate('/checkout', { replace: false });
      }
    } else if (view === 'dashboard') {
      const tab = get(activeTab) || 'overview';
      const slug = tabToSlug[tab] || 'overview';
      const targetUrl = `/dashboard/${slug}`;
      if (window.location.pathname !== targetUrl) {
        navigate(targetUrl, { replace: false });
      }
    } else if (view === 'saas_admin') {
      const tab = get(activeTab) || 'overview';
      const targetUrl = `/admin/${tab}`;
      if (window.location.pathname !== targetUrl) {
        navigate(targetUrl, { replace: false });
      }
    }
  });
}

/**
 * Single source of truth for app routes. Path-based so the current route survives reload (hash).
 * Change paths here to update navigation and routing everywhere.
 */
export const ROUTES = {
  SETTINGS: '/settings',
  ALERTS: '/alerts',
  ALERTS_MANAGEMENT: '/alerts-management',
  ALERTS_THRESHOLDS: '/alerts-thresholds',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

export const DEFAULT_PATH = ROUTES.SETTINGS

const VALID_PATHS = new Set(Object.values(ROUTES))

/** Read current path from window hash (e.g. #/settings). Returns a valid path or DEFAULT_PATH. */
export function getPathFromHash(): Route {
  const hash = window.location.hash.slice(1) // strip '#'
  const path = (hash.startsWith('/') ? hash : `/${hash}`) as Route
  return VALID_PATHS.has(path) ? path : DEFAULT_PATH
}

/** Nav structure: top-level items and submenus. All paths reference ROUTES. */
export const NAV = [
  {
    label: 'Alerts',
    path: ROUTES.ALERTS,
    submenus: [
      { label: 'Alert Management', path: ROUTES.ALERTS_MANAGEMENT },
      { label: 'Alert Thresholds', path: ROUTES.ALERTS_THRESHOLDS },
    ],
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
  },
] as const


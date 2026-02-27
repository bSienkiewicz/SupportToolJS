/**
 * Single source of truth for app routes and nav. Path-based so the current route survives reload (hash).
 * Change paths or labels here to update navigation and routing everywhere.
 */
const NAV = [
  {
    key: 'ALERTS',
    label: 'Alerts',
    path: '/alerts',
    submenus: [
      { key: 'ALERTS_MANAGEMENT', label: 'Alert Management', path: '/alerts-management', description: 'Manage alerts and their properties' },
      { key: 'ALERTS_AUDIT', label: 'Alert Audit', path: '/alerts-audit', description: 'Find missing alerts and readjust thresholds' },
    ],
  },
] as const

const SETTINGS_PATH = '/settings'

export { NAV }

/** One navigable item for the command palette (and any other nav UI). Derived from NAV + Settings. */
export type NavCommandItem = { label: string; path: string; group: string }

/** Flat list of nav targets for the command palette. Single source of truth with NAV + Settings. */
export function getNavCommandItems(): NavCommandItem[] {
  const items: NavCommandItem[] = []
  for (const item of NAV) {
    if ('submenus' in item && item.submenus) {
      for (const sub of item.submenus) {
        items.push({ label: sub.label, path: sub.path, group: item.label })
      }
    }
  }
  items.push({ label: 'Settings', path: SETTINGS_PATH, group: 'App' })
  return items
}

function collectPaths(): string[] {
  const paths: string[] = []
  for (const item of NAV) {
    paths.push(item.path)
    if ('submenus' in item && item.submenus) {
      for (const sub of item.submenus) paths.push(sub.path)
    }
  }
  paths.push(SETTINGS_PATH)
  return paths
}

const ALL_PATHS = collectPaths()

/** Flat map of route key -> path for programmatic use (e.g. page === ROUTES.ALERTS_MANAGEMENT). */
const ROUTES_BUILD: Record<string, string> = {}
for (const item of NAV) {
  if ('submenus' in item && item.submenus) {
    ROUTES_BUILD[item.key] = item.path
    for (const sub of item.submenus) ROUTES_BUILD[sub.key] = sub.path
  } else {
    ROUTES_BUILD[item.key] = item.path
  }
}
ROUTES_BUILD['SETTINGS'] = SETTINGS_PATH
export const ROUTES = ROUTES_BUILD as {
  ALERTS: '/alerts'
  ALERTS_MANAGEMENT: '/alerts-management'
  ALERTS_THRESHOLDS: '/alerts-thresholds'
  ALERTS_AUDIT: '/alerts-audit'
  SETTINGS: '/settings'
}

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

export const DEFAULT_PATH: Route = ROUTES.ALERTS_MANAGEMENT

const VALID_PATHS = new Set<string>(ALL_PATHS)

/** Read current path from window hash (e.g. #/settings). Returns a valid path or DEFAULT_PATH. */
export function getPathFromHash(): Route {
  const hash = window.location.hash.slice(1) // strip '#'
  const path = (hash.startsWith('/') ? hash : `/${hash}`) as Route
  return (VALID_PATHS.has(path) ? path : DEFAULT_PATH) as Route
}

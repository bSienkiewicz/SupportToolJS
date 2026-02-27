/**
 * Single source of truth: pages and subpages for the navbar and for routing.
 * Add or edit items here; valid paths and ROUTES are derived from this.
 */
export const NAV = [
  {
    key: 'ALERTS',
    label: 'Alerts',
    path: '/alerts',
    submenus: [
      { key: 'ALERTS_MANAGEMENT', label: 'Alert Management', path: '/alerts-management', description: 'Manage alerts and their properties' },
      { key: 'ALERTS_AUDIT', label: 'Alert Audit', path: '/alerts-audit', description: 'Find missing alerts and readjust thresholds' },
    ],
  },
  { key: 'REPRINT', label: 'Reprint', path: '/reprint' },
] as const

export const SETTINGS_PATH = '/settings'

export const DEFAULT_PATH = NAV[0].submenus?.[0]?.path || NAV[0].path

function getAllPaths(): string[] {
  const paths: string[] = [SETTINGS_PATH]
  for (const item of NAV) {
    paths.push(item.path)
    if ('submenus' in item && item.submenus) {
      for (const sub of item.submenus) paths.push(sub.path)
    }
  }
  return paths
}

const VALID_PATHS = new Set(getAllPaths())

export function getPathFromHash(): string {
  const hash = window.location.hash.slice(1)
  const path = hash.startsWith('/') ? hash : `/${hash}`
  return VALID_PATHS.has(path) ? path : DEFAULT_PATH
}

const ROUTES_BUILD: Record<string, string> = { SETTINGS: SETTINGS_PATH }
for (const item of NAV) {
  ROUTES_BUILD[item.key] = item.path
  if ('submenus' in item && item.submenus) {
    for (const sub of item.submenus) ROUTES_BUILD[sub.key] = sub.path
  }
}
export const ROUTES = ROUTES_BUILD as {
  ALERTS: '/alerts'
  ALERTS_MANAGEMENT: '/alerts-management'
  ALERTS_AUDIT: '/alerts-audit'
  REPRINT: '/reprint'
  SETTINGS: '/settings'
}

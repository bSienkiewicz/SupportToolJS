/**
 * Single source of truth for app routes. Change paths here to update navigation and routing everywhere.
 */
export const ROUTES = {
  SETTINGS: 'settings',
  ALERTS: 'alerts',
  ALERTS_MANAGEMENT: 'alerts-management',
  ALERTS_THRESHOLDS: 'alerts-thresholds',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

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


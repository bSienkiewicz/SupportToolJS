export interface DMUser {
  id: string
  customerName: string
  /** SOAP API credentials (optional) */
  login?: string
  password?: string
  /** REST API credentials (optional) */
  restLogin?: string
  restPassword?: string
  stack: string
}

/** User has SOAP credentials filled. */
export function hasSoapCredentials(u: DMUser): boolean {
  return Boolean(u.login?.trim() && u.password != null && u.password !== '')
}

/** User has REST credentials filled. */
export function hasRestCredentials(u: DMUser): boolean {
  return Boolean(u.restLogin?.trim() && u.restPassword != null && u.restPassword !== '')
}

export const DM_STACKS = ['DM1', 'DM2', 'DM3', 'DM4', 'DM5', 'DM6', 'DM8', 'DMASOS', 'DELTA'] as const
export type DMStack = (typeof DM_STACKS)[number]

export const CONFIG_KEYS = {
  dmUsers: 'dmUsers',
  dmSelectedUserId: 'dmSelectedUserId',
} as const

export function parseDMUsers(json: string | null | undefined): DMUser[] {
  if (!json?.trim()) return []
  try {
    const parsed = JSON.parse(json) as unknown
    return Array.isArray(parsed) ? parsed.filter(isDMUser) : []
  } catch {
    return []
  }
}

function isDMUser(u: unknown): u is DMUser {
  const o = u as DMUser
  if (typeof u !== 'object' || u === null) return false
  if (typeof o.id !== 'string' || typeof o.customerName !== 'string' || typeof o.stack !== 'string') return false
  if (o.login !== undefined && typeof o.login !== 'string') return false
  if (o.password !== undefined && typeof o.password !== 'string') return false
  if (o.restLogin !== undefined && typeof o.restLogin !== 'string') return false
  if (o.restPassword !== undefined && typeof o.restPassword !== 'string') return false
  const hasSoap = Boolean(o.login?.trim() && o.password != null && o.password !== '')
  const hasRest = Boolean(o.restLogin?.trim() && o.restPassword != null && o.restPassword !== '')
  return hasSoap || hasRest
}

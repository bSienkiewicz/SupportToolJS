/**
 * DM user type and stack options. Persisted in app config (dmUsers JSON, dmSelectedUserId).
 */
export interface DMUser {
  id: string
  customerName: string
  login: string
  password: string
  stack: string
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
  return (
    typeof u === 'object' &&
    u !== null &&
    typeof (u as DMUser).id === 'string' &&
    typeof (u as DMUser).customerName === 'string' &&
    typeof (u as DMUser).login === 'string' &&
    typeof (u as DMUser).password === 'string' &&
    typeof (u as DMUser).stack === 'string'
  )
}

/**
 * Helper for New Relic GraphQL API (mirrors NewRelicApiHelper.cs).
 * - Execute GraphQL with X-Api-Key
 * - Build NRQL wrapper query for actor.account(id).nrql(...)
 * - Extract results from response
 */

const GRAPHQL_ENDPOINT = 'https://api.newrelic.com/graphql'
const ACCOUNT_ID = 400_000

export function getApiKey(config: Record<string, string> | undefined): string {
  const apiKey = config?.apiKey ?? process.env['NEW_RELIC_API_KEY']
  if (!apiKey?.trim()) {
    throw new Error('API key not found. Set it in Settings (apiKey) or NEW_RELIC_API_KEY env.')
  }
  return apiKey.trim()
}

export interface GraphQLResponse<T = unknown> {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Executes a GraphQL query against New Relic API (X-Api-Key auth).
 */
export async function executeGraphQLQuery<T = unknown>(
  query: string,
  apiKey: string
): Promise<GraphQLResponse<T>> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const json = JSON.parse(text) as GraphQLResponse<T>
  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join('; ')
    throw new Error(msg)
  }
  return json
}

/**
 * Builds a GraphQL query that runs NRQL via actor.account(id).nrql(...).
 * NRQL is embedded as a string (quotes inside nrqlQuery are escaped).
 */
export function buildNrqlGraphQLQuery(nrqlQuery: string, timeoutSeconds = 120): string {
  const escaped = nrqlQuery.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `
    query {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(timeout: ${timeoutSeconds}, query: "${escaped}") {
            results
          }
        }
      }
    }
  `.trim()
}

/** Path in the response: data.actor.account.nrql.results */
export interface NrqlResponse {
  actor: {
    account: {
      nrql: {
        results: unknown[]
      }
    }
  }
}

/**
 * Extracts the results array from a GraphQL NRQL response.
 */
export function extractResultsArray(json: GraphQLResponse<NrqlResponse>): unknown[] {
  const results = json.data?.actor?.account?.nrql?.results
  return Array.isArray(results) ? results : []
}

/**
 * Extracts the first result object from a GraphQL NRQL response.
 */
export function extractFirstResult(json: GraphQLResponse<NrqlResponse>): unknown {
  const results = json.data?.actor?.account?.nrql?.results
  return Array.isArray(results) && results.length > 0 ? results[0] : null
}

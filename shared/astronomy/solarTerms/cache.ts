// Every cache of solar-term-derived results is keyed by the authority and
// clock versions, so nothing computed under another authority (for example
// the pre-migration Astronomy Engine roots) can be returned as JPL-v4 data.

import { SOLAR_TERM_AUTHORITY } from './authority'

export const SOLAR_TERM_CACHE_NAMESPACE = `solar-terms/${SOLAR_TERM_AUTHORITY.authorityVersion}/${SOLAR_TERM_AUTHORITY.clockVersion}`

const stores = new Map<string, Map<string, unknown>>()

function store(consumer: string): Map<string, unknown> {
  let result = stores.get(consumer)
  if (!result) stores.set(consumer, (result = new Map()))
  return result
}

/** Bounded memo for one consumer; only entries of the active namespace are ever read. */
export function memoizeSolarTermDerived<V>(
  consumer: string,
  key: string,
  limit: number,
  compute: () => V,
): V {
  const entries = store(consumer)
  const namespaced = `${SOLAR_TERM_CACHE_NAMESPACE}|${key}`
  if (entries.has(namespaced)) return entries.get(namespaced) as V
  const value = compute()
  if (entries.size >= limit) entries.delete(entries.keys().next().value!)
  entries.set(namespaced, value)
  return value
}

/** Drops entries written under any other namespace; returns how many were removed. */
export function purgeStaleSolarTermCaches(): number {
  let removed = 0
  for (const entries of stores.values())
    for (const key of [...entries.keys()])
      if (!key.startsWith(`${SOLAR_TERM_CACHE_NAMESPACE}|`)) {
        entries.delete(key)
        removed++
      }
  return removed
}

/** Raw store access for cache-upgrade tests and diagnostics. */
export function solarTermCacheStore(consumer: string): Map<string, unknown> {
  return store(consumer)
}

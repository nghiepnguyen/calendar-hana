import { useSyncExternalStore } from 'react'
import manifest from '@shared/almanac-data/manifest.json'
import { p4ProviderLoaded } from '@shared/lunar/p4ScoreAdapter'

// Roadmap 10 A1 (tasks/prd-p4-activation.md, owner §5.2): the P4 resolver chunk loads without blocking
// the app; almanac views wait for it, because an almanac computed before it would stay memoized as
// baseline. A failed load falls back to the baseline output (balancing never runs without it).
let failed = false
const listeners = new Set<() => void>()
const ready = () => !manifest.policies.xiejiVol10BalancingEnabled || failed || p4ProviderLoaded()

/** Starts loading the resolver once; no-op with the flag OFF or once loaded. */
export function loadP4Provider() {
  if (ready()) return
  import('@shared/lunar/p4AlmanacHeadings')
    .catch(() => {
      failed = true
    })
    .finally(() => listeners.forEach((l) => l()))
}

export function useP4Ready() {
  return useSyncExternalStore((l) => {
    listeners.add(l)
    loadP4Provider()
    return () => listeners.delete(l)
  }, ready)
}

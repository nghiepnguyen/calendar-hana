import { expect, it, vi } from 'vitest'
import { renderDayArticle } from './daySeoPrerender'

// Roadmap 10 A2: with the flag mocked ON the static day page carries the P4 stars (provider loaded by
// the prerender entry), like the app after A1.
vi.mock('../almanac-data/manifest.json', async (load) => {
  const real = ((await load()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: true } } }
})

it('prerendered day page lists the dormant gods of the day', () => {
  expect(renderDayArticle('2025-10-19' as never)).toContain('Nguyệt Hại')
})

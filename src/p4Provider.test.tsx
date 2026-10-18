import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

// Roadmap 10 A1 with the provider not imported up front: the day view waits for the resolver chunk, and
// an almanac memoized before it loaded is not served afterwards. Fresh module graph, because the test
// setup preloads the provider when the shipped flag is ON.
vi.mock('@shared/almanac-data/manifest.json', async (load) => {
  const real = ((await load()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: true } } }
})

it('waits for the P4 provider, then serves the P4 almanac instead of the memoized baseline', async () => {
  vi.resetModules()
  const { getAlmanac } = await import('@shared/lunar/almanac')
  const { p4ProviderLoaded } = await import('@shared/lunar/p4ScoreAdapter')
  const { render } = await import('./test/render')
  const { DailyActivitySection } = await import('./views/DayView/DailyActivitySection')
  const stars = (date: string) => {
    const a = getAlmanac(date as never)
    return [...a.stars.good, ...a.stars.bad].map((s) => s.name)
  }
  expect(p4ProviderLoaded()).toBe(false)
  // Before the provider: baseline (no dormant star), memoized under the baseline key.
  expect(stars('2025-10-19')).not.toContain('Nguyệt Hại')
  render(<DailyActivitySection date="2025-10-19" />)
  expect(screen.getByText('Đang tải…')).toBeInTheDocument()
  expect(
    await screen.findByRole('region', { name: 'Việc nên làm trong ngày' }, { timeout: 20_000 }),
  ).toBeInTheDocument()
  expect(p4ProviderLoaded()).toBe(true)
  expect(stars('2025-10-19')).toContain('Nguyệt Hại')
}, 30_000)

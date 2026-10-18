import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach } from 'vitest'

// Roadmap 10: production loads the P4 provider before any almanac (A1), so tests do too whenever the
// shipped manifest has the flag ON. The manifest is read from disk, not imported, so per-file mocks of
// it still apply. The provider's module graph does not import the manifest.
const shipped = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
  policies: { xiejiVol10BalancingEnabled: boolean }
}
if (shipped.policies.xiejiVol10BalancingEnabled) await import('@shared/lunar/p4AlmanacHeadings')

// Popup chào lần đầu và gợi ý vuốt che màn hình: coi như đã thấy, test của từng cái tự xoá cờ.
beforeEach(() => {
  localStorage.setItem('hana:welcome-seen', '1')
  localStorage.setItem('hana:swipe-hint-seen', '1')
})

afterEach(() => {
  cleanup()
})

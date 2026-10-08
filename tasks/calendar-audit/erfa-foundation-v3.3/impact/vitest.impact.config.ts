// Phase 3B.4.3 migration-impact projection (audit only). Runs production code
// unmodified; the ERFA variant swaps the astronomy source with vi.mock only.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('../../../../', import.meta.url)),
  test: {
    environment: 'node',
    include: ['tasks/calendar-audit/erfa-foundation-v3.3/impact/*.audit.ts'],
    env: { TZ: 'Asia/Ho_Chi_Minh' },
    testTimeout: 3600000,
    fileParallelism: false,
  },
})

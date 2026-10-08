// Phase 3B.4.4A: validation of the frozen golden-v4 data (schema, hashes, internal
// consistency). Separate from the production suite; never evaluates production code.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('../../../../', import.meta.url)),
  test: {
    environment: 'node',
    include: ['tasks/calendar-audit/astronomy-authority-v3.4A/tests/*.audit.ts'],
    testTimeout: 120000,
  },
})

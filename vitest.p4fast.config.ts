import { defineConfig } from 'vitest/config'
import base from './vitest.config.ts'

// P4 dev loop only (npm run ci:p4:fast): never a merge/release gate. Every file here also runs in `vitest run`
// (ci:full); shared/lunar/p4FastSelection.test.ts checks the selection and documents each exclusion.
// Full/write/report modes stay off even if set in the shell, so this run is always normal mode.
for (const k of Object.keys(process.env))
  if (/(_FULL|_WRITE|_VERIFY|_REPORT)$|^REPORT_/.test(k)) delete process.env[k]

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    // Replaces (not merges with) the base include: new p4*/xiejiVol10*/yuePo* tests join automatically.
    include: [
      'shared/lunar/{p4,xiejiVol10,yuePo}*.test.ts',
      'src/**/p4*.test.{ts,tsx}',
      // Not P4-named, but import xiejiVol10Resolution.
      'shared/lunar/xiejiVirtues.test.ts',
      'shared/lunar/xiejiMonthlySha.test.ts',
    ],
    // Frozen puzhu17 freeze derivation, ~600 s; still runs in the full `vitest run` (ci:full).
    exclude: [...(base.test?.exclude ?? []), 'shared/lunar/p4Puzhu17Audit.test.ts'],
  },
})

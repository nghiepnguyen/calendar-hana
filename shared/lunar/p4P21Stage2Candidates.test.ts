import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import puzhu06 from '../almanac-data/p4b-puzhu06-v5.json'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { resolveP4OwnerRulesContext } from './p4OwnerRules'
import { resolveP4YiDay } from './p4YiDayComposition'

// Audit only: P21 Stage 2 (docs/audits/p21-stage2-discriminating-witness.md). Filters every propagation cell
// of the Stage 1 projection (puzhu:21 and its analogues) through the clean-witness conditions W1–W7 at
// context level. W8 (source output observable) needs a 月表 page and is decided in build_witnesses.py.
// Read-only over the production layer. npm test: frozen candidate set. P21S2_DUMP=1 rewrites candidates.json.
const STAGE1 = 'docs/audits/sources/p4-vol10/p21-stage1/projection.json'
const OUT = 'docs/audits/sources/p4-vol10/p21-stage2/candidates.json'
const TRIGGERS = puzhu06.triggers

type Cell = {
  line: string
  context: string
  heading: string
  triggers: string[]
  triggerXiangdi: Record<string, string[]>
  independent: string[]
  blocked?: string
  preRule?: string
  targetXiangdi: string[]
}

function screen(c: Cell) {
  const [m, p] = c.context.split('-') as [string, string]
  const day = resolveP4OwnerRulesContext(m, p)
  const t = day[c.heading]!
  const present = new Set(
    P4_DAY_HEADINGS.flatMap((h) =>
      ((resolveP4YiDay(m, p).yiEvidence[h]?.trace ?? []) as { han: string; presence: string }[])
        .filter((x) => x.presence === 'present')
        .map((x) => x.han),
    ),
  )
  const puzhu06Gods = TRIGGERS.filter((g) => present.has(g))
  const triggerYi = Object.fromEntries(c.triggers.map((f) => [f, day[f]?.yi ?? null]))
  const w = {
    // W1: a real 相抵 needs a 宜 on the trigger; cancel_both without 宜 is the P4 layer only (P4-劫).
    // puzhu:22 needs both 開市 and 立券交易 unnoted (requireAll), the pair lines one trigger.
    W1: c.triggers[c.line === 'puzhu:22' ? 'every' : 'some'](
      (f) => triggerYi[f] === true && c.triggerXiangdi[f]!.length > 0,
    ),
    W2: true, // every cell comes from a 鋪註 propagation line
    W3: c.independent.length > 0,
    W4: t.yi === false,
    // W5 under the adopted 卷十 reading (Option C): no target 宜, no target-local 相抵; a cancel_both mark
    // on a target without 宜 is recorded but does not fail W5.
    W5: !(t.yi !== false && c.targetXiangdi.length > 0),
    W6: puzhu06Gods.length === 0,
    W7: !c.blocked && (t.trace?.prot.length ?? 0) === 0,
  }
  return {
    ...c,
    triggerYi,
    targetYi: t.yi ?? null,
    puzhu06Gods,
    targetCancelBothMark: c.targetXiangdi.length > 0,
    w,
    passW1W7: Object.values(w).every(Boolean),
  }
}

function build() {
  const s1 = JSON.parse(readFileSync(STAGE1, 'utf8')) as { contextLevel: { cells: Cell[] } }
  return s1.contextLevel.cells.map(screen)
}

// Frozen before P21 Stage 4 (p4-puzhu21-v1, puzhu:21 contribution-scoped on 亥-丁酉/亥-癸酉): pinned to the
// pre-P21 rollback (p21Rollback.ts, puzhu:21 heading-wide everywhere).
vi.mock('../almanac-data/p4-puzhu21-v1.json', async () =>
  (await import('./p21Rollback')).puzhu21Off(),
)
await vi.hoisted(async () => (await import('./p21Rollback')).reloadUnderP21Pin())

describe('P21 Stage 2 candidates (audit only)', () => {
  it.runIf(process.env.P21S2_DUMP === '1')('dumps the W1–W7 screen', { timeout: 600_000 }, () => {
    const rows = build()
    writeFileSync(
      OUT,
      JSON.stringify(
        { harness: 'shared/lunar/p4P21Stage2Candidates.test.ts', stage1: STAGE1, cells: rows },
        null,
        2,
      ) + '\n',
    )
  })

  it('the frozen screen matches the production layer', { timeout: 600_000 }, () => {
    const frozen = JSON.parse(readFileSync(OUT, 'utf8')) as { cells: ReturnType<typeof screen>[] }
    expect(build()).toEqual(frozen.cells)
  })
})

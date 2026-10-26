import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import {
  checkP4RemainingRerun,
  p4Puzhu06Triggers,
  resolveP4OwnerRulesContext,
  resolveP4OwnerRulesDay,
  stitchP4EngineDay,
  type P4OwnerDay,
} from './p4OwnerRules'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiOperands'
// Frozen before F1 Stage 3 (puzhu:06 authority v4, owner R2): pinned to the pre-R2 rollback (f1R2Rollback.ts).
vi.mock('../almanac-data/p4b-puzhu06-v5.json', async () =>
  (await import('./f1R2Rollback')).puzhu06V3(),
)
await vi.hoisted(async () => (await import('./f1R2Rollback')).reloadUnderR2Pin())

// Roadmap 7b: the owner-rules layer must reproduce the accepted full Golden v2 (c574e57). The Golden is
// read-only here. The full domain runs with P4_OWNER_RULES_FULL=1 (ci:p4); npm test runs a fixed subset.
const G = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/'
const DIFFS = 'docs/audits/sources/p4-vol10/p4-full-golden-v2-review/engine/diffs.tsv'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const FULL = process.env.P4_OWNER_RULES_FULL === '1'
const SUMMARY = 'docs/audits/p4-owner-rules-summary.json'
// Full-run tallies written to / verified against SUMMARY (P4_OWNER_RULES_WRITE=1 rewrites it).
const stats: Record<string, Record<string, number>> = {}
const tally = (domain: string, key: string) => {
  const s = (stats[domain] ??= {})
  s[key] = (s[key] ?? 0) + 1
}
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const tf = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))

function tsv(path: string) {
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [keys[i]!, v])))
}

function golden(file: string) {
  const lock = JSON.parse(readFileSync(G + 'lock.json', 'utf8')) as {
    files: { path: string; sha256: string }[]
  }
  const pinned = lock.files.find((f) => f.path === G + file)!
  expect(sha256(readFileSync(G + file)), file).toBe(pinned.sha256)
  return tsv(G + file)
}

function dated(date: string) {
  const a = getAlmanac(date as never)
  const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
  const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
  const operands = {
    lunarDay: a.selectionContext.LUNAR_DAY!,
    phase: getP4MoonPhase(date),
    soil: getP4SoilPresence(date),
    yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
  }
  return { month, pillar, operands }
}

/** Deciding part of a Golden `code` (lift / invariant prefixes dropped); null when the Golden code has no
 * deciding trace (context rows undetermined by E5). */
function traceOf(code: string) {
  const parts = code.split(';').filter((p) => !p.startsWith('invariant') && !p.includes('>'))
  if (!parts.length || parts[0]!.startsWith('undetermined:context')) return null
  const head = parts[0]!
  const primary = head.startsWith('puzhu:28') ? 'puzhu:28' : head.split(':')[0]!
  const ids = (k: string) =>
    (
      parts
        .find((p) => p.startsWith(k + '='))
        ?.slice(k.length + 1)
        .split('+') ?? []
    ).sort()
  return { primary, ji: ids('ji'), prot: ids('prot') }
}
const cmpTrace = (e: P4OwnerDay[string]) => ({
  primary: e.trace?.primary,
  ji: e.trace?.ji ?? [],
  prot: e.trace?.prot ?? [],
})

/** Mismatching keys `date|heading` (or `month-pillar|heading`) against the Golden. */
function mismatches(
  rows: Record<string, string>[],
  key: string,
  day: (k: string) => P4OwnerDay,
  withTrace = true,
  domain = '',
) {
  const byKey = new Map<string, Record<string, string>[]>()
  for (const r of rows) byKey.set(r[key]!, [...(byKey.get(r[key]!) ?? []), r])
  const out: string[] = []
  for (const [k, rs] of byKey) {
    const d = day(k)
    for (const r of rs) {
      const e = d[r.heading!]
      if (!e) throw new Error(`no engine row for ${k} ${r.heading}`)
      if (domain) {
        tally(domain, 'rows')
        tally(domain, `state:${e.state}`)
        if (traceOf(r.code!)) tally(domain, 'traceCompared')
        if (e.puzhu06Dropped) tally(domain, `puzhu06TriggerChangedBy(i):${e.puzhu06Dropped}`)
      }
      if (r.state !== e.state || r.ji !== tf(e.ji) || r.protected !== tf(e.protectedJi))
        out.push(`${k}|${r.heading}`)
      else if (
        withTrace &&
        traceOf(r.code!) &&
        JSON.stringify(traceOf(r.code!)) !== JSON.stringify(cmpTrace(e))
      )
        out.push(
          `${k}|${r.heading}|trace ${JSON.stringify(traceOf(r.code!))} != ${JSON.stringify(cmpTrace(e))}`,
        )
    }
  }
  return out.sort()
}

// Fast subset: every date that the v2 engine comparison flagged, plus every 45th date.
const flagged = new Set(
  tsv(DIFFS)
    .filter((r) => r.domain === 'dated')
    .map((r) => r.id),
)
const sample = (rows: Record<string, string>[]) =>
  FULL
    ? rows
    : rows.filter(
        (r) => flagged.has(r.date!) || dates.days.findIndex((d) => d.date === r.date) % 45 === 0,
      )

// Fast context subset: every 40th context (18 of 720), all 29 headings, plus the 德作建論 contexts with a
// 德合 god (owner decision (i) changes rows only there).
const CONTEXT_SAMPLE = new Set([
  [...(B.slice(2) + B.slice(0, 2))].flatMap((m, mi) =>
    Array.from({ length: 60 }, (_, i) => i)
      .filter((i) => (mi * 60 + i) % 40 === 0)
      .map((i) => `${m}-${S[i % 10]}${B[i % 12]}`),
  ),
  '午-丙午',
  '巳-丙午',
  '未-己巳',
  '未-己未',
  '子-壬子',
])

describe('owner-rules layer vs full Golden v2 (audit-only)', () => {
  const datedRows = golden('compose/dated.tsv')
  const contextRows = golden('compose/context.tsv')

  // Full domain only (ci:p4): proves operands/normalisation before the owner rules are compared.
  it.runIf(FULL)(
    'harness: the current engine stitching differs from the Golden on exactly the attributed rows',
    () => {
      const rows = sample(datedRows)
      const got = mismatches(
        rows,
        'date',
        (k) => {
          const { month, pillar, operands } = dated(k)
          return stitchP4EngineDay(month, pillar, operands)
        },
        false,
      )
      const want = tsv(DIFFS)
        .filter((r) => r.domain === 'dated')
        .map((r) => `${r.id}|${r.heading}`)
        .sort()
      expect(got).toEqual(want)
    },
    600_000,
  )

  it('dated: every row equals the Golden (state, 忌, protection and the deciding trace)', () => {
    const rows = sample(datedRows)
    const got = mismatches(
      rows,
      'date',
      (k) => {
        const { month, pillar, operands } = dated(k)
        return resolveP4OwnerRulesDay(month, pillar, operands)
      },
      true,
      FULL ? 'dated' : '',
    )
    expect(got.length, got.slice(0, 20).join('\n')).toBe(0)
  }, 600_000)

  // E5 included: rows the Golden leaves undetermined (date-operand dependent) must be undetermined too.
  it('context: every row equals the Golden, E5 undetermined rows included', () => {
    const rows = contextRows.filter((r) => FULL || CONTEXT_SAMPLE.has(r.id!))
    const got = mismatches(
      rows,
      'id',
      (k) => {
        const [month, pillar] = k.split('-') as [string, string]
        return resolveP4OwnerRulesContext(month, pillar)
      },
      true,
      FULL ? 'context' : '',
    )
    expect(got.length, got.slice(0, 20).join('\n')).toBe(0)
  }, 600_000)
  it('(i) puzhu:06 triggers: no 德合 god on a 德作建論 day, all present triggers otherwise', () => {
    const present = new Set(['月德', '天德合', '四相', '時德'])
    expect(p4Puzhu06Triggers(present, true)).toEqual(['四相', '時德'])
    expect(p4Puzhu06Triggers(present, false)).toEqual(['月德', '天德合', '四相', '時德'])
    expect(p4Puzhu06Triggers(new Set(['月德']), true)).toEqual([])
  })

  it.runIf(FULL)(
    'the remaining-ji re-run equals the engine on all 720 contexts',
    () => {
      let n = 0
      for (const m of B)
        for (let i = 0; i < 60; i++) {
          checkP4RemainingRerun(m, S[i % 10]! + B[i % 12]!)
          n += 1
        }
      expect(n).toBe(720)
      stats.remainingRerun = { contexts: n }
    },
    600_000,
  )

  it.runIf(FULL)('summary of the full run matches the committed summary', () => {
    const text =
      JSON.stringify(
        { version: 'p4-owner-rules-summary-v1', golden: 'c574e57', mismatches: 0, ...stats },
        null,
        1,
      ) + '\n'
    if (process.env.P4_OWNER_RULES_WRITE === '1') writeFileSync(SUMMARY, text)
    expect(readFileSync(SUMMARY, 'utf8')).toBe(text)
  })
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4OwnerRulesContext, resolveP4OwnerRulesDay, type P4OwnerDay } from './p4OwnerRules'
import { P4_PUZHU06_AUTHORITY_ID } from './p4Puzhu06'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiOperands'
// Frozen before Q4-REST Stage 3 (puzhu:06 authority v5): pinned to the v4 rollback (q4RestRollback.ts).
vi.mock('../almanac-data/p4b-puzhu06-v5.json', async () => (await import('./q4RestRollback')).puzhu06V4())
await vi.hoisted(async () => (await import('./q4RestRollback')).reloadUnderQ4RestPin())

// F1 Stage 3 (owner R2): the shipped owner-rules layer (puzhu:06 authority v4) against full Golden v3
// (p4-full-golden-v3: the v2 composer under authority v4). The v2 suite (p4OwnerRules.test.ts) stays pinned
// to the pre-R2 rollback. npm test: the R2 dates + every 45th date and the R2 contexts; P4_OWNER_RULES_FULL=1
// (ci:p4): every date and context.
const G = 'docs/audits/sources/p4-vol10/p4-full-golden-v3/'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const FULL = process.env.P4_OWNER_RULES_FULL === '1'
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
) {
  const byKey = new Map<string, Record<string, string>[]>()
  for (const r of rows) byKey.set(r[key]!, [...(byKey.get(r[key]!) ?? []), r])
  const out: string[] = []
  for (const [k, rs] of byKey) {
    const d = day(k)
    for (const r of rs) {
      const e = d[r.heading!]
      if (!e) throw new Error(`no engine row for ${k} ${r.heading}`)
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

// The R2 rows (full Golden v3 v2-diff.txt) are always compared; the rest is sampled outside ci:p4.
const R2 = readFileSync(G + 'compose/v2-diff.txt', 'utf8').trim().split('\n').map((l) => l.split(' '))
const R2_DATES = new Set(R2.filter((r) => r[0] === 'dated.tsv').map((r) => r[1]!))
const R2_CONTEXTS = new Set(R2.filter((r) => r[0] === 'context.tsv').map((r) => r[1]!))

describe('owner-rules layer vs full Golden v3 (F1 R2, shipped)', () => {
  it('loads puzhu:06 authority v4 and the locked Golden', () => {
    expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
    expect(R2_DATES.size).toBe(19)
    expect(R2_CONTEXTS.size).toBe(12)
  })

  it('dated: every row equals the Golden (state, 忌, protection and the deciding trace)', () => {
    const rows = golden('compose/dated.tsv').filter(
      (r) => FULL || R2_DATES.has(r.date!) || dates.days.findIndex((d) => d.date === r.date) % 45 === 0,
    )
    const got = mismatches(rows, 'date', (k) => {
      const { month, pillar, operands } = dated(k)
      return resolveP4OwnerRulesDay(month, pillar, operands)
    })
    expect(got.length, got.slice(0, 20).join('\n')).toBe(0)
  }, 600_000)

  it('context: every row equals the Golden, E5 undetermined rows included', () => {
    const rows = golden('compose/context.tsv').filter((r) => FULL || R2_CONTEXTS.has(r.id!))
    const got = mismatches(rows, 'id', (k) => {
      const [month, pillar] = k.split('-') as [string, string]
      return resolveP4OwnerRulesContext(month, pillar)
    })
    expect(got.length, got.slice(0, 20).join('\n')).toBe(0)
  }, 600_000)
})

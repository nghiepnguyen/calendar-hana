import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import activitiesData from '../almanac-data/activities.json'
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import authority from '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
import authorityV3 from '../almanac-data/xieji-vol10-jiesha-authority-v3.json'
import authorityV2 from '../almanac-data/xieji-vol10-jiesha-authority-v2.json'
import authorityV1 from '../almanac-data/xieji-vol10-jiesha-authority-v1.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import manifest from '../almanac-data/manifest.json'
import { getSourceLockedCatHungPresence } from './catHungStars'
import { getVol10JieshaRuntime, vol10JieshaCell } from './xiejiVol10JieshaAuthority'
import { resolveVol10, splitHeadings } from './xiejiVol10Resolution'

// The faithful-v1 projection is passed explicitly; the legacy policy has its own migration test.
const FAITHFUL = { jieshaPolicy: 'faithful-v1' } as const

const MANIFEST = 'docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/coverage.json'
const COVERAGE = authority.runtimeCoverage.activities as Record<
  string,
  {
    status: string
    reason?: string
    contexts?: Record<string, { status: string; grade?: unknown }>
  }
>
const DEMOLITION_EXCLUDED = ['丑丙寅', '丑壬寅', '丑戊寅', '丑甲寅', '未戊申']
// Real dates of the 5 date-dependent contexts (卷十 Scoring Golden v5): one inside and one outside 土王用事.
const SOIL_DATES: Record<string, { inside: string; outside: string }> = {
  丑甲寅: { inside: '2028-01-30', outside: '2031-01-14' },
  丑丙寅: { inside: '2030-01-31', outside: '2033-01-15' },
  丑壬寅: { inside: '2028-01-18', outside: '2029-01-12' },
  丑戊寅: { inside: '2032-02-02', outside: '2036-01-12' },
  未戊申: { inside: '2028-07-22', outside: '2029-07-17' },
}
const CELLS = authority.cells as Record<string, Record<string, string>>
const CANDIDATE = 'docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json'
const APPROVED = 'b24f6f68e6b662fc04b5ec56ab6f2da8981273291ef3bf4e05a028b2f48d326a'
const BR = '子丑寅卯辰巳午未申酉戌亥'
const ST = '甲乙丙丁戊己庚辛壬癸'
const OFFICERS = 'kien tru man binh dinh chap pha nguy thanh thu khai be'.split(' ')
const ID = new Map([...goodGodsData.items, ...badGodsData.items].map((g) => [g.label, g.id]))
const ACTIVITIES = [
  ...new Set([...activitiesData.items.map((a) => a.id), ...Object.keys(vol11.activityEntries)]),
]

/** A real 卷十 day for a Month Jian + pillar: officer and source-locked presence as the almanac builds them. */
function day(m: number, i: number) {
  const gods = getSourceLockedCatHungPresence(m, i % 10, i % 12)
    .map(({ name }) => ID.get(name))
    .filter((id): id is string => Boolean(id))
  return {
    monthJianBranch: m,
    dayStem: i % 10,
    dayBranch: i % 12,
    officerId: OFFICERS[((i % 12) - m + 12) % 12]!,
    presentGods: new Set(gods),
    unknownGods: new Set<string>(),
  }
}

// Shipped: authority v3 (G1 glyph Stage 2, R3: demolition per context). v1 / v2 stay frozen (rollback evidence).
describe('卷十 劫煞 faithful authority v4', () => {
  it('shipped policy is faithful-v1 and is the resolver default; legacy stays selectable', () => {
    expect(manifest.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    const d = day(4, 41) // 辰 乙巳
    expect(resolveVol10(d, ACTIVITIES)).toEqual(resolveVol10(d, ACTIVITIES, FAITHFUL))
    const legacy = resolveVol10(d, ACTIVITIES, { jieshaPolicy: 'legacy-cancel-both' })
    expect(
      legacy.filter((x) => x.authority || (x.verdict === 'avoid' && x.entry === 'jie_sha')),
    ).toEqual([])
  })

  it('is the approved candidate cell for cell, plus the 11 R3 demolition cells (395, 188 avoid, 207 blank)', () => {
    const raw = readFileSync(CANDIDATE)
    expect(createHash('sha256').update(raw).digest('hex')).toBe(APPROVED)
    const cand = JSON.parse(raw.toString()) as { cells: Record<string, Record<string, string>> }
    const withoutDemolition = Object.fromEntries(
      Object.entries(CELLS).map(([k, { demolition: _d, ...rest }]) => [k, rest]),
    )
    expect(withoutDemolition).toEqual(cand.cells)
    expect(authorityV2.cells).toEqual(cand.cells)
    expect(authorityV3.cells).toEqual(authority.cells)
    expect(authorityV1.cells).toEqual(cand.cells)
    expect(authority.counts).toEqual({
      contexts: 16,
      activities: 25,
      cells: 395,
      avoid: 188,
      blank: 207,
    })
    expect(authority.provenance.approvedCandidate.sha256).toBe(APPROVED)
    // R2 (v4): demolition = 11 static APPLIED (avoid; A ×7, B ×4) + 5 APPLIED_DATE_DEPENDENT with no static cell.
    const ctx = COVERAGE.demolition!.contexts! as Record<
      string,
      { status: string; grade?: unknown; selector?: string; cells?: Record<string, string> }
    >
    const applied = Object.keys(ctx).filter((k) => ctx[k]!.status === 'APPLIED')
    const excluded = Object.keys(ctx).filter((k) => ctx[k]!.status === 'APPLIED_DATE_DEPENDENT')
    for (const k of excluded)
      expect([ctx[k]!.selector, ctx[k]!.cells, ctx[k]!.grade], k).toEqual([
        'tho-vuong-dung-su-rule-v1',
        { inside: 'avoid', outside: 'blank' },
        'B',
      ])
    expect([COVERAGE.demolition!.status, applied.length, excluded.sort()]).toEqual([
      'APPLIED_BY_CONTEXT',
      11,
      [...DEMOLITION_EXCLUDED].sort(),
    ])
    expect(applied.map((k) => ctx[k]!.grade).sort()).toEqual([...'AAAAAAABBBB'])
    for (const k of applied) expect(CELLS[k]!.demolition, k).toBe('avoid')
    for (const k of excluded) expect('demolition' in CELLS[k]!, k).toBe(false)
  })

  it('fails loudly on an unknown context, uncovered activity or reached UNREACHABLE cell', () => {
    expect(getVol10JieshaRuntime('辰', '乙巳', 'wedding')).toEqual({
      status: 'APPLIED',
      cell: 'avoid',
    })
    expect(getVol10JieshaRuntime('辰', '乙巳', 'demolition')).toEqual({
      status: 'APPLIED',
      cell: 'avoid',
    })
    // Date-dependent: no date or an unsupported date throws; the selector picks the cell from the date.
    expect(() => getVol10JieshaRuntime('丑', '壬寅', 'demolition')).toThrow(/needs a civil date/)
    expect(() => getVol10JieshaRuntime('丑', '壬寅', 'demolition', '2101-01-12')).toThrow(
      /1900–2100/,
    )
    expect(() => getVol10JieshaRuntime('丑', '壬寅', 'demolition', '2028-02-30')).toThrow(/invalid/)
    const inside = getVol10JieshaRuntime('丑', '壬寅', 'demolition', '2028-01-18')
    const outside = getVol10JieshaRuntime('丑', '壬寅', 'demolition', '2029-01-12')
    expect(inside).toEqual({
      status: 'APPLIED',
      cell: 'avoid',
      selector: 'tho-vuong-dung-su-rule-v1',
      soilState: 'inside',
    })
    expect(outside).toMatchObject({ status: 'APPLIED', cell: 'blank', soilState: 'outside' })
    expect([vol10JieshaCell(inside), vol10JieshaCell(outside)]).toEqual(['avoid', 'blank'])
    expect(() =>
      vol10JieshaCell({ status: 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY', reason: 'x' }),
    ).toThrow(/EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY/)
    expect(() => getVol10JieshaRuntime('子', '甲子', 'wedding')).toThrow(/no context/)
    expect(() => getVol10JieshaRuntime('辰', '乙巳', 'worship')).toThrow(/no coverage/)
    // v2: contract is APPLIED (the UNREACHABLE guard is pinned in p4G2Stage2Migration.test.ts, alias-v1).
    expect(getVol10JieshaRuntime('辰', '乙巳', 'contract')).toEqual({
      status: 'APPLIED',
      cell: 'blank',
    })
  })

  it('coverage states match the real resolveVol10 listing (no 劵→券, 壞→壊 kept)', () => {
    const items = resolveVol10(day(4, 41), ACTIVITIES, FAITHFUL) // 辰 乙巳
    const listed = items
      .filter((x) => x.entry === 'jie_sha' && x.verdict !== 'not_listed')
      .map((x) => x.activityId)
      .sort()
    const by = (s: string) =>
      Object.keys(COVERAGE)
        .filter((a) => COVERAGE[a]!.status === s)
        .sort()
    expect(listed).toEqual([...by('APPLIED'), ...by('APPLIED_BY_CONTEXT')].sort())
    expect(by('UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION')).toEqual([])
    expect(by('EXCLUDED_PENDING_GLYPH_AUDIT')).toEqual([])
    expect(by('APPLIED_BY_CONTEXT')).toEqual(['demolition'])
    // G2: 卷十 立劵交易 reaches 立券交易 through the headingAliases entry, not a NORM fold.
    for (const a of ['contract', 'transaction'])
      expect(items.find((x) => x.entry === 'jie_sha' && x.activityId === a)!.verdict).toBe(
        'no_annotation',
      )
    expect(splitHeadings('立劵交易')).toEqual(['立券交易'])
    expect(splitHeadings('破屋壞垣')).toEqual(['破屋壊垣'])
  })

  // Frozen Option C v1 artifact: computed from authority v1 (G2 Stage 2 does not regenerate it).
  it('coverage manifest maps every audit cell (and the excluded demolition contexts)', () => {
    const CELLS = authorityV1.cells as Record<string, Record<string, string>>
    const COVERAGE = authorityV1.runtimeCoverage.activities as Record<
      string,
      { status: string; reason?: string }
    >
    const rows = [
      ...Object.entries(CELLS).flatMap(([ctx, row]) =>
        Object.entries(row).map(([activity, audit]) => ({
          context: ctx,
          activity,
          auditVerdict: audit,
          runtimeStatus: COVERAGE[activity]!.status,
          productionHeadings: (vol11.activityEntries as Record<string, string[]>)[
            activity
          ]!.flatMap(splitHeadings),
          reason: COVERAGE[activity]!.reason ?? null,
        })),
      ),
      ...Object.keys(CELLS).map((ctx) => ({
        context: ctx,
        activity: 'demolition',
        auditVerdict: null,
        runtimeStatus: COVERAGE.demolition!.status,
        productionHeadings: vol11.activityEntries.demolition.flatMap(splitHeadings),
        reason: COVERAGE.demolition!.reason!,
      })),
    ]
    const summary: Record<string, Record<string, number>> = {}
    for (const r of rows) {
      const s = (summary[r.runtimeStatus] ??= { total: 0, avoid: 0, blank: 0, noAuditCell: 0 })
      s.total++
      s[r.auditVerdict ?? 'noAuditCell']!++
    }
    const manifest = {
      version: 'jiesha-option-c-coverage-v1',
      authority: authorityV1.version,
      auditCells: 384,
      summary,
      rows,
    }
    if (process.env.OPTION_C_WRITE)
      writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')
    expect(JSON.parse(readFileSync(MANIFEST, 'utf8'))).toEqual(manifest)
    expect(summary).toEqual({
      APPLIED: { total: 352, avoid: 171, blank: 181, noAuditCell: 0 },
      UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION: {
        total: 32,
        avoid: 6,
        blank: 26,
        noAuditCell: 0,
      },
      EXCLUDED_PENDING_GLYPH_AUDIT: { total: 16, avoid: 0, blank: 0, noAuditCell: 16 },
    })
  })

  it('every real Month Jian × pillar reaches the authority exactly on the 16 table contexts', () => {
    const reached = new Map<string, Set<string>>()
    for (let m = 0; m < 12; m++)
      for (let i = 0; i < 60; i++)
        for (const item of resolveVol10(
          // The 5 date-dependent contexts need a civil date: a real outside date (cell blank).
          {
            ...day(m, i),
            civilDate: SOIL_DATES[BR[m]! + ST[i % 10]! + BR[i % 12]!]?.outside,
          },
          ACTIVITIES,
          FAITHFUL,
        )) {
          if (!item.authority) continue
          expect(item.entry).toBe('jie_sha')
          expect(item.effect).toBe('cancel_both')
          const key = BR[m]! + ST[i % 10]! + BR[i % 12]!
          ;(reached.get(key) ?? reached.set(key, new Set()).get(key)!).add(item.activityId)
          if (item.activityId === 'demolition' && DEMOLITION_EXCLUDED.includes(key)) {
            // R2: outside 土王用事 the date-dependent cell is blank; no exclusion remains.
            expect([item.verdict, item.authorityExclusion], key).toEqual([
              'no_annotation',
              undefined,
            ])
            continue
          }
          expect(item.authorityExclusion).toBeUndefined()
          const cell = CELLS[key]![item.activityId]
          expect(item.verdict, `${key} ${item.activityId}`).toBe(
            cell === 'avoid' ? 'avoid' : 'no_annotation',
          )
        }
    expect([...reached.keys()].sort()).toEqual(Object.keys(authority.cells).sort())
    const runtime = Object.keys(COVERAGE)
      .filter((a) => COVERAGE[a]!.status !== 'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION')
      .sort()
    for (const acts of reached.values()) expect([...acts].sort()).toEqual(runtime)
  })

  it('never applies in 子午卯酉, with any 德, or to another god', () => {
    const at = (m: string, p: string) => {
      const i = Array.from({ length: 60 }, (_, k) => k).find((k) => ST[k % 10] + BR[k % 12] === p)!
      return resolveVol10(day(BR.indexOf(m), i), ACTIVITIES)
    }
    for (const [m, p] of [
      ['卯', '甲申'], // 子午卯酉 cancel_both with 月德
      ['辰', '丁巳'], // 辰 劫煞 with 天德合/月德合
      ['丑', '庚寅'], // 丑 劫煞 with 天德/月德
      ['寅', '乙亥'], // 寅申 收日 長生
    ] as const)
      expect(
        at(m, p).filter((x) => x.authority),
        `${m}${p}`,
      ).toEqual([])
    expect(at('辰', '乙巳').filter((x) => x.authority && x.entry !== 'jie_sha')).toEqual([])
  })

  it('carries the corrections: 未-壬申 P17-A, 丑-丙寅 D-A, 未-戊申 owner ruling', () => {
    const v = (m: string, p: string, a: string) => {
      const i = Array.from({ length: 60 }, (_, k) => k).find((k) => ST[k % 10] + BR[k % 12] === p)!
      return resolveVol10(day(BR.indexOf(m), i), [a]).find((x) => x.entry === 'jie_sha')!.verdict
    }
    for (const a of ['wedding', 'engagement', 'moving']) expect(v('未', '壬申', a)).toBe('avoid')
    expect(v('丑', '丙寅', 'construction')).toBe('avoid')
    expect(v('丑', '丙寅', 'warehouse')).toBe('avoid')
    for (const a of ['finance', 'opening', 'business'])
      expect(v('未', '戊申', a)).toBe('no_annotation')
    // G2 Stage 2, owner ruling 2026-10-25: 未-戊申 contract / transaction stay blank, applied as I1
    // (no_annotation: 劫煞's penalty is lifted). The n117 audit stays open (p4-weishen-lijuan-authority-item.md).
    for (const a of ['contract', 'transaction']) expect(v('未', '戊申', a)).toBe('no_annotation')
    for (const a of ['contract', 'transaction']) expect(v('未', '壬申', a)).toBe('avoid')
  })
})

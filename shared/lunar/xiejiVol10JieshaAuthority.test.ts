import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import activitiesData from '../almanac-data/activities.json'
import badGodsData from '../almanac-data/bad-gods.json'
import goodGodsData from '../almanac-data/good-gods.json'
import authority from '../almanac-data/xieji-vol10-jiesha-authority-v2.json'
import authorityV1 from '../almanac-data/xieji-vol10-jiesha-authority-v1.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import manifest from '../almanac-data/manifest.json'
import { getSourceLockedCatHungPresence } from './catHungStars'
import { getVol10JieshaRuntime } from './xiejiVol10JieshaAuthority'
import { resolveVol10, splitHeadings } from './xiejiVol10Resolution'

// The faithful-v1 projection is passed explicitly; the legacy policy has its own migration test.
const FAITHFUL = { jieshaPolicy: 'faithful-v1' } as const

const MANIFEST = 'docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/coverage.json'
const COVERAGE = authority.runtimeCoverage.activities as Record<
  string,
  { status: string; reason?: string }
>
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

// Shipped: authority v2 (G2 Stage 2, contract / transaction APPLIED). v1 stays frozen (coverage manifest below).
describe('卷十 劫煞 faithful authority v2', () => {
  it('shipped policy is faithful-v1 and is the resolver default; legacy stays selectable', () => {
    expect(manifest.policies.xiejiVol10JieshaPolicy).toBe('faithful-v1')
    const d = day(4, 41) // 辰 乙巳
    expect(resolveVol10(d, ACTIVITIES)).toEqual(resolveVol10(d, ACTIVITIES, FAITHFUL))
    const legacy = resolveVol10(d, ACTIVITIES, { jieshaPolicy: 'legacy-cancel-both' })
    expect(
      legacy.filter((x) => x.authority || (x.verdict === 'avoid' && x.entry === 'jie_sha')),
    ).toEqual([])
  })

  it('is the approved candidate, cell for cell (16 × 24 = 384, 177 avoid, 207 blank)', () => {
    const raw = readFileSync(CANDIDATE)
    expect(createHash('sha256').update(raw).digest('hex')).toBe(APPROVED)
    const cand = JSON.parse(raw.toString()) as { cells: Record<string, Record<string, string>> }
    expect(authority.cells).toEqual(cand.cells)
    expect(authorityV1.cells).toEqual(cand.cells)
    expect(authority.counts).toEqual({
      contexts: 16,
      activities: 24,
      cells: 384,
      avoid: 177,
      blank: 207,
    })
    expect(authority.provenance.approvedCandidate.sha256).toBe(APPROVED)
  })

  it('fails loudly on an unknown context, uncovered activity or reached UNREACHABLE cell', () => {
    expect(getVol10JieshaRuntime('辰', '乙巳', 'wedding')).toEqual({
      status: 'APPLIED',
      cell: 'avoid',
    })
    expect(getVol10JieshaRuntime('辰', '乙巳', 'demolition').status).toBe(
      'EXCLUDED_PENDING_GLYPH_AUDIT',
    )
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
    expect(listed).toEqual([...by('APPLIED'), ...by('EXCLUDED_PENDING_GLYPH_AUDIT')].sort())
    expect(by('UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION')).toEqual([])
    expect(by('EXCLUDED_PENDING_GLYPH_AUDIT')).toEqual(['demolition'])
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
        for (const item of resolveVol10(day(m, i), ACTIVITIES, FAITHFUL)) {
          if (!item.authority) continue
          expect(item.entry).toBe('jie_sha')
          expect(item.effect).toBe('cancel_both')
          const key = BR[m]! + ST[i % 10]! + BR[i % 12]!
          ;(reached.get(key) ?? reached.set(key, new Set()).get(key)!).add(item.activityId)
          if (item.activityId === 'demolition') {
            // Deliberate v1 exclusion: legacy verdict, marked, never a missing-cell fallback.
            expect(item.verdict).toBe('no_annotation')
            expect(item.authorityExclusion).toMatch(/^EXCLUDED_PENDING_GLYPH_AUDIT: /)
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

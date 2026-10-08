import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'))
const manifest = json('golden-v4/manifest.json')
const RULES = ['month-breaker', 'robbery-sha', 'disaster-sha', 'month-sha', 'month-virtue']
const BR = '子丑寅卯辰巳午未申酉戌亥'

describe('golden-v4 freeze integrity', () => {
  it('manifest pins every frozen file, review and input', () => {
    expect(manifest.status).toBe('REVIEWED_FROZEN')
    expect(Object.keys(manifest.files)).toHaveLength(6)
    for (const [path, f] of Object.entries(manifest.files as Record<string, { sha256: string }>))
      expect(sha(path), path).toBe(f.sha256)
    for (const r of manifest.reviews) expect(sha(r.path), r.path).toBe(r.sha256)
    for (const i of manifest.inputs.filter((x: { path?: string }) => x.path)) expect(sha(i.path), i.path).toBe(i.sha256)
    for (const t of manifest.tooling) expect(sha(t.path), t.path).toBe(t.sha256)
  })

  it('both independent reviews passed on the exact candidate bytes', () => {
    const a = json('tasks/calendar-audit/astronomy-authority-v3.4A/reviews/review-authority.json')
    const b = json('tasks/calendar-audit/astronomy-authority-v3.4A/reviews/review-groupb.json')
    expect([a.verdict, b.verdict]).toEqual(['PASS', 'PASS'])
    expect(a.mismatches).toBe(0)
    expect(b.fixturesChecked).toBe(611)
    const asCandidate = (p: string) =>
      createHash('sha256').update(readFileSync(p, 'utf8').replace('"reviewStatus": "REVIEWED_FROZEN"', '"reviewStatus": "CANDIDATE"')).digest('hex')
    expect(asCandidate('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')).toBe(a.candidateSha256)
    for (const r of RULES) expect(asCandidate(`golden-v4/group-b/${r}.json`)).toBe(b.candidateFileSha256[r])
  })

  it('golden-v3 is byte-identical to the 3B.4.4A starting state', () => {
    const before = json('tasks/calendar-audit/astronomy-authority-v3.4A/hashes-before.json').files
    const v3 = Object.keys(before).filter((p) => p.startsWith('golden-v3/') || p === 'calendar-group-b-exact-jie-evidence.json')
    expect(v3.length).toBeGreaterThanOrEqual(7)
    for (const p of v3) expect(sha(p), p).toBe(before[p].sha256)
  })
})

describe('golden-v4 astronomy authority schema and consistency', () => {
  const a = json('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')
  const rows = (a.rows as string[]).map((s) => s.split('|'))

  it('declares the authority contract', () => {
    for (const k of ['authorityVersion', 'referenceEngine', 'referenceKernel', 'referenceKernelSha256', 'observable', 'frame', 'timeScale', 'numericalBoundaryPolicy', 'clockPolicy', 'serializationPolicy', 'generatedAt', 'generatorVersion', 'reviewStatus'])
      expect(a, k).toHaveProperty(k)
    expect(a.referenceKernelSha256).toBe('c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2')
    expect([a.timeScale, a.clockPolicy, a.reviewStatus]).toEqual(['TT', 'clock-v1', 'REVIEWED_FROZEN'])
  })

  it('4,872 rows: 1899–2101 × 24 in order, integer T strictly increasing, ceil of the root', () => {
    expect(rows).toHaveLength(4872)
    rows.forEach((r, i) => {
      expect(+r[0]).toBe(1899 + Math.floor(i / 24))
      expect(+r[1]).toBe((19 + (i % 24)) % 24)
      expect(Number.isInteger(+r[3]) && Number.isInteger(+r[4])).toBe(true)
      if (r[7] === '0') expect(+r[3] - 1 < +r[2] && +r[2] <= +r[3]).toBe(true)
      expect(new Date(+r[4]).toISOString()).toBe(r[5])
      if (i) expect(+r[3]).toBeGreaterThan(+rows[i - 1]![3])
    })
  })
})

describe('golden-v4 Group B schema and design', () => {
  for (const rule of RULES) {
    it(`${rule}: metadata, coverage and exact boundary samples`, () => {
      const doc = json(`golden-v4/group-b/${rule}.json`)
      expect(doc.reviewStatus).toBe('REVIEWED_FROZEN')
      expect(doc.productionUsed).toBe(false)
      const fx = doc.fixtures as Array<Record<string, any>>
      expect(fx.length).toBe(rule === 'month-sha' ? 123 : 122)
      expect(new Set(fx.filter((f) => f.fixtureClass === 'interior-positive').map((f) => f.context.monthJian)).size).toBe(12)
      expect(new Set(fx.filter((f) => f.fixtureClass === 'interior-negative').map((f) => f.context.monthJian)).size).toBe(12)
      const boundary = fx.filter((f) => f.fixtureClass === 'exact-boundary')
      expect(boundary).toHaveLength(63)
      for (let i = 0; i < 63; i += 3) {
        const [b, at, af] = boundary.slice(i, i + 3)
        expect([b.boundary.offsetMs, at.boundary.offsetMs, af.boundary.offsetMs]).toEqual([-1, 0, 1])
        expect(at.civilEpochMs - b.civilEpochMs).toBe(1)
        expect(af.civilEpochMs - at.civilEpochMs).toBe(1)
        // T - 1 ms OLD, T NEW, T + 1 ms NEW: Jian advances by exactly one at T.
        expect(BR.indexOf(at.context.monthJian)).toBe((BR.indexOf(b.context.monthJian) + 1) % 12)
        expect(af.context.monthJian).toBe(at.context.monthJian)
      }
      expect(fx.filter((f) => f.fixtureClass === 'rounded-minute-discriminator')).toHaveLength(2)
      for (const f of fx) expect(Date.parse(f.instant)).toBe(f.civilEpochMs)
    })
  }
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import definitions from '../almanac-data/xieji-god-definitions.json'
import art from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import golden from '../almanac-data/golden-p4-remaining-ji-v8.json'
import scanLock from '../../docs/audits/sources/p4-vol10/youhuo-scan-lock.json'
import yuebiaoLockV1 from '../../docs/audits/sources/p4-vol10/yuebiao-witness-lock.json'
import yuebiaoLock from '../../docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json'
import goldenLockV7 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v7.json'
import lockV6 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v6.json'
import lockV7 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v7.json'
import goldenLockV8 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v8.json'
import lock from '../../docs/audits/sources/p4-vol10/remaining-ji-lock.json'
import goldenLockV6 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v6.json'
import goldenLockV4 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v4.json'
import goldenLockV3 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v3.json'
import goldenLockV2 from '../../docs/audits/sources/p4-vol10/remaining-ji-golden-lock-v2.json'
import lockV5 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v5.json'
import lockV4 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v4.json'
import lockV3 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v3.json'
import lockV2 from '../../docs/audits/sources/p4-vol10/remaining-ji-lock-v2.json'
import { resolveP4RemainingJi } from './p4RemainingJi'
import { getXiejiGodPresence } from './xiejiGodPresence'

const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
describe('P4-B remaining 忌, audit only', () => {
  it('preserves the pre-code source and oracle lock', () => {
    for (const f of [
      ...lock.files,
      ...scanLock.files,
      ...yuebiaoLockV1.pages,
      ...yuebiaoLock.pages,
      ...yuebiaoLock.vol10Print.files,
      ...lockV6.files,
      ...goldenLockV7.files,
      ...lockV7.files,
      ...goldenLockV8.files,
      ...lockV2.files,
      ...goldenLockV2.files,
      ...lockV3.files,
      ...lockV4.files,
      ...lockV5.files,
      ...goldenLockV3.files,
      ...goldenLockV4.files,
      ...goldenLockV6.files,
    ])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    for (const e of [...art.entries, ...art.dayRules]) {
      const refs = [
        e.source,
        ...('presence' in e && 'quotes' in e.presence ? (e.presence.quotes ?? []) : []),
      ]
      for (const q of refs) {
        const raw = Array.from(
          readFileSync(`docs/audits/sources/p4-vol10/vol${q.volume.slice(1)}.raw.txt`, 'utf8'),
        )
        expect(raw.slice(q.offset, q.offset + Array.from(q.text).length).join('')).toBe(q.text)
      }
    }
    for (const [v, hash] of Object.entries(art.sources))
      expect(
        createHash('sha1')
          .update(readFileSync(`docs/audits/sources/p4-vol10/vol${v}.raw.txt`))
          .digest('hex'),
      ).toBe(hash)
    expect(art.scoringReady).toBe(false)
  })
  it.each(golden.cases)('$month月$pillar $god: $note', (c) => {
    const r = resolveP4RemainingJi(c.month, c.pillar)
    for (const [h, state] of Object.entries(c.headings))
      expect(r.scopes[c.god]?.headings[h], h).toBe(state)
  })
  it('covers every frozen inventory token without silently treating unsupported as absent', () => {
    for (const month of B)
      for (let i = 0; i < 60; i++) {
        const r = resolveP4RemainingJi(month, S[i % 10]! + B[i % 12]!)
        expect(Object.keys(r.dormantPresence)).toHaveLength(21)
        for (const def of definitions.items.slice(0, 21)) {
          const solarMonth = String(((B.indexOf(month) + 10) % 12) + 1)
          const values = (def.table as Record<string, string[]>)[solarMonth]!
          const pillar = S[i % 10]! + B[i % 12]!
          const present = values.some((v) =>
            v.length === 2 ? v === pillar : S.includes(v) ? v === pillar[0] : v === pillar[1],
          )
          expect(r.dormantPresence[def.id], `${month} ${pillar} ${def.han}`).toBe(present)
        }
        expect(r.scopes['八風']?.presence).not.toBe('unknown')
        expect(r.scopes['復日']?.presence).not.toBe('unknown')
        expect(r.scopes['重日']?.presence).not.toBe('unknown')
        for (const e of art.entries) expect(r.scopes[e.han]).toBeDefined()
      }
  }, 60_000)
  it('uses the explicit 厭對/招搖 按 to lift both named scopes with 德赦', () => {
    // 寅月 厭對=辰, 丙 is 月德. 卷十 按 says both names share the same virtue lift.
    const r = resolveP4RemainingJi('寅', '丙辰')
    expect(r.scopes['招搖']!.headings['乘船渡水']).toBe('lifted')
  })
  it('rejects invalid context', () => {
    expect(() => resolveP4RemainingJi('X', '甲子')).toThrow(RangeError)
    expect(() => resolveP4RemainingJi('寅', '甲丑')).toThrow(RangeError)
  })
})

describe('P4-B presence against the 月表 day pages (witness, read by eye)', () => {
  it('lists a 凶神 on the page iff the scope is present', () => {
    const misses: string[] = []
    for (const page of yuebiaoLock.pages) {
      const r = resolveP4RemainingJi(page.monthJian, page.pillar)
      for (const [han, scope] of Object.entries(r.scopes)) {
        if (scope.presence === 'unknown') continue
        // 滿日 is the 建除 officer in the page heading, not a 凶神 row.
        const listed = han === '滿日' ? page.officer === '滿' : page.xiongShen.includes(han)
        if (listed !== (scope.presence === 'present'))
          misses.push(
            `${page.monthJian}${page.pillar} ${han}: page=${listed} model=${scope.presence}`,
          )
      }
    }
    expect(misses).toEqual([])
  })
  it('never puts 天赦 or 天願 on 滿日, as the 卷十 note says', () => {
    for (const month of B)
      for (let i = 0; i < 60; i++) {
        const pillar = S[i % 10]! + B[i % 12]!
        if (resolveP4RemainingJi(month, pillar).scopes['滿日']!.presence !== 'present') continue
        const gods = getXiejiGodPresence(B.indexOf(month), i % 10, i % 12)
        expect('thien_xa' in gods || 'thien_nguyen' in gods, `${month}${pillar}`).toBe(false)
      }
  })
})

import { describe, expect, it } from 'vitest'
import defs from '../almanac-data/xieji-god-definitions.json'
import goodGods from '../almanac-data/good-gods.json'
import badGods from '../almanac-data/bad-gods.json'
import { STARS } from './stars.data'
import { starApplies } from './stars'
import { isMonthlyShaPresent, type MonthlyShaId } from './xiejiMonthlySha'
import { getVol10VirtuesPresent, type Vol10Virtue } from './xiejiVirtues'
import { evaluateGroupBContext } from './groupB'

// Audit inventory (docs/audits/dormant-legacy-gods.md). 協紀 day rules for the 35 scoring gods with
// no audited presence source. Diagnostics only: nothing here feeds godPresence or scores.
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const pillar = (i: number) => STEMS[i % 10]! + BRANCHES[i % 12]!
/** Month 1..12 = 寅月..丑月. */
const jianBranch = (month: number) => (month + 1) % 12
const table = (id: string) => defs.items.find((d) => d.id === id)!.table as Record<string, string[]>
const present = (id: string, month: number, i: number) =>
  table(id)[month]!.some((v) =>
    v.length === 2
      ? v === pillar(i)
      : STEMS.includes(v)
        ? STEMS[i % 10] === v
        : BRANCHES[i % 12] === v,
  )
const every = (check: (month: number, i: number) => void) => {
  for (let month = 1; month <= 12; month++) for (let i = 0; i < 60; i++) check(month, i)
}

// godPresenceCoverage.test.ts (21 never present) + the 14 legacy lunar-month bridges.
const NEVER_PRESENT = [
  'thien_nguyen',
  'tu_tuong',
  'thoi_duc',
  'ngu_hop',
  'bat_tuong',
  'thien_thuong',
  'pho_ho',
  'tai_sat',
  'nguyet_sat',
  'nguyet_hai',
  'nguyet_yem',
  'yem_doi',
  'dai_thoi',
  'tu_phe',
  'tu_ky',
  'tu_cung',
  'ngu_mo',
  'ngu_ly',
  'vang_vong',
  'bat_chuyen',
  'quy_ky',
]
const LEGACY_LUNAR = [
  'thien_xa',
  'nguyet_an',
  'dan_nhat',
  'tam_hop',
  'thien_hy',
  'luc_hop',
  'ngu_phu',
  'giai_than',
  'phuc_sinh',
  'thanh_tam',
  'ich_hau',
  'tuc_the',
  'nguyet_hinh',
  'thien_lai',
]
// Day-table names whose identity with a catalog god was unproven (truc-than-context-audit.md §2).
const ALIASES: Record<string, string> = {
  pho_ho: 'Phổ Hộ (Hội Hộ)',
  tai_sat: 'Phi Ma Sát (Tai Sát)',
  nguyet_sat: 'Nguyệt Hư (Nguyệt Sát)',
  nguyet_yem: 'Nguyệt Yếm Đại Hoạ',
  vang_vong: 'Vãng Vong (Thổ Kỵ)',
}

describe('協紀 day rules for dormant and legacy catalog gods', () => {
  it('covers exactly the 21 never-present and 14 legacy lunar-month gods', () => {
    expect(defs.items.map((d) => d.id).sort()).toEqual([...NEVER_PRESENT, ...LEGACY_LUNAR].sort())
    const catalog = new Map([...goodGods.items, ...badGods.items].map((g) => [g.id, g.han]))
    for (const d of defs.items) {
      expect(d.han, d.id).toBe(catalog.get(d.id))
      expect(Object.keys(d.table!), d.id).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
      ])
      expect(d.quotes.length, d.id).toBeGreaterThan(0)
    }
  })

  it('agrees with the locked 卷十 presence modules', () => {
    const sha: Record<string, MonthlyShaId> = {
      nguyet_yem: 'yue_yan',
      nguyet_hinh: 'yue_xing',
      nguyet_sat: 'yue_sha',
      tai_sat: 'zai_sha',
    }
    const virtues: Record<string, Vol10Virtue> = {
      thien_xa: '天赦',
      thien_nguyen: '天願',
      nguyet_an: '月恩',
      tu_tuong: '四相',
    }
    every((month, i) => {
      for (const [id, sid] of Object.entries(sha))
        expect(present(id, month, i), `${id} ${month} ${pillar(i)}`).toBe(
          isMonthlyShaPresent(sid, jianBranch(month), i % 12),
        )
      const v = getVol10VirtuesPresent(jianBranch(month), i % 10, i % 12)
      for (const [id, name] of Object.entries(virtues))
        expect(present(id, month, i), `${id} ${month} ${pillar(i)}`).toBe(v.has(name))
    })
  })

  it('agrees with the frozen Group B v3.1 tables (災煞, 月煞)', () => {
    every((month, i) => {
      const rows = evaluateGroupBContext({
        monthJian: BRANCHES[jianBranch(month)]!,
        dayStem: STEMS[i % 10]!,
        dayBranch: BRANCHES[i % 12]!,
      })
      const hit = (id: string) => rows.find((r) => r.id === id)!.matched
      expect(present('tai_sat', month, i)).toBe(hit('disaster-sha'))
      expect(present('nguyet_sat', month, i)).toBe(hit('month-sha'))
    })
  })

  it('matches the 建除 relations 協紀 states (天喜 = 成, 三合 = 定+成)', () => {
    for (let month = 1; month <= 12; month++) {
      const jian = jianBranch(month)
      expect(table('thien_hy')[month]).toEqual([BRANCHES[(jian + 8) % 12]])
      expect([...table('tam_hop')[month]!].sort()).toEqual(
        [BRANCHES[(jian + 4) % 12], BRANCHES[(jian + 8) % 12]].sort(),
      )
    }
  })

  it('legacy and alias day tables equal the 協紀 rule month by month; only the month basis differs', () => {
    const label = new Map([...goodGods.items, ...badGods.items].map((g) => [g.id, g.label]))
    const names = {
      ...Object.fromEntries(LEGACY_LUNAR.map((id) => [id, label.get(id)!])),
      ...ALIASES,
    }
    for (const [id, name] of Object.entries(names)) {
      const star = STARS.find((s) => s.name === name)
      expect(star, name).toBeDefined()
      every((month, i) => {
        const ctx = {
          lunarMonth: month,
          lunarDay: 0,
          can: i % 10,
          chi: i % 12,
          canChi: i,
          officer: -1,
          mansion: -1,
        }
        expect(starApplies(star!.rule, ctx), `${name} ${month} ${pillar(i)}`).toBe(
          present(id, month, i),
        )
      })
    }
  })
})

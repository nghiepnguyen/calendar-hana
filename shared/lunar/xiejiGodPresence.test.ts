import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import definitions from '../almanac-data/xieji-god-definitions.json'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getDayInfo } from './index'
import { resolveDayRuleGods, resolvePresentGods } from './godMapping'
import { getXiejiGodPresence } from './xiejiGodPresence'

const IDS = definitions.items.map((d) => d.id)
const NEVER_PRESENT = new Set([
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
])

describe('協紀 presence for dormant and legacy gods (diagnostics only)', () => {
  it('applies each table on Month Jian with explicit operands', () => {
    // 寅月 (Jian 2): 天喜 on 戌 (成日), 天願 on 乙亥, 時德 (spring) on 午, 五離 on 申/酉 any month.
    expect(getXiejiGodPresence(2, 4, 10).thien_hy).toEqual([
      { operand: 'MONTH_JIAN_BRANCH', equals: 2 },
      { operand: 'DAY_BRANCH', equals: 10 },
    ])
    expect(getXiejiGodPresence(2, 1, 11).thien_nguyen).toEqual([
      { operand: 'MONTH_JIAN_BRANCH', equals: 2 },
      { operand: 'DAY_STEM', equals: 1 },
      { operand: 'DAY_BRANCH', equals: 11 },
    ])
    expect(getXiejiGodPresence(3, 0, 6).thoi_duc).toBeDefined()
    expect(getXiejiGodPresence(5, 0, 8).ngu_ly).toEqual([{ operand: 'DAY_BRANCH', equals: 8 }])
    // 不將 未月 戊午 excluded by owner decision (逐陣).
    expect(getXiejiGodPresence(7, 4, 6).bat_tuong).toBeUndefined()
    expect(() => getXiejiGodPresence(12, 0, 0)).toThrow(RangeError)
  })

  it('2025–2027: every disagreement with production presence comes from the month basis', () => {
    const count: Record<string, { both: number; onlyProduction: number; onlyXieji: number }> = {}
    for (const id of IDS) count[id] = { both: 0, onlyProduction: 0, onlyXieji: 0 }
    for (const { date } of baseline.days) {
      const almanac = getAlmanac(date as never)
      const { can, chi } = almanac.dayCanChi
      const jian = almanac.selectionContext.MONTH_JIAN_BRANCH!
      const lunar = getDayInfo(date as never).lunar
      const production = new Set([
        ...Object.values(resolvePresentGods(almanac.stars)).flat(),
        ...Object.values(resolveDayRuleGods({ can, chi, lunarDay: lunar.day })).flat(),
      ])
      const xieji = getXiejiGodPresence(jian, can, chi)
      for (const id of IDS) {
        const p = production.has(id)
        const x = id in xieji
        if (p && x) count[id]!.both++
        else if (p) count[id]!.onlyProduction++
        else if (x) count[id]!.onlyXieji++
        if (p === x) continue
        // Never-present gods have no production source; legacy gods differ only where the lunar
        // month number differs from the Month Jian month number (寅 = 1).
        if (NEVER_PRESENT.has(id)) expect(p, `${date} ${id}`).toBe(false)
        else expect(lunar.month, `${date} ${id}`).not.toBe(((jian + 10) % 12) + 1)
      }
    }
    for (const id of NEVER_PRESENT) expect(count[id]!.onlyProduction, id).toBe(0)
    if (process.env.REPORT_FILE)
      writeFileSync(
        process.env.REPORT_FILE,
        [
          'id\tboth\tonly_production\tonly_xieji',
          ...IDS.map((id) => {
            const c = count[id]!
            return `${id}\t${c.both}\t${c.onlyProduction}\t${c.onlyXieji}`
          }),
        ].join('\n') + '\n',
      )
  }, 600_000)
})

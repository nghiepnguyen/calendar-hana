import { describe, expect, it } from 'vitest'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import { evaluateGroupBContext } from './groupB'
import { isMonthlyShaPresent, MONTHLY_SHA, type MonthlyShaId } from './xiejiMonthlySha'
import { resolveVol10, type Vol10Day } from './xiejiVol10Resolution'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const B = (c: string) => BRANCHES.indexOf(c)
const S = (c: string) => '甲乙丙丁戊己庚辛壬癸'.indexOf(c)
const OFFICERS = '建除滿平定執破危成收開閉'
const at = (id: MonthlyShaId, month: string) =>
  [...BRANCHES].find((b) => isMonthlyShaPresent(id, B(month), B(b)))

describe('monthly 凶 positions (協紀 卷三/卷四/卷六)', () => {
  it('matches the source sequences read by hand', () => {
    // 正月起戌逆行十二辰
    expect([...'寅卯辰巳午未申酉戌亥子丑'].map((m) => at('yue_yan', m)).join('')).toBe(
      '戌酉申未午巳辰卯寅丑子亥',
    )
    // 寅刑巳 卯刑子 辰自刑 巳刑申 午自刑 未刑丑 申刑寅 酉自刑 戌刑未 亥自刑 子刑卯 丑刑戌
    expect([...'寅卯辰巳午未申酉戌亥子丑'].map((m) => at('yue_xing', m)).join('')).toBe(
      '巳子辰申午丑寅酉未亥卯戌',
    )
    expect(at('yue_sha', '寅')).toBe('丑')
    expect(at('zai_sha', '寅')).toBe('子')
  })

  it('agrees with the frozen Group B v3.1 authority for 月煞 and 災煞', () => {
    const ids = { yue_sha: 'month-sha', zai_sha: 'disaster-sha' } as const
    for (const month of BRANCHES)
      for (const branch of BRANCHES)
        for (const [id, groupB] of Object.entries(ids)) {
          const rule = evaluateGroupBContext(
            { monthJian: month, dayStem: '甲', dayBranch: branch },
            [groupB],
          )[0]!
          expect(isMonthlyShaPresent(id as MonthlyShaId, B(month), B(branch))).toBe(rule.matched)
        }
  })

  it('falls on the officer days that 卷十 names for each month', () => {
    // Officer index = (day branch − Month Jian) mod 12; each claim is a 值X日 phrase of 卷十.
    const claims: [MonthlyShaId, string, string][] = [
      ['yue_yan', '寅申', '成'],
      ['yue_yan', '丑未', '開'],
      ['yue_yan', '辰戌', '定'],
      ['yue_yan', '巳亥', '滿'],
      ['yue_yan', '子午', '建'],
      ['yue_yan', '卯酉', '破'],
      ['yue_xing', '巳寅子', '平'],
      ['yue_xing', '辰酉亥午', '建'],
      ['yue_xing', '丑戌卯', '收'],
      ['yue_xing', '未申', '破'],
      ['yue_sha', '寅申巳亥', '閉'],
      ['yue_sha', '辰戌丑未', '平'],
      ['yue_sha', '卯酉', '危'],
      ['zai_sha', '寅申巳亥', '開'],
      ['zai_sha', '辰戌丑未', '滿'],
      ['zai_sha', '子午卯酉', '破'],
    ]
    for (const [id, months, officer] of claims)
      for (const m of months) {
        const branch = B(at(id, m)!)
        expect(OFFICERS[(branch - B(m) + 12) % 12], `${id} ${m}`).toBe(officer)
      }
  })

  it('quotes every definition and rejects bad operands', () => {
    expect(MONTHLY_SHA.map((d) => d.id).sort()).toEqual(
      ['yue_yan', 'yue_xing', 'yue_sha', 'zai_sha'].sort(),
    )
    expect(() => isMonthlyShaPresent('yue_yan', 12, 0)).toThrow(RangeError)
  })

  it('忌同刼煞 entries point at 刼煞 and say so in their source lines', () => {
    for (const e of vol10.entries as { han: string; avoidSameAs?: string; sourceLines: string[] }[])
      if (e.avoidSameAs) {
        expect(e.avoidSameAs).toBe('jie_sha')
        expect(e.sourceLines[0]).toBe('忌同刼煞')
      }
  })
})

const day = (
  month: string,
  pillar: string,
  officerId: string,
  gods: string[] = [],
  unknown: string[] = [],
): Vol10Day => ({
  monthJianBranch: B(month),
  dayStem: S(pillar[0]),
  dayBranch: B(pillar[1]),
  officerId,
  presentGods: new Set(gods),
  unknownGods: new Set(unknown),
})
const find = (d: Vol10Day, entry: string, activityId: string) =>
  resolveVol10(d, [activityId]).find((r) => r.entry === entry)
const verdict = (d: Vol10Day, entry: string, activityId: string) =>
  find(d, entry, activityId)?.verdict

// Expected values reasoned by hand from the quoted 卷十 sentences, not produced by the module.
// Pillars are real days on the named officer and 凶 for that Month Jian.
describe('協紀 卷十 月厭/月刑/月煞/災煞, hand-derived cases', () => {
  it('平日 in 辰 month follows 月煞: without 德 all taboo, with 德合 as usual', () => {
    expect(verdict(day('辰', '乙未', 'binh'), 'ping_ri', 'worship')).toBe('avoid')
    expect(find(day('辰', '乙未', 'binh'), 'ping_ri', 'worship')?.via).toBe('yue_sha')
    const withDe = day('辰', '丁未', 'binh', ['thien_duc_hop', 'nguyet_duc_hop'])
    expect(verdict(withDe, 'ping_ri', 'wedding')).toBe('avoid')
    expect(verdict(withDe, 'ping_ri', 'worship')).toBe('not_listed')
  })
  it('閉日 in 寅 month follows 月煞', () => {
    expect(verdict(day('寅', '乙丑', 'be'), 'bi_ri', 'worship')).toBe('avoid')
    expect(verdict(day('寅', '丁丑', 'be', ['thien_duc']), 'bi_ri', 'worship')).toBe('not_listed')
  })
  it('收日 in 卯 month follows 月刑: 天德 is a trigram that month, so only 月德 decides', () => {
    expect(verdict(day('卯', '丙子', 'thu', [], ['thien_duc']), 'shou_ri', 'wedding')).toBe(
      'undetermined',
    )
    const withDe = day('卯', '甲子', 'thu', ['nguyet_duc'], ['thien_duc'])
    expect(verdict(withDe, 'shou_ri', 'wedding')).toBe('avoid')
    expect(verdict(withDe, 'shou_ri', 'worship')).toBe('not_listed')
  })
  it('月刑 in 巳 month with 月德 keeps only military and medical taboo', () => {
    const d = day('巳', '庚申', 'binh', ['nguyet_duc'])
    expect(verdict(d, 'yue_xing', 'wedding')).toBe('not_avoided')
    expect(verdict(d, 'yue_xing', 'medical')).toBe('avoid')
  })
  it('月刑 in 寅 month: with 天德 annotates nothing, without as usual', () => {
    expect(verdict(day('寅', '丁巳', 'binh', ['thien_duc']), 'yue_xing', 'wedding')).toBe(
      'no_annotation',
    )
    expect(verdict(day('寅', '乙巳', 'binh'), 'yue_xing', 'wedding')).toBe('avoid')
  })
  it('月厭 in 寅 month with 月德 avoids travel/office/marriage list only', () => {
    const d = day('寅', '丙戌', 'thanh', ['nguyet_duc'])
    expect(verdict(d, 'yue_yan', 'wedding')).toBe('avoid')
    expect(verdict(d, 'yue_yan', 'construction')).toBe('not_avoided')
    expect(verdict(day('寅', '甲戌', 'thanh'), 'yue_yan', 'worship')).toBe('avoid') // 陰陽大會
  })
  it('月厭 in 卯 month (月破, 災煞) is all taboo even with 德', () => {
    expect(verdict(day('卯', '乙酉', 'pha', ['nguyet_pha']), 'yue_yan', 'worship')).toBe('avoid')
  })
  it('月厭 in 子 month: as usual only on 天赦 (甲子); 戊子 (陰陽小會) is all taboo', () => {
    expect(verdict(day('子', '庚子', 'kien'), 'yue_yan', 'worship')).toBe('avoid')
    expect(verdict(day('子', '甲子', 'kien'), 'yue_yan', 'worship')).toBe('not_listed')
    expect(verdict(day('子', '甲子', 'kien'), 'yue_yan', 'wedding')).toBe('avoid')
    expect(verdict(day('子', '戊子', 'kien'), 'yue_yan', 'worship')).toBe('avoid')
    expect(find(day('子', '庚子', 'kien'), 'yue_jian', 'wedding')?.via).toBe('yue_yan')
  })
  it('災煞 in 卯 month follows 月破 (all taboo in 卯酉 months)', () => {
    const r = find(day('卯', '乙酉', 'pha', ['nguyet_pha']), 'zai_sha', 'worship')
    expect(r?.verdict).toBe('avoid')
    expect(r?.via).toBe('yue_po')
  })
  it('災煞 in 寅 month: with 天德合 only military/medical, without annotates nothing', () => {
    const d = day('寅', '壬子', 'khai', ['thien_duc_hop'])
    expect(verdict(d, 'zai_sha', 'wedding')).toBe('not_avoided')
    expect(verdict(d, 'zai_sha', 'medical')).toBe('avoid')
    expect(verdict(day('寅', '甲子', 'khai'), 'zai_sha', 'wedding')).toBe('no_annotation')
    expect(verdict(day('辰', '甲午', 'man'), 'zai_sha', 'wedding')).toBe('avoid')
  })
  it('月煞 in 卯 month needs 月德 or 天願; in 子 month 月德合 cancels both', () => {
    expect(verdict(day('卯', '甲戌', 'nguy', ['nguyet_duc']), 'yue_sha', 'wedding')).toBe(
      'not_avoided',
    )
    // 丙戌 is neither 月德 (甲) nor 天願 (甲戌) → 不註宜忌.
    expect(verdict(day('卯', '丙戌', 'nguy'), 'yue_sha', 'wedding')).toBe('no_annotation')
    expect(verdict(day('子', '丁未', 'nguy', ['nguyet_duc_hop']), 'yue_sha', 'wedding')).toBe(
      'no_annotation',
    )
    expect(verdict(day('子', '乙未', 'nguy'), 'yue_sha', 'wedding')).toBe('avoid')
  })
})

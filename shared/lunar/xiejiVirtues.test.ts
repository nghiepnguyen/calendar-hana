import { describe, expect, it } from 'vitest'
import { getVol10VirtuesPresent } from './xiejiVirtues'
import { resolveVol10, type Vol10Day } from './xiejiVol10Resolution'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const JIAN = '寅卯辰巳午未申酉戌亥子丑'
const OFFICERS = '建除滿平定執破危成收開閉'
const B = (c: string) => BRANCHES.indexOf(c)
const S = (c: string) => STEMS.indexOf(c)
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10]! + BRANCHES[i % 12]!)
const daysWith = (month: string, han: string) =>
  PILLARS.filter((p) => getVol10VirtuesPresent(B(month), S(p[0]!), B(p[1]!)).has(han as never))

describe('卷五 virtue positions', () => {
  it('天赦 and 天願 match the 歴例 sentences read by hand', () => {
    expect([...JIAN].map((m) => daysWith(m, '天赦').join()).join(' ')).toBe(
      '戊寅 戊寅 戊寅 甲午 甲午 甲午 戊申 戊申 戊申 甲子 甲子 甲子',
    )
    expect([...JIAN].map((m) => daysWith(m, '天願').join()).join(' ')).toBe(
      '甲午 甲戌 乙酉 丙子 丁丑 戊午 甲寅 丙辰 辛卯 戊辰 甲子 癸未',
    )
  })
  it('月恩 and 四相 are day-stem rules', () => {
    const stems = (month: string, han: string) =>
      [...new Set(daysWith(month, han).map((p) => p[0]))].join('')
    expect([...JIAN].map((m) => stems(m, '月恩')).join('')).toBe('丙丁庚己戊辛壬癸庚乙甲辛')
    expect([...JIAN].map((m) => stems(m, '四相')).join(' ')).toBe(
      '丙丁 丙丁 丙丁 戊己 戊己 戊己 壬癸 壬癸 壬癸 甲乙 甲乙 甲乙',
    )
  })
  it('the 卷十 notes 不得與X併 sit exactly where 天願/天赦 meet that day', () => {
    const officer = (month: string, pillar: string) =>
      OFFICERS[(B(pillar[1]!) - B(month) + 12) % 12]
    // 〔天願不得與月建併〕: 天願 falls on 建 only in 子 month (曹震圭: 十一月以其自建者).
    expect([...JIAN].filter((m) => officer(m, daysWith(m, '天願')[0]!) === '建')).toEqual(['子'])
    // 〔天赦天願不得與月破併〕: 天願 falls on 破 in 申 and 丑 months.
    expect([...JIAN].filter((m) => officer(m, daysWith(m, '天願')[0]!) === '破')).toEqual([
      '申',
      '丑',
    ])
    // 月建 lists 天赦 among its virtues: 天赦 falls on 建 in 寅午申子 months.
    expect([...JIAN].filter((m) => officer(m, daysWith(m, '天赦')[0]!) === '建')).toEqual([
      '寅',
      '午',
      '申',
      '子',
    ])
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
  dayStem: S(pillar[0]!),
  dayBranch: B(pillar[1]!),
  officerId,
  presentGods: new Set(gods),
  unknownGods: new Set(unknown),
})
const verdict = (d: Vol10Day, entry: string, activityId: string) =>
  resolveVol10(d, [activityId]).find((r) => r.entry === entry)?.verdict

// Hand-derived from the 卷十 sentences with the 卷五 positions above.
describe('卷十 with 天赦/天願/月恩/四相 known', () => {
  it('月建 in 未 month on 辛未 (月恩) keeps only the earthwork taboo', () => {
    expect(verdict(day('未', '辛未', 'kien'), 'yue_jian', 'wedding')).toBe('not_avoided')
    expect(verdict(day('未', '辛未', 'kien'), 'yue_jian', 'construction')).toBe('avoid')
  })
  it('月建 in 未 month on 己未 (四相, 陽錯) ignores the virtue', () => {
    expect(verdict(day('未', '己未', 'kien'), 'yue_jian', 'wedding')).toBe('avoid')
  })
  it('閉日 in 未 month on 戊午 (天願) annotates nothing', () => {
    expect(verdict(day('未', '戊午', 'be'), 'bi_ri', 'wedding')).toBe('no_annotation')
  })
  it('月破 in 申 month on 甲寅 (天願) stays all taboo: 天願 does not count with 月破', () => {
    expect(verdict(day('申', '甲寅', 'pha', ['nguyet_pha']), 'yue_po', 'worship')).toBe('avoid')
  })
  it('月破 in 子 month (天德 巽, unknown) on 甲午: 天德合 is absent (四仲之月…無合), so all taboo', () => {
    const d = day('子', '甲午', 'pha', ['nguyet_pha'], ['thien_duc'])
    expect(verdict(d, 'yue_po', 'worship')).toBe('avoid')
  })
})

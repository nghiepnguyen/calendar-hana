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
  it('天赦 (歴例) and 天願 (按 起例, not the rejected 歴例 list) match the text read by hand', () => {
    expect([...JIAN].map((m) => daysWith(m, '天赦').join()).join(' ')).toBe(
      '戊寅 戊寅 戊寅 甲午 甲午 甲午 戊申 戊申 戊申 甲子 甲子 甲子',
    )
    expect([...JIAN].map((m) => daysWith(m, '天願').join()).join(' ')).toBe(
      '乙亥 甲戌 乙酉 丙申 丁未 戊午 己巳 庚辰 辛卯 壬寅 癸丑 甲子',
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
  it('agrees with the 月表 scan (四庫全書 卷二十一/二十四/二十七/三十, read page by page)', () => {
    // Witness readings from the day pages of the four 仲 months; independent of 卷五.
    const witness: Record<string, { 天願: string; 天赦: string }> = {
      卯: { 天願: '甲戌', 天赦: '戊寅' },
      午: { 天願: '丁未', 天赦: '甲午' },
      酉: { 天願: '庚辰', 天赦: '戊申' },
      子: { 天願: '癸丑', 天赦: '甲子' },
    }
    for (const [month, w] of Object.entries(witness)) {
      expect(daysWith(month, '天願'), month).toEqual([w.天願])
      expect(daysWith(month, '天赦'), month).toEqual([w.天赦])
    }
  })
  it('the 卷十 notes 不得與X併 name days that 天願/天赦 never meet; clauses naming 天願 do', () => {
    const officer = (month: string, han: string) =>
      OFFICERS[(B(daysWith(month, han)[0]![1]!) - B(month) + 12) % 12]
    // 〔天願不得與月建併〕〔天赦天願不得與月破併〕〔天赦天願不得與滿日併〕
    for (const m of JIAN) {
      expect(['建', '破', '滿']).not.toContain(officer(m, '天願'))
      expect(['破', '滿']).not.toContain(officer(m, '天赦'))
    }
    // 月建 lists 天赦 among its virtues: 天赦 falls on 建 in 寅午申子 months.
    expect([...JIAN].filter((m) => officer(m, '天赦') === '建')).toEqual(['寅', '午', '申', '子'])
    // 月煞 卯酉 “與月德天願併” and 月刑 巳 “與月德天德合天願併”: 天願 sits on that 凶's day.
    expect(daysWith('卯', '天願')).toEqual(['甲戌']) // 月煞 卯 = 戌
    expect(daysWith('酉', '天願')).toEqual(['庚辰']) // 月煞 酉 = 辰
    expect(daysWith('巳', '天願')).toEqual(['丙申']) // 月刑 巳 = 申
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
  it('月煞 in 酉 month on 庚辰 (天願) keeps only military and medical taboo', () => {
    // 酉 month: 天德 艮 (no day), 月德 庚 — 庚辰 also carries 月德; both satisfy “與月德天願併”.
    expect(verdict(day('酉', '庚辰', 'nguy'), 'yue_sha', 'wedding')).toBe('not_avoided')
    expect(verdict(day('酉', '庚辰', 'nguy'), 'yue_sha', 'medical')).toBe('avoid')
  })
  it('月破 in 申 month on 甲寅 without 德 is all taboo', () => {
    expect(verdict(day('申', '甲寅', 'pha', ['nguyet_pha']), 'yue_po', 'worship')).toBe('avoid')
  })
  it('月破 in 子 month (天德 巽) on 甲午: 天德合 absent (四仲之月…無合), so all taboo', () => {
    const d = day('子', '甲午', 'pha', ['nguyet_pha'], ['thien_duc'])
    expect(verdict(d, 'yue_po', 'worship')).toBe('avoid')
  })
})

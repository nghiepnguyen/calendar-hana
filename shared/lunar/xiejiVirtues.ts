/**
 * Presence of four 吉神 named in 卷十 virtue conditions, from 欽定協紀辨方書 (四庫全書本) 卷五 義例三,
 * by Month Jian (seasons 春 = 寅卯辰 … 冬 = 亥子丑). Used only by the 卷十 diagnostics; no star,
 * activity effect or score. 天德 on 坤/乾/艮/巽 months stays unknown: 卷五 itself records two
 * readings (墓 辰戌丑未 per 考原, or 巳亥寅申) and calls the 考原 one “聊存以傳一解”.
 */

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const JIAN = '寅卯辰巳午未申酉戌亥子丑'

export type Vol10Virtue = '天赦' | '天願' | '月恩' | '四相'

interface VirtueDefinition {
  han: Vol10Virtue
  operand: 'DAY_PILLAR' | 'DAY_STEM'
  /** Per Month Jian 寅…丑; a pillar, or the stems that match. */
  targets: readonly string[]
  sourceLocation: string
  quote: string
  reading?: string
}

const bySeason = (spring: string, summer: string, autumn: string, winter: string) =>
  [spring, summer, autumn, winter].flatMap((x) => [x, x, x])

export const VOL10_VIRTUES: readonly VirtueDefinition[] = [
  {
    han: '天赦',
    operand: 'DAY_PILLAR',
    targets: bySeason('戊寅', '甲午', '戊申', '甲子'),
    sourceLocation: '卷五 / 義例三 / 天赦 / 歴例曰',
    quote: '春戊寅夏甲午秋戊申冬甲子是也',
  },
  {
    han: '天願',
    operand: 'DAY_PILLAR',
    targets: [
      '甲午',
      '甲戌',
      '乙酉',
      '丙子',
      '丁丑',
      '戊午',
      '甲寅',
      '丙辰',
      '辛卯',
      '戊辰',
      '甲子',
      '癸未',
    ],
    sourceLocation: '卷五 / 義例三 / 天願 / 歴例曰',
    quote:
      '正月甲午二月甲戌三月乙酉四月丙子五月丁丑六月戊午七月甲寅八月丙辰九月辛卯十月戊辰十一月甲子十二月癸未',
  },
  {
    han: '月恩',
    operand: 'DAY_STEM',
    targets: ['丙', '丁', '庚', '己', '戊', '辛', '壬', '癸', '庚', '乙', '甲', '辛'],
    sourceLocation: '卷五 / 義例三 / 月恩 / 歴例曰',
    quote: '正月丙二月丁三月庚四月巳五月戊六月辛七月壬八月癸九月庚十月乙十一月甲十二月辛',
    reading: '四月 巳 read as the stem 己 (歴神原始: 巳火生巳土, i.e. 己土).',
  },
  {
    han: '四相',
    operand: 'DAY_STEM',
    targets: bySeason('丙丁', '戊己', '壬癸', '甲乙'),
    sourceLocation: '卷五 / 義例三 / 四相 / 歴例曰',
    quote: '春丙丁夏戊巳秋壬癸冬甲乙',
    reading: '夏 戊巳 read as 戊己.',
  },
]

/** Project encoding: branches 0 = 子 … 11 = 亥, stems 0 = 甲 … 9 = 癸. */
export function getVol10VirtuesPresent(
  monthJianBranch: number,
  dayStem: number,
  dayBranch: number,
): Set<Vol10Virtue> {
  const month = BRANCHES[monthJianBranch]
  const stem = STEMS[dayStem]
  const branch = BRANCHES[dayBranch]
  if (!month || !stem || !branch)
    throw new RangeError('Expected Month Jian/branch 0..11, stem 0..9')
  const row = JIAN.indexOf(month)
  return new Set(
    VOL10_VIRTUES.filter((v) =>
      v.operand === 'DAY_PILLAR'
        ? v.targets[row] === stem + branch
        : v.targets[row]!.includes(stem),
    ).map((v) => v.han),
  )
}

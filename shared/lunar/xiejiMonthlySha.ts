/**
 * Day-branch positions of four monthly 凶 from 欽定協紀辨方書 (四庫全書本), by Month Jian.
 * Used only to decide which 卷十 entries are present for diagnostics; it adds no star, no
 * activity effect and no score, and is independent of the legacy lunar-month star tables.
 */

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'

export type MonthlyShaId = 'yue_yan' | 'yue_xing' | 'yue_sha' | 'zai_sha'

interface MonthlyShaDefinition {
  id: MonthlyShaId
  han: string
  /** Day branch for Month Jian 寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑. */
  targets: string
  sourceLocation: string
  quote: string
}

export const MONTHLY_SHA: readonly MonthlyShaDefinition[] = [
  {
    id: 'yue_yan',
    han: '月厭',
    targets: '戌酉申未午巳辰卯寅丑子亥',
    sourceLocation: '卷四 / 義例二 / 隂陽不將 / 天寶厯曰; 地火 / 厯例曰',
    quote: '月厭為隂謂之隂建正月起戌逆行十二辰',
  },
  {
    id: 'yue_xing',
    han: '月刑',
    targets: '巳子辰申午丑寅酉未亥卯戌',
    sourceLocation: '卷六 / 義例四 / 月刑 / 按 → 卷三 / 歲刑 / 曾門經曰',
    quote: '子刑夘丑刑戌寅刑己夘刑子巳刑申未刑丑申刑寅戌刑未辰午酉亥為自刑也',
  },
  {
    id: 'yue_sha',
    han: '月煞',
    targets: '丑戌未辰丑戌未辰丑戌未辰',
    sourceLocation: '卷六 / 義例四 / 月煞 / 歴例曰',
    quote: '月煞者正月起丑逆行四季',
  },
  {
    id: 'zai_sha',
    han: '災煞',
    targets: '子酉午卯子酉午卯子酉午卯',
    sourceLocation: '卷六 / 義例四 / 月災煞 / 按',
    quote: '天獄正月起子順行四仲曹震圭以為天獄即是災煞應逆行四仲而今順行者流傳之誤也其說是今從之',
  },
]

/** Project branch encoding 0 = 子 … 11 = 亥 for both arguments. */
export function isMonthlyShaPresent(id: MonthlyShaId, monthJianBranch: number, dayBranch: number) {
  if (![monthJianBranch, dayBranch].every((n) => Number.isInteger(n) && n >= 0 && n < 12))
    throw new RangeError('Expected Month Jian and day branch 0..11')
  const def = MONTHLY_SHA.find((d) => d.id === id)
  if (!def) throw new RangeError(`Unknown monthly 凶 ${id}`)
  return def.targets[(monthJianBranch + 10) % 12] === BRANCHES[dayBranch]
}

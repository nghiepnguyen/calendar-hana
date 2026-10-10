import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'

/** 協紀辨方書 卷十 宜忌 for six source-locked 凶 entries. Diagnostics only: the result is shown
 * next to the product score and never changes it. Unknown presence or a deferral to an entry that
 * is not transcribed yields `undetermined`, never a guess. */

export type Vol10Effect =
  'as_usual' | 'only_avoid' | 'still_avoid' | 'not_avoid' | 'cancel_both' | 'avoid_all' | 'defer'
export type Vol10Verdict = 'avoid' | 'not_avoided' | 'no_annotation' | 'not_listed' | 'undetermined'

export interface Vol10Day {
  /** Month Jian branch 0 = 子 … 11 = 亥. */
  monthJianBranch: number
  dayStem: number
  dayBranch: number
  officerId: string
  /** Gods whose presence is source-locked and known for this day. */
  presentGods: ReadonlySet<string>
  /** Gods whose presence cannot be decided for this day (unaudited or untranscribed tokens). */
  unknownGods: ReadonlySet<string>
}

export interface Vol10Resolution {
  entry: string
  han: string
  activityId: string
  verdict: Vol10Verdict
  effect: Vol10Effect
  reason: string
  quote: string
  /** Entry whose rule decided the outcome after a 從X論 deferral. */
  via?: string
}

type Clause = {
  months: string[] | '*'
  effect: Vol10Effect
  with?: string[]
  otherwise?: Vol10Effect
  list?: string
  notAvoid?: string
  to?: string
  quote: string
}
type Entry = (typeof vol10.entries)[number] & { clauses: Clause[] }

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const NORM: Record<string, string> = {
  册: '冊',
  宫: '宮',
  㑹: '會',
  產: '産',
  壞: '壊',
  牆: '墻',
  啟: '啓',
  廻: '迴',
  徳: '德',
  隂: '陰',
  夘: '卯',
}
const ALIASES = vol10.headingAliases as Record<string, string[]>
const VOCAB = [
  ...new Set([
    ...Object.values(vol11.activityEntries).flat(),
    ...HEADINGS(),
    ...Object.keys(ALIASES),
  ]),
].sort((a, b) => b.length - a.length)

function HEADINGS(): string[] {
  return '祭祀 祈福 求嗣 上冊進表章 頒詔 覃恩肆赦 施恩封拜 詔命公卿 招賢 舉正直 施恩惠恤孤惸 宣政事 布政事 行惠愛雪寃枉緩刑獄 慶賜賞賀 宴會 入學 冠帶 行幸遣使 安撫邊境 選將訓兵 出師 上官赴任 臨政親民 結婚姻 納采問名 嫁娶 進人口 般移 遠迴 安牀 解除 沐浴 整容剃頭 整手足甲 求醫療病 療目 針刺 裁製 營建宮室 修宮室 繕城郭 築隄防 興造動土 豎柱上梁 修倉庫 鼓鑄 苫蓋 經絡 醞釀 開市 立劵交易 納財 開倉庫出貨財 修置産室 開渠穿井 安碓磑 補垣塞穴 掃舍宇 修飾垣墻 平治道塗 破屋壊垣 伐木 捕捉 畋獵 取魚 乘船渡水 栽種 牧養 納畜 破土 安葬 啓攢'.split(
    ' ',
  )
}

const normalize = (text: string) => [...text].map((c) => NORM[c] ?? c).join('')

/** Splits an unseparated 用事 list into headings; throws on any character it cannot place. */
export function splitHeadings(text: string): string[] {
  const s = normalize(text)
  const out: string[] = []
  for (let i = 0; i < s.length;) {
    const hit = VOCAB.find((v) => s.startsWith(normalize(v), i))
    if (!hit) throw new Error(`Unrecognised 用事 text at ${i}: ${s.slice(i, i + 6)}`)
    out.push(...(ALIASES[hit] ?? [normalize(hit)]))
    i += normalize(hit).length
  }
  return out
}

const ACTIVITY_HEADINGS = vol11.activityEntries as Record<string, string[]>
const ENTRIES = vol10.entries as Entry[]
const ENTRY_BY_HAN = new Map(ENTRIES.map((e) => [normalize(e.han), e]))
const GOD_HAN: Record<string, string> = {
  thien_duc: '天德',
  nguyet_duc: '月德',
  thien_duc_hop: '天德合',
  nguyet_duc_hop: '月德合',
}

function present(entry: Entry, day: Vol10Day): boolean {
  const p = entry.presence as { officer?: string; god?: string }
  return p.officer ? p.officer === day.officerId : day.presentGods.has(p.god!)
}

/** true / false / null (cannot decide). */
function withVirtues(names: string[], day: Vol10Day): boolean | null {
  const known = new Set([...day.presentGods].map((id) => GOD_HAN[id]).filter(Boolean))
  const unknown = new Set([...day.unknownGods].map((id) => GOD_HAN[id]).filter(Boolean))
  if (names.some((n) => known.has(n))) return true
  // Only the four 德/合 gods are source-locked; any other virtue's presence is unknown.
  if (names.some((n) => !Object.values(GOD_HAN).includes(n) || unknown.has(n))) return null
  return false
}

type Resolved = {
  via?: string
  effect: Vol10Effect
  avoided: Set<string> | 'all' | null
  reason: string
  quote: string
}

function resolveEntry(entry: Entry, day: Vol10Day, depth = 0): Resolved {
  const month = BRANCHES[day.monthJianBranch]
  const pillar = STEMS[day.dayStem] + BRANCHES[day.dayBranch]
  const base = [
    ...splitHeadings(entry.avoid),
    ...entry.extraAvoid
      .filter((x) => !('months' in x) || (x.months as string[]).includes(month))
      .flatMap((x) => splitHeadings(x.avoid)),
  ]
  if (entry.allAvoidPillars.some((p) => p.month === month && p.pillar === pillar))
    return {
      effect: 'avoid_all',
      avoided: 'all',
      reason: `${month}月${pillar}: 諸事皆忌`,
      quote: entry.sourceLines.at(-1)!,
    }
  const ignoreVirtues = entry.virtueIgnoredPillars.some(
    (p) => p.month === month && p.pillar === pillar,
  )
  const clause = entry.clauses.find((c) => c.months === '*' || c.months.includes(month))
  const apply = (effect: Vol10Effect, c?: Clause): Resolved => {
    const quote = c?.quote ?? entry.sourceLines[0]
    switch (effect) {
      case 'as_usual':
        return { effect, avoided: new Set(base), reason: '如常例', quote }
      case 'only_avoid':
        return { effect, avoided: new Set(splitHeadings(c!.list!)), reason: '止忌…餘皆不忌', quote }
      case 'still_avoid': {
        const spared = new Set(splitHeadings(c!.notAvoid!))
        return {
          effect,
          avoided: new Set(base.filter((h) => !spared.has(h))),
          reason: '猶忌, 止不忌…',
          quote,
        }
      }
      case 'not_avoid':
        return { effect, avoided: new Set(), reason: '則不忌', quote }
      case 'cancel_both':
        return { effect, avoided: new Set(), reason: '凡所忌者則不註宜所宜者亦不註忌', quote }
      case 'avoid_all':
        return { effect, avoided: 'all', reason: '諸事皆忌', quote }
      default:
        return { effect, avoided: null, reason: 'unresolved', quote }
    }
  }
  if (!clause) return apply('as_usual')
  if (clause.effect === 'defer') {
    const target = ENTRY_BY_HAN.get(normalize(clause.to!))
    if (target && depth === 0) {
      const r = resolveEntry(target, day, 1)
      return {
        ...r,
        via: target.id,
        reason: `從${clause.to}論 → ${r.reason}`,
        quote: `${clause.quote} / ${r.quote}`,
      }
    }
    return {
      effect: 'defer',
      avoided: null,
      reason: `從${clause.to}論 (chưa chép ${clause.to})`,
      quote: clause.quote,
    }
  }
  if (!clause.with) return apply(clause.effect, clause)
  const ok = ignoreVirtues ? false : withVirtues(clause.with, day)
  if (ok === null)
    return {
      effect: clause.effect,
      avoided: null,
      reason: `cần biết có ${clause.with.join('/')} hay không`,
      quote: clause.quote,
    }
  return ok ? apply(clause.effect, clause) : apply(clause.otherwise ?? 'as_usual', clause)
}

/** Per present 凶 entry and catalog activity: what 卷十 concludes for that activity. */
export function resolveVol10(day: Vol10Day, activityIds: readonly string[]): Vol10Resolution[] {
  const out: Vol10Resolution[] = []
  for (const entry of ENTRIES) {
    if (!present(entry, day)) continue
    const r = resolveEntry(entry, day)
    const listed = new Set([
      ...splitHeadings(entry.avoid),
      ...entry.extraAvoid.flatMap((x) => splitHeadings(x.avoid)),
    ])
    for (const activityId of activityIds) {
      const headings = (ACTIVITY_HEADINGS[activityId] ?? []).map(normalize)
      if (!headings.length) continue
      const verdict: Vol10Verdict =
        r.avoided === null
          ? 'undetermined'
          : r.avoided === 'all' || headings.some((h) => (r.avoided as Set<string>).has(h))
            ? 'avoid'
            : !headings.some((h) => listed.has(h))
              ? 'not_listed'
              : r.effect === 'cancel_both'
                ? 'no_annotation'
                : 'not_avoided'
      out.push({
        entry: entry.id,
        han: entry.han,
        activityId,
        verdict,
        effect: r.effect,
        reason: r.reason,
        quote: r.quote,
        ...(r.via ? { via: r.via } : {}),
      })
    }
  }
  return out
}

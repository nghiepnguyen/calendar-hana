import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import { splitHeadings } from './xiejiVol10Resolution'

// Differential lock for splitHeadings: production must match this reference — the pre-optimization
// algorithm (normalize every VOCAB entry at every position) over a snapshot of its NORM table and heading
// list — on every input: same output, or the same error. Change NORM/HEADINGS here only together with
// a deliberate production change.
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
  葢: '蓋',
}
const HEADINGS =
  '祭祀 祈福 求嗣 上冊進表章 頒詔 覃恩肆赦 施恩封拜 詔命公卿 招賢 舉正直 施恩惠恤孤惸 宣政事 布政事 行惠愛雪寃枉緩刑獄 慶賜賞賀 宴會 入學 冠帶 行幸遣使 安撫邊境 選將訓兵 出師 上官赴任 臨政親民 結婚姻 納采問名 嫁娶 進人口 般移 遠迴 安牀 解除 沐浴 整容剃頭 整手足甲 求醫療病 療目 針刺 裁製 營建宮室 修宮室 繕城郭 築隄防 興造動土 豎柱上梁 修倉庫 鼓鑄 苫蓋 經絡 醞釀 開市 立劵交易 納財 開倉庫出貨財 修置産室 開渠穿井 安碓磑 補垣塞穴 掃舍宇 修飾垣墻 平治道塗 破屋壊垣 伐木 捕捉 畋獵 取魚 乘船渡水 栽種 牧養 納畜 破土 安葬 啓攢'.split(
    ' ',
  )
const ALIASES = vol10.headingAliases as Record<string, string[]>
const VOCAB = [
  ...new Set([...Object.values(vol11.activityEntries).flat(), ...HEADINGS, ...Object.keys(ALIASES)]),
].sort((a, b) => b.length - a.length)
const normalize = (text: string) => [...text].map((c) => NORM[c] ?? c).join('')

function referenceSplit(text: string): string[] {
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

type Outcome = { value: string[] } | { error: string; message: string }
const run = (split: (t: string) => string[], text: string): Outcome => {
  try {
    return { value: split(text) }
  } catch (e) {
    return { error: (e as Error).constructor.name, message: (e as Error).message }
  }
}

// Every CJK key/value of the almanac data the P4 pipeline reads (the 112 runtime inputs come from here).
function dataStrings(): string[] {
  const out = new Set<string>()
  const add = (s: string) => /[一-鿿]/.test(s) && s.length <= 60 && out.add(s)
  const walk = (v: unknown): void => {
    if (typeof v === 'string') add(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        add(k)
        walk(x)
      }
  }
  for (const f of readdirSync('shared/almanac-data').filter((f) => f.endsWith('.json')))
    walk(JSON.parse(readFileSync(`shared/almanac-data/${f}`, 'utf8')))
  return [...out]
}

// Spellings that normalize onto `v`: each single NORM substitution, and all of them at once.
function variants(v: string): string[] {
  const sources = (c: string) => Object.keys(NORM).filter((k) => NORM[k] === c)
  const chars = [...v]
  const out = chars.flatMap((c, i) =>
    sources(c).map((k) => [...chars.slice(0, i), k, ...chars.slice(i + 1)].join('')),
  )
  out.push(chars.map((c) => sources(c)[0] ?? c).join(''))
  return out
}

function corpus(): Record<string, string[]> {
  const n = VOCAB.length
  // Entries whose normalized forms overlap as prefixes: where first-match order decides the split.
  const prefixy = VOCAB.filter((v) =>
    VOCAB.some((w) => w !== v && (normalize(w).startsWith(normalize(v)) || normalize(v).startsWith(normalize(w)))),
  )
  return {
    vocab: VOCAB,
    aliases: [...Object.keys(ALIASES), ...Object.values(ALIASES).flat()],
    normVariants: VOCAB.flatMap(variants),
    data: dataStrings(),
    pairs: VOCAB.flatMap((a) => VOCAB.map((b) => a + b)),
    // Every ordered pair (a, b) followed by three deterministic third entries.
    triplesStrided: VOCAB.flatMap((a, i) =>
      VOCAB.flatMap((b, j) => [0, 1, 2].map((s) => a + b + VOCAB[(i * 31 + j * 17 + s * 29) % n])),
    ),
    triplesPrefix: prefixy.flatMap((a) => prefixy.flatMap((b) => prefixy.map((c) => a + b + c))),
    invalid: [
      '',
      ' ',
      'X',
      '？',
      '用事',
      ...Object.keys(NORM),
      ...VOCAB.flatMap((v) => [v.slice(0, -1), v.slice(1), `X${v}`, `${v}X`, `${v}${v.slice(0, -1)}`, `${v} ${v}`]),
    ],
  }
}

describe('splitHeadings differential lock (pre-optimization reference)', () => {
  it('matches the reference output or error on every corpus input', () => {
    const groups = corpus()
    const inputs = [...new Set(Object.values(groups).flat())]
    let values = 0
    let errors = 0
    const mismatches: { text: string; ref: Outcome; got: Outcome }[] = []
    for (const text of inputs) {
      const ref = run(referenceSplit, text)
      const got = run(splitHeadings, text)
      if ('value' in ref) values++
      else errors++
      if (JSON.stringify(ref) !== JSON.stringify(got)) mismatches.push({ text, ref, got })
    }
    if (process.env.SPLIT_EQUIV_STATS)
      console.info(
        JSON.stringify({
          groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
          unique: inputs.length,
          values,
          errors,
          mismatches: mismatches.length,
        }),
      )
    expect(mismatches.slice(0, 5)).toEqual([])
    expect(values).toBeGreaterThan(10_000)
    expect(errors).toBeGreaterThan(100)
  })

  it('keeps first-match raw-entry behavior for spellings that normalize together', () => {
    const byNorm = new Map<string, string[]>()
    for (const v of VOCAB) byNorm.set(normalize(v), [...(byNorm.get(normalize(v)) ?? []), v])
    const collisions = [...byNorm].filter(([, raws]) => raws.length > 1)
    expect(collisions).toEqual([['破屋壊垣', ['破屋壞垣', '破屋壊垣']]])
    for (const [, raws] of collisions)
      for (const raw of raws) expect(splitHeadings(raw)).toEqual(referenceSplit(raw))
    expect(splitHeadings('破屋壞垣')).toEqual(['破屋壊垣'])
  })

  it('has no empty vocabulary entry (an empty match would never advance)', () => {
    expect(VOCAB).not.toContain('')
  })
})

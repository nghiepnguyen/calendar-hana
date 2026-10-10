import type { Evidence } from './evidence'
import type { Vol10Resolution, Vol10Verdict } from './xiejiVol10Resolution'

/** Owner policy of 2026-10-10 (docs/plans/xieji-vol10-scoring.md): how a 協紀 卷十 verdict changes
 * the product rows that stand for the same 凶. Applied only behind
 * `manifest.policies.xiejiVol10Scoring`; with the flag off nothing here runs. */

export const VOL10_SCORING_VERSION = 'xieji-vol10-scoring-v1'
/** The six 凶 that have product rows; 月厭/月刑/月煞/災煞 only decide via 從X論. */
export const VOL10_SCORED_ENTRIES: ReadonlySet<string> = new Set([
  'yue_jian',
  'yue_po',
  'ping_ri',
  'shou_ri',
  'bi_ri',
  'jie_sha',
])
/** Product rules standing for each 卷十 entry: its Trực, and for 月破 also the subsumed god. */
export const VOL10_PRODUCT_SOURCES: Readonly<Record<string, { truc?: string; god?: string }>> = {
  yue_jian: { truc: 'kien' },
  yue_po: { truc: 'pha', god: 'nguyet_pha' },
  ping_ri: { truc: 'binh' },
  shou_ri: { truc: 'thu' },
  bi_ri: { truc: 'be' },
  jie_sha: { god: 'kiep_sat' },
  // Legacy gods that never fire today (no exact star name); kept so the chain stays honest.
  yue_yan: { god: 'nguyet_yem' },
  yue_xing: { god: 'nguyet_hinh' },
  yue_sha: { god: 'nguyet_sat' },
  zai_sha: { god: 'tai_sat' },
}
const ADDED_PENALTY = -25
const RANK: Partial<Record<Vol10Verdict, number>> = { avoid: 3, not_avoided: 2, no_annotation: 1 }

/** Product sources of an item's chain: the entry itself and, after 從X論, the deciding entry. */
export function vol10ChainSources(item: Pick<Vol10Resolution, 'entry' | 'via'>) {
  return [
    VOL10_PRODUCT_SOURCES[item.entry],
    item.via ? VOL10_PRODUCT_SOURCES[item.via] : undefined,
  ].filter((src): src is { truc?: string; god?: string } => Boolean(src))
}

export function isVol10ChainRow(
  row: Evidence,
  item: Pick<Vol10Resolution, 'entry' | 'via' | 'activityId'>,
) {
  return (
    row.activityId === item.activityId &&
    vol10ChainSources(item).some(
      (src) =>
        (src.god !== undefined && row.source === 'bad_god' && row.ruleId === src.god) ||
        (src.truc !== undefined &&
          row.source === 'truc' &&
          row.ruleId === `${src.truc}:${item.activityId}`),
    )
  )
}

const note = (item: Vol10Resolution) => ({
  version: VOL10_SCORING_VERSION,
  entry: item.entry,
  verdict: item.verdict,
  ...(item.via ? { via: item.via } : {}),
  quote: item.quote,
})

/**
 * Rows of one activity in, adjusted rows out. Only applied rows of a scored entry's chain change;
 * `not_listed` and `undetermined` change nothing. When chains disagree on a row, the stricter
 * verdict wins (avoid > not_avoided > no_annotation).
 */
export function applyVol10Scoring(
  rows: readonly Evidence[],
  items: readonly Vol10Resolution[],
  opts: { activityId: string; scope: string; badGodCap: number },
): Evidence[] {
  const scored = items.filter(
    (item) =>
      item.activityId === opts.activityId &&
      VOL10_SCORED_ENTRIES.has(item.entry) &&
      RANK[item.verdict] !== undefined,
  )
  const out = rows.map((row) => {
    if (row.status !== 'applied') return row
    const decisive = scored
      .filter((item) => isVol10ChainRow(row, item))
      .sort((a, b) => RANK[b.verdict]! - RANK[a.verdict]!)[0]
    if (!decisive) return row
    const tagged = { ...row, classical: note(decisive) }
    const reason = `Theo 協紀 卷十 (${decisive.han}): ${decisive.reason}`
    if (decisive.verdict === 'avoid')
      return row.scoreDelta > 0
        ? {
            ...tagged,
            scoreDelta: -row.scoreDelta,
            polarity: 'negative' as const,
            sourcePhrase: reason,
          }
        : tagged
    if (decisive.verdict === 'not_avoided' ? row.scoreDelta < 0 : row.scoreDelta !== 0)
      return { ...tagged, scoreDelta: 0, status: 'informational' as const, sourcePhrase: reason }
    return tagged
  })
  // 卷十 avoid with no negative row in that chain: one added penalty per deciding entry.
  const added = new Set<string>()
  for (const item of scored.filter((x) => x.verdict === 'avoid')) {
    const key = item.via ?? item.entry
    if (added.has(key)) continue
    const chain = out.filter((row) => row.status === 'applied' && isVol10ChainRow(row, item))
    if (chain.some((row) => row.scoreDelta < 0)) continue
    added.add(key)
    const viaTruc = vol10ChainSources(item).some((src) => src.truc !== undefined)
    const usedBad = out
      .filter((row) => row.status === 'applied' && row.source === 'bad_god')
      .reduce((sum, row) => sum + Math.abs(Math.min(0, row.scoreDelta)), 0)
    const delta = viaTruc
      ? ADDED_PENALTY
      : -Math.min(Math.abs(ADDED_PENALTY), Math.max(0, Math.abs(opts.badGodCap) - usedBad))
    const label = `協紀 卷十: ${item.han}${item.via ? ` (從${item.via})` : ''}`
    out.push({
      source: viaTruc ? 'truc' : 'bad_god',
      ruleId: `xieji10:${key}:${opts.activityId}`,
      activityId: opts.activityId,
      scope: opts.scope,
      label,
      sourcePhrase: `Theo 協紀 卷十 (${item.han}): ${item.reason}`,
      sourceRef: `shared/almanac-data/xiejibianfangshu-vol10-yiji.json#${key}`,
      sourceQuote: item.quote,
      confidence: 'high',
      status: delta < 0 ? 'applied' : 'informational',
      rawDelta: ADDED_PENALTY,
      scoreDelta: delta,
      polarity: 'negative',
      classical: note(item),
    })
  }
  return out
}

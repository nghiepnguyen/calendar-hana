import type { Evidence } from './evidence'

/** P1 (tasks/prd-p1-tiangou-yin.md): 卷十 鋪註條例 「凡天狗寅日忌祭祀不註宜求福祈嗣」. */
export const P1_TIANGOU_YIN_VERSION = 'p1-tiangou-yin-v1'
const QUOTE = '凡天狗寅日忌祭祀不註宜求福祈嗣'
const YIN = 2
const ACTIVITIES = new Set(['pray_blessing', 'pray_children'])

/**
 * On a 寅 day, every applied positive row of 祈福/求嗣 becomes informational (D1/D2, FR-1). Runs after
 * resolution; rows P4 already lifted are no longer applied, so they stay byte-for-byte (FR-8).
 */
export function applyTiangouYinNoYi(
  rows: readonly Evidence[],
  activityId: string,
  dayBranch: number | undefined,
): Evidence[] {
  if (dayBranch !== YIN || !ACTIVITIES.has(activityId)) return [...rows]
  return rows.map((row) =>
    row.status !== 'applied' || row.rawDelta <= 0
      ? row
      : {
          ...row,
          status: 'informational',
          scoreDelta: 0,
          ...(row.preCapDelta !== undefined ? { preCapDelta: 0 } : {}),
          classical: {
            version: P1_TIANGOU_YIN_VERSION,
            entry: 'puzhu:07',
            verdict: 'no_annotation',
            quote: QUOTE,
          },
        },
  )
}

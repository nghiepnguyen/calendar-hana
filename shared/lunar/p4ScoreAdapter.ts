/** Roadmap 8: P4 score adapter behind `xiejiVol10BalancingEnabled` (PRD tasks/prd-p4-score-adapter.md). */
export type P4HeadingInput = { state: string; rule?: string; prot?: readonly string[] }
export type P4ActivityState = { state: string; heading?: string; allTaboo?: boolean }

/** Stub until the adapter lands: every activity keeps its baseline. */
export function p4ActivityState(
  _activityId: string,
  _headings: Readonly<Record<string, P4HeadingInput>>,
): P4ActivityState {
  return { state: 'baseline' }
}

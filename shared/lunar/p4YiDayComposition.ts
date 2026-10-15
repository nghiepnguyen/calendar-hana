import authority from '../almanac-data/p4-yi-operands-v1.json'
import lunarDayAuthority from '../almanac-data/p4-lunar-day-taboo-v1.json'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { getP4LegacyYiPresence } from './p4YiDayCore'
import { resolveP4Context } from './p4ContextBridge'
import { assembleP4YiFullDayWithRaw } from './p4YiFullDayCore'
import type { resolveP4FullDay } from './p4FullDayComposition'
import { composeP4YiEvidence, normalizeP4YiHeading } from './p4YiEvidence'
import { getP4YiOperands } from './p4YiOperands'
import { freezeP4YiTrace } from './p4YiTrace'

type P4FullDayOperands = NonNullable<Parameters<typeof resolveP4FullDay>[2]>
type InputMap = Readonly<Record<string, unknown>>
export type P4YiDayOperands = P4FullDayOperands & {
  yiInputs?: InputMap
  yiProviderStates?: InputMap
  yiInputProvenance?: InputMap
}

/** Opt-in audit only. Provider evidence feeds classification before any suppression or propagation.
 * No date or 母倉 soil is fabricated from the historical P4-B operand. */
export function resolveP4YiDay(month: string, pillar: string, operands: P4YiDayOperands = {}) {
  resolveP4Context(month, pillar)
  const { yiInputs = {}, yiProviderStates = {}, yiInputProvenance = {} } = operands
  for (const [key, value] of Object.entries({ yiInputs, yiProviderStates, yiInputProvenance }))
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new RangeError(`Invalid P4 宜 ${key}`)
  const derived = { MONTH_JIAN_BRANCH: month, DAY_BRANCH: pillar[1]!, DAY_PILLAR: pillar }
  for (const [inputKey, value] of Object.entries(derived))
    if (Object.hasOwn(yiInputs, inputKey) && yiInputs[inputKey] !== value)
      throw Object.assign(new RangeError(`Conflicting P4 宜 input: ${inputKey}`), {
        code: 'CONFLICTING_DERIVED_INPUT',
        inputKey,
      })
  // Every dated evidence object describes one civil day; mixing days is a caller error.
  const soilEvidence = yiInputs.SOIL_REIGN_STATE as { date?: unknown } | undefined
  const datedDays = new Set(
    [operands.soil?.date, operands.phase?.date, soilEvidence?.date].filter(
      (date) => date !== undefined,
    ),
  )
  if (datedDays.size > 1)
    throw Object.assign(new RangeError(`Conflicting P4 dated evidence: ${[...datedDays]}`), {
      code: 'CONFLICTING_DATED_INPUT',
    })
  const yiOperands = getP4YiOperands(
    { ...yiInputs, ...derived },
    yiProviderStates,
    yiInputProvenance,
  )
  const legacy = Object.entries(getP4LegacyYiPresence(month, pillar))
    .filter(([han]) => !authority.entries.some((entry) => entry.han === han))
    .map(([han, presence]) => ({
      traceId: `p4legacy:${han}`,
      han,
      presence: presence === undefined ? 'unknown' : presence ? 'present' : 'absent',
      inputEvidence: { kind: 'EXISTING_P4_LEGACY_LOOKUP', month, pillar },
    }))
  const combined = [...legacy, ...yiOperands]
  const yiEvidence = Object.fromEntries(
    P4_DAY_HEADINGS.map((heading) => {
      const result = composeP4YiEvidence(heading, combined)
      const p4c = yiOperands.filter((operand) =>
        result.trace.some((item) => item.traceId === operand.traceId),
      )
      return [
        heading,
        {
          ...result,
          p4cTraceIds: p4c.map((operand) => operand.traceId),
          unresolvedP4cTraceIds: p4c
            .filter((operand) => operand.presence === 'unknown')
            .map((operand) => operand.traceId),
          headingSourceReferences: p4c.map((operand) => {
            const entry = authority.entries.find((entry) => entry.han === operand.han)!
            const refs = [
              ...new Set(
                entry.headingScopes
                  .filter(
                    (scope) =>
                      scope.mode ===
                        (heading === '修倉庫' ? 'P5_DEFERRED_CO_PRESENCE' : 'DIRECT_YI') &&
                      normalizeP4YiHeading(scope.normalized) === heading,
                  )
                  .flatMap((scope) => scope.sourceRefs),
              ),
            ]
            return {
              traceId: operand.traceId,
              sourceRefs: refs,
              sources: refs.map((index) => entry.sources[index]!),
            }
          }),
        },
      ]
    }),
  )
  const yi = Object.fromEntries(
    Object.entries(yiEvidence).map(([heading, evidence]) => [heading, evidence.yi]),
  )
  const day = assembleP4YiFullDayWithRaw(month, pillar, operands, yi)
  return {
    version: 'p4-yi-day-composition-v1' as const,
    ...day,
    // The lunar-day scopes record presence only; keep the input value they were read from.
    lunarDayInput: { authorityId: lunarDayAuthority.version, value: operands.lunarDay ?? null },
    yiOperands,
    yiEvidence: freezeP4YiTrace(yiEvidence),
  }
}

import authority from '../almanac-data/p4-yi-operands-v1.json'
import { evaluateP4YiPredicate, isP4YiDayPillar } from './p4YiPredicates'
import { getP4YiSoilReason, isP4YiSoilValue } from './p4YiSoil'
import { freezeP4YiTrace, getP4YiInputProvenance, getP4YiSourceReference } from './p4YiTrace'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
type InputMap = Readonly<Record<string, unknown>>
export { getP4MuCangSoil } from './p4YiSoil'
type UnknownReason =
  | 'MISSING_REQUIRED_INPUT'
  | 'OUTSIDE_PROVIDER_COVERAGE'
  | 'OUTSIDE_LOCAL_COVERAGE'
  | 'UNKNOWN_INPUT'
  | 'UNKNOWN_SOIL'
  | 'UNVALIDATED_SOIL_PROVENANCE'

/** Audit-only single-entry presence with replayable source/input trace; no heading/score/ANY decisions. */
export function evaluateP4YiOperand(
  requestName: string,
  inputs: InputMap = {},
  providerStates: InputMap = {},
  inputProvenance: InputMap = {},
) {
  const fail = (code: string, inputKey: string): never => {
    throw Object.assign(new RangeError(`${code}: ${inputKey}`), { code, inputKey, requestName })
  }
  const entry = authority.entries.find(
    (candidate) =>
      candidate.han === requestName || candidate.aliases.some((alias) => alias === requestName),
  )
  if (!entry) return fail('UNRECOGNIZED_YI_OPERAND', 'requestName')
  for (const [key, value] of Object.entries({ inputs, providerStates, inputProvenance }))
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      fail('MALFORMED_REQUIRED_INPUT', key)
  const keys = entry.operandInputs.filter((input) => input.required).map((input) => input.key)
  let soilReason: UnknownReason | undefined
  for (const key of keys) {
    const value = inputs[key]
    if (
      providerStates[key] !== undefined &&
      !['inside', 'outside', 'unknown'].includes(providerStates[key] as string)
    )
      fail('MALFORMED_REQUIRED_INPUT', key)
    if (value === undefined) continue
    if (key === 'SOIL_REIGN_STATE') {
      if (!isP4YiSoilValue(value)) fail('MALFORMED_REQUIRED_INPUT', key)
      soilReason = getP4YiSoilReason(value as InputMap, requestName)
    } else if (key === 'DAY_PILLAR') {
      if (!isP4YiDayPillar(value)) fail('MALFORMED_REQUIRED_INPUT', key)
    } else if (typeof value !== 'string' || value.length !== 1 || !BRANCHES.includes(value)) {
      fail('MALFORMED_REQUIRED_INPUT', key)
    }
  }
  const missingInputs = keys.filter((key) => inputs[key] === undefined)
  const usedInputs = Object.fromEntries(
    keys
      .filter((key) => inputs[key] !== undefined)
      .map((key) => [
        key,
        typeof inputs[key] === 'object' ? { ...(inputs[key] as InputMap) } : inputs[key],
      ]),
  )
  const usedProviderStates = Object.fromEntries(
    keys
      .filter((key) => providerStates[key] !== undefined)
      .map((key) => [key, providerStates[key]]),
  )
  const reason: UnknownReason | undefined = missingInputs.length
    ? 'MISSING_REQUIRED_INPUT'
    : keys.some((key) => providerStates[key] === 'outside')
      ? 'OUTSIDE_PROVIDER_COVERAGE'
      : soilReason === 'OUTSIDE_LOCAL_COVERAGE'
        ? soilReason
        : keys.some((key) => providerStates[key] === 'unknown')
          ? 'UNKNOWN_INPUT'
          : soilReason
  const presence: 'present' | 'absent' | 'unknown' = reason
    ? 'unknown'
    : evaluateP4YiPredicate(entry, {
          monthJianBranch: usedInputs.MONTH_JIAN_BRANCH as string | undefined,
          dayBranch: usedInputs.DAY_BRANCH as string | undefined,
          dayPillar: usedInputs.DAY_PILLAR as string | undefined,
          soilState: (usedInputs.SOIL_REIGN_STATE as InputMap | undefined)?.state as
            'present' | 'absent' | undefined,
        })
      ? 'present'
      : 'absent'
  return Object.freeze({
    contractVersion: 'p4-yi-provider-contract-v1',
    requestName,
    id: entry.id,
    traceId: `p4yi:${entry.id}`,
    han: entry.han,
    authorityId: entry.authorityId,
    ruleId: entry.ruleId,
    authorityStatus: entry.status,
    presence,
    reason: reason ?? null,
    inputs: freezeP4YiTrace(usedInputs),
    providerStates: freezeP4YiTrace(usedProviderStates),
    inputProvenance: getP4YiInputProvenance(entry, usedInputs, usedProviderStates, inputProvenance),
    missingInputs: Object.freeze(missingInputs),
    sourceRefs: Object.freeze([...entry.predicate.sourceRefs]),
    sourceReference: getP4YiSourceReference(entry),
  } as const)
}

/** One ordered inventory, including unknowns; each entry still reads only its required keys. */
export function getP4YiOperands(
  inputs: InputMap = {},
  providerStates: InputMap = {},
  inputProvenance: InputMap = {},
): readonly ReturnType<typeof evaluateP4YiOperand>[] {
  for (const [key, value] of Object.entries({ inputs, providerStates, inputProvenance }))
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw Object.assign(new RangeError(`Invalid bulk ${key}`), {
        code: 'MALFORMED_REQUIRED_INPUT',
        inputKey: key,
        requestName: 'bulk',
      })
  if (
    isP4YiDayPillar(inputs.DAY_PILLAR) &&
    typeof inputs.DAY_BRANCH === 'string' &&
    inputs.DAY_PILLAR[1] !== inputs.DAY_BRANCH
  )
    throw Object.assign(new RangeError('Contradictory bulk day pillar/branch'), {
      code: 'MALFORMED_REQUIRED_INPUT',
      inputKey: 'DAY_BRANCH',
      requestName: 'bulk',
    })
  return Object.freeze(
    authority.entries.map((entry) =>
      evaluateP4YiOperand(entry.han, inputs, providerStates, inputProvenance),
    ),
  )
}

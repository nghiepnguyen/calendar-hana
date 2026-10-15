import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import golden from '../almanac-data/golden-p4-yi-operands-v1.json'
import adapter from '../../docs/audits/sources/p4-vol10/yi-red-contract-v1/irrelevant-input-adapter.json'
import { evaluateP4YiOperand } from './p4YiOperands'
import { composeP4YiEvidence } from './p4YiEvidence'

type Fixture = {
  id: string
  han: string
  categories: string[]
  requestName: string
  inputs: Record<string, unknown>
  providerStates: Record<string, unknown>
  inputProvenance: Record<string, unknown>
  expected: {
    outcome: 'present' | 'absent' | 'unknown'
    reason?: string
    canonicalHan: string
    authorityId: string
    ruleId: string
    authorityStatus: string
    sourceRefs: number[]
  }
}
type MalformedFixture = {
  id: string
  han: string
  inputs: Record<string, unknown>
  expected: { outcome: 'error'; reason: string }
}
type EvidenceFixture = {
  id: string
  input: { heading: string; operands: Record<string, unknown>[] }
  expected: {
    yi: boolean | null
    trace: Record<string, unknown>[]
    unresolvedTraceIds: string[]
  }
}
type OptionalTrace = {
  reason?: string | null
  inputs?: Record<string, unknown>
  providerStates?: Record<string, unknown>
  missingInputs?: readonly string[]
}

const load = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const presenceBlock = golden.blocks.find((block) => block.kind === 'presence')!
const compositionBlock = golden.blocks.find((block) => block.kind === 'composition')!
const frozen = load(presenceBlock.path) as {
  presenceFixtures: Fixture[]
  malformedFixtures: MalformedFixture[]
}
const composition = load(compositionBlock.path) as { sections: { any: EvidenceFixture[] } }
const unknown = frozen.presenceFixtures.filter((fixture) => fixture.expected.outcome === 'unknown')
const recipes = frozen.presenceFixtures.filter((fixture) =>
  fixture.categories.includes('irrelevantInput'),
)
const masked = composition.sections.any.filter(
  (fixture) => fixture.expected.yi === true && fixture.expected.unresolvedTraceIds.length > 0,
)
const required = (han: string) =>
  authority.entries
    .find((entry) => entry.han === han)!
    .operandInputs.filter((input) => input.required)
    .map((input) => input.key)
const requiredCases = authority.entries.flatMap((entry) => {
  const base = frozen.presenceFixtures.find(
    (fixture) => fixture.han === entry.han && fixture.expected.outcome === 'present',
  )!
  return required(entry.han).map((key) => ({ id: `${entry.id}:${key}`, key, base }))
})
const irrelevantCases = adapter.recipes.flatMap((recipe) => {
  const fixture = recipes.find((candidate) => candidate.id === recipe.fixtureId)!
  return recipe.variants.map((variant) => ({
    id: `${recipe.fixtureId}:${variant.id}`,
    fixture,
    key: recipe.apiKey,
    // The omitted variant never creates the property (undefined has its own required-input test).
    inputs: variant.supplied
      ? { ...fixture.inputs, [recipe.apiKey]: 'value' in variant ? variant.value : undefined }
      : { ...fixture.inputs },
    variant,
  }))
})
const precedenceCases = requiredCases.flatMap(({ id, key, base }) => {
  const otherKey = required(base.han).find((candidate) => candidate !== key)
  if (!otherKey) return []
  const inputs = { ...base.inputs, [key]: null }
  const missing = { ...inputs }
  delete missing[otherKey]
  return [
    { id: `${id}:malformed-before-missing`, key, base, inputs: missing, providerStates: {} },
    {
      id: `${id}:malformed-before-outside`,
      key,
      base,
      inputs,
      providerStates: { [otherKey]: 'outside' },
    },
  ]
})

// Stable numeric case labels survive Vitest's truncation of long interpolated IDs.
const numbered = <T extends { id: string }>(cases: readonly T[]) =>
  cases.map((entry, caseNumber) => ({ ...entry, caseNumber }))

const expectContractError = (
  requestName: string,
  inputs: Record<string, unknown>,
  code: string,
  inputKey: string,
  providerStates: Record<string, unknown> = {},
) => {
  const invoke = () => evaluateP4YiOperand(requestName, inputs, providerStates)
  expect(invoke).toThrow(RangeError)
  expect(invoke).toThrow(expect.objectContaining({ code, inputKey, requestName }))
}

describe('P4-C 4.3 frozen contract selection and runnable recipe adapter', () => {
  it('keeps the presence and composition bytes pinned to the frozen Golden index', () => {
    for (const block of [presenceBlock, compositionBlock])
      expect(createHash('sha256').update(readFileSync(block.path)).digest('hex')).toBe(block.sha256)
    expect(unknown).toHaveLength(78)
    expect(frozen.malformedFixtures).toHaveLength(24)
    expect(recipes).toHaveLength(69)
    expect(requiredCases).toHaveLength(20)
    expect(precedenceCases).toHaveLength(34)
    expect(masked).toHaveLength(14)
    expect(
      unknown.map((fixture) => fixture.han).filter((han, i, list) => list.indexOf(han) === i),
    ).toHaveLength(11)
  })

  it('maps every frozen irrelevant recipe to four explicit variants without changing required inputs', () => {
    expect(new Set(adapter.recipes.map((recipe) => recipe.fixtureId))).toEqual(
      new Set(recipes.map((fixture) => fixture.id)),
    )
    expect(irrelevantCases).toHaveLength(276)
    for (const recipe of adapter.recipes) {
      const fixture = recipes.find((candidate) => candidate.id === recipe.fixtureId)!
      expect(required(fixture.han), recipe.fixtureId).not.toContain(recipe.apiKey)
      expect(fixture.inputProvenance).toMatchObject({
        irrelevantInput: {
          key: recipe.authorityRecipeKey,
          variants: ['omitted', 'valid alternative'],
        },
      })
      expect(recipe.variants.map((variant) => variant.id)).toEqual([
        'omitted',
        'valid-a',
        'valid-b',
        'malformed-irrelevant-null',
      ])
    }
    for (const { fixture, key, inputs, variant } of irrelevantCases) {
      for (const input of required(fixture.han))
        expect(inputs[input]).toEqual(fixture.inputs[input])
      expect(Object.hasOwn(inputs, key)).toBe(variant.supplied)
    }
    // These unit vectors claim a listed heading only, never physical co-presence on a real date.
    for (const fixture of masked) {
      expect(fixture.input.heading).toBe('求醫療病')
      expect(fixture.input.operands.some((operand) => operand.presence === 'present')).toBe(true)
      expect(fixture.input.operands.some((operand) => operand.presence === 'unknown')).toBe(true)
    }
  })
})

describe('P4-C 4.3 unknown needs reason and trace, not an unconditional unknown', () => {
  it.each(numbered(unknown))(
    '#$caseNumber $id -> unknown with source and input trace',
    (fixture) => {
      const result = evaluateP4YiOperand(
        fixture.requestName,
        fixture.inputs,
        fixture.providerStates,
        fixture.inputProvenance,
      )
      expect(result, fixture.id).toMatchObject({
        presence: 'unknown',
        reason: fixture.expected.reason,
        requestName: fixture.requestName,
        han: fixture.expected.canonicalHan,
        authorityId: fixture.expected.authorityId,
        ruleId: fixture.expected.ruleId,
        authorityStatus: fixture.expected.authorityStatus,
        sourceRefs: fixture.expected.sourceRefs,
        inputs: fixture.inputs,
        providerStates: fixture.providerStates,
        missingInputs: required(fixture.han).filter((key) => fixture.inputs[key] === undefined),
      })
    },
  )

  it.each(numbered(requiredCases))(
    '#$caseNumber $id: explicit undefined is missing and remains traceable',
    ({ base, key, id }) => {
      const inputs = { ...base.inputs, [key]: undefined }
      const result = evaluateP4YiOperand(base.requestName, inputs)
      expect(result, id).toMatchObject({
        presence: 'unknown',
        reason: 'MISSING_REQUIRED_INPUT',
        missingInputs: [key],
      })
    },
  )
})

describe('P4-C 4.3 malformed required input is a clear error', () => {
  it.each(numbered(frozen.malformedFixtures))(
    '#$caseNumber $id -> typed error with stable code',
    (fixture) => {
      const inputKey = fixture.id.includes(':malformed-soil-')
        ? 'SOIL_REIGN_STATE'
        : fixture.id.split(':malformed-')[1]!
      expectContractError(fixture.han, fixture.inputs, fixture.expected.reason, inputKey)
    },
  )

  it.each(numbered(requiredCases))(
    '#$caseNumber $id: null is malformed, not missing',
    ({ base, key }) => {
      expectContractError(
        base.requestName,
        { ...base.inputs, [key]: null },
        'MALFORMED_REQUIRED_INPUT',
        key,
      )
    },
  )

  it.each(numbered(requiredCases))(
    '#$caseNumber $id: invalid provider-state tag is malformed',
    ({ base, key }) => {
      expectContractError(base.requestName, base.inputs, 'MALFORMED_REQUIRED_INPUT', key, {
        [key]: 'invalid',
      })
    },
  )

  it.each(numbered(precedenceCases))(
    '#$caseNumber $id',
    ({ base, key, inputs, providerStates }) => {
      expectContractError(base.requestName, inputs, 'MALFORMED_REQUIRED_INPUT', key, providerStates)
    },
  )
})

describe('P4-C 4.3 irrelevant inputs never become required or appear in used-input trace', () => {
  it.each(numbered(irrelevantCases))('#$caseNumber $id', ({ fixture, key, inputs }) => {
    const result: ReturnType<typeof evaluateP4YiOperand> & OptionalTrace = evaluateP4YiOperand(
      fixture.requestName,
      inputs,
      { ...fixture.providerStates, [key]: 'outside' },
      fixture.inputProvenance,
    )
    expect(result.inputs, fixture.id).toEqual(fixture.inputs)
    expect(result.providerStates, fixture.id).toEqual(fixture.providerStates)
    expect(result.presence, fixture.id).toBe(fixture.expected.outcome)
  })
})

describe('P4-C 4.3 listed heading retains unknown even when present masks it', () => {
  it.each(numbered(masked))(
    '#$caseNumber $id: keeps the complete trace and unresolved IDs',
    (fixture) => {
      const result = composeP4YiEvidence(fixture.input.heading, fixture.input.operands)
      expect(result.trace, fixture.id).toEqual(fixture.expected.trace)
      expect(result.unresolvedTraceIds, fixture.id).toEqual(fixture.expected.unresolvedTraceIds)
    },
  )

  it.each(numbered(masked))(
    '#$caseNumber $id: presence can prove 宜 without erasing an unknown',
    (fixture) => {
      const result = composeP4YiEvidence(fixture.input.heading, fixture.input.operands)
      expect(result.yi, fixture.id).toBe(fixture.expected.yi)
    },
  )
})

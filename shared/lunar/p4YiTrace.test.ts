import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-yi-operands-v1.json'
import golden from '../almanac-data/golden-p4-yi-operands-v1.json'
import { evaluateP4YiOperand, getP4YiOperands, getP4MuCangSoil } from './p4YiOperands'

type Fixture = {
  id: string
  han: string
  requestName: string
  inputs: Record<string, unknown>
  providerStates: Record<string, unknown>
  inputProvenance: Record<string, unknown>
  expected: {
    outcome: string
    canonicalHan: string
    authorityId: string
    ruleId: string
    authorityStatus: string
    sourceRefs: number[]
  }
}
type TraceView = {
  traceId?: string
  sourceReference?: {
    bundle?: { path: string; version: string; sha256: string }
    entryId?: string
    entryPath?: string
    entrySha256?: string
    lockPath?: string
    lockSha256?: string
    offsetProtocol?: string
    sources?: {
      sourceRef: number
      path: string
      offset: number
      length: number
      quote: string
      sha1: string
      rawSha256: string
    }[]
    scanChecks?: { renderPath: string; sha256: string }[]
    headingScopes?: unknown[]
  }
  inputProvenance?: Record<string, { supplied: boolean; evidence: unknown; evidenceOrigin: string }>
}
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const digest = (path: string, algorithm = 'sha256') =>
  createHash(algorithm).update(readFileSync(path)).digest('hex')
const frozen = read(golden.blocks.find((block) => block.kind === 'presence')!.path) as {
  presenceFixtures: Fixture[]
  identityFixtures: {
    id: string
    han: string
    requestName: string
    expected: { aliasesToThisEntry: boolean }
  }[]
}
const mother = frozen.presenceFixtures.find(
  (fixture) => fixture.han === '母倉' && fixture.expected.outcome === 'present',
)!
const datedSoils = [
  ...new Map(
    frozen.presenceFixtures.flatMap((fixture) => {
      const soil = fixture.inputs.SOIL_REIGN_STATE as Record<string, unknown> | undefined
      if (
        !soil ||
        typeof soil.date !== 'string' ||
        soil.validated !== true ||
        !soil.sourcePath ||
        (soil.state === 'unknown' && soil.coverage !== 'outside')
      )
        return []
      return [[soil.date, soil] as const]
    }),
  ).entries(),
].map(([date, expected]) => ({ date, expected }))

describe('P4-C 4.5 replayable trace and source identity', () => {
  it.each(frozen.presenceFixtures.map((fixture, caseNumber) => ({ ...fixture, caseNumber })))(
    '#$caseNumber $id exports trace for every presence state',
    (fixture) => {
      const entry = authority.entries.find((candidate) => candidate.han === fixture.han)!
      const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
        fixture.requestName,
        fixture.inputs,
        fixture.providerStates,
        fixture.inputProvenance,
      )
      expect(result, fixture.id).toMatchObject({
        traceId: `p4yi:${entry.id}`,
        presence: fixture.expected.outcome,
        authorityId: fixture.expected.authorityId,
        ruleId: fixture.expected.ruleId,
        authorityStatus: fixture.expected.authorityStatus,
        sourceRefs: fixture.expected.sourceRefs,
        sourceReference: {
          bundle: {
            path: golden.authority.path,
            version: authority.version,
            sha256: golden.authority.sha256,
          },
          entryId: entry.id,
          ...entry.provenance,
          offsetProtocol: authority.offsetProtocol,
          headingScopes: entry.headingScopes,
        },
      })
      const keys = entry.operandInputs.filter((input) => input.required).map((input) => input.key)
      expect(Object.keys(result.inputProvenance ?? {})).toEqual(keys)
      for (const key of keys)
        expect(result.inputProvenance?.[key]?.supplied).toBe(fixture.inputs[key] !== undefined)
      // Replay uses exported used-input/provider-state values, not score or rendered labels.
      const replay = evaluateP4YiOperand(result.han, result.inputs, result.providerStates)
      expect(replay.presence).toBe(fixture.expected.outcome)
      expect(replay.reason).toBe(result.reason)
    },
  )

  it.each(authority.entries)(
    '$han resolves original local source indices and scan evidence hashes',
    (entry) => {
      const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
        entry.han,
      )
      const source = result.sourceReference
      expect(source?.sources).toHaveLength(entry.sources.length)
      for (const [ref, expected] of entry.sources.entries()) {
        const resolved = source?.sources?.[ref]
        expect(resolved).toMatchObject({
          ...expected,
          sourceRef: ref,
          rawSha256: digest(expected.path),
        })
        expect(digest(expected.path, 'sha1')).toBe(expected.sha1)
        expect(
          Array.from(readFileSync(expected.path, 'utf8'))
            .slice(expected.offset, expected.offset + expected.length)
            .join(''),
        ).toBe(resolved?.quote)
      }
      expect(source?.scanChecks).toHaveLength(entry.scanChecks.length)
      for (const scan of source?.scanChecks ?? []) expect(digest(scan.renderPath)).toBe(scan.sha256)
      expect(source?.entrySha256).toBe(digest(entry.provenance.entryPath))
      expect(source?.lockSha256).toBe(digest(entry.provenance.lockPath))
    },
  )

  it.each(frozen.identityFixtures.map((fixture, caseNumber) => ({ ...fixture, caseNumber })))(
    '#$caseNumber $id never merges authority/scope by a shared position or label',
    (fixture) => {
      expect(fixture.expected.aliasesToThisEntry).toBe(false)
      const own = authority.entries.find(
        (entry) =>
          entry.han === fixture.requestName ||
          entry.aliases.some((alias) => alias === fixture.requestName),
      )
      if (own) {
        const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
          fixture.requestName,
        )
        expect(result.han).toBe(own.han)
        expect(result.han).not.toBe(fixture.han)
        expect(result.sourceReference?.headingScopes).toEqual(own.headingScopes)
      } else {
        expect(() => evaluateP4YiOperand(fixture.requestName)).toThrow(RangeError)
        expect(() => evaluateP4YiOperand(fixture.requestName)).toThrow(
          expect.objectContaining({ code: 'UNRECOGNIZED_YI_OPERAND' }),
        )
      }
    },
  )

  it.each(frozen.presenceFixtures.filter((fixture) => fixture.requestName === '福徳'))(
    '$id: alias keeps request name and the same authority/source/scope',
    (fixture) => {
      const alias: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
        '福徳',
        fixture.inputs,
        fixture.providerStates,
        fixture.inputProvenance,
      )
      const canonical = evaluateP4YiOperand(
        '福德',
        fixture.inputs,
        fixture.providerStates,
        fixture.inputProvenance,
      )
      expect(alias.sourceReference).toBeDefined()
      expect(alias).toEqual({ ...canonical, requestName: '福徳' })
    },
  )

  it('keeps only required keyed provenance and snapshots nested caller metadata immutably', () => {
    const evidence = { providerId: 'audited-day-provider', metadata: { date: '2025-02-11' } }
    const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
      '除神',
      { DAY_BRANCH: '申' },
      {},
      {
        DAY_BRANCH: evidence,
        MONTH_JIAN_BRANCH: { providerId: 'must-not-be-used' },
      },
    )
    expect(result.inputProvenance).toEqual({
      DAY_BRANCH: expect.objectContaining({
        supplied: true,
        evidenceOrigin: 'CALLER_DECLARED',
        evidence,
      }),
    })
    evidence.metadata.date = '2000-01-01'
    expect(result.inputProvenance?.DAY_BRANCH?.evidence).toEqual({
      providerId: 'audited-day-provider',
      metadata: { date: '2025-02-11' },
    })
    expect(Object.isFrozen(result.inputProvenance)).toBe(true)
    expect(Object.isFrozen(result.sourceReference)).toBe(true)
    expect(Object.isFrozen(result.inputs)).toBe(true)
  })

  it('exports exact-instant month/day calculations separately, without dropping timezone/date context', () => {
    const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
      '母倉',
      mother.inputs,
      {},
      mother.inputProvenance,
    )
    expect(result.inputProvenance?.MONTH_JIAN_BRANCH?.evidence).toMatchObject({
      kind: 'DATED',
      instantUtc: mother.inputProvenance.instantUtc,
      civilDateUtc7: mother.inputProvenance.civilDateUtc7,
      calculation: mother.inputProvenance.monthCalculation,
    })
    expect(result.inputProvenance?.DAY_BRANCH?.evidence).toMatchObject({
      calculation: mother.inputProvenance.dayCalculation,
    })
    expect(result.inputProvenance?.SOIL_REIGN_STATE?.evidence).toEqual(
      mother.inputs.SOIL_REIGN_STATE,
    )
  })

  it('bulk preserves all 11 ordered entries and stable trace IDs, including unknown', () => {
    const results = getP4YiOperands()
    expect(results.map((result) => result.han)).toEqual(authority.entries.map((entry) => entry.han))
    expect(results.map((result: { id: string } & TraceView) => result.traceId)).toEqual(
      authority.entries.map((entry) => `p4yi:${entry.id}`),
    )
    expect(results.every((result) => result.presence === 'unknown')).toBe(true)
    expect(Object.isFrozen(results)).toBe(true)
  })

  it('bulk missing soil leaves only 母倉 unresolved when the other required inputs are known', () => {
    const results = getP4YiOperands({
      MONTH_JIAN_BRANCH: '寅',
      DAY_PILLAR: '甲子',
      DAY_BRANCH: '子',
    })
    expect(results).toHaveLength(11)
    expect(
      results.filter((result) => result.presence === 'unknown').map((result) => result.han),
    ).toEqual(['母倉'])
  })

  it('bulk rejects contradictory pillar/branch instead of silently constructing a mixed date', () => {
    expect(() =>
      getP4YiOperands({ MONTH_JIAN_BRANCH: '寅', DAY_PILLAR: '甲子', DAY_BRANCH: '午' }),
    ).toThrow(RangeError)
  })

  it('bulk null container is a clear input error rather than a property-access TypeError', () => {
    expect(() => getP4YiOperands(null as unknown as Record<string, unknown>)).toThrow(RangeError)
  })

  it('missing soil provenance never borrows the unrelated day-pillar calculation', () => {
    const result: ReturnType<typeof evaluateP4YiOperand> & TraceView = evaluateP4YiOperand(
      '母倉',
      { MONTH_JIAN_BRANCH: '寅', DAY_BRANCH: '亥' },
      {},
      mother.inputProvenance,
    )
    expect(result.inputProvenance?.SOIL_REIGN_STATE?.evidence).toEqual({
      kind: 'MISSING_SOIL_EVIDENCE',
    })
  })
})

describe('P4-C 4.5 dated 母倉 soil evidence builder', () => {
  it.each(['sourceSha256', 'astronomyAuthorityId', 'clockPolicy'])(
    '%s cannot claim a different astronomy input identity in caller evidence',
    (key) => {
      const invoke = () =>
        evaluateP4YiOperand('母倉', {
          ...mother.inputs,
          SOIL_REIGN_STATE: {
            ...(mother.inputs.SOIL_REIGN_STATE as Record<string, unknown>),
            [key]: 'wrong-identity',
          },
        })
      expect(invoke).toThrow(RangeError)
      expect(invoke).toThrow(expect.objectContaining({ code: 'MALFORMED_SOIL_PROVENANCE' }))
    },
  )

  it.each(datedSoils)(
    '$date matches the independent frozen boundary evidence',
    ({ date, expected }) => {
      const actual = getP4MuCangSoil(date)
      expect(actual).toMatchObject(expected)
      expect(actual).toHaveProperty(
        'sourceSha256',
        '1db7a155f147210cac9db6580e3893dd3603c3d08ac3bea61815af193e9c6a60',
      )
      expect(Object.isFrozen(actual)).toBe(true)
    },
  )

  it.each(['2025-02-30', 'not-a-date'])('%s is a clear malformed date error', (date) => {
    expect(() => getP4MuCangSoil(date)).toThrow(RangeError)
  })

  it.each(['1800-01-01', '2200-01-01'])(
    '%s is outside local coverage even beyond the astronomy table',
    (date) => {
      expect(getP4MuCangSoil(date)).toMatchObject({
        state: 'unknown',
        coverage: 'outside',
        date,
        authorityId: 'p4-yi-mucang-soil-owner-convention-v1',
        status: 'OWNER_ADOPTED_SOURCE_DEPENDENT',
        timezone: 'Asia/Ho_Chi_Minh',
      })
    },
  )
})

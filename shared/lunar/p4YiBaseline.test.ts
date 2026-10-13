import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import goodGods from '../almanac-data/good-gods.json'
import definitions from '../almanac-data/xieji-god-definitions.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getSourceLockedCatHungStars } from './catHungStars'
import { getVol10VirtuesPresent } from './xiejiVirtues'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { getP4SeasonDays } from './p4SeasonDays'
import { splitP4YiGods } from './p4DayComposition'
import { canonP4Heading } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'
import { resolveP4FullDay } from './p4FullDayComposition'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'

// Explicit opt-in historical measurement, not a presence oracle. Ordinary unit runs skip it.
// Reproduce from frozen baseline checkout with this reporter copied in; never regenerate against new predicates.
const ROOT = 'docs/audits/sources/p4-vol10/yi-baseline-v1'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const OFFICERS = [
  'kien',
  'tru',
  'man',
  'binh',
  'dinh',
  'chap',
  'pha',
  'nguy',
  'thanh',
  'thu',
  'khai',
  'be',
]
const BASELINE_COMMIT = 'db382ba05175f061e0b1031de5361b49a2973ced'
const BASELINE_TREE = 'ad1de4d9555e811bd89a31e36faeeefcd5eed49b'
const unknown = art.yiEvidence.unknown
const norm = (h: string) => canonP4Heading(splitHeadings(h)[0]!)
const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const entries = Object.entries(vol11.entries).map(([raw, e]) => ({
  raw,
  heading: norm(raw),
  // P5 clause is not a flat ANY list. Strip only its grammar for label inventory,
  // then keep rawYi=deferred; never evaluate the stripped list as warehouse presence.
  tokens: splitP4YiGods(raw in art.yiEvidence.deferred ? e.宜.replace(/又|與|併者/g, '') : e.宜),
  warehouse: raw in art.yiEvidence.deferred,
  activities: Object.entries(vol11.activityEntries)
    .filter(([, headings]) => headings.some((h) => norm(h) === norm(raw)))
    .map(([a]) => a),
}))
const inventory = {
  scope: 'MEASURED_BASELINE_NOT_AUTHORITY_NOT_GOLDEN',
  baselineCommit: BASELINE_COMMIT,
  baselineTree: BASELINE_TREE,
  items: unknown.map((han) => ({
    han,
    adoptedAliases: [],
    catalogMatches: goodGods.items
      .filter((x) => x.han === han)
      .map((x) => ({ id: x.id, han: x.han, label: x.label })),
    definitionMatches: definitions.items
      .filter((x) => x.han === han)
      .map((x) => ({ id: x.id, han: x.han })),
    headings: entries
      .filter((e) => e.tokens.includes(han))
      .map((e) => ({
        raw: e.raw,
        normalized: e.heading,
        activities: e.activities,
        warehouseDeferred: e.warehouse,
      })),
    predicateInputs: 'UNRESOLVED_TASK_2; no inference from god label',
  })),
  headingAliases: entries
    .filter((e) => e.raw !== e.heading)
    .map((e) => ({ raw: e.raw, normalized: e.heading })),
  headingsOutsideCatalog: entries.filter((e) => !e.activities.length).map((e) => e.heading),
}

/** Observational copy of baseline yiEvidence's known-input lookup. These booleans measure
 * masking only; they are NOT independently derived expected presence for the 11 new gods. */
function knownPresence(m: number, stem: number, branch: number) {
  const starHan: Record<string, string> = {
    'Thiên Đức': '天德',
    'Thiên Đức Hợp': '天德合',
    'Nguyệt Đức': '月德',
    'Nguyệt Đức Hợp': '月德合',
  }
  const present = new Set([
    ...getSourceLockedCatHungStars(m, stem, branch)
      .good.map((s) => starHan[s.name])
      .filter((h): h is string => h !== undefined),
    ...getVol10VirtuesPresent(m, stem, branch),
  ])
  const gods = getXiejiGodPresence(m, stem, branch)
  const season = getP4SeasonDays(m, branch)
  const godMap = art.yiEvidence.operands.xiejiGod as Record<string, string>
  const officerMap = art.yiEvidence.operands.officer as Record<string, string>
  return (god: string): boolean | undefined =>
    unknown.includes(god)
      ? undefined
      : art.yiEvidence.operands.seasonDays.includes(god)
        ? season[god] === 'unknown'
          ? undefined
          : season[god] === 'present'
        : god in godMap
          ? godMap[god]! in gods
          : god in officerMap
            ? officerMap[god] === OFFICERS[(branch - m + 12) % 12]
            : present.has(god)
}
function output(path: string, content: string) {
  if (existsSync(path)) expect(readFileSync(path, 'utf8'), `Frozen baseline ${path}`).toBe(content)
  else {
    if (!process.env.P4C_BASELINE_WRITE) throw new Error(`Missing frozen baseline ${path}`)
    writeFileSync(path, content)
  }
}

describe.skipIf(!process.env.P4C_BASELINE_WRITE && !process.env.P4C_BASELINE_VERIFY)(
  'P4-C task 1 historical baseline measurement',
  () => {
    it('preserves the baseline source tree, inventory and deferral boundaries', () => {
      expect(
        execFileSync('git', ['rev-parse', `${BASELINE_COMMIT}^{tree}`], {
          encoding: 'utf8',
        }).trim(),
      ).toBe(BASELINE_TREE)
      // Ignore tests: copying this reporter into a historical worktree must not alter evaluated code/data.
      execFileSync('git', [
        'diff',
        '--exit-code',
        BASELINE_COMMIT,
        '--',
        'shared',
        'src',
        'package.json',
        'package-lock.json',
        ':(exclude)**/*.test.ts',
        ':(exclude)**/*.test.tsx',
      ])
      expect(unknown).toEqual([
        '母倉',
        '福德',
        '天恩',
        '天巫',
        '天后',
        '天醫',
        '除神',
        '驛馬',
        '天馬',
        '吉期',
        '鳴吠',
      ])
      expect(art.yiEvidence.operands.seasonDays).toContain('王日')
      expect(art.yiEvidence.deferred).toHaveProperty('修倉庫')
      expect(entries).toHaveLength(29)
      expect(new Set(entries.map((e) => e.heading)).size).toBe(29)
      if (process.env.P4C_BASELINE_WRITE) mkdirSync(ROOT, { recursive: true })
      output(`${ROOT}/inventory.json`, JSON.stringify(inventory, null, 2) + '\n')
    })
    it('measures all rows without treating masked unknowns or P5 as completed operands', () => {
      const columns = [
        'date',
        'lunar_day',
        'phase',
        'soil_presence',
        'soil_authority',
        'soil_status',
        'month_jian',
        'pillar',
        'raw_heading',
        'heading',
        'activities',
        'listed_unknown_gods',
        'known_present_yi_gods',
        'raw_yi',
        'warehouse_deferred',
        'pre_yi',
        'pre_ji',
        'pre_protected_ji',
        'pre_state',
        'final_yi',
        'final_ji',
        'final_protected_ji',
        'final_state',
        'ji_unresolved',
        'final_undetermined_bucket',
        'propagated_from',
        'propagation_blocked',
      ]
      const rows = [columns.join('\t')]
      const counts = {
        dates: 0,
        headings: 0,
        rowsWithListedUnknown: 0,
        rawYiUnknownEleven: 0,
        rawYiKnownTrueDespiteUnknown: 0,
        warehouseDeferred: 0,
        preYiUnknown: 0,
        preYiUnknownEleven: 0,
        preYiUnknownWarehouse: 0,
        preYiUnknownOther: 0,
        rawUnknownSuppressed: 0,
        finalUndetermined: 0,
        undeterminedWarehouse: 0,
        undeterminedRawElevenUnknown: 0,
        undeterminedOtherState: 0,
        unresolvedJi: 0,
        lifted: 0,
        blocked: 0,
        conflicts: 0,
      }
      const perGod: Record<
        string,
        {
          headings: string[]
          listedRows: number
          rawYiUnknownRows: number
          knownPresentMasksRows: number
          warehouseRows: number
          finalUndeterminedRows: number
        }
      > = Object.fromEntries(
        inventory.items.map((x) => [
          x.han,
          {
            headings: x.headings.map((h) => h.normalized),
            listedRows: 0,
            rawYiUnknownRows: 0,
            knownPresentMasksRows: 0,
            warehouseRows: 0,
            finalUndeterminedRows: 0,
          },
        ]),
      )
      const perHeading: Record<string, Record<string, number>> = {}
      for (const { date } of dates.days) {
        const a = getAlmanac(date as never)
        const m = a.selectionContext.MONTH_JIAN_BRANCH!,
          stem = a.dayCanChi.can,
          branch = a.dayCanChi.chi
        const month = B[m]!,
          pillar = S[stem]! + B[branch]!,
          lunarDay = a.selectionContext.LUNAR_DAY!
        const phase = getP4MoonPhase(date),
          soil = getP4SoilPresence(date)
        expect(phase.phase).not.toBe('unknown')
        expect(soil.presence).not.toBe('unknown')
        const r = resolveP4FullDay(month, pillar, { lunarDay, phase, soil })
        const known = knownPresence(m, stem, branch)
        counts.dates++
        counts.conflicts += Number(Boolean(r.remaining.scopes['遊禍']?.reason))
        for (const e of entries) {
          const missing = e.tokens.filter((g) => unknown.includes(g))
          const present = e.tokens.filter((g) => known(g) === true)
          const rawYi = e.warehouse
            ? 'deferred'
            : present.length
              ? 'true'
              : e.tokens.some((g) => known(g) === undefined)
                ? 'unknown'
                : 'false'
          const pre = r.prePropagationHeadings[e.heading]!,
            final = r.headings[e.heading]!
          const undetermined = final.state === 'undetermined'
          // Disjoint observational buckets, NOT proof of a unique causal root. Additional scope
          // ambiguity may coexist with either warehouse or raw missing-Yi evidence.
          const bucket = !undetermined
            ? ''
            : e.warehouse
              ? 'P5_WAREHOUSE'
              : rawYi === 'unknown'
                ? 'RAW_YI_UNKNOWN_ELEVEN'
                : 'OTHER_STATE_WITH_KNOWN_RAW_YI'
          counts.headings++
          counts.rowsWithListedUnknown += Number(missing.length > 0)
          counts.rawYiUnknownEleven += Number(rawYi === 'unknown')
          counts.rawYiKnownTrueDespiteUnknown += Number(rawYi === 'true' && missing.length > 0)
          counts.warehouseDeferred += Number(e.warehouse)
          counts.preYiUnknown += Number(pre.yi === undefined)
          counts.preYiUnknownWarehouse += Number(pre.yi === undefined && e.warehouse)
          counts.preYiUnknownEleven += Number(
            pre.yi === undefined && !e.warehouse && rawYi === 'unknown',
          )
          counts.preYiUnknownOther += Number(
            pre.yi === undefined && !e.warehouse && rawYi !== 'unknown',
          )
          counts.rawUnknownSuppressed += Number(rawYi === 'unknown' && pre.yi === false)
          counts.finalUndetermined += Number(undetermined)
          counts.undeterminedWarehouse += Number(bucket === 'P5_WAREHOUSE')
          counts.undeterminedRawElevenUnknown += Number(bucket === 'RAW_YI_UNKNOWN_ELEVEN')
          counts.undeterminedOtherState += Number(bucket === 'OTHER_STATE_WITH_KNOWN_RAW_YI')
          counts.unresolvedJi += Number(r.unresolvedJi[e.heading]!.length > 0)
          counts.lifted += Number('propagatedFrom' in final)
          counts.blocked += Number('propagationBlocked' in final)
          const h = (perHeading[e.heading] ??= {
            rows: 0,
            listedUnknown: 0,
            rawYiUnknown: 0,
            knownPresentMasks: 0,
            preYiUnknown: 0,
            finalUndetermined: 0,
            warehouse: 0,
          })
          h.rows++
          h.listedUnknown += Number(missing.length > 0)
          h.rawYiUnknown += Number(rawYi === 'unknown')
          h.knownPresentMasks += Number(rawYi === 'true' && missing.length > 0)
          h.preYiUnknown += Number(pre.yi === undefined)
          h.finalUndetermined += Number(undetermined)
          h.warehouse += Number(e.warehouse)
          for (const g of missing) {
            const x = perGod[g]!
            x.listedRows++
            x.rawYiUnknownRows += Number(rawYi === 'unknown')
            x.knownPresentMasksRows += Number(rawYi === 'true')
            x.warehouseRows += Number(e.warehouse)
            x.finalUndeterminedRows += Number(undetermined)
          }
          rows.push(
            [
              date,
              lunarDay,
              phase.phase,
              soil.presence,
              soil.authorityId,
              soil.status,
              month,
              pillar,
              e.raw,
              e.heading,
              e.activities.join('+'),
              missing.join('+'),
              present.join('+'),
              rawYi,
              e.warehouse,
              pre.yi ?? 'unknown',
              pre.ji,
              pre.protectedJi,
              pre.state,
              final.yi ?? 'unknown',
              final.ji,
              final.protectedJi,
              final.state,
              r.unresolvedJi[e.heading]!.join('+'),
              bucket,
              'propagatedFrom' in final ? final.propagatedFrom : '',
              'propagationBlocked' in final ? final.propagationBlocked : '',
            ].join('\t'),
          )
        }
      }
      expect(counts.dates).toBe(1095)
      expect(counts.headings).toBe(31755)
      expect(counts.unresolvedJi).toBe(0)
      expect(counts.conflicts).toBe(0)
      expect(counts.preYiUnknown).toBe(
        counts.preYiUnknownEleven + counts.preYiUnknownWarehouse + counts.preYiUnknownOther,
      )
      expect(counts.finalUndetermined).toBe(
        counts.undeterminedWarehouse +
          counts.undeterminedRawElevenUnknown +
          counts.undeterminedOtherState,
      )
      output(`${ROOT}/baseline.tsv`, rows.join('\n') + '\n')
      output(
        `${ROOT}/summary.json`,
        JSON.stringify(
          {
            scope: 'MEASURED_BASELINE_NOT_GOLDEN',
            baselineCommit: BASELINE_COMMIT,
            baselineTree: BASELINE_TREE,
            counts,
            perGod,
            perHeading,
            limits: [
              'Unknown tokens remain listed even when another listed god proves 宜.',
              'Per-god counts overlap; do not sum to obtain unique heading rows.',
              'Raw 宜 measurement mirrors baseline lookup; no independent new presence authority is asserted.',
              'Undetermined buckets classify observable context, not exclusive root causes.',
              'Warehouse is deferred, not resolved by a mother-store god label.',
            ],
          },
          null,
          2,
        ) + '\n',
      )
    }, 120_000)
    it('verifies frozen output locks when present', () => {
      const p = `${ROOT}/lock.json`
      if (!existsSync(p)) {
        expect(process.env.P4C_BASELINE_WRITE).toBeTruthy()
        return
      }
      const lock = JSON.parse(readFileSync(p, 'utf8')) as {
        files: { path: string; sha256: string }[]
      }
      for (const f of lock.files) expect(sha256(f.path), f.path).toBe(f.sha256)
    })
  },
)

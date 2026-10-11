import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import authority from '../almanac-data/p4-vol10-authority.json'
import art from '../almanac-data/p4-vol10-grade-resolution-v2.json'
import bridge from '../almanac-data/p4-vol10-context-bridge-v2.json'
import clauses from '../almanac-data/p4-vol10-named-clauses.json'
import golden from '../almanac-data/golden-p4-grade-resolution.json'
import lockV1 from '../../docs/audits/sources/p4-vol10/grade-resolution-lock.json'
import lock from '../../docs/audits/sources/p4-vol10/grade-resolution-lock-v2.json'
import { getCatHungAuthorityByMonthJian } from './catHungAuthority'
import { getSourceLockedCatHungStars } from './catHungStars'
import { getP4SubjectPresence } from './p4ContextBridge'
import {
  evaluateP4Clause,
  getP4EntryClause,
  getP4GridCell,
  resolveP4Grades,
} from './p4GradeResolution'
import { getP4SeasonDays } from './p4SeasonDays'
import { getXiejiGodPresence } from './xiejiGodPresence'
import { getVol10VirtuesPresent } from './xiejiVirtues'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const COLUMNS = Object.keys(art.gridColumns)
const STAR_DE_HE = { 'Thiên Đức': 1, 'Thiên Đức Hợp': 1, 'Nguyệt Đức': 1, 'Nguyệt Đức Hợp': 1 }
const grades = new Map(authority.grades.map((g) => [g.id, g]))
const actionEffect = art.actionEffect as unknown as Record<string, string[]>
const corrected = new Map(art.partnerReadingCorrections.map((c) => [c.cell, c.correctedReading]))
const edge = (subject: string, month: string) =>
  clauses.namedDeferrals.find((e) => e.subject === subject && e.months.includes(month))

describe('P4 等第 cell and named 德 group (A03), audit only', () => {
  it('keeps the frozen oracle and source quotations intact', () => {
    for (const f of [...lockV1.files, ...lock.files])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const refs = [
      art.noGridColumn.source,
      ...art.entries.map((e) => e.source),
      ...art.actionEffect.sources,
    ]
    for (const r of refs)
      expect(source.slice(r.offset, r.offset + Array.from(r.text).length).join('')).toBe(r.text)
    expect(art.scoringReady).toBe(false)
  })

  // Expected values hand-derived in golden-p4-grade-resolution.json before the resolver existed.
  it.each(golden.cases)('$monthJian月$pillar: $note', (c) => {
    expect(resolveP4Grades(c.monthJian, c.pillar)).toEqual({
      subjects: c.subjects,
      allTabooRuleIds: c.allTabooRuleIds,
    })
  })

  it('assigns every Month Jian to exactly one cell in each of the 11 columns', () => {
    for (const subject of COLUMNS) {
      const used = new Set<string>()
      for (const month of BRANCHES) used.add(getP4GridCell(subject, month)!.id)
      for (const cell of authority.cells.filter((c) =>
        c.id.startsWith(`${art.gridColumns[subject as keyof typeof art.gridColumns]}:`),
      ))
        expect(used.has(cell.id)).toBe(!cell.isBlank)
    }
  })

  it('matches every cell to its entry clause; a deferral shares the target grade', () => {
    let xiangdi = 0
    for (const subject of COLUMNS)
      for (const month of BRANCHES) {
        const cell = getP4GridCell(subject, month)!
        let owner = subject
        let clause = getP4EntryClause(owner, month)
        while (clause.effect === 'defer') {
          expect(edge(owner, month)?.target).toBe(clause.to)
          owner = clause.to!
          clause = getP4EntryClause(owner, month)
          const target = getP4GridCell(owner, month)
          if (target) expect(target.gradeRows).toEqual(cell.gradeRows)
        }
        const grade = grades.get(cell.gradeRows[0]!)!
        const branches = clause.with
          ? [
              [grade.withDe, clause.effect],
              [grade.withoutDe, clause.otherwise ?? 'as_usual'],
            ]
          : [
              [grade.withDe, clause.effect],
              [grade.withoutDe, clause.effect],
            ]
        for (const [action, effect] of branches) {
          expect(actionEffect[action!], `${subject} ${month}月 ${action}`).toContain(effect)
          if (action === 'both_present') xiangdi++
        }
      }
    expect(xiangdi).toBeGreaterThan(0)
  })

  it('sees every checkable partner of a cell on every day the subject occurs in that month', () => {
    const officer: Record<string, number> = {
      建日: 0, 除日: 1, 滿日: 2, 平日: 3, 定日: 4, 執日: 5, 破日: 6, 危日: 7, 成日: 8, 收日: 9, 開日: 10, 閉日: 11, 月建: 0, 月破: 6,
    } // prettier-ignore
    const subjectAlias: Record<string, string> = { 劫煞: '刼煞', 六害: '月害' }
    const godAlias: Record<string, string> = { 六合: 'luc_hop', 時德: 'thoi_duc' }
    let checked = 0
    for (const subject of COLUMNS)
      for (const cell of authority.cells.filter((c) =>
        c.id.startsWith(`${art.gridColumns[subject as keyof typeof art.gridColumns]}:`),
      ))
        for (const group of cell.isBlank
          ? []
          : (corrected.get(cell.id) ?? cell.displayReading).split(' / ')) {
          const [months, partners = ''] = group.split('：')
          for (const month of months!.split('月')[0]!)
            for (let i = 0; i < 60; i++) {
              const m = BRANCHES.indexOf(month)
              const p = getP4SubjectPresence(m, i % 10, i % 12)
              if (p[subject] !== 'present') continue
              const gods = getXiejiGodPresence(m, i % 10, i % 12)
              const season = getP4SeasonDays(m, i % 12)
              for (const label of partners.split('、').filter(Boolean)) {
                const name = subjectAlias[label] ?? label
                const ok =
                  label in officer
                    ? (i % 12) - m === officer[label] || (i % 12) - m + 12 === officer[label]
                    : name in p
                      ? p[name] === 'present'
                      : label in season
                        ? season[label] === 'unknown'
                          ? undefined
                          : season[label] === 'present'
                        : label in godAlias
                          ? godAlias[label]! in gods
                          : undefined
                if (ok === undefined) continue // 德大會: uninterpreted label
                expect(
                  ok,
                  `${subject} ${month}月 ${STEMS[i % 10]}${BRANCHES[i % 12]} ${label}`,
                ).toBe(true)
                checked++
              }
            }
        }
    expect(checked).toBeGreaterThan(100)
  }, 60_000) // full-domain sweep: CI runners are ~4× slower than local

  it('resolves all 720 contexts without a grade/clause conflict', () => {
    for (const month of BRANCHES)
      for (let i = 0; i < 60; i++) {
        const r = resolveP4Grades(month, STEMS[i % 10]! + BRANCHES[i % 12]!)
        for (const s of Object.values(r.subjects) as { consistency?: string }[])
          expect(s.consistency).not.toBe('conflict')
      }
  }, 60_000) // full-domain sweep: CI runners are ~4× slower than local

  // Hand-derived: 未月戊午 is 逐陣 + 不從德願所宜; 天願 (六月戊午) is named by both clauses.
  it('leaves 德願 undetermined where a named group god is present', () => {
    const r = resolveP4Grades('未', '戊午')
    expect(Object.keys(r.subjects)).toEqual(['閉日', '天吏'])
    for (const [subject, cell] of [
      ['閉日', 'bi:ci'],
      ['天吏', 'li:ci'],
    ] as const)
      expect(r.subjects[subject]).toEqual({
        cell,
        grade: 'ci',
        status: 'undetermined',
        // 逐陣 removes no present god (no 德合 that day); only the 德願 rule decides.
        suppressedBy: ['no_de_yuan'],
      })
  })

  // Owner decision 2026-10-11: adopt 德願 = 德合 + 天願 only if both co-occur on 未月戊午 and the
  // pair is needed to reproduce the source. Evidence below fails that precondition, so 德願 stays
  // undetermined; if this test ever fails, revisit the decision instead of updating it.
  it('keeps 德願 undetermined: the convention precondition is not met on its contexts', () => {
    const deHe = (m: number, s: number, b: number) =>
      getSourceLockedCatHungStars(m, s, b).good.filter((x) => x.name in STAR_DE_HE)
    expect(deHe(7, 4, 6)).toEqual([]) // 未月戊午: no 德合 god
    expect(getVol10VirtuesPresent(7, 4, 6).has('天願')).toBe(true)
    expect(deHe(5, 2, 6).map((x) => x.name)).toEqual(['Thiên Đức Hợp']) // 巳月丙午
    expect(getVol10VirtuesPresent(5, 2, 6).has('天願')).toBe(false)
    expect(resolveP4Grades('巳', '丙午').subjects).toEqual({
      大時: expect.objectContaining({ deGroup: [], consistency: 'agree' }),
    })
  })

  it('decides 德願 independently of pillar-rule order', () => {
    const rules = clauses.pillarRules.filter((r) => ['no_de_yuan', 'yang_no_de_he'].includes(r.id))
    const de = new Set(['天德合'])
    const a = evaluateP4Clause('閉日', '未', de, rules)
    const b = evaluateP4Clause('閉日', '未', de, [...rules].reverse())
    expect([a.undetermined, a.dePresent, a.named]).toEqual([false, false, []])
    expect([b.undetermined, b.dePresent, b.named]).toEqual([false, false, []])
  })

  it('corrects only the exact frozen reading and moves no token between cells', () => {
    for (const c of art.partnerReadingCorrections) {
      const cell = authority.cells.find((x) => x.id === c.cell)!
      expect(cell.displayReading).toBe(c.authorityReading)
      const tokens = (r: string) =>
        r
          .split(/[ /：、]+/)
          .filter(Boolean)
          .sort()
      expect(tokens(c.correctedReading)).toEqual(tokens(c.authorityReading))
    }
  })

  it('erratum: 卷06 刼煞 equals the production Phase 4D Month Jian row', () => {
    const rule = bridge.subjects.find((s) => s.han === '刼煞')!.presence as {
      branchByMonthJian: { targets: string }
    }
    for (let m = 0; m < 12; m++)
      expect(getCatHungAuthorityByMonthJian(m).jieSha).toBe(
        rule.branchByMonthJian.targets[(m + 10) % 12],
      )
  })
})

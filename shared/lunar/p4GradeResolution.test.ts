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
import { getP4SubjectPresence } from './p4ContextBridge'
import { getP4EntryClause, getP4GridCell, resolveP4Grades } from './p4GradeResolution'
import { getXiejiGodPresence } from './xiejiGodPresence'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const COLUMNS = Object.keys(art.gridColumns)
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
    const godAlias: Record<string, string> = { 六合: 'luc_hop', 時德: 'thoi_duc', 民日: 'dan_nhat' }
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
              for (const label of partners.split('、').filter(Boolean)) {
                const name = subjectAlias[label] ?? label
                const ok =
                  label in officer
                    ? (i % 12) - m === officer[label] || (i % 12) - m + 12 === officer[label]
                    : name in p
                      ? p[name] === 'present'
                      : label in godAlias
                        ? godAlias[label]! in gods
                        : undefined
                if (ok === undefined) continue // 相日/王日/官日/守日/長生/德大會: no audited operand
                expect(
                  ok,
                  `${subject} ${month}月 ${STEMS[i % 10]}${BRANCHES[i % 12]} ${label}`,
                ).toBe(true)
                checked++
              }
            }
        }
    expect(checked).toBeGreaterThan(100)
  })

  it('resolves all 720 contexts without a grade/clause conflict', () => {
    for (const month of BRANCHES)
      for (let i = 0; i < 60; i++) {
        const r = resolveP4Grades(month, STEMS[i % 10]! + BRANCHES[i % 12]!)
        for (const s of Object.values(r.subjects) as { consistency?: string }[])
          expect(s.consistency).not.toBe('conflict')
      }
  })

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
        suppressedBy: ['pursuit', 'no_de_yuan'],
      })
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

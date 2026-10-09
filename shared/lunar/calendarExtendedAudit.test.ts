/// <reference types="node" />
import { expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { SunPosition } from 'astronomy-engine'
import { jdFromDate, jdToDate, solarStringToJd, jdToSolarString } from './julian'
import { solarToLunar, sunLongitude } from './lunar'
import { termContextAt } from '../bazi/termInstants'
import { dayCanChi, monthCanChi, yearCanChi, CHI } from './canChi'
import { getNapAm } from './napAm'
import {
  getSolarTerm,
  getSolarTermAt,
  getSolarMonth,
  solarTermsForYear,
  solarTermMonthChi,
} from './solarTerms'
import { getOfficer, getOfficerAtInstant } from './officers'
import { getMansion } from './mansions'
import { getDayGod, getAuspiciousHours } from './auspicious'
import { getTravelDirections } from './directions'
import reference from '../../tasks/fixtures/solar-terms-hko.v1.json'

const normalize = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/^chính /, '')
const canonicalGod = (s: string) => normalize(s === 'Câu Trận' ? 'Câu Trần' : s)
const officerNames = [
  'Kiến', 'Trừ', 'Mãn', 'Bình', 'Định', 'Chấp', 'Phá', 'Nguy', 'Thành', 'Thâu', 'Khai', 'Bế',
]
const mansionNames = [
  'Giác', 'Cang', 'Đê', 'Phòng', 'Tâm', 'Vĩ', 'Cơ', 'Đẩu', 'Ngưu', 'Nữ', 'Hư', 'Nguy', 'Thất', 'Bích',
  'Khuê', 'Lâu', 'Vị', 'Mão', 'Tất', 'Chủy', 'Sâm', 'Tỉnh', 'Quỷ', 'Liễu', 'Tinh', 'Trương', 'Dực', 'Chẩn',
]
const godNames = [
  'Thanh Long', 'Minh Đường', 'Thiên Hình', 'Chu Tước', 'Kim Quỹ', 'Kim Đường', 'Bạch Hổ', 'Ngọc Đường',
  'Thiên Lao', 'Huyền Vũ', 'Tư Mệnh', 'Câu Trần',
]
const goodGods = new Set([0, 1, 4, 5, 7, 10])

test('Phase 2.1 — Golden V2.1, Extended invariants and minute boundaries (Core gate required)', () => {
  const gate = JSON.parse(readFileSync('tasks/calendar-audit/phase1-results.json', 'utf8'))
  expect(gate.status, 'Phase 1 must pass before any Extended checks').toBe('PASS')
  expect(gate.goldenSha256).toBe(
    createHash('sha256').update(readFileSync('shared/lunar/audit-fixtures/calendar-golden.json')).digest('hex'),
  )
  expect(solarToLunar(13, 8, 2026)).toEqual({ year: 2026, month: 7, day: 1, isLeap: false })
  const golden = JSON.parse(readFileSync('shared/lunar/audit-fixtures/calendar-golden-v2.1.json', 'utf8'))
  const directionsGolden = JSON.parse(
    readFileSync('shared/lunar/audit-fixtures/directions-golden-v1.json', 'utf8'),
  )
  expect(directionsGolden.authorityId).toBe('directions-authority-v1')
  expect(directionsGolden.operand).toBe('DAY_STEM')
  expect(directionsGolden.cases).toHaveLength(10)

  const results: Record<
    string,
    { checks: number; failures: { case: string; expected: unknown; actual: unknown }[] }
  > = {}
  const observations: unknown[] = []
  const directionMigrationChanges: {
    case: string
    stem: string
    oldTaiThan: string
    currentTaiThan: string
    classification: 'EXPECTED_AUTHORITY_MIGRATION_CHANGE'
  }[] = []
  function check(module: string, id: string, actual: unknown, expected: unknown) {
    const r = (results[module] ??= { checks: 0, failures: [] })
    r.checks++
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      r.failures.push({ case: id, expected, actual })
  }

  for (const r of golden.records) {
    const jd = solarStringToJd(r.date),
      s = jdToDate(jd),
      l = solarToLunar(s.day, s.month, s.year),
      cc = dayCanChi(jd)
    check('V2.1 Core integrity', r.date + ' JDN', jd, r.julianDayNumber)
    check('V2.1 Core integrity', r.date + ' lunar', { year: l.year, month: l.month, day: l.day, leap: l.isLeap }, r.lunar)
    check('V2.1 Core integrity', r.date + ' Can Chi day', cc.name, r.canChi.day)
    check('V2.1 Core integrity', r.date + ' Can Chi month', monthCanChi(l).name, r.canChi.monthCivilLunarConvention)
    check('V2.1 Core integrity', r.date + ' Can Chi year', yearCanChi(l.year).name, r.canChi.yearLunarConvention)
    check('V2.1 Core integrity', r.date + ' nap am', getNapAm(cc).name, r.napAmDay)
    check('V2.1 Core integrity', r.date + ' hours', getAuspiciousHours(cc.chi).map((h) => h.name), r.hoangDaoHours)

    const noon = r.date + 'T12:00:00+07:00',
      term = getSolarTermAt(noon),
      month = (termContextAt(noon).monthOffset + 2) % 12
    check('Solar term at noon', r.date, normalize(term.name), normalize(r.solarTermAtLocalNoon.name))
    check('Solar month at noon', r.date, CHI[getSolarMonth(noon, r.timezone)], r.solarMonthBranchAtLocalNoon)
    check('12 Truc exact API at noon', noon, getOfficerAtInstant(noon, r.timezone).name, r.trucAtLocalNoon)
    check('28 Tu', r.date, getMansion(jd).name, r.mansion28)

    const god = getDayGod(l.month, cc.chi)
    check('Hoang Hac Dao type', r.date, god.isHoangDao ? 'hoang_dao' : 'hac_dao', r.hoangDaoDay.type)
    check('Hoang Hac Dao god', r.date, canonicalGod(god.name), canonicalGod(r.hoangDaoDay.god))

    const dirs = getTravelDirections(cc.can)
    const directionAuthority = directionsGolden.cases[cc.can]
    check('Directions authority-v1 stem', r.date, directionAuthority.dayCan, cc.can)
    check('Hy Than authority-v1', r.date, normalize(dirs.hyThan), normalize(directionAuthority.hyThan))
    check('Tai Than authority-v1', r.date, normalize(dirs.taiThan), normalize(directionAuthority.taiThan))
    check('Phuc Than authority-v1', r.date, normalize(dirs.phucThan), normalize(directionAuthority.phucThan))
    // Hỷ Thần is unchanged and remains compatible with the frozen V2.1 evidence.
    check('Hy Than legacy V2.1', r.date, normalize(dirs.hyThan), normalize(r.directions.hyThan))
    // V2.1 is immutable historical evidence. A Tài Thần difference is migration evidence only
    // after the current value has independently passed directions-authority-v1 above.
    if (normalize(dirs.taiThan) === normalize(r.directions.taiThan)) {
      check('Tai Than legacy unchanged', r.date, normalize(dirs.taiThan), normalize(r.directions.taiThan))
    } else {
      directionMigrationChanges.push({
        case: r.date,
        stem: directionAuthority.stem,
        oldTaiThan: normalize(r.directions.taiThan),
        currentTaiThan: normalize(dirs.taiThan),
        classification: 'EXPECTED_AUTHORITY_MIGRATION_CHANGE',
      })
    }

    observations.push({
      date: r.date,
      rawGodExpected: r.hoangDaoDay.god,
      rawGodActual: god.name,
      rawDirectionsExpected: r.directions,
      rawDirectionsActual: dirs,
      directionAuthorityId: directionsGolden.authorityId,
      directionMigrationClassification:
        normalize(dirs.taiThan) === normalize(r.directions.taiThan)
          ? 'UNCHANGED'
          : 'EXPECTED_AUTHORITY_MIGRATION_CHANGE',
      longitudeExpectedApprox: r.solarTermAtLocalNoon.solarLongitudeDegApprox,
      longitudeActualApparent: SunPosition(new Date(noon)).elon,
      longitudeIndependentMeeusGeometric: (sunLongitude(jd - 7 / 24) * 180) / Math.PI,
      dayLabelTransitionUtc: getSolarTerm(jd).startsAtUtc,
      calendarDayTerm: getSolarTerm(jd).name,
      noonTerm: term.name,
      calendarDayMonth: CHI[solarTermMonthChi(jd)],
      noonMonth: CHI[month],
      expectedNoonOfficer: officerNames[(cc.chi - month + 12) % 12],
      productionOfficer: getOfficer(jd, cc.chi).name,
    })
  }

  // Freeze the observed V2.1 -> directions-authority-v1 migration surface. If this count
  // changes, either the historical Golden or current authority lineage changed and must be reviewed.
  expect(directionMigrationChanges).toHaveLength(92)
  expect(new Set(directionMigrationChanges.map((x) => x.classification))).toEqual(
    new Set(['EXPECTED_AUTHORITY_MIGRATION_CHANGE']),
  )

  const anchor = solarStringToJd(golden.meta.mansionAnchor.date),
    anchorIndex = mansionNames.indexOf(golden.meta.mansionAnchor.mansion)
  check('28 Tu', 'Golden anchor', getMansion(anchor).name, golden.meta.mansionAnchor.mansion)
  for (let jd = jdFromDate(1, 1, 1900); jd <= jdFromDate(31, 12, 2100); jd++) {
    const id = jdToSolarString(jd),
      cc = dayCanChi(jd),
      month = solarTermMonthChi(jd),
      off = getOfficer(jd, cc.chi),
      m = getMansion(jd)
    check('28 Tu', id + ' independent anchor cycle', m.index, (((jd - anchor + anchorIndex) % 28) + 28) % 28)
    check('28 Tu', id + ' next', getMansion(jd + 1).index, (m.index + 1) % 28)
    check('28 Tu', id + ' repeat', getMansion(jd + 28).name, m.name)
    check('Legacy 12 Truc daily invariant', id + ' formula', off.name, officerNames[(cc.chi - month + 12) % 12])
    check('Legacy 12 Truc daily invariant', id + ' Kien', getOfficer(jd, month).index, 0)
    if (jd < jdFromDate(31, 12, 2100) && solarTermMonthChi(jd + 1) === month)
      check('Legacy 12 Truc daily invariant', id + ' step', getOfficer(jd + 1, dayCanChi(jd + 1).chi).index, (off.index + 1) % 12)
    check('Directions invariant', id + ' stem repeat', getTravelDirections(dayCanChi(jd + 10).can), getTravelDirections(cc.can))
  }

  const boundaries: unknown[] = []
  for (let year = 1900; year <= 2100; year++) {
    const terms = solarTermsForYear(year)
    check('Solar term invariant', String(year) + ' count', terms.length, 24)
    check('Solar term invariant', String(year) + ' unique', new Set(terms.map((t) => t.index)).size, 24)
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i],
        ms = Date.parse(t.instantUtc),
        before = new Date(ms - 60000).toISOString(),
        after = new Date(ms + 60000).toISOString()
      check('Solar term minute boundary', t.instantUtc + ' before', getSolarTermAt(before).index, (t.index + 23) % 24)
      check('Solar term minute boundary', t.instantUtc + ' exact', getSolarTermAt(t.instantUtc).index, t.index)
      check('Solar term minute boundary', t.instantUtc + ' after', getSolarTermAt(after).index, t.index)
      if (i > 0) check('Solar term invariant', t.instantUtc + ' order', ms > Date.parse(terms[i - 1].instantUtc), true)
      if (t.index % 2 === 1)
        for (const iso of [before, t.instantUtc, after]) {
          const jd = solarStringToJd(new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10)),
            cc = dayCanChi(jd),
            expectedMonth = iso === before
              ? ((Math.floor((((t.index + 23) % 24) - 21 + 24) / 2) % 12) + 2) % 12
              : ((Math.floor((t.index - 21 + 24) / 2) % 12) + 2) % 12
          check('Bazi exact month minute boundary', iso, (termContextAt(iso).monthOffset + 2) % 12, expectedMonth)
          check('Solar month exact API minute boundary', iso, getSolarMonth(iso, 'Asia/Ho_Chi_Minh'), expectedMonth)
          check('12 Truc exact API minute boundary', iso, getOfficerAtInstant(iso, 'Asia/Ho_Chi_Minh').name, officerNames[(cc.chi - expectedMonth + 12) % 12])
          if (solarTermMonthChi(jd) !== expectedMonth)
            boundaries.push({
              instant: iso,
              transition: t.instantUtc,
              term: t.name,
              expectedMonth: CHI[expectedMonth],
              actualMonth: CHI[solarTermMonthChi(jd)],
              expectedTruc: officerNames[(cc.chi - expectedMonth + 12) % 12],
              actualTruc: getOfficer(jd, cc.chi).name,
            })
        }
    }
  }

  for (const r of reference.cases) {
    const actual = solarTermsForYear(new Date(r.reference).getUTCFullYear()).find((t) => t.longitude === r.longitude)!
    check('HKO independent transition reference', r.reference, Math.abs(Date.parse(actual.instantUtc) - Date.parse(r.reference)) <= 60000, true)
  }
  for (let month = 1; month <= 12; month++)
    for (let chi = 0; chi < 12; chi++) {
      const index = (chi - ((month - 1) % 6) * 2 + 12) % 12,
        god = getDayGod(month, chi)
      check('Hoang Hac Dao 144 combinations', `${month}/${chi} type`, god.isHoangDao, goodGods.has(index))
      check('Hoang Hac Dao 144 combinations', `${month}/${chi} god`, canonicalGod(god.name), canonicalGod(godNames[index]))
    }

  // Phase 2.1 evidence is frozen history: regenerate only on request, never as a test side effect.
  const output = process.env['PHASE21_AUDIT_OUTPUT']
  if (output)
    writeFileSync(
      output,
      JSON.stringify(
        {
          phase: '2.1',
          authority: 'calendar-validation-patch-v2.1.md + calendar-golden-v2.1.json',
          goldenSha256: createHash('sha256').update(readFileSync('shared/lunar/audit-fixtures/calendar-golden-v2.1.json')).digest('hex'),
          gate: 'Phase 1 PASS',
          normalization: 'NFC/case; Chính prefix omitted for compass aliases only. Câu Trận normalized to Câu Trần per Patch 2.1; raw values retained in observations.',
          longitudePolicy: 'Approximate Golden longitude has no specified tolerance; numeric residuals recorded as diagnostics, not an invented strict gate.',
          directionAuthority: directionsGolden.authorityId,
          directionMigrationChanges,
          results,
          observations,
          boundaries,
        },
        null,
        2,
      ) + '\n',
    )

  expect(
    Object.entries(results)
      .filter(([, r]) => r.failures.length)
      .map(([module, r]) => ({ module, count: r.failures.length, examples: r.failures.slice(0, 3) })),
  ).toEqual([])
}, 120000)

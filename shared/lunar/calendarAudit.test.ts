/// <reference types="node" />
import { test, expect } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { jdFromDate, jdToDate, toSolarDateString } from './julian'
import { solarToLunar, lunarToSolar, getLunarMonthLength, getLeapMonth } from './lunar'
import { CAN, CHI, dayCanChi, monthCanChi, yearCanChi } from './canChi'
import { getNapAm, sexagenaryIndex } from './napAm'
import { canElement, chiElement } from './elements'
import { getAllHours, getAuspiciousHours } from './auspicious'
import { todayInVietnam, minutesNowInVietnam, vietnamDateTimeToDate } from '../time'

type Result = { checks: number; failures: { case: string; expected: unknown; actual: unknown }[] }
const results: Record<string, Result> = {}
function check(module: string, id: string, actual: unknown, expected: unknown) {
  const r = (results[module] ??= { checks: 0, failures: [] })
  r.checks++
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    r.failures.push({ case: id, expected, actual })
}
const hours = [
  [0, 1, 3, 6, 8, 9],
  [2, 3, 5, 8, 10, 11],
  [0, 1, 4, 5, 7, 10],
  [0, 2, 3, 6, 7, 9],
  [2, 4, 5, 8, 9, 11],
  [1, 4, 6, 7, 10, 11],
]
const napNames = [
  'Hải Trung Kim',
  'Lư Trung Hỏa',
  'Đại Lâm Mộc',
  'Lộ Bàng Thổ',
  'Kiếm Phong Kim',
  'Sơn Đầu Hỏa',
  'Giản Hạ Thủy',
  'Thành Đầu Thổ',
  'Bạch Lạp Kim',
  'Dương Liễu Mộc',
  'Tuyền Trung Thủy',
  'Ốc Thượng Thổ',
  'Tích Lịch Hỏa',
  'Tùng Bách Mộc',
  'Trường Lưu Thủy',
  'Sa Trung Kim',
  'Sơn Hạ Hỏa',
  'Bình Địa Mộc',
  'Bích Thượng Thổ',
  'Kim Bạch Kim',
  'Phú Đăng Hỏa',
  'Thiên Hà Thủy',
  'Đại Trạch Thổ',
  'Thoa Xuyến Kim',
  'Tang Đố Mộc',
  'Đại Khê Thủy',
  'Sa Trung Thổ',
  'Thiên Thượng Hỏa',
  'Thạch Lựu Mộc',
  'Đại Hải Thủy',
]

test('Phase 1 — immutable Golden V1 and exhaustive Core invariants', () => {
  const golden = JSON.parse(
    readFileSync('shared/lunar/audit-fixtures/calendar-golden.json', 'utf8'),
  )
  check('Dataset', 'record count', golden.records.length, 100)
  for (const r of golden.records) {
    const [y, m, d] = r.date.split('-').map(Number)
    const jd = jdFromDate(d, m, y),
      l = solarToLunar(d, m, y),
      cc = dayCanChi(jd)
    check('JDN', r.date, jd, r.julianDayNumber)
    check('Lunar', r.date, { year: l.year, month: l.month, day: l.day, leap: l.isLeap }, r.lunar)
    check(
      'Lunar inverse',
      r.date,
      lunarToSolar(r.lunar.day, r.lunar.month, r.lunar.year, r.lunar.leap),
      { day: d, month: m, year: y },
    )
    check('Can Chi day', r.date, cc.name, r.canChi.day)
    check('Can Chi month', r.date, monthCanChi(l).name, r.canChi.monthCivilLunarConvention)
    check('Can Chi year', r.date, yearCanChi(l.year).name, r.canChi.yearLunarConvention)
    check('Nap am', r.date, getNapAm(cc).name, r.napAmDay)
    check(
      'Hoang Dao hours',
      r.date,
      getAuspiciousHours(cc.chi).map((h) => h.name),
      r.hoangDaoHours,
    )
  }
  const start = jdFromDate(1, 1, 1900),
    end = jdFromDate(31, 12, 2100)
  let previous: ReturnType<typeof solarToLunar> | undefined
  const combinations = new Set<string>(),
    leapYears = new Set<number>()
  for (let jd = start; jd <= end; jd++) {
    const s = jdToDate(jd),
      id = toSolarDateString(s),
      l = solarToLunar(s.day, s.month, s.year),
      cc = dayCanChi(jd)
    check('JDN', id + ' inverse', jdFromDate(s.day, s.month, s.year), jd)
    check(
      'JDN',
      id + ' independent Gregorian',
      jd,
      Math.floor(Date.UTC(s.year, s.month - 1, s.day) / 86400000) + 2440588,
    )
    check(
      'Lunar',
      id + ' valid',
      l.month >= 1 && l.month <= 12 && l.day >= 1 && l.day <= 30 && typeof l.isLeap === 'boolean',
      true,
    )
    check('Lunar inverse', id + ' round trip', lunarToSolar(l.day, l.month, l.year, l.isLeap), s)
    check(
      'Lunar',
      id + ' month length',
      [29, 30].includes(getLunarMonthLength(l.month, l.year, l.isLeap)!),
      true,
    )
    if (previous) {
      const p = previous
      let valid = false
      if (l.day === 1) {
        const length = getLunarMonthLength(p.month, p.year, p.isLeap)
        valid =
          p.day === length &&
          (l.isLeap
            ? !p.isLeap && l.month === p.month && l.year === p.year
            : l.month === (p.month % 12) + 1 && l.year === p.year + (p.month === 12 ? 1 : 0))
      } else
        valid =
          l.day === p.day + 1 && l.month === p.month && l.year === p.year && l.isLeap === p.isLeap
      check('Lunar', id + ' consecutive', valid, true)
    }
    previous = l
    if (l.isLeap) {
      leapYears.add(l.year)
      check('Leap months', id, getLeapMonth(l.year), l.month)
    }
    combinations.add(cc.name)
    check('Can Chi day', id + ' cycle', dayCanChi(jd + 60), cc)
    check(
      'Can Chi day',
      id + ' step',
      [dayCanChi(jd + 1).can, dayCanChi(jd + 1).chi],
      [(cc.can + 1) % 10, (cc.chi + 1) % 12],
    )
    check('Can Chi day', id + ' parity', cc.can % 2, cc.chi % 2)
    check(
      'Can Chi month',
      id + ' formula',
      monthCanChi(l).name,
      `${CAN[(l.year * 12 + l.month + 3) % 10]} ${CHI[(l.month + 1) % 12]}`,
    )
    check('Can Chi year', id + ' cycle', yearCanChi(l.year + 60), yearCanChi(l.year))
    check('Nap am', id + ' cycle', getNapAm(dayCanChi(jd + 60)), getNapAm(cc))
    check(
      'Nap am',
      id + ' canonical',
      getNapAm(cc).name,
      napNames[Math.floor(sexagenaryIndex(cc) / 2)],
    )
    const all = getAllHours(jd, cc.chi, l.month),
      good = all.filter((h) => h.isGood),
      bad = all.filter((h) => !h.isGood)
    check(
      'Hoang Dao hours',
      id + ' table',
      good.map((h) => h.chi),
      hours[cc.chi % 6],
    )
    check(
      'Hoang Dao hours',
      id + ' partition',
      [
        good.length,
        bad.length,
        new Set(all.map((h) => h.chi)).size,
        good.some((h) => bad.some((b) => b.chi === h.chi)),
      ],
      [6, 6, 12, false],
    )
    check(
      'Hoang Dao hours',
      id + ' intervals',
      all.map((h) => [h.startHour, h.endHour]),
      CHI.map((_, i) => [(23 + i * 2) % 24, (1 + i * 2) % 24]),
    )
  }
  check('Can Chi day', '60 combinations', combinations.size, 60)
  for (let i = 0; i < 60; i++) {
    const c = { can: i % 10, chi: i % 12 }
    check('Nap am', 'pair ' + i, getNapAm(c).name, napNames[Math.floor(i / 2)])
  }
  check(
    'Elements',
    'stems',
    CAN.map((_, i) => canElement(i)),
    ['Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Thủy', 'Thủy'],
  )
  check(
    'Elements',
    'branches',
    CHI.map((_, i) => chiElement(i)),
    ['Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa', 'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy'],
  )
  for (const time of ['22:59', '23:00', '23:59', '00:00', '00:59', '01:00']) {
    const instant = vietnamDateTimeToDate('2026-09-30', time)
    check('Civil boundary', time, todayInVietnam(instant), '2026-09-30')
    const [h, m] = time.split(':').map(Number)
    check('Civil boundary', time + ' minutes', minutesNowInVietnam(instant), h * 60 + m)
  }
  check(
    'Civil boundary',
    'UTC vs VN',
    todayInVietnam(new Date('2026-09-29T17:00:00Z')),
    '2026-09-30',
  )
  // DST is an external rendering concern; VN core uses a fixed UTC+7 offset.
  for (const instant of [
    '2026-03-08T06:59:00Z',
    '2026-03-08T07:00:00Z',
    '2026-11-01T05:59:00Z',
    '2026-11-01T06:00:00Z',
  ])
    check('Civil boundary', instant, todayInVietnam(new Date(instant)), instant.slice(0, 10))
  const report = {
    phase: 1,
    days: end - start + 1,
    leapYears: [...leapYears].sort(),
    results,
    goldenSha256: createHash('sha256')
      .update(readFileSync('shared/lunar/audit-fixtures/calendar-golden.json'))
      .digest('hex'),
    status: Object.values(results).every((r) => r.failures.length === 0) ? 'PASS' : 'FAIL',
    phase2: 'Eligible only when this audit and boundary regression pass',
  }
  writeFileSync('tasks/calendar-audit/phase1-results.json', JSON.stringify(report, null, 2) + '\n')
  const failures = Object.entries(results)
    .filter(([, r]) => r.failures.length)
    .map(([module, r]) => ({ module, count: r.failures.length, examples: r.failures.slice(0, 5) }))
  expect(failures).toEqual([])
}, 120000)

test('month 7/2026 begins on August 13 in Asia/Ho_Chi_Minh', () => {
  expect(solarToLunar(12, 8, 2026)).toEqual({ year: 2026, month: 6, day: 30, isLeap: false })
  expect(solarToLunar(13, 8, 2026)).toEqual({ year: 2026, month: 7, day: 1, isLeap: false })
  expect(lunarToSolar(1, 7, 2026, false)).toEqual({ year: 2026, month: 8, day: 13 })
  expect(todayInVietnam(new Date('2026-08-12T17:37:11.343Z'))).toBe('2026-08-13')
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { resolveP4Day } from './p4DayComposition'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import { splitP4YiGods } from './p4DayComposition'
import { canonP4Heading } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'
import { assembleP4YiDay, getP4LegacyYiPresence } from './p4YiDayCore'
import { assembleP4YiFullDay } from './p4YiFullDayCore'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4FullDay } from './p4FullDayComposition'
const path = 'docs/audits/sources/p4-vol10/yi-integration-v1/legacy-context-hashes.json'
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
it('preserves complete legacy output for all 720 structural contexts', () => {
  const records = [...'子丑寅卯辰巳午未申酉戌亥'].flatMap((month) =>
    Array.from({ length: 60 }, (_, i) => {
      const pillar = '甲乙丙丁戊己庚辛壬癸'[i % 10]! + '子丑寅卯辰巳午未申酉戌亥'[i % 12]!
      return {
        month,
        pillar,
        day: hash(resolveP4Day(month, pillar)),
        fullDay: hash(resolveP4FullDay(month, pillar)),
      }
    }),
  )
  expect(records).toEqual(JSON.parse(readFileSync(path, 'utf8')))
}, 120000)

// The predecessor files remain locked. Feed their historical lookup into the versioned
// cores to prove extraction separately from the intentional eleven-provider change.
const historicalYi = (month: string, pillar: string) => {
  const presence = getP4LegacyYiPresence(month, pillar)
  return Object.fromEntries(
    Object.entries(vol11.entries)
      .filter(([raw]) => raw !== '修倉庫')
      .map(([raw, entry]) => {
        const values = splitP4YiGods(entry.宜).map((han) => presence[han])
        return [
          canonP4Heading(splitHeadings(raw)[0]!),
          values.includes(true) ? true : values.includes(undefined) ? undefined : false,
        ]
      }),
  )
}
it('versioned cores reproduce the pre-change hashes when supplied historical 宜', () => {
  const frozen = JSON.parse(readFileSync(path, 'utf8')) as {
    month: string
    pillar: string
    day: string
    fullDay: string
  }[]
  for (const fixture of frozen) {
    const yi = historicalYi(fixture.month, fixture.pillar)
    expect(
      hash(assembleP4YiDay(fixture.month, fixture.pillar, yi)),
      fixture.month + fixture.pillar,
    ).toBe(fixture.day)
    expect(
      hash(assembleP4YiFullDay(fixture.month, fixture.pillar, {}, yi)),
      fixture.month + fixture.pillar,
    ).toBe(fixture.fullDay)
  }
}, 120000)

it('versioned full core preserves historical optional input and override handling', () => {
  for (const [month, pillar] of [
    ['寅', '甲辰'],
    ['未', '甲午'],
    ['未', '甲子'],
    ['申', '丙申'],
  ]) {
    const yi = historicalYi(month!, pillar!)
    for (const operands of [
      { lunarDay: 1 },
      { lunarDay: 15, phase: getP4MoonPhase('2025-01-15') },
      { lunarDay: 29, soil: getP4SoilPresence('2025-01-20') },
    ])
      expect(assembleP4YiFullDay(month!, pillar!, operands, yi)).toEqual(
        resolveP4FullDay(month!, pillar!, operands),
      )
  }
}, 120000)

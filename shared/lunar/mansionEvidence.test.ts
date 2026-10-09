import { describe, expect, it } from 'vitest'
import * as mapping from './mansionEvidence'
import { getMansion } from './mansions'
import { solarStringToJd } from './julian'

const mansion = (name: string) => {
  for (let i = 0; i < 28; i++) {
    const row = getMansion(solarStringToJd('2026-10-05') + i)
    if (row.name === name)
      return { name: row.name, shouldDo: row.shouldDo, shouldAvoid: row.shouldAvoid }
  }
  throw new Error(name)
}
describe('scoped mansion mapping', () => {
  for (const name of ['Cơ', 'Tất', 'Chẩn']) {
    it(`${name}: separates travel from boats`, () => {
      const rows = mapping.extractMansionEvidence(mansion(name))
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            activityId: 'travel',
            polarity: 'positive',
            scope: 'travel_general',
          }),
          expect.objectContaining({
            activityId: 'water_travel',
            polarity: 'negative',
            scope: 'travel_water',
          }),
        ]),
      )
      expect(rows.some((row) => row.activityId === 'travel' && row.polarity === 'negative')).toBe(
        false,
      )
      expect(rows.every((row) => row.scoreDelta === 0)).toBe(true)
    })
  }
  it('Ngưu separates road and water scopes', () => {
    expect(mapping.extractMansionEvidence(mansion('Ngưu'))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activityId: 'travel',
          scope: 'travel_road',
          polarity: 'negative',
        }),
        expect.objectContaining({ activityId: 'water_travel', polarity: 'positive' }),
      ]),
    )
  })
  it('Quỷ resolves land clearing before shorter groundbreaking words', () => {
    const rows = mapping.extractMansionEvidence(mansion('Quỷ'))
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activityId: 'demolition',
          polarity: 'positive',
          sourcePhrase: 'phát cỏ phá đất',
        }),
        expect.objectContaining({ activityId: 'groundbreaking', polarity: 'negative' }),
      ]),
    )
    expect(
      rows.some((row) => row.activityId === 'groundbreaking' && row.polarity === 'positive'),
    ).toBe(false)
  })
  it('Giác general beginnings do not become groundbreaking', () => {
    expect(
      mapping
        .extractMansionEvidence(mansion('Giác'))
        .some((row) => row.activityId === 'groundbreaking'),
    ).toBe(false)
  })
  it('Cơ grave repair retains its own scope', () => {
    expect(mapping.extractMansionEvidence(mansion('Cơ'))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activityId: 'grave_repair',
          scope: 'funeral_grave_repair',
          sourcePhrase: 'sửa mồ mả',
        }),
      ]),
    )
  })
  it('Đê keeps both general and water travel restrictions', () => {
    expect(mapping.extractMansionEvidence(mansion('Đê'))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ activityId: 'travel', polarity: 'negative' }),
        expect.objectContaining({ activityId: 'water_travel', polarity: 'negative' }),
      ]),
    )
  })
  it('Phòng preserves general notes without expanding all activities', () => {
    const rows = mapping.extractMansionEvidence(mansion('Phòng'))
    expect(rows.some((row) => row.scope === 'general_positive')).toBe(true)
    expect(rows.some((row) => row.activityId === 'cut_hair')).toBe(false)
  })
  it('Cang has no positive activity evidence', () => {
    expect(
      mapping
        .extractMansionEvidence(mansion('Cang'))
        .filter((row) => row.activityId)
        .every((row) => row.polarity === 'negative'),
    ).toBe(true)
  })
  it.each(['Chủy', 'Liễu'])('%s has general notes only until source review', (name) => {
    expect(
      mapping
        .extractMansionEvidence(mansion(name))
        .every((row) => !row.activityId && row.scoreDelta === 0),
    ).toBe(true)
  })
  it('does not convert repair into burial or a water journey into road travel', () => {
    const rows = mapping.extractMansionEvidence({
      name: 'fixture',
      shouldDo: 'Sửa mồ mả, đi đường thủy.',
      shouldAvoid: '',
    })
    expect(rows.map((row) => row.activityId)).toEqual(
      expect.arrayContaining(['grave_repair', 'water_travel']),
    )
    expect(rows.some((row) => row.activityId === 'burial' || row.activityId === 'travel')).toBe(
      false,
    )
  })
})

import golden from '../almanac-data/golden-tests-mansion-mapping.json'
import snapshot from '../almanac-data/audited-mansion-evidence.json'

describe('versioned golden fixtures', () => {
  it.each(golden.cases)('$id: scopes and polarity', (fixture) => {
    const rows = mapping.extractMansionEvidence(fixture.input)
    for (const expected of fixture.expected)
      expect(rows).toContainEqual(expect.objectContaining(expected))
    for (const forbidden of fixture.forbidden)
      expect(rows.some((row) => row.activityId === forbidden)).toBe(false)
    expect(rows.some((row) => row.status === 'conflict')).toBe(false)
    expect(
      rows.every(
        (row) => row.scoreDelta === 0 && !!row.sourcePhrase && !!row.scope && !!row.sourceRef,
      ),
    ).toBe(true)
  })
  it.each(snapshot.items)('$name: stored structured evidence matches production parser', (row) => {
    expect(mapping.extractMansionEvidence(row)).toEqual(row.evidence)
    expect(row.auditStatus).not.toBe('ready')
  })
})

it('keeps negative and no-taboo general notes truthful regardless of source field', () => {
  const rows = mapping.extractMansionEvidence({
    name: 'fixture',
    shouldDo: 'Không hợp việc gì.',
    shouldAvoid: 'Không kỵ việc gì.',
  })
  expect(rows).toContainEqual(
    expect.objectContaining({ scope: 'general_negative', polarity: 'negative', scoreDelta: 0 }),
  )
  expect(rows).toContainEqual(
    expect.objectContaining({ scope: 'general_no_taboos', polarity: 'neutral', scoreDelta: 0 }),
  )
})

import { describe, expect, it } from 'vitest'
import { assessPersonalDay } from '@shared/personalFengShui/day'
import {
  eventHourNotes,
  explainBranch,
  hourChiOf,
  summarySentence,
  trineGroup,
} from './personalExplain'

function ready(birthDate: string, viewDate: string) {
  const result = assessPersonalDay({ viewDate, birthDate, today: '2026-10-02' })
  if (result.status !== 'ready') throw new Error(result.status)
  return result
}

describe('summarySentence', () => {
  it('names the deciding factor instead of a generic sentence', () => {
    // Tuổi Canh Ngọ xem ngày Canh Tý: Ngọ xung Tý.
    expect(summarySentence(ready('1990-07-01', '2026-09-23'))).toBe(
      'Vì Địa chi xung tuổi (Ngọ xung Tý).',
    )
  })
})

describe('explainBranch', () => {
  it('explains the clash and keeps a Lưu ý verdict', () => {
    const item = explainBranch(ready('1990-07-01', '2026-09-23'))
    expect(item.verdict).toEqual({ label: 'Lưu ý', tone: 'attention' })
    expect(item.meaning).toMatch(/lục xung/)
  })

  it('names the trine group of the birth branch', () => {
    // Tuổi Canh Ngọ xem ngày Nhâm Dần: Dần Ngọ Tuất tam hợp.
    const item = explainBranch(ready('1990-07-01', '2026-09-25'))
    expect(item.reasons).toContain(
      'Tam hợp: nhóm tuổi Dần, Ngọ, Tuất hỗ trợ năng lượng tích cực lẫn nhau.',
    )
  })
})

describe('trineGroup', () => {
  it.each([
    [0, 'Thân, Tý, Thìn'],
    [9, 'Tỵ, Dậu, Sửu'],
    [6, 'Dần, Ngọ, Tuất'],
    [3, 'Hợi, Mão, Mùi'],
  ])('lists the group of chi %i from its starting branch', (chi, expected) => {
    expect(trineGroup(chi)).toBe(expected)
  })
})

describe('hourChiOf', () => {
  it.each([
    [23, 0],
    [0, 0],
    [1, 1],
    [5, 3],
    [14, 7],
    [22, 11],
  ])('maps %i:00 to chi %i', (hour, chi) => {
    expect(hourChiOf(hour)).toBe(chi)
  })
})

describe('eventHourNotes', () => {
  it('flags only timed events that fall in an excluded hour', () => {
    const r = ready('1990-07-01', '2026-09-23')
    const excluded = r.hours.find((h) => h.group === 'excluded')!
    const good = r.hours.find((h) => h.group === 'priority')!
    const at = (h: { startHour: number }) => `${String(h.startHour).padStart(2, '0')}:10`
    const notes = eventHourNotes(r, [
      { title: 'Họp tổ', allDay: false, startTime: at(excluded) },
      { title: 'Ăn trưa', allDay: false, startTime: at(good) },
      { title: 'Sinh nhật', allDay: true },
    ])
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ title: 'Họp tổ', hourName: excluded.name })
    expect(notes[0].reasons.length).toBeGreaterThan(0)
  })
})

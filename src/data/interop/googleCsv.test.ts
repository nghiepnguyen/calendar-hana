import { describe, expect, it } from 'vitest'
import { makeEvent } from '../../test/fixtures'
import { exportGoogleCsv, parseCsvRows, parseGoogleCsv } from './googleCsv'

describe('exportGoogleCsv', () => {
  it('đúng cột của Google, ngày MM/DD/YYYY, giờ AM/PM, thoát dấu phẩy và ngoặc kép', () => {
    const csv = exportGoogleCsv(
      [
        makeEvent({
          title: 'Họp "quan trọng", phòng 3',
          date: '2026-09-25',
          allDay: false,
          startTime: '13:30',
          endTime: '15:00',
          note: 'Dòng 1\nDòng 2',
        }),
        makeEvent({ title: 'Trung Thu', date: '2026-09-25', location: 'Nhà' }),
      ],
      '2026-09-25',
    )
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(
      'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location',
    )
    expect(csv).toContain(
      '"Họp ""quan trọng"", phòng 3",09/25/2026,1:30 PM,09/25/2026,3:00 PM,False,"Dòng 1\nDòng 2",',
    )
    expect(csv).toContain('Trung Thu,09/25/2026,,09/25/2026,,True,,Nhà')
  })

  it('sự kiện lặp trải ra từ 1 năm trước tới 2 năm sau', () => {
    const csv = exportGoogleCsv(
      [
        makeEvent({
          title: 'Sinh nhật',
          date: '2020-03-10',
          recurrence: { freq: 'yearly', calendar: 'solar' },
        }),
      ],
      '2026-09-25',
    )
    const years = csv.match(/03\/10\/\d{4}/g)?.filter((_, i) => i % 2 === 0)
    expect(years).toEqual(['03/10/2026', '03/10/2027', '03/10/2028'])
  })
})

describe('parseGoogleCsv', () => {
  it('đọc mẫu CSV của Google (giờ AM/PM, cả ngày, nhiều ngày, ô có xuống dòng)', () => {
    const csv = [
      '﻿Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location,Private',
      'Final exam,05/12/2026,10:00 AM,05/12/2026,1:00 PM,False,"Two essay questions,\nopen book",Room 101,True',
      'Nghỉ lễ,04/30/2026,,05/03/2026,,True,,,',
      'Không có ngày,,,,,,,,',
      'Ăn tối,2026-05-20,19:00,,,,,,',
    ].join('\r\n')
    const { events, skipped } = parseGoogleCsv(csv)
    expect(skipped).toBe(1)
    expect(events[0]).toMatchObject({
      title: 'Final exam',
      date: '2026-05-12',
      allDay: false,
      startTime: '10:00',
      endTime: '13:00',
      note: 'Two essay questions,\nopen book',
      location: 'Room 101',
      categoryId: 'other',
    })
    expect(events[1]).toMatchObject({
      title: 'Nghỉ lễ',
      allDay: true,
      recurrence: { freq: 'daily', calendar: 'solar', count: 4 },
    })
    // Không có giờ kết thúc: mặc định 1 tiếng.
    expect(events[2]).toMatchObject({ date: '2026-05-20', startTime: '19:00', endTime: '20:00' })
  })

  it('xuất rồi nhập lại ra cùng sự kiện; id cố định', () => {
    const original = makeEvent({
      title: 'Khám răng',
      date: '2026-10-02',
      allDay: false,
      startTime: '08:15',
      endTime: '09:00',
      location: 'Nha khoa, Q3',
    })
    const csv = exportGoogleCsv([original], '2026-09-25')
    const first = parseGoogleCsv(csv).events
    expect(first[0]).toMatchObject({
      title: 'Khám răng',
      date: '2026-10-02',
      startTime: '08:15',
      endTime: '09:00',
      location: 'Nha khoa, Q3',
    })
    expect(parseGoogleCsv(csv).events[0].id).toBe(first[0].id)
  })

  it('thiếu cột bắt buộc thì báo lỗi', () => {
    expect(() => parseGoogleCsv('Title,Date\nA,1/1/2026')).toThrow(/Subject/)
  })

  it('parseCsvRows xử lý ngoặc kép và CRLF', () => {
    expect(parseCsvRows('a,"b,c","d""e"\r\n1,2,3\r\n')).toEqual([
      ['a', 'b,c', 'd"e'],
      ['1', '2', '3'],
    ])
  })
})

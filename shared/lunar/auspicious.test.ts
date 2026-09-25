import { describe, expect, it } from 'vitest'
import { getAllHours, getAuspiciousHours, getBadDays, getDayGod } from './auspicious'
import { CHI } from './canChi'
import { solarStringToJd } from './julian'

describe('getAuspiciousHours', () => {
  it.each([
    [0, ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu']],
    [1, ['Dần', 'Mão', 'Tỵ', 'Thân', 'Tuất', 'Hợi']],
    [2, ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất']],
    [3, ['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu']],
    [4, ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi']],
    [5, ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']],
  ])('ngày có Chi %i có giờ hoàng đạo %j', (dayChi, names) => {
    expect(getAuspiciousHours(dayChi).map((h) => h.name)).toEqual(names)
    // Chi cách nhau 6 (Tý–Ngọ, Sửu–Mùi...) có cùng giờ hoàng đạo.
    expect(getAuspiciousHours(dayChi + 6).map((h) => h.name)).toEqual(names)
  })

  it('ghi khung giờ đúng', () => {
    const [ty] = getAuspiciousHours(0)
    expect(ty).toMatchObject({ name: 'Tý', startHour: 23, endHour: 1, label: 'Tý (23h-1h)' })
    const dau = getAuspiciousHours(0).find((h) => h.name === 'Dậu')
    expect(dau?.label).toBe('Dậu (17h-19h)')
  })
})

describe('getDayGod', () => {
  it('tháng Giêng: ngày Tý là Thanh Long (hoàng đạo), ngày Dần là Thiên Hình (hắc đạo)', () => {
    expect(getDayGod(1, 0)).toEqual({ name: 'Thanh Long', isHoangDao: true })
    expect(getDayGod(1, 2)).toEqual({ name: 'Thiên Hình', isHoangDao: false })
  })

  it('tháng 2: Thanh Long khởi ở ngày Dần', () => {
    expect(getDayGod(2, 2).name).toBe('Thanh Long')
    expect(getDayGod(8, 2).name).toBe('Thanh Long')
  })

  it('mỗi tháng có 6 Chi hoàng đạo và 6 Chi hắc đạo', () => {
    for (let month = 1; month <= 12; month++) {
      const good = Array.from({ length: 12 }, (_, chi) => getDayGod(month, chi)).filter(
        (g) => g.isHoangDao,
      )
      expect(good).toHaveLength(6)
    }
  })
})

describe('getBadDays', () => {
  it('nhận ra Tam Nương và Nguyệt Kỵ', () => {
    expect(getBadDays(3).map((d) => d.name)).toEqual(['Tam Nương'])
    expect(getBadDays(5).map((d) => d.name)).toEqual(['Nguyệt Kỵ'])
    expect(getBadDays(14).map((d) => d.name)).toEqual(['Nguyệt Kỵ'])
    expect(getBadDays(1)).toEqual([])
  })
})

describe('getAllHours', () => {
  it('ngày mẫu 25/9/2026 (Nhâm Dần): đủ 12 giờ, Thanh Long ở giờ Tý', () => {
    const jd = solarStringToJd('2026-09-25')
    const hours = getAllHours(jd, 2)
    expect(hours.map((h) => h.name)).toEqual([...CHI])
    expect(hours.map((h) => h.god)).toEqual([
      'Thanh Long',
      'Minh Đường',
      'Thiên Hình',
      'Chu Tước',
      'Kim Quỹ',
      'Kim Đường',
      'Bạch Hổ',
      'Ngọc Đường',
      'Thiên Lao',
      'Huyền Vũ',
      'Tư Mệnh',
      'Câu Trận',
    ])
    // Ngày Nhâm: giờ Tý là Canh Tý.
    expect(hours[0].canChi.name).toBe('Canh Tý')
    expect(hours[11].canChi.name).toBe('Tân Hợi')
  })

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])(
    'ngày có Chi %i: 6 giờ tốt trùng với getAuspiciousHours',
    (dayChi) => {
      const good = getAllHours(2461309, dayChi).filter((h) => h.isGood)
      expect(good).toHaveLength(6)
      expect(good.map((h) => h.name)).toEqual(getAuspiciousHours(dayChi).map((h) => h.name))
    },
  )
})

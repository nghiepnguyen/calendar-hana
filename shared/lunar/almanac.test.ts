import { describe, expect, it, vi } from 'vitest'
import type { SolarDateString } from '../types'
import { getAlmanac } from './almanac'
import { ALMANAC_FIXTURES } from './almanac.fixtures'
import { addDays } from './julian'

// Captured before the 14 legacy gods moved to Month Jian (legacyGodsMonthJian, legacyGodsMonthJian.test.ts).
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const { default: current } = await importOriginal<{
    default: typeof import('../almanac-data/manifest.json')
  }>()
  return {
    default: {
      ...current,
      policies: {
        ...current.policies,
        xiejiVol10BalancingEnabled: false,
        legacyGodsMonthJian: false,
        // Ngọc Hạp Chánh Tông stars are not in the licham.vn fixture (satChuAuthority.test.ts).
        satChuNgocHapStars: false,
      },
    },
  }
})

// Ba sao licham.vn tính sai, không có trong fixture (xem stars.data.ts).
const SKIP = new Set(['Thiên Xá', 'Âm Thác', 'Dương Thác'])
// Source-locked identities have dedicated independent authority/migration/regression gates.
// Legacy licham.vn fixtures must not override them.
const AUTHORITY_MIGRATED = new Set([
  'Thiên Đức',
  'Thiên Đức Hợp',
  'Nguyệt Đức',
  'Nguyệt Đức Hợp',
  'Nguyệt Phá',
  'Kiếp Sát',
  'Thụ Tử',
])
const names = (stars: { name: string }[]) => stars.map((s) => s.name).filter((n) => !SKIP.has(n))
const legacyFixtureNames = (stars: readonly string[]) =>
  stars.filter((n) => !AUTHORITY_MIGRATED.has(n))
const productionLegacyNames = (stars: { name: string }[]) =>
  names(stars).filter((n) => !AUTHORITY_MIGRATED.has(n))

describe('getAlmanac', () => {
  it('ngày mẫu 25/9/2026', () => {
    const a = getAlmanac('2026-09-25')
    expect(a.solarTerm.name).toBe('Thu phân')
    expect(a.napAm.name).toBe('Kim Bạch Kim')
    expect(a.dayCanChi.name).toBe('Nhâm Dần')
    expect(a.relation.text).toBe('Can sinh Chi (Thủy sinh Mộc), là ngày cát (bảo nhật).')
    expect(a.mansion).toMatchObject({ name: 'Ngưu', element: 'Kim', isGood: false })
    expect(a.officer.name).toBe('Chấp')
    expect(a.directions).toEqual({ hyThan: 'Nam', taiThan: 'Nam', phucThan: 'Tây Bắc' })
    expect(a.dayClashes).toEqual(['Canh Thân', 'Bính Thân', 'Bính Dần'])
    expect(a.monthCanChi.name).toBe('Đinh Dậu')
    expect(a.monthClashes).toEqual(['Ất Mão', 'Quý Mão', 'Quý Tỵ', 'Quý Hợi'])
    // 酉 month 天德 = 艮: the 協紀 月表 八月 壬寅 page lists no 天德 (issue #19).
    expect(names(a.stars.good)).toEqual(['Giải Thần', 'Thanh Long Hoàng Đạo'])
    expect(names(a.stars.bad)).toEqual(['Hoàng Sa', 'Kiếp Sát'])
    expect(a.hours).toHaveLength(12)
    expect(a.hours.filter((h) => h.isGood).map((h) => h.name)).toEqual([
      'Tý',
      'Sửu',
      'Thìn',
      'Tỵ',
      'Mùi',
      'Tuất',
    ])
  })

  it.each(ALMANAC_FIXTURES)('khớp legacy almanac fixture ngày $date', (f) => {
    const a = getAlmanac(f.date as SolarDateString)
    expect(a.dayCanChi.name).toBe(f.dayCanChi)
    expect(a.mansion.name).toBe(f.mansion)
    expect(a.officer.name).toBe(f.officer)
    expect(a.dayClashes).toEqual(f.dayClashes)
    expect(productionLegacyNames(a.stars.good).sort()).toEqual(legacyFixtureNames(f.good).sort())
    expect(productionLegacyNames(a.stars.bad).sort()).toEqual(legacyFixtureNames(f.bad).sort())
  })

  it('cache: gọi lại cùng ngày trả về cùng object', () => {
    expect(getAlmanac('2026-01-15')).toBe(getAlmanac('2026-01-15'))
  })

  it('chạy được ở hai đầu khoảng hỗ trợ (1900 và 2100)', () => {
    expect(getAlmanac('1900-01-31').hours).toHaveLength(12)
    expect(getAlmanac('2100-12-31').mansion.name).toBeTruthy()
  })

  it('đủ nhanh: dưới 5ms mỗi ngày khi chưa có cache', () => {
    const start = performance.now()
    let date: SolarDateString = '2031-01-01'
    for (let i = 0; i < 365; i++) {
      getAlmanac(date)
      date = addDays(date, 1)
    }
    expect((performance.now() - start) / 365).toBeLessThan(5)
  })
})

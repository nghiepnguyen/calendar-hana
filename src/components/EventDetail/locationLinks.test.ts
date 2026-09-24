import { describe, expect, it } from 'vitest'
import { locationText, splitLocation } from './locationLinks'

describe('splitLocation', () => {
  it('chữ thường giữ nguyên', () => {
    expect(splitLocation('Nhà hàng Ngon, Q1')).toEqual([
      { type: 'text', text: 'Nhà hàng Ngon, Q1' },
    ])
  })

  it('nhận ra link Google Maps, Apple Maps, Waze', () => {
    const labels = [
      'https://maps.app.goo.gl/abc123',
      'https://www.google.com/maps/place/Ben+Thanh',
      'https://goo.gl/maps/xyz',
      'https://maps.google.com/?q=10.77,106.69',
      'https://maps.apple.com/?q=Ben+Thanh',
      'https://waze.com/ul?ll=10.77,106.69',
    ].map((url) => splitLocation(url)[0])
    expect(labels.map((p) => (p.type === 'link' ? p.label : null))).toEqual([
      'Google Maps',
      'Google Maps',
      'Google Maps',
      'Google Maps',
      'Apple Maps',
      'Waze',
    ])
  })

  it('link lẫn trong chữ, bỏ dấu câu dính cuối', () => {
    expect(splitLocation('Quán cà phê (https://maps.app.goo.gl/abc).')).toEqual([
      { type: 'text', text: 'Quán cà phê (' },
      { type: 'link', href: 'https://maps.app.goo.gl/abc', label: 'Google Maps' },
      { type: 'text', text: ').' },
    ])
  })

  it('link khác hiện tên miền, không nhận scheme lạ', () => {
    expect(splitLocation('https://www.foody.vn/ho-chi-minh/quan-a')[0]).toMatchObject({
      label: 'foody.vn',
    })
    expect(splitLocation('javascript:alert(1)')).toEqual([
      { type: 'text', text: 'javascript:alert(1)' },
    ])
  })
})

describe('locationText', () => {
  it('thay link bằng tên', () => {
    expect(locationText('Chợ Bến Thành https://maps.app.goo.gl/abc')).toBe(
      'Chợ Bến Thành Google Maps',
    )
  })
})

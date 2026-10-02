import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FENG_SHUI_RULES } from '@shared/personalFengShui/rules'
import type { Settings } from '@shared/types'
import { createDefaultSettings } from '../../data/defaultCategories'
import { BaziSection } from './BaziSection'

const settings: Settings = {
  ...createDefaultSettings(''),
  birthDate: '2024-02-04',
  birthTime: '15:30',
  birthTimePrecision: 'exact' as const,
  birthTimeUncertaintyMinutes: 0,
  birthPlace: {
    countryCode: 'VN' as const,
    subdivisionCode: 'VN-SG',
    label: 'TP. Hồ Chí Minh',
    latitude: 10.76,
    longitude: 106.66,
    coordinateSource: 'bundledGazetteer' as const,
    coordinateAccuracyKm: 10,
  },
  birthTimezoneId: 'Asia/Ho_Chi_Minh',
  birthTimezoneSource: 'bundledMapping' as const,
  birthConfirmedOffsetMinutes: null,
  birthZiPolicy: 'splitZi' as const,
}

it('shows the Day Master from the day stem and an 8-character element count', () => {
  render(<BaziSection settings={settings} />)
  const insight = screen.getByRole('region', { name: 'Nhật Nguyên và ngũ hành' })
  const elements = within(insight).getByRole('list', { name: 'Số chữ theo ngũ hành' })
  expect(
    within(elements)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toHaveLength(5)
  expect(insight).toHaveTextContent(/không phải độ vượng suy/)
})

it('hides the interpretation layer when its rule is not verified, keeping the pillars', () => {
  const rules = FENG_SHUI_RULES.map((rule) =>
    rule.id === 'interpretation.day-master'
      ? { ...rule, verificationStatus: 'pending' as const }
      : rule,
  )
  render(<BaziSection settings={settings} rules={rules} />)
  const bazi = screen.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })
  expect(bazi).toHaveTextContent('Giáp Thìn')
  expect(screen.queryByRole('region', { name: 'Nhật Nguyên và ngũ hành' })).not.toBeInTheDocument()
})

it('gates the strength score by its own rule', () => {
  const rules = FENG_SHUI_RULES.map((rule) =>
    rule.id === 'interpretation.strength-score'
      ? { ...rule, verificationStatus: 'pending' as const }
      : rule,
  )
  render(<BaziSection settings={settings} rules={rules} />)
  expect(screen.getByRole('region', { name: 'Nhật Nguyên và ngũ hành' })).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Độ vượng suy' })).not.toBeInTheDocument()
})

it('labels Ten Gods under each stem, marks the month command and lists hidden stems', () => {
  render(<BaziSection settings={settings} />)
  const bazi = screen.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })
  const pillars = within(bazi)
    .getAllByRole('listitem')
    .filter((li) => li.querySelector('p'))
  expect(pillars).toHaveLength(4)
  expect(pillars[2]).toHaveTextContent('Nhật Nguyên')
  expect(pillars[1]).toHaveTextContent('Nguyệt lệnh')
  // Một nút Tàng can chung cho cả lá số; mở ra thì Chi Thìn của trụ năm Giáp Thìn có Mậu, Ất, Quý.
  const toggle = within(bazi).getByRole('button', { name: 'Tàng can' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(within(bazi).queryByRole('list', { name: 'Tàng can của Thìn' })).not.toBeInTheDocument()
  fireEvent.click(toggle)
  expect(within(bazi).getByRole('button', { name: 'Ẩn tàng can' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  const year = within(pillars[0]).getByRole('list', { name: 'Tàng can của Thìn' })
  expect(
    within(year)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual([
    expect.stringMatching(/^Mậubản khí, /),
    expect.stringMatching(/^Ấttrung khí, /),
    expect.stringMatching(/^Quýdư khí, /),
  ])
})

it('hides Ten God and hidden-stem layers when their rules are not verified', () => {
  const rules = FENG_SHUI_RULES.map((rule) =>
    rule.id === 'interpretation.thap-than' || rule.id === 'interpretation.hidden-stems'
      ? { ...rule, verificationStatus: 'pending' as const }
      : rule,
  )
  render(<BaziSection settings={settings} rules={rules} />)
  const bazi = screen.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })
  expect(bazi).not.toHaveTextContent('Nguyệt lệnh')
  expect(within(bazi).queryByText('Tàng can')).not.toBeInTheDocument()
  expect(
    within(bazi).queryByText(/^(Chính|Thiên|Thất|Tỷ|Kiếp|Thực|Thương) /),
  ).not.toBeInTheDocument()
})

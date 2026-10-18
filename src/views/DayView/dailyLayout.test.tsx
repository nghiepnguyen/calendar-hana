import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { render } from '../../test/render'
import { createDefaultSettings } from '../../data/defaultCategories'
import { PersonalFengShuiPanel } from './PersonalFengShuiPanel'
import { DailyActivitySection } from './DailyActivitySection'
import { getAlmanac } from '@shared/lunar/almanac'
import { StarChips } from './StarChips'

// Roadmap 10: historical/frozen-config test, pinned to the pre-activation config (P4 balancing OFF).
vi.mock('@shared/almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: false } } }
})

it('keeps advanced analyses unmounted until individually requested and resets on a new day', () => {
  const settings = { ...createDefaultSettings(''), birthDate: '1990-07-01' }
  const { rerender } = render(<PersonalFengShuiPanel date="2026-09-23" settings={settings} />)
  expect(screen.queryByRole('region', { name: 'Hạn theo năm' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Luận đoán nâng cao/ }))
  expect(screen.queryByRole('region', { name: 'Hạn theo năm' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Hạn theo năm/ }))
  expect(screen.getByRole('region', { name: 'Hạn theo năm' })).toHaveTextContent('tuổi mụ 37')
  expect(screen.queryByRole('region', { name: 'Tứ Trụ theo giờ sinh' })).not.toBeInTheDocument()
  rerender(<PersonalFengShuiPanel date="2026-09-24" settings={settings} />)
  expect(screen.queryByRole('region', { name: 'Hạn theo năm' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Luận đoán nâng cao/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

it('puts recommendations and hours before the supporting evidence in reading order', () => {
  render(
    <PersonalFengShuiPanel
      date="2026-09-23"
      settings={{ ...createDefaultSettings(''), birthDate: '1990-07-01' }}
    />,
  )
  const order = [
    'Tóm tắt ngày cá nhân',
    'Mục tiêu và kết luận trong ngày',
    'Giờ phù hợp với bạn',
    'Vì sao có kết luận này?',
  ].map((name) => screen.getByRole('region', { name }))
  for (let index = 1; index < order.length; index++) {
    expect(
      order[index - 1].compareDocumentPosition(order[index]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  }
})

it('filters activity groups and drills into one activity without retaining the overview', () => {
  render(<DailyActivitySection date="2026-10-05" />)
  fireEvent.change(screen.getByRole('combobox', { name: 'Nhóm mục tiêu' }), {
    target: { value: 'relationship' },
  })
  const rows = getAlmanac('2026-10-05').activityRecommendations.filter(
    (row) => row.group === 'relationship',
  )
  const candidate = rows.find((row) => row.status !== 'neutral' && row.status !== 'no_evidence')!
  if (['watch', 'consider'].includes(candidate.status))
    fireEvent.click(screen.getByText(/^Cần cân nhắc \(/))
  fireEvent.click(screen.getByRole('button', { name: candidate.label }))
  expect(screen.getByRole('region', { name: 'Chi tiết hoạt động' })).toHaveTextContent(
    candidate.label,
  )
  expect(screen.queryByRole('region', { name: 'Việc nên làm trong ngày' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Về tổng quan' }))
  const avoid = screen.getByRole('region', { name: 'Việc không nên làm trong ngày' })
  for (const row of rows.filter((row) => ['watch', 'consider'].includes(row.status))) {
    expect(within(avoid).queryByRole('button', { name: row.label })).not.toBeInTheDocument()
  }
})

it('reveals the remaining stars on request', () => {
  const stars = Array.from({ length: 8 }, (_, index) => ({
    name: `Sao ${index}`,
    isGood: true,
    meaning: 'Nguồn',
  }))
  render(<StarChips title="Sao tốt" good stars={stars} onOpen={() => {}} />)
  expect(screen.queryByRole('button', { name: 'Sao 7' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '+3 sao khác' }))
  expect(screen.getByRole('button', { name: 'Sao 7' })).toBeInTheDocument()
})

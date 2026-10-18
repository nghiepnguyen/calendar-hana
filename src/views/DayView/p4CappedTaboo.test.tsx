import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '@shared/lunar/p4AlmanacHeadings'
import { render } from '../../test/render'
import { DailyActivitySection } from './DailyActivitySection'

// Roadmap 9b P3 (owner 2026-10-18): with balancing ON a 忌 the god cap pushes to 0 still shows as
// applying. The flag is mocked ON here; production keeps it false and flag-OFF rows carry no preCapDelta.
vi.mock('@shared/almanac-data/manifest.json', async (load) => {
  const real = ((await load()) as { default: { policies: object } }).default
  return { default: { ...real, policies: { ...real.policies, xiejiVol10BalancingEnabled: true } } }
})

const NOTE = 'kỵ vẫn áp dụng, đã đạt mức trừ tối đa'

async function openAvoided(label: string) {
  const more = screen.queryByRole('button', { name: /^Xem thêm \d+ việc$/ })
  if (more) await userEvent.click(more)
  await userEvent.click(screen.getByText(/^Hoạt động khác/))
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }))
}

describe('a capped 忌 stays visible (roadmap 9b P3)', () => {
  it.each([
    // Nguyệt Hại + Ngũ Ly fill the −30 god cap; 百忌酉 decides the heading and is pushed to 0.
    ['2025-10-19', 'Gặp gỡ / Hội họp', 'Ngày Dậu (Bách Kỵ)'],
    // Nguyệt Hại + Đại Thời fill the cap; 土王用事 is pushed to 0.
    ['2025-01-25', 'Sửa kho', 'Thổ Vương Dụng Sự'],
  ])('%s %s: activity detail marks %s', async (date, activity, god) => {
    render(<DailyActivitySection date={date} />)
    await openAvoided(activity)
    const detail = screen.getByRole('region', { name: 'Chi tiết hoạt động' })
    expect(within(detail).getByText(`${god} (${NOTE})`)).toBeInTheDocument()
  })

  it('2025-02-20 wedding event lists the capped Bát Chuyên as unfavorable', async () => {
    render(<DailyActivitySection date="2025-02-20" />)
    await userEvent.click(screen.getByRole('button', { name: /^Cưới hỏi/ }))
    const unfavorable = screen.getByRole('region', { name: 'Yếu tố bất lợi' })
    const chip = within(unfavorable).getByText('Bát Chuyên').closest('li')!
    expect(chip).toHaveTextContent(NOTE)
  })
})

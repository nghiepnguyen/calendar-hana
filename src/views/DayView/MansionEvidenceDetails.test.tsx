import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { getMansionContent, getMansionContentEvidence } from '@shared/lunar/mansionContentAuthority'
import { MansionEvidenceDetails } from './MansionEvidenceDetails'
import { DailyActivitySection } from './DailyActivitySection'

const rows = getMansionContentEvidence(getMansionContent(22))
describe('mansion evidence explainability', () => {
  it('starts collapsed and preserves source, quote, mapping review and applicability', () => {
    render(
      <MansionEvidenceDetails
        evidence={rows.filter((r) => r.activityId === 'wedding')}
        unmapped={rows.filter((r) => !r.activityId)}
        mansionIndex={22}
      />,
    )
    const summary = screen.getByText('Thông tin Tú (tham khảo)')
    expect(summary.closest('details')).not.toHaveAttribute('open')
    fireEvent.click(summary)
    expect(summary.closest('details')).toHaveAttribute('open')
    expect(screen.getByText('嫁娶夫妻不久長')).toBeInTheDocument()
    expect(screen.getAllByText(/đã rà soát cách hiểu; vẫn chỉ tham khảo\./)).toHaveLength(2)
    expect(screen.queryByText(/chưa được thẩm định/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Điều kiện Tú của ngày: khớp.').length).toBeGreaterThan(0)
    expect(screen.getByText('Việc khác trong nguồn chưa có mục tương ứng')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có mục hoạt động tương ứng.')).toHaveLength(1)
    expect(screen.getByText(/修土築牆: đắp đất làm tường/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Bản scan nguồn' })[0]).toHaveAttribute(
      'href',
      rows.find((r) => r.activityId === 'wedding')!.sourceRef,
    )
    expect(
      screen.getByText('Chỉ tham khảo; không tính vào điểm hoặc kết luận chọn ngày.'),
    ).toBeInTheDocument()
  })
  it('shows the full-verse reading for a settled clause without inferring a narrower activity', () => {
    const settled = getMansionContentEvidence(getMansionContent(20)).find(
      (r) => r.activityMapping?.clauseId === '參-5',
    )!
    render(<MansionEvidenceDetails evidence={[settled]} mansionIndex={20} />)
    fireEvent.click(screen.getByText('Thông tin Tú (tham khảo)'))
    expect(screen.getByText(/không suy ra riêng cho nạp thái/)).toBeInTheDocument()
    expect(screen.queryByText(/chưa được thẩm định/)).not.toBeInTheDocument()
  })
  it('shows opposite source excerpts without choosing a winner and preserves exceptions', () => {
    const base = rows.find((r) => r.activityId === 'wedding')!
    const opposing = {
      ...base,
      ruleId: 'synthetic-opposition',
      sourceQuote: 'Opposing excerpt',
      polarity: 'positive' as const,
    }
    render(<MansionEvidenceDetails evidence={[base, opposing]} mansionIndex={22} />)
    fireEvent.click(screen.getByText('Thông tin Tú (tham khảo)'))
    expect(screen.getByText('Cùng bản nguồn có nội dung trái chiều.')).toBeInTheDocument()
    expect(screen.getByText('Opposing excerpt')).toBeInTheDocument()
  })
  it('does not turn missing evidence or an unresolved exception into permission', () => {
    const base = rows.find((r) => r.activityId === 'wedding')!
    const { rerender } = render(<MansionEvidenceDetails evidence={[]} mansionIndex={22} />)
    fireEvent.click(screen.getByText('Thông tin Tú (tham khảo)'))
    expect(
      screen.getByText(
        'Chưa có đoạn nguồn nêu rõ việc đã chọn; không suy ra nên làm hay nên kiêng.',
      ),
    ).toBeInTheDocument()
    rerender(
      <MansionEvidenceDetails
        evidence={[{ ...base, exceptions: ['Điều kiện ngoại lệ riêng'] }]}
        mansionIndex={22}
      />,
    )
    expect(screen.getByText('Điều kiện ngoại lệ riêng')).toBeInTheDocument()
    expect(screen.getByText('Ngoại lệ cần đối chiếu thêm.')).toBeInTheDocument()
    expect(screen.queryByText(/Các nguồn đã thống nhất/)).not.toBeInTheDocument()
  })
  it('integrates with the event selector and retains the existing verdict', () => {
    // 2026-10-14 is Chẩn: no clause maps to opening, so its scan link comes from the unmapped
    // waterside clause (軫-1, intentional gap). Tinh's new-room clause is construction since 2026-10-20.
    render(<DailyActivitySection date="2026-10-14" />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Nhóm mục tiêu' }), {
      target: { value: 'work' },
    })
    for (const summary of screen.queryAllByText(/^(Cần cân nhắc|Hoạt động khác) \(/))
      fireEvent.click(summary)
    fireEvent.click(screen.getByRole('button', { name: 'Khai trương' }))
    const verdict = screen.getByRole('region', { name: 'Kết luận mục tiêu' }).textContent
    fireEvent.click(screen.getByText('Thông tin Tú (tham khảo)'))
    expect(screen.getByRole('region', { name: 'Kết luận mục tiêu' }).textContent).toBe(verdict)
    expect(
      within(screen.getByRole('region', { name: 'Mục tiêu và kết luận trong ngày' })).getAllByRole(
        'link',
        { name: /Bản scan nguồn/ },
      ).length,
    ).toBeGreaterThan(0)
  })
})

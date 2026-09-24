import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function Dialogs({ open }: { open: string[] }) {
  return (
    <>
      {open.map((title) => (
        <Modal key={title} title={title} onClose={() => {}}>
          {title}
        </Modal>
      ))}
    </>
  )
}

describe('Modal', () => {
  it('khoá cuộn trang khi mở và mở khoá khi đóng', () => {
    const { rerender } = render(<Dialogs open={['A']} />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Dialogs open={[]} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('nhiều hộp thoại đóng cùng lúc vẫn mở khoá cuộn', () => {
    // Như lúc chọn phạm vi sửa sự kiện lặp: chi tiết và hộp chọn phạm vi cùng đóng, form mở.
    const { rerender } = render(<Dialogs open={['Chi tiết']} />)
    rerender(<Dialogs open={['Chi tiết', 'Phạm vi']} />)
    rerender(<Dialogs open={['Form']} />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Dialogs open={[]} />)
    expect(document.body.style.overflow).toBe('')
  })
})

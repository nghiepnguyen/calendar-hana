import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Settings } from '@shared/types'
import { createDefaultSettings } from '../../data/defaultCategories'
import { TextSizeSection } from './TextSizeSection'

function setup(patch: Partial<Settings> = {}) {
  const save = vi.fn()
  const settings = { ...createDefaultSettings(''), ...patch }
  render(<TextSizeSection settings={settings} save={save} />)
  return { save }
}

describe('TextSizeSection', () => {
  it('có 3 mức, mức đang chọn được đánh dấu', () => {
    setup({ textSize: 'large' })
    const group = screen.getByRole('radiogroup', { name: 'Cỡ chữ' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'AMặc định',
      'ALớn',
      'ARất lớn',
    ])
    expect(screen.getByRole('radio', { name: 'Lớn' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Lớn' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Mặc định' })).toHaveAttribute('tabindex', '-1')
  })

  it('bấm chọn mức thì lưu ngay', async () => {
    const { save } = setup()
    await userEvent.click(screen.getByRole('radio', { name: 'Rất lớn' }))
    expect(save).toHaveBeenCalledWith({ textSize: 'xlarge' })
  })

  it('phím mũi tên và Home/End chuyển mức', async () => {
    const { save } = setup({ textSize: 'large' })
    screen.getByRole('radio', { name: 'Lớn' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(save).toHaveBeenLastCalledWith({ textSize: 'xlarge' })
    await userEvent.keyboard('{ArrowLeft}')
    expect(save).toHaveBeenLastCalledWith({ textSize: 'default' })
    await userEvent.keyboard('{End}')
    expect(save).toHaveBeenLastCalledWith({ textSize: 'xlarge' })
  })

  it('công tắc chữ đậm', async () => {
    const { save } = setup()
    await userEvent.click(screen.getByRole('switch', { name: /Chữ đậm hơn/ }))
    expect(save).toHaveBeenCalledWith({ boldText: true })
  })

  it('nút đặt lại chỉ hiện khi khác mặc định', async () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Đặt lại mặc định' })).not.toBeInTheDocument()
  })

  it('đặt lại về mặc định và tắt chữ đậm', async () => {
    const { save } = setup({ textSize: 'xlarge', boldText: true })
    await userEvent.click(screen.getByRole('button', { name: 'Đặt lại mặc định' }))
    expect(save).toHaveBeenCalledWith({ textSize: 'default', boldText: false })
  })

  it('ô xem trước chỉ để nhìn: không có nút bấm được bên trong', () => {
    const { save } = setup()
    expect(screen.getByText('Xem trước')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Giỗ ông nội/ })).not.toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })
})

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LunarDate } from '@shared/types'
import { LunarDateInput } from './LunarDateInput'

function Harness({ onChange }: { onChange: (value: LunarDate) => void }) {
  const [value, setValue] = useState<LunarDate>({ day: 12, month: 3, year: 2026, isLeap: false })
  return (
    <LunarDateInput
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe('LunarDateInput', () => {
  it('xoá rồi gõ lại năm từng chữ số', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const year = screen.getByLabelText('Năm')
    await userEvent.clear(year)
    expect(year).toHaveValue('')
    await userEvent.type(year, '20')
    // Năm dở dang vẫn nằm trên ô, chưa đổi ngày.
    expect(year).toHaveValue('20')
    expect(year).toHaveAttribute('aria-invalid', 'true')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.type(year, '30')
    expect(year).toHaveValue('2030')
    expect(onChange).toHaveBeenLastCalledWith({ day: 12, month: 3, year: 2030, isLeap: false })
    expect(screen.getByText('Canh Tuất')).toBeInTheDocument()
  })

  it('rời ô khi năm chưa hợp lệ thì trả về năm đang dùng', async () => {
    render(<Harness onChange={vi.fn()} />)
    const year = screen.getByLabelText('Năm')
    await userEvent.clear(year)
    await userEvent.type(year, '19')
    await userEvent.tab()
    expect(year).toHaveValue('2026')
    expect(year).toHaveAttribute('aria-invalid', 'false')
  })
})

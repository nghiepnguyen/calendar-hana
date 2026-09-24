import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCategories } from '../../data/defaultCategories'
import { freezeNow } from '../../test/fixtures'
import { draftFromDefaults, draftToInput, type EventDraft } from './draft'
import { EventForm } from './EventForm'

beforeEach(() => freezeNow())
afterEach(() => vi.useRealTimers())

function renderForm(onSave = vi.fn(async (_draft: EventDraft) => {}), date = '2026-04-28') {
  render(
    <EventForm
      mode="create"
      initialDraft={draftFromDefaults({ date, allDay: true })}
      categories={createDefaultCategories('')}
      allDayReminderTime="08:00"
      signedIn={false}
      onSave={onSave}
      onCancel={vi.fn()}
    />,
  )
  return onSave
}

describe('EventForm', () => {
  it('báo lỗi khi thiếu tiêu đề, không gọi lưu', async () => {
    const onSave = renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(screen.getByText('Vui lòng nhập tiêu đề.')).toBeInTheDocument()
    expect(screen.getByLabelText('Tiêu đề')).toHaveAttribute('aria-invalid', 'true')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('đang gõ năm dở dang (0001, 0019…) không làm sập form', async () => {
    const onSave = renderForm()
    const date = screen.getByLabelText('Ngày')
    // Gõ năm từng chữ số: trình duyệt báo lần lượt 0001, 0019, 0192, 1926.
    for (const value of ['0001-04-28', '0019-04-28', '0192-04-28', '']) {
      fireEvent.change(date, { target: { value } })
      expect(screen.getByRole('dialog', { name: 'Tạo sự kiện' })).toBeInTheDocument()
      expect(screen.queryByText(/^Tức ngày/)).not.toBeInTheDocument()
    }
    fireEvent.change(date, { target: { value: '1926-04-28' } })
    expect(screen.getByText(/^Tức ngày/)).toBeInTheDocument()

    // Lưu khi năm ngoài 1900–2100 thì báo lỗi ngày, không lưu.
    fireEvent.change(date, { target: { value: '0019-04-28' } })
    await userEvent.type(screen.getByLabelText('Tiêu đề'), 'Họp')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(date).toHaveAttribute('aria-invalid', 'true')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('chọn danh mục Giỗ/Lễ thì tự lặp hằng năm', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('radio', { name: 'Âm lịch' }))
    await userEvent.selectOptions(screen.getByLabelText('Danh mục'), 'Giỗ/Lễ')
    expect(screen.getByLabelText('Kiểu lặp')).toHaveDisplayValue('Hằng năm (âm lịch)')
    expect(screen.getByText('Lặp hằng năm vào ngày 12/3 âm lịch')).toBeInTheDocument()
  })

  it('đổi Dương ↔ Âm luôn hiện ngày quy đổi', async () => {
    renderForm()
    expect(screen.getByText('Tức ngày 12/3 âm lịch')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Âm lịch' }))
    expect(screen.getByText('Tức Thứ Ba, 28/4/2026 dương lịch')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Ngày'), '15')
    expect(screen.getByText('Tức Thứ Sáu, 1/5/2026 dương lịch')).toBeInTheDocument()
  })

  it('tạo giỗ âm lịch lặp hằng năm có nhắc hẹn', async () => {
    const onSave = renderForm()
    await userEvent.type(screen.getByLabelText('Tiêu đề'), 'Giỗ ông nội')
    await userEvent.click(screen.getByRole('radio', { name: 'Âm lịch' }))
    await userEvent.selectOptions(screen.getByLabelText('Danh mục'), 'Giỗ/Lễ')
    await userEvent.selectOptions(screen.getByLabelText('Kiểu lặp'), 'Hằng năm (âm lịch)')
    expect(screen.getByText('Lặp hằng năm vào ngày 12/3 âm lịch')).toBeInTheDocument()
    // Sự kiện mới có sẵn một nhắc hẹn thông báo, chỉ cần đổi thời điểm.
    await userEvent.selectOptions(screen.getByLabelText('Thời điểm nhắc 1'), 'Trước 1 ngày (8:00)')
    // Chưa đăng nhập thì không chọn được email.
    expect(screen.getByRole('option', { name: 'Email (cần đăng nhập)' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(draftToInput(onSave.mock.calls[0][0])).toEqual({
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      allDay: true,
      categoryId: 'memorial',
      recurrence: { freq: 'yearly', calendar: 'lunar' },
      reminders: [{ offsetMinutes: 1440, channel: 'notification' }],
    })
  })

  it('báo lỗi giờ kết thúc trước giờ bắt đầu', async () => {
    const onSave = renderForm()
    await userEvent.type(screen.getByLabelText('Tiêu đề'), 'Họp')
    await userEvent.click(screen.getByLabelText('Cả ngày'))
    const end = screen.getByLabelText('Kết thúc')
    await userEvent.clear(end)
    await userEvent.type(end, '08:00')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(screen.getByText('Giờ kết thúc phải sau giờ bắt đầu.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('lặp hằng tuần chọn được nhiều thứ', async () => {
    const onSave = renderForm(undefined, '2026-09-21')
    await userEvent.type(screen.getByLabelText('Tiêu đề'), 'Tập gym')
    await userEvent.selectOptions(screen.getByLabelText('Kiểu lặp'), 'Hằng tuần')
    expect(screen.getByLabelText('Thứ Hai')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Thứ Năm'))
    expect(screen.getByText('Lặp hằng tuần vào Thứ Hai, Thứ Năm')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Sau'))
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(draftToInput(onSave.mock.calls[0][0]).recurrence).toEqual({
      freq: 'weekly',
      calendar: 'solar',
      byWeekday: [1, 4],
      count: 10,
    })
  })
})

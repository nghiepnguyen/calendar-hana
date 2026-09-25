import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { CalendarDatabase } from './data/db'
import { LocalRepository } from './data/localRepository'
import { RepositoryProvider } from './data/RepositoryProvider'
import { freezeNow } from './test/fixtures'

let repo: LocalRepository
let counter = 0

beforeEach(() => {
  freezeNow()
  repo = new LocalRepository(new CalendarDatabase(`app-test-${++counter}`))
})

afterEach(async () => {
  vi.useRealTimers()
  await repo.db.delete()
})

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repo}>
        <App />
      </RepositoryProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('mặc định mở xem Ngày của hôm nay', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Thứ Tư, 23/9/2026' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Ngày' })).toBeChecked()
    expect(screen.getByRole('region', { name: 'Thông tin ngày' })).toBeInTheDocument()
  })

  it('chuyển Ngày / Tuần / Tháng và đi trước / sau', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('radio', { name: 'Tuần' }))
    expect(screen.getByRole('heading', { name: '21-27/9/2026' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tuần sau' }))
    expect(screen.getByRole('heading', { name: '28/9 - 4/10/2026' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Tháng' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tháng 9/2026Tháng 7-8 âm lịch, năm Bính Ngọ',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    await userEvent.keyboard('d')
    expect(screen.getByRole('heading', { name: 'Thứ Tư, 23/9/2026' })).toBeInTheDocument()
  })

  it('trang Ngày có title và canonical riêng, trang chủ giữ canonical "/"', async () => {
    const view = renderApp('/day/2026-09-25')
    expect(await screen.findByRole('region', { name: 'Thông tin ngày' })).toBeInTheDocument()
    expect(document.title).toBe('Lịch âm ngày 25/9/2026: 15/8 âm lịch, Tết Trung Thu | Lịch Việt')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://lich.thanhnghiep.top/day/2026-09-25',
    )
    expect(document.getElementById('page-ld')).not.toBeNull()
    view.unmount()
    expect(document.getElementById('page-ld')).toBeNull()

    renderApp('/')
    expect(await screen.findByRole('region', { name: 'Thông tin ngày' })).toBeInTheDocument()
    expect(document.getElementById('page-ld')).toBeNull()
  })

  it('xem Tuần, Tháng không cho lập chỉ mục', async () => {
    renderApp('/month/2026-09-23')
    expect(await screen.findByRole('radio', { name: 'Tháng' })).toBeChecked()
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    )
  })

  it('mở đúng ngày từ URL, URL sai thì về mặc định', async () => {
    renderApp('/month/2026-02-17')
    expect(await screen.findByText('Tết Nguyên Đán')).toBeInTheDocument()
  })

  it('link từ thông báo mở chi tiết lần diễn ra', async () => {
    const event = await repo.saveEvent({
      title: 'Giỗ ông nội',
      calendarType: 'solar',
      date: '2026-09-20',
      allDay: true,
      categoryId: 'memorial',
      recurrence: { freq: 'weekly', calendar: 'solar' },
      reminders: [],
    })
    renderApp(`/day/2026-09-27?event=${event.id}&occurrence=2026-09-27`)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Giỗ ông nội')).toBeInTheDocument()
    expect(within(dialog).getByText(/27\/9\/2026/)).toBeInTheDocument()
  })

  it('hiện danh mục trong sidebar và lọc được', async () => {
    renderApp()
    const checkbox = await screen.findByRole('checkbox', { name: 'Công việc' })
    expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    await vi.waitFor(async () =>
      expect((await repo.getSettings()).hiddenCategoryIds).toEqual(['work']),
    )
  })

  it('tạo sự kiện, mở chi tiết, sửa riêng một lần và xóa', async () => {
    renderApp('/day/2026-09-21')
    // Sidebar desktop có link Danh sách sự kiện; tạo sự kiện bằng nút + ở góc.
    const sidebar = await screen.findByRole('complementary', { name: 'Menu lịch' })
    expect(within(sidebar).getByRole('link', { name: 'Danh sách sự kiện' })).toHaveAttribute(
      'href',
      '/events',
    )
    expect(within(sidebar).queryByRole('button', { name: 'Tạo sự kiện' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tạo sự kiện' }))
    const form = await screen.findByRole('dialog', { name: 'Tạo sự kiện' })
    await userEvent.type(within(form).getByLabelText('Tiêu đề'), 'Họp team')
    await userEvent.selectOptions(within(form).getByLabelText('Kiểu lặp'), 'Hằng tuần')
    await userEvent.click(within(form).getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã tạo sự kiện “Họp team”')

    // Hiện trong xem Ngày.
    const chip = await screen.findByRole('button', { name: /^Họp team, 9:00 – 10:00/ })
    await userEvent.click(chip)
    const detail = await screen.findByRole('dialog', { name: 'Họp team' })
    expect(within(detail).getByText('Lặp hằng tuần vào Thứ Hai')).toBeInTheDocument()

    // Sửa riêng lần này.
    await userEvent.click(within(detail).getByRole('button', { name: 'Sửa' }))
    const scope = await screen.findByRole('dialog', { name: 'Sửa sự kiện lặp' })
    await userEvent.click(within(scope).getByRole('button', { name: 'Sửa' }))
    const edit = await screen.findByRole('dialog', { name: 'Sửa lần này' })
    const title = within(edit).getByLabelText('Tiêu đề')
    await userEvent.clear(title)
    await userEvent.type(title, 'Họp online')
    await userEvent.click(within(edit).getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('button', { name: /^Họp online/ })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu thay đổi')

    // Tuần sau vẫn là tên cũ.
    await userEvent.click(screen.getByRole('radio', { name: 'Tuần' }))
    await userEvent.click(screen.getByRole('button', { name: 'Tuần sau' }))
    await userEvent.click(await screen.findByRole('button', { name: /^Họp team/ }))

    // Xóa tất cả.
    const detail2 = await screen.findByRole('dialog', { name: 'Họp team' })
    await userEvent.click(within(detail2).getByRole('button', { name: 'Xóa' }))
    const delScope = await screen.findByRole('dialog', { name: 'Xóa sự kiện lặp' })
    await userEvent.click(within(delScope).getByLabelText('Tất cả'))
    await userEvent.click(within(delScope).getByRole('button', { name: 'Xóa' }))
    await vi.waitFor(async () => expect(await repo.listEvents()).toEqual([]))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã xoá sự kiện')
  })

  it('tìm kiếm sự kiện và nhảy tới ngày', async () => {
    await repo.saveEvent({
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2026, isLeap: false },
      allDay: true,
      categoryId: 'memorial',
      recurrence: { freq: 'yearly', calendar: 'lunar' },
      reminders: [],
    })
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Tìm kiếm sự kiện' }))
    await userEvent.type(screen.getByLabelText('Từ khóa tìm kiếm'), 'gio ong')
    await userEvent.click(await screen.findByRole('button', { name: /Giỗ ông nội/ }))
    // Lần tới: 12/3 âm năm 2027.
    expect(
      await screen.findByRole('heading', { name: /^Chủ nhật, 18\/4\/2027/ }),
    ).toBeInTheDocument()
  })

  it('quản lý danh mục trong Cài đặt', async () => {
    const event = await repo.saveEvent({
      title: 'Đi Đà Lạt',
      calendarType: 'solar',
      date: '2026-10-01',
      allDay: true,
      categoryId: 'family',
      reminders: [],
    })
    renderApp('/settings')
    await userEvent.type(await screen.findByLabelText('Thêm danh mục'), 'Du lịch')
    await userEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(await screen.findByLabelText('Tên danh mục Du lịch')).toBeInTheDocument()

    // Không có nút xóa cho "Khác".
    expect(screen.queryByRole('button', { name: 'Xóa danh mục Khác' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Xóa danh mục Gia đình' }))
    const confirm = await screen.findByRole('dialog', { name: /Xóa danh mục/ })
    expect(within(confirm).getByText(/1 sự kiện .* chuyển sang “Khác”/)).toBeInTheDocument()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Xóa danh mục' }))
    await vi.waitFor(async () => expect((await repo.getEvent(event.id))?.categoryId).toBe('other'))
  })

  it('Cài đặt có hướng dẫn phím tắt trên máy tính', async () => {
    renderApp('/settings')
    const section = await screen.findByRole('region', { name: 'Phím tắt' })
    const create = within(section).getByText('Tạo sự kiện').closest('li')!
    expect(within(create).getByText('N').tagName).toBe('KBD')
    expect(within(section).getByText('Tìm kiếm sự kiện')).toBeInTheDocument()
  })

  it('phím ? mở hướng dẫn phím tắt', async () => {
    renderApp('/day/2026-09-23')
    await screen.findByRole('link', { name: 'Danh sách sự kiện' })
    await userEvent.keyboard('?')
    expect(await screen.findByRole('region', { name: 'Phím tắt' })).toBeInTheDocument()
  })
})

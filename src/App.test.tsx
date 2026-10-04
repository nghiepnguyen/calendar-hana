import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import App from './App'
import { track } from './analytics'
import { CalendarDatabase } from './data/db'
import { LocalRepository } from './data/localRepository'
import { RepositoryProvider } from './data/RepositoryProvider'
import { freezeNow } from './test/fixtures'

vi.mock('./analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./analytics')>()),
  track: vi.fn(),
}))

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

  it('ở mép năm 1900 / 2100 thì đứng yên, không nhảy về hôm nay', async () => {
    renderApp('/day/1900-01-01')
    expect(await screen.findByRole('heading', { name: 'Thứ Hai, 1/1/1900' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ngày trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ngày sau' })).toBeEnabled()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('heading', { name: 'Thứ Hai, 1/1/1900' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Tháng' }))
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Tháng trước' }),
    ).toBeDisabled()
  })

  it('xem Tháng 12/2100 không sang được tháng sau', async () => {
    renderApp('/month/2100-12-15')
    expect(
      within(await screen.findByRole('banner')).getByRole('button', { name: 'Tháng sau' }),
    ).toBeDisabled()
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Tháng trước' }),
    ).toBeEnabled()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tháng 12/2100')
  })

  it('đổi ngày hoặc chế độ xem thì cuộn nội dung mới về đầu', async () => {
    renderApp('/day/2026-09-23')
    await screen.findByRole('region', { name: 'Thông tin ngày' })
    const main = screen.getByRole('main')
    const scrollTo = vi.fn()
    main.scrollTo = scrollTo

    await userEvent.click(screen.getByRole('button', { name: 'Ngày sau' }))
    expect(screen.getByRole('heading', { name: 'Thứ Năm, 24/9/2026' })).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })

    scrollTo.mockClear()
    await userEvent.click(screen.getByRole('radio', { name: 'Tháng' }))
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('nút ‹ › và phím mũi tên gửi analytics nav_button', async () => {
    renderApp('/day/2026-09-23')
    await userEvent.click(await screen.findByRole('button', { name: 'Ngày sau' }))
    expect(track).toHaveBeenCalledWith('nav_button', {
      view: 'day',
      direction: 'next',
      input: 'button',
    })
    await userEvent.keyboard('{ArrowLeft}')
    expect(track).toHaveBeenCalledWith('nav_button', {
      view: 'day',
      direction: 'prev',
      input: 'keyboard',
    })
  })

  it('vuốt trái trên vùng lịch sang ngày sau', async () => {
    renderApp('/day/2026-09-23')
    await screen.findByRole('region', { name: 'Thông tin ngày' })
    const main = screen.getByRole('main')
    let time = 0
    const send = (type: string, x: number) => {
      const event = new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: 300,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
      })
      Object.defineProperty(event, 'timeStamp', { value: (time += 16) })
      main.dispatchEvent(event)
    }
    send('pointerdown', 700)
    for (const x of [650, 600, 550, 500, 450]) send('pointermove', x)
    send('pointerup', 450)
    expect(await screen.findByRole('heading', { name: 'Thứ Năm, 24/9/2026' })).toBeInTheDocument()
    expect(track).toHaveBeenCalledWith('swipe_navigate', {
      view: 'day',
      direction: 'next',
      input: 'touch',
    })
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
    await userEvent.click(await screen.findByRole('tab', { name: 'Danh mục' }))
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

  it('Cài đặt chia tab, mở đúng tab theo #hash và đổi tab bằng phím mũi tên', async () => {
    renderApp('/settings#account')
    expect(await screen.findByRole('tab', { name: 'Tài khoản' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('region', { name: 'Tài khoản' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Hiển thị' })).not.toBeInTheDocument()

    screen.getByRole('tab', { name: 'Tài khoản' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Phong thủy' })).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Tìm hiểu Phong thủy cá nhân' })).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Sao lưu' })).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Sao lưu dữ liệu' })).toBeInTheDocument()
  })

  it('mở trang giải thích Phong thủy cá nhân từ hash trong Cài đặt', async () => {
    renderApp('/settings#feng-shui-guide')
    expect(await screen.findByRole('tab', { name: 'Phong thủy' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const section = screen.getByRole('region', { name: 'Tìm hiểu Phong thủy cá nhân' })
    expect(within(section).getByText('Ngày và giờ cá nhân')).toBeInTheDocument()
    expect(within(section).getByText('Nguồn và giới hạn')).toBeInTheDocument()
  })

  it('Cỡ chữ nằm trong tab Hiển thị; link cũ #text-size mở đúng tab và cuộn tới mục', async () => {
    const original = Element.prototype.scrollIntoView
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    onTestFinished(() => {
      Element.prototype.scrollIntoView = original
    })
    renderApp('/settings#text-size')
    expect(await screen.findByRole('tab', { name: 'Hiển thị' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByRole('tab', { name: 'Cỡ chữ' })).not.toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'Hiển thị' })
    expect(within(section).getByRole('heading', { name: 'Cỡ chữ' })).toBeInTheDocument()
    expect(within(section).getByRole('radiogroup', { name: 'Cỡ chữ' })).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(scrollIntoView.mock.contexts).toContain(document.getElementById('text-size')),
    )
  })

  it('Cài đặt có hướng dẫn phím tắt trên máy tính', async () => {
    renderApp('/settings#shortcuts')
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

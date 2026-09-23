import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { CalendarDatabase } from '../../data/db'
import { LocalRepository } from '../../data/localRepository'
import { RepositoryProvider } from '../../data/RepositoryProvider'
import type { EventInput } from '../../data/repository'
import { useUiStore } from '../../store/uiStore'
import { freezeNow } from '../../test/fixtures'

let repo: LocalRepository
let counter = 0

const base = { allDay: true, reminders: [], calendarType: 'solar' as const }

async function seed() {
  const inputs: EventInput[] = [
    {
      ...base,
      title: 'Giỗ ông nội',
      calendarType: 'lunar',
      date: { day: 12, month: 3, year: 2020, isLeap: false },
      categoryId: 'family',
      recurrence: { freq: 'yearly', calendar: 'lunar' },
    },
    {
      ...base,
      title: 'Họp team',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
      date: '2026-09-21',
      categoryId: 'work',
      recurrence: { freq: 'weekly', calendar: 'solar' },
    },
    { ...base, title: 'Khám răng', date: '2026-09-25', categoryId: 'health', note: 'Nha khoa' },
  ]
  for (const input of inputs) await repo.saveEvent(input)
}

beforeEach(() => {
  freezeNow()
  sessionStorage.clear()
  useUiStore.setState({ detail: null, editor: null, sidebarOpen: false })
  repo = new LocalRepository(new CalendarDatabase(`list-test-${++counter}`))
})

afterEach(async () => {
  vi.useRealTimers()
  await repo.db.delete()
})

function renderList(path = '/events') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repo}>
        <App />
      </RepositoryProvider>
    </MemoryRouter>,
  )
}

const row = (name: RegExp) => screen.findByRole('button', { name })

describe('Trang Danh sách sự kiện', () => {
  it('nhóm theo tháng và ngày, có ngày dương và âm', async () => {
    await seed()
    renderList()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Danh sách sự kiện')
    const month = await screen.findByRole('region', { name: /^Tháng 9\/2026/ })
    expect(within(month).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Tháng 7-8 âm lịch, năm Bính Ngọ',
    )
    expect(
      within(month).getByRole('heading', { name: /Thứ Sáu, 25\/9\/2026.*15\/8 âm lịch/ }),
    ).toBeInTheDocument()
    // Hôm nay không có sự kiện vẫn có nhóm.
    expect(within(month).getByText('Không có sự kiện')).toBeInTheDocument()
    // Sự kiện lặp hằng tuần hiện từng lần.
    expect(within(month).getAllByRole('button', { name: /^Họp team/ })).toHaveLength(2)
  })

  it('bấm vào dòng mở chi tiết sự kiện', async () => {
    await seed()
    renderList()
    await userEvent.click(await row(/^Khám răng/))
    expect(await screen.findByRole('dialog', { name: 'Khám răng' })).toBeInTheDocument()
  })

  it('lọc danh mục chỉ trên trang này, không lưu vào cài đặt', async () => {
    await seed()
    const save = vi.spyOn(repo, 'saveSettings')
    renderList()
    await row(/^Khám răng/)
    await userEvent.click(await screen.findByRole('button', { name: 'Sức khỏe', pressed: true }))
    expect(screen.queryByRole('button', { name: /^Khám răng/ })).not.toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()

    for (const chip of screen.getAllByRole('button', { pressed: true })) {
      await userEvent.click(chip)
    }
    await userEvent.click(await screen.findByRole('button', { name: 'Hiện tất cả' }))
    expect(await row(/^Khám răng/)).toBeInTheDocument()
  })

  it('tìm không dấu và đếm kết quả', async () => {
    await seed()
    renderList()
    await row(/^Khám răng/)
    await userEvent.type(screen.getByLabelText('Tìm sự kiện trong danh sách'), 'nha khoa')
    expect(await screen.findByText('1 kết quả')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Họp team/ })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Tìm sự kiện trong danh sách'))
    await userEvent.type(screen.getByLabelText('Tìm sự kiện trong danh sách'), 'khong co')
    expect(await screen.findByText('Không tìm thấy trong khoảng đã tải')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tìm xa hơn' })).toBeEnabled()
  })

  it('chọn nhiều rồi xoá, lần khác của sự kiện lặp vẫn giữ', async () => {
    await seed()
    renderList()
    await row(/^Khám răng/)
    await userEvent.click(screen.getByRole('button', { name: 'Chọn' }))
    const toolbar = screen.getByRole('toolbar', { name: 'Thao tác đã chọn' })
    expect(within(toolbar).getByRole('button', { name: 'Xoá' })).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: /^Khám răng/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Họp team, .*28 tháng 9/ }))
    expect(within(toolbar).getByText('Đã chọn 2')).toBeInTheDocument()
    await userEvent.click(within(toolbar).getByRole('button', { name: 'Xoá' }))

    const dialog = await screen.findByRole('dialog', { name: 'Xoá 2 sự kiện?' })
    expect(within(dialog).getByText(/chỉ xoá các lần đã chọn/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xoá' }))

    expect(await screen.findByText('Đã xoá 2 sự kiện')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Khám răng/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Họp team, .*28 tháng 9/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Họp team, .*21 tháng 9/ })).toBeInTheDocument()
  })

  it('Chọn tất cả chỉ chọn các dòng đang hiển thị', async () => {
    await seed()
    renderList()
    await row(/^Khám răng/)
    await userEvent.type(screen.getByLabelText('Tìm sự kiện trong danh sách'), 'kham')
    await screen.findByText('1 kết quả')
    await userEvent.click(screen.getByRole('button', { name: 'Chọn' }))
    await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }))
    expect(screen.getByText('Đã chọn 1')).toBeInTheDocument()
  })

  it('mở lại trong phiên thì dùng khoảng ngày đã lưu', async () => {
    sessionStorage.setItem(
      'event-list:position',
      JSON.stringify({ anchorDate: '2027-04-18', start: '2027-01-01', end: '2027-06-30' }),
    )
    await seed()
    renderList()
    expect(await screen.findByRole('region', { name: /^Tháng 4\/2027/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /^Tháng 9\/2026/ })).not.toBeInTheDocument()
  })

  it('chưa có sự kiện thì mời tạo sự kiện', async () => {
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Tạo sự kiện' }))
    expect(await screen.findByRole('dialog', { name: 'Tạo sự kiện' })).toBeInTheDocument()
  })

  it('vào từ Menu', async () => {
    renderList('/day/2026-09-23')
    await userEvent.click(await screen.findByRole('link', { name: 'Danh sách sự kiện' }))
    expect(await screen.findByRole('heading', { name: 'Danh sách sự kiện' })).toBeInTheDocument()
  })

  it('cuộn tới cuối thì tải thêm tháng sau', async () => {
    const observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        targets: Element[] = []
        constructor(callback: IntersectionObserverCallback) {
          observers.push({ callback, targets: this.targets })
        }
        observe(target: Element) {
          this.targets.push(target)
        }
        disconnect() {}
      },
    )
    await seed()
    renderList()
    await row(/^Khám răng/)
    // Mặc định tải tới hết 3/2027: giỗ 18/4/2027 chưa có.
    expect(screen.queryByRole('region', { name: /^Tháng 4\/2027/ })).not.toBeInTheDocument()
    await vi.waitFor(() => expect(observers.at(-1)?.targets).toHaveLength(2))
    const { callback, targets } = observers.at(-1)!
    act(() =>
      callback(
        [{ target: targets[1], isIntersecting: true } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(await screen.findByRole('region', { name: /^Tháng 4\/2027/ })).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})

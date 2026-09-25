import { lunarToSolar } from '../shared/lunar/lunar'
import { expect, openCreateForm, test } from './fixtures'
import type { Page } from '@playwright/test'

function solarPath(view: string, lunar: [number, number, number]) {
  const s = lunarToSolar(lunar[0], lunar[1], lunar[2], false)!
  const pad = (n: number) => String(n).padStart(2, '0')
  return `/${view}/${s.year}-${pad(s.month)}-${pad(s.day)}`
}

// Điện thoại: chế độ xem nằm ở thanh tab (không có Tuần), trang Danh sách về lịch bằng tab Ngày.
const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Điều hướng' })

// Xác định theo độ rộng màn hình (cùng ngưỡng COMPACT_QUERY 720px của app), không theo việc thanh tab
// đã hiện hay chưa: isVisible() không chờ, nên ngay sau goto() trên máy CI chậm có thể trả về false
// dù đang ở điện thoại.
const isCompact = (page: Page) => (page.viewportSize()?.width ?? 1280) <= 720

async function selectView(page: Page, name: 'Ngày' | 'Tuần' | 'Tháng', weekPath: string) {
  if (!isCompact(page)) return page.getByRole('radio', { name }).click()
  if (name === 'Tuần') return page.goto(weekPath)
  return tabBar(page).getByRole('button', { name, exact: true }).click()
}

async function expectView(page: Page, name: 'Ngày' | 'Tháng') {
  if (isCompact(page)) {
    await expect(tabBar(page).getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  } else {
    await expect(page.getByRole('radio', { name })).toBeChecked()
  }
}

async function backToCalendar(page: Page) {
  if (isCompact(page)) {
    await tabBar(page).getByRole('button', { name: 'Ngày', exact: true }).click()
  } else {
    await page.getByRole('link', { name: 'Quay lại lịch' }).click()
  }
}

async function save(page: Page) {
  const form = page.getByRole('dialog', { name: 'Tạo sự kiện' })
  await form.getByRole('button', { name: 'Lưu' }).click()
  await expect(form).toBeHidden()
}

test('US-1: mở app thấy xem Ngày của hôm nay kèm âm lịch', async ({ app }) => {
  await app.goto('/')
  await expect(app).toHaveURL(/\/day\/2026-09-23$/)
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Thứ Tư, 23/9/2026')
  await expectView(app, 'Ngày')
  const info = app.getByRole('region', { name: 'Thông tin ngày' })
  await expect(info).toContainText('Tháng 8 âm lịch')
  await expect(info).toContainText('Canh Tý')
})

test('US-2: chuyển Ngày / Tuần / Tháng, refresh giữ nguyên', async ({ app }) => {
  await app.goto('/')
  await selectView(app, 'Tuần', '/week/2026-09-23')
  await expect(app).toHaveURL(/\/week\/2026-09-23$/)
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('21-27/9/2026')
  await selectView(app, 'Tháng', '/week/2026-09-23')
  await expect(app.getByRole('heading', { level: 1 })).toContainText('Tháng 9/2026')
  await app.reload()
  await expectView(app, 'Tháng')
  await app.getByRole('banner').getByRole('button', { name: 'Tháng sau' }).click()
  await expect(app.getByRole('heading', { level: 1 })).toContainText('Tháng 10/2026')
})

test('US-3: tạo giỗ âm lịch lặp hằng năm, năm sau tự hiện đúng ngày âm', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Giỗ ông nội')
  await form.getByRole('radio', { name: 'Âm lịch' }).click()
  await expect(form.getByText('Tức Thứ Tư, 23/9/2026 dương lịch')).toBeVisible()
  const allDay = form.getByRole('switch', { name: 'Cả ngày' })
  if ((await allDay.getAttribute('aria-checked')) !== 'true') await allDay.click()
  await form.getByLabel('Danh mục').selectOption({ label: 'Giỗ/Lễ' })
  await form.getByLabel('Kiểu lặp').selectOption({ label: 'Hằng năm (âm lịch)' })
  await expect(form.getByText('Lặp hằng năm vào ngày 13/8 âm lịch')).toBeVisible()
  await save(app)
  await expect(app.getByRole('button', { name: /^Giỗ ông nội/ })).toBeVisible()

  // 13/8 âm năm 2027 rơi vào ngày dương khác.
  await app.goto(solarPath('day', [13, 8, 2027]))
  await expect(app.getByRole('button', { name: /^Giỗ ông nội/ })).toBeVisible()
})

test('US-4: tạo rằm hằng tháng âm lịch', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Cúng rằm')
  await form.getByRole('radio', { name: 'Âm lịch' }).click()
  await form.getByLabel('Ngày', { exact: true }).selectOption('15')
  const allDay = form.getByRole('switch', { name: 'Cả ngày' })
  if ((await allDay.getAttribute('aria-checked')) !== 'true') await allDay.click()
  await form.getByLabel('Kiểu lặp').selectOption({ label: 'Hằng tháng (âm lịch)' })
  await save(app)

  for (const lunar of [
    [15, 8, 2026],
    [15, 9, 2026],
    [15, 1, 2027],
  ] as [number, number, number][]) {
    await app.goto(solarPath('day', lunar))
    await expect(app.getByRole('button', { name: /^Cúng rằm/ })).toBeVisible()
  }
  await app.goto(solarPath('day', [14, 9, 2026]))
  await expect(app.getByRole('button', { name: /^Cúng rằm/ })).toHaveCount(0)
})

test('US-5: họp thứ Hai hằng tuần có giờ', async ({ app }) => {
  await app.goto('/day/2026-09-21')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Họp giao ban')
  const allDay = form.getByRole('switch', { name: 'Cả ngày' })
  if ((await allDay.getAttribute('aria-checked')) === 'true') await allDay.click()
  await form.getByLabel('Bắt đầu').fill('09:00')
  await form.getByLabel('Kết thúc').fill('10:00')
  await form.getByLabel('Kiểu lặp').selectOption({ label: 'Hằng tuần' })
  await expect(form.getByText('Lặp hằng tuần vào Thứ Hai')).toBeVisible()
  await save(app)

  await app.goto('/week/2026-10-05')
  await expect(app.getByRole('button', { name: /^Họp giao ban, 9:00 – 10:00/ })).toHaveCount(1)
  await app.goto('/day/2026-10-06')
  await expect(app.getByRole('button', { name: /^Họp giao ban/ })).toHaveCount(0)
})

test('US-6: tạo danh mục riêng và lọc theo danh mục', async ({ app }) => {
  await app.goto('/settings')
  await app.getByLabel('Thêm danh mục').fill('Du lịch')
  await app.getByRole('button', { name: 'Thêm', exact: true }).click()
  await expect(app.getByLabel('Tên danh mục Du lịch')).toBeVisible()

  await app.goto('/day/2026-09-23')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Đi Đà Lạt')
  await form.getByLabel('Danh mục').selectOption({ label: 'Du lịch' })
  await save(app)
  const chip = app.getByRole('button', { name: /^Đi Đà Lạt/ })
  await expect(chip).toBeVisible()

  // Sidebar ẩn sau nút menu trên màn hình nhỏ.
  const menu = app.getByRole('button', { name: 'Mở menu' })
  if (await menu.isVisible()) await menu.click()
  await app.getByRole('checkbox', { name: 'Du lịch' }).click()
  await expect(chip).toHaveCount(0)
  await app.getByRole('checkbox', { name: 'Du lịch' }).click()
  await expect(chip).toHaveCount(1)
})

test('US-8: dùng offline, không cần đăng nhập, dữ liệu còn sau khi tải lại', async ({
  app,
  context,
  browserName,
}) => {
  // Playwright chỉ hỗ trợ service worker trên Chromium; Safari kiểm tra thủ công (task 8.8).
  test.skip(browserName === 'webkit', 'Playwright WebKit không hỗ trợ service worker')
  await app.goto('/day/2026-09-23')
  await app.waitForFunction(() => navigator.serviceWorker.ready.then(() => true))
  await app.reload()
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible()

  await context.setOffline(true)
  await app.reload()
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Thứ Tư, 23/9/2026')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Việc lúc mất mạng')
  await save(app)
  await app.reload()
  await expect(app.getByRole('button', { name: /^Việc lúc mất mạng/ })).toBeVisible()
  await context.setOffline(false)
})

test('service worker không trả app shell cho trang đăng nhập của Firebase (/__/auth/handler)', async ({
  app,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit không hỗ trợ service worker')
  await app.goto('/day/2026-09-23')
  await app.waitForFunction(() => navigator.serviceWorker.ready.then(() => true))
  await app.reload()
  await app.waitForFunction(() => navigator.serviceWorker.controller !== null)

  const response = await app.goto('/__/auth/handler')
  expect(response?.fromServiceWorker()).toBe(false)
})

async function openEventList(page: Page) {
  // Màn hình nhỏ: tab Sự kiện ở thanh tab.
  if (isCompact(page)) {
    await tabBar(page).getByRole('button', { name: 'Sự kiện', exact: true }).click()
  } else {
    await page.getByRole('link', { name: 'Danh sách sự kiện' }).click()
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Danh sách sự kiện')
}

async function createWeeklyMeeting(page: Page) {
  await page.goto('/day/2026-09-21')
  const form = await openCreateForm(page)
  await form.getByLabel('Tiêu đề').fill('Họp giao ban')
  const allDay = form.getByRole('switch', { name: 'Cả ngày' })
  if ((await allDay.getAttribute('aria-checked')) === 'true') await allDay.click()
  await form.getByLabel('Bắt đầu').fill('09:00')
  await form.getByLabel('Kết thúc').fill('10:00')
  await form.getByLabel('Danh mục').selectOption({ label: 'Công việc' })
  await form.getByLabel('Kiểu lặp').selectOption({ label: 'Hằng tuần' })
  await save(page)
}

test('US-L1/L3/L6: danh sách có ngày dương và âm, tìm không dấu', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Giỗ ông nội')
  await form.getByRole('radio', { name: 'Âm lịch' }).click()
  await form.getByLabel('Kiểu lặp').selectOption({ label: 'Hằng năm (âm lịch)' })
  await save(app)
  await createWeeklyMeeting(app)

  await openEventList(app)
  await expect(
    app.getByRole('heading', { name: /Thứ Tư, 23\/9\/2026.*13\/8 âm lịch/ }),
  ).toBeVisible()
  await expect(app.getByRole('button', { name: /^Giỗ ông nội/ }).first()).toBeVisible()

  await app.getByLabel('Tìm sự kiện trong danh sách').fill('gio')
  await expect(app.getByText(/^\d+ kết quả$/)).toBeVisible()
  await expect(app.getByRole('button', { name: /^Họp giao ban/ })).toHaveCount(0)
})

test('US-L5/L7: lọc không đổi lịch, xoá nhiều lần của sự kiện lặp', async ({ app }) => {
  await createWeeklyMeeting(app)
  await openEventList(app)

  // Tắt danh mục trên trang Danh sách không ẩn sự kiện ở lịch.
  await app.getByRole('button', { name: 'Công việc', pressed: true }).click()
  await expect(app.getByRole('button', { name: /^Họp giao ban/ })).toHaveCount(0)
  await app.getByRole('button', { name: 'Công việc', pressed: false }).click()

  await app.getByRole('button', { name: 'Chọn', exact: true }).click()
  await app.getByRole('checkbox', { name: /^Họp giao ban, .*Thứ Hai, 28 tháng 9 / }).check()
  await app.getByRole('checkbox', { name: /^Họp giao ban, .*Thứ Hai, 5 tháng 10 / }).check()
  const toolbar = app.getByRole('toolbar', { name: 'Thao tác đã chọn' })
  await expect(toolbar.getByText('Đã chọn 2')).toBeVisible()
  await toolbar.getByRole('button', { name: 'Xoá' }).click()
  await app
    .getByRole('dialog', { name: 'Xoá 2 sự kiện?' })
    .getByRole('button', { name: 'Xoá' })
    .click()
  await expect(app.getByText('Đã xoá 2 sự kiện')).toBeVisible()

  await backToCalendar(app)
  await app.goto('/day/2026-09-28')
  await expect(app.getByRole('button', { name: /^Họp giao ban/ })).toHaveCount(0)
  await app.goto('/day/2026-10-12')
  await expect(app.getByRole('button', { name: /^Họp giao ban/ })).toHaveCount(1)
})

test('US-L2: quay lại trang Danh sách thì về đúng chỗ đang xem', async ({ app }) => {
  await createWeeklyMeeting(app)
  await openEventList(app)
  const target = app.getByRole('heading', { name: /^Thứ Hai, 1\/2\/2027/ })
  await target.scrollIntoViewIfNeeded()
  await app.waitForTimeout(500)
  // Tải thêm phía trên trong lúc cuộn không được kéo trang ngược lại.
  await expect(target).toBeInViewport()
  await backToCalendar(app)
  await expect(app).toHaveURL(/\/day\//)
  await openEventList(app)
  await expect(target).toBeInViewport()
})

test('US-A1..A8: xem Ngày có khối Lịch vạn niên, bấm sao xem giải thích, tắt được', async ({
  app,
}) => {
  await app.goto('/day/2026-09-25')
  const panel = app.getByRole('region', { name: 'Lịch vạn niên' })
  await expect(panel).toBeVisible()
  await expect(panel.getByText('Thu phân')).toBeVisible()
  await expect(panel.getByText('Kim Bạch Kim')).toBeVisible()
  await expect(panel.getByRole('button', { name: /^Sao Ngưu/ })).toBeVisible()
  await expect(panel.getByText('Nam', { exact: true })).toBeVisible()
  await expect(panel.getByRole('listitem', { name: /^Giờ / })).toHaveCount(12)

  await panel.getByRole('button', { name: 'Thiên Đức' }).click()
  const dialog = app.getByRole('dialog', { name: 'Sao Thiên Đức' })
  await expect(dialog.getByText('Tốt cho mọi việc.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Đóng' }).click()
  await expect(dialog).toBeHidden()

  await app.goto('/settings')
  const toggle = app.getByRole('switch', { name: /Hiện ngày hoàng đạo và lịch vạn niên/ })
  await toggle.click()
  await expect(toggle).not.toBeChecked()
  // Đợi cài đặt ghi xong vào IndexedDB rồi mới tải lại trang.
  await app.waitForTimeout(300)
  await app.goto('/day/2026-09-25')
  await expect(app.getByRole('region', { name: 'Sự kiện trong ngày' })).toBeVisible()
  await expect(app.getByRole('region', { name: 'Lịch vạn niên' })).toHaveCount(0)
})

test('US-A: khối Lịch vạn niên đổi theo ngày khi chuyển ngày', async ({ app, isMobile }) => {
  await app.goto('/day/2026-09-25')
  const panel = app.getByRole('region', { name: 'Lịch vạn niên' })
  const title = panel.getByText(/^Ngày\s/).first()
  await expect(title).toHaveText('Ngày Nhâm Dần')
  await expect(panel.getByRole('button', { name: /^Sao Ngưu/ })).toBeVisible()

  // Nút "Ngày sau" trên thanh tiêu đề.
  await app.getByRole('button', { name: 'Ngày sau' }).click()
  await expect(app).toHaveURL(/\/day\/2026-09-26/)
  await expect(title).toHaveText('Ngày Quý Mão')
  await expect(panel.getByRole('button', { name: /^Sao Nữ/ })).toBeVisible()
  await expect(panel.getByRole('button', { name: /^Trực Phá/ })).toBeVisible()

  // Phím mũi tên trái quay về ngày trước.
  await app.keyboard.press('ArrowLeft')
  await expect(app).toHaveURL(/\/day\/2026-09-25/)
  await expect(title).toHaveText('Ngày Nhâm Dần')

  // Chọn ngày trên lịch nhỏ ở sidebar (chỉ có trên màn hình rộng).
  if (!isMobile) {
    await app
      .getByRole('button', { name: /20 tháng 9 năm 2026/ })
      .first()
      .click()
    await expect(app).toHaveURL(/\/day\/2026-09-20/)
    await expect(title).toHaveText('Ngày Đinh Dậu')
  }
})

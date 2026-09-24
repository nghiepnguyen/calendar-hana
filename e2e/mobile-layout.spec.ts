import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

// Chỉ chạy trên màn hình điện thoại (có thanh tab dưới đáy).
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width > 720, 'chỉ dành cho điện thoại')
})

const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Điều hướng' })

/** Cuộn mọi khung cuộn tới cuối. */
async function scrollToEnd(page: Page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight
    }
  })
}

for (const view of ['day', 'week', 'month']) {
  test(`xem ${view}: cuộn hết thì nội dung cuối không bị thanh tab che`, async ({ app }) => {
    await app.goto(`/${view}/2026-09-23`)
    await expect(tabBar(app)).toBeVisible()
    await scrollToEnd(app)
    const barTop = await tabBar(app).evaluate((e) => e.getBoundingClientRect().top)
    // Đo từng khối trong xem (thẻ ngày, lưới giờ…), vì khối có thể tràn ra ngoài khung xem.
    const contentBottom = await app.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll('main > * > *')].map(
          (e) => e.getBoundingClientRect().bottom,
        ),
      ),
    )
    expect(contentBottom).toBeLessThanOrEqual(barTop)
  })
}

const menuButton = (page: Page) => tabBar(page).getByRole('button', { name: 'Mở menu' })

test('thanh tab có Ngày, Tháng, Sự kiện, Menu và nút tạo; không có Tuần', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  const tabs = tabBar(app).getByRole('button')
  await expect(tabs).toHaveText(['Ngày', 'Tháng', 'Sự kiện', 'Menu', ''])
  await expect(tabBar(app).getByRole('button', { name: 'Tạo sự kiện' })).toBeVisible()
  await expect(tabBar(app).getByRole('button', { name: 'Ngày' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await tabBar(app).getByRole('button', { name: 'Tháng' }).click()
  await expect(app).toHaveURL(/\/month\/2026-09-23$/)

  await tabBar(app).getByRole('button', { name: 'Sự kiện', exact: true }).click()
  await expect(app).toHaveURL(/\/events$/)
  await expect(tabBar(app).getByRole('button', { name: 'Sự kiện', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // Menu mở được cả trên trang Sự kiện.
  await menuButton(app).click()
  await expect(
    app
      .getByRole('complementary', { name: 'Menu lịch' })
      .getByRole('heading', { name: 'Danh mục' }),
  ).toBeVisible()
  await app.getByRole('button', { name: 'Đóng menu' }).click()
  await tabBar(app).getByRole('button', { name: 'Ngày' }).click()
  await expect(app).toHaveURL(/\/day\/2026-09-23$/)
})

test('thanh tab không có nút tìm kiếm, tìm kiếm nằm trong menu', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  await expect(menuButton(app)).toBeVisible()
  await expect(tabBar(app).getByRole('button', { name: 'Tìm kiếm sự kiện' })).toHaveCount(0)

  await menuButton(app).click()
  await app
    .getByRole('complementary', { name: 'Menu lịch' })
    .getByRole('button', { name: 'Tìm kiếm sự kiện' })
    .click()
  await expect(app.getByRole('dialog', { name: 'Tìm kiếm sự kiện' })).toBeVisible()
  await expect(app.getByLabel('Từ khóa tìm kiếm')).toBeVisible()
})

test('menu không hiện bảng tháng', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  await menuButton(app).click()
  const menu = app.getByRole('complementary', { name: 'Menu lịch' })
  await expect(menu.getByRole('heading', { name: 'Danh mục' })).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Tháng trước' })).toHaveCount(0)
})

test('menu không có mục Danh sách sự kiện (đã có tab Sự kiện)', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  await menuButton(app).click()
  const menu = app.getByRole('complementary', { name: 'Menu lịch' })
  await expect(menu.getByRole('heading', { name: 'Danh mục' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Danh sách sự kiện' })).toHaveCount(0)
})

test('thông báo "dùng được offline" nằm trên thanh tab, không che tab', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  const toast = app.getByRole('status').filter({ hasText: 'khi không có mạng' })
  await expect(toast).toBeVisible({ timeout: 15_000 })
  const toastBox = (await toast.boundingBox())!
  const barBox = (await tabBar(app).boundingBox())!
  expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(barBox.y)
  await tabBar(app).getByRole('button', { name: 'Tháng' }).click()
  await expect(app).toHaveURL(/\/month\/2026-09-23$/)
})

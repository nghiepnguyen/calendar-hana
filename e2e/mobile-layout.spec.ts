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

test('thanh tab không có nút tìm kiếm, tìm kiếm nằm trong menu', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  await expect(tabBar(app).getByRole('button', { name: 'Mở menu' })).toBeVisible()
  await expect(tabBar(app).getByRole('button', { name: 'Tìm kiếm sự kiện' })).toHaveCount(0)

  await tabBar(app).getByRole('button', { name: 'Mở menu' }).click()
  await app
    .getByRole('complementary', { name: 'Menu lịch' })
    .getByRole('button', { name: 'Tìm kiếm sự kiện' })
    .click()
  await expect(app.getByRole('dialog', { name: 'Tìm kiếm sự kiện' })).toBeVisible()
  await expect(app.getByLabel('Từ khóa tìm kiếm')).toBeVisible()
})

test('menu không hiện bảng tháng', async ({ app }) => {
  await app.goto('/day/2026-09-23')
  await tabBar(app).getByRole('button', { name: 'Mở menu' }).click()
  const menu = app.getByRole('complementary', { name: 'Menu lịch' })
  await expect(menu.getByRole('heading', { name: 'Danh mục' })).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Tháng trước' })).toHaveCount(0)
})

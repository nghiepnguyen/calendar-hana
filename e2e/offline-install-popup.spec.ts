import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Isolate invitation timing from the asynchronous first-install offline-ready toast.
// Notification deferral is covered by the component tests.
test.use({ serviceWorkers: 'block' })

const invitation = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Cài Lịch Việt, mở lịch tiện hơn' })
test.beforeEach(async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem('hana:welcome-seen', '1')
    localStorage.setItem('hana:swipe-hint-seen', '1')
  })
})
test('two minute invitation persists, provides guidance and remembers closing', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  // Exact boundary is covered with fake timers in component tests. Leave loading headroom here.
  await page.clock.fastForward(110_000)
  await expect(invitation(page)).toHaveCount(0)
  await page.clock.fastForward(11_000)
  await expect(invitation(page)).toBeVisible()
  const box = await invitation(page).boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  if (page.viewportSize()!.width <= 720) {
    const bar = await page.getByRole('navigation', { name: 'Điều hướng' }).boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
  }
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('install-invitation.png'),
  })
  expect(
    (
      await new AxeBuilder({ page })
        .include('section[aria-label="Cài Lịch Việt, mở lịch tiện hơn"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await page.clock.fastForward(600_000)
  await expect(invitation(page)).toBeVisible()
  // Browsers may expose a native install event; guidance is tested when it is unavailable.
  const guide = invitation(page).getByRole('button', { name: 'Xem cách cài' })
  if (await guide.count()) {
    await guide.click()
    await expect(invitation(page).getByRole('button', { name: 'Quay lại' })).toBeInViewport()
    await invitation(page).screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('install-guide.png'),
    })
  }
  await invitation(page).getByRole('button', { name: 'Đóng lời mời cài app' }).click()
  await page.reload()
  await page.clock.fastForward(121_000)
  await expect(invitation(page)).toHaveCount(0)
})
test('defers for an event modal and closes across tabs', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tạo sự kiện' }).last().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.clock.fastForward(121_000)
  await expect(invitation(page)).toHaveCount(0)
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(invitation(page)).toBeVisible()
  const other = await context.newPage()
  await other.clock.install()
  await other.goto('/')
  await other.clock.fastForward(121_000)
  await expect(invitation(other)).toBeVisible()
  // Both simulated tabs must share the same wall clock for timestamp validation.
  const now = await other.evaluate(() => Date.now())
  await page.clock.setFixedTime(now)
  await other.clock.setFixedTime(now)
  await invitation(page).getByRole('button', { name: 'Đóng lời mời cài app' }).click()
  await expect(invitation(other)).toHaveCount(0)
})

test('fits a narrow viewport with large text and dark theme', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/settings#text-size')
  await page.getByRole('radio', { name: 'Rất lớn', exact: true }).click()
  await page.clock.fastForward(121_000)
  await expect(invitation(page)).toBeVisible()
  await invitation(page).getByRole('button', { name: 'Xem cách cài' }).click()
  const close = invitation(page).getByRole('button', { name: 'Đóng lời mời cài app' })
  await expect(close).toBeInViewport()
  expect(await invitation(page).evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('install-invitation-large-dark.png'),
  })
  expect(
    (
      await new AxeBuilder({ page })
        .include('section[aria-label="Cài Lịch Việt, mở lịch tiện hơn"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test('internal navigation keeps the original two minute deadline', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Cài đặt', exact: true })).toBeVisible()
  await page.clock.fastForward(60_000)
  await page.getByRole('link', { name: 'Quay lại lịch' }).click()
  await expect(page.getByRole('main')).toBeVisible()
  await page.clock.fastForward(61_000)
  await expect(invitation(page)).toBeVisible()
})

import { expect, NOW, swipe, test } from './fixtures'

// Vuốt ngang để đổi trang (tasks/prd-swipe-navigation.md): ngón tay trên máy cảm ứng, trackpad trên máy tính.
test.describe('vuốt ngang', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'chỉ dành cho máy cảm ứng')

  test('xem Ngày: vuốt trái sang ngày sau, vuốt phải về ngày trước', async ({ app }) => {
    await app.goto('/day/2026-09-15')
    await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()

    await swipe(app, -250)
    await expect(app).toHaveURL(/\/day\/2026-09-16$/)

    await swipe(app, 250)
    await expect(app).toHaveURL(/\/day\/2026-09-15$/)
    await swipe(app, 250)
    await expect(app).toHaveURL(/\/day\/2026-09-14$/)
  })

  test('xem Tháng và xem Tuần đi đúng một đơn vị', async ({ app }) => {
    await app.goto('/month/2026-09-15')
    await swipe(app, -250)
    await expect(app).toHaveURL(/\/month\/2026-10-15$/)

    await app.goto('/week/2026-09-15')
    await swipe(app, -250)
    await expect(app).toHaveURL(/\/week\/2026-09-22$/)
  })

  test('kéo dọc không đổi trang', async ({ app }) => {
    await app.goto('/day/2026-09-15')
    await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()
    await swipe(app, -40, { dy: -250 })
    await app.waitForTimeout(400)
    await expect(app).toHaveURL(/\/day\/2026-09-15$/)
  })

  test('sang ngày mới thì cuộn về đầu', async ({ app }) => {
    await app.goto('/day/2026-09-15')
    const main = app.getByRole('main')
    await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()
    await main.evaluate((el) => el.scrollTo({ top: 400 }))
    await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)

    await swipe(app, -250)
    await expect(app).toHaveURL(/\/day\/2026-09-16$/)
    await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBe(0)
  })

  test('ở năm 2100 không vuốt tiếp được', async ({ app }) => {
    await app.goto('/day/2100-12-31')
    await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()
    await swipe(app, -250)
    await app.waitForTimeout(400)
    await expect(app).toHaveURL(/\/day\/2100-12-31$/)
  })
})

test('trackpad: một cú vuốt 2 ngón sang đúng một trang', async ({ app }, testInfo) => {
  test.skip(!!testInfo.project.use.hasTouch, 'chỉ dành cho máy tính')
  await app.goto('/month/2026-09-15')
  await expect(app.getByRole('main')).toBeVisible()
  await app.getByRole('main').hover()
  // Cú vuốt kèm quán tính: nhiều sự kiện wheel ngang liên tiếp.
  for (const dx of [20, 40, 60, 40, 30, 20, 10, 5]) await app.mouse.wheel(dx, 0)
  await expect(app).toHaveURL(/\/month\/2026-10-15$/)
  await app.waitForTimeout(500)
  await expect(app).toHaveURL(/\/month\/2026-10-15$/)
})

test('gợi ý vuốt hiện một lần, vuốt thì ẩn', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'chỉ dành cho máy cảm ứng')
  await page.clock.setFixedTime(NOW)
  await page.addInitScript(() => localStorage.setItem('hana:welcome-seen', '1'))
  await page.goto('/day/2026-09-15')

  const hint = page.getByRole('status').filter({ hasText: 'Vuốt ngang để sang ngày khác' })
  await expect(hint).toBeVisible()
  await swipe(page, -250)
  await expect(page).toHaveURL(/\/day\/2026-09-16$/)
  await expect(hint).toBeHidden()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(hint).toBeHidden()
})

import { expect, test } from './fixtures'

test('solar term crossing time fits the calendar on all screen sizes', async ({ app }) => {
  await app.goto('/day/2026-09-07')
  const panel = app.getByRole('region', { name: 'Lịch vạn niên' })
  await expect(panel).toBeVisible()
  const time = panel.getByText(/Bắt đầu lúc 21:41 · giờ Việt Nam/)
  await time.scrollIntoViewIfNeeded()
  await expect(time).toBeVisible()
  const fits = await time.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= window.innerWidth && el.scrollWidth <= el.clientWidth
  })
  expect(fits).toBe(true)
  await app.screenshot({
    path: `test-results/solar-term-${test.info().project.name}.png`,
    fullPage: true,
  })
  await app.goto('/day/2026-09-08')
  await expect(app.getByText(/Bắt đầu lúc/)).toHaveCount(0)
})

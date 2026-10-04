import AxeBuilder from '@axe-core/playwright'
import {
  test,
  expect,
  chooseTextSize,
  openAdvancedDetails,
  openCreateForm,
  type TextSizeLabel,
} from './fixtures'
import type { Page } from '@playwright/test'

async function saveBirth(page: Page, complete = false) {
  if (!page.url().endsWith('/settings#birth-info')) await page.goto('/settings#birth-info')
  await expect(page.getByRole('tab', { name: 'Tài khoản', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByLabel('Ngày sinh', { exact: true })).toBeVisible()
  await page.getByLabel('Ngày sinh', { exact: true }).fill('1')
  await page.getByLabel('Tháng sinh', { exact: true }).fill('7')
  await page.getByLabel('Năm sinh', { exact: true }).fill('1990')
  if (complete) {
    await page.getByLabel('Giờ sinh (tùy chọn)', { exact: true }).fill('08:30')
    await page.getByLabel('Nơi sinh', { exact: true }).selectOption('hcm')
  }
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click()
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText(
    'Đã lưu thông tin ngày sinh.',
  )
  await page.goto('/day/2026-09-23')
}
test('P1: missing profile → settings anchor → saved profile → explicit role → clear', async ({
  app,
}) => {
  await app.goto('/day/2026-09-23')
  await app.getByRole('link', { name: 'Nhập ngày sinh', exact: true }).click()
  await expect(app).toHaveURL(/\/settings#birth-info$/)
  await saveBirth(app)
  const panel = app.getByRole('region', { name: 'Phong thủy cá nhân' })
  const annual = panel.getByRole('region', { name: 'Hạn theo năm' })
  const summary = await panel.getByTestId('personal-day-summary').textContent()
  const dayLabel = await app.getByRole('region', { name: 'Thông tin ngày' }).textContent()
  await openAdvancedDetails(app)
  await expect(annual).toContainText('tuổi mụ 37')
  await expect(annual).toContainText('Yếu tố vận hạn')
  await expect(panel.getByTestId('personal-day-summary')).toHaveText(summary!)
  await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toHaveText(dayLabel!)
  await app.reload()
  await app.goto('/settings#birth-info')
  await app.getByRole('button', { name: 'Xóa thông tin ngày sinh', exact: true }).click()
  await app.getByRole('button', { name: 'Lưu thông tin', exact: true }).click()
  await expect(app.getByRole('tabpanel').getByRole('status')).toContainText(
    'Đã lưu thông tin ngày sinh.',
  )
  await app.goto('/day/2026-09-23')
  await expect(panel.getByTestId('personal-day-summary')).toHaveCount(0)
  await expect(panel).not.toContainText('Tuổi mụ: 37')
  await expect(panel.getByRole('link', { name: 'Nhập ngày sinh' })).toBeVisible()
})
test('independent personal and common toggles persist across reload', async ({ app }) => {
  await saveBirth(app)
  await app.goto('/settings#general')
  await app.getByRole('switch', { name: 'Hiện ngày hoàng đạo và lịch vạn niên' }).click()
  await app.getByRole('link', { name: 'Quay lại lịch' }).click()
  await expect(app.getByRole('region', { name: 'Phong thủy cá nhân' })).toBeVisible()
  await expect(app.getByRole('region', { name: 'Lịch vạn niên' })).toHaveCount(0)
  await app.goto('/settings#general')
  await app.getByRole('switch', { name: 'Hiện phong thủy cá nhân' }).click()
  await app.getByRole('switch', { name: 'Hiện ngày hoàng đạo và lịch vạn niên' }).click()
  await app.getByRole('link', { name: 'Quay lại lịch' }).click()
  await app.reload()
  await expect(app.getByRole('region', { name: 'Phong thủy cá nhân' })).toHaveCount(0)
  await expect(app.getByRole('region', { name: 'Lịch vạn niên' })).toBeVisible()
})
for (const size of ['Mặc định', 'Lớn', 'Rất lớn'] as TextSizeLabel[])
  for (const theme of ['Sáng', 'Tối']) {
    test(`360px, ${size}, ${theme}: accessible panel with separate explanation page`, async ({
      app,
    }, testInfo) => {
      await app.setViewportSize({ width: 360, height: 800 })
      // Tắt hiệu ứng hiện dần để axe không đo độ tương phản lúc ô còn mờ.
      await app.emulateMedia({ reducedMotion: 'reduce' })
      await saveBirth(app)
      await chooseTextSize(app, size)
      await app.getByRole('radio', { name: theme, exact: true }).click()
      await app.goto('/day/2026-09-23')
      const panel = app.getByRole('region', { name: 'Phong thủy cá nhân' })
      // Chờ hồ sơ sinh nạp xong, tránh audit lúc panel còn hiện lời mời đang chạy hiệu ứng.
      await expect(panel.getByTestId('personal-day-summary')).toBeVisible()
      await openAdvancedDetails(app)
      await expect(panel.getByText('Xem đủ 12 giờ và lý do', { exact: true })).toHaveCount(0)
      expect(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      // Ô nhập cao 40px với chuột ở cỡ chữ mặc định; 44px khi cảm ứng hoặc phóng to chữ (theme.css).
      if (testInfo.project.use.hasTouch || size !== 'Mặc định')
        for (const control of await panel.locator('select').all())
          expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      const audit = await new AxeBuilder({ page: app })
        .include('[aria-label="Phong thủy cá nhân"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        audit.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
      ).toEqual([])
      await app.screenshot({ path: test.info().outputPath('annual-details.png') })
      await panel
        .getByRole('heading', { name: 'Phong thủy cá nhân', exact: true })
        .scrollIntoViewIfNeeded()
      await app.screenshot({ path: test.info().outputPath('personal-panel.png') })
      await panel.getByRole('link', { name: 'Tìm hiểu cách tính và nguồn tham khảo' }).click()
      await expect(app).toHaveURL(/\/settings#feng-shui-guide$/)
      await expect(app.getByRole('region', { name: 'Tìm hiểu Phong thủy cá nhân' })).toContainText(
        'Nguồn và giới hạn',
      )
    })
  }

test('saved profile computes day/hour and annual results offline', async ({ app }) => {
  await saveBirth(app, true)
  await app.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await app.context().setOffline(true)
  try {
    await app.getByRole('button', { name: 'Ngày trước' }).click()
    await app.getByRole('button', { name: 'Ngày trước' }).click()
    await app.getByRole('button', { name: 'Ngày trước' }).click()
    await expect(app).toHaveURL(/\/day\/2026-09-20$/)
    const panel = app.getByRole('region', { name: 'Phong thủy cá nhân' })
    await expect(panel.getByTestId('personal-day-summary')).toBeVisible()
    await openAdvancedDetails(app)
    await expect(panel.getByRole('region', { name: 'Hạn theo năm' })).toContainText('tuổi mụ 37')
    await expect(panel.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })).toContainText('TST')
    await expect(panel.getByText('Xem đủ 12 giờ và lý do', { exact: true })).toHaveCount(0)
  } finally {
    await app.context().setOffline(false)
  }
})

test('saved gender, event-hour note and advanced collapse', async ({ app }) => {
  await app.goto('/settings#birth-info')
  await app.getByLabel('Giới tính (tùy chọn)', { exact: true }).selectOption('female')
  await saveBirth(app)
  const panel = app.getByRole('region', { name: 'Phong thủy cá nhân' })
  const annual = panel.getByRole('region', { name: 'Hạn theo năm' })

  // 10:00 là giờ Tỵ, không hợp tuổi Canh Ngọ ngày Canh Tý.
  const form = await openCreateForm(app)
  await form.getByLabel('Tiêu đề').fill('Họp tổ')
  const allDay = form.getByRole('switch', { name: 'Cả ngày' })
  if ((await allDay.getAttribute('aria-checked')) === 'true') await allDay.click()
  await form.getByLabel('Bắt đầu').fill('10:00')
  await form.getByLabel('Kết thúc').fill('11:00')
  await form.getByRole('button', { name: 'Lưu' }).click()
  await expect(form).toBeHidden()
  await expect(
    panel.getByRole('list', { name: 'Sự kiện rơi vào giờ không hợp tuổi' }),
  ).toContainText('Họp tổ lúc 10:00 rơi vào giờ Tỵ')

  // Hạn theo năm nằm trong mục nâng cao, mặc định thu gọn trên mọi khổ màn hình.
  await expect(annual.getByRole('radio', { name: 'Nữ mạng' })).toBeHidden()
  await openAdvancedDetails(app)
  await expect(annual.getByRole('radio', { name: 'Nữ mạng' })).toBeVisible()
  await expect(annual.getByRole('radio', { name: 'Nữ mạng' })).toBeChecked()
})

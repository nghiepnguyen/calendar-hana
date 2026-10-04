import AxeBuilder from '@axe-core/playwright'
import { chooseTextSize, expect, openAdvancedDetails, test } from './fixtures'

test('nhập và lưu ngày sinh, giữ sau khi tải lại, xóa được', async ({ app }) => {
  await app.goto('/settings#account')
  await app.getByLabel('Ngày sinh', { exact: true }).fill('29')
  await app.getByLabel('Tháng sinh', { exact: true }).fill('2')
  await app.getByLabel('Năm sinh', { exact: true }).fill('2000')
  await app.getByLabel('Giờ sinh (tùy chọn)', { exact: true }).fill('00:15')
  await app.getByLabel('Nơi sinh', { exact: true }).selectOption('hcm')
  await app.getByLabel('Độ chắc chắn của giờ sinh').selectOption('estimated')
  await app.getByLabel('Sai số ước lượng (phút)').fill('15')
  await app.getByText('Tùy chọn nâng cao', { exact: true }).click()
  await app.getByLabel('Quy ước giờ Tý').selectOption('dayStartsAt23')
  await app.getByRole('button', { name: 'Lưu thông tin', exact: true }).click()
  await expect(app.getByRole('tabpanel').getByRole('status')).toContainText(
    'Đã lưu thông tin ngày sinh.',
  )
  await app.screenshot({ path: test.info().outputPath('account-birth-info.png'), fullPage: true })
  await app.reload()
  await expect(app.getByLabel('Năm sinh', { exact: true })).toHaveValue('2000')
  await expect(app.getByLabel('Giờ sinh (tùy chọn)', { exact: true })).toHaveValue('00:15')
  await expect(app.getByLabel('Nơi sinh', { exact: true })).toHaveValue('hcm')
  await expect(app.getByLabel('Độ chắc chắn của giờ sinh')).toHaveValue('estimated')
  await expect(app.getByLabel('Sai số ước lượng (phút)')).toHaveValue('15')
  await expect(app.getByLabel('Quy ước giờ Tý')).toHaveValue('dayStartsAt23')
  // Quy ước khác mặc định thì mục nâng cao tự mở sau khi tải lại.
  await expect(app.getByLabel('Quy ước giờ Tý')).toBeVisible()
  await app.goto('/day/2026-09-23')
  await openAdvancedDetails(app)
  await expect(app.getByRole('region', { name: 'Tứ Trụ theo giờ sinh' })).toContainText('TST')
  await app.goto('/settings#account')
  await app.getByRole('button', { name: 'Xóa thông tin ngày sinh', exact: true }).click()
  await app.getByRole('button', { name: 'Lưu thông tin', exact: true }).click()
  await expect(app.getByRole('tabpanel').getByRole('status')).toContainText(
    'Đã lưu thông tin ngày sinh.',
  )
  await app.reload()
  await expect(app.getByLabel('Năm sinh', { exact: true })).toHaveValue('')
  await expect(app.getByLabel('Nơi sinh', { exact: true })).toHaveValue('')
})

test('tab tài khoản không tràn ngang ở chữ rất lớn và đạt WCAG AA', async ({ app }) => {
  await chooseTextSize(app, 'Rất lớn', '/settings#account')
  await expect(app.getByLabel('Ngày sinh', { exact: true })).toBeVisible()
  expect(await app.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const result = await new AxeBuilder({ page: app })
    .include('[role="tabpanel"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
  ).toEqual([])
})

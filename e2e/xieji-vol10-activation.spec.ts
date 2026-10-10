import { test, expect } from './fixtures'

for (const [date, verdict] of [
  ['2025-01-21', 'Thuận lợi'],
  ['2025-03-17', 'Không thuận lợi'],
  ['2025-12-09', 'Không thuận lợi'],
] as const)
  test(`卷十 activation: wedding ${date}`, async ({ app }) => {
    await app.goto('/settings#birth-info')
    await app.getByLabel('Ngày sinh', { exact: true }).fill('1')
    await app.getByLabel('Tháng sinh', { exact: true }).fill('7')
    await app.getByLabel('Năm sinh', { exact: true }).fill('1990')
    await app.getByRole('button', { name: 'Lưu thông tin', exact: true }).click()
    await expect(app.getByRole('tabpanel').getByRole('status')).toContainText(
      'Đã lưu thông tin ngày sinh.',
    )
    await app.goto(`/day/${date}`)
    const goals = app.getByRole('region', { name: 'Mục tiêu và kết luận trong ngày' })
    await goals.getByLabel('Nhóm mục tiêu').selectOption('relationship')
    // Some dates place wedding under the collapsed consideration/other list.
    for (const details of await goals.locator('details').all()) {
      if (!(await details.getAttribute('open'))) await details.locator('summary').click()
    }
    await goals.getByRole('button', { name: /^Cưới hỏi(?:$|:)/ }).click()
    await expect(goals.getByRole('region', { name: 'Kết luận mục tiêu' })).toContainText(verdict)
    await expect(goals.getByLabel(`Đánh giá hôm nay: ${verdict}`, { exact: true })).toBeVisible()
    await app.screenshot({ path: test.info().outputPath(`vol10-${date}.png`), fullPage: true })
  })

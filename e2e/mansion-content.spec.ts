import { expect, test } from './fixtures'

test('mansion content names the edition and explains its source without scoring', async ({
  app,
}) => {
  await app.goto('/day/2026-09-28')
  const panel = app.getByRole('region', { name: 'Lịch vạn niên' })
  const mansion = panel.getByRole('button', { name: /^Sao Nguy, theo Ngọc Hạp bản 1880/ })
  await mansion.click()
  const dialog = app.getByRole('dialog', { name: 'Sao Nguy' })
  await expect(dialog.getByText('Ngọc Hạp · bản 1880', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/chưa tính vào điểm hoặc kết luận chọn ngày/)).toBeVisible()
  await expect(
    dialog.getByText('Chưa có việc được nêu rõ trong đoạn nguồn đã đối chiếu.', { exact: true }),
  ).toBeVisible()
  const source = dialog.getByRole('link', { name: 'Bản scan · trang 57' })
  await expect(source).toHaveAttribute(
    'href',
    'https://archive.org/download/20241205_20241205_0310/page/n56.jpg',
  )
  await expect(dialog.getByText(/埋葬若還逢此日/)).toBeVisible()
  const fits = await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)
  expect(fits).toBe(true)
})

test('an auspicious mansion does not advertise permission for every activity', async ({ app }) => {
  await app.goto('/day/2026-09-29')
  const mansion = app.getByRole('button', { name: /^Sao Thất, theo Ngọc Hạp bản 1880/ })
  await mansion.click()
  const dialog = app.getByRole('dialog', { name: 'Sao Thất' })
  await expect(
    dialog.getByText('Chưa có việc được nêu rõ trong đoạn nguồn đã đối chiếu.', { exact: true }),
  ).toBeVisible()
  await expect(dialog.getByText(/Mọi việc đều tốt|Không kỵ việc gì/)).toHaveCount(0)
})

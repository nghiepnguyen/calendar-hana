import { lunarToSolar } from '../shared/lunar/lunar'
import { expect, openCreateForm, test } from './fixtures'
import type { Page } from '@playwright/test'

function solarPath(view: string, lunar: [number, number, number]) {
  const s = lunarToSolar(lunar[0], lunar[1], lunar[2], false)!
  const pad = (n: number) => String(n).padStart(2, '0')
  return `/${view}/${s.year}-${pad(s.month)}-${pad(s.day)}`
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
  await expect(app.getByRole('radio', { name: 'Ngày' })).toBeChecked()
  const info = app.getByRole('region', { name: 'Thông tin ngày' })
  await expect(info).toContainText('Tháng 8 âm lịch')
  await expect(info).toContainText('Canh Tý')
})

test('US-2: chuyển Ngày / Tuần / Tháng, refresh giữ nguyên', async ({ app }) => {
  await app.goto('/')
  await app.getByRole('radio', { name: 'Tuần' }).click()
  await expect(app).toHaveURL(/\/week\/2026-09-23$/)
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('21-27/9/2026')
  await app.getByRole('radio', { name: 'Tháng' }).click()
  await expect(app.getByRole('heading', { level: 1 })).toContainText('Tháng 9/2026')
  await app.reload()
  await expect(app.getByRole('radio', { name: 'Tháng' })).toBeChecked()
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
  await expect(app.getByRole('button', { name: /^Họp giao ban, 9:00-10:00/ })).toHaveCount(1)
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
}) => {
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

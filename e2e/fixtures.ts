import { test as base, expect, type Page } from '@playwright/test'

/** "Bây giờ" cố định: 10:00 sáng Thứ Tư 23/9/2026 giờ Việt Nam. */
export const NOW = new Date('2026-09-23T03:00:00Z')

export const test = base.extend<{ app: Page }>({
  app: async ({ page }, provide) => {
    await page.clock.setFixedTime(NOW)
    // Popup chào lần đầu che trang: coi như đã chào. Test của popup dùng `page` trần.
    await page.addInitScript(() => localStorage.setItem('hana:welcome-seen', '1'))
    await provide(page)
  },
})

export { expect }

/** Mở form tạo sự kiện bằng nút +. */
export async function openCreateForm(page: Page) {
  await page.getByRole('button', { name: 'Tạo sự kiện' }).last().click()
  return page.getByRole('dialog', { name: 'Tạo sự kiện' })
}

export type TextSizeLabel = 'Mặc định' | 'Lớn' | 'Rất lớn'

/** Chọn cỡ chữ trong Cài đặt > Hiển thị > Cỡ chữ (lưu vào Settings như người dùng thật), rồi quay lại `back`. */
export async function chooseTextSize(page: Page, label: TextSizeLabel, back?: string) {
  await page.goto('/settings#text-size')
  const option = page.getByRole('radio', { name: label, exact: true })
  await option.click()
  await expect(option).toHaveAttribute('aria-checked', 'true')
  if (back) await page.goto(back)
}

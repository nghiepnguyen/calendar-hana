import { test as base, expect, type Page } from '@playwright/test'

/** "Bây giờ" cố định: 10:00 sáng Thứ Tư 23/9/2026 giờ Việt Nam. */
export const NOW = new Date('2026-09-23T03:00:00Z')

export const test = base.extend<{ app: Page }>({
  app: async ({ page }, provide) => {
    await page.clock.setFixedTime(NOW)
    await provide(page)
  },
})

export { expect }

/** Mở form tạo sự kiện bằng nút +. */
export async function openCreateForm(page: Page) {
  await page.getByRole('button', { name: 'Tạo sự kiện' }).last().click()
  return page.getByRole('dialog', { name: 'Tạo sự kiện' })
}

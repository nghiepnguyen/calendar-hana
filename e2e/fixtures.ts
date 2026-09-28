import { test as base, expect, type Page } from '@playwright/test'

/** "Bây giờ" cố định: 10:00 sáng Thứ Tư 23/9/2026 giờ Việt Nam. */
export const NOW = new Date('2026-09-23T03:00:00Z')

export const test = base.extend<{ app: Page }>({
  app: async ({ page }, provide) => {
    await page.clock.setFixedTime(NOW)
    // Popup chào lần đầu và gợi ý vuốt che trang: coi như đã thấy. Test của chúng dùng `page` trần.
    await page.addInitScript(() => {
      localStorage.setItem('hana:welcome-seen', '1')
      localStorage.setItem('hana:swipe-hint-seen', '1')
    })
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

/**
 * Vuốt ngang bằng ngón tay trên vùng lịch: gửi pointer event touch qua nhiều bước.
 * Dùng dispatchEvent thay vì CDP để chạy được cả WebKit (project iphone).
 */
export async function swipe(
  page: Page,
  dx: number,
  { dy = 0, startX }: { dy?: number; startX?: number } = {},
) {
  await page.getByRole('main').evaluate(
    (main, { dx, dy, startX }) => {
      const box = main.getBoundingClientRect()
      const x0 = startX ?? box.left + box.width / 2
      const y0 = box.top + Math.min(box.height / 2, 200)
      const target = document.elementFromPoint(x0, y0) ?? main
      const send = (type: string, x: number, y: number) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            pointerId: 7,
            pointerType: 'touch',
            isPrimary: true,
          }),
        )
      send('pointerdown', x0, y0)
      const steps = 6
      for (let i = 1; i <= steps; i++)
        send('pointermove', x0 + (dx * i) / steps, y0 + (dy * i) / steps)
      send('pointerup', x0 + dx, y0 + dy)
    },
    { dx, dy, startX },
  )
}

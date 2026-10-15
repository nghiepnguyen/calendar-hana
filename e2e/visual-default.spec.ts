import { expect, openCreateForm, test } from './fixtures'

// So ảnh ở cỡ chữ "Mặc định": phóng to chữ không được làm lệch giao diện gốc dù một pixel.
// Cập nhật ảnh chuẩn (chỉ khi cố ý đổi giao diện): npx playwright test visual-default --update-snapshots
test.beforeEach(({ browserName }, testInfo) => {
  test.skip(
    browserName !== 'chromium' || testInfo.project.name === 'iphone',
    'chỉ so ảnh trên Chromium',
  )
  // Ảnh chuẩn chụp trên macOS; Linux (CI) render font khác nên không so được.
  test.skip(process.platform !== 'darwin', 'chỉ có ảnh chuẩn cho macOS')
})

// Toast "App đã dùng được khi không có mạng" hiện vào lúc ngẫu nhiên (service worker cài xong).
// Dòng phiên bản đổi theo từng bản build.
const style = '[role="status"], [data-testid="build-version"] { display: none !important; }'

const pages = [
  { name: 'day', path: '/day/2026-09-23' },
  { name: 'week', path: '/week/2026-09-23' },
  { name: 'month', path: '/month/2026-09-23' },
  { name: 'events', path: '/events' },
  { name: 'settings', path: '/settings' },
]

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    // Tắt animation (khối Lịch vạn niên hiện lần lượt) để ảnh chụp không phụ thuộc thời điểm.
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })

    for (const { name, path } of pages) {
      test(`${name}`, async ({ app }) => {
        await app.goto(path)
        await expect(app.locator('h1').first()).toBeVisible()
        await expect(app).toHaveScreenshot(`${name}-${scheme}.png`, { style })
      })
    }

    test('form tạo sự kiện', async ({ app }) => {
      await app.goto('/day/2026-09-23')
      const form = await openCreateForm(app)
      await expect(form).toBeVisible()
      await expect(app).toHaveScreenshot(`create-form-${scheme}.png`, { style })
    })
  })
}

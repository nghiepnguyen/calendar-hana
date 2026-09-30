import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

const policies = [
  { path: '/privacy', title: 'Chính sách quyền riêng tư' },
  { path: '/terms', title: 'Điều khoản sử dụng' },
]

test.describe('Trang pháp lý công khai', () => {
  test.use({ javaScriptEnabled: false })
  for (const policy of policies) {
    test(`${policy.path} đọc được khi không có JavaScript và tài khoản`, async ({ page }) => {
      const response = await page.goto(policy.path)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1, name: policy.title })).toBeVisible()
      await expect(page).toHaveTitle(`${policy.title} | Lịch Việt`)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://lich.thanhnghiep.top${policy.path}`,
      )
      await expect(
        page.getByRole('link', { name: 'thanhnghiep.top@gmail.com', exact: true }),
      ).toHaveAttribute('href', 'mailto:thanhnghiep.top@gmail.com')
      await expect(page.getByRole('link', { name: 'Mở Lịch Việt' })).toHaveAttribute('href', '/')
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
    })
  }
  test('trang chủ có mô tả app và liên kết chính sách khi tắt JavaScript', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Lịch Việt' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Quyền riêng tư' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Điều khoản sử dụng' })).toBeVisible()
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test(`hai trang chính sách đạt WCAG AA (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    for (const policy of policies) {
      await page.goto(policy.path)
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(result.violations.map((v) => v.id)).toEqual([])
    }
    await page.screenshot({ path: test.info().outputPath('terms.png'), fullPage: true })
  })
}

test('trang chủ có liên kết và trang cài đặt đặt liên kết ở footer ngoài các tab', async ({
  app,
}) => {
  await app.goto('/')
  const links = app.getByRole('navigation', { name: 'Chính sách của Lịch Việt' })
  await expect(links.getByRole('link', { name: 'Quyền riêng tư' })).toHaveAttribute(
    'href',
    '/privacy',
  )
  await expect(links.getByRole('link', { name: 'Điều khoản sử dụng' })).toHaveAttribute(
    'href',
    '/terms',
  )
  for (const tab of ['general', 'account', 'notifications']) {
    await app.goto(`/settings#${tab}`)
    const footer = app.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Quyền riêng tư', exact: true })).toBeVisible()
    await expect(
      footer.getByRole('link', { name: 'Điều khoản sử dụng', exact: true }),
    ).toBeVisible()
    await expect(
      app.getByRole('tabpanel').getByRole('navigation', { name: 'Chính sách của Lịch Việt' }),
    ).toHaveCount(0)
  }
  await app.screenshot({ path: test.info().outputPath('settings-footer.png'), fullPage: true })
  await app
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Quyền riêng tư', exact: true })
    .click()
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Chính sách quyền riêng tư')
  await expect(
    app.getByRole('heading', { name: /Dữ liệu Google và quyền ngày sinh/ }),
  ).toBeVisible()
})

test('service worker phục vụ trang pháp lý đầy đủ khi offline', async ({
  app,
  context,
  browserName,
}) => {
  test.skip(
    test.info().config.configFile?.endsWith('playwright.dev.config.ts') === true,
    'Vite dev không đăng ký service worker',
  )
  test.skip(browserName !== 'chromium', 'Playwright chỉ hỗ trợ service worker trên Chromium')
  await app.goto('/')
  await app.waitForFunction(() => navigator.serviceWorker.ready.then(() => true))
  await app.reload()
  await app.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await context.setOffline(true)
  for (const policy of policies) {
    await app.goto(policy.path)
    await expect(app.getByRole('heading', { level: 1, name: policy.title })).toBeVisible()
  }
})

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

const policies = [
  { path: '/privacy', title: 'Chính sách quyền riêng tư' },
  { path: '/terms', title: 'Điều khoản sử dụng' },
]

for (const policy of policies) {
  test(`mở lại cài đặt sau khi đọc ${policy.path}`, async ({ app }) => {
    await app.goto('/settings')
    const dark = app.getByRole('radio', { name: 'Tối', exact: true })
    await dark.click()
    await expect(dark).toHaveAttribute('aria-checked', 'true')
    await app.evaluate(() => Reflect.set(window, '__legalNavigationSession', 'active'))
    const label = policy.path === '/privacy' ? 'Quyền riêng tư' : 'Điều khoản sử dụng'
    for (let i = 0; i < 3; i++) {
      await app.getByRole('contentinfo').getByRole('link', { name: label, exact: true }).click()
      await expect(app.getByRole('heading', { level: 1, name: policy.title })).toBeVisible()
      await expect(app).toHaveTitle(`${policy.title} | Lịch Việt`)
      expect(await app.evaluate(() => Reflect.get(window, '__legalNavigationSession'))).toBe(
        'active',
      )
      if (i === 0) {
        const result = await new AxeBuilder({ page: app })
          .include('header')
          .include('main')
          .include('footer')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        expect(result.violations.map((v) => v.id)).toEqual([])
        await app.screenshot({ path: test.info().outputPath('policy-in-app.png'), fullPage: true })
      }
      await app.getByRole('link', { name: 'Mở Lịch Việt' }).click()
      expect(await app.evaluate(() => Reflect.get(window, '__legalNavigationSession'))).toBe(
        'active',
      )
      await expect(app.getByRole('region', { name: 'Thông tin ngày' })).toBeVisible()
      const menu = app.getByRole('button', { name: 'Mở menu', exact: true })
      if (await menu.isVisible()) await menu.click()
      await app.getByRole('link', { name: 'Cài đặt', exact: true }).click()
      await expect(app.getByRole('tab', { name: 'Hiển thị' })).toBeVisible()
      await expect(dark).toHaveAttribute('aria-checked', 'true')
      await expect(app.getByText('Đang tải…', { exact: true })).toHaveCount(0)
    }
  })
}

test('chuyển giữa các chính sách và quay lại bằng lịch sử trong cùng phiên app', async ({
  app,
}) => {
  await app.goto('/settings#account')
  await expect(app.getByRole('tab', { name: 'Tài khoản' })).toBeVisible()
  await app.evaluate(() => Reflect.set(window, '__legalNavigationSession', 'active'))
  await app.getByRole('link', { name: 'Điều khoản sử dụng', exact: true }).click()
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Điều khoản sử dụng')
  await app.getByRole('link', { name: 'Chính sách quyền riêng tư', exact: true }).first().click()
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Chính sách quyền riêng tư')
  await app.goBack()
  await expect(app.getByRole('heading', { level: 1 })).toHaveText('Điều khoản sử dụng')
  await app.getByRole('link', { name: 'Chính sách quyền riêng tư', exact: true }).first().click()
  await app.getByRole('link', { name: 'Điều khoản sử dụng', exact: true }).click()
  await app.getByRole('link', { name: 'Chính sách quyền riêng tư', exact: true }).last().click()
  await expect(app).toHaveURL(/\/privacy#control$/)
  await expect(app.getByRole('heading', { name: /6\. Xem, xuất/ })).toBeInViewport()
  expect(await app.evaluate(() => Reflect.get(window, '__legalNavigationSession'))).toBe('active')
})

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
  const deferUpdate = app.getByRole('button', { name: 'Để sau', exact: true })
  if (await deferUpdate.isVisible()) await deferUpdate.click()
  const toastClose = app.getByRole('button', { name: 'Đóng', exact: true })
  if (await toastClose.isVisible()) await toastClose.click()
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

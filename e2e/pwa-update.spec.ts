import { expect, test } from './fixtures'

test('bản build đang chạy khớp /version.json: không báo bản mới', async ({ app }) => {
  await app.goto('/settings')
  const latest = await app.evaluate(async () =>
    (await fetch('/version.json', { cache: 'no-store' })).json(),
  )
  await expect(app.getByTestId('build-version')).toHaveText(`v${latest.version} · ${latest.build}`)
  await expect(app.getByText('Có phiên bản mới')).toHaveCount(0)
})

test('server có build khác: quay lại app thì nhờ service worker kiểm tra bản mới', async ({
  app,
}) => {
  await app.addInitScript(() => {
    const update = ServiceWorkerRegistration.prototype.update
    ServiceWorkerRegistration.prototype.update = function () {
      Reflect.set(window, '__swUpdates', (Reflect.get(window, '__swUpdates') ?? 0) + 1)
      return update.call(this)
    }
  })
  await app.route('**/version.json*', (route) =>
    route.fulfill({ json: { version: '0.0.0', build: 'newbuild', builtAt: '' } }),
  )
  await app.goto('/')
  await expect.poll(() => app.evaluate(() => Reflect.get(window, '__swUpdates'))).toBe(1)
  await app.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => app.evaluate(() => Reflect.get(window, '__swUpdates'))).toBe(2)
})

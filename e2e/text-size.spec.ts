import type { Page } from '@playwright/test'
import { chooseTextSize, expect, openCreateForm, test, type TextSizeLabel } from './fixtures'

const root = (page: Page) => page.locator('html')
const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Điều hướng' })

async function addEvent(page: Page, title: string, lunar = false) {
  const form = await openCreateForm(page)
  await form.getByLabel('Tiêu đề').fill(title)
  if (lunar) await form.getByRole('radio', { name: 'Âm lịch' }).click()
  await form.getByRole('button', { name: 'Lưu' }).click()
  await expect(form).toBeHidden()
}

test.describe('Cỡ chữ: user stories', () => {
  test('US-T1, US-T2: chọn Rất lớn thì chữ và icon to theo, ngay lập tức', async ({ app }) => {
    await app.goto('/day/2026-09-23')
    const fontSize = () => app.evaluate(() => getComputedStyle(document.body).fontSize)
    const fabIcon = app.getByRole('button', { name: 'Tạo sự kiện' }).last().locator('svg')
    expect(await fontSize()).toBe('15px')
    const iconBefore = (await fabIcon.boundingBox())!.width

    await chooseTextSize(app, 'Rất lớn', '/day/2026-09-23')
    await expect(root(app)).toHaveAttribute('data-text-size', 'xlarge')
    expect(await fontSize()).toBe('22.5px')
    expect((await fabIcon.boundingBox())!.width).toBeCloseTo(iconBefore * 1.5, 0)
  })

  test('US-T3: bật chữ đậm hơn', async ({ app }) => {
    await app.goto('/settings#text-size')
    const weight = () => app.evaluate(() => getComputedStyle(document.body).fontWeight)
    expect(await weight()).toBe('400')
    await app.getByRole('switch', { name: /Chữ đậm hơn/ }).click()
    await expect(root(app)).toHaveAttribute('data-bold-text', '')
    expect(await weight()).toBe('500')
  })

  test('US-T4: ô xem trước đổi theo cỡ chữ và không bấm được', async ({ app }) => {
    await app.goto('/settings#text-size')
    const preview = app.getByRole('figure')
    const chip = preview.locator('button')
    const before = (await chip.boundingBox())!.height
    await app.getByRole('radio', { name: 'Lớn', exact: true }).click()
    await expect.poll(async () => (await chip.boundingBox())!.height).toBeGreaterThan(before)
    await expect(chip).not.toBeFocused()
    await chip.click({ force: true, trial: false }).catch(() => {})
    await expect(app).toHaveURL(/\/settings#text-size$/)
  })

  test('US-T5: tải lại vẫn giữ mức đã chọn, áp dụng trước khi app chạy', async ({ app }) => {
    await chooseTextSize(app, 'Lớn')
    // Chặn toàn bộ JS của app: thuộc tính chỉ có thể đến từ script đầu index.html.
    await app.route(/\/assets\/.*\.js$/, (route) => route.abort())
    await app.goto('/day/2026-09-23')
    await expect(root(app)).toHaveAttribute('data-text-size', 'large')
    await app.unroute(/\/assets\/.*\.js$/)
    await app.reload()
    await expect(app.getByRole('radio', { name: 'Ngày' }).or(tabBar(app))).toBeVisible()
    await expect(root(app)).toHaveAttribute('data-text-size', 'large')
  })

  test('US-T6: đặt lại mặc định', async ({ app }) => {
    await chooseTextSize(app, 'Rất lớn')
    await app.getByRole('switch', { name: /Chữ đậm hơn/ }).click()
    await app.getByRole('button', { name: 'Đặt lại mặc định' }).click()
    await expect(root(app)).not.toHaveAttribute('data-text-size')
    await expect(root(app)).not.toHaveAttribute('data-bold-text')
    await expect(app.getByRole('radio', { name: 'Mặc định' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(app.getByRole('button', { name: 'Đặt lại mặc định' })).toBeHidden()
  })

  test('phím mũi tên chuyển mức', async ({ app }) => {
    await app.goto('/settings#text-size')
    await app.getByRole('radio', { name: 'Mặc định' }).focus()
    await app.keyboard.press('ArrowRight')
    await expect(app.getByRole('radio', { name: 'Lớn', exact: true })).toBeFocused()
    await expect(root(app)).toHaveAttribute('data-text-size', 'large')
  })
})

const pages = ['/day/2026-09-23', '/week/2026-09-23', '/month/2026-09-23', '/events', '/settings']

/** Nút / ô bấm nhìn thấy mà nhỏ hơn 44×44 (bỏ qua link nằm trong dòng chữ, theo WCAG 2.5.5). */
function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = []
    const selector =
      'button, select, a[href], [role=button], [role=radio], [role=switch], [role=tab], input:not([type=hidden])'
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const target = (el.tagName === 'INPUT' && el.closest('label')) || el
      const box = target.getBoundingClientRect()
      const style = getComputedStyle(el)
      if (!box.width || !box.height || style.visibility === 'hidden' || style.opacity === '0')
        continue
      if (el.closest('[data-tap-exempt], .visually-hidden, [inert]')) continue
      if (el.tagName === 'A' && style.display === 'inline') continue
      if (box.width < 43.5 || box.height < 43.5) {
        const name = el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName
        out.push(`${name.slice(0, 30)} ${Math.round(box.width)}×${Math.round(box.height)}`)
      }
    }
    return out
  })
}

for (const width of [360, 1280]) {
  test.describe(`Cỡ chữ: bố cục ở ${width}px`, () => {
    // Bỏ animation để đo kích thước cuối, không đo lúc phần tử đang phóng to dần.
    test.use({ viewport: { width, height: 800 }, reducedMotion: 'reduce' })

    for (const size of ['Mặc định', 'Lớn', 'Rất lớn'] as TextSizeLabel[]) {
      test(`${size}: không cuộn ngang${size === 'Mặc định' ? '' : ', vùng bấm ≥ 44px'}`, async ({
        app,
      }) => {
        await chooseTextSize(app, size)
        for (const path of pages) {
          await app.goto(path)
          await expect(app.locator('h1').first()).toBeVisible()
          const scroll = await app.evaluate(() => [
            document.documentElement.scrollWidth,
            innerWidth,
          ])
          expect(scroll[0], `${path} cuộn ngang`).toBeLessThanOrEqual(scroll[1])
          if (size !== 'Mặc định') expect(await smallTargets(app), path).toEqual([])
        }
        await app.goto('/day/2026-09-23')
        const form = await openCreateForm(app)
        const box = (await form.boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5)
      })
    }
  })
}

for (const width of [320, 360, 1280]) {
  test.describe(`Công tắc trong Cài đặt ở ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, reducedMotion: 'reduce' })

    for (const size of ['Mặc định', 'Lớn', 'Rất lớn'] as TextSizeLabel[]) {
      test(`${size}: công tắc luôn bên phải, cùng hàng với chữ`, async ({ app }) => {
        await chooseTextSize(app, size)
        const switches = app.getByRole('switch')
        await expect(switches).toHaveCount(4)
        for (const toggle of await switches.all()) {
          const [sw, row, text] = await toggle.evaluate((el) => {
            const label = el.closest('label')!
            const box = (e: Element) => {
              const r = e.getBoundingClientRect()
              return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
            }
            return [box(el), box(label), box(label.firstElementChild!)]
          })
          // Sát mép phải của dòng (dòng không có padding ngang).
          expect(row.right - sw.right).toBeLessThan(1)
          // Cùng hàng: công tắc nằm bên phải khối chữ, không rớt xuống dưới.
          expect(sw.left).toBeGreaterThanOrEqual(text.right)
          expect(sw.top).toBeLessThan(text.bottom)
        }
      })
    }
  })
}

test.describe('Cỡ chữ Rất lớn trên điện thoại 360px', () => {
  test.use({ viewport: { width: 360, height: 800 }, hasTouch: true })

  test('lưới Tháng chỉ hiện icon sự kiện có tên; thanh tab chỉ icon', async ({ app }) => {
    await app.goto('/day/2026-09-23')
    await expect(tabBar(app).getByRole('button', { name: 'Tháng' })).toHaveText('Tháng')

    await chooseTextSize(app, 'Rất lớn', '/day/2026-09-23')
    await addEvent(app, 'Giỗ ông nội', true)
    for (const title of ['Họp tổ', 'Đi khám', 'Sinh nhật cháu', 'Cà phê'])
      await addEvent(app, title)
    await app.goto('/month/2026-09-23')

    await expect(app.getByRole('img', { name: /^Giỗ ông nội, .*, âm lịch$/ })).toBeVisible()
    // Ô 360px / 7 ≈ 50px: 2 dấu mỗi hàng, 2 hàng; 5 sự kiện thì 3 dấu + "+2".
    await expect(app.getByRole('img', { name: /11:00-12:00/ })).toHaveCount(3)
    await expect(app.getByLabel('và 2 sự kiện khác')).toHaveText('+2')
    await expect(app.getByRole('button', { name: /^Họp tổ/ })).toHaveCount(0)

    for (const name of ['Ngày', 'Tháng', 'Sự kiện', 'Mở menu']) {
      await expect(tabBar(app).getByRole('button', { name, exact: true })).toHaveText('')
    }
    await expect(tabBar(app).getByRole('button', { name: 'Tháng' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

test.describe('Cỡ chữ Rất lớn trên máy tính 1280px', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('lưới Tháng vẫn hiện chip có chữ', async ({ app }) => {
    await chooseTextSize(app, 'Rất lớn', '/day/2026-09-23')
    await addEvent(app, 'Họp tổ')
    await app.goto('/month/2026-09-23')
    await expect(app.getByRole('button', { name: /^Họp tổ/ })).toBeVisible()
    await expect(app.getByRole('img', { name: /^Họp tổ/ })).toHaveCount(0)
  })
})

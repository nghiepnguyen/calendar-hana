import AxeBuilder from '@axe-core/playwright'
import { expect, openCreateForm, test } from './fixtures'

const pages = ['/day/2026-09-23', '/week/2026-09-23', '/month/2026-09-23', '/settings']

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })

    for (const path of pages) {
      test(`không có lỗi WCAG AA: ${path}`, async ({ app }) => {
        await app.goto(path)
        await expect(app.locator('h1').first()).toBeVisible()
        const result = await new AxeBuilder({ page: app })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        expect(
          result.violations.map(
            (v) =>
              `${v.id}: ${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 5)
                .join(' | ')}`,
          ),
        ).toEqual([])
      })
    }

    test('form tạo sự kiện', async ({ app }) => {
      await app.goto('/day/2026-09-23')
      await openCreateForm(app)
      const result = await new AxeBuilder({ page: app })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(
        result.violations.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 5)
              .join(' | ')}`,
        ),
      ).toEqual([])
    })
  })
}

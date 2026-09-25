// Plugin Vite: sau khi build, tạo sẵn HTML cho từng trang xem Ngày (dist/day/YYYY-MM-DD.html)
// với title, description, canonical, JSON-LD và nội dung tĩnh riêng của ngày đó, rồi ghi
// sitemap.xml liệt kê các trang này. Firebase Hosting (cleanUrls) phục vụ /day/2026-09-25 từ
// day/2026-09-25.html; ngày ngoài khoảng vẫn rơi về index.html qua rewrite /day/**.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { runnerImport, type Logger, type Plugin } from 'vite'

/** Kiểu tối thiểu của shared/seo/daySeo.ts (import kiểu thẳng thì tsc kéo cả thư viện âm lịch). */
interface DaySeoModule {
  SITE_URL: string
  getDaySeo(date: string): {
    url: string
    title: string
    socialTitle: string
    description: string
    jsonLd: Record<string, unknown>
  }
  renderDayArticle(date: string): string
  escapeHtml(value: string): string
  jsonLdScript(data: Record<string, unknown>): string
}

/** Kiểu chữ tối thiểu cho nội dung tĩnh, trước khi app chạy và thay nội dung này. */
const ARTICLE_STYLE =
  '<style>.seo-day{max-width:760px;margin:0 auto;padding:24px 16px;line-height:1.55;' +
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
  '.seo-day h1{font-size:24px}.seo-day h2{font-size:18px;margin-top:24px}' +
  '.seo-day dl>div{display:flex;gap:8px}.seo-day dt{font-weight:600}.seo-day dd{margin:0}</style>'

/** Mọi ngày từ 1/1 năm trước tới 31/12 năm sau, tính theo năm hiện tại ở Việt Nam. */
function dateRange(): string[] {
  const year = new Date(Date.now() + 7 * 3600_000).getUTCFullYear()
  const dates: string[] = []
  for (let t = Date.UTC(year - 1, 0, 1); t <= Date.UTC(year + 1, 11, 31); t += 86_400_000) {
    dates.push(new Date(t).toISOString().slice(0, 10))
  }
  return dates
}

function replaceOnce(html: string, pattern: RegExp, value: string, what: string): string {
  if (!pattern.test(html)) throw new Error(`prerender-days: không thấy ${what} trong index.html`)
  return html.replace(pattern, value)
}

function setMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`)
  return replaceOnce(html, pattern, `<meta ${attr}="${key}" content="${content}" />`, key)
}

function renderPage(template: string, seo: DaySeoModule, date: string): string {
  const page = seo.getDaySeo(date)
  const title = seo.escapeHtml(page.title)
  const social = seo.escapeHtml(page.socialTitle)
  const description = seo.escapeHtml(page.description)

  // Bỏ chú thích của index.html (viết cho trang chủ).
  let html = replaceOnce(
    template.replace(/\s*<!--[\s\S]*?-->/g, ''),
    /<title>[\s\S]*?<\/title>/,
    `<title>${title}</title>`,
    'title',
  )
  html = setMeta(html, 'name', 'description', description)
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${page.url}" />`,
    'canonical',
  )
  html = setMeta(html, 'property', 'og:url', page.url)
  html = setMeta(html, 'property', 'og:title', social)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'name', 'twitter:title', social)
  html = setMeta(html, 'name', 'twitter:description', description)
  // id="page-ld" để app thay JSON-LD này khi chuyển sang ngày khác.
  html = replaceOnce(
    html,
    /<\/head>/,
    `<script type="application/ld+json" id="page-ld">${seo.jsonLdScript(page.jsonLd)}</script>` +
      `${ARTICLE_STYLE}</head>`,
    '</head>',
  )
  return replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${seo.renderDayArticle(date)}</div>`,
    '#root',
  )
}

function sitemap(siteUrl: string, dates: string[]): string {
  const urls = [`${siteUrl}/`, ...dates.map((d) => `${siteUrl}/day/${d}`)]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')
}

export function prerenderDays(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()
  let logger: Logger | undefined
  return {
    name: 'prerender-days',
    apply: 'build',
    configResolved(config) {
      root = config.root
      logger = config.logger
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const { module: seo } = await runnerImport<DaySeoModule>(join(root, 'shared/seo/daySeo.ts'), {
        configFile: false,
        root,
        logLevel: 'error',
      })
      const template = await readFile(join(outDir, 'index.html'), 'utf8')
      const dates = dateRange()
      await mkdir(join(outDir, 'day'), { recursive: true })
      await Promise.all(
        dates.map((d) => writeFile(join(outDir, 'day', `${d}.html`), renderPage(template, seo, d))),
      )
      await writeFile(join(outDir, 'sitemap.xml'), sitemap(seo.SITE_URL, dates))
      logger?.info(`prerender-days: ${dates.length} trang ngày và sitemap.xml`)
    },
  }
}

// Thông tin SEO của trang xem Ngày (/day/YYYY-MM-DD): title, description, JSON-LD và nội dung
// HTML tĩnh. Dùng chung cho app (cập nhật <head> khi đổi ngày) và bước prerender lúc build.
// Không dùng DOM để chạy được trong Node.

import { formatLunarShort, formatSolarShort, WEEKDAY_NAMES } from '../format'
import { getAlmanac } from '../lunar/almanac'
import { getDayInfo } from '../lunar/index'
import { addDays } from '../lunar/julian'
import type { SolarDateString } from '../types'

export const SITE_URL = 'https://lich.thanhnghiep.top'
export const SITE_NAME = 'Lịch Việt'

export interface DaySeo {
  path: string
  url: string
  /** <title>, có tên site ở cuối. */
  title: string
  /** Tiêu đề khi chia sẻ (og:title), không có tên site. */
  socialTitle: string
  description: string
  jsonLd: Record<string, unknown>
}

export function dayPath(date: SolarDateString): string {
  return `/day/${date}`
}

/** "Tý, Sửu, Mão". */
function joinNames(items: readonly { name: string }[]): string {
  return items.map((i) => i.name).join(', ')
}

export function getDaySeo(date: SolarDateString): DaySeo {
  const info = getDayInfo(date)
  const solar = formatSolarShort(date)
  const lunar = formatLunarShort(info.lunar)
  const yearName = info.canChi.year.name
  const holiday = info.holidays[0]?.name
  const dayKind = info.dayGod.isHoangDao ? 'hoàng đạo' : 'hắc đạo'

  const socialTitle = `Lịch âm ngày ${solar}: ${lunar} âm lịch, ${holiday ?? `ngày ${info.canChi.day.name}`}`
  // Ngắn (~160 ký tự) để Google không cắt; bản đầy đủ nằm trong daySummary.
  const description =
    `${WEEKDAY_NAMES[info.weekday]} ${solar} là ${lunar} năm ${yearName} âm lịch` +
    `${holiday ? ` (${holiday})` : ''}, ngày ${info.canChi.day.name}, ${dayKind}. ` +
    `Giờ tốt: ${joinNames(info.auspiciousHours)}. Xem sao, trực, hướng xuất hành, tuổi xung.`

  const path = dayPath(date)
  const url = `${SITE_URL}${path}`
  const title = `${socialTitle} | ${SITE_NAME}`

  return {
    path,
    url,
    title,
    socialTitle,
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': url,
          url,
          name: socialTitle,
          description,
          inLanguage: 'vi',
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
          about: {
            '@type': 'Thing',
            name: `Ngày ${solar} dương lịch, ${lunar} năm ${yearName} âm lịch`,
          },
          breadcrumb: { '@id': `${url}#breadcrumb` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: `Ngày ${solar}`, item: url },
          ],
        },
      ],
    },
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** JSON-LD an toàn để đặt trong <script>: không để chuỗi "</script>" đóng thẻ sớm. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/** Câu tóm tắt đầy đủ của một ngày, mở đầu nội dung tĩnh. */
export function daySummary(date: SolarDateString): string {
  const info = getDayInfo(date)
  const a = getAlmanac(date)
  const holiday = info.holidays[0]?.name
  return (
    `${WEEKDAY_NAMES[info.weekday]} ${formatSolarShort(date)} dương lịch là ngày ` +
    `${formatLunarShort(info.lunar)} năm ${info.canChi.year.name} âm lịch` +
    `${holiday ? ` (${holiday})` : ''}, ngày ${a.dayCanChi.name} tháng ${a.monthCanChi.name}, ` +
    `ngày ${info.dayGod.isHoangDao ? 'hoàng đạo' : 'hắc đạo'} (${info.dayGod.name}). ` +
    `Giờ hoàng đạo: ${joinNames(info.auspiciousHours)}. Sao ${a.mansion.name}, ` +
    `trực ${a.officer.name}, xung tuổi ${a.dayClashes.join(', ')}.`
  )
}

function row(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
}

function list(items: readonly string[]): string {
  if (items.length === 0) return '<p>Không có.</p>'
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
}

/**
 * Nội dung HTML tĩnh của một ngày, đặt sẵn trong #root để máy tìm kiếm và bot chia sẻ
 * (Zalo, Facebook) đọc được mà không cần chạy JavaScript. React thay nội dung này khi app chạy.
 */
export function renderDayArticle(date: SolarDateString): string {
  const info = getDayInfo(date)
  const a = getAlmanac(date)
  const solar = formatSolarShort(date)
  const lunar = formatLunarShort(info.lunar)
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const goodHours = a.hours.filter((h) => h.isGood)
  const badHours = a.hours.filter((h) => !h.isGood)
  const special = [
    ...info.holidays.map((h) => h.name),
    ...(info.solarTerm.startsToday ? [`Bắt đầu tiết ${info.solarTerm.name}`] : []),
    ...info.badDays.map((d) => `Ngày ${d.name}: ${d.description}`),
  ]

  return [
    '<article class="seo-day">',
    `<h1>Lịch âm ngày ${escapeHtml(solar)}</h1>`,
    `<p>${escapeHtml(daySummary(date))}</p>`,
    special.length > 0 ? list(special) : '',
    '<h2>Âm lịch và Can Chi</h2>',
    '<dl>',
    row('Dương lịch', `${WEEKDAY_NAMES[info.weekday]}, ${solar}`),
    row('Âm lịch', `${lunar} năm ${info.canChi.year.name}`),
    row('Ngày', a.dayCanChi.name),
    row('Tháng', a.monthCanChi.name),
    row('Năm', info.canChi.year.name),
    row('Tiết khí', a.solarTerm.name),
    row('Niên mệnh', a.napAm.name),
    '</dl>',
    '<h2>Ngày tốt hay xấu</h2>',
    `<p>${escapeHtml(
      `Ngày ${info.dayGod.isHoangDao ? 'hoàng đạo' : 'hắc đạo'} (${info.dayGod.name}). ${a.relation.text}`,
    )}</p>`,
    '<h2>Giờ hoàng đạo</h2>',
    list(goodHours.map((h) => `${h.label}, ${h.god}`)),
    '<h2>Giờ hắc đạo</h2>',
    list(badHours.map((h) => `${h.label}, ${h.god}`)),
    `<h2>Nhị thập bát tú: sao ${escapeHtml(a.mansion.name)}</h2>`,
    `<p>${escapeHtml(`${a.mansion.animal}, ${a.mansion.isGood ? 'Cát Tú' : 'Hung Tú'}, hành ${a.mansion.element}.`)}</p>`,
    '<dl>',
    row('Nên làm', a.mansion.shouldDo),
    row('Nên kiêng', a.mansion.shouldAvoid),
    '</dl>',
    `<h2>Thập nhị trực: trực ${escapeHtml(a.officer.name)}</h2>`,
    `<p>${a.officer.isGood ? 'Trực tốt.' : 'Trực xấu.'}</p>`,
    '<dl>',
    row('Nên làm', a.officer.shouldDo),
    row('Nên kiêng', a.officer.shouldAvoid),
    '</dl>',
    '<h2>Hướng xuất hành</h2>',
    '<dl>',
    row('Hỷ Thần', a.directions.hyThan),
    row('Tài Thần', a.directions.taiThan),
    '</dl>',
    '<h2>Tuổi xung khắc</h2>',
    '<dl>',
    row('Xung ngày', a.dayClashes.join(', ')),
    row(`Xung tháng (${a.monthCanChi.name})`, a.monthClashes.join(', ')),
    '</dl>',
    '<h2>Sao tốt</h2>',
    list(a.stars.good.map((s) => `${s.name}: ${s.meaning}`)),
    '<h2>Sao xấu</h2>',
    list(a.stars.bad.map((s) => `${s.name}: ${s.meaning}`)),
    '<nav aria-label="Ngày khác">',
    `<a href="${dayPath(prev)}">Hôm trước (${escapeHtml(formatSolarShort(prev))})</a> · `,
    `<a href="${dayPath(next)}">Hôm sau (${escapeHtml(formatSolarShort(next))})</a> · `,
    '<a href="/">Lịch hôm nay</a>',
    '</nav>',
    '</article>',
  ].join('')
}

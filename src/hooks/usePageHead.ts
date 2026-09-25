import { useEffect } from 'react'
import { formatMonthTitle, formatSolarShort } from '@shared/format'
import { parseSolarDate } from '@shared/lunar/julian'
import { getDaySeo, jsonLdScript, SITE_NAME, SITE_URL } from '@shared/seo/daySeo'
import type { SolarDateString } from '@shared/types'
import type { ViewMode } from '../calendar/range'

interface PageHead {
  title: string
  description?: string
  /** Tiêu đề khi chia sẻ; mặc định là `title`. */
  socialTitle?: string
  canonical: string
  /** Ví dụ "noindex, follow". Không đặt thì bỏ thẻ robots. */
  robots?: string
  jsonLd?: Record<string, unknown>
}

const LD_ID = 'page-ld'

function meta(attr: 'name' | 'property', key: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  return el
}

function canonicalLink(): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.append(el)
  }
  return el
}

/** Ghi <head> theo trang đang xem, trả về hàm khôi phục <head> như trước. */
function applyHead(head: PageHead): () => void {
  const description = meta('name', 'description')
  const tags = [
    description,
    meta('property', 'og:title'),
    meta('property', 'og:description'),
    meta('property', 'og:url'),
    meta('name', 'twitter:title'),
    meta('name', 'twitter:description'),
  ]
  const link = canonicalLink()
  const saved = {
    title: document.title,
    contents: tags.map((t) => t.content),
    canonical: link.href,
  }

  const social = head.socialTitle ?? head.title
  const desc = head.description ?? description.content
  document.title = head.title
  ;[desc, social, desc, head.canonical, social, desc].forEach((value, i) => {
    tags[i].content = value
  })
  link.href = head.canonical

  document.head.querySelector('meta[name="robots"]')?.remove()
  if (head.robots) meta('name', 'robots').content = head.robots

  document.getElementById(LD_ID)?.remove()
  if (head.jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = LD_ID
    script.textContent = jsonLdScript(head.jsonLd)
    document.head.append(script)
  }

  return () => {
    document.title = saved.title
    tags.forEach((t, i) => {
      t.content = saved.contents[i]
    })
    link.href = saved.canonical
    document.head.querySelector('meta[name="robots"]')?.remove()
    document.getElementById(LD_ID)?.remove()
  }
}

function calendarHead(view: ViewMode, date: SolarDateString): PageHead {
  if (view === 'day') {
    const seo = getDaySeo(date)
    return {
      title: seo.title,
      socialTitle: seo.socialTitle,
      description: seo.description,
      canonical: seo.url,
      jsonLd: seo.jsonLd,
    }
  }
  // Xem Tuần / Tháng trùng nội dung với các trang Ngày: không lập chỉ mục, chỉ cho bot đi theo link.
  const { month, year } = parseSolarDate(date)
  const title =
    view === 'month'
      ? `Lịch âm ${formatMonthTitle(month, year)} | ${SITE_NAME}`
      : `Lịch tuần có ngày ${formatSolarShort(date)} | ${SITE_NAME}`
  return { title, canonical: `${SITE_URL}/${view}/${date}`, robots: 'noindex, follow' }
}

/**
 * Title, description, canonical và JSON-LD của trang lịch. Trang chủ (`home`) giữ <head> gốc
 * trong index.html để không bị canonical sang trang của một ngày.
 */
export function useCalendarHead(view: ViewMode, date: SolarDateString, home: boolean) {
  useEffect(() => {
    if (home) return
    return applyHead(calendarHead(view, date))
  }, [view, date, home])
}

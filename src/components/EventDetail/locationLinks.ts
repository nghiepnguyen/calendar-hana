export type LocationPart =
  { type: 'text'; text: string } | { type: 'link'; href: string; label: string }

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi
// Dấu câu dính cuối link ("…/abc)." hay "…/abc,") không thuộc về link.
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/

/** Tên hiển thị cho link: tên ứng dụng bản đồ quen thuộc, còn lại là tên miền. */
export function linkLabel(url: URL): string {
  const host = url.hostname.replace(/^www\./, '')
  if (
    host === 'maps.app.goo.gl' ||
    host.startsWith('maps.google.') ||
    (host === 'goo.gl' && url.pathname.startsWith('/maps')) ||
    (/^google\.[a-z.]+$/.test(host) && url.pathname.startsWith('/maps'))
  ) {
    return 'Google Maps'
  }
  if (host === 'maps.apple.com' || host === 'maps.apple') return 'Apple Maps'
  if (host === 'waze.com' || host.endsWith('.waze.com')) return 'Waze'
  return host
}

/** Tách địa điểm thành đoạn chữ và link (chỉ http/https) để hiện link bấm được. */
export function splitLocation(location: string): LocationPart[] {
  const parts: LocationPart[] = []
  const pushText = (text: string) => {
    if (!text) return
    const last = parts.at(-1)
    if (last?.type === 'text') last.text += text
    else parts.push({ type: 'text', text })
  }

  let index = 0
  for (const match of location.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, '')
    const start = match.index
    pushText(location.slice(index, start))
    let url: URL | null = null
    try {
      url = new URL(raw)
    } catch {
      url = null
    }
    if (url) parts.push({ type: 'link', href: url.href, label: linkLabel(url) })
    else pushText(raw)
    index = start + raw.length
  }
  pushText(location.slice(index))
  return parts
}

/** Địa điểm dạng chữ, link thay bằng tên (dùng ở chỗ không bấm được, như dòng danh sách). */
export function locationText(location: string): string {
  return splitLocation(location)
    .map((part) => (part.type === 'link' ? part.label : part.text))
    .join('')
}

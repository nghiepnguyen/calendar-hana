import { describe, expect, it } from 'vitest'
import { escapeHtml, getDaySeo, jsonLdScript, renderDayArticle } from './daySeo'

describe('getDaySeo', () => {
  it('title, description và canonical riêng của từng ngày', () => {
    const seo = getDaySeo('2026-09-25')
    expect(seo.url).toBe('https://lich.thanhnghiep.top/day/2026-09-25')
    expect(seo.title).toBe('Lịch âm ngày 25/9/2026: 15/8 âm lịch, Tết Trung Thu | Lịch Việt')
    expect(seo.description).toContain('Thứ Sáu 25/9/2026 là 15/8 năm Bính Ngọ âm lịch')
    expect(seo.description).toContain('Giờ tốt: Tý, Sửu, Thìn, Tỵ, Mùi, Tuất')
  })

  it('ngày không có lễ dùng Can Chi ngày trong tiêu đề', () => {
    expect(getDaySeo('2026-09-24').socialTitle).toBe(
      'Lịch âm ngày 24/9/2026: 14/8 âm lịch, ngày Tân Sửu',
    )
  })

  it('description đủ ngắn để không bị cắt trong kết quả tìm kiếm', () => {
    for (const date of ['2026-01-01', '2026-02-17', '2026-09-25', '2027-12-31']) {
      expect(getDaySeo(date).description.length).toBeLessThanOrEqual(180)
    }
  })

  it('JSON-LD có WebPage và BreadcrumbList', () => {
    const graph = getDaySeo('2026-09-25').jsonLd['@graph'] as { '@type': string }[]
    expect(graph.map((n) => n['@type'])).toEqual(['WebPage', 'BreadcrumbList'])
  })
})

describe('renderDayArticle', () => {
  it('có đủ các mục lịch vạn niên và link sang ngày trước, ngày sau', () => {
    const html = renderDayArticle('2026-09-25')
    expect(html).toContain('<h1>Lịch âm ngày 25/9/2026</h1>')
    for (const heading of ['Giờ hoàng đạo', 'Hướng xuất hành', 'Tuổi xung khắc', 'Sao tốt']) {
      expect(html).toContain(`<h2>${heading}</h2>`)
    }
    expect(html).toContain('Thập nhị trực: trực Chấp')
    expect(html).toContain('href="/day/2026-09-24"')
    expect(html).toContain('href="/day/2026-09-26"')
  })
})

describe('escape', () => {
  it('escapeHtml và jsonLdScript không để lọt thẻ HTML', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
    expect(jsonLdScript({ name: '</script>' })).not.toContain('</script>')
  })
})

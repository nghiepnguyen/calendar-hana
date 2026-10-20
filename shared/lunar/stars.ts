// Sao tốt, sao xấu theo Ngọc Hạp Thông Thư.
//
// Mỗi sao có một quy tắc: điều kiện theo từng tháng âm (`byMonth`, 12 phần tử cho tháng 1..12)
// hoặc điều kiện không phụ thuộc tháng (`always`). Một điều kiện khớp khi ngày thoả ít nhất một
// danh sách trong đó (Can, Chi, Can Chi, trực, sao 28 tú, ngày âm). Tháng nhuận dùng quy tắc của
// tháng thường cùng số (quyết định owner 2026-10-20, không có nguồn nêu quy tắc; nhuận 4 → tháng 4).
// Ngày Can Chi chạy liên tục theo chu kỳ 60, tháng nhuận không làm gián đoạn. Bảng dữ liệu nằm
// trong stars.data.ts.

import { STARS } from './stars.data'

export interface StarMatch {
  /** Chỉ số Can 0..9. */
  can?: readonly number[]
  /** Chỉ số Chi 0..11. */
  chi?: readonly number[]
  /** Vị trí trong 60 Hoa Giáp 0..59. */
  canChi?: readonly number[]
  /** Chỉ số trực 0..11 (0 = Kiến). */
  officer?: readonly number[]
  /** Chỉ số sao 28 tú 0..27 (0 = Giác). */
  mansion?: readonly number[]
  /** Ngày âm 1..30. */
  lunarDay?: readonly number[]
}

export interface StarRule {
  byMonth?: readonly (StarMatch | null)[]
  always?: StarMatch
}

export interface StarDefinition {
  name: string
  isGood: boolean
  /** Ý nghĩa ngắn, ví dụ "Tốt cho mọi việc." */
  meaning: string
  rule: StarRule
}

export interface Star {
  name: string
  isGood: boolean
  meaning: string
}

export interface StarContext {
  lunarMonth: number
  lunarDay: number
  can: number
  chi: number
  /** Vị trí 0..59 trong 60 Hoa Giáp. */
  canChi: number
  officer: number
  mansion: number
}

function matches(m: StarMatch | null | undefined, ctx: StarContext): boolean {
  if (!m) return false
  return Boolean(
    m.can?.includes(ctx.can) ||
    m.chi?.includes(ctx.chi) ||
    m.canChi?.includes(ctx.canChi) ||
    m.officer?.includes(ctx.officer) ||
    m.mansion?.includes(ctx.mansion) ||
    m.lunarDay?.includes(ctx.lunarDay),
  )
}

export function starApplies(rule: StarRule, ctx: StarContext): boolean {
  return matches(rule.always, ctx) || matches(rule.byMonth?.[ctx.lunarMonth - 1], ctx)
}

/** Các sao tốt và sao xấu của một ngày, giữ thứ tự trong bảng dữ liệu. */
export function getStars(
  ctx: StarContext,
  table: readonly StarDefinition[] = STARS,
): { good: Star[]; bad: Star[] } {
  const good: Star[] = []
  const bad: Star[] = []
  for (const s of table) {
    if (!starApplies(s.rule, ctx)) continue
    const star = { name: s.name, isGood: s.isGood, meaning: s.meaning }
    ;(s.isGood ? good : bad).push(star)
  }
  return { good, bad }
}

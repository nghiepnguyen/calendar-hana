// Stateless MVP policy; birth data never enters the shared calendar cache.
import { parseSolarDate, solarStringToJd } from '../lunar/julian'
import { MIN_YEAR, MAX_YEAR, solarToLunar } from '../lunar/lunar'
import { dayCanChi, yearCanChi } from '../lunar/canChi'
import { canElement, type NguHanh } from '../lunar/elements'
import { getNapAm } from '../lunar/napAm'
import { getAllHours } from '../lunar/auspicious'
import { createRuleRegistry, FENG_SHUI_RULES, type RuleDefinition } from './rules'

export type Tone = 'favorable' | 'neutral' | 'caution'
export const SUMMARY_LABELS: Record<Tone, string> = {
  favorable: 'Có yếu tố thuận',
  neutral: 'Trung tính trong phạm vi đang xét',
  caution: 'Có yếu tố cần lưu ý',
}
export const PERSONAL_RULE_IDS = [
  'personal.branch-relations',
  'personal.stem-relations',
  'personal.nap-am-elements',
  'personal.birth-year-boundary',
  'personal.summary-policy',
  'personal.hour-policy',
] as const
const COMBINATIONS = [
  [0, 1],
  [2, 11],
  [3, 10],
  [4, 9],
  [5, 8],
  [6, 7],
]
export function branchRelation(day: number, birth: number) {
  const kind =
    day === birth
      ? 'same'
      : Math.abs(day - birth) === 6
        ? 'clash'
        : COMBINATIONS.some((pair) => pair.includes(day) && pair.includes(birth))
          ? 'combination'
          : day % 4 === birth % 4
            ? 'trine'
            : 'none'
  const text = {
    same: 'Cùng Địa chi',
    clash: 'Địa chi xung tuổi',
    combination: 'Lục hợp với tuổi',
    trine: 'Cùng nhóm tam hợp với tuổi',
    none: 'Không có quan hệ hợp/xung đang xét',
  }[kind]
  const tone: Tone =
    kind === 'clash'
      ? 'caution'
      : kind === 'combination' || kind === 'trine'
        ? 'favorable'
        : 'neutral'
  return { kind, text, tone }
}
const ELEMENTS: readonly NguHanh[] = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy']
export function elementRelation(day: NguHanh, birth: NguHanh) {
  const kind = (['same', 'generates', 'overcomes', 'overcomeBy', 'generatedBy'] as const)[
    (ELEMENTS.indexOf(birth) - ELEMENTS.indexOf(day) + 5) % 5
  ]
  const text = {
    same: `Cùng hành ${day}`,
    generates: `${day} sinh ${birth} (sinh nhập)`,
    generatedBy: `${birth} sinh ${day} (sinh xuất)`,
    overcomes: `${day} khắc ${birth} (khắc nhập)`,
    overcomeBy: `${birth} khắc ${day} (khắc xuất)`,
  }[kind]
  const tone: Tone =
    kind === 'same' || kind === 'generates'
      ? 'favorable'
      : kind === 'generatedBy'
        ? 'neutral'
        : 'caution'
  return { kind, text, tone }
}
export function stemRelation(day: number, birth: number) {
  const element = elementRelation(canElement(day), canElement(birth))
  const combined = Math.abs(day - birth) === 5
  const tone: Tone = combined ? 'favorable' : element.kind === 'same' ? 'neutral' : element.tone
  return {
    combined,
    element,
    tone,
    text: combined
      ? `Thiên can hợp; ngũ hành: ${element.text}`
      : day === birth
        ? `Cùng Thiên can; ${element.text}`
        : `Thiên can: ${element.text}`,
  }
}
export function assessPersonalDay(
  input: { viewDate: string; birthDate?: string | null; today: string },
  definitions: readonly RuleDefinition[] = FENG_SHUI_RULES,
) {
  const unavailable = (
    status: 'missing' | 'invalid' | 'unsupported' | 'notApplicable',
    reason: string,
    editBirth = false,
  ) => ({ status, reason, editBirth }) as const
  let view
  try {
    view = parseSolarDate(input.viewDate)
  } catch {
    return unavailable('unsupported', 'Ngày xem không hợp lệ.')
  }
  if (view.year < MIN_YEAR || view.year > MAX_YEAR)
    return unavailable('unsupported', 'Ngày xem chỉ hỗ trợ trong khoảng 1900–2100.')
  if (!input.birthDate)
    return unavailable('missing', 'Nhập ngày sinh để xem mức độ hợp với bạn', true)
  let birth
  try {
    birth = parseSolarDate(input.birthDate)
  } catch {
    return unavailable('invalid', 'Ngày sinh không hợp lệ. Hãy sửa trong Cài đặt.', true)
  }
  if (input.birthDate > input.today)
    return unavailable('invalid', 'Ngày sinh không được sau hôm nay. Hãy sửa trong Cài đặt.', true)
  if (birth.year < MIN_YEAR || birth.year > MAX_YEAR)
    return unavailable('unsupported', 'Ngày sinh chỉ hỗ trợ trong khoảng 1900–2100.', true)
  if (input.viewDate < input.birthDate)
    return unavailable('notApplicable', 'Ngày xem trước ngày sinh; không áp dụng đánh giá cá nhân.')
  const readiness = createRuleRegistry(definitions).getReadiness('personalDay', PERSONAL_RULE_IDS)
  if (readiness.status === 'blocked')
    return unavailable('unsupported', 'Quy tắc cá nhân chưa đủ kiểm chứng để tính.')
  const lunarBirth = solarToLunar(birth.day, birth.month, birth.year)
  const profile = yearCanChi(lunarBirth.year)
  const profileNapAm = getNapAm(profile)
  const jd = solarStringToJd(input.viewDate)
  const day = dayCanChi(jd)
  const dayNapAm = getNapAm(day)
  const branch = branchRelation(day.chi, profile.chi)
  const stem = stemRelation(day.can, profile.can)
  const napAm = elementRelation(dayNapAm.element, profileNapAm.element)
  const tones = [branch.tone, stem.tone, napAm.tone]
  const summary: Tone = tones.includes('caution')
    ? 'caution'
    : tones.includes('favorable')
      ? 'favorable'
      : 'neutral'
  const hours = getAllHours(jd, day.chi).map((hour) => {
    const branch = branchRelation(hour.chi, profile.chi)
    const stem = stemRelation(hour.canChi.can, profile.can)
    const exclusions = [
      ...(!hour.isGood ? ['Hắc đạo chung'] : []),
      ...(branch.kind === 'clash' ? ['Địa chi giờ xung tuổi'] : []),
      ...(stem.tone === 'caution' ? ['Ngũ hành Thiên can giờ khắc tuổi'] : []),
    ]
    const group: 'priority' | 'consider' | 'excluded' = exclusions.length
      ? 'excluded'
      : branch.tone === 'favorable' || stem.tone === 'favorable'
        ? 'priority'
        : 'consider'
    return { ...hour, branch, stem, exclusions, group }
  })
  return {
    status: 'ready' as const,
    profile,
    profileNapAm,
    day,
    dayNapAm,
    branch,
    stem,
    napAm,
    summary,
    hours,
    rules: readiness.rules,
  }
}

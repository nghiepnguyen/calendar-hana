import { CAN, CHI } from '@shared/lunar/canChi'
import type { Tone, assessPersonalDay } from '@shared/personalFengShui/day'
import type { ExplainItem } from './AlmanacExplain'

type Ready = Extract<ReturnType<typeof assessPersonalDay>, { status: 'ready' }>

const VERDICT: Record<Tone, ExplainItem['verdict']> = {
  favorable: { label: 'Thuận', tone: 'good' },
  neutral: { label: 'Bình hòa', tone: 'neutral' },
  caution: { label: 'Lưu ý', tone: 'bad' },
}

/** Chi mở đầu mỗi nhóm tam hợp, theo số dư khi chia 4: Thân Tý Thìn, Tỵ Dậu Sửu, Dần Ngọ Tuất, Hợi Mão Mùi. */
const TRINE_START = [8, 5, 2, 11] as const

function trineGroup(chi: number): string {
  const start = TRINE_START[chi % 4]
  return [start, (start + 4) % 12, (start + 8) % 12].map((i) => CHI[i]).join(', ')
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

export { trineGroup }

/** Mô tả ngắn quan hệ Địa chi để dùng trong câu kết luận, ví dụ "Ngọ xung Tý". */
export function branchDetail(r: Ready): string {
  const birth = CHI[r.profile.chi]
  const day = CHI[r.day.chi]
  switch (r.branch.kind) {
    case 'clash':
      return `Địa chi xung tuổi (${birth} xung ${day})`
    case 'combination':
      return `Địa chi lục hợp (${birth} hợp ${day})`
    case 'trine':
      return `Địa chi tam hợp (${birth} và ${day})`
    case 'same':
      return `cùng Địa chi ${birth}`
    default:
      return `Địa chi ${birth} và ${day} không hợp xung`
  }
}

/** Câu kết luận nêu thẳng yếu tố quyết định thay vì nói chung chung. */
export function summarySentence(r: Ready): string {
  const factors: { tone: Tone; text: string }[] = [
    { tone: r.branch.tone, text: branchDetail(r) },
    { tone: r.stem.tone, text: `Thiên can ${lowerFirst(r.stem.element.text)}` },
    { tone: r.napAm.tone, text: `Nạp âm ${lowerFirst(r.napAm.text)}` },
  ]
  const pick = (tone: Tone) => factors.filter((f) => f.tone === tone).map((f) => f.text)
  if (r.summary === 'caution') return `Vì ${pick('caution').join('; ')}.`
  if (r.summary === 'favorable') return `Vì ${pick('favorable').join('; ')}.`
  return `Không có yếu tố hợp hay xung nổi bật giữa tuổi ${r.profile.name} và ngày ${r.day.name}.`
}

export function explainBranch(r: Ready): ExplainItem {
  const birth = CHI[r.profile.chi]
  const day = CHI[r.day.chi]
  const meaning = {
    clash: `${birth} và ${day} nằm đối nhau trên vòng 12 Địa chi (lục xung), nên ngày này cần lưu ý với tuổi ${birth}.`,
    combination: `${birth} và ${day} là một cặp lục hợp, xem là thuận với tuổi.`,
    trine: `${birth} và ${day} cùng nhóm tam hợp ${trineGroup(r.profile.chi)}, xem là thuận với tuổi.`,
    same: `Ngày ${day} trùng Địa chi với tuổi. Quy ước đang dùng xem là bình hòa, không cộng hay trừ.`,
    none: `Giữa ${birth} và ${day} không có lục hợp, tam hợp hay lục xung đang xét.`,
  }[r.branch.kind]
  return {
    title: 'Địa chi',
    isGood: r.branch.tone !== 'caution',
    verdict: VERDICT[r.branch.tone],
    meaning,
    reasons: [
      `Chi tuổi: ${birth}. Chi ngày: ${day}.`,
      ...(r.branch.kind === 'trine'
        ? [`Tam hợp: nhóm tuổi ${trineGroup(r.profile.chi)} hỗ trợ năng lượng tích cực lẫn nhau.`]
        : []),
    ],
  }
}

export function explainStem(r: Ready): ExplainItem {
  const birth = CAN[r.profile.can]
  const day = CAN[r.day.can]
  return {
    title: 'Thiên can',
    isGood: r.stem.tone !== 'caution',
    verdict: VERDICT[r.stem.tone],
    meaning: r.stem.combined
      ? `${birth} và ${day} là một cặp Thiên can hợp, xem là thuận.`
      : `So ngũ hành của Can ngày ${day} với Can tuổi ${birth}: ${r.stem.element.text}.`,
    reasons: [
      'Sinh nhập (hành ngày sinh hành tuổi) và cùng hành là thuận; sinh xuất là bình hòa; khắc là lưu ý.',
      ...(r.stem.element.kind === 'overcomeBy'
        ? ['Khắc xuất: Tuổi của bạn khắc được năng lượng ngày, chủ về chủ động kiểm soát công việc nhưng tốn chút sức lực.']
        : []),
      ...(day === birth ? ['Cùng Thiên can được xem là bình hòa.'] : []),
    ],
  }
}

export function explainNapAm(r: Ready): ExplainItem {
  return {
    title: 'Nạp âm',
    isGood: r.napAm.tone !== 'caution',
    verdict: VERDICT[r.napAm.tone],
    meaning: `Nạp âm ngày ${r.dayNapAm.name} (${r.dayNapAm.element}) so với nạp âm năm sinh ${r.profileNapAm.name} (${r.profileNapAm.element}): ${r.napAm.text}.`,
    reasons: [
      'Sinh nhập và cùng hành là thuận; sinh xuất là bình hòa; khắc nhập hoặc khắc xuất là lưu ý.',
    ],
  }
}

export const HAN_MEANING = {
  'annual.tam-tai':
    'Tam Tai là ba năm liên tiếp tính theo nhóm tam hợp của Chi năm sinh; chỉ cho biết năm đang xem có nằm trong chu kỳ hay không.',
  'annual.kim-lau':
    'Kim Lâu thường được xét khi cưới hỏi. Lấy tuổi mụ chia 9: dư 1 là Kim Lâu Thân, 3 là Thê, 6 là Tử, 8 là Súc.',
  'annual.hoang-oc':
    'Hoang Ốc thường được xét khi làm nhà. Đếm tuổi mụ qua 6 cung; rơi vào Tam Địa Sát, Ngũ Thọ Tử hoặc Lục Hoang Ốc là phạm.',
} as const

/** Chỉ số Địa chi của giờ từ số giờ 0–23: Tý 23–1, Sửu 1–3... */
export function hourChiOf(hour: number): number {
  return Math.floor((hour + 1) / 2) % 12
}

export interface EventHourNote {
  title: string
  time: string
  hourName: string
  reasons: readonly string[]
}

/** Sự kiện có giờ rơi vào giờ không hợp tuổi; chỉ là nhắc nhở, không đổi kết luận ngày. */
export function eventHourNotes(
  r: Ready,
  events: readonly { title: string; allDay: boolean; startTime?: string }[],
): EventHourNote[] {
  return events.flatMap((event) => {
    if (event.allDay || !event.startTime) return []
    const chi = hourChiOf(Number(event.startTime.slice(0, 2)))
    const hour = r.hours.find((h) => h.chi === chi)
    if (!hour || hour.group !== 'excluded') return []
    return [
      { title: event.title, time: event.startTime, hourName: hour.name, reasons: hour.exclusions },
    ]
  })
}

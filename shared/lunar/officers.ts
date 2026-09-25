// Thập nhị trực (Thập nhị Kiến Trừ): 12 trực luân phiên theo ngày, khởi từ tháng tiết khí.
//
// Nguồn đối chiếu: licham.vn (mục "Thập Nhị Kiến Trừ"), đối chiếu tháng 9/2026. Tên trực theo
// cách ghi của licham.vn (Thâu thay cho Thu). licham.vn không ghi tốt/xấu: Phá, Nguy, Thâu, Bế
// được xếp là trực xấu theo cách phân loại phổ biến. Việc nên làm / nên kiêng được viết lại ngắn gọn.

import { solarTermMonthChi } from './solarTerms'

export interface Officer {
  /** 0..11, 0 = Kiến. */
  index: number
  /** Ví dụ "Chấp". */
  name: string
  isGood: boolean
  shouldDo: string
  shouldAvoid: string
}

type OfficerRow = Omit<Officer, 'index'>

const OFFICERS: readonly OfficerRow[] = [
  {
    name: 'Kiến',
    isGood: true,
    shouldDo: 'Khai trương, nhậm chức, cưới hỏi, trồng cây, xuất hành.',
    shouldAvoid: 'Động thổ, chôn cất, đào giếng, lợp nhà.',
  },
  {
    name: 'Trừ',
    isGood: true,
    shouldDo: 'Động thổ, san nền, cúng Táo Quân, chữa bệnh, bốc thuốc, xả tang.',
    shouldAvoid: 'Nam giới bắt đầu uống thuốc.',
  },
  {
    name: 'Mãn',
    isGood: true,
    shouldDo: 'Xuất hành, đi đường thủy, cho vay, thu nợ, mua bán, nhập kho, lắp đặt máy.',
    shouldAvoid: 'Nhậm chức, uống thuốc, nộp đơn từ.',
  },
  {
    name: 'Bình',
    isGood: true,
    shouldDo: 'Nhập kho, gắn cửa, kê gác, sửa tàu thuyền, bồi đắp nền, xây kè.',
    shouldAvoid: 'Đóng giường, thừa kế, đào mương, đào giếng, xả nước.',
  },
  {
    name: 'Định',
    isGood: true,
    shouldDo: 'Động thổ, san nền, sửa bếp, lắp máy, nhập học, dạm ngõ, mua gia súc.',
    shouldAvoid: 'Kiện tụng, xuất hành đi xa.',
  },
  {
    name: 'Chấp',
    isGood: true,
    shouldDo: 'Lập khế ước, giao dịch, động thổ, xây nền tường, chữa bệnh.',
    shouldAvoid: 'Dời nhà, đi xa, mở cửa hàng, xuất tiền của.',
  },
  {
    name: 'Phá',
    isGood: false,
    shouldDo: 'Phá dỡ nhà cửa.',
    shouldAvoid: 'Mọi việc lớn: ngày Nhật Nguyệt tương xung.',
  },
  {
    name: 'Nguy',
    isGood: false,
    shouldDo: 'Không hợp việc lớn nào.',
    shouldAvoid: 'Mọi việc lớn: ngày chủ nguy hiểm, suy thoái.',
  },
  {
    name: 'Thành',
    isGood: true,
    shouldDo: 'Giao dịch, mua bán, xuất hành, khởi tạo, động thổ, cưới gả, nhập học.',
    shouldAvoid: 'Kiện tụng, tranh chấp.',
  },
  {
    name: 'Thâu',
    isGood: false,
    shouldDo: 'Gặt hái, mua gia súc, thu nợ, nhậm chức, nộp đơn từ.',
    shouldAvoid: 'Bắt đầu việc mới, đi du lịch, tang lễ.',
  },
  {
    name: 'Khai',
    isGood: true,
    shouldDo: 'Xuất hành, khởi tạo, động thổ, sửa bếp, lắp máy, chữa bệnh, nhập học.',
    shouldAvoid: 'Chôn cất.',
  },
  {
    name: 'Bế',
    isGood: false,
    shouldDo: 'Xây đắp tường, gắn cửa, làm cầu, uống thuốc (trừ bệnh mắt).',
    shouldAvoid: 'Nhậm chức, thừa kế, nhập học, chữa bệnh mắt.',
  },
]

/**
 * Trực của ngày jd. Ngày có Chi trùng Chi của tháng tiết khí là trực Kiến, rồi lần lượt theo thứ
 * tự trong bảng. Ngày bắt đầu tiết mới lặp lại trực của ngày trước đó.
 */
export function getOfficer(jd: number, dayChi: number): Officer {
  const index = (dayChi - solarTermMonthChi(jd) + 12) % 12
  return { index, ...OFFICERS[index] }
}

// Nhị thập bát tú: 28 sao luân phiên trực mỗi ngày.
//
// Provenance:
// - Thứ tự/chu kỳ và 七曜: 欽定協紀辨方書, 二十八宿配日.
// - Tổ hợp Tú + 七曜 + cầm thú: 演禽通纂 (ví dụ 角木蛟, 氐土貉, 柳土獐).
// - Absolute phase: xem docs/audits/28-mansion-provenance.md.
//
// `luminary` giữ canonical 七曜: Nhật/Nguyệt/Hỏa/Thủy/Mộc/Kim/Thổ.
// `element` là compatibility field cho UI/consumer cũ: Nhật -> Hỏa, Nguyệt -> Thủy.
// `isGood` và shouldDo/shouldAvoid vẫn là dữ liệu almanac hiện đại, chưa source-lock;
// không được dùng chúng như canonical scoring cho tới khi audit riêng hoàn tất.

import type { NguHanh } from './elements'

export type MansionLuminary = 'Nhật' | 'Nguyệt' | 'Hỏa' | 'Thủy' | 'Mộc' | 'Kim' | 'Thổ'

export interface Mansion {
  /** 0..27, 0 = Giác. */
  index: number
  /** Ví dụ "Ngưu". */
  name: string
  /** Canonical 七曜 association. */
  luminary: MansionLuminary
  /** Compatibility Ngũ hành projection used by existing UI/consumers. */
  element: NguHanh
  /** Ví dụ "Ngưu (Trâu)". */
  animal: string
  /** Legacy modern-almanac summary; not a canonical intrinsic property of the mansion. */
  isGood: boolean
  /** Modern-almanac wording; provenance audit pending. */
  shouldDo: string
  /** Modern-almanac wording; provenance audit pending. */
  shouldAvoid: string
}

type MansionRow = Omit<Mansion, 'index'>

const MANSIONS: readonly MansionRow[] = [
  { name: 'Giác', luminary: 'Mộc', element: 'Mộc', animal: 'Giao (Giao long)', isGood: true, shouldDo: 'Khởi tạo mọi việc, cưới gả, cầu công danh, thi cử.', shouldAvoid: 'Chôn cất, sửa mồ mả.' },
  { name: 'Cang', luminary: 'Kim', element: 'Kim', animal: 'Long (Rồng)', isGood: false, shouldDo: 'Cắt may áo màn.', shouldAvoid: 'Chôn cất, cưới gả, kiện tụng, xây dựng nhà cửa.' },
  { name: 'Đê', luminary: 'Thổ', element: 'Thổ', animal: 'Lạc (貉)', isGood: false, shouldDo: 'Không hợp việc lớn nào.', shouldAvoid: 'Khởi công xây dựng, chôn cất, cưới gả, xuất hành, nhất là đi đường thủy.' },
  { name: 'Phòng', luminary: 'Nhật', element: 'Hỏa', animal: 'Thố (Thỏ)', isGood: true, shouldDo: 'Mọi việc đều tốt, nhất là cưới gả, xuất hành, xây nhà, chôn cất, mua bán lớn.', shouldAvoid: 'Không kỵ việc gì.' },
  { name: 'Tâm', luminary: 'Nguyệt', element: 'Thủy', animal: 'Hồ (Chồn)', isGood: false, shouldDo: 'Không hợp việc gì.', shouldAvoid: 'Cưới gả, đóng giường, xây cất, chôn cất, kiện tụng.' },
  { name: 'Vĩ', luminary: 'Hỏa', element: 'Hỏa', animal: 'Hổ (Cọp)', isGood: true, shouldDo: 'Khởi tạo, chôn cất, cưới gả, xây cất, đào ao giếng, làm thủy lợi.', shouldAvoid: 'Đóng giường, đi thuyền, mua sắm lớn.' },
  { name: 'Cơ', luminary: 'Thủy', element: 'Thủy', animal: 'Báo (Beo)', isGood: true, shouldDo: 'Chôn cất, khai trương, xuất hành, sửa mồ mả, trổ cửa, làm thủy lợi.', shouldAvoid: 'Đóng giường, lót giường, đi thuyền.' },
  { name: 'Đẩu', luminary: 'Mộc', element: 'Mộc', animal: 'Giải (Cua)', isGood: true, shouldDo: 'Xây đắp, sửa mộ, trổ cửa, thủy lợi, may mặc, kinh doanh, cầu công danh.', shouldAvoid: 'Đi thuyền.' },
  { name: 'Ngưu', luminary: 'Kim', element: 'Kim', animal: 'Ngưu (Trâu)', isGood: false, shouldDo: 'Đi thuyền, cắt may áo mão.', shouldAvoid: 'Xây cất, trổ cửa, cưới gả, xuất hành đường bộ, gieo cấy, khai trương.' },
  { name: 'Nữ', luminary: 'Thổ', element: 'Thổ', animal: 'Bức (Dơi)', isGood: false, shouldDo: 'Kết màn, may áo.', shouldAvoid: 'Tháo nước, trổ cửa, kiện cáo, chôn cất.' },
  { name: 'Hư', luminary: 'Nhật', element: 'Hỏa', animal: 'Thử (Chuột)', isGood: false, shouldDo: 'Không hợp việc gì.', shouldAvoid: 'Xây cất, khai trương, cưới gả, trổ cửa, đào kênh, tháo nước.' },
  { name: 'Nguy', luminary: 'Nguyệt', element: 'Thủy', animal: 'Yến (Chim én)', isGood: false, shouldDo: 'Lót giường, chôn cất.', shouldAvoid: 'Dựng nhà, gác đòn dông, tháo nước, đào mương, đi thuyền, trổ cửa.' },
  { name: 'Thất', luminary: 'Hỏa', element: 'Hỏa', animal: 'Trư (Heo)', isGood: true, shouldDo: 'Mọi việc đều tốt, nhất là thủy lợi, đi thuyền, xây nhà, cưới gả, chôn cất.', shouldAvoid: 'Không kỵ việc gì.' },
  { name: 'Bích', luminary: 'Thủy', element: 'Thủy', animal: 'Du (Rái cá)', isGood: true, shouldDo: 'Mọi việc đều tốt, nhất là khai trương, xuất hành, xây nhà, cưới gả, chôn cất.', shouldAvoid: 'Không kỵ việc gì.' },
  { name: 'Khuê', luminary: 'Mộc', element: 'Mộc', animal: 'Lang (Chó sói)', isGood: false, shouldDo: 'Nhập học, cắt áo, dựng phòng, cầu công danh.', shouldAvoid: 'Chôn cất, trổ cửa, khai trương, đào giếng, kiện tụng, đóng giường.' },
  { name: 'Lâu', luminary: 'Kim', element: 'Kim', animal: 'Cẩu (Chó)', isGood: true, shouldDo: 'Dựng cột, cưới gả, trổ cửa, cất lầu, cắt áo, làm thủy lợi.', shouldAvoid: 'Đóng giường, lót giường, đi đường thủy.' },
  { name: 'Vị', luminary: 'Thổ', element: 'Thổ', animal: 'Trĩ (Chim trĩ)', isGood: true, shouldDo: 'Cưới gả, xây cất, dọn cỏ, gieo trồng.', shouldAvoid: 'Đi thuyền.' },
  { name: 'Mão', luminary: 'Nhật', element: 'Hỏa', animal: 'Kê (Gà)', isGood: false, shouldDo: 'Xây dựng, tạo tác.', shouldAvoid: 'Đại kỵ chôn cất; kỵ cưới gả, khai trương, xuất hành, trổ cửa.' },
  { name: 'Tất', luminary: 'Nguyệt', element: 'Thủy', animal: 'Ô (Quạ)', isGood: true, shouldDo: 'Trổ cửa, đào kênh, chôn cất, cưới gả, khai trương, xuất hành, nhập học.', shouldAvoid: 'Đi thuyền.' },
  { name: 'Chủy', luminary: 'Hỏa', element: 'Hỏa', animal: 'Hầu (Khỉ)', isGood: false, shouldDo: 'Không hợp việc gì.', shouldAvoid: 'Mọi việc, nhất là chôn cất và sửa mồ mả.' },
  { name: 'Sâm', luminary: 'Thủy', element: 'Thủy', animal: 'Viên (Vượn)', isGood: true, shouldDo: 'Xây cất, trổ cửa, nhập học, làm thủy lợi, đi thuyền.', shouldAvoid: 'Cưới gả, đóng giường, chôn cất, kết bạn.' },
  { name: 'Tỉnh', luminary: 'Mộc', element: 'Mộc', animal: 'Hãn (Dê trừu)', isGood: true, shouldDo: 'Trổ cửa, đào giếng, đi thuyền, xây cất, nhậm chức, nhập học.', shouldAvoid: 'Làm sinh phần, đóng thọ đường, chôn cất, sửa mộ.' },
  { name: 'Quỷ', luminary: 'Kim', element: 'Kim', animal: 'Dương (Dê)', isGood: false, shouldDo: 'Chôn cất, phát cỏ phá đất, cắt áo.', shouldAvoid: 'Trổ cửa, tháo nước, đào ao giếng, xây nhà, cưới gả, động thổ.' },
  { name: 'Liễu', luminary: 'Thổ', element: 'Thổ', animal: 'Chương (獐)', isGood: false, shouldDo: 'Không hợp việc gì.', shouldAvoid: 'Mọi việc, nhất là thủy lợi, chôn cất, sửa cửa, xây đắp.' },
  { name: 'Tinh', luminary: 'Nhật', element: 'Hỏa', animal: 'Mã (Ngựa)', isGood: false, shouldDo: 'Xây phòng mới.', shouldAvoid: 'Chôn cất, cưới gả, mở đường nước.' },
  { name: 'Trương', luminary: 'Nguyệt', element: 'Thủy', animal: 'Lộc (Nai)', isGood: true, shouldDo: 'Mọi việc đều tốt, nhất là xây nhà, trổ cửa, cưới gả, chôn cất, làm ruộng.', shouldAvoid: 'Làm hoặc hạ thủy thuyền mới.' },
  { name: 'Dực', luminary: 'Hỏa', element: 'Hỏa', animal: 'Xà (Rắn)', isGood: false, shouldDo: 'Cắt áo.', shouldAvoid: 'Chôn cất, xây nhà, gác đòn dông, cưới gả, trổ cửa, thủy lợi.' },
  { name: 'Chẩn', luminary: 'Thủy', element: 'Thủy', animal: 'Dẫn (Giun)', isGood: true, shouldDo: 'Mọi việc đều tốt, nhất là cưới gả, xây lầu gác, chôn cất, xuất hành.', shouldAvoid: 'Đi thuyền.' },
]

/** Sao Nhị thập bát tú trực ngày jd. Absolute phase is source-locked in the provenance audit. */
export function getMansion(jd: number): Mansion {
  const index = (((jd + 11) % 28) + 28) % 28
  return { index, ...MANSIONS[index] }
}

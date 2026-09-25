// Nhị thập bát tú: 28 sao luân phiên trực mỗi ngày.
//
// Nguồn đối chiếu: licham.vn (mục "Nhị Thập Bát Tú"), đối chiếu tháng 9/2026. Tốt/xấu theo cách
// ghi của licham.vn. Sao Nhật (Thái Dương) quy về hành Hỏa, sao Nguyệt (Thái Âm) quy về hành Thủy.
// Việc nên làm / nên kiêng được viết lại ngắn gọn.

import type { NguHanh } from './elements'

export interface Mansion {
  /** 0..27, 0 = Giác. */
  index: number
  /** Ví dụ "Ngưu". */
  name: string
  element: NguHanh
  /** Ví dụ "Ngưu (Trâu)". */
  animal: string
  isGood: boolean
  shouldDo: string
  shouldAvoid: string
}

type MansionRow = Omit<Mansion, 'index'>

const MANSIONS: readonly MansionRow[] = [
  {
    name: 'Giác',
    element: 'Mộc',
    animal: 'Giao (Giao long)',
    isGood: true,
    shouldDo: 'Khởi tạo mọi việc, cưới gả, cầu công danh, thi cử.',
    shouldAvoid: 'Chôn cất, sửa mồ mả.',
  },
  {
    name: 'Cang',
    element: 'Kim',
    animal: 'Long (Rồng)',
    isGood: false,
    shouldDo: 'Cắt may áo màn.',
    shouldAvoid: 'Chôn cất, cưới gả, kiện tụng, xây dựng nhà cửa.',
  },
  {
    name: 'Đê',
    element: 'Thổ',
    animal: 'Lạc (Lạc đà)',
    isGood: false,
    shouldDo: 'Không hợp việc lớn nào.',
    shouldAvoid: 'Khởi công xây dựng, chôn cất, cưới gả, xuất hành, nhất là đi đường thủy.',
  },
  {
    name: 'Phòng',
    element: 'Hỏa',
    animal: 'Thố (Thỏ)',
    isGood: true,
    shouldDo: 'Mọi việc đều tốt, nhất là cưới gả, xuất hành, xây nhà, chôn cất, mua bán lớn.',
    shouldAvoid: 'Không kỵ việc gì.',
  },
  {
    name: 'Tâm',
    element: 'Thủy',
    animal: 'Hồ (Chồn)',
    isGood: false,
    shouldDo: 'Không hợp việc gì.',
    shouldAvoid: 'Cưới gả, đóng giường, xây cất, chôn cất, kiện tụng.',
  },
  {
    name: 'Vĩ',
    element: 'Hỏa',
    animal: 'Hổ (Cọp)',
    isGood: true,
    shouldDo: 'Khởi tạo, chôn cất, cưới gả, xây cất, đào ao giếng, làm thủy lợi.',
    shouldAvoid: 'Đóng giường, đi thuyền, mua sắm lớn.',
  },
  {
    name: 'Cơ',
    element: 'Thủy',
    animal: 'Báo (Beo)',
    isGood: true,
    shouldDo: 'Chôn cất, khai trương, xuất hành, sửa mồ mả, trổ cửa, làm thủy lợi.',
    shouldAvoid: 'Đóng giường, lót giường, đi thuyền.',
  },
  {
    name: 'Đẩu',
    element: 'Mộc',
    animal: 'Giải (Cua)',
    isGood: true,
    shouldDo: 'Xây đắp, sửa mộ, trổ cửa, thủy lợi, may mặc, kinh doanh, cầu công danh.',
    shouldAvoid: 'Đi thuyền.',
  },
  {
    name: 'Ngưu',
    element: 'Kim',
    animal: 'Ngưu (Trâu)',
    isGood: false,
    shouldDo: 'Đi thuyền, cắt may áo mão.',
    shouldAvoid: 'Xây cất, trổ cửa, cưới gả, xuất hành đường bộ, gieo cấy, khai trương.',
  },
  {
    name: 'Nữ',
    element: 'Thổ',
    animal: 'Bức (Dơi)',
    isGood: false,
    shouldDo: 'Kết màn, may áo.',
    shouldAvoid: 'Tháo nước, trổ cửa, kiện cáo, chôn cất.',
  },
  {
    name: 'Hư',
    element: 'Hỏa',
    animal: 'Thử (Chuột)',
    isGood: false,
    shouldDo: 'Không hợp việc gì.',
    shouldAvoid: 'Xây cất, khai trương, cưới gả, trổ cửa, đào kênh, tháo nước.',
  },
  {
    name: 'Nguy',
    element: 'Thủy',
    animal: 'Yến (Chim én)',
    isGood: false,
    shouldDo: 'Lót giường, chôn cất.',
    shouldAvoid: 'Dựng nhà, gác đòn dông, tháo nước, đào mương, đi thuyền, trổ cửa.',
  },
  {
    name: 'Thất',
    element: 'Hỏa',
    animal: 'Trư (Heo)',
    isGood: true,
    shouldDo: 'Mọi việc đều tốt, nhất là thủy lợi, đi thuyền, xây nhà, cưới gả, chôn cất.',
    shouldAvoid: 'Không kỵ việc gì.',
  },
  {
    name: 'Bích',
    element: 'Thủy',
    animal: 'Du (Rái cá)',
    isGood: true,
    shouldDo: 'Mọi việc đều tốt, nhất là khai trương, xuất hành, xây nhà, cưới gả, chôn cất.',
    shouldAvoid: 'Không kỵ việc gì.',
  },
  {
    name: 'Khuê',
    element: 'Mộc',
    animal: 'Lang (Chó sói)',
    isGood: false,
    shouldDo: 'Nhập học, cắt áo, dựng phòng, cầu công danh.',
    shouldAvoid: 'Chôn cất, trổ cửa, khai trương, đào giếng, kiện tụng, đóng giường.',
  },
  {
    name: 'Lâu',
    element: 'Kim',
    animal: 'Cẩu (Chó)',
    isGood: true,
    shouldDo: 'Dựng cột, cưới gả, trổ cửa, cất lầu, cắt áo, làm thủy lợi.',
    shouldAvoid: 'Đóng giường, lót giường, đi đường thủy.',
  },
  {
    name: 'Vị',
    element: 'Thổ',
    animal: 'Trĩ (Chim trĩ)',
    isGood: true,
    shouldDo: 'Cưới gả, xây cất, dọn cỏ, gieo trồng.',
    shouldAvoid: 'Đi thuyền.',
  },
  {
    name: 'Mão',
    element: 'Hỏa',
    animal: 'Kê (Gà)',
    isGood: false,
    shouldDo: 'Xây dựng, tạo tác.',
    shouldAvoid: 'Đại kỵ chôn cất; kỵ cưới gả, khai trương, xuất hành, trổ cửa.',
  },
  {
    name: 'Tất',
    element: 'Thủy',
    animal: 'Ô (Quạ)',
    isGood: true,
    shouldDo: 'Trổ cửa, đào kênh, chôn cất, cưới gả, khai trương, xuất hành, nhập học.',
    shouldAvoid: 'Đi thuyền.',
  },
  {
    name: 'Chủy',
    element: 'Hỏa',
    animal: 'Hầu (Khỉ)',
    isGood: false,
    shouldDo: 'Không hợp việc gì.',
    shouldAvoid: 'Mọi việc, nhất là chôn cất và sửa mồ mả.',
  },
  {
    name: 'Sâm',
    element: 'Thủy',
    animal: 'Viên (Vượn)',
    isGood: true,
    shouldDo: 'Xây cất, trổ cửa, nhập học, làm thủy lợi, đi thuyền.',
    shouldAvoid: 'Cưới gả, đóng giường, chôn cất, kết bạn.',
  },
  {
    name: 'Tỉnh',
    element: 'Mộc',
    animal: 'Hãn (Dê trừu)',
    isGood: true,
    shouldDo: 'Trổ cửa, đào giếng, đi thuyền, xây cất, nhậm chức, nhập học.',
    shouldAvoid: 'Làm sinh phần, đóng thọ đường, chôn cất, sửa mộ.',
  },
  {
    name: 'Quỷ',
    element: 'Kim',
    animal: 'Dương (Dê)',
    isGood: false,
    shouldDo: 'Chôn cất, phát cỏ phá đất, cắt áo.',
    shouldAvoid: 'Trổ cửa, tháo nước, đào ao giếng, xây nhà, cưới gả, động thổ.',
  },
  {
    name: 'Liễu',
    element: 'Thổ',
    animal: 'Chương (Gấu ngựa)',
    isGood: false,
    shouldDo: 'Không hợp việc gì.',
    shouldAvoid: 'Mọi việc, nhất là thủy lợi, chôn cất, sửa cửa, xây đắp.',
  },
  {
    name: 'Tinh',
    element: 'Hỏa',
    animal: 'Mã (Ngựa)',
    isGood: false,
    shouldDo: 'Xây phòng mới.',
    shouldAvoid: 'Chôn cất, cưới gả, mở đường nước.',
  },
  {
    name: 'Trương',
    element: 'Thủy',
    animal: 'Lộc (Nai)',
    isGood: true,
    shouldDo: 'Mọi việc đều tốt, nhất là xây nhà, trổ cửa, cưới gả, chôn cất, làm ruộng.',
    shouldAvoid: 'Làm hoặc hạ thủy thuyền mới.',
  },
  {
    name: 'Dực',
    element: 'Hỏa',
    animal: 'Xà (Rắn)',
    isGood: false,
    shouldDo: 'Cắt áo.',
    shouldAvoid: 'Chôn cất, xây nhà, gác đòn dông, cưới gả, trổ cửa, thủy lợi.',
  },
  {
    name: 'Chẩn',
    element: 'Thủy',
    animal: 'Dẫn (Giun)',
    isGood: true,
    shouldDo: 'Mọi việc đều tốt, nhất là cưới gả, xây lầu gác, chôn cất, xuất hành.',
    shouldAvoid: 'Đi thuyền.',
  },
]

/** Sao Nhị thập bát tú trực ngày jd. Ngày 25/9/2026 là sao Ngưu. */
export function getMansion(jd: number): Mansion {
  const index = (((jd + 11) % 28) + 28) % 28
  return { index, ...MANSIONS[index] }
}

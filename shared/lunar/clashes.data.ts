// Tuổi xung với một Can Chi (dùng cho cả xung ngày và xung tháng).
//
// Nguồn: licham.vn (mục "Tuổi xung" của ngày), đối chiếu 2025–2026. licham.vn không ghi xung
// tháng, nên xung tháng dùng cùng bảng này với Can Chi của tháng. Đã sửa lỗi chính tả, thống nhất
// cách viết "Tỵ"; 4 dòng licham.vn để trống được lấy từ lichviet.me
// (trang này ghi xung ngày cùng thứ tự và cách chọn với licham.vn).

/** Theo thứ tự 60 Hoa Giáp (0 = Giáp Tý). */
export const CLASHES: readonly (readonly string[])[] = [
  // Giáp Tý
  ['Mậu Ngọ', 'Nhâm Ngọ', 'Canh Dần', 'Canh Thân'],
  // Ất Sửu
  ['Kỷ Mùi', 'Quý Mùi', 'Tân Mão', 'Tân Dậu'],
  // Bính Dần
  ['Giáp Thân', 'Nhâm Thân', 'Nhâm Tuất', 'Nhâm Thìn'],
  // Đinh Mão
  ['Ất Dậu', 'Quý Dậu', 'Quý Tỵ', 'Quý Hợi'],
  // Mậu Thìn
  ['Canh Tuất', 'Bính Tuất'],
  // Kỷ Tỵ (licham.vn để trống, lấy từ lichviet.me)
  ['Tân Hợi', 'Đinh Hợi'],
  // Canh Ngọ
  ['Nhâm Tý', 'Bính Tý', 'Giáp Thân', 'Giáp Dần'],
  // Tân Mùi
  ['Quý Sửu', 'Đinh Sửu', 'Ất Dậu', 'Ất Mão'],
  // Nhâm Thân
  ['Bính Dần', 'Canh Dần', 'Bính Thân'],
  // Quý Dậu
  ['Đinh Mão', 'Tân Mão', 'Đinh Dậu'],
  // Giáp Tuất
  ['Nhâm Thìn', 'Canh Thìn', 'Canh Tuất'],
  // Ất Hợi
  ['Quý Tỵ', 'Tân Tỵ', 'Tân Hợi'],
  // Bính Tý
  ['Canh Ngọ', 'Mậu Ngọ'],
  // Đinh Sửu
  ['Tân Mùi', 'Kỷ Mùi'],
  // Mậu Dần
  ['Canh Thân', 'Giáp Thân'],
  // Kỷ Mão
  ['Tân Dậu', 'Ất Dậu'],
  // Canh Thìn
  ['Giáp Tuất', 'Mậu Tuất', 'Giáp Thìn'],
  // Tân Tỵ (licham.vn để trống, lấy từ lichviet.me)
  ['Ất Hợi', 'Kỷ Hợi', 'Ất Tỵ'],
  // Nhâm Ngọ
  ['Giáp Tý', 'Canh Tý', 'Bính Tuất', 'Bính Thìn'],
  // Quý Mùi
  ['Ất Sửu', 'Tân Sửu', 'Đinh Hợi', 'Đinh Tỵ'],
  // Giáp Thân
  ['Mậu Dần', 'Bính Dần', 'Canh Ngọ', 'Canh Tý'],
  // Ất Dậu
  ['Kỷ Mão', 'Đinh Mão', 'Tân Mùi', 'Tân Sửu'],
  // Bính Tuất
  ['Mậu Thìn', 'Nhâm Thìn', 'Nhâm Ngọ', 'Nhâm Tý'],
  // Đinh Hợi
  ['Kỷ Tỵ', 'Quý Tỵ', 'Quý Mùi', 'Quý Sửu'],
  // Mậu Tý
  ['Bính Ngọ', 'Giáp Ngọ'],
  // Kỷ Sửu
  ['Đinh Mùi', 'Ất Mùi'],
  // Canh Dần
  ['Nhâm Thân', 'Mậu Thân', 'Giáp Tý', 'Giáp Ngọ'],
  // Tân Mão
  ['Quý Dậu', 'Kỷ Dậu', 'Ất Sửu', 'Ất Mùi'],
  // Nhâm Thìn
  ['Bính Tuất', 'Giáp Tuất', 'Bính Dần'],
  // Quý Tỵ (licham.vn để trống, lấy từ lichviet.me)
  ['Đinh Hợi', 'Ất Hợi', 'Đinh Mão'],
  // Giáp Ngọ (licham.vn ghi Nhâm Dần; theo xemngay.com, thoigian.com.vn và dòng Giáp Tý là Canh Thân)
  ['Mậu Tý', 'Nhâm Tý', 'Canh Dần', 'Canh Thân'],
  // Ất Mùi
  ['Kỷ Sửu', 'Quý Sửu', 'Tân Mão', 'Tân Dậu'],
  // Bính Thân
  ['Giáp Dần', 'Nhâm Thân', 'Nhâm Tuất', 'Nhâm Thìn'],
  // Đinh Dậu
  ['Ất Mão', 'Quý Mão', 'Quý Tỵ', 'Quý Hợi'],
  // Mậu Tuất
  ['Canh Thìn', 'Bính Thìn'],
  // Kỷ Hợi
  ['Tân Tỵ', 'Đinh Tỵ'],
  // Canh Tý
  ['Nhâm Ngọ', 'Bính Ngọ', 'Giáp Thân', 'Giáp Dần'],
  // Tân Sửu
  ['Quý Mùi', 'Đinh Mùi', 'Ất Dậu', 'Ất Mão'],
  // Nhâm Dần
  ['Canh Thân', 'Bính Thân', 'Bính Dần'],
  // Quý Mão
  ['Tân Dậu', 'Đinh Dậu', 'Đinh Mão'],
  // Giáp Thìn
  ['Nhâm Tuất', 'Canh Tuất', 'Canh Thìn'],
  // Ất Tỵ
  ['Quý Hợi', 'Tân Hợi', 'Tân Tỵ'],
  // Bính Ngọ
  ['Mậu Tý', 'Canh Tý'],
  // Đinh Mùi
  ['Kỷ Sửu', 'Tân Sửu'],
  // Mậu Thân
  ['Canh Dần', 'Giáp Dần'],
  // Kỷ Dậu
  ['Tân Mão', 'Ất Mão'],
  // Canh Tuất
  ['Giáp Thìn', 'Mậu Thìn', 'Giáp Tuất'],
  // Tân Hợi
  ['Ất Tỵ', 'Kỷ Tỵ', 'Ất Hợi'],
  // Nhâm Tý
  ['Giáp Ngọ', 'Canh Ngọ', 'Bính Tuất', 'Bính Thìn'],
  // Quý Sửu
  ['Ất Mùi', 'Tân Mùi', 'Đinh Hợi', 'Đinh Tỵ'],
  // Giáp Dần
  ['Mậu Thân', 'Bính Thân', 'Canh Ngọ', 'Canh Tý'],
  // Ất Mão
  ['Kỷ Dậu', 'Đinh Dậu', 'Tân Mùi', 'Tân Sửu'],
  // Bính Thìn
  ['Mậu Tuất', 'Nhâm Tuất', 'Nhâm Ngọ', 'Nhâm Tý'],
  // Đinh Tỵ (licham.vn để trống, lấy từ lichviet.me)
  ['Kỷ Hợi', 'Quý Hợi', 'Quý Sửu', 'Quý Tỵ', 'Quý Mùi'],
  // Mậu Ngọ
  ['Bính Tý', 'Giáp Tý'],
  // Kỷ Mùi
  ['Đinh Sửu', 'Ất Sửu'],
  // Canh Thân
  ['Nhâm Dần', 'Mậu Dần', 'Giáp Tý', 'Giáp Ngọ'],
  // Tân Dậu
  ['Quý Mão', 'Kỷ Mão', 'Ất Sửu', 'Ất Mùi'],
  // Nhâm Tuất
  ['Bính Thìn', 'Giáp Thìn', 'Bính Thân', 'Bính Dần'],
  // Quý Hợi
  ['Đinh Tỵ', 'Ất Tỵ', 'Đinh Mão', 'Đinh Dậu'],
]

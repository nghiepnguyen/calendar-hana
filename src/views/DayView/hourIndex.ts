/** Chỉ số giờ (0 = Tý ... 11 = Hợi) chứa số phút `minutes` trong ngày. Giờ Tý là 23h–1h. */
export function hourIndexAt(minutes: number): number {
  return Math.floor((minutes / 60 + 1) / 2) % 12
}

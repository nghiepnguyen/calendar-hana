import type { TextSize } from '@shared/types'

/**
 * Cỡ chữ toàn app. Mỗi mức ứng với một tỉ lệ --ui-scale trong theme.css: mọi cỡ chữ, icon,
 * vùng bấm và khoảng cách viết dạng calc(Npx * var(--ui-scale)), nên mức "default" (1) giữ
 * nguyên từng pixel như trước.
 *
 * Icon Phosphor nhận size="1em" và lấy cỡ từ font-size của phần tử bọc ngoài, để icon phóng
 * theo cùng biến CSS mà không cần React vẽ lại.
 */
export const TEXT_SIZES: readonly TextSize[] = ['default', 'large', 'xlarge']

/** Phải khớp với các quy tắc [data-text-size] trong theme.css và script đầu index.html. */
export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
  default: 1,
  large: 1.25,
  xlarge: 1.5,
}

export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  default: 'Mặc định',
  large: 'Lớn',
  xlarge: 'Rất lớn',
}

/**
 * Bản sao cài đặt trong localStorage để script đầu index.html đặt thuộc tính lên <html> trước
 * lần vẽ đầu tiên, vì Settings đọc từ IndexedDB/Firestore xong thì trang đã hiện rồi.
 */
export const TEXT_SIZE_STORAGE_KEY = 'hana:text-size'
export const BOLD_TEXT_STORAGE_KEY = 'hana:bold-text'

export function isTextSize(value: unknown): value is TextSize {
  return value === 'default' || value === 'large' || value === 'xlarge'
}

/**
 * Cỡ icon theo tỉ lệ cỡ chữ: <Plus size={iconSize(16)} />. Phosphor đặt giá trị vào thuộc tính
 * width/height của <svg>, và trình duyệt nhận calc() với biến CSS ở đó, nên icon đổi cỡ ngay
 * khi đổi mức mà không cần React vẽ lại.
 */
export function iconSize(px: number): string {
  return `calc(${px}px * var(--ui-scale))`
}

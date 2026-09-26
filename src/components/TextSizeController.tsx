import { useEffect } from 'react'
import { useSettings } from '../hooks/useRepositoryData'
import { BOLD_TEXT_STORAGE_KEY, TEXT_SIZE_STORAGE_KEY } from '../styles/textSize'

/**
 * Đặt data-text-size và data-bold-text trên <html> theo cài đặt, và lưu bản sao vào
 * localStorage cho script đầu index.html. Mức 'default' thì bỏ thuộc tính.
 */
export function TextSizeController() {
  const settings = useSettings()
  const textSize = settings?.textSize
  const boldText = settings?.boldText
  useEffect(() => {
    // Settings chưa tải xong: giữ nguyên thuộc tính script đầu trang đã đặt, tránh nháy.
    if (textSize === undefined || boldText === undefined) return
    const root = document.documentElement
    if (textSize === 'default') root.removeAttribute('data-text-size')
    else root.setAttribute('data-text-size', textSize)
    if (boldText) root.setAttribute('data-bold-text', '')
    else root.removeAttribute('data-bold-text')
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, textSize)
      localStorage.setItem(BOLD_TEXT_STORAGE_KEY, boldText ? '1' : '0')
    } catch {
      // Chế độ riêng tư hoặc bị chặn lưu trữ: lần mở sau sẽ nháy cỡ mặc định một chút, không sao.
    }
  }, [textSize, boldText])
  return null
}

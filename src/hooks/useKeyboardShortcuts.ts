import { useEffect, useRef } from 'react'

export type ShortcutMap = Record<string, () => void>

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Phím tắt toàn trang. Bỏ qua khi đang gõ trong ô nhập, khi có phím Ctrl/Cmd/Alt,
 * hoặc khi đang mở hộp thoại.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  const ref = useRef(shortcuts)
  useEffect(() => {
    ref.current = shortcuts
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const action = ref.current[key]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])
}

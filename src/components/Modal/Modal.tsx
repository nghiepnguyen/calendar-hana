import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import styles from './Modal.module.css'

interface ModalProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** 'md': form (toàn màn hình trên điện thoại); 'sm': hộp thoại xác nhận. */
  size?: 'sm' | 'md'
  /** Phần tử nhận focus đầu tiên (mặc định là ô nhập / nút đầu tiên). */
  initialFocusSelector?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Khoá cuộn trang dùng chung cho mọi hộp thoại đang mở. Đếm số hộp thoại thay vì mỗi hộp
// thoại tự lưu/trả lại overflow: nhiều hộp thoại đóng cùng lúc theo thứ tự bất kỳ sẽ trả
// nhầm 'hidden' và khoá cuộn vĩnh viễn (trang Danh sách cuộn bằng window nên bị kẹt).
let scrollLocks = 0
let savedOverflow = ''

function lockScroll() {
  if (scrollLocks++ === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function unlockScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = savedOverflow
}

/** Hộp thoại có focus trap, Esc để đóng, trả focus về chỗ cũ khi đóng. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
  initialFocusSelector,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first =
      (initialFocusSelector && dialog?.querySelector<HTMLElement>(initialFocusSelector)) ||
      dialog?.querySelector<HTMLElement>('input, select, textarea') ||
      dialog?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (!dialog) return
      // Chỉ hộp thoại trên cùng xử lý phím.
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      if (dialogs[dialogs.length - 1] !== dialog) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    lockScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockScroll()
      previous?.focus?.()
    }
  }, [initialFocusSelector])

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`glass ${styles.dialog} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

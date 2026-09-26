import { useEffect } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { InToastRegion } from './ToastRegion'
import { iconSize } from '../../styles/textSize'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  onDone: () => void
  /** Thời gian hiện, mili giây. */
  duration?: number
}

/** Thông báo ngắn nổi ở đáy màn hình, tự ẩn. */
export function Toast({ message, onDone, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, duration)
    return () => window.clearTimeout(timer)
  }, [message, onDone, duration])

  return (
    <InToastRegion>
      <div className={`glass ${styles.toast}`} role="status">
        <CheckCircle size={iconSize(20)} weight="fill" className={styles.icon} aria-hidden="true" />
        <span>{message}</span>
      </div>
    </InToastRegion>
  )
}

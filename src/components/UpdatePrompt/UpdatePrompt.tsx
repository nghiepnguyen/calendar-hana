import { useEffect } from 'react'
import { ArrowClockwise, CloudCheck, X } from '@phosphor-icons/react'
import { useAppUpdateStore } from '../../store/appUpdateStore'
import { InToastRegion } from '../Toast/ToastRegion'
import styles from './UpdatePrompt.module.css'

/** Thông báo nhỏ ở cuối màn hình: có phiên bản mới, hoặc app đã dùng được offline. */
export function UpdatePrompt() {
  const { needRefresh, offlineReady, update, dismiss } = useAppUpdateStore()

  // "Đã dùng được offline" chỉ là thông tin, tự ẩn.
  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const timer = setTimeout(dismiss, 5000)
    return () => clearTimeout(timer)
  }, [offlineReady, needRefresh, dismiss])

  if (!needRefresh && !offlineReady) return null

  return (
    <InToastRegion>
      <div className={`glass ${styles.toast}`} role="status">
        {needRefresh ? (
          <>
            <ArrowClockwise size={20} weight="bold" className={styles.icon} aria-hidden="true" />
            <span className={styles.text}>Có phiên bản mới.</span>
            <button type="button" className="btn btn-primary" onClick={update}>
              Cập nhật
            </button>
            <button type="button" className="btn btn-ghost" onClick={dismiss}>
              Để sau
            </button>
          </>
        ) : (
          <>
            <CloudCheck size={20} weight="bold" className={styles.icon} aria-hidden="true" />
            <span className={styles.text}>App đã dùng được khi không có mạng.</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={dismiss}
              aria-label="Đóng"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </InToastRegion>
  )
}

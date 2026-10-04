import { useEffect } from 'react'
import { ArrowClockwise, CloudCheck, X } from '@phosphor-icons/react'
import { useAppUpdateStore } from '../../store/appUpdateStore'
import { InToastRegion } from '../Toast/ToastRegion'
import { iconSize } from '../../styles/textSize'
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
      <div className={`glass ${styles.toast} ${needRefresh ? styles.updateToast : ''}`} role={needRefresh ? 'alert' : 'status'}>
        {needRefresh ? (
          <>
            <ArrowClockwise
              size={iconSize(24)}
              weight="bold"
              className={styles.icon}
              aria-hidden="true"
            />
            <div className={styles.updateMessage}>
              <strong className={styles.updateTitle}>Có phiên bản mới.</strong>
              <span className={styles.updateHint}>Cập nhật để dùng bản mới nhất.</span>
            </div>
            <div className={styles.updateActions}>
              <button type="button" className="btn btn-primary" onClick={update}>
                Cập nhật
              </button>
              <button type="button" className="btn btn-ghost" onClick={dismiss}>
                Để sau
              </button>
            </div>
          </>
        ) : (
          <>
            <CloudCheck
              size={iconSize(20)}
              weight="bold"
              className={styles.icon}
              aria-hidden="true"
            />
            <span className={styles.text}>App đã dùng được khi không có mạng.</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={dismiss}
              aria-label="Đóng"
            >
              <X size={iconSize(16)} weight="bold" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </InToastRegion>
  )
}

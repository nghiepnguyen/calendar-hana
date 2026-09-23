import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { hasLocalData } from '../../data/hasLocalData'
import { getLocalRepository } from '../../data/repositoryContext'
import { CANONICAL_HOST, canonicalUrl } from './canonicalHost'
import styles from './DomainMove.module.css'

/**
 * App đã chuyển sang tên miền riêng. Dữ liệu lưu trên máy gắn với từng tên miền nên không tự đi theo:
 * - Máy không có dữ liệu local: chuyển thẳng sang tên miền mới.
 * - Máy có dữ liệu local: hiện hướng dẫn xuất dữ liệu rồi nhập ở địa chỉ mới.
 */
export function DomainMove() {
  const [target] = useState(() => canonicalUrl(window.location))
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    if (!target) return
    let cancelled = false
    hasLocalData(getLocalRepository())
      .then((has) => {
        if (cancelled) return
        if (has) setShowNotice(true)
        else window.location.replace(target)
      })
      .catch(() => !cancelled && setShowNotice(true))
    return () => {
      cancelled = true
    }
  }, [target])

  if (!target || !showNotice) return null

  return (
    <div className={`glass ${styles.notice}`} role="status">
      <p className={styles.text}>
        Lịch Hana đã chuyển sang <strong>{CANONICAL_HOST}</strong>. Dữ liệu trên máy này không tự
        chuyển theo: vào Cài đặt, bấm Xuất dữ liệu, rồi Nhập ở địa chỉ mới.
      </p>
      <div className={styles.actions}>
        <Link to="/settings" className="btn">
          Xuất dữ liệu
        </Link>
        <a href={target} className="btn btn-primary">
          Mở địa chỉ mới
        </a>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Ẩn thông báo"
          onClick={() => setShowNotice(false)}
        >
          <X size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

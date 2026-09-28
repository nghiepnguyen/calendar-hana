import { useEffect, useState } from 'react'
import { HandSwipeLeft, X } from '@phosphor-icons/react'
import { track } from '../../analytics'
import type { ViewMode } from '../../calendar/range'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { iconSize } from '../../styles/textSize'
import { InToastRegion } from '../Toast/ToastRegion'
import styles from './SwipeHint.module.css'

/** Đã hiện gợi ý vuốt trên máy này. */
export const SWIPE_HINT_STORAGE_KEY = 'hana:swipe-hint-seen'

/** Chờ màn lịch hiện xong rồi mới gợi ý (ms). */
export const HINT_DELAY_MS = 1000
/** Gợi ý tự ẩn sau (ms). */
export const HINT_DURATION_MS = 8000
/** Thời gian mờ dần khi ẩn (ms). */
const LEAVE_MS = 200

export type HintDismissReason = 'swipe' | 'close' | 'timeout'

type Phase = 'waiting' | 'visible' | 'leaving' | 'done'

const UNIT: Record<ViewMode, string> = { day: 'ngày', week: 'tuần', month: 'tháng' }

function hasSeenHint(): boolean {
  try {
    return localStorage.getItem(SWIPE_HINT_STORAGE_KEY) === '1'
  } catch {
    // Bị chặn lưu trữ thì không nhớ được đã gợi ý: thà không hiện còn hơn hiện mỗi lần mở.
    return true
  }
}

function markHintSeen() {
  try {
    localStorage.setItem(SWIPE_HINT_STORAGE_KEY, '1')
  } catch {
    // Không lưu được thì thôi.
  }
}

function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null
}

interface SwipeHintProps {
  view: ViewMode
  /** Số lần đã đổi trang bằng vuốt; tăng lên là người dùng đã biết vuốt. */
  swipeCount: number
  /** Có bảng che vùng lịch (tìm kiếm...): chờ đóng rồi mới gợi ý. */
  blocked: boolean
}

/** Gợi ý "vuốt ngang để đổi ngày", hiện một lần trên máy cảm ứng. */
export function SwipeHint({ view, swipeCount, blocked }: SwipeHintProps) {
  const touch = useMediaQuery('(pointer: coarse)')
  const [phase, setPhase] = useState<Phase>(() => (hasSeenHint() ? 'done' : 'waiting'))
  const [reason, setReason] = useState<HintDismissReason>('close')
  const [seenCount, setSeenCount] = useState(swipeCount)

  const dismiss = (why: HintDismissReason) => {
    if (phase !== 'visible') return
    setReason(why)
    setPhase('leaving')
  }

  // Đã tự vuốt được: không cần nhắc nữa. Cập nhật ngay trong lúc render, không đợi effect.
  if (swipeCount !== seenCount) {
    setSeenCount(swipeCount)
    if (phase === 'waiting') setPhase('done')
    else dismiss('swipe')
  }

  useEffect(() => {
    if (phase !== 'waiting' || !touch || blocked) return
    let timer = 0
    const wait = () => {
      timer = window.setTimeout(() => {
        // Hộp thoại (chào mừng, chuyển dữ liệu...) đang mở: chờ thêm.
        if (isDialogOpen()) return wait()
        markHintSeen()
        setPhase('visible')
      }, HINT_DELAY_MS)
    }
    wait()
    return () => window.clearTimeout(timer)
  }, [phase, touch, blocked])

  useEffect(() => {
    if (phase === 'visible') {
      const timer = window.setTimeout(() => {
        setReason('timeout')
        setPhase('leaving')
      }, HINT_DURATION_MS)
      return () => window.clearTimeout(timer)
    }
    if (phase === 'leaving') {
      track('swipe_hint_dismissed', { reason })
      const timer = window.setTimeout(() => setPhase('done'), LEAVE_MS)
      return () => window.clearTimeout(timer)
    }
  }, [phase, reason])

  if (phase !== 'visible' && phase !== 'leaving') return null

  return (
    <InToastRegion>
      <div
        className={`glass ${styles.hint}`}
        role="status"
        data-leaving={phase === 'leaving' || undefined}
      >
        <HandSwipeLeft size={iconSize(22)} className={styles.hand} aria-hidden="true" />
        <span>Vuốt ngang để sang {UNIT[view]} khác</span>
        <button
          type="button"
          className={`btn btn-ghost btn-icon ${styles.close}`}
          aria-label="Đóng gợi ý"
          onClick={() => dismiss('close')}
        >
          <X size={iconSize(16)} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </InToastRegion>
  )
}

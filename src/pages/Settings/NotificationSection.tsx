import { useEffect, useMemo, useState } from 'react'
import { notificationHelp } from '../../reminders/notificationHelp'
import { showTestNotification, useNotificationStore } from '../../reminders/notifications'
import styles from './SettingsPage.module.css'

const STATUS: Record<string, string> = {
  granted: 'Đã bật',
  denied: 'Đang bị chặn',
  default: 'Chưa bật',
  unsupported: 'Không hỗ trợ',
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className={styles.helpBlock}>
      <p className={styles.rowLabel}>{title}</p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

/** Trạng thái quyền thông báo, nút bật / gửi thử và hướng dẫn khi bị chặn. */
export function NotificationSection() {
  const permission = useNotificationStore((s) => s.permission)
  const request = useNotificationStore((s) => s.request)
  const refresh = useNotificationStore((s) => s.refresh)
  const [tested, setTested] = useState(false)
  const help = useMemo(
    () => notificationHelp(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    [],
  )

  // Người dùng đổi quyền trong cài đặt trình duyệt rồi quay lại tab.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const test = async () => {
    try {
      setTested(await showTestNotification())
    } catch (error) {
      console.warn('Không hiện được thông báo thử', error)
      setTested(true)
    }
  }

  return (
    <>
      <div className={styles.toggleRow}>
        <span>
          <span className={styles.rowLabel}>Thông báo của trình duyệt</span>
          <span
            className={permission === 'denied' ? 'field-error' : 'field-hint'}
            data-testid="notification-status"
          >
            {STATUS[permission]}
          </span>
        </span>
        {permission === 'default' ? (
          <button type="button" className="btn btn-primary" onClick={() => void request()}>
            Bật thông báo
          </button>
        ) : null}
        {permission === 'granted' ? (
          <button type="button" className="btn" onClick={() => void test()}>
            Gửi thông báo thử
          </button>
        ) : null}
      </div>

      {permission === 'denied' ? (
        <div className={styles.help} role="status">
          <p className="field-hint">
            Bạn sẽ không nhận được nhắc hẹn cho tới khi cho phép lại. Trang web không thể tự hỏi lại
            quyền sau khi đã bị chặn, bạn cần bật trong cài đặt:
          </p>
          <Steps title="Trong trình duyệt" steps={help.browserSteps} />
          <Steps title="Nếu vẫn không thấy thông báo" steps={help.systemSteps} />
        </div>
      ) : null}

      {permission === 'granted' && tested ? (
        <div className={styles.help} role="status">
          <p className="field-hint">
            Đã gửi thông báo thử. Nếu không thấy, hệ điều hành đang chặn thông báo của trình duyệt:
          </p>
          <Steps title="Cách bật" steps={help.systemSteps} />
        </div>
      ) : null}

      {permission === 'unsupported' ? (
        <div className={styles.help}>
          <p className="field-hint">Trình duyệt này không hỗ trợ thông báo.</p>
          {help.platform === 'ios' ? (
            <Steps title="Trên iPhone/iPad" steps={help.browserSteps} />
          ) : null}
        </div>
      ) : null}
    </>
  )
}

import { useMemo, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { detectPlatform } from '../../reminders/notificationHelp'
import { useInstallStore } from '../../store/installStore'
import styles from './SettingsPage.module.css'

const IOS_STEPS = [
  'Mở trang này bằng Safari (iOS 16.4 trở lên cũng dùng được Chrome, Edge).',
  'Bấm nút Chia sẻ (hình vuông có mũi tên hướng lên) ở thanh dưới hoặc cạnh thanh địa chỉ.',
  'Kéo xuống, chọn “Thêm vào Màn hình chính” (Add to Home Screen).',
  'Bấm “Thêm”. Từ giờ mở Lịch Việt bằng biểu tượng trên Màn hình chính.',
]

const ANDROID_STEPS = [
  'Mở trang này bằng Chrome.',
  'Bấm nút menu ⋮ ở góc trên bên phải.',
  'Chọn “Cài đặt ứng dụng” (Install app) hoặc “Thêm vào màn hình chính”.',
  'Bấm “Cài đặt”. Lịch Việt sẽ có trên màn hình chính và trong danh sách ứng dụng.',
]

const IOS_NOTE =
  'Trên iPhone/iPad, nhắc hẹn chỉ hiện được khi mở app từ Màn hình chính (cần iOS 16.4 trở lên).'
const ANDROID_NOTE = 'Samsung Internet: bấm menu ≡ → Thêm trang vào → Màn hình chính.'

function Guide({ steps, note }: { steps: string[]; note: string }) {
  return (
    <>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="field-hint">{note}</p>
    </>
  )
}

/** Nút cài app (Chrome/Edge) và hướng dẫn thêm vào màn hình chính trên iOS, Android. */
export function InstallSection() {
  const standalone = useMediaQuery('(display-mode: standalone)')
  const canPrompt = useInstallStore((s) => s.canPrompt)
  const installed = useInstallStore((s) => s.installed)
  const prompt = useInstallStore((s) => s.prompt)
  const [declined, setDeclined] = useState(false)
  const platform = useMemo(
    () => detectPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    [],
  )

  if (standalone || installed) {
    return (
      <p className={`field-hint ${styles.help}`} data-testid="install-status">
        Bạn đang dùng Lịch Việt dạng app đã cài.
      </p>
    )
  }

  const install = async () => setDeclined(!(await prompt()))

  const ios = { title: 'iPhone, iPad', steps: IOS_STEPS, note: IOS_NOTE }
  const android = { title: 'Android', steps: ANDROID_STEPS, note: ANDROID_NOTE }
  // Hướng dẫn cho máy đang dùng hiện sẵn, máy còn lại thu gọn.
  const guides = platform === 'android' ? [android, ios] : [ios, android]
  const onPhone = platform === 'ios' || platform === 'android'

  return (
    <>
      <div className={styles.toggleRow}>
        <span>
          <span className={styles.rowLabel}>Thêm Lịch Việt vào màn hình chính</span>
          <span className="field-hint">
            Mở nhanh như app thường, toàn màn hình, dùng được khi mất mạng.
          </span>
        </span>
        {canPrompt ? (
          <button type="button" className="btn btn-primary" onClick={() => void install()}>
            Cài app
          </button>
        ) : null}
      </div>
      {declined ? (
        <p className="field-hint">Chưa cài. Bạn có thể cài lại theo hướng dẫn bên dưới.</p>
      ) : null}

      <div className={styles.help}>
        {guides.map((guide, index) =>
          onPhone && index === 0 ? (
            <div key={guide.title} className={styles.helpBlock}>
              <p className={styles.rowLabel}>{guide.title}</p>
              <Guide steps={guide.steps} note={guide.note} />
            </div>
          ) : (
            <details key={guide.title} className={styles.helpBlock}>
              <summary className={styles.rowLabel}>{guide.title}</summary>
              <Guide steps={guide.steps} note={guide.note} />
            </details>
          ),
        )}
        {onPhone ? null : (
          <p className="field-hint">
            Trên máy tính (Chrome, Edge): bấm biểu tượng cài đặt ở cuối thanh địa chỉ.
          </p>
        )}
      </div>
    </>
  )
}

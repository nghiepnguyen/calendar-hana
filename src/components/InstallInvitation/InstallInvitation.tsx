import { useRef, useState } from 'react'
import {
  X,
  DownloadSimple,
  WifiSlash,
  ArrowSquareOut,
  ArrowRight,
  ArrowLeft,
  Info,
} from '@phosphor-icons/react'
import { useInstallInvitation } from '../../hooks/useInstallInvitation'
import { useInstallStore } from '../../store/installStore'
import { detectPlatform } from '../../reminders/notificationHelp'
import { IOS_STEPS, ANDROID_STEPS, DESKTOP_STEPS } from '../../pages/Settings/installGuideData'
import { iconSize } from '../../styles/textSize'
import styles from './InstallInvitation.module.css'

export function InstallInvitation({ startedAt }: { startedAt?: number }) {
  const { visible, dismiss } = useInstallInvitation(startedAt)
  const canPrompt = useInstallStore((s) => s.canPrompt)
  const prompt = useInstallStore((s) => s.prompt)
  const [guide, setGuide] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const pending = useRef(false)
  const ref = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0)
  const close = () => {
    if (ref.current?.contains(document.activeElement)) {
      const target = previousFocus.current
      if (target?.isConnected) target.focus()
      else {
        const main = document.querySelector<HTMLElement>('main')
        if (main) {
          const old = main.getAttribute('tabindex')
          main.setAttribute('tabindex', '-1')
          main.focus()
          if (old === null) main.removeAttribute('tabindex')
          else main.setAttribute('tabindex', old)
        }
      }
    }
    dismiss()
  }
  const install = async () => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      await prompt()
    } catch {
      setError(true)
      setGuide(true)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  const steps =
    platform === 'ios' ? IOS_STEPS : platform === 'android' ? ANDROID_STEPS : DESKTOP_STEPS
  const guideTitle =
    platform === 'ios'
      ? 'Cách cài trên iPhone, iPad'
      : platform === 'android'
        ? 'Cách cài trên Android'
        : 'Cách cài trên máy tính'
  if (!visible) return null
  return (
    <section
      ref={ref}
      className={styles.card}
      aria-label="Cài Lịch Việt, mở lịch tiện hơn"
      onFocusCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          previousFocus.current = e.relatedTarget as HTMLElement | null
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          close()
        }
      }}
    >
      <div className={styles.core}>
        <div className={styles.head}>
          <div className={styles.appIcon}>
            <img src="/logo.png" width="38" height="38" alt="" />
          </div>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>
              {guide ? `${steps.length} bước đơn giản` : 'Lịch Việt trên thiết bị của bạn'}
            </span>
            <h2>{guide ? guideTitle : 'Mở lịch tiện hơn mỗi ngày'}</h2>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Đóng lời mời cài app"
          >
            <X size={iconSize(18)} weight="light" aria-hidden="true" />
          </button>
        </div>
        <div
          key={guide ? 'guide' : 'intro'}
          className={styles.body}
          tabIndex={0}
          aria-label={guide ? 'Các bước cài app' : 'Giới thiệu app'}
        >
          {guide ? (
            <>
              <ol className={styles.steps}>
                {steps.map(({ title, text, icon: StepIcon }, index) => (
                  <li key={title} className={styles.step}>
                    <span className={styles.number} aria-hidden="true">
                      {index + 1}
                    </span>
                    <div>
                      <strong className={styles.stepTitle}>
                        <StepIcon size={iconSize(18)} weight="light" aria-hidden="true" />
                        {title}
                      </strong>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={styles.help}>
                <Info size={iconSize(16)} weight="light" aria-hidden="true" />
                <span>
                  {platform === 'ios'
                    ? 'Không thấy mục thêm? Cuộn xuống hết danh sách trong menu Chia sẻ.'
                    : platform === 'android'
                      ? 'Không thấy mục cài? Hãy mở trang bằng Chrome, thay vì trình duyệt bên trong Facebook hoặc Zalo.'
                      : 'Không thấy nút cài? Dùng Chrome hoặc Edge bản cập nhật, hoặc tiếp tục dùng bản web.'}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className={styles.description}>
                Thêm Lịch Việt vào thiết bị để mở ngay khi cần, kể cả khi không có mạng.
              </p>
              <ul className={styles.perks}>
                <li>
                  <DownloadSimple size={iconSize(16)} weight="light" aria-hidden="true" />
                  Mở nhanh
                </li>
                <li>
                  <WifiSlash size={iconSize(16)} weight="light" aria-hidden="true" />
                  Xem lịch offline
                </li>
                <li>
                  <ArrowSquareOut size={iconSize(16)} weight="light" aria-hidden="true" />
                  Cửa sổ riêng
                </li>
              </ul>
            </>
          )}
          {error ? (
            <p role="status" className={styles.help}>
              Chưa mở được hộp thoại cài. Bạn có thể làm theo hướng dẫn.
            </p>
          ) : null}
        </div>
        <div className={styles.footer}>
          {guide ? (
            <button type="button" className={styles.back} onClick={() => setGuide(false)}>
              <ArrowLeft size={iconSize(18)} weight="light" aria-hidden="true" />
              Quay lại
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.cta}
                disabled={busy}
                onClick={() => {
                  if (canPrompt) void install()
                  else setGuide(true)
                }}
              >
                <span>{busy ? 'Đang mở…' : canPrompt ? 'Cài app' : 'Xem cách cài'}</span>
                <span className={styles.ctaIcon}>
                  <ArrowRight size={iconSize(18)} weight="light" aria-hidden="true" />
                </span>
              </button>
              <p className={styles.note}>
                Mở app khi có mạng trước để dùng offline.
                <br />
                Đồng bộ dữ liệu cần kết nối mạng.
              </p>
            </>
          )}
        </div>
      </div>
      <span className={styles.srOnly} role="status">
        Bạn có thể cài Lịch Việt để mở lịch thuận tiện hơn.
      </span>
    </section>
  )
}

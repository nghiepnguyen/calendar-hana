import { useMemo, useState, type CSSProperties } from 'react'
import {
  AndroidLogo,
  AppleLogo,
  ArrowsOut,
  BellRinging,
  CaretDown,
  CheckCircle,
  Compass,
  DotsThreeVertical,
  DownloadSimple,
  Export,
  Monitor,
  PlusSquare,
  SealCheck,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { detectPlatform } from '../../reminders/notificationHelp'
import { useInstallStore } from '../../store/installStore'
import { iconSize } from '../../styles/textSize'
import styles from './InstallSection.module.css'

interface Step {
  icon: Icon
  text: string
}

const IOS_STEPS: Step[] = [
  {
    icon: Compass,
    text: 'Mở trang này bằng Safari (iOS 16.4 trở lên cũng dùng được Chrome, Edge).',
  },
  {
    icon: Export,
    text: 'Bấm nút Chia sẻ (hình vuông có mũi tên hướng lên) ở thanh dưới hoặc cạnh thanh địa chỉ.',
  },
  { icon: PlusSquare, text: 'Kéo xuống, chọn “Thêm vào Màn hình chính” (Add to Home Screen).' },
  {
    icon: CheckCircle,
    text: 'Bấm “Thêm”. Từ giờ mở Lịch Việt bằng biểu tượng trên Màn hình chính.',
  },
]

const ANDROID_STEPS: Step[] = [
  { icon: Compass, text: 'Mở trang này bằng Chrome.' },
  { icon: DotsThreeVertical, text: 'Bấm nút menu ⋮ ở góc trên bên phải.' },
  {
    icon: DownloadSimple,
    text: 'Chọn “Cài đặt ứng dụng” (Install app) hoặc “Thêm vào màn hình chính”.',
  },
  {
    icon: CheckCircle,
    text: 'Bấm “Cài đặt”. Lịch Việt sẽ có trên màn hình chính và trong danh sách ứng dụng.',
  },
]

const PERKS: { icon: Icon; label: string }[] = [
  { icon: WifiSlash, label: 'Dùng khi mất mạng' },
  { icon: ArrowsOut, label: 'Toàn màn hình' },
  { icon: BellRinging, label: 'Nhắc hẹn' },
]

const IOS_NOTE =
  'Trên iPhone/iPad, nhắc hẹn chỉ hiện được khi mở app từ Màn hình chính (cần iOS 16.4 trở lên).'
const ANDROID_NOTE = 'Samsung Internet: bấm menu ≡ → Thêm trang vào → Màn hình chính.'

/** Các bước đánh số nối bằng một đường dọc, mỗi bước có icon minh hoạ thao tác. */
function Guide({ steps, note }: { steps: Step[]; note: string }) {
  return (
    <>
      <ol className={styles.steps}>
        {steps.map(({ icon: StepIcon, text }, index) => (
          <li key={text} className={styles.step} style={{ '--i': index } as CSSProperties}>
            <span className={styles.stepMarker} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.stepIcon} aria-hidden="true">
              <StepIcon size={iconSize(18)} weight="duotone" />
            </span>
            <span className={styles.stepText}>{text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.note}>{note}</p>
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
      <p className={styles.installed} data-testid="install-status">
        <SealCheck size={iconSize(22)} weight="duotone" aria-hidden="true" />
        Bạn đang dùng Lịch Việt dạng app đã cài.
      </p>
    )
  }

  const install = async () => setDeclined(!(await prompt()))

  const ios = { title: 'iPhone, iPad', icon: AppleLogo, steps: IOS_STEPS, note: IOS_NOTE }
  const android = {
    title: 'Android',
    icon: AndroidLogo,
    steps: ANDROID_STEPS,
    note: ANDROID_NOTE,
  }
  // Hướng dẫn cho máy đang dùng hiện sẵn, máy còn lại thu gọn.
  const guides = platform === 'android' ? [android, ios] : [ios, android]
  const onPhone = platform === 'ios' || platform === 'android'

  return (
    <>
      <div className={styles.hero}>
        <span className={styles.appIcon} aria-hidden="true">
          <span className={styles.appIconCore}>
            <img src="/logo.png" alt="" width="44" height="44" />
          </span>
        </span>
        <div className={styles.heroBody}>
          <p className={styles.heroTitle}>Thêm Lịch Việt vào màn hình chính</p>
          <p className={styles.heroText}>
            Mở nhanh như app thường, toàn màn hình, dùng được khi mất mạng.
          </p>
          <ul className={styles.perks}>
            {PERKS.map(({ icon: PerkIcon, label }) => (
              <li key={label}>
                <PerkIcon size={iconSize(14)} weight="bold" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        {canPrompt ? (
          <button
            type="button"
            className={`btn btn-primary ${styles.installButton}`}
            onClick={() => void install()}
          >
            <DownloadSimple size={iconSize(16)} weight="bold" aria-hidden="true" />
            Cài app
          </button>
        ) : null}
      </div>
      {declined ? (
        <p className="field-hint">Chưa cài. Bạn có thể cài lại theo hướng dẫn bên dưới.</p>
      ) : null}

      <div className={styles.guides}>
        {guides.map((guide, index) => {
          const PlatformIcon = guide.icon
          const icon = (
            <span className={styles.platformIcon} aria-hidden="true">
              <PlatformIcon size={iconSize(18)} weight="fill" />
            </span>
          )
          return onPhone && index === 0 ? (
            <div key={guide.title} className={styles.guide}>
              <p className={styles.guideTitle}>
                {icon}
                {guide.title}
              </p>
              <Guide steps={guide.steps} note={guide.note} />
            </div>
          ) : (
            <details key={guide.title} className={styles.guide}>
              <summary className={styles.guideTitle}>
                {icon}
                {guide.title}
                <CaretDown
                  size={iconSize(14)}
                  weight="bold"
                  className={styles.caret}
                  aria-hidden="true"
                />
              </summary>
              <Guide steps={guide.steps} note={guide.note} />
            </details>
          )
        })}
        {onPhone ? null : (
          <p className={styles.desktop}>
            <span className={styles.platformIcon} aria-hidden="true">
              <Monitor size={iconSize(18)} weight="fill" />
            </span>
            Trên máy tính (Chrome, Edge): bấm biểu tượng cài đặt ở cuối thanh địa chỉ.
          </p>
        )}
      </div>
    </>
  )
}

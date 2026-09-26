import { useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  BellRinging,
  DeviceMobile,
  Sparkle,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { iconSize } from '../../styles/textSize'
import { Modal } from '../Modal/Modal'
import styles from './Welcome.module.css'

/** Đã chào lần đầu trên máy này (bấm nút nào cũng tính). */
export const WELCOME_STORAGE_KEY = 'hana:welcome-seen'

const PERKS: { icon: Icon; title: string; text: string }[] = [
  {
    icon: WifiSlash,
    title: 'Dùng cả khi mất mạng',
    text: 'Xem lịch, ngày âm, sự kiện không cần internet.',
  },
  {
    icon: DeviceMobile,
    title: 'Mở nhanh như app',
    text: 'Biểu tượng riêng trên màn hình chính, toàn màn hình.',
  },
  {
    icon: BellRinging,
    title: 'Nhắc hẹn đúng giờ',
    text: 'Nhận thông báo, kể cả trên iPhone, iPad.',
  },
]

function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    // Bị chặn lưu trữ thì không nhớ được đã chào: thà không hiện còn hơn hiện mỗi lần mở.
    return true
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // Không lưu được thì thôi, hasSeenWelcome cũng đã coi như đã chào.
  }
}

/** Chào mừng lần đầu mở app, giới thiệu cài app để dùng offline. */
export function Welcome() {
  const navigate = useNavigate()
  // Đang mở dạng app đã cài thì không cần mời cài nữa.
  const standalone = useMediaQuery('(display-mode: standalone)')
  const [open, setOpen] = useState(() => !hasSeenWelcome())

  if (!open || standalone) return null

  const close = () => {
    markWelcomeSeen()
    setOpen(false)
  }

  return (
    <Modal
      title="Chào mừng đến với Lịch Việt"
      size="sm"
      onClose={close}
      initialFocusSelector="[data-autofocus]"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={close}>
            Bỏ qua
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            onClick={() => {
              close()
              navigate('/settings#install')
            }}
          >
            Xem hướng dẫn
            <span className={styles.ctaIcon} aria-hidden="true">
              <ArrowRight size={iconSize(14)} weight="bold" />
            </span>
          </button>
        </>
      }
    >
      <div className={styles.hero} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.appIcon}>
          <span className={styles.appIconCore}>
            <img src="/logo.png" alt="" width="56" height="56" />
          </span>
        </span>
        <span className={`${styles.badge} ${styles.badgeLeft}`}>
          <WifiSlash size={iconSize(16)} weight="bold" />
        </span>
        <span className={`${styles.badge} ${styles.badgeRight}`}>
          <BellRinging size={iconSize(16)} weight="bold" />
        </span>
      </div>
      <p className={styles.eyebrow}>
        <Sparkle size={iconSize(12)} weight="fill" aria-hidden="true" />
        Cài một lần, dùng mọi lúc
      </p>
      <p className={styles.intro}>
        Lịch âm dương, ngày lễ và nhắc hẹn trong một nơi. Cài Lịch Việt lên máy để:
      </p>
      <ul className={styles.perks}>
        {PERKS.map(({ icon: PerkIcon, title, text }, index) => (
          <li key={title} className={styles.perk} style={{ '--i': index } as CSSProperties}>
            <span className={styles.perkIcon} aria-hidden="true">
              <PerkIcon size={iconSize(20)} weight="duotone" />
            </span>
            <span>
              <strong className={styles.perkTitle}>{title}</strong>
              <span className={styles.perkText}>{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

import { Link } from 'react-router-dom'
import styles from './LegalLinks.module.css'

export function LegalLinks({ introduction = false }: { introduction?: boolean }) {
  return (
    <div className={styles.legal}>
      {introduction ? <p>Lịch Việt — lịch cá nhân âm–dương, quản lý sự kiện và nhắc hẹn.</p> : null}
      <nav aria-label="Chính sách của Lịch Việt">
        <Link to="/privacy">Quyền riêng tư</Link>
        <Link to="/terms">Điều khoản sử dụng</Link>
      </nav>
    </div>
  )
}

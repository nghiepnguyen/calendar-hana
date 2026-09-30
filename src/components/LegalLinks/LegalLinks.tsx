import styles from './LegalLinks.module.css'

export function LegalLinks({ introduction = false }: { introduction?: boolean }) {
  return (
    <div className={styles.legal}>
      {introduction ? <p>Lịch Việt — lịch cá nhân âm–dương, quản lý sự kiện và nhắc hẹn.</p> : null}
      <nav aria-label="Chính sách của Lịch Việt">
        {/* HTML công khai độc lập, dùng điều hướng đầy đủ để không qua router của lịch. */}
        <a href="/privacy">Quyền riêng tư</a>
        <a href="/terms">Điều khoản sử dụng</a>
      </nav>
    </div>
  )
}

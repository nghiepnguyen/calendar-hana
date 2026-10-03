import { useEffect, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import privacy from '../../../public/privacy.html?raw'
import terms from '../../../public/terms.html?raw'
import { LegalLinks } from '../../components/LegalLinks/LegalLinks'
import styles from './LegalPage.module.css'

// Một nguồn nội dung cho cả HTML công khai và trang trong PWA.
// Chỉ dùng HTML tĩnh trong repository, không nhận HTML từ người dùng/server.
function mainContent(html: string): string {
  const content = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]
  if (!content) throw new Error('Trang chính sách thiếu nội dung')
  return content
}

const content = { privacy: mainContent(privacy), terms: mainContent(terms) }

export function LegalPage({ policy }: { policy: keyof typeof content }) {
  const navigate = useNavigate()
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: 'start' })
    else window.scrollTo?.({ top: 0 })
  }, [policy, hash])

  // Link trong HTML (giữa hai chính sách, về trang chủ) cũng giữ nguyên phiên Firestore của PWA.
  function onClick(event: MouseEvent<HTMLElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link = (event.target as Element).closest('a')
    if (!link || link.target || link.hasAttribute('download')) return
    const url = new URL(link.href)
    if (url.origin === window.location.origin && /^\/((privacy|terms)\/?)?$/.test(url.pathname)) {
      event.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }
  }

  return (
    <div className={styles.page}>
      <title>
        {`${policy === 'privacy' ? 'Chính sách quyền riêng tư' : 'Điều khoản sử dụng'} | Lịch Việt`}
      </title>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Lịch Việt
        </Link>
        <Link to="/">Mở Lịch Việt</Link>
      </header>
      <main
        className={`glass ${styles.content}`}
        id="content"
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: content[policy] }}
      />
      <footer className={styles.footer}>
        <LegalLinks />
      </footer>
    </div>
  )
}

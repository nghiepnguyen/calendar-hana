import { Component, type ErrorInfo, type ReactNode } from 'react'
import { hideSplash } from '../../splash'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Bắt lỗi khi vẽ giao diện. Thiếu nó thì một lỗi ở bất kỳ đâu làm React gỡ cả cây,
 * trang trắng trơn như vừa reload; có nó thì hiện thông báo và cách thoát ra.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lỗi giao diện:', error, info.componentStack)
    // Lỗi trước khi app kịp vẽ thì splash còn che thông báo lỗi.
    hideSplash()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className={styles.wrap}>
        <div className={`glass ${styles.card}`} role="alert">
          <h1 className={styles.title}>Đã có lỗi xảy ra</h1>
          <p className={styles.text}>
            Ứng dụng gặp sự cố ngoài ý muốn. Dữ liệu của bạn vẫn được giữ nguyên.
          </p>
          <div className={styles.actions}>
            <button type="button" className="btn" onClick={() => window.location.assign('/')}>
              Về hôm nay
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </main>
    )
  }
}

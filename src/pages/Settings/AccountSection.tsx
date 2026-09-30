import { useState } from 'react'
import { authErrorMessage, useAuth } from '../../auth/authContext'
import { Modal } from '../../components/Modal/Modal'
import { useSettings } from '../../hooks/useRepositoryData'
import { BirthInfoForm } from './BirthInfoForm'
import styles from './SettingsPage.module.css'

const CONFIRM_WORD = 'XÓA'

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuth()
  const [text, setText] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = text.trim().toUpperCase() === CONFIRM_WORD

  return (
    <Modal
      size="sm"
      title="Xóa tài khoản?"
      onClose={running ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={running}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!confirmed || running}
            onClick={async () => {
              setRunning(true)
              setError(null)
              try {
                await deleteAccount()
                onClose()
              } catch (e) {
                setError(authErrorMessage(e))
                setRunning(false)
              }
            }}
          >
            {running ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
          </button>
        </>
      }
    >
      <p style={{ marginTop: 0 }}>
        Toàn bộ sự kiện, danh mục và cài đặt trên cloud sẽ bị xóa vĩnh viễn, không khôi phục được.
        Nên <strong>xuất dữ liệu</strong> trước để sao lưu.
      </p>
      <label className="field">
        <span className="field-label">Gõ “{CONFIRM_WORD}” để xác nhận</span>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}

export function AccountSection() {
  const { available, user, signIn, signOut } = useAuth()
  const settings = useSettings()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.account}>
      {user ? (
        <>
          <div className={styles.profile}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" width={44} height={44} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">
                {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span>
              <span className={styles.rowLabel}>{user.displayName ?? 'Tài khoản Google'}</span>
              <span className="field-hint">{user.email}</span>
            </span>
          </div>
          <p className="field-hint">
            Dữ liệu được lưu trên cloud và đồng bộ giữa các thiết bị đăng nhập cùng tài khoản.
          </p>
          <div className={styles.buttons}>
            <button type="button" className="btn" disabled={busy} onClick={() => run(signOut)}>
              Đăng xuất
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-danger"
              onClick={() => setDeleting(true)}
            >
              Xóa tài khoản
            </button>
          </div>
        </>
      ) : available ? (
        <>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Đang lưu dữ liệu trên máy này. Đăng nhập Google để lưu lên cloud, dùng trên nhiều thiết
            bị và nhận nhắc hẹn qua email.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => run(signIn)}
          >
            Đăng nhập bằng Google
          </button>
        </>
      ) : (
        <p className="field-hint">Đang lưu dữ liệu trên máy này.</p>
      )}
      {settings ? (
        <BirthInfoForm key={user?.uid ?? 'local'} settings={settings} signedIn={!!user} />
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {deleting ? <DeleteAccountDialog onClose={() => setDeleting(false)} /> : null}
    </div>
  )
}

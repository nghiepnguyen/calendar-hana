import { useEffect, useState } from 'react'
import { track } from '../analytics'
import { Modal } from '../components/Modal/Modal'
import type { FirestoreRepository } from './firestoreRepository'
import type { LocalRepository } from './localRepository'
import { migrateLocalToCloud, type MigrationResult } from './migrateLocalToCloud'

interface MigrationDialogProps {
  local: LocalRepository
  cloud: FirestoreRepository
  onDone: () => void
  onSkip: () => void
}

/** Hỏi chuyển dữ liệu trên máy lên tài khoản ở lần đăng nhập đầu (PRD mục 43). */
export function MigrationDialog({ local, cloud, onDone, onSkip }: MigrationDialogProps) {
  const [eventCount, setEventCount] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void local.db.events.count().then(setEventCount)
  }, [local])

  const run = async () => {
    setStatus('running')
    setError(null)
    try {
      const migrated = await migrateLocalToCloud(local, cloud)
      track('migrate_to_cloud')
      setResult(migrated)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không chuyển được dữ liệu.')
      setStatus('idle')
    }
  }

  if (status === 'done' && result) {
    return (
      <Modal
        size="sm"
        title="Đã chuyển dữ liệu"
        onClose={onDone}
        footer={
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Xong
          </button>
        }
      >
        <p style={{ margin: 0 }}>
          Đã chuyển {result.events} sự kiện lên tài khoản. Từ giờ dữ liệu được lưu trên cloud và
          đồng bộ giữa các thiết bị.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      size="sm"
      title="Chuyển dữ liệu trên máy lên tài khoản?"
      onClose={status === 'running' ? () => {} : onSkip}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onSkip}
            disabled={status === 'running'}
          >
            Bỏ qua
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={run}
            disabled={status === 'running'}
          >
            {status === 'running' ? 'Đang chuyển…' : 'Chuyển dữ liệu'}
          </button>
        </>
      }
    >
      <p style={{ marginTop: 0 }}>
        Máy này đang có {eventCount ?? '…'} sự kiện được tạo khi chưa đăng nhập.
      </p>
      <p>
        <strong>Chuyển dữ liệu</strong>: đưa các sự kiện và danh mục lên tài khoản Google, xóa bản
        trên máy sau khi chuyển xong.
      </p>
      <p style={{ marginBottom: 0 }}>
        <strong>Bỏ qua</strong>: giữ riêng dữ liệu trên máy. Bạn sẽ thấy lại chúng khi đăng xuất.
      </p>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}

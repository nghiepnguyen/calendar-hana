import { useRef, useState } from 'react'
import { Modal } from '../../components/Modal/Modal'
import {
  downloadJson,
  exportData,
  exportFileName,
  importData,
  parseImport,
  type ImportMode,
  type ParsedImport,
} from '../../data/exportImport'
import { useRepository } from '../../data/repositoryContext'
import styles from './SettingsPage.module.css'

export function DataSection() {
  const repository = useRepository()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setMessage(null)
    try {
      setParsed(parseImport(await file.text()))
      setMode('merge')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đọc được file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={styles.account}>
      <p className="field-hint" style={{ marginTop: 0 }}>
        Xuất toàn bộ sự kiện, danh mục và cài đặt ra file JSON để sao lưu, hoặc nhập lại từ file.
      </p>
      <div className={styles.buttons}>
        <button
          type="button"
          className="btn"
          onClick={async () => downloadJson(await exportData(repository), exportFileName())}
        >
          Xuất dữ liệu
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Nhập từ file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-label="Chọn file sao lưu"
          tabIndex={-1}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {message ? (
        <p className="field-hint" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {parsed ? (
        <Modal
          size="sm"
          title="Nhập dữ liệu"
          onClose={running ? () => {} : () => setParsed(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={running}
                onClick={() => setParsed(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`btn ${mode === 'replace' ? 'btn-danger' : 'btn-primary'}`}
                disabled={running}
                onClick={async () => {
                  setRunning(true)
                  try {
                    const result = await importData(repository, parsed.file, mode)
                    setMessage(
                      `Đã nhập ${result.events} sự kiện và ${result.categories} danh mục.` +
                        (parsed.skipped ? ` Bỏ qua ${parsed.skipped} bản ghi không hợp lệ.` : ''),
                    )
                    setParsed(null)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Không nhập được dữ liệu.')
                    setParsed(null)
                  } finally {
                    setRunning(false)
                  }
                }}
              >
                {running ? 'Đang nhập…' : 'Nhập'}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            File có {parsed.file.events.length} sự kiện và {parsed.file.categories.length} danh mục
            {parsed.skipped ? ` (${parsed.skipped} bản ghi không hợp lệ sẽ bị bỏ qua)` : ''}.
          </p>
          <div role="radiogroup" aria-label="Cách nhập" style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'flex', gap: 10 }}>
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />
              <span>
                <strong>Gộp</strong>: thêm vào dữ liệu hiện có, bản trong file mới hơn thì ghi đè.
              </span>
            </label>
            <label style={{ display: 'flex', gap: 10 }}>
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <span>
                <strong>Thay thế</strong>: xóa hết sự kiện và danh mục hiện có rồi nhập lại từ file.
              </span>
            </label>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

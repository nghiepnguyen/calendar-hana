import { useRef, useState } from 'react'
import { Modal } from '../../components/Modal/Modal'
import { todayInVietnam } from '@shared/time'
import {
  downloadFile,
  downloadJson,
  exportData,
  exportFileName,
  importData,
  parseImportFile,
  toGoogleCsv,
  toIcs,
  type ImportMode,
  type ParsedImport,
} from '../../data/exportImport'
import { CSV_YEARS_AFTER, CSV_YEARS_BEFORE } from '../../data/interop/googleCsv'
import { LUNAR_EXPAND_YEARS } from '../../data/interop/ics'
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
      const [text, categories, settings] = await Promise.all([
        file.text(),
        repository.listCategories(),
        repository.getSettings(),
      ])
      setParsed(
        parseImportFile(file.name, text, {
          categories,
          allDayReminderTime: settings.allDayReminderTime,
        }),
      )
      setMode('merge')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đọc được file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const exportAs = async (format: 'json' | 'ics' | 'csv') => {
    const data = await exportData(repository)
    const fileName = exportFileName(new Date(), format)
    if (format === 'json') downloadJson(data, fileName)
    else if (format === 'ics') {
      downloadFile(toIcs(data, todayInVietnam()), fileName, 'text/calendar;charset=utf-8')
    } else downloadFile(toGoogleCsv(data, todayInVietnam()), fileName, 'text/csv;charset=utf-8')
  }

  const external = parsed !== null && parsed.format !== 'json'

  return (
    <div className={styles.account}>
      <p className="field-hint" style={{ marginTop: 0 }}>
        JSON là bản sao lưu đầy đủ (sự kiện, danh mục, cài đặt). ICS và CSV theo chuẩn Google
        Calendar, dùng để chuyển sự kiện sang Google Calendar hoặc ứng dụng lịch khác.
      </p>
      <div className={styles.buttons}>
        <button type="button" className="btn" onClick={() => void exportAs('json')}>
          Xuất JSON
        </button>
        <button type="button" className="btn" onClick={() => void exportAs('ics')}>
          Xuất ICS
        </button>
        <button type="button" className="btn" onClick={() => void exportAs('csv')}>
          Xuất CSV
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Nhập từ file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.ics,.csv,application/json,text/calendar,text/csv"
          className="visually-hidden"
          aria-label="Chọn file sao lưu"
          tabIndex={-1}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      <ul className={`field-hint ${styles.dataNotes}`}>
        <li>ICS: sự kiện lặp âm lịch được ghi thành từng lần, tới {LUNAR_EXPAND_YEARS} năm sau.</li>
        <li>
          CSV không có sự kiện lặp: các lần lặp từ {CSV_YEARS_BEFORE} năm trước tới{' '}
          {CSV_YEARS_AFTER} năm sau được ghi thành từng dòng.
        </li>
        <li>Nhập được file JSON của app, hoặc file .ics / .csv xuất từ Google Calendar.</li>
      </ul>
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
                className={`btn ${!external && mode === 'replace' ? 'btn-danger' : 'btn-primary'}`}
                disabled={running}
                onClick={async () => {
                  setRunning(true)
                  try {
                    const result = await importData(
                      repository,
                      parsed.file,
                      external ? 'merge' : mode,
                    )
                    setMessage(
                      (external
                        ? `Đã nhập ${result.events} sự kiện.`
                        : `Đã nhập ${result.events} sự kiện và ${result.categories} danh mục.`) +
                        (parsed.skipped ? ` Bỏ qua ${parsed.skipped} bản ghi không hợp lệ.` : '') +
                        (parsed.simplified
                          ? ` ${parsed.simplified} sự kiện lặp chỉ nhập lần đầu.`
                          : ''),
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
          {external ? (
            <>
              <p style={{ marginTop: 0 }}>
                File {parsed.format.toUpperCase()} có {parsed.file.events.length} sự kiện
                {parsed.skipped ? ` (${parsed.skipped} bản ghi không đọc được sẽ bị bỏ qua)` : ''}.
              </p>
              {parsed.simplified ? (
                <p>
                  {parsed.simplified} sự kiện lặp có quy tắc app chưa hỗ trợ (ví dụ cách 2 tuần, thứ
                  Hai đầu tiên của tháng) sẽ chỉ nhập lần đầu.
                </p>
              ) : null}
              <p className="field-hint" style={{ marginBottom: 0 }}>
                Sự kiện được thêm vào dữ liệu hiện có, danh mục khớp theo tên (không khớp thì vào
                “Khác”). Nhập lại cùng file không tạo bản trùng.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                File có {parsed.file.events.length} sự kiện và {parsed.file.categories.length} danh
                mục
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
                    <strong>Gộp</strong>: thêm vào dữ liệu hiện có, bản trong file mới hơn thì ghi
                    đè.
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
                    <strong>Thay thế</strong>: xóa hết sự kiện và danh mục hiện có rồi nhập lại từ
                    file.
                  </span>
                </label>
              </div>
            </>
          )}
        </Modal>
      ) : null}
    </div>
  )
}

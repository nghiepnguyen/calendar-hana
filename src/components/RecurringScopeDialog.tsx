import { useId, useState } from 'react'
import type { RecurringScope } from '@shared/recurrence/editing'
import { Modal } from './Modal/Modal'
import styles from './RecurringScopeDialog.module.css'

interface RecurringScopeDialogProps {
  action: 'edit' | 'delete'
  onConfirm: (scope: RecurringScope) => void
  onCancel: () => void
}

const OPTIONS: { value: RecurringScope; label: string; hint: string }[] = [
  { value: 'single', label: 'Chỉ sự kiện này', hint: 'Các lần khác giữ nguyên' },
  { value: 'following', label: 'Sự kiện này và các sự kiện sau', hint: 'Các lần trước giữ nguyên' },
  { value: 'all', label: 'Tất cả', hint: 'Mọi lần lặp của sự kiện' },
]

/** Hỏi phạm vi khi sửa / xóa sự kiện lặp (PRD mục 30). */
export function RecurringScopeDialog({ action, onConfirm, onCancel }: RecurringScopeDialogProps) {
  const id = useId()
  const [scope, setScope] = useState<RecurringScope>('single')
  const verb = action === 'edit' ? 'Sửa' : 'Xóa'
  return (
    <Modal
      size="sm"
      title={`${verb} sự kiện lặp`}
      onClose={onCancel}
      initialFocusSelector="input:checked"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${action === 'delete' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onConfirm(scope)}
          >
            {verb}
          </button>
        </>
      }
    >
      <div
        role="radiogroup"
        aria-label={`Phạm vi ${verb.toLowerCase()}`}
        className={styles.options}
      >
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              className={styles.radio}
              name={id}
              value={option.value}
              checked={scope === option.value}
              onChange={() => setScope(option.value)}
              aria-labelledby={`${id}-${option.value}`}
              aria-describedby={`${id}-${option.value}-hint`}
            />
            <span className={styles.text}>
              <span id={`${id}-${option.value}`} className={styles.label}>
                {option.label}
              </span>
              <span id={`${id}-${option.value}-hint`} className={styles.hint}>
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  )
}

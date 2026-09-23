import { useId, useState } from 'react'
import type { RecurringScope } from '@shared/recurrence/editing'
import { Modal } from './Modal/Modal'

interface RecurringScopeDialogProps {
  action: 'edit' | 'delete'
  onConfirm: (scope: RecurringScope) => void
  onCancel: () => void
}

const OPTIONS: { value: RecurringScope; label: string }[] = [
  { value: 'single', label: 'Chỉ sự kiện này' },
  { value: 'following', label: 'Sự kiện này và các sự kiện sau' },
  { value: 'all', label: 'Tất cả' },
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
        style={{ display: 'grid', gap: 10 }}
      >
        {OPTIONS.map((option) => (
          <label key={option.value} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={scope === option.value}
              onChange={() => setScope(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </Modal>
  )
}

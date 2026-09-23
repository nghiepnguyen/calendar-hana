import type { ReactNode } from 'react'
import { Modal } from './Modal/Modal'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onCancel}
      initialFocusSelector="[data-autofocus]"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} data-autofocus>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ margin: 0 }}>{children}</div>
    </Modal>
  )
}

import { useState } from 'react'
import { splitAt, type RecurringScope } from '@shared/recurrence/editing'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { CalendarEvent, Settings } from '@shared/types'
import {
  createEventFromDraft,
  deleteEventOccurrence,
  updateEventFromDraft,
} from '../data/eventActions'
import { useRepository } from '../data/repositoryContext'
import { useCategoryMap } from '../hooks/useCategoryMap'
import { useEvents } from '../hooks/useRepositoryData'
import { useUiStore } from '../store/uiStore'
import { ConfirmDialog } from './ConfirmDialog'
import { EventDetail } from './EventDetail/EventDetail'
import { draftFromDefaults, draftFromEvent, type EventDraft } from './EventForm/draft'
import { EventForm } from './EventForm/EventForm'
import { RecurringScopeDialog } from './RecurringScopeDialog'

interface EventDialogsProps {
  settings: Settings
  signedIn: boolean
}

type Pending =
  | { kind: 'edit-scope'; occurrence: Occurrence }
  | { kind: 'delete-scope'; occurrence: Occurrence }
  | { kind: 'delete-confirm'; occurrence: Occurrence }
  | null

/** Điều phối các hộp thoại sự kiện: chi tiết, form tạo/sửa, chọn phạm vi, xác nhận xóa. */
export function EventDialogs({ settings, signedIn }: EventDialogsProps) {
  const repository = useRepository()
  const events = useEvents()
  const { categories, get: getCategory } = useCategoryMap()
  const detail = useUiStore((s) => s.detail)
  const editor = useUiStore((s) => s.editor)
  const closeDetail = useUiStore((s) => s.closeDetail)
  const closeEditor = useUiStore((s) => s.closeEditor)
  const openEdit = useUiStore((s) => s.openEdit)
  const [pending, setPending] = useState<Pending>(null)

  const findEvent = (id: string): CalendarEvent | undefined => events?.find((e) => e.id === id)

  const startEdit = (occurrence: Occurrence, scope: RecurringScope) => {
    setPending(null)
    openEdit({ eventId: occurrence.eventId, occurrence, scope })
  }

  const removeOccurrence = async (occurrence: Occurrence, scope: RecurringScope) => {
    setPending(null)
    const base = findEvent(occurrence.eventId)
    if (base) await deleteEventOccurrence(repository, base, occurrence, scope)
    closeDetail()
  }

  // Form tạo / sửa.
  let form = null
  if (editor) {
    let initialDraft: EventDraft | null = null
    let base: CalendarEvent | undefined
    if (editor.mode === 'create') {
      initialDraft = draftFromDefaults(editor.defaults)
    } else {
      base = findEvent(editor.eventId)
      const occ = editor.occurrence
      if (base) {
        if (editor.scope === 'single' && occ) {
          // Sửa riêng một lần: chọn ngày theo dương lịch, không đổi quy tắc lặp.
          initialDraft = {
            ...draftFromEvent(occ.event, occ.date),
            calendarType: 'solar',
            repeat: 'none',
          }
        } else if (editor.scope === 'following' && occ) {
          initialDraft = draftFromEvent(splitAt(base, occ).after)
        } else {
          initialDraft = draftFromEvent(base)
        }
      }
    }
    if (initialDraft) {
      const formKey = editor.mode === 'create' ? 'create' : `${editor.eventId}:${editor.scope}`
      form = (
        <EventForm
          key={formKey}
          mode={editor.mode === 'create' ? 'create' : editor.scope}
          initialDraft={initialDraft}
          categories={categories}
          allDayReminderTime={settings.allDayReminderTime}
          signedIn={signedIn}
          onCancel={closeEditor}
          onSave={async (draft) => {
            if (editor.mode === 'create') await createEventFromDraft(repository, draft)
            else if (base)
              await updateEventFromDraft(repository, base, draft, editor.scope, editor.occurrence)
            closeEditor()
          }}
        />
      )
    }
  }

  return (
    <>
      {detail && !editor ? (
        <EventDetail
          occurrence={detail}
          baseEvent={findEvent(detail.eventId)}
          category={getCategory(detail.event.categoryId)}
          allDayReminderTime={settings.allDayReminderTime}
          onClose={closeDetail}
          onEdit={() =>
            detail.isRecurring
              ? setPending({ kind: 'edit-scope', occurrence: detail })
              : startEdit(detail, 'all')
          }
          onDelete={() =>
            setPending({
              kind: detail.isRecurring ? 'delete-scope' : 'delete-confirm',
              occurrence: detail,
            })
          }
        />
      ) : null}

      {form}

      {pending?.kind === 'edit-scope' ? (
        <RecurringScopeDialog
          action="edit"
          onCancel={() => setPending(null)}
          onConfirm={(scope) => startEdit(pending.occurrence, scope)}
        />
      ) : null}
      {pending?.kind === 'delete-scope' ? (
        <RecurringScopeDialog
          action="delete"
          onCancel={() => setPending(null)}
          onConfirm={(scope) => void removeOccurrence(pending.occurrence, scope)}
        />
      ) : null}
      {pending?.kind === 'delete-confirm' ? (
        <ConfirmDialog
          title="Xóa sự kiện?"
          confirmLabel="Xóa"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => void removeOccurrence(pending.occurrence, 'all')}
        >
          Sự kiện “{pending.occurrence.event.title}” sẽ bị xóa và không khôi phục được.
        </ConfirmDialog>
      ) : null}
    </>
  )
}

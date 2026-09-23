import { useState } from 'react'
import type { Category } from '@shared/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CATEGORY_COLORS } from '../../data/defaultCategories'
import { useRepository } from '../../data/repositoryContext'
import { useCategories, useEvents } from '../../hooks/useRepositoryData'
import styles from './SettingsPage.module.css'

const NAME_MAX = 40

function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (color: string) => void
  label: string
}) {
  return (
    <div className={styles.colors} role="radiogroup" aria-label={label}>
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.name}
          title={c.name}
          className={`${styles.color} ${value === c.value ? styles.colorOn : ''}`}
          style={{ background: c.value }}
          onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  )
}

function CategoryRow({ category, eventCount }: { category: Category; eventCount: number }) {
  const repository = useRepository()
  const [name, setName] = useState(category.name)
  const [confirming, setConfirming] = useState(false)
  const [editingColor, setEditingColor] = useState(false)

  const save = (patch: Partial<Pick<Category, 'name' | 'color'>>) =>
    repository.saveCategory({ ...category, ...patch })

  return (
    <li className={styles.categoryRow}>
      <button
        type="button"
        className={styles.swatchButton}
        style={{ background: category.color }}
        aria-label={`Đổi màu ${category.name}`}
        aria-expanded={editingColor}
        onClick={() => setEditingColor((v) => !v)}
      />
      <input
        className="input"
        value={name}
        maxLength={NAME_MAX}
        aria-label={`Tên danh mục ${category.name}`}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim()
          if (!trimmed) setName(category.name)
          else if (trimmed !== category.name) void save({ name: trimmed })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <span className={styles.count}>{eventCount} sự kiện</span>
      {category.isSystem ? (
        <span className={styles.systemNote} title="Danh mục hệ thống không xóa được">
          Mặc định
        </span>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          onClick={() => setConfirming(true)}
          aria-label={`Xóa danh mục ${category.name}`}
        >
          Xóa
        </button>
      )}
      {editingColor ? (
        <div className={styles.colorRow}>
          <ColorPicker
            label={`Màu của ${category.name}`}
            value={category.color}
            onChange={(color) => {
              void save({ color })
              setEditingColor(false)
            }}
          />
        </div>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          title={`Xóa danh mục “${category.name}”?`}
          confirmLabel="Xóa danh mục"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            void repository.deleteCategory(category.id)
          }}
        >
          {eventCount > 0
            ? `${eventCount} sự kiện của danh mục này sẽ được chuyển sang “Khác”.`
            : 'Danh mục này chưa có sự kiện nào.'}
        </ConfirmDialog>
      ) : null}
    </li>
  )
}

export function CategoryManager() {
  const repository = useRepository()
  const categories = useCategories() ?? []
  const events = useEvents() ?? []
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[4].value)

  const counts = new Map<string, number>()
  for (const e of events) counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1)

  return (
    <div className={styles.categoryManager}>
      <ul className={styles.categoryList}>
        {categories.map((c) => (
          <CategoryRow
            key={`${c.id}:${c.updatedAt}`}
            category={c}
            eventCount={counts.get(c.id) ?? 0}
          />
        ))}
      </ul>
      <form
        className={styles.newCategory}
        onSubmit={(e) => {
          e.preventDefault()
          const name = newName.trim()
          if (!name) return
          void repository.saveCategory({ name, color: newColor })
          setNewName('')
        }}
      >
        <label className="field">
          <span className="field-label">Thêm danh mục</span>
          <input
            className="input"
            value={newName}
            maxLength={NAME_MAX}
            placeholder="Ví dụ: Du lịch"
            onChange={(e) => setNewName(e.target.value)}
          />
        </label>
        <ColorPicker label="Màu danh mục mới" value={newColor} onChange={setNewColor} />
        <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
          Thêm
        </button>
      </form>
    </div>
  )
}

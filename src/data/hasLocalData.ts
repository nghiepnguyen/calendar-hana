import { createDefaultCategories } from './defaultCategories'
import type { LocalRepository } from './localRepository'

/** Máy có dữ liệu local đáng chuyển không: có sự kiện, hoặc danh mục đã bị sửa/thêm/xóa. */
export async function hasLocalData(local: LocalRepository): Promise<boolean> {
  if ((await local.db.events.count()) > 0) return true
  const categories = await local.listCategories()
  const defaults = createDefaultCategories('')
  if (categories.length !== defaults.length) return true
  return categories.some((c) => {
    const d = defaults.find((x) => x.id === c.id)
    return !d || d.name !== c.name || d.color !== c.color
  })
}

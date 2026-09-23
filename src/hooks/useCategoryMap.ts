import { useMemo } from 'react'
import type { Category } from '@shared/types'
import { useCategories } from './useRepositoryData'

const FALLBACK_COLOR = '#475569'

/** Tra cứu danh mục theo id, kèm hàm lấy màu (mặc định xám nếu danh mục đã bị xóa). */
export function useCategoryMap() {
  const categories = useCategories()
  return useMemo(() => {
    const map = new Map<string, Category>((categories ?? []).map((c) => [c.id, c]))
    return {
      categories: categories ?? [],
      get: (id: string) => map.get(id),
      colorOf: (id: string) => map.get(id)?.color ?? FALLBACK_COLOR,
    }
  }, [categories])
}

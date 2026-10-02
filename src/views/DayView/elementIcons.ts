import { Diamond, Drop, Fire, Mountains, Tree, type Icon } from '@phosphor-icons/react'
import type { NguHanh } from '@shared/lunar'

/** Icon ngũ hành dùng chung cho Lịch vạn niên và Phong thủy cá nhân. */
export const ELEMENT_ICONS: Record<NguHanh, Icon> = {
  Kim: Diamond,
  Mộc: Tree,
  Thủy: Drop,
  Hỏa: Fire,
  Thổ: Mountains,
}

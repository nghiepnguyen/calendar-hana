/**
 * 月破 子午未申 with 德: 「不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣」. The 仍忌 headings move
 * from the general clause's spared list back to 忌, although 月破's base list does not name them.
 * Before the fix the resolver kept only the base list. Migration tests mock
 * LEGACY_STILL_AVOID_BASE_ONLY to `true` to rebuild the old output.
 */
export const LEGACY_STILL_AVOID_BASE_ONLY: boolean = false
export const YUE_PO_STILL_AVOID = {
  months: ['子', '午', '未', '申'],
  headings: '解除求醫療病破屋壞垣',
  quote: '與月德天德合月德合併不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣不與德合併諸事皆忌',
} as const

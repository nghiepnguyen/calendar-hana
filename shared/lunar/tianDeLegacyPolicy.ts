/**
 * Before issue #19 the almanac kept the legacy lunar-table Thiên Đức/Thiên Đức Hợp on the four
 * trigram months (坤/乾/艮/巽). The 協紀 月表 lists 天德 on no day of those months, so production
 * now always uses the authority. Migration tests mock this to `true` to rebuild the old output.
 */
export const KEEP_LEGACY_TRIGRAM_TIAN_DE: boolean = false

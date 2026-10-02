import { RULE_SOURCES } from '@shared/personalFengShui/rules'

interface Evidence {
  id: string
  version: string | null
  sourceIds: readonly string[]
}
// Reader-facing labels; paths and internal IDs remain in the audit documents.
const SOURCE_LABELS: Record<string, readonly [string, string]> = {
  mvp: ['Quy ước Phong thủy cá nhân', 'Mục 4.2–4.7 và 7.2'],
  annualSpec: ['Quy ước hạn năm', 'Phiên bản 1.0.0, mục 2–7'],
  attachmentAnnual: ['Tài liệu hạn phong thủy được cung cấp', 'Mục 1–3'],
  localCalendar: ['Lịch Việt Nam đang sử dụng', 'Năm âm, Can Chi và giờ theo UTC+7'],
  localElements: ['Bảng ngũ hành và nạp âm đang sử dụng', 'Can, quan hệ sinh/khắc và 60 Hoa Giáp'],
  lunisolar: ['Bảng quan hệ Can Chi', 'Lục xung, lục hợp, tam hợp và Can hợp'],
  selection: ['Tuyển trạch kỷ yếu', 'Ngũ hành sinh/khắc, Thiên can và phép định Can giờ'],
  batTrachCourse: ['Bài giảng Phong thủy Bát Trạch — Uông Sỹ Cần', 'Bài 7.I–II, trang 47–48'],
  khoiSuExtract: [
    'Trích đoạn Khởi sự',
    'II.1.a, trang in 2 / PDF 3; không ghi tác giả hoặc ấn bản. Chỉ sử dụng bảng Chi Tam Tai',
  ],
  personalStarsSpec: ['Quy ước quan hệ cá nhân mở rộng', 'Phiên bản 1.0.0, mục 2–7'],
  baziInterpretationSpec: ['Quy ước giải nghĩa Bát Tự', 'Phiên bản 1.1.0, mục 6.1 và 6.1a'],
  attachmentBaziEngine: ['Tài liệu engine Nhật Nguyên được cung cấp', 'Mục 3.1–3.2 và 5.1'],
}
const RULE_LABELS: Record<string, string> = {
  'personal.branch-relations': 'Quan hệ Địa chi',
  'personal.stem-relations': 'Quan hệ Thiên can',
  'personal.nap-am-elements': 'Nạp âm',
  'personal.birth-year-boundary': 'Mốc năm sinh',
  'personal.summary-policy': 'Tổng hợp ngày',
  'personal.hour-policy': 'Chọn giờ cá nhân',
  'personal.can-xung': 'Thiên can xung',
  'annual.nominal-age': 'Tuổi mụ',
  'annual.application-policy': 'Mục đích và vai trò',
  'annual.kim-lau': 'Kim Lâu',
  'annual.hoang-oc': 'Hoang Ốc',
  'annual.tam-tai': 'Tam Tai',
  'interpretation.day-master': 'Nhật Nguyên',
  'interpretation.element-count': 'Thống kê ngũ hành 8 chữ',
}
export function FengShuiSources({
  rules,
  mutedClassName,
}: {
  rules: readonly Evidence[]
  mutedClassName?: string
}) {
  const uniqueRules = [...new Map(rules.map((rule) => [rule.id, rule])).values()]
  const sources = [...new Set(rules.flatMap((rule) => rule.sourceIds))]
  return (
    <>
      <p>Chỉ tính các quy tắc đã kiểm chứng trong phạm vi công bố.</p>
      <ul>
        {uniqueRules.map((rule) => (
          <li key={rule.id}>
            {RULE_LABELS[rule.id] ?? 'Quy tắc tham khảo'}: phiên bản {rule.version ?? 'chưa có'}.
          </li>
        ))}
      </ul>
      <ul>
        {sources.map((id) => {
          const source = RULE_SOURCES[id]
          const label = SOURCE_LABELS[id]
          if (!source || !label) return null
          return (
            <li key={id}>
              {source.reference.startsWith('https://') ? (
                <a href={source.reference} target="_blank" rel="noreferrer">
                  {label[0]}
                </a>
              ) : (
                <span>{label[0]}</span>
              )}{' '}
              <span className={mutedClassName}>{label[1]}</span>
            </li>
          )
        })}
      </ul>
    </>
  )
}

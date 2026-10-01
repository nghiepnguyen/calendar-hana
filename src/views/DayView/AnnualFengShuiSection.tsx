import { useMemo, useState } from 'react'
import { isValidBirthDate } from '@shared/birthInfo'
import {
  assessAnnualFengShui,
  type AnnualPurpose,
  type AnnualRole,
  type AnnualRuleResult,
} from '@shared/personalFengShui/annual'
import { FENG_SHUI_RULES, type RuleDefinition } from '@shared/personalFengShui/rules'
import { FengShuiSources } from './FengShuiSources'
import styles from './PersonalFengShuiPanel.module.css'

const PURPOSES: readonly [AnnualPurpose, string][] = [
  ['general', 'Tham khảo chung'],
  ['wedding', 'Cưới hỏi'],
  ['construction', 'Xây nhà'],
  ['business', 'Khai trương'],
  ['carPurchase', 'Mua xe'],
  ['housePurchase', 'Mua nhà'],
  ['repair', 'Sửa nhà'],
  ['moveIn', 'Nhập trạch'],
  ['ritual', 'Nghi lễ'],
]
const ROLES: readonly [AnnualRole, string][] = [
  ['self', 'Bản thân (chưa xác nhận vai trò)'],
  ['bride', 'Tôi là cô dâu'],
  ['owner', 'Tôi là gia chủ'],
  ['principal', 'Tôi là người đứng chính'],
  ['other', 'Vai trò khác'],
  ['unspecified', 'Chưa rõ'],
]
const NAMES = {
  'annual.kim-lau': 'Kim Lâu',
  'annual.hoang-oc': 'Hoang Ốc',
  'annual.tam-tai': 'Tam Tai',
}
const PALACES = {
  nhatCat: 'Nhất Cát',
  nhiNghi: 'Nhì Nghi',
  tamDiaSat: 'Tam Địa Sát',
  tuTanTai: 'Tứ Tấn Tài',
  nguThoTu: 'Ngũ Thọ Tử',
  lucHoangOc: 'Lục Hoang Ốc',
}
const KINDS = { than: 'Thân', the: 'Thê', tu: 'Tử', suc: 'Súc' }
function valueLabel(result: AnnualRuleResult) {
  if (result.status !== 'applies')
    return {
      notApplicable: 'Không xét',
      insufficientData: 'Chưa đủ dữ liệu',
      unsupported: 'Chưa hỗ trợ',
    }[result.status]
  if (result.ruleId === 'annual.hoang-oc') return PALACES[result.value.palaceId]
  if (result.ruleId === 'annual.kim-lau')
    return result.value.kind ? `Kim Lâu ${KINDS[result.value.kind]}` : 'Không rơi vào Kim Lâu'
  return result.value.hit ? `Tam Tai: năm thứ ${result.value.stage}` : 'Không thuộc chu kỳ Tam Tai'
}
export function AnnualFengShuiSection({
  date,
  birthDate,
  rules = FENG_SHUI_RULES,
}: {
  date: string
  birthDate?: string | null
  rules?: readonly RuleDefinition[]
}) {
  // Session-only choices. Never infer a bride/homeowner from account or gender.
  const [purpose, setPurpose] = useState<AnnualPurpose>('general')
  const [role, setRole] = useState<AnnualRole>('self')
  const assessment = useMemo(
    () =>
      assessAnnualFengShui(
        {
          viewDate: date,
          birthDate: birthDate && !isValidBirthDate(birthDate) ? null : (birthDate ?? undefined),
          purpose,
          role,
        },
        rules,
      ),
    [date, birthDate, purpose, role, rules],
  )
  const context = assessment.context
  return (
    <section className={styles.section} aria-label="Hạn theo năm">
      <h3>Hạn theo năm</h3>
      <p className={styles.muted}>
        Theo năm âm lịch, tách riêng khỏi đánh giá ngày và giờ. Các lựa chọn chỉ dùng trong phiên
        xem này.
      </p>
      <div className={styles.controls}>
        <label>
          Mục đích xem hạn năm
          <select
            className="input"
            value={purpose}
            onChange={(e) => {
              const next = e.target.value as AnnualPurpose
              setPurpose(next)
              setRole(next === 'general' ? 'self' : 'unspecified')
            }}
          >
            {PURPOSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vai trò của bạn
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as AnnualRole)}
          >
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        Chỉ xét hồ sơ bản thân đã lưu. Hãy xác nhận vai trò khi xem cưới hỏi, xây nhà hoặc khai
        trương; chưa có hồ sơ của người khác.
      </p>
      {context.status === 'applies' ? (
        <p>
          Năm âm lịch đang xem: {context.viewLunarYear} · Tuổi mụ: {context.nominalAge}
        </p>
      ) : (
        <p>{context.reason}</p>
      )}
      <ul className={styles.results}>
        {assessment.results.map((result) => (
          <li className={styles.result} key={result.ruleId}>
            <h4>{NAMES[result.ruleId]}</h4>
            <p
              className={
                result.status === 'applies' && result.value.hit ? styles.caution : styles.neutral
              }
            >
              {valueLabel(result)}
            </p>
            <p>{result.reason}</p>
            {result.status === 'applies' ? (
              <p className={styles.muted}>
                {result.value.hit
                  ? 'Có yếu tố theo quy tắc đang xét.'
                  : 'Không có yếu tố theo quy tắc đang xét.'}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <details className={styles.details}>
        <summary>Cách tính hạn năm và nguồn</summary>
        <p>
          Tuổi mụ = năm âm đang xem − năm âm sinh + 1; đổi năm vào Tết theo lịch Việt Nam (UTC+7),
          không đổi ở Lập Xuân. Không cần giờ hoặc nơi sinh.
        </p>
        <p>
          Kim Lâu: tuổi mụ chia 9 dư 1, 3, 6, 8. Hoang Ốc: khởi cung ở mốc chục và đếm tới tuổi, chỉ
          hỗ trợ tuổi mụ 10–69. Tam Tai: nhóm tam hợp tuổi và ba Chi năm của chu kỳ.
        </p>
        <p>
          Kim Lâu chỉ xét cô dâu khi cưới hỏi hoặc gia chủ khi xây nhà; Hoang Ốc chỉ xét gia chủ xây
          nhà. Tam Tai cần xác nhận người đứng chính khi khai trương. Mục đích khác chưa được kiểm
          chứng.
        </p>
        <p>
          Đây là thông tin văn hóa tham khảo, không dự báo sức khỏe, tài chính hay kết quả công
          việc. Hạn năm không làm đổi nhãn hoàng đạo chung hoặc kết luận cá nhân của ngày.
        </p>
        {assessment.results.map((result) => (
          <p key={result.ruleId}>
            {NAMES[result.ruleId]}: phiên bản {result.ruleVersion ?? 'chưa có'}.
          </p>
        ))}
        <FengShuiSources rules={assessment.results.flatMap((result) => result.requiredRules)} />
      </details>
    </section>
  )
}

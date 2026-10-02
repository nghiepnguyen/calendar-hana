import { useMemo, useState, type CSSProperties } from 'react'
import {
  CalendarCheck,
  CheckCircle,
  HourglassMedium,
  MinusCircle,
  Planet,
  WarningCircle,
} from '@phosphor-icons/react'
import { isValidBirthDate } from '@shared/birthInfo'
import { assessAnnualFengShui, type AnnualRuleResult } from '@shared/personalFengShui/annual'
import { calculateSaoHan } from '@shared/personalFengShui/annual/saoHan'
import { FENG_SHUI_RULES, type RuleDefinition } from '@shared/personalFengShui/rules'
import type { ExplainItem } from './AlmanacExplain'
import { Tile } from './AlmanacPanel'
import { HAN_MEANING } from './personalExplain'
import { Collapsible, InfoButton } from './personalUi'
import { iconSize } from '../../styles/textSize'
import styles from './PersonalFengShuiPanel.module.css'

type AnnualView = 'male' | 'female'
const FACTOR_NAMES = {
  'annual.kim-lau': 'Hạn Kim Lâu',
  'annual.hoang-oc': 'Hạn Hoang Ốc',
  'annual.tam-tai': 'Hạn Tam Tai',
} as const
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
  if (result.status !== 'applies') return 'Chưa có dữ liệu'
  if (result.ruleId === 'annual.hoang-oc') return PALACES[result.value.palaceId]
  if (result.ruleId === 'annual.kim-lau')
    return result.value.kind ? `Kim Lâu ${KINDS[result.value.kind]}` : 'Không rơi vào Kim Lâu'
  return result.value.hit ? `Tam Tai: năm thứ ${result.value.stage}` : 'Không thuộc chu kỳ Tam Tai'
}

/** Ô nổi bật: Sao chiếu mệnh và Hạn tuổi, giá trị chữ lớn như ô 28 tú của Lịch vạn niên. */
function FeatureCell({
  label,
  value,
  icon: CellIcon,
}: {
  label: string
  value?: string
  icon: typeof Planet
}) {
  return (
    <li className={styles.featureCell}>
      <span className={styles.featureLabel}>
        <CellIcon size={iconSize(15)} weight="duotone" aria-hidden="true" />
        {label}
      </span>
      <span className={value ? styles.featureValue : styles.featureEmpty}>
        {value ?? 'Chưa có dữ liệu'}
      </span>
    </li>
  )
}

/** Ô hạn có/không phạm: phạm thì tô sắc cảnh báo, kèm nhãn để quét nhanh. */
function HanCell({
  label,
  result,
  index,
  onExplain,
}: {
  label: string
  result?: AnnualRuleResult
  index: number
  onExplain?: () => void
}) {
  const applies = result?.status === 'applies'
  const hit = applies && result.value.hit
  return (
    <li
      className={`${styles.hanCell} ${hit ? styles.hanHit : ''}`}
      style={{ '--j': index } as CSSProperties}
    >
      <span
        className={`${styles.hanIcon} ${!applies ? styles.muted : hit ? styles.caution : styles.favorable}`}
        aria-hidden="true"
      >
        {!applies ? (
          <MinusCircle size={iconSize(18)} weight="fill" />
        ) : hit ? (
          <WarningCircle size={iconSize(18)} weight="fill" />
        ) : (
          <CheckCircle size={iconSize(18)} weight="fill" />
        )}
      </span>
      <div className={styles.hanBody}>
        <h4>{label}</h4>
        <p
          className={`${styles.hanValue} ${hit ? styles.caution : ''} ${applies ? '' : styles.hanEmpty}`}
        >
          {result ? valueLabel(result) : 'Chưa có dữ liệu'}
        </p>
      </div>
      <span className={styles.hanAside}>
        {applies ? (
          <span
            className={`${styles.tonePill} ${hit ? styles.pill_caution : styles.pill_favorable}`}
          >
            {hit ? 'Phạm' : 'Không phạm'}
          </span>
        ) : null}
        {onExplain ? <InfoButton label={label} onClick={onExplain} /> : null}
      </span>
    </li>
  )
}

export function AnnualFengShuiSection({
  index = 0,
  date,
  birthDate,
  savedGender = null,
  rules = FENG_SHUI_RULES,
  onExplain,
}: {
  index?: number
  date: string
  birthDate?: string | null
  /** Giới tính trong hồ sơ sinh; chọn Nam/Nữ mạng ở đây chỉ đổi tạm cho lần xem này. */
  savedGender?: AnnualView | null
  rules?: readonly RuleDefinition[]
  onExplain?: (item: ExplainItem) => void
}) {
  const [annualView, setAnnualView] = useState<AnnualView>(savedGender ?? 'male')
  const assessments = useMemo(() => {
    const safeBirthDate = birthDate && isValidBirthDate(birthDate) ? birthDate : undefined
    const input = { viewDate: date, birthDate: safeBirthDate }
    return {
      general: assessAnnualFengShui({ ...input, purpose: 'general', role: 'self' }, rules),
      wedding: assessAnnualFengShui({ ...input, purpose: 'wedding', role: 'bride' }, rules),
      construction: assessAnnualFengShui(
        { ...input, purpose: 'construction', role: 'owner' },
        rules,
      ),
    }
  }, [date, birthDate, rules])
  const context = assessments.general.context
  const saoHan =
    context.status === 'applies' ? calculateSaoHan(context.nominalAge, annualView) : null
  const resultFor = (assessment: typeof assessments.general, ruleId: keyof typeof FACTOR_NAMES) =>
    assessment.results.find((result) => result.ruleId === ruleId)
  const han = [
    { ruleId: 'annual.tam-tai', assessment: assessments.general },
    { ruleId: 'annual.kim-lau', assessment: assessments.wedding },
    { ruleId: 'annual.hoang-oc', assessment: assessments.construction },
  ] as const
  const hitCount = han.filter(({ ruleId, assessment }) => {
    const result = resultFor(assessment, ruleId)
    return result?.status === 'applies' && result.value.hit
  }).length

  const explainHan = (ruleId: keyof typeof FACTOR_NAMES) => {
    const result = resultFor(han.find((h) => h.ruleId === ruleId)!.assessment, ruleId)
    if (!result || !onExplain) return undefined
    const hit = result.status === 'applies' && result.value.hit
    return () =>
      onExplain({
        title: FACTOR_NAMES[ruleId],
        isGood: !hit,
        verdict:
          result.status === 'applies'
            ? { label: hit ? 'Phạm' : 'Không phạm', tone: hit ? 'bad' : 'good' }
            : { label: 'Chưa có dữ liệu', tone: 'neutral' },
        meaning: HAN_MEANING[ruleId],
        reasons: [`Kết quả: ${valueLabel(result)}.`, ...(result.reason ? [result.reason] : [])],
      })
  }
  const summary =
    context.status === 'applies'
      ? saoHan
        ? `Sao ${saoHan.sao}, hạn ${saoHan.han}`
        : `Phạm ${hitCount}/3 hạn`
      : context.reason

  return (
    <Tile
      index={index}
      wide="full"
      icon={CalendarCheck}
      title="Hạn theo năm"
      label="Hạn theo năm"
      aside={context.status === 'applies' ? `Phạm ${hitCount}/3 hạn` : undefined}
    >
      <Collapsible summary={summary}>
        <div className={styles.annualMeta}>
          <p className={styles.annualContext}>
            {context.status === 'applies'
              ? `Năm âm lịch ${context.viewLunarYear}, tuổi mụ ${context.nominalAge}`
              : context.reason}
          </p>
          <fieldset className={styles.genderPicker}>
            <legend>Nhóm xem</legend>
            {(['male', 'female'] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="annual-view"
                  value={value}
                  checked={annualView === value}
                  onChange={() => setAnnualView(value)}
                />
                {value === 'male' ? 'Nam mạng' : 'Nữ mạng'}
              </label>
            ))}
          </fieldset>
        </div>
        <h4 className={styles.groupLabel}>Yếu tố vận hạn</h4>
        <ul className={styles.featureGrid}>
          <FeatureCell label="Sao chiếu mệnh" value={saoHan?.sao} icon={Planet} />
          <FeatureCell label="Hạn tuổi (Năm)" value={saoHan?.han} icon={HourglassMedium} />
        </ul>
        <ul className={styles.hanGrid}>
          {han.map(({ ruleId, assessment }, i) => (
            <HanCell
              key={ruleId}
              index={i}
              label={FACTOR_NAMES[ruleId]}
              result={resultFor(assessment, ruleId)}
              onExplain={explainHan(ruleId)}
            />
          ))}
        </ul>
        <p className={styles.annualNotice}>
          {annualView === 'male' ? 'Đang xem theo Nam mạng.' : 'Đang xem theo Nữ mạng.'}{' '}
          {savedGender ? null : (
            <>
              <a href="/settings#birth-info">Lưu giới tính trong hồ sơ sinh</a> để không phải chọn
              lại.{' '}
            </>
          )}
          Bộ sao chiếu mệnh và lời khuyên theo giới tính đang được bổ sung.
        </p>
      </Collapsible>
    </Tile>
  )
}

import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
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
import { assessPersonalAnnualAfflictions } from '@shared/personalFengShui/annual/afflictions'
import { calculateSaoHan } from '@shared/personalFengShui/annual/saoHan'
import { CHI } from '@shared/lunar/canChi'
import {
  createRuleRegistry,
  FENG_SHUI_RULES,
  type RuleDefinition,
} from '@shared/personalFengShui/rules'
import type { ExplainItem } from './AlmanacExplain'
import { Tile } from './AlmanacPanel'
import { HAN_MEANING } from './personalExplain'
import { InfoButton } from './personalUi'
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
const THAI_TUE_LABELS = {
  truc: 'Trực Thái Tuế',
  xung: 'Xung Thái Tuế (Tuế Phá)',
  hinh: 'Hình Thái Tuế',
  hai: 'Hại Thái Tuế',
  pha: 'Phá Thái Tuế',
} as const
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
  onExplain,
}: {
  label: string
  value?: string
  icon: typeof Planet
  onExplain?: () => void
}) {
  return (
    <li className={`${styles.annualBox} ${styles.featureCell}`}>
      <span className={styles.featureHead}>
        <h5 className={styles.featureLabel}>
          <CellIcon size={iconSize(16)} weight="duotone" aria-hidden="true" />
          {label}
        </h5>
        {onExplain ? <InfoButton label={label} onClick={onExplain} /> : null}
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
      className={`${styles.annualBox} ${styles.hanCell} ${hit ? styles.hanHit : ''}`}
      style={{ '--j': index } as CSSProperties}
    >
      <span className={styles.hanHead}>
        <span
          className={`${styles.hanIcon} ${!applies ? styles.muted : hit ? styles.caution : styles.favorable}`}
          aria-hidden="true"
        >
          {!applies ? (
            <MinusCircle size={iconSize(16)} weight="fill" />
          ) : hit ? (
            <WarningCircle size={iconSize(16)} weight="fill" />
          ) : (
            <CheckCircle size={iconSize(16)} weight="fill" />
          )}
        </span>
        <h5>{label}</h5>
      </span>
      {onExplain ? (
        <span className={styles.hanAside}>
          <InfoButton label={label} onClick={onExplain} />
        </span>
      ) : null}
      <p
        className={`${styles.hanValue} ${hit ? styles.caution : ''} ${applies ? '' : styles.hanEmpty}`}
      >
        {result ? valueLabel(result) : 'Chưa có dữ liệu'}
      </p>
      {applies ? (
        <span
          className={`${styles.hanPill} ${styles.tonePill} ${hit ? styles.pill_caution : styles.pill_favorable}`}
        >
          {hit ? 'Phạm' : 'Không phạm'}
        </span>
      ) : null}
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
  // Mỗi phần có gate riêng: Cửu Diệu có nguồn Ngọc Hạp Ký; Hạn tuổi chưa có nguồn nên ẩn.
  const { saoReady, hanReady } = useMemo(() => {
    const registry = createRuleRegistry(rules)
    return {
      saoReady: registry.getReadiness('annual', ['annual.sao-chieu-menh']).status === 'ready',
      hanReady: registry.getReadiness('annual', ['annual.han-tuoi']).status === 'ready',
    }
  }, [rules])
  const saoHan =
    context.status === 'applies' ? calculateSaoHan(context.nominalAge, annualView) : null
  const afflictions = useMemo(
    () => (birthDate ? assessPersonalAnnualAfflictions(birthDate, date) : null),
    [birthDate, date],
  )
  const sao = saoReady ? saoHan?.sao : undefined
  const hanTuoi = hanReady ? saoHan?.han : undefined
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
  const explainSao =
    sao && saoHan && onExplain
      ? () =>
          onExplain({
            title: `Sao ${sao}`,
            isGood: true,
            verdict: { label: annualView === 'male' ? 'Nam mạng' : 'Nữ mạng', tone: 'neutral' },
            meaning:
              'Theo bảng Cửu Diệu trong Ngọc Hạp Ký (玉匣記): lấy tuổi mụ chia 9, Nam bắt đầu từ La Hầu, Nữ bắt đầu từ Kế Đô.',
            reasons: [
              `Tuổi mụ ${saoHan.nominalAge} chia 9 dư ${saoHan.saoRemainder}.`,
              'Chưa gắn nhãn cát hay hung: sách gốc mô tả mỗi sao khác nhau theo Nam mạng và Nữ mạng, không chia nhóm cố định.',
            ],
          })
      : undefined

  return (
    <Tile
      index={index}
      wide="full"
      icon={CalendarCheck}
      title="Hạn theo năm"
      label="Hạn theo năm"
      aside={context.status === 'applies' ? `Phạm ${hitCount}/3 hạn` : undefined}
    >
      <div>
        <div className={styles.annualSurface}>
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

          <section className={styles.annualCluster} aria-label="Yếu tố vận hạn">
            <div className={styles.annualSectionHead}>
              <h4>Yếu tố vận hạn</h4>
            </div>
            <ul className={styles.featureGrid}>
              <FeatureCell
                label="Sao chiếu mệnh"
                value={sao}
                icon={Planet}
                onExplain={explainSao}
              />
              {hanReady ? (
                <FeatureCell label="Hạn tuổi (Năm)" value={hanTuoi} icon={HourglassMedium} />
              ) : null}
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
          </section>

          {afflictions?.status === 'ready' ? (
            <div className={styles.afflictionGrid}>
              <section
                className={`${styles.annualBox} ${styles.afflictionSection}`}
                aria-label="Phạm theo tuổi"
              >
                <div className={styles.annualSectionHead}>
                  <h4>Phạm theo tuổi</h4>
                  <p>
                    Tuổi {CHI[afflictions.birthYearChi]} gặp năm {CHI[afflictions.viewYearChi]}.
                  </p>
                </div>
                <ul className={styles.afflictionList}>
                  {afflictions.thaiTue.length ? (
                    afflictions.thaiTue.map((kind) => (
                      <li className={styles.afflictionHit} key={kind}>
                        <WarningCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                        {kind === 'hinh' && afflictions.birthYearChi === afflictions.viewYearChi
                          ? 'Tự Hình Thái Tuế'
                          : THAI_TUE_LABELS[kind]}
                      </li>
                    ))
                  ) : (
                    <li>
                      <CheckCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                      Không phạm Thái Tuế theo các quan hệ đang xét
                    </li>
                  )}
                  {!afflictions.tuePha ? (
                    <li>
                      <CheckCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                      Không phạm Tuế Phá
                    </li>
                  ) : null}
                  <li className={afflictions.tamSat.hit ? styles.afflictionHit : undefined}>
                    {afflictions.tamSat.hit ? (
                      <WarningCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                    ) : (
                      <CheckCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                    )}
                    {afflictions.tamSat.hit ? 'Phạm Tam Sát' : 'Không phạm Tam Sát'}
                  </li>
                </ul>
              </section>
              <section
                className={`${styles.annualBox} ${styles.afflictionSection}`}
                aria-label="Sát Chủ của ngày"
              >
                <div className={styles.annualSectionHead}>
                  <h4>Sát Chủ của ngày</h4>
                  <p>
                    Tháng {afflictions.satChu.lunarMonth} âm lịch · ngày{' '}
                    {CHI[afflictions.satChu.dayBranch]}; tính theo ngày, không theo tuổi.
                  </p>
                </div>
                <ul className={styles.afflictionList}>
                  {afflictions.satChu.am || afflictions.satChu.duong ? (
                    <>
                      {afflictions.satChu.am ? (
                        <li className={styles.afflictionHit}>
                          <WarningCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                          Sát Chủ Âm
                        </li>
                      ) : null}
                      {afflictions.satChu.duong ? (
                        <li className={styles.afflictionHit}>
                          <WarningCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                          Sát Chủ Dương
                        </li>
                      ) : null}
                    </>
                  ) : (
                    <li>
                      <CheckCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                      Không phạm Sát Chủ Âm hoặc Dương
                    </li>
                  )}
                </ul>
              </section>
            </div>
          ) : null}
          {!savedGender ? (
            <p className={styles.annualProfileHint}>
              <Link to="/settings#birth-info">Lưu giới tính trong hồ sơ sinh</Link> để không phải chọn
              lại.
            </p>
          ) : null}
        </div>
      </div>
    </Tile>
  )
}

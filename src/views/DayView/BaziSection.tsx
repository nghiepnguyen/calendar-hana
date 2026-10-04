import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CaretDown, Columns } from '@phosphor-icons/react'
import { calculateBazi } from '@shared/bazi'
import {
  dayMasterOf,
  elementDistribution,
  type FourPillars,
} from '@shared/bazi/interpretation/dayMaster'
import { hiddenStemsOf, type HiddenStemRank } from '@shared/bazi/interpretation/hiddenStems'
import { assessStrength } from '@shared/bazi/interpretation/strength'
import { tenGodOf } from '@shared/bazi/interpretation/tenGods'
import {
  createRuleRegistry,
  FENG_SHUI_RULES,
  type RuleDefinition,
} from '@shared/personalFengShui/rules'
import { CAN, CHI } from '@shared/lunar/canChi'
import { canElement, chiElement, type NguHanh } from '@shared/lunar/elements'
import type { Settings } from '@shared/types'
import type { ExplainItem } from './AlmanacExplain'
import { ElementChip, Tile } from './AlmanacPanel'
import { ELEMENT_ICONS } from './elementIcons'
import { InfoButton } from './personalUi'
import { iconSize } from '../../styles/textSize'
import almanac from './AlmanacPanel.module.css'
import styles from './BaziSection.module.css'

const ELEMENT_CLASS: Record<NguHanh, string> = {
  Kim: almanac.elKim,
  Mộc: almanac.elMoc,
  Thủy: almanac.elThuy,
  Hỏa: almanac.elHoa,
  Thổ: almanac.elTho,
}

function correctionLabel(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+'
  const abs = Math.abs(Math.round(seconds))
  return abs < 60 ? `${sign}${abs} giây` : `${sign}${Math.round(abs / 60)} phút`
}

function solarTimeLabel(birthDate: string | null | undefined, tstDateTime: string): string {
  const [date, time] = tstDateTime.split('T')
  return date === birthDate ? time.slice(0, 5) : `${time.slice(0, 5)} ngày ${date}`
}

const RANK_LABEL: Record<HiddenStemRank, string> = {
  main: 'bản khí',
  middle: 'trung khí',
  residual: 'dư khí',
}

/** Một cột của lá số: Thập thần, Can, Chi; tàng can chỉ hiện khi mở chung cho cả lá số. */
function Pillar({
  label,
  pillar,
  index,
  dayMaster = false,
  dayMasterCan = null,
  showHidden = false,
  monthCommand = false,
}: {
  label: string
  pillar: { can: number; chi: number }
  index: number
  dayMaster?: boolean
  /** Can của Nhật Nguyên khi lớp Thập thần đã mở; null thì không hiện Thập thần. */
  dayMasterCan?: number | null
  showHidden?: boolean
  monthCommand?: boolean
}) {
  const canEl = canElement(pillar.can)
  const chiEl = chiElement(pillar.chi)
  const hidden = showHidden ? hiddenStemsOf(pillar.chi, dayMasterCan ?? pillar.can) : []
  return (
    <li
      className={`${styles.pillar} ${dayMaster ? `${styles.dayPillar} ${ELEMENT_CLASS[canEl]}` : ''}`}
      style={{ '--j': index } as CSSProperties}
    >
      {monthCommand ? <span className={styles.monthCommand}>Nguyệt lệnh</span> : null}
      <span className={styles.pillarLabel}>{label}</span>
      {dayMasterCan !== null ? (
        <span className={`${styles.tenGod} ${dayMaster ? styles.tenGodSelf : ''}`}>
          {dayMaster ? 'Nhật Nguyên' : tenGodOf(dayMasterCan, pillar.can).name}
        </span>
      ) : null}
      <p className={styles.pillarName}>
        <span className={`${styles.glyph} ${ELEMENT_CLASS[canEl]}`}>{CAN[pillar.can]}</span>{' '}
        <span className={`${styles.glyph} ${ELEMENT_CLASS[chiEl]}`}>{CHI[pillar.chi]}</span>
      </p>
      <span className={styles.pillarElements}>
        {canEl} · {chiEl}
      </span>
      {hidden.length ? (
        <ul className={styles.hidden} aria-label={`Tàng can của ${CHI[pillar.chi]}`}>
          {hidden.map((h) => (
            <li key={h.can}>
              <span className={`${styles.hiddenName} ${ELEMENT_CLASS[canElement(h.can)]}`}>
                {h.name}
              </span>
              <span className={styles.hiddenMeta}>
                <span>{RANK_LABEL[h.rank]}</span>
                {dayMasterCan !== null ? (
                  <>
                    <span className={styles.sep}>, </span>
                    <span>{h.tenGod}</span>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

const POSITION_LABEL: Record<string, string> = {
  'year.can': 'Can năm',
  'year.chi': 'Chi năm',
  'month.can': 'Can tháng',
  'month.chi': 'Chi tháng',
  'day.chi': 'Chi ngày',
  'hour.can': 'Can giờ',
  'hour.chi': 'Chi giờ',
}

/** Vòng đo 0–100 với vạch ngưỡng; chỉ minh họa, con số nằm ở chữ bên cạnh. */
function StrengthGauge({
  score,
  threshold,
  strong,
}: {
  score: number
  threshold: number
  strong: boolean
}) {
  const r = 15
  const c = 2 * Math.PI * r
  const angle = (threshold / 100) * 360 - 90
  const tx = 18 + r * Math.cos((angle * Math.PI) / 180)
  const ty = 18 + r * Math.sin((angle * Math.PI) / 180)
  return (
    <svg className={styles.gauge} viewBox="0 0 36 36" aria-hidden="true">
      <circle className={styles.gaugeTrack} cx="18" cy="18" r={r} />
      <circle
        className={`${styles.gaugeValue} ${strong ? styles.strong : styles.weak}`}
        cx="18"
        cy="18"
        r={r}
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 18 18)"
      />
      <circle className={styles.gaugeTick} cx={tx} cy={ty} r="1.6" />
    </svg>
  )
}

/** Dòng Vượng suy: nhãn và điểm; các vị trí cộng điểm nằm trong hộp giải thích. */
function StrengthScore({
  pillars,
  onExplain,
}: {
  pillars: FourPillars
  onExplain?: (item: ExplainItem) => void
}) {
  const result = assessStrength(pillars)
  const strong = result.strength === 'Thân Vượng'
  return (
    <section className={styles.fact} aria-label="Độ vượng suy">
      <span className={styles.factLabel}>Vượng suy</span>
      <span className={styles.factValue}>
        <StrengthGauge score={result.score} threshold={result.threshold} strong={strong} />
        <span className={styles.strengthText}>
          <span className={`${styles.strengthPill} ${strong ? styles.strong : styles.weak}`}>
            {result.strength}
          </span>
          <span className={styles.strengthScore}>
            <strong>{result.score}</strong>/100
          </span>
        </span>
      </span>
      {onExplain ? (
        <InfoButton
          label="Độ vượng suy"
          onClick={() =>
            onExplain({
              title: 'Độ vượng suy',
              isGood: strong,
              verdict: { label: result.strength, tone: 'neutral' },
              meaning: `Cộng trọng số các vị trí có hành ${result.supportElements.join(' hoặc ')} (cùng hành hoặc sinh ra Nhật Nguyên). Từ ${result.threshold} điểm là Thân Vượng. Bản đơn giản theo trọng số vị trí, chưa xét tàng can và hợp xung.`,
              reasons: [
                ...result.contributions.map(
                  (c) =>
                    `${POSITION_LABEL[c.position]} ${c.name} (${c.element}): ${c.supports ? `+${c.weight}` : 'không trợ lực'}`,
                ),
                `Tổng ${result.score}/100. Trọng số: Chi tháng 35, Chi ngày 15, Can tháng 12, Can giờ 12, Chi giờ 10, Chi năm 10, Can năm 6; Can ngày không tính.`,
              ],
            })
          }
        />
      ) : null}
    </section>
  )
}

/** Cột tóm tắt bên cạnh lá số: Nhật Nguyên, Vượng suy, Ngũ hành; mỗi mục một dòng. */
function DayMasterInsight({
  pillars,
  showStrength,
  onExplain,
}: {
  pillars: FourPillars
  showStrength: boolean
  onExplain?: (item: ExplainItem) => void
}) {
  const dayMaster = dayMasterOf(pillars)
  const distribution = elementDistribution(pillars)
  return (
    <section className={styles.insight} aria-label="Nhật Nguyên và ngũ hành">
      <div className={styles.insightCore}>
        <div className={`${styles.fact} ${ELEMENT_CLASS[dayMaster.element]}`}>
          <span className={styles.factLabel}>Nhật Nguyên</span>
          <span className={styles.factValue}>
            <strong className={styles.dayMasterName}>{dayMaster.name}</strong>
            <ElementChip element={dayMaster.element} />
            <span className={styles.polarity}>{dayMaster.polarity}</span>
          </span>
          {onExplain ? (
            <InfoButton
              label="Nhật Nguyên"
              onClick={() =>
                onExplain({
                  title: `Nhật Nguyên ${dayMaster.name}`,
                  isGood: true,
                  verdict: {
                    label: `${dayMaster.element}, ${dayMaster.polarity}`,
                    tone: 'neutral',
                  },
                  meaning: `Nhật Nguyên là Thiên can của trụ Ngày. Trong phép Tử Bình, đây là phần đại diện cho bản thân; bảy chữ còn lại được xét theo quan hệ sinh, khắc với ${dayMaster.name} (${dayMaster.element}).`,
                  reasons: [
                    'Can có chỉ số chẵn (Giáp, Bính, Mậu, Canh, Nhâm) là Dương, lẻ là Âm.',
                    'Không lấy nạp âm năm sinh làm Nhật Nguyên.',
                  ],
                })
              }
            />
          ) : null}
        </div>
        {showStrength ? <StrengthScore pillars={pillars} onExplain={onExplain} /> : null}
        <div className={styles.elements}>
          <span className={styles.factLabel}>Ngũ hành</span>
          <ul className={styles.elementList} aria-label="Số chữ theo ngũ hành">
            {distribution.entries.map(({ element, count, percentage, positions }, i) => {
              const ElementIcon = ELEMENT_ICONS[element]
              const own = element === dayMaster.element
              return (
                <li
                  key={element}
                  className={`${styles.elementItem} ${ELEMENT_CLASS[element]} ${own ? styles.elementOwn : ''} ${count === 0 ? styles.elementNone : ''}`}
                  style={{ '--j': i } as CSSProperties}
                  title={`${element}: ${count}/8 chữ (${percentage}%)${positions.length ? `: ${positions.map((p) => p.name).join(', ')}` : ''}`}
                >
                  <span
                    className={styles.elementOrb}
                    style={{ '--fill': `${Math.min(count, 4) * 9 + 6}%` } as CSSProperties}
                  >
                    <span className={styles.elementCount}>{count}</span>
                  </span>
                  <span className={styles.elementName}>
                    <ElementIcon size={iconSize(12)} weight="light" aria-hidden="true" />
                    {element}
                  </span>
                </li>
              )
            })}
          </ul>
          <span className={styles.insightNote}>
            Đếm 4 Can và hành chính của 4 Chi; không phải độ vượng suy.
          </span>
        </div>
      </div>
    </section>
  )
}

const INSIGHT_RULES = ['interpretation.day-master', 'interpretation.element-count'] as const
const STRENGTH_RULES = ['interpretation.strength-score'] as const
const TEN_GOD_RULES = ['interpretation.day-master', 'interpretation.thap-than'] as const
const HIDDEN_RULES = ['interpretation.hidden-stems'] as const

const TEN_GOD_EXPLAIN: ExplainItem = {
  title: 'Thập thần và Tàng can',
  isGood: true,
  verdict: { label: 'Mô tả quan hệ', tone: 'neutral' },
  meaning:
    'Thập thần là tên quan hệ của mỗi Can với Nhật Nguyên, đọc từ Nhật Nguyên sang Can đó. Tên chỉ mô tả quan hệ sinh khắc, không mang nghĩa tốt hay xấu.',
  reasons: [
    'Cùng hành: Tỷ Kiên (cùng âm dương) hoặc Kiếp Tài.',
    'Nhật Nguyên sinh ra: Thực Thần hoặc Thương Quan.',
    'Nhật Nguyên khắc: Thiên Tài hoặc Chính Tài.',
    'Khắc Nhật Nguyên: Thất Sát hoặc Chính Quan.',
    'Sinh ra Nhật Nguyên: Thiên Ấn hoặc Chính Ấn.',
    'Tàng can là các Can ẩn trong mỗi Chi, xếp theo bản khí, trung khí, dư khí. Chi tháng (Nguyệt lệnh) là trục mùa của lá số. Tàng can không được cộng vào điểm vượng suy.',
    'Theo Tam Mệnh Thông Hội (三命通會), quyển 5 và 7.',
  ],
}

export function BaziSection({
  settings,
  index = 0,
  rules = FENG_SHUI_RULES,
  onExplain,
}: {
  settings: Settings
  index?: number
  rules?: readonly RuleDefinition[]
  onExplain?: (item: ExplainItem) => void
}) {
  const result = useMemo(() => calculateBazi(settings), [settings])
  const [hiddenOpen, setHiddenOpen] = useState(false)
  const { insightReady, strengthReady, tenGodReady, hiddenReady } = useMemo(() => {
    const registry = createRuleRegistry(rules)
    const ready = (ids: readonly string[]) =>
      registry.getReadiness('interpretation', ids).status === 'ready'
    return {
      insightReady: ready(INSIGHT_RULES),
      strengthReady: ready(STRENGTH_RULES),
      tenGodReady: ready(TEN_GOD_RULES),
      hiddenReady: ready(HIDDEN_RULES),
    }
  }, [rules])
  return (
    <Tile
      index={index}
      wide="full"
      icon={Columns}
      title="Tứ Trụ theo giờ sinh"
      label="Tứ Trụ theo giờ sinh"
      aside={
        (tenGodReady || hiddenReady) && onExplain && result.status !== 'insufficientData' ? (
          <InfoButton label="Thập thần và Tàng can" onClick={() => onExplain(TEN_GOD_EXPLAIN)} />
        ) : undefined
      }
    >
      {result.status === 'insufficientData' ? (
        <div className={styles.empty}>
          <p>{result.reason}</p>
          <Link className="btn" to="/settings#birth-info">
            Bổ sung hồ sơ sinh
          </Link>
        </div>
      ) : (
        <div>
          {result.status === 'ambiguous' ? (
            <p className={styles.meta}>
              Có {result.candidates.length} khả năng vì giờ sinh hoặc múi giờ nằm sát ranh giới.
            </p>
          ) : null}
          {result.candidates.map((candidate, candidateIndex) => (
            <div className={styles.candidate} key={`${candidate.instantUtc}:${candidateIndex}`}>
              {result.candidates.length > 1 ? (
                <h4 className={styles.candidateTitle}>Khả năng {candidateIndex + 1}</h4>
              ) : null}
              <div className={styles.layout}>
                <div className={styles.chart}>
                  <div className={styles.chartCore}>
                    <ul className={styles.pillars}>
                      {(
                        [
                          ['Năm', candidate.pillars.year],
                          ['Tháng', candidate.pillars.month],
                          ['Ngày', candidate.pillars.day],
                          ['Giờ', candidate.pillars.hour],
                        ] as const
                      ).map(([label, pillar], i) => (
                        <Pillar
                          key={label}
                          label={label}
                          pillar={pillar}
                          index={i}
                          dayMaster={insightReady && label === 'Ngày'}
                          dayMasterCan={tenGodReady ? candidate.pillars.day.can : null}
                          showHidden={hiddenReady && hiddenOpen}
                          monthCommand={hiddenReady && label === 'Tháng'}
                        />
                      ))}
                    </ul>
                    {hiddenReady ? (
                      <button
                        type="button"
                        className={styles.hiddenToggle}
                        aria-expanded={hiddenOpen}
                        onClick={() => setHiddenOpen((open) => !open)}
                      >
                        <span>{hiddenOpen ? 'Ẩn tàng can' : 'Tàng can'}</span>
                        <span className={styles.hiddenToggleIcon} aria-hidden="true">
                          <CaretDown size={iconSize(12)} weight="bold" />
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
                {insightReady ? (
                  <DayMasterInsight
                    pillars={candidate.pillars}
                    showStrength={strengthReady}
                    onExplain={onExplain}
                  />
                ) : null}
              </div>
              <p className={styles.meta}>
                Giờ mặt trời thật (TST){' '}
                {solarTimeLabel(settings.birthDate, candidate.solarTime.tstDateTime)}, lệch{' '}
                {correctionLabel(candidate.solarTime.totalCorrectionSeconds)} so với giờ đồng hồ{' '}
                {settings.birthTime}.
              </p>
            </div>
          ))}
        </div>
      )}
    </Tile>
  )
}

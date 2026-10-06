import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  CircleHalf,
  Info,
  Target,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react'
import { getAlmanac } from '@shared/lunar/almanac'
import { ACTIVITY_LABELS } from '@shared/lunar/activityRecommendations'
import {
  EVENT_OPTIONS,
  getEventProfile,
  resolveEventActivityRoles,
} from '@shared/lunar/eventMapping'
import { evaluateEventDay, type Contribution } from '@shared/lunar/eventEvaluation'
import { findNextGoodEventDate } from '@shared/lunar/eventRecommendations'
import { formatSolarShort } from '@shared/format'
import { iconSize } from '../../styles/textSize'
import styles from './DailyActivitySection.module.css'

const STATUS = {
  recommended: { label: 'Thuận lợi', icon: CheckCircle, tone: 'favorable' },
  caution: { label: 'Cân nhắc', icon: CircleHalf, tone: 'attention' },
  not_recommended: { label: 'Không thuận lợi', icon: XCircle, tone: 'attention' },
  insufficient_evidence: { label: 'Chưa đủ dữ liệu', icon: CircleHalf, tone: 'neutral' },
  conflict: { label: 'Dữ liệu xung đột', icon: WarningCircle, tone: 'attention' },
}
const CATEGORIES = [
  ['work', 'Công việc', ['business', 'social', 'education']],
  ['finance', 'Tài chính', ['business']],
  ['relationship', 'Tình cảm', ['relationship']],
  ['family', 'Gia đình', ['home', 'spiritual', 'construction']],
  ['health', 'Sức khỏe', ['health', 'personal_care']],
  ['travel', 'Xuất hành', ['movement']],
  ['other', 'Khác', ['agriculture', 'funeral']],
] as const
const ACTIVITY_EVENTS: Record<string, string> = {
  wedding: 'wedding',
  contract: 'sign_contract',
  cut_hair: 'cut_hair',
  moving: 'move_house',
  opening: 'open_business',
  groundbreaking: 'groundbreaking',
  travel: 'start_journey',
}
const ACTIVITY_STATUS = {
  recommended: 'Nên làm',
  neutral: 'Bình thường',
  avoid: 'Nên tránh',
  strong_avoid: 'Kỵ mạnh',
  watch: 'Cần lưu ý',
  consider: 'Cân nhắc',
  no_evidence: 'Chưa đủ dữ liệu',
}

/** One factor per rule (e.g. "Trực Bình"), even when it touches several activities of the event. */
interface Factor {
  key: string
  name: string
  delta: number
  hardWarning: boolean
  /** Activities other than the primary one; empty when the factor concerns only the primary. */
  extraActivities: string[]
}

function mergeFactors(rows: Contribution[], primaryId: string): Factor[] {
  const groups = new Map<string, Factor & { activities: Set<string> }>()
  for (const row of rows) {
    const key = `${row.source}:${row.ruleId.split(':')[0]}`
    const group = groups.get(key) ?? {
      key,
      name: row.label,
      delta: 0,
      hardWarning: false,
      extraActivities: [],
      activities: new Set<string>(),
    }
    group.delta += row.appliedDelta
    group.hardWarning ||= Boolean(row.hardWarning)
    group.activities.add(row.activityId)
    groups.set(key, group)
  }
  return [...groups.values()]
    .filter((group) => group.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .map(({ activities, ...group }) => ({
      ...group,
      extraActivities:
        activities.size === 1 && activities.has(primaryId)
          ? []
          : [...activities].map((id) => ACTIVITY_LABELS[id]?.toLowerCase() ?? id),
    }))
}

function FactorGroup({ factors, positive }: { factors: Factor[]; positive: boolean }) {
  const title = positive ? 'Yếu tố thuận' : 'Yếu tố bất lợi'
  const Icon = positive ? CheckCircle : WarningCircle
  return (
    <section
      className={`${styles.group} ${positive ? styles.positive : styles.warning}`}
      aria-label={title}
    >
      <h4 className={styles.groupTitle}>
        <Icon size={iconSize(16)} weight="fill" aria-hidden="true" />
        {positive ? 'Thuận' : 'Bất lợi'}
      </h4>
      {factors.length ? (
        <ul className={styles.chips}>
          {factors.map((factor) => (
            <li
              key={factor.key}
              className={factor.hardWarning ? styles.hard : undefined}
              title={factor.hardWarning ? 'Cảnh báo nghiêm trọng' : undefined}
            >
              <span className={styles.chipName}>{factor.name}</span>
              {factor.extraActivities.length > 0 && (
                <span className={styles.chipMeta}>{factor.extraActivities.join(', ')}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Không có</p>
      )}
    </section>
  )
}

export function DailyActivitySection({ date }: { date: string }) {
  const [selected, setSelected] = useState('')
  const [category, setCategory] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [time, setTime] = useState('')
  const [vehicleDeparture, setVehicleDeparture] = useState(false)
  const [moveIn, setMoveIn] = useState(false)
  const [transportMode, setTransportMode] = useState<'road' | 'water' | 'unknown'>('unknown')
  const input = useMemo(
    () => ({
      hour: time ? Number(time.split(':')[0]) + Number(time.split(':')[1]) / 60 : undefined,
      vehicleDeparture,
      moveIn,
      transportMode,
    }),
    [time, vehicleDeparture, moveIn, transportMode],
  )
  const data = useMemo(() => {
    const rows = getAlmanac(date).activityRecommendations
    const evaluation =
      selected && !selected.startsWith('activity:') ? evaluateEventDay(date, selected, input) : null
    const groups = CATEGORIES.find(([id]) => id === category)?.[2] as readonly string[] | undefined
    const filtered = groups ? rows.filter((row) => groups.includes(row.group)) : rows
    const primaryId =
      resolveEventActivityRoles(selected, input).find((role) => role.role === 'primary')
        ?.activityId ?? ''
    const factors = mergeFactors(
      evaluation?.contributions.filter(
        (row) => row.status === 'applied' && row.appliedDelta !== 0,
      ) ?? [],
      primaryId,
    )
    return {
      activity: rows.find((row) => selected === `activity:${row.activityId}`),
      recommended: filtered.filter((row) => row.status === 'recommended'),
      avoid: filtered.filter((row) => ['avoid', 'strong_avoid'].includes(row.status)),
      other: filtered.filter((row) => ['neutral', 'no_evidence'].includes(row.status)),
      consideration: filtered.filter((row) => ['watch', 'consider'].includes(row.status)),
      suitableHours:
        evaluation && getEventProfile(selected)?.mustHave.includes('good_hour')
          ? getAlmanac(date).hours.filter(
              (hour) =>
                evaluateEventDay(date, selected, {
                  ...input,
                  hour: hour.chi === 0 ? 0 : hour.chi * 2,
                }).classification === 'recommended',
            )
          : [],
      evaluation,
      favorable: factors.filter((factor) => factor.delta > 0),
      unfavorable: factors.filter((factor) => factor.delta < 0),
      informational: evaluation?.contributions.filter((row) => row.source === 'mansion') ?? [],
      next:
        evaluation &&
        evaluation.classification !== 'insufficient_evidence' &&
        evaluation?.classification !== 'conflict'
          ? findNextGoodEventDate(date, selected, 30, input)
          : null,
    }
  }, [date, selected, input, category])
  const activity = EVENT_OPTIONS.find(([id]) => id === selected)?.[1] ?? ''
  const verdict = STATUS[data.evaluation?.classification ?? 'insufficient_evidence']
  const verdictTone =
    data.evaluation?.classification === 'not_recommended' &&
    data.evaluation.contributions.some((row) => row.status === 'applied' && row.hardWarning)
      ? 'unfavorable'
      : verdict.tone
  const VerdictIcon = verdict.icon
  // Only say why when the verdict alone does not explain itself.
  const note = data.evaluation?.neutralByPolicy
    ? 'Không gặp ngày kỵ nào.'
    : data.evaluation?.classification === 'insufficient_evidence'
      ? (data.evaluation.mustHave.find((item) => item.status === 'unknown')?.reason ??
        'Chưa có quy tắc cho việc này.')
      : data.evaluation?.classification === 'conflict'
        ? 'Các quy tắc còn xung đột.'
        : null
  return (
    <section className={styles.section} aria-label="Mục tiêu và kết luận trong ngày">
      <div className={styles.head}>
        <Target size={iconSize(20)} aria-hidden="true" />
        <h3>
          <label htmlFor="personal-activity-category">Mục tiêu trong ngày</label>
        </h3>
        <select
          className={`input ${styles.select}`}
          id="personal-activity-category"
          aria-label="Nhóm mục tiêu"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setSelected('')
            setShowAll(false)
          }}
        >
          <option value="">Tổng quan</option>
          {CATEGORIES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className={styles.note}>Gợi ý mục tiêu theo lịch vạn niên, chưa xét hồ sơ sinh cá nhân.</p>
      <div
        aria-label={selected ? 'Chi tiết hoạt động' : undefined}
        role={selected ? 'region' : undefined}
      >
        {data.activity ? (
          <section className={styles.activityDetail}>
            <h4>{data.activity.label}</h4>
            <p
              className={
                styles[
                  data.activity.status === 'strong_avoid'
                    ? 'negativeText'
                    : data.activity.status === 'recommended'
                      ? 'positiveText'
                      : ['avoid', 'watch', 'consider'].includes(data.activity.status)
                        ? 'attentionText'
                        : 'neutralText'
                ]
              }
            >
              {ACTIVITY_STATUS[data.activity.status]}
            </p>
            <p className={styles.note}>Lý do chính</p>
            {data.activity.evidence.length ? (
              <ul>
                {data.activity.evidence.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Chưa có bằng chứng cho hoạt động này.</p>
            )}
            <button type="button" className="btn" onClick={() => setSelected('')}>
              Về tổng quan
            </button>
          </section>
        ) : selected ? (
          <>
            {(getEventProfile(selected)?.mustHave.includes('good_hour') ||
              selected === 'receive_vehicle' ||
              selected === 'buy_property' ||
              selected === 'start_journey') && (
              <div className={styles.context}>
                {getEventProfile(selected)?.mustHave.includes('good_hour') && (
                  <label className={styles.field}>
                    Giờ dự kiến
                    <input
                      type="time"
                      className="input"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                    />
                  </label>
                )}
                {selected === 'receive_vehicle' && (
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={vehicleDeparture}
                      onChange={(event) => setVehicleDeparture(event.target.checked)}
                    />
                    Có xuất hành bằng xe sau khi nhận
                  </label>
                )}
                {selected === 'buy_property' && (
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={moveIn}
                      onChange={(event) => setMoveIn(event.target.checked)}
                    />
                    Có chuyển vào ở khi mua
                  </label>
                )}
                {selected === 'start_journey' && (
                  <label className={styles.field}>
                    Phương tiện
                    <select
                      className="input"
                      value={transportMode}
                      onChange={(event) =>
                        setTransportMode(event.target.value as typeof transportMode)
                      }
                    >
                      <option value="unknown">Chưa xác định</option>
                      <option value="road">Đường bộ</option>
                      <option value="water">Đường thủy</option>
                    </select>
                  </label>
                )}
              </div>
            )}
            <section
              className={`${styles.verdict} ${styles[verdictTone]}`}
              aria-label="Kết luận mục tiêu"
            >
              <VerdictIcon
                className={styles.verdictIcon}
                size={iconSize(28)}
                weight="fill"
                aria-hidden="true"
              />
              <div className={styles.verdictText}>
                <p className={styles.eyebrow}>{activity} hôm nay</p>
                <p
                  className={styles.verdictTitle}
                  aria-label={`Đánh giá hôm nay: ${verdict.label}`}
                >
                  {verdict.label}
                </p>
                {note && <p className={styles.note}>{note}</p>}
              </div>
              {data.next && (
                <Link className={styles.next} to={`/day/${data.next}`}>
                  <span>
                    {data.evaluation?.classification === 'recommended'
                      ? 'Ngày phù hợp tiếp theo'
                      : 'Ngày phù hợp gần nhất'}
                    <strong>{formatSolarShort(data.next)}</strong>
                  </span>
                  <ArrowRight size={iconSize(18)} aria-hidden="true" />
                </Link>
              )}
            </section>
            {data.suitableHours.length > 0 && (
              <section aria-label="Giờ phù hợp cho mục tiêu">
                <h4>Giờ phù hợp theo lịch chung</h4>
                <p>
                  {data.suitableHours
                    .map(
                      (hour) =>
                        `${hour.name} ${String(hour.startHour).padStart(2, '0')}:00–${String(hour.endHour).padStart(2, '0')}:00`,
                    )
                    .join(' · ')}
                </p>
              </section>
            )}
            {data.favorable.length || data.unfavorable.length ? (
              <div className={styles.columns}>
                <FactorGroup positive factors={data.favorable} />
                <FactorGroup positive={false} factors={data.unfavorable} />
              </div>
            ) : (
              <p className={styles.empty} role="note" aria-label="Yếu tố trong ngày">
                {data.evaluation?.contributions.some((row) => row.status === 'applied') ||
                data.evaluation?.neutralByPolicy
                  ? 'Không có yếu tố thuận hay bất lợi.'
                  : 'Chưa có yếu tố được tính điểm.'}
              </p>
            )}
            {data.informational.length > 0 && (
              <details className={styles.more}>
                <summary>Thông tin Tú (tham khảo)</summary>
                <ul>
                  {data.informational.map((row) => (
                    <li key={`${row.ruleId}:${row.scope}`}>
                      <strong>{row.label}</strong>: {row.sourcePhrase} —{' '}
                      {ACTIVITY_LABELS[row.activityId]?.toLowerCase()} (
                      {row.polarity === 'positive' ? 'thuận' : 'bất lợi'})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <div className={styles.columns}>
            {[true, false].map((positive) => {
              const title = positive ? 'Việc nên làm trong ngày' : 'Việc không nên làm trong ngày'
              const Icon = positive ? CheckCircle : WarningCircle
              const allItems = positive ? data.recommended : data.avoid
              const items = showAll ? allItems : allItems.slice(0, 6)
              return (
                <section
                  key={title}
                  className={`${styles.group} ${positive ? styles.positive : styles.warning}`}
                  aria-label={title}
                >
                  <h4 className={styles.groupTitle}>
                    <Icon size={iconSize(16)} weight="fill" aria-hidden="true" />
                    {positive ? 'Nên làm' : 'Không nên làm'}
                  </h4>
                  {items.length ? (
                    <ul className={styles.chips}>
                      {items.map((item) => (
                        <li
                          key={item.activityId}
                          className={
                            item.status === 'strong_avoid' ? styles.strongAvoid : undefined
                          }
                        >
                          <button
                            type="button"
                            className={styles.activityButton}
                            aria-label={
                              positive
                                ? item.label
                                : `${item.label}: ${ACTIVITY_STATUS[item.status]}`
                            }
                            onClick={() =>
                              setSelected(
                                ACTIVITY_EVENTS[item.activityId] ?? `activity:${item.activityId}`,
                              )
                            }
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>
                      {positive ? 'Chưa có việc nổi bật' : 'Không có việc kỵ nổi bật'}
                    </p>
                  )}
                  {allItems.length > 6 && (
                    <button
                      type="button"
                      className="btn"
                      aria-expanded={showAll}
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Thu gọn' : `Xem thêm ${allItems.length - 6} việc`}
                    </button>
                  )}
                  {!positive && items.length > 0 && (
                    <p className={styles.avoidLegend}>
                      <span>
                        <i className={styles.avoidDot} aria-hidden="true" />
                        Nên tránh
                      </span>
                      <span>
                        <i className={styles.strongAvoidDot} aria-hidden="true" />
                        Kỵ mạnh
                      </span>
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        )}
        {selected && !data.activity && (
          <button type="button" className="btn" onClick={() => setSelected('')}>
            Về tổng quan
          </button>
        )}
      </div>
      {!selected && data.consideration.length > 0 && (
        <details className={styles.more}>
          <summary>Cần cân nhắc ({data.consideration.length})</summary>
          <ul className={styles.otherActivities}>
            {data.consideration.map((item) => (
              <li key={item.activityId}>
                <button
                  type="button"
                  className={styles.otherActivityButton}
                  aria-label={item.label}
                  onClick={() =>
                    setSelected(ACTIVITY_EVENTS[item.activityId] ?? `activity:${item.activityId}`)
                  }
                >
                  <span className={styles.otherActivityName}>{item.label}</span>
                  <span className={styles.otherActivityStatus}>
                    <CircleHalf size={iconSize(14)} aria-hidden="true" />
                    {ACTIVITY_STATUS[item.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {!selected && data.other.length > 0 && (
        <details className={styles.more}>
          <summary>Hoạt động khác ({data.other.length})</summary>
          <ul className={styles.otherActivities}>
            {data.other.map((item) => {
              const StatusIcon = item.status === 'no_evidence' ? Info : CircleHalf
              return (
                <li key={item.activityId}>
                  <button
                    type="button"
                    className={styles.otherActivityButton}
                    aria-label={item.label}
                    onClick={() =>
                      setSelected(ACTIVITY_EVENTS[item.activityId] ?? `activity:${item.activityId}`)
                    }
                  >
                    <span className={styles.otherActivityName}>{item.label}</span>
                    <span className={styles.otherActivityStatus}>
                      <StatusIcon size={iconSize(14)} aria-hidden="true" />
                      {ACTIVITY_STATUS[item.status]}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </section>
  )
}

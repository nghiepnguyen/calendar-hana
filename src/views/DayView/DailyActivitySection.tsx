import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  CircleHalf,
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
  caution: { label: 'Cân nhắc', icon: CircleHalf, tone: 'neutral' },
  not_recommended: { label: 'Không thuận lợi', icon: XCircle, tone: 'unfavorable' },
  insufficient_evidence: { label: 'Chưa đủ dữ liệu', icon: CircleHalf, tone: 'neutral' },
  conflict: { label: 'Dữ liệu xung đột', icon: WarningCircle, tone: 'neutral' },
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
    const evaluation = selected ? evaluateEventDay(date, selected, input) : null
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
      recommended: rows.filter((row) => row.status === 'recommended'),
      avoid: rows.filter((row) =>
        ['avoid', 'strong_avoid', 'watch', 'consider'].includes(row.status),
      ),
      evaluation,
      favorable: factors.filter((factor) => factor.delta > 0),
      unfavorable: factors.filter((factor) => factor.delta < 0),
      informational: evaluation?.contributions.filter((row) => row.source === 'mansion') ?? [],
      next:
        selected &&
        evaluation?.classification !== 'insufficient_evidence' &&
        evaluation?.classification !== 'conflict'
          ? findNextGoodEventDate(date, selected, 30, input)
          : null,
    }
  }, [date, selected, input])
  const activity = EVENT_OPTIONS.find(([id]) => id === selected)?.[1] ?? ''
  const verdict = STATUS[data.evaluation?.classification ?? 'insufficient_evidence']
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
          <label htmlFor="personal-event-filter">Mục tiêu trong ngày</label>
        </h3>
        <select
          id="personal-event-filter"
          className={`input ${styles.select}`}
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Tổng quan</option>
          {EVENT_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
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
            className={`${styles.verdict} ${styles[verdict.tone]}`}
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
              <p className={styles.verdictTitle} aria-label={`Đánh giá hôm nay: ${verdict.label}`}>
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
            const items = positive ? data.recommended.slice(0, 6) : data.avoid.slice(0, 5)
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
                      <li key={item.activityId}>
                        <span className={styles.chipName}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>
                    {positive ? 'Chưa có việc nổi bật' : 'Không có việc kỵ nổi bật'}
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

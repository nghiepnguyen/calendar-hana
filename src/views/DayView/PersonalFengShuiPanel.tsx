import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowsLeftRight,
  CheckCircle,
  Clock,
  Compass,
  Diamond,
  PencilSimple,
  SealCheck,
  SealWarning,
  Sparkle,
  Target,
  BookOpen,
  CalendarX,
  WarningCircle,
  YinYang,
} from '@phosphor-icons/react'
import type { Settings } from '@shared/types'
import type { Occurrence } from '@shared/recurrence/recurrence'
import { CAN, CHI } from '@shared/lunar/canChi'
import { canElement } from '@shared/lunar/elements'
import { getAlmanac } from '@shared/lunar/almanac'
import { getActivityAvoidances } from '@shared/lunar/activityRecommendations'
import { EVENT_OPTIONS, resolveEventActivities } from '@shared/lunar/eventMapping'
import { formatSolarShort } from '@shared/format'
import { findNextGoodEventDate } from '@shared/lunar/eventRecommendations'
import { assessPersonalDay, SUMMARY_LABELS, type Tone } from '@shared/personalFengShui/day'
import { calculateBazi } from '@shared/bazi'
import { tenGodOf } from '@shared/bazi/interpretation/tenGods'
import { viewedDayTenGod } from '@shared/bazi/interpretation/transit'
import {
  createRuleRegistry,
  FENG_SHUI_RULES,
  type RuleDefinition,
} from '@shared/personalFengShui/rules'
import { useAuth } from '../../auth/authContext'
import { useNow } from '../../hooks/useNow'
import { AlmanacExplain, type ExplainItem } from './AlmanacExplain'
import { ElementChip, Tile } from './AlmanacPanel'
import { AnnualFengShuiSection } from './AnnualFengShuiSection'
import { BaziSection } from './BaziSection'
import {
  eventHourNotes,
  explainBranch,
  explainNapAm,
  explainStem,
  hourChiOf,
  summarySentence,
} from './personalExplain'
import { Collapsible, InfoButton } from './personalUi'
import { iconSize } from '../../styles/textSize'
import almanac from './AlmanacPanel.module.css'
import styles from './PersonalFengShuiPanel.module.css'

function hourRange(hour: { chi: number; startHour: number; endHour: number }): string {
  return hour.chi === 0
    ? '00:00–01:00 và 23:00–24:00'
    : `${String(hour.startHour).padStart(2, '0')}:00–${String(hour.endHour).padStart(2, '0')}:00`
}

// Emoji con giáp: bộ icon đang dùng (Phosphor) không có đủ 12 con vật.
const ZODIAC_SYMBOLS = [
  ['🐀', 'Chuột'],
  ['🐃', 'Trâu'],
  ['🐅', 'Hổ'],
  ['🐈', 'Mèo'],
  ['🐉', 'Rồng'],
  ['🐍', 'Rắn'],
  ['🐎', 'Ngựa'],
  ['🐐', 'Dê'],
  ['🐒', 'Khỉ'],
  ['🐓', 'Gà'],
  ['🐕', 'Chó'],
  ['🐖', 'Heo'],
]

function ZodiacIcon({ chi, small = false }: { chi: number; small?: boolean }) {
  const [symbol, label] = ZODIAC_SYMBOLS[chi]
  return (
    <span
      role="img"
      aria-label={label}
      className={`${styles.zodiacGlyph} ${small ? styles.zodiacGlyphSmall : ''}`}
    >
      {symbol}
    </span>
  )
}

const TONE_LABEL: Record<Tone, string> = {
  favorable: 'Thuận',
  neutral: 'Bình hòa',
  caution: 'Lưu ý',
}
const TONE_TEXT: Record<Tone, string> = {
  favorable: styles.favorable,
  neutral: styles.neutral,
  caution: styles.caution,
}
const TONE_BANNER: Record<Tone, string> = {
  favorable: almanac.relationGood,
  neutral: almanac.relationMid,
  caution: almanac.relationBad,
}

function TonePill({ tone, label = TONE_LABEL[tone] }: { tone: Tone; label?: string }) {
  return <span className={`${styles.tonePill} ${styles[`pill_${tone}`]}`}>{label}</span>
}

/** Góc phải tiêu đề ô: nhãn kết quả và nút giải thích. */
function TileAside({
  tone,
  label,
  onExplain,
  toneLabel,
}: {
  tone: Tone
  label: string
  onExplain: () => void
  toneLabel?: string
}) {
  return (
    <span className={styles.asideGroup}>
      <TonePill tone={tone} label={toneLabel} />
      <InfoButton label={label} onClick={onExplain} />
    </span>
  )
}

/** Con giáp trong vòng tròn của banner kết luận, cùng kiểu viên ngũ hành ở Lịch vạn niên. */
function ZodiacOrb({ chi, role }: { chi: number; role: string }) {
  return (
    <span className={almanac.orb}>
      <span className={`${almanac.orbDisc} ${styles.zodiacDisc}`}>
        <ZodiacIcon chi={chi} />
      </span>
      <span className={almanac.orbLabel}>
        {role} · {CHI[chi]}
      </span>
    </span>
  )
}

/** Vòng 12 con giáp làm hình minh họa cho lời mời nhập ngày sinh. */
function ZodiacWheel() {
  return (
    <div className={styles.wheel} aria-hidden="true">
      <span className={styles.wheelGlow} />
      <span className={styles.wheelRing}>
        {ZODIAC_SYMBOLS.map(([symbol], index) => (
          <span key={symbol} className={styles.wheelItem} style={{ '--k': index } as CSSProperties}>
            <span className={styles.wheelEmoji}>{symbol}</span>
          </span>
        ))}
      </span>
      <span className={styles.wheelCore}>
        <YinYang size={iconSize(34)} weight="duotone" />
      </span>
    </div>
  )
}

/** Chưa có ngày sinh dùng được: ẩn toàn bộ kết quả, chỉ mời nhập (và đăng nhập nếu có tài khoản). */
function BirthInvite({ missing, reason }: { missing: boolean; reason: string }) {
  const { available, user } = useAuth()
  const offerSignIn = available && !user
  return (
    <div className={styles.invite}>
      <ZodiacWheel />
      <div className={styles.inviteBody}>
        <h2 className={almanac.eyebrow}>
          <YinYang size={iconSize(12)} weight="bold" aria-hidden="true" />
          Phong thủy cá nhân
        </h2>
        <p className={styles.inviteTitle}>
          {missing ? 'Ngày nào hợp với tuổi bạn?' : 'Ngày sinh cần được sửa'}
        </p>
        <p className={styles.inviteText}>
          {missing
            ? 'Nhập ngày sinh một lần để xem giờ tốt, hạn năm và Tứ Trụ riêng cho bạn.'
            : reason}
        </p>
        <div className={styles.inviteActions}>
          <Link className={`btn btn-primary ${styles.inviteCta}`} to="/settings#birth-info">
            {missing ? 'Nhập ngày sinh' : 'Sửa ngày sinh'}
            <ArrowRight size={iconSize(16)} weight="bold" aria-hidden="true" />
          </Link>
          {offerSignIn ? (
            <Link
              className={`btn ${styles.inviteCta} ${styles.inviteSecondary}`}
              to="/settings#account"
            >
              Đăng nhập
            </Link>
          ) : null}
        </div>
        {offerSignIn ? (
          <p className={styles.inviteHint}>
            Đăng nhập để lưu hồ sơ sinh lên cloud và dùng trên nhiều thiết bị.
          </p>
        ) : null}
      </div>
    </div>
  )
}

const RELATION_VERB = {
  same: 'cùng hành với',
  generates: 'sinh ra',
  controls: 'khắc',
  controlledBy: 'bị khắc bởi',
  generatedBy: 'được sinh bởi',
} as const

const GROUP_LABEL = {
  priority: 'Ưu tiên',
  consider: 'Có thể cân nhắc',
} as const


export function PersonalFengShuiPanel({
  date,
  settings,
  rules = FENG_SHUI_RULES,
  occurrences = [],
}: {
  date: string
  settings: Settings
  rules?: readonly RuleDefinition[]
  /** Sự kiện trong ngày, để nhắc khi rơi vào giờ không hợp tuổi. */
  occurrences?: readonly Occurrence[]
}) {
  const { user } = useAuth()
  const { today, minutes } = useNow()
  const [explain, setExplain] = useState<ExplainItem | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('')
  const result = useMemo(
    () => assessPersonalDay({ viewDate: date, birthDate: settings.birthDate, today }, rules),
    [date, settings.birthDate, today, rules],
  )
  const ready = result.status === 'ready'
  const activityRecommendations = useMemo(
    () => {
      const allowed = new Set(resolveEventActivities(selectedEvent))
      return getAlmanac(date).activityRecommendations
        .filter((item) => item.status === 'recommended' && (!selectedEvent || allowed.has(item.activityId)))
        .slice(0, 6)
    },
    [date, selectedEvent],
  )
  const activityAvoidances = useMemo(
    () => getActivityAvoidances({
      officerId: ['kien', 'tru', 'man', 'binh', 'dinh', 'chap', 'pha', 'nguy', 'thanh', 'thu', 'khai', 'be'][getAlmanac(date).officer.index],
      mansion: getAlmanac(date).mansion,
    })
      .filter((item) => item.status !== 'neutral' && (!selectedEvent || resolveEventActivities(selectedEvent).includes(item.activityId)))
      .slice(0, 5),
    [date, selectedEvent],
  )
  const eventLabel = EVENT_OPTIONS.find(([value]) => value === selectedEvent)?.[1]
  const eventVerdict = useMemo(() => {
    if (!selectedEvent) return null
    const hasGood = activityRecommendations.length > 0
    const hasHardAvoid = activityAvoidances.some((item) => item.status === 'avoid' || item.status === 'strong_avoid')
    const hasWarning = activityAvoidances.some((item) => item.status === 'watch' || item.status === 'consider')
    if (hasGood && (hasHardAvoid || hasWarning)) return { label: 'Cân nhắc', tone: 'caution' }
    if (hasGood) return { label: 'Nên làm', tone: 'good' }
    if (hasHardAvoid) return { label: 'Không nên làm', tone: 'bad' }
    return { label: 'Cân nhắc', tone: 'caution' }
  }, [activityAvoidances, activityRecommendations, selectedEvent])
  const nextGoodEventDate = useMemo(
    () => selectedEvent && eventVerdict?.label !== 'Nên làm' ? findNextGoodEventDate(date, selectedEvent) : null,
    [date, eventVerdict?.label, selectedEvent],
  )
  const nowChi = date === today ? hourChiOf(Math.floor(minutes / 60)) : null
  const nowHour = ready && nowChi !== null ? result.hours.find((h) => h.chi === nowChi) : undefined
  const tenGodReady = useMemo(
    () =>
      createRuleRegistry(rules).getReadiness('interpretation', [
        'interpretation.day-master',
        'interpretation.thap-than',
      ]).status === 'ready',
    [rules],
  )
  const chart = useMemo(() => calculateBazi(settings), [settings])
  const transit = ready && tenGodReady ? viewedDayTenGod(chart, result.day.can) : null
  const explainStemWithTransit = () => {
    if (!ready) return
    const item = explainStem(result)
    if (transit?.status === 'ready') {
      const dayMasterCan = CAN.indexOf(transit.dayMaster as (typeof CAN)[number])
      const t = tenGodOf(dayMasterCan, result.day.can)
      item.reasons = [
        ...(item.reasons ?? []),
        `Thập thần ngày: Nhật Nguyên ${transit.dayMaster} ${RELATION_VERB[t.relation]} ${transit.viewedStem}, ${t.samePolarity ? 'cùng' : 'khác'} âm dương, nên ${transit.viewedStem} là ${t.name}. Chỉ mô tả quan hệ, không đổi kết luận ngày.`,
      ]
    }
    setExplain(item)
  }
  const explainTransit = () => {
    if (transit?.status !== 'ready') return
    const dayMasterCan = CAN.indexOf(transit.dayMaster as (typeof CAN)[number])
    const relation = tenGodOf(dayMasterCan, result.day.can)
    setExplain({
      title: 'Thập thần ngày',
      isGood: true,
      verdict: { label: transit.tenGod, tone: 'neutral' },
      meaning: `Thập thần mô tả quan hệ giữa Nhật Nguyên ${transit.dayMaster} và Can ngày đang xem ${transit.viewedStem}; đây không phải kết luận tốt hay xấu của ngày.`,
      reasons: [
        `Nhật Nguyên ${transit.dayMaster} ${RELATION_VERB[relation.relation]} ${transit.viewedStem}, ${relation.samePolarity ? 'cùng' : 'khác'} âm dương.`,
        `Vì vậy Can ngày ${transit.viewedStem} được gọi là ${transit.tenGod}.`,
      ],
    })
  }
  const eventNotes = ready
    ? eventHourNotes(
        result,
        occurrences.map((o) => o.event),
      )
    : []

  if (result.status !== 'ready' && result.editBirth) {
    return (
      <section
        className={`glass ph-no-capture ph-mask ${almanac.panel} ${styles.panel}`}
        aria-label="Phong thủy cá nhân"
      >
        <BirthInvite missing={result.status === 'missing'} reason={result.reason} />
      </section>
    )
  }

  return (
    <section
      className={`glass ph-no-capture ph-mask ${almanac.panel} ${styles.panel}`}
      aria-label="Phong thủy cá nhân"
    >
      {result.status !== 'ready' ? (
        <header className={styles.emptyHero}>
          <h2 className={almanac.eyebrow}>
            <YinYang size={iconSize(12)} weight="bold" aria-hidden="true" />
            Phong thủy cá nhân
          </h2>
          <p className={styles.emptyTitle}>Xem theo hồ sơ sinh của bạn</p>
          <p className={styles.emptyText}>{result.reason}</p>
        </header>
      ) : (
        <header className={almanac.hero}>
          <div className={almanac.heroMain}>
            <h2 className={almanac.eyebrow}>
              <YinYang size={iconSize(12)} weight="bold" aria-hidden="true" />
              Phong thủy cá nhân
            </h2>
            <p className={almanac.heroTitle}>
              <span className={almanac.heroLabel}>Tuổi</span> {result.profile.name}
            </p>
            <dl className={almanac.heroFacts}>
              <div>
                <dt>Niên mệnh</dt>
                <dd>
                  <ElementChip element={result.profileNapAm.element}>
                    {result.profileNapAm.name}
                  </ElementChip>
                </dd>
              </div>
              <div>
                <dt>Ngày đang xem</dt>
                <dd>
                  <ElementChip element={result.dayNapAm.element}>{result.day.name}</ElementChip>
                </dd>
              </div>
              {transit?.status === 'ready' ? (
                <div>
                  <dt>Nhật Nguyên</dt>
                  <dd>{transit.dayMaster}</dd>
                </div>
              ) : null}
            </dl>
            <Link className={styles.editProfile} to="/settings#birth-info">
              <PencilSimple size={iconSize(14)} weight="bold" aria-hidden="true" />
              Sửa thông tin sinh
            </Link>
          </div>
          <section
            className={`${almanac.relation} ${TONE_BANNER[result.summary]}`}
            aria-label="Tóm tắt ngày cá nhân"
          >
            <div className={almanac.flow} aria-hidden="true">
              <ZodiacOrb chi={result.profile.chi} role="Tuổi" />
              <span className={almanac.flowLink}>
                <span className={almanac.flowVerb}>gặp</span>
                <ArrowRight size={iconSize(16)} weight="bold" />
              </span>
              <ZodiacOrb chi={result.day.chi} role="Ngày" />
            </div>
            <div className={almanac.relationBody}>
              <p className={almanac.relationEyebrow}>Kết luận cho ngày này</p>
              <p className={almanac.relationHeadline}>
                <span className={almanac.relationName} data-testid="personal-day-summary">
                  {SUMMARY_LABELS[result.summary]}
                </span>
              </p>
              <p className={almanac.relationText}>{summarySentence(result)}</p>
            </div>
          </section>
        </header>
      )}

      <div className={`${almanac.bento} ${styles.coreGrid}`}>
        {ready ? (
          <>
            {transit ? (
              <Tile
                index={0}
                icon={YinYang}
                title="Thập thần ngày"
                label="Thập thần ngày"
                className={`${styles.coreTile} ${styles.relationTile} ${styles.tenGodTile}`}
                aside={
                  transit.status === 'ready' ? (
                    <span className={styles.asideGroup}>
                      <span className={styles.tonePill}>{transit.tenGod}</span>
                      <InfoButton label="Thập thần ngày" onClick={explainTransit} />
                    </span>
                  ) : undefined
                }
              >
                <div className={styles.transit} role="group" aria-label="Thập thần của ngày đang xem">
                  <span className={styles.transitLabel}>Nhật Nguyên và Can ngày</span>
                  {transit.status === 'ready' ? (
                    <span>
                      Nhật Nguyên <strong>{transit.dayMaster}</strong> · Can ngày{' '}
                      <strong>{transit.viewedStem}</strong>: <strong>{transit.tenGod}</strong>
                    </span>
                  ) : transit.status === 'ambiguous' ? (
                    <span>
                      Can ngày {transit.viewedStem}: chưa xác định vì các lá số ứng viên có Nhật Nguyên khác nhau.
                    </span>
                  ) : (
                    <Link to="/settings#birth-info">Nhập giờ và nơi sinh</Link>
                  )}
                </div>
              </Tile>
            ) : null}
            <Tile
              index={1}
              icon={Compass}
              title="Địa chi"
              label="Quan hệ Địa chi"
              className={`${styles.coreTile} ${styles.relationTile} ${styles.branchTile}`}
              aside={
                <TileAside
                  tone={result.branch.tone}
                  label="Địa chi"
                  onExplain={() => setExplain(explainBranch(result))}
                />
              }
            >
              <div className={styles.pair}>
                <span className={styles.pairItem}>
                  <ZodiacIcon chi={result.profile.chi} small />
                  {CHI[result.profile.chi]}
                </span>
                <ArrowsLeftRight
                  size={iconSize(16)}
                  weight="bold"
                  className={styles.pairLink}
                  aria-hidden="true"
                />
                <span className={styles.pairItem}>
                  <ZodiacIcon chi={result.day.chi} small />
                  {CHI[result.day.chi]}
                </span>
              </div>
              <p className={`${styles.statement} ${TONE_TEXT[result.branch.tone]}`}>
                {result.branch.text}
              </p>
            </Tile>

            <Tile
              index={2}
              icon={YinYang}
              title="Thiên can"
              label="Quan hệ Thiên can"
              className={`${styles.coreTile} ${styles.relationTile} ${styles.stemTile}`}
              aside={
                <TileAside
                  tone={result.stem.tone}
                  label="Thiên can"
                  onExplain={explainStemWithTransit}
                  toneLabel={result.stem.element.kind === 'overcomeBy' ? 'Tự chủ' : undefined}
                />
              }
            >
              <div className={styles.pair}>
                <ElementChip element={canElement(result.profile.can)}>
                  {CAN[result.profile.can]}
                </ElementChip>
                <ArrowsLeftRight
                  size={iconSize(16)}
                  weight="bold"
                  className={styles.pairLink}
                  aria-hidden="true"
                />
                <ElementChip element={canElement(result.day.can)}>
                  {CAN[result.day.can]}
                </ElementChip>
              </div>
              <p className={`${styles.statement} ${TONE_TEXT[result.stem.tone]}`}>
                {result.stem.text}
              </p>
              {result.personalStars.status === 'ready' && result.personalStars.stemClash.hit ? (
                <section className={styles.extra} aria-label="Quan hệ cá nhân mở rộng">
                  <span className={styles.caution} aria-hidden="true">
                    <WarningCircle size={iconSize(16)} weight="fill" />
                  </span>
                  <div>
                    <h4>Thiên can xung</h4>
                    <p>{result.personalStars.stemClash.reason}</p>
                  </div>
                </section>
              ) : null}
            </Tile>

            <Tile
              index={3}
              icon={Diamond}
              title="Nạp âm"
              label="Quan hệ Nạp âm"
              className={`${styles.coreTile} ${styles.relationTile} ${styles.napAmTile} ${styles.napTile}`}
              aside={
                <TileAside
                  tone={result.napAm.tone}
                  label="Nạp âm"
                  onExplain={() => setExplain(explainNapAm(result))}
                />
              }
            >
              <div className={styles.pair}>
                <ElementChip element={result.dayNapAm.element}>{result.dayNapAm.name}</ElementChip>
                <ArrowRight
                  size={iconSize(16)}
                  weight="bold"
                  className={styles.pairLink}
                  aria-hidden="true"
                />
                <ElementChip element={result.profileNapAm.element}>
                  {result.profileNapAm.name}
                </ElementChip>
              </div>
              <p className={`${styles.statement} ${TONE_TEXT[result.napAm.tone]}`}>
                {result.napAm.text}
              </p>
            </Tile>

            <Tile
              index={4}
              wide="full"
              icon={Clock}
              title="Giờ cá nhân"
              label="Giờ cá nhân trong ngày"
              aside={`${result.hours.filter((hour) => hour.group !== 'excluded').length} giờ hợp tuổi`}
            >
              <div className={styles.hourGroups}>
                {(['priority', 'consider'] as const).map((group) => {
                  const hours = result.hours.filter((hour) => hour.group === group)
                  return (
                    <div className={styles.hourGroup} key={group}>
                      <p className={styles.groupLabel}>
                        {group === 'priority' ? (
                          <SealCheck size={iconSize(14)} weight="fill" aria-hidden="true" />
                        ) : (
                          <Sparkle size={iconSize(14)} weight="fill" aria-hidden="true" />
                        )}
                        {GROUP_LABEL[group]}
                      </p>
                      {hours.length ? (
                        <ul
                          className={styles.hourCards}
                          aria-label={`Giờ ${GROUP_LABEL[group].toLowerCase()}`}
                        >
                          {hours.map((hour, index) => (
                            <li
                              className={`${styles.hourCard} ${styles[group]} ${hour.chi === nowChi ? styles.hourNow : ''}`}
                              key={hour.chi}
                              style={{ '--j': index } as CSSProperties}
                              aria-current={hour.chi === nowChi ? 'time' : undefined}
                            >
                              {hour.chi === nowChi ? (
                                <span className={styles.nowBadge}>Bây giờ</span>
                              ) : null}
                              <span className={styles.hourTop}>
                                <strong>{hour.name}</strong>
                                <ZodiacIcon chi={hour.chi} small />
                              </span>
                              <span className={styles.hourRange}>{hourRange(hour)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.emptyHours}>Chưa có giờ phù hợp</p>
                      )}
                    </div>
                  )
                })}
              </div>
              {!result.hours.some((hour) => hour.group !== 'excluded') ? (
                <p className={styles.emptyHours}>
                  <SealWarning size={iconSize(14)} weight="fill" aria-hidden="true" />
                  Không có giờ phù hợp trong phạm vi đang xét, không nới điều kiện chọn giờ.
                </p>
              ) : null}
              {nowHour?.group === 'excluded' ? (
                <p className={styles.nowNote}>
                  <Clock size={iconSize(14)} weight="bold" aria-hidden="true" />
                  Bây giờ là giờ {nowHour.name}, không nằm trong giờ hợp tuổi.
                </p>
              ) : null}
              {eventNotes.length ? (
                <ul className={styles.eventNotes} aria-label="Sự kiện rơi vào giờ không hợp tuổi">
                  {eventNotes.map((note) => (
                    <li key={`${note.title}:${note.time}`}>
                      <CalendarX size={iconSize(16)} weight="duotone" aria-hidden="true" />
                      <span>
                        <strong>{note.title}</strong> lúc {note.time} rơi vào giờ {note.hourName}:{' '}
                        {note.reasons.join(', ').toLowerCase()}. Chỉ là gợi ý, không đổi kết luận
                        ngày.
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Tile>

            <section className={styles.goalCluster} aria-label="Mục tiêu và kết luận trong ngày">
              <div className={styles.eventFilter}>
                <div className={styles.eventFilterLabel}>
                  <label className={styles.eventFilterTitle} htmlFor="personal-event-filter">
                    <Target size={iconSize(14)} weight="bold" aria-hidden="true" />
                    Mục tiêu trong ngày
                  </label>
                  <span>Chọn việc bạn đang cân nhắc hôm nay.</span>
                </div>
                <select
                  id="personal-event-filter"
                  className={`input ${styles.eventSelect}`}
                  value={selectedEvent}
                  onChange={(event) => setSelectedEvent(event.target.value)}
                >
                  <option value="">Tổng quan</option>
                  {EVENT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {eventVerdict ? (
                <section className={`${styles.eventVerdict} ${styles[`eventVerdict_${eventVerdict.tone}`]}`} aria-label="Kết luận mục tiêu">
                  <span className={styles.eventVerdictEvent}>Event đang chọn: <strong>{eventLabel}</strong></span>
                  <strong className={styles.eventVerdictStatus}>{eventVerdict.label}</strong>
                  {nextGoodEventDate ? (
                    <span className={styles.eventNextDate} role="note">
                      Ngày tốt gần nhất tiếp theo: <strong>{formatSolarShort(nextGoodEventDate)}</strong>
                    </span>
                  ) : eventVerdict.label !== 'Nên làm' ? (
                    <span className={styles.eventNextDate} role="note">
                      Chưa tìm thấy ngày tốt trong 30 ngày tới.
                    </span>
                  ) : null}
                </section>
              ) : null}
            </section>

            <div className={styles.recommendationRow}>
              <Tile
                index={5}
                className={styles.recommendationGood}
                icon={CheckCircle}
                title="Việc nên làm trong ngày"
                label="Việc nên làm trong ngày"
                aside="Theo Trực + Tú"
              >
                <ul className={styles.afflictionList} aria-label="Danh sách việc nên làm trong ngày">
                  {activityRecommendations.length ? activityRecommendations.map((item) => (
                    <li key={item.activityId}>
                      <CheckCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                      {item.label}
                    </li>
                  )) : <li className={styles.emptyRecommendation}>Chưa có việc nên làm nổi bật</li>}
                </ul>
              </Tile>

              <Tile
                index={6}
                className={styles.recommendationAvoid}
                icon={WarningCircle}
                title="Việc Không Nên Làm"
                label="Việc Không Nên Làm"
                aside="Theo Trực + Tú"
              >
                <ul className={styles.afflictionList} aria-label="Danh sách việc không nên làm">
                  {activityAvoidances.length ? activityAvoidances.map((item) => (
                    <li
                      className={
                        item.status === 'avoid' || item.status === 'strong_avoid'
                          ? styles.afflictionHit
                          : styles.afflictionWatch
                      }
                      key={item.activityId}
                    >
                      <WarningCircle size={iconSize(16)} weight="fill" aria-hidden="true" />
                      {item.label}
                    </li>
                  )) : <li className={styles.emptyRecommendation}>Không có việc kỵ nổi bật</li>}
                </ul>
              </Tile>
            </div>
          </>
        ) : null}

        <Collapsible desktop summary="Chi tiết luận đoán nâng cao">
          <div className={styles.advancedGrid}>
            <AnnualFengShuiSection
              key={`${user?.uid ?? 'local'}:${settings.birthDate ? 'saved' : 'missing'}:${settings.birthGender ?? ''}`}
              index={ready ? 7 : 0}
              date={date}
              birthDate={settings.birthDate}
              savedGender={settings.birthGender ?? null}
              rules={rules}
              onExplain={setExplain}
            />
            <BaziSection
              index={ready ? 8 : 1}
              settings={settings}
              rules={rules}
              onExplain={setExplain}
            />
          </div>
        </Collapsible>
      </div>

      <Link className={styles.guideLink} to="/settings#feng-shui-guide">
        <BookOpen size={iconSize(15)} weight="light" aria-hidden="true" />
        Tìm hiểu cách tính và nguồn tham khảo
        <ArrowUpRight size={iconSize(13)} weight="bold" aria-hidden="true" />
      </Link>
      {explain ? <AlmanacExplain item={explain} onClose={() => setExplain(null)} /> : null}
    </section>
  )
}

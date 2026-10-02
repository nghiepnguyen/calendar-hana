import { useMemo, useState, type CSSProperties } from 'react'
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
  BookOpen,
  CalendarX,
  WarningCircle,
  YinYang,
} from '@phosphor-icons/react'
import type { Settings } from '@shared/types'
import type { Occurrence } from '@shared/recurrence/recurrence'
import { CAN, CHI } from '@shared/lunar/canChi'
import { canElement } from '@shared/lunar/elements'
import { assessPersonalDay, SUMMARY_LABELS, type Tone } from '@shared/personalFengShui/day'
import { FENG_SHUI_RULES, type RuleDefinition } from '@shared/personalFengShui/rules'
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
import { InfoButton } from './personalUi'
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

function TonePill({ tone }: { tone: Tone }) {
  return <span className={`${styles.tonePill} ${styles[`pill_${tone}`]}`}>{TONE_LABEL[tone]}</span>
}

/** Góc phải tiêu đề ô: nhãn kết quả và nút giải thích. */
function TileAside({
  tone,
  label,
  onExplain,
}: {
  tone: Tone
  label: string
  onExplain: () => void
}) {
  return (
    <span className={styles.asideGroup}>
      <TonePill tone={tone} />
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
          <a className={`btn btn-primary ${styles.inviteCta}`} href="/settings#birth-info">
            {missing ? 'Nhập ngày sinh' : 'Sửa ngày sinh'}
            <ArrowRight size={iconSize(16)} weight="bold" aria-hidden="true" />
          </a>
          {offerSignIn ? (
            <a
              className={`btn ${styles.inviteCta} ${styles.inviteSecondary}`}
              href="/settings#account"
            >
              Đăng nhập
            </a>
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
  const result = useMemo(
    () => assessPersonalDay({ viewDate: date, birthDate: settings.birthDate, today }, rules),
    [date, settings.birthDate, today, rules],
  )
  const ready = result.status === 'ready'
  const nowChi = date === today ? hourChiOf(Math.floor(minutes / 60)) : null
  const nowHour = ready && nowChi !== null ? result.hours.find((h) => h.chi === nowChi) : undefined
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
            </dl>
            <a className={styles.editProfile} href="/settings#birth-info">
              <PencilSimple size={iconSize(14)} weight="bold" aria-hidden="true" />
              Sửa thông tin sinh
            </a>
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

      <div className={almanac.bento}>
        {ready ? (
          <>
            <Tile
              index={0}
              icon={Compass}
              title="Địa chi"
              label="Quan hệ Địa chi"
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
              index={1}
              icon={YinYang}
              title="Thiên can"
              label="Quan hệ Thiên can"
              aside={
                <TileAside
                  tone={result.stem.tone}
                  label="Thiên can"
                  onExplain={() => setExplain(explainStem(result))}
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
              <section className={styles.extra} aria-label="Quan hệ cá nhân mở rộng">
                {result.personalStars.status === 'ready' ? (
                  <>
                    <span
                      className={
                        result.personalStars.stemClash.hit ? styles.caution : styles.favorable
                      }
                      aria-hidden="true"
                    >
                      {result.personalStars.stemClash.hit ? (
                        <WarningCircle size={iconSize(16)} weight="fill" />
                      ) : (
                        <CheckCircle size={iconSize(16)} weight="fill" />
                      )}
                    </span>
                    <div>
                      <h4>Thiên can xung</h4>
                      <p>{result.personalStars.stemClash.reason}</p>
                    </div>
                  </>
                ) : (
                  <p className={styles.muted}>{result.personalStars.reason}</p>
                )}
              </section>
            </Tile>

            <Tile
              index={2}
              icon={Diamond}
              title="Nạp âm"
              label="Quan hệ Nạp âm"
              className={styles.napAmTile}
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
              index={3}
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
          </>
        ) : null}

        <AnnualFengShuiSection
          key={`${user?.uid ?? 'local'}:${settings.birthDate ? 'saved' : 'missing'}:${settings.birthGender ?? ''}`}
          index={ready ? 4 : 0}
          date={date}
          birthDate={settings.birthDate}
          savedGender={settings.birthGender ?? null}
          rules={rules}
          onExplain={setExplain}
        />
        <BaziSection
          index={ready ? 5 : 1}
          settings={settings}
          rules={rules}
          onExplain={setExplain}
        />
      </div>

      <a className={styles.guideLink} href="/settings#feng-shui-guide">
        <BookOpen size={iconSize(15)} weight="light" aria-hidden="true" />
        Tìm hiểu cách tính và nguồn tham khảo
        <ArrowUpRight size={iconSize(13)} weight="bold" aria-hidden="true" />
      </a>
      {explain ? <AlmanacExplain item={explain} onClose={() => setExplain(null)} /> : null}
    </section>
  )
}

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coins,
  Compass as CompassIcon,
  Diamond,
  Drop,
  Equals,
  Fire,
  Heart,
  Mountains,
  Prohibit,
  SealCheck,
  SealWarning,
  Sparkle,
  Star,
  SunHorizon,
  Tree,
  Warning,
  YinYang,
  type Icon,
} from '@phosphor-icons/react'
import type { NguHanh } from '@shared/lunar'
import type { CanChiRelation } from '@shared/lunar/elements'
import { getAlmanac } from '@shared/lunar/almanac'
import type { SolarDateString } from '@shared/types'
import { AlmanacExplain, type ExplainItem } from './AlmanacExplain'
import { Compass } from './Compass'
import { HourGrid } from './HourGrid'
import { StarChips } from './StarChips'
import { iconSize } from '../../styles/textSize'
import styles from './AlmanacPanel.module.css'

interface AlmanacPanelProps {
  date: SolarDateString
  isToday: boolean
}

const ELEMENT_ICONS: Record<NguHanh, Icon> = {
  Kim: Diamond,
  Mộc: Tree,
  Thủy: Drop,
  Hỏa: Fire,
  Thổ: Mountains,
}

const ELEMENT_CLASS: Record<NguHanh, string> = {
  Kim: styles.elKim,
  Mộc: styles.elMoc,
  Thủy: styles.elThuy,
  Hỏa: styles.elHoa,
  Thổ: styles.elTho,
}

function ElementChip({ element, children }: { element: NguHanh; children?: ReactNode }) {
  const ElementIcon = ELEMENT_ICONS[element]
  return (
    <span className={`${styles.elementChip} ${ELEMENT_CLASS[element]}`}>
      <ElementIcon size={iconSize(14)} weight="duotone" aria-hidden="true" />
      {children ?? element}
    </span>
  )
}

function Pill({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <span className={`${styles.pill} ${good ? styles.pillGood : styles.pillBad}`}>{children}</span>
  )
}

/** Hành của Can hoặc Chi, vẽ thành viên tròn trong sơ đồ quan hệ. */
function ElementOrb({ role, element }: { role: string; element: NguHanh }) {
  const ElementIcon = ELEMENT_ICONS[element]
  return (
    <span className={`${styles.orb} ${ELEMENT_CLASS[element]}`}>
      <span className={styles.orbDisc}>
        <ElementIcon size={iconSize(22)} weight="duotone" />
      </span>
      <span className={styles.orbLabel}>
        {role} · {element}
      </span>
    </span>
  )
}

/** Sơ đồ Can → Chi: mũi tên chỉ hành chủ động sinh hay khắc hành kia. */
function RelationFlow({ relation }: { relation: CanChiRelation }) {
  const { kind } = relation
  const Connector = kind === 'dongHanh' ? Equals : kind.startsWith('chi') ? ArrowLeft : ArrowRight
  const verb = kind === 'dongHanh' ? 'hòa' : kind.includes('Sinh') ? 'sinh' : 'khắc'
  return (
    <div className={styles.flow} aria-hidden="true">
      <ElementOrb role="Can" element={relation.canElement} />
      <span className={styles.flowLink}>
        <span className={styles.flowVerb}>{verb}</span>
        <Connector size={iconSize(16)} weight="bold" />
      </span>
      <ElementOrb role="Chi" element={relation.chiElement} />
    </div>
  )
}

/** Kết luận của ngày theo quan hệ Can Chi: bên phải đầu khối (máy tính), dưới tên ngày (điện thoại). */
function RelationBanner({ relation }: { relation: CanChiRelation }) {
  const VerdictIcon = relation.isGood ? SealCheck : SealWarning
  const tone = !relation.isGood
    ? styles.relationBad
    : relation.rating === 'cát'
      ? styles.relationGood
      : styles.relationMid
  return (
    <div className={`${styles.relation} ${tone}`}>
      <RelationFlow relation={relation} />
      <div className={styles.relationBody}>
        <p className={styles.relationEyebrow}>Quan hệ Can Chi</p>
        <p className={styles.relationHeadline}>
          <span className={styles.relationName}>{relation.dayName}</span>
          <span className={styles.verdict}>
            <VerdictIcon size={iconSize(14)} weight="fill" aria-hidden="true" />
            Ngày {relation.rating}
          </span>
        </p>
        <p className={styles.relationText}>
          <span className={styles.srOnly}>Quan hệ Can Chi: </span>
          {relation.text}
        </p>
      </div>
    </div>
  )
}

/** Một ô trong lưới bento. `index` dùng để lệch thời gian hiện dần. */
function Tile({
  index,
  wide,
  icon: TileIcon,
  title,
  aside,
  children,
}: {
  index: number
  wide?: 'full' | 'two'
  icon: Icon
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className={`${styles.tile} ${wide === 'full' ? styles.spanFull : wide === 'two' ? styles.spanTwo : ''}`}
      style={{ '--i': index } as CSSProperties}
    >
      <header className={styles.tileHead}>
        <span className={styles.tileIcon} aria-hidden="true">
          <TileIcon size={iconSize(16)} weight="light" />
        </span>
        <h3 className={styles.tileTitle}>{title}</h3>
        {aside ? <span className={styles.tileAside}>{aside}</span> : null}
      </header>
      {children}
    </section>
  )
}

/** Khối "Lịch vạn niên" ở xem Ngày: tiết khí, 28 tú, trực, hướng xuất hành, tuổi xung, sao, giờ. */
export function AlmanacPanel({ date, isToday }: AlmanacPanelProps) {
  const a = useMemo(() => getAlmanac(date), [date])
  const [explain, setExplain] = useState<ExplainItem | null>(null)

  return (
    // key theo ngày để hiệu ứng hiện dần chạy lại khi đổi ngày.
    <section key={date} className={`glass ${styles.panel}`} aria-label="Lịch vạn niên">
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <h2 className={styles.eyebrow}>
            <YinYang size={iconSize(12)} weight="bold" aria-hidden="true" />
            Lịch vạn niên
          </h2>
          <p className={styles.heroTitle}>
            <span className={styles.heroLabel}>Ngày</span> {a.dayCanChi.name}
          </p>
          <dl className={styles.heroFacts}>
            <div>
              <dt>Niên mệnh</dt>
              <dd>
                <ElementChip element={a.napAm.element}>{a.napAm.name}</ElementChip>
              </dd>
            </div>
            <div>
              <dt>Tiết khí</dt>
              <dd className={styles.heroTerm}>
                <SunHorizon size={iconSize(16)} weight="light" aria-hidden="true" />
                {a.solarTerm.name}
              </dd>
            </div>
          </dl>
        </div>
        <RelationBanner relation={a.relation} />
      </header>

      <div className={styles.bento}>
        <Tile index={0} icon={Star} title="Nhị thập bát tú">
          <button
            type="button"
            className={styles.tileButton}
            aria-haspopup="dialog"
            aria-label={`Sao ${a.mansion.name}, ${a.mansion.isGood ? 'Cát Tú' : 'Hung Tú'}, xem giải thích`}
            onClick={() =>
              setExplain({
                title: `Sao ${a.mansion.name}`,
                isGood: a.mansion.isGood,
                shouldDo: a.mansion.shouldDo,
                shouldAvoid: a.mansion.shouldAvoid,
              })
            }
          >
            <span className={styles.bigValue}>{a.mansion.name}</span>
            <span className={styles.metaRow}>
              <Pill good={a.mansion.isGood}>{a.mansion.isGood ? 'Cát Tú' : 'Hung Tú'}</Pill>
              <ElementChip element={a.mansion.element} />
            </span>
            <span className={styles.subtle}>{a.mansion.animal}</span>
            <span className={`${styles.doLine} ${styles.clamp}`}>
              <CheckCircle
                size={iconSize(15)}
                weight="duotone"
                className={styles.doIcon}
                aria-hidden="true"
              />
              <span>
                <span className={styles.srOnly}>Nên làm: </span>
                {a.mansion.shouldDo}
              </span>
            </span>
            <span className={`${styles.doLine} ${styles.clamp}`}>
              <Prohibit
                size={iconSize(15)}
                weight="duotone"
                className={styles.avoidIcon}
                aria-hidden="true"
              />
              <span>
                <span className={styles.srOnly}>Nên kiêng: </span>
                {a.mansion.shouldAvoid}
              </span>
            </span>
            <span className={styles.openIcon} aria-hidden="true">
              <ArrowUpRight size={iconSize(14)} weight="bold" />
            </span>
          </button>
        </Tile>

        <Tile index={1} icon={Sparkle} title="Thập nhị trực">
          <button
            type="button"
            className={styles.tileButton}
            aria-haspopup="dialog"
            aria-label={`Trực ${a.officer.name}, ${a.officer.isGood ? 'tốt' : 'xấu'}, xem giải thích`}
            onClick={() =>
              setExplain({
                title: `Trực ${a.officer.name}`,
                isGood: a.officer.isGood,
                shouldDo: a.officer.shouldDo,
                shouldAvoid: a.officer.shouldAvoid,
              })
            }
          >
            <span className={styles.bigValue}>
              <span className={styles.bigPrefix}>Trực</span> {a.officer.name}
            </span>
            <span className={styles.metaRow}>
              <Pill good={a.officer.isGood}>{a.officer.isGood ? 'Tốt' : 'Xấu'}</Pill>
            </span>
            <span className={styles.doLine}>
              <CheckCircle
                size={iconSize(15)}
                weight="duotone"
                className={styles.doIcon}
                aria-hidden="true"
              />
              <span>
                <span className={styles.srOnly}>Nên làm: </span>
                {a.officer.shouldDo}
              </span>
            </span>
            <span className={styles.doLine}>
              <Prohibit
                size={iconSize(15)}
                weight="duotone"
                className={styles.avoidIcon}
                aria-hidden="true"
              />
              <span>
                <span className={styles.srOnly}>Nên kiêng: </span>
                {a.officer.shouldAvoid}
              </span>
            </span>
            <span className={styles.openIcon} aria-hidden="true">
              <ArrowUpRight size={iconSize(14)} weight="bold" />
            </span>
          </button>
        </Tile>

        <Tile index={2} icon={CompassIcon} title="Hướng xuất hành">
          <div className={styles.directions}>
            <Compass hyThan={a.directions.hyThan} taiThan={a.directions.taiThan} />
            <dl className={styles.dirLegend}>
              <div>
                <dt>
                  <Heart
                    size={iconSize(14)}
                    weight="fill"
                    className={styles.hyIcon}
                    aria-hidden="true"
                  />
                  Hỷ Thần
                </dt>
                <dd>{a.directions.hyThan}</dd>
              </div>
              <div>
                <dt>
                  <Coins
                    size={iconSize(14)}
                    weight="fill"
                    className={styles.taiIcon}
                    aria-hidden="true"
                  />
                  Tài Thần
                </dt>
                <dd>{a.directions.taiThan}</dd>
              </div>
            </dl>
          </div>
        </Tile>

        <Tile index={3} icon={Warning} title="Tuổi xung khắc">
          <div className={styles.clashGroup}>
            <p className={styles.groupLabel}>Xung ngày</p>
            <ul className={styles.ageChips} aria-label="Tuổi xung ngày">
              {a.dayClashes.map((n) => (
                <li key={n} className={styles.ageChip}>
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.clashGroup}>
            <p className={styles.groupLabel}>Xung tháng ({a.monthCanChi.name})</p>
            <ul className={styles.ageChips} aria-label="Tuổi xung tháng">
              {a.monthClashes.map((n) => (
                <li key={n} className={`${styles.ageChip} ${styles.ageChipSoft}`}>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Tile>

        <Tile
          index={4}
          wide="two"
          icon={SealCheck}
          title="Sao tốt & sao xấu"
          aside={`${a.stars.good.length} tốt · ${a.stars.bad.length} xấu`}
        >
          <div className={styles.starColumns}>
            <StarChips
              title="Sao tốt"
              good
              stars={a.stars.good}
              onOpen={(s) =>
                setExplain({ title: `Sao ${s.name}`, isGood: true, meaning: s.meaning })
              }
            />
            <StarChips
              title="Sao xấu"
              good={false}
              stars={a.stars.bad}
              onOpen={(s) =>
                setExplain({ title: `Sao ${s.name}`, isGood: false, meaning: s.meaning })
              }
            />
          </div>
        </Tile>

        <Tile
          index={5}
          wide="full"
          icon={Clock}
          title="Giờ trong ngày"
          aside={`${a.hours.filter((h) => h.isGood).length} giờ hoàng đạo`}
        >
          <HourGrid hours={a.hours} isToday={isToday} />
        </Tile>
      </div>

      {explain ? <AlmanacExplain item={explain} onClose={() => setExplain(null)} /> : null}
    </section>
  )
}

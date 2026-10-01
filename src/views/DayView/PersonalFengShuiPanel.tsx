import { useMemo } from 'react'
import type { Settings } from '@shared/types'
import type { DayHour } from '@shared/lunar/auspicious'
import { assessPersonalDay, SUMMARY_LABELS } from '@shared/personalFengShui/day'
import { FENG_SHUI_RULES, type RuleDefinition } from '@shared/personalFengShui/rules'
import { useAuth } from '../../auth/authContext'
import { useNow } from '../../hooks/useNow'
import { AnnualFengShuiSection } from './AnnualFengShuiSection'
import { FengShuiSources } from './FengShuiSources'
import { hourIndexAt } from './hourIndex'
import styles from './PersonalFengShuiPanel.module.css'

function hourRange(hour: Pick<DayHour, 'chi' | 'startHour' | 'endHour'>): string {
  return hour.chi === 0
    ? '00:00–01:00 và 23:00–24:00'
    : `${String(hour.startHour).padStart(2, '0')}:00–${String(hour.endHour).padStart(2, '0')}:00`
}

export function PersonalFengShuiPanel({
  date,
  settings,
  rules = FENG_SHUI_RULES,
}: {
  date: string
  settings: Settings
  rules?: readonly RuleDefinition[]
}) {
  const { user } = useAuth()
  const { today, minutes } = useNow()
  const result = useMemo(
    () => assessPersonalDay({ viewDate: date, birthDate: settings.birthDate, today }, rules),
    [date, settings.birthDate, today, rules],
  )
  const current = date === today ? hourIndexAt(minutes) : -1
  const groupLabel = {
    priority: 'Ưu tiên',
    consider: 'Có thể cân nhắc',
    excluded: 'Không chọn trong phạm vi đang xét',
  }
  return (
    <section
      className={`glass ph-no-capture ph-mask ${styles.panel}`}
      aria-label="Phong thủy cá nhân"
    >
      <h2>Phong thủy cá nhân</h2>
      {result.status !== 'ready' ? (
        <>
          <p>{result.reason}</p>
          {result.editBirth ? (
            <a className="btn" href="/settings#birth-info">
              {result.status === 'missing' ? 'Nhập ngày sinh' : 'Sửa ngày sinh'}
            </a>
          ) : null}
        </>
      ) : (
        <>
          <p>
            Tuổi {result.profile.name} · {result.profileNapAm.name} · hành{' '}
            {result.profileNapAm.element}
          </p>
          <p className={styles.muted}>Đang xem theo tuổi và nạp âm năm sinh</p>
          <a className="btn" href="/settings#birth-info">
            Sửa thông tin sinh
          </a>
          <div className={styles.section}>
            <h3>Ngày và tuổi của bạn</h3>
            <p className={styles[result.summary]} data-testid="personal-day-summary">
              <strong>{SUMMARY_LABELS[result.summary]}</strong>
            </p>
            <ul className={styles.results}>
              <li className={styles.result}>
                <h4>Địa chi</h4>
                <p className={styles[result.branch.tone]}>{result.branch.text}</p>
              </li>
              <li className={styles.result}>
                <h4>Thiên can</h4>
                <p className={styles[result.stem.tone]}>{result.stem.text}</p>
              </li>
              <li className={styles.result}>
                <h4>Nạp âm ngày → tuổi</h4>
                <p>
                  {result.dayNapAm.name} → {result.profileNapAm.name}
                </p>
                <p className={styles[result.napAm.tone]}>{result.napAm.text}</p>
              </li>
            </ul>
          </div>
          <div className={styles.section}>
            <h3>Giờ cá nhân trong ngày</h3>
            {(['priority', 'consider'] as const).map((group) => {
              const hours = result.hours.filter((hour) => hour.group === group)
              return (
                <p key={group}>
                  <strong>{groupLabel[group]}:</strong>{' '}
                  {hours.length
                    ? hours
                        .map((hour) => `${hour.name} (${hour.canChi.name}, ${hourRange(hour)})`)
                        .join(', ')
                    : 'Không có giờ phù hợp trong nhóm này.'}
                </p>
              )
            })}
            {!result.hours.some((hour) => hour.group !== 'excluded') ? (
              <p>Không có giờ phù hợp trong phạm vi đang xét; không nới điều kiện chọn giờ.</p>
            ) : null}
            <details className={styles.details}>
              <summary>Xem đủ 12 giờ và lý do</summary>
              <ul className={styles.hours}>
                {result.hours.map((hour) => (
                  <li
                    key={hour.chi}
                    data-personal-hour={hour.chi}
                    aria-current={hour.chi === current ? 'time' : undefined}
                  >
                    <h4>
                      Giờ {hour.name} · {hour.canChi.name}
                      {hour.chi === current ? <span className={styles.now}>Bây giờ</span> : null}
                    </h4>
                    <p>{hourRange(hour)}</p>
                    <p>
                      {hour.god} · {hour.isGood ? 'Hoàng đạo chung' : 'Hắc đạo chung'}
                    </p>
                    <p>
                      {hour.branch.text}; {hour.stem.text}
                    </p>
                    <p>
                      <strong>{groupLabel[hour.group]}</strong>
                      {hour.exclusions.length ? `: ${hour.exclusions.join('; ')}` : null}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </div>
          <section className={styles.section} aria-label="Quan hệ cá nhân mở rộng">
            <h3>Quan hệ cá nhân mở rộng</h3>
            {result.personalStars.status === 'ready' ? (
              <>
                <div className={styles.result}>
                  <h4>Thiên can xung</h4>
                  <p
                    className={result.personalStars.stemClash.hit ? styles.caution : styles.neutral}
                  >
                    {result.personalStars.stemClash.reason}
                  </p>
                  <p className={styles.muted}>
                    Đây là lý do bổ sung và không làm đổi kết luận ngày của MVP.
                  </p>
                </div>
                <details className={styles.details}>
                  <summary>Phạm vi và nguồn quan hệ mở rộng</summary>
                  <p>
                    Chỉ dùng bốn cặp Can xung đã được đối chiếu: Giáp–Canh, Ất–Tân, Bính–Nhâm và
                    Đinh–Quý. Không suy thêm cặp cho Mậu/Kỷ và không dùng phép hóa hợp.
                  </p>
                  <p>
                    Thái Tuế, Tuế Phá, Tam Sát cá nhân và Sát Chủ cá nhân chưa đủ căn cứ để tính nên
                    không xuất kết luận. Thụ Tử và Sát Chủ vẫn là sao chung trong Lịch vạn niên,
                    không được đếm lại thành sao cá nhân.
                  </p>
                  <FengShuiSources
                    rules={[
                      {
                        id: result.personalStars.stemClash.ruleId,
                        version: result.personalStars.stemClash.version,
                        sourceIds: result.personalStars.stemClash.sourceIds,
                      },
                    ]}
                  />
                </details>
              </>
            ) : (
              <p>{result.personalStars.reason}</p>
            )}
          </section>
          <details className={styles.details}>
            <summary>Cách tính ngày, giờ và nguồn</summary>
            <p>
              Năm sinh đổi vào Tết âm lịch Việt Nam (UTC+7). Ngày và Can giờ đổi lúc 00:00; hai đoạn
              giờ Tý thuộc cùng ngày đang xem. Can Chi năm sinh và nạp âm không phải Nhật chủ hay
              Dụng thần Bát Tự.
            </p>
            <p>
              Ưu tiên lưu ý khi Chi xung, Can khắc không có Can hợp hoặc nạp âm khắc ở một trong hai
              chiều. Giữ mọi yếu tố thuận và cần lưu ý; không dùng điểm số. Can hợp được ưu tiên
              trong kết luận Thiên can, quan hệ ngũ hành vẫn được hiển thị.
            </p>
            <p>
              Chỉ chọn giờ hoàng đạo chung, không xung tuổi và không khắc qua Can (trừ Can hợp). Ưu
              tiên giờ hợp hoặc sinh tuổi. Chưa dùng giờ sinh, thần sát cá nhân hay luận giải Bát
              Tự. Hạn năm được xét riêng phía dưới.
            </p>
            <p>
              Thông tin văn hóa tham khảo trong phạm vi đã nêu, không bảo đảm kết quả công việc hay
              dự báo sức khỏe, tài chính.
            </p>
            <FengShuiSources rules={result.rules} />
          </details>
        </>
      )}
      <AnnualFengShuiSection
        key={`${user?.uid ?? 'local'}:${settings.birthDate ? 'saved' : 'missing'}`}
        date={date}
        birthDate={settings.birthDate}
        rules={rules}
      />
    </section>
  )
}

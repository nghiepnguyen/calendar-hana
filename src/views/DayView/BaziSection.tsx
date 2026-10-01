import { useMemo } from 'react'
import { calculateBazi } from '@shared/bazi'
import type { Settings } from '@shared/types'
import styles from './BaziSection.module.css'

export function BaziSection({ settings }: { settings: Settings }) {
  const result = useMemo(() => calculateBazi(settings), [settings])
  return (
    <section className={styles.section} aria-label="Tứ Trụ theo giờ sinh">
      <h3>Tứ Trụ theo giờ sinh</h3>
      {result.status === 'insufficientData' ? (
        <>
          <p>{result.reason}</p>
          <a className="btn" href="/settings#birth-info">
            Bổ sung hồ sơ sinh
          </a>
        </>
      ) : (
        <>
          {result.status === 'ambiguous' ? (
            <p>
              Có {result.candidates.length} khả năng vì khoảng giờ hoặc offset đi qua ranh giới.
            </p>
          ) : null}
          {result.candidates.map((candidate, index) => (
            <div key={`${candidate.instantUtc}:${index}`}>
              {result.candidates.length > 1 ? <h4>Khả năng {index + 1}</h4> : null}
              <div className={styles.pillars}>
                {(
                  [
                    ['Năm', candidate.pillars.year.name],
                    ['Tháng', candidate.pillars.month.name],
                    ['Ngày', candidate.pillars.day.name],
                    ['Giờ', candidate.pillars.hour.name],
                  ] as const
                ).map(([label, value]) => (
                  <div className={styles.pillar} key={label}>
                    <span className={styles.muted}>{label}</span>
                    <p>
                      <strong>{value}</strong>
                    </p>
                  </div>
                ))}
              </div>
              <p className={styles.muted}>
                Giờ hành chính {settings.birthDate} {settings.birthTime} · TST{' '}
                {candidate.solarTime.tstDateTime.replace('T', ' ')} · hiệu chỉnh{' '}
                {Math.round(candidate.solarTime.totalCorrectionSeconds)} giây
              </p>
            </div>
          ))}
          <details>
            <summary>Nguồn, quy ước và giới hạn</summary>
            <p>
              Astronomy Engine {result.versions.astronomy} · tzdb {result.versions.tzdb} · quy tắc{' '}
              {result.versions.rules}. Giao tiết so theo UTC instant; ngày và giờ luận trụ dùng TST.
            </p>
            <p>
              Quy ước giờ Tý:{' '}
              {settings.birthZiPolicy === 'dayStartsAt23'
                ? 'đổi ngày từ 23:00'
                : 'tách Dạ Tý/Chính Tý'}
              . Sai số engine tối đa 30 giây trong phạm vi benchmark; độ chắc chắn giờ và tọa độ là
              giới hạn riêng.
            </p>
          </details>
        </>
      )}
    </section>
  )
}

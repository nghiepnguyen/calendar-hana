import { Modal } from '../../components/Modal/Modal'
import styles from './AlmanacPanel.module.css'

export interface ExplainItem {
  /** Ví dụ "Sao Thiên Đức", "Trực Chấp". */
  title: string
  isGood: boolean
  /** Ghi đè nhãn Tốt/Xấu, ví dụ "Bình hòa" cho kết quả trung tính. */
  verdict?: { label: string; tone: 'good' | 'bad' | 'neutral' | 'attention' }
  meaning?: string
  /** Các dòng "vì sao ra kết quả này", hiện dạng danh sách ngắn. */
  reasons?: readonly string[]
  shouldDo?: string
  shouldAvoid?: string
}

interface AlmanacExplainProps {
  item: ExplainItem
  onClose: () => void
}

/** Hộp giải thích ngắn cho một sao hoặc một trực (bottom sheet trên điện thoại). */
export function AlmanacExplain({ item, onClose }: AlmanacExplainProps) {
  return (
    <Modal title={item.title} onClose={onClose} size="sm">
      <div className={styles.explain}>
        <span
          className={`${styles.pill} ${
            (item.verdict?.tone ?? (item.isGood ? 'good' : 'bad')) === 'good'
              ? styles.pillGood
              : (item.verdict?.tone ?? 'bad') === 'neutral'
                ? styles.pillNeutral
                : item.verdict?.tone === 'attention'
                  ? styles.pillAttention
                  : styles.pillBad
          }`}
        >
          {item.verdict?.label ?? (item.isGood ? 'Tốt' : 'Xấu')}
        </span>
        {item.meaning ? <p>{item.meaning}</p> : null}
        {item.reasons?.length ? (
          <ul className={styles.explainReasons}>
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {item.shouldDo || item.shouldAvoid ? (
          <dl className={styles.explainList}>
            {item.shouldDo ? (
              <div>
                <dt>Nên làm</dt>
                <dd>{item.shouldDo}</dd>
              </div>
            ) : null}
            {item.shouldAvoid ? (
              <div>
                <dt>Nên kiêng</dt>
                <dd>{item.shouldAvoid}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </Modal>
  )
}

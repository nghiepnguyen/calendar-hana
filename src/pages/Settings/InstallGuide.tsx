import { type CSSProperties } from 'react'
import { type Step } from './installGuideData'
import { iconSize } from '../../styles/textSize'
import styles from './InstallSection.module.css'

/** Các bước đánh số nối bằng một đường dọc, mỗi bước có icon minh hoạ thao tác. */
export function Guide({ steps, note }: { steps: Step[]; note: string }) {
  return (
    <>
      <ol className={styles.steps}>
        {steps.map(({ icon: StepIcon, text }, index) => (
          <li key={text} className={styles.step} style={{ '--i': index } as CSSProperties}>
            <span className={styles.stepMarker} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.stepIcon} aria-hidden="true">
              <StepIcon size={iconSize(18)} weight="duotone" />
            </span>
            <span className={styles.stepText}>{text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.note}>{note}</p>
    </>
  )
}

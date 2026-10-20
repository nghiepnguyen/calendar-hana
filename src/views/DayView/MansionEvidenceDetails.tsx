import type { Evidence } from '@shared/lunar/evidence'
import { analyzeEvidenceConflicts } from '@shared/lunar/evidenceConflicts'
import { ACTIVITY_LABELS } from '@shared/lunar/activityRecommendations'
import styles from './DailyActivitySection.module.css'

const POLARITY = {
  positive: 'Thuận theo đoạn nguồn',
  negative: 'Bất lợi theo đoạn nguồn',
  neutral: 'Không nêu thuận hay bất lợi',
}
const REASONS: Record<string, string> = {
  unmapped_activity: 'Chưa có mục hoạt động tương ứng.',
  incompatible_activity_scope: 'Phạm vi hoạt động cần đối chiếu thêm.',
  missing_authority_context: 'Chưa xác định bản nguồn để đối chiếu.',
  missing_conditions: 'Chưa có điều kiện áp dụng rõ ràng.',
  unknown_operand: 'Chưa đủ ngữ cảnh để kiểm tra điều kiện.',
  unresolved_exceptions: 'Ngoại lệ cần đối chiếu thêm.',
  condition_mismatch: 'Điều kiện không khớp ngày đang xem.',
  no_evidence: 'Chưa có bằng chứng áp dụng.',
}

export function MansionEvidenceDetails({
  evidence,
  unmapped = [],
  mansionIndex,
}: {
  evidence: readonly Evidence[]
  unmapped?: readonly Evidence[]
  mansionIndex: number
}) {
  const all = [...evidence, ...unmapped]
  const analysis = analyzeEvidenceConflicts(all, { MANSION_INDEX: mansionIndex })
  const renderRow = (row: Evidence) => {
    const issue = [...analysis.unresolved, ...analysis.notApplicable].find(
      (r) => r.ruleId === row.ruleId && r.sourceRef === row.sourceRef,
    )
    const conditionsMatch =
      row.conditions?.length &&
      row.conditions.every((c) => c.operand === 'MANSION_INDEX' && c.equals === mansionIndex)
    return (
      <li key={`${row.ruleId}:${row.scope}`} className={styles.sourceEvidence}>
        <strong>{row.label}</strong>
        <p>
          {row.sourcePhrase} — {POLARITY[row.polarity]}
        </p>
        {row.sourceQuote && <blockquote lang="zh-Hant">{row.sourceQuote}</blockquote>}
        {row.evidenceConfidence?.transcription === 'PARTIAL' && (
          <p>
            Một số chữ trên bản scan không đọc rõ (□). Ý nghĩa “{row.sourcePhrase} —{' '}
            {POLARITY[row.polarity].toLowerCase()}” vẫn xác định được.
          </p>
        )}
        <p>Phạm vi: {ACTIVITY_LABELS[row.activityId] ?? row.sourcePhrase}.</p>
        {row.activityMapping?.reviewStatus === 'interpretation_pending' && (
          <p>
            Cách hiểu hoạt động chưa được thẩm định.
            {row.activityMapping.reviewNote && ` ${row.activityMapping.reviewNote}`}
          </p>
        )}
        {row.activityMapping?.reviewStatus === 'interpretation_reviewed' && (
          <p>
            Thuật ngữ nguồn <span lang="zh-Hant">{row.activityMapping.reviewTerm}</span> đã rà soát
            cách hiểu; vẫn chỉ tham khảo.
            {row.activityMapping.reviewNote && ` ${row.activityMapping.reviewNote}`}
          </p>
        )}
        {conditionsMatch && <p>Điều kiện Tú của ngày: khớp.</p>}
        {issue && <p>{REASONS[issue.reason] ?? 'Cần đối chiếu thêm trước khi diễn giải.'}</p>}
        {!!row.exceptions?.length && (
          <ul aria-label="Ngoại lệ nguồn">
            {row.exceptions.map((exception) => (
              <li key={exception}>{exception}</li>
            ))}
          </ul>
        )}
        {/^https?:\/\//.test(row.sourceRef) && (
          <a href={row.sourceRef} target="_blank" rel="noopener noreferrer">
            Bản scan nguồn
          </a>
        )}
      </li>
    )
  }
  return (
    <details className={styles.more}>
      <summary>Thông tin Tú (tham khảo)</summary>
      <div className={styles.evidenceBody}>
        <p>Chỉ tham khảo; không tính vào điểm hoặc kết luận chọn ngày.</p>
        {evidence.length ? (
          <ul aria-label="Đoạn nguồn theo mục tiêu">{evidence.map(renderRow)}</ul>
        ) : (
          <p>Chưa có đoạn nguồn nêu rõ việc đã chọn; không suy ra nên làm hay nên kiêng.</p>
        )}
        {!!unmapped.length && (
          <section aria-label="Việc chưa có mục tương ứng">
            <strong>Việc khác trong nguồn chưa có mục tương ứng</strong>
            <ul>{unmapped.map(renderRow)}</ul>
          </section>
        )}
        {analysis.conflicts.map((conflict, index) => (
          <section key={index} aria-label="Nội dung nguồn trái chiều">
            <strong>
              {conflict.kind === 'within_authority'
                ? 'Cùng bản nguồn có nội dung trái chiều.'
                : 'Các bản nguồn có nội dung trái chiều.'}
            </strong>
            <p>Phạm vi: {ACTIVITY_LABELS[conflict.activityId] ?? 'Việc đang đối chiếu'}.</p>
            <ul>
              {conflict.witnesses.map((witness, i) => {
                const row = all.find(
                  (r) => r.ruleId === witness.ruleId && r.sourceRef === witness.sourceRef,
                )
                return (
                  <li key={i}>
                    {row?.label}: {row?.sourcePhrase} — {POLARITY[witness.polarity]}
                  </li>
                )
              })}
            </ul>
            <p>Cần đối chiếu từng nguồn và điều kiện; chưa chọn nội dung nào làm kết luận.</p>
          </section>
        ))}
      </div>
    </details>
  )
}

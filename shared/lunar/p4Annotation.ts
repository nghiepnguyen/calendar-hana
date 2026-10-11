/**
 * Pre-scoring P4 annotation contract. Audit only: not imported by the production pipeline.
 * This records what a resolved source scope annotates, never a product score/status.
 */
export type P4Annotation = 'both_present' | 'only_yi' | 'only_ji' | 'neither_recorded'

export interface P4AnnotationInput {
  yi: boolean | undefined
  ji: boolean | undefined
  /** A proven source clause explicitly records neither; absence alone is not this evidence. */
  explicitNeither: boolean
}

export function classifyP4Annotation(input: P4AnnotationInput): P4Annotation | 'undetermined' {
  if (input.explicitNeither) {
    if (input.yi || input.ji) throw new RangeError('Explicit neither contradicts recorded 宜/忌')
    return 'neither_recorded'
  }
  if (input.yi === undefined || input.ji === undefined) return 'undetermined'
  if (input.yi && input.ji) return 'both_present'
  if (input.yi) return 'only_yi'
  if (input.ji) return 'only_ji'
  return 'undetermined'
}

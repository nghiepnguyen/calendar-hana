export const GENERATOR_VERSION: string
export const SOURCE_PATH: string
export const MANIFEST_PATH: string
export const OUTPUT_PATH: string
export function renderAuthorityData(root?: string): {
  text: string
  encoded: string
  encodedSha256: string
  sourceSha256: string
  ttMs: number[]
}

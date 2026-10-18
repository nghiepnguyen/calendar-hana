import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

// Test-only. Owner rule 2026-10-17: a source/Golden lock is a historical proof. Files it pins outside its own
// directory (runtime code, catalogs) are checked as committed at the earliest commit on HEAD's history that
// carries the lock, so later runtime changes (roadmap 8+) do not break the proof. Rewritten history (e.g.
// c12df53 in yi-freeze-v1/commit-proof.json) is not reachable, hence "earliest reachable", not the recorded id.

const git = (args: string[], input?: string) =>
  execFileSync('git', args, { input, maxBuffer: 1 << 30 })

/** Earliest commit on HEAD's history that adds `lockPath`. */
export function lockAnchor(lockPath: string) {
  const first = git(['log', '--reverse', '--format=%H', 'HEAD', '--', lockPath])
    .toString()
    .split('\n')[0]
  if (!first) throw new Error(`lock not in history: ${lockPath}`)
  return first
}

/** sha256 of each path as committed at the anchor of `lockPath`. */
export function lockedDigests(lockPath: string, paths: readonly string[]) {
  const commit = lockAnchor(lockPath)
  const out = git(['cat-file', '--batch'], paths.map((p) => `${commit}:${p}`).join('\n') + '\n')
  const digests = new Map<string, string>()
  let at = 0
  for (const path of paths) {
    const eol = out.indexOf(10, at)
    const header = out.subarray(at, eol).toString('utf8').split(' ')
    if (header[1] !== 'blob') throw new Error(`not in ${commit}: ${path}`)
    const size = Number(header[2])
    digests.set(
      path,
      createHash('sha256')
        .update(out.subarray(eol + 1, eol + 1 + size))
        .digest('hex'),
    )
    at = eol + 1 + size + 1
  }
  return digests
}

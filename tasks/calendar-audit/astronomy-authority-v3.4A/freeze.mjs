// Phase 3B.4.4A freeze: only if BOTH independent reviews passed on exactly these
// candidate bytes. The single permitted change is reviewStatus CANDIDATE ->
// REVIEWED_FROZEN; everything else must stay byte-identical (verified).
// Refuses to overwrite an existing golden-v4 (frozen data is never regenerated in place).
// Usage (repo root): node .../freeze.mjs <candidateDir> <review-authority.json> <review-groupb.json>
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'

const [cand, reviewAPath, reviewBPath] = process.argv.slice(2)
const A = 'tasks/calendar-audit/astronomy-authority-v3.4A'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const RULES = ['month-breaker', 'robbery-sha', 'disaster-sha', 'month-sha', 'month-virtue']
const reviewA = JSON.parse(readFileSync(reviewAPath, 'utf8'))
const reviewB = JSON.parse(readFileSync(reviewBPath, 'utf8'))
if (reviewA.verdict !== 'PASS' || reviewB.verdict !== 'PASS') throw new Error('BLOCK_INDEPENDENT_REVIEW: a review did not pass')
if (existsSync('golden-v4/manifest.json') && !process.argv.includes('--verify-only'))
  throw new Error('golden-v4 already frozen; a change requires a new Golden version')

const plan = [{ src: `${cand}/authority.json`, dst: 'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', reviewed: reviewA.candidateSha256 }]
for (const r of RULES) plan.push({ src: `${cand}/group-b/${r}.json`, dst: `golden-v4/group-b/${r}.json`, reviewed: reviewB.candidateFileSha256[r] })

if (process.argv.includes('--verify-only')) {
  // Reproduction mode: regenerated, reviewed candidate + status flip must equal the frozen bytes.
  const manifest = JSON.parse(readFileSync('golden-v4/manifest.json', 'utf8'))
  for (const p of plan) {
    const text = readFileSync(p.src, 'utf8')
    if (sha(text) !== p.reviewed) throw new Error(`candidate differs from reviewed bytes: ${p.src}`)
    const frozen = text.replace('"reviewStatus": "CANDIDATE"', '"reviewStatus": "REVIEWED_FROZEN"')
    if (readFileSync(p.dst, 'utf8') !== frozen) throw new Error(`REGENERATION MISMATCH ${p.dst}`)
    if (manifest.files[p.dst].sha256 !== sha(frozen)) throw new Error(`manifest mismatch ${p.dst}`)
  }
  console.log('verify-only: regenerated + reviewed candidates reproduce the frozen golden-v4 byte-for-byte')
  process.exit(0)
}
const files = {}
for (const p of plan) {
  const text = readFileSync(p.src, 'utf8')
  if (sha(text) !== p.reviewed) throw new Error(`candidate bytes differ from reviewed bytes: ${p.src}`)
  const marker = '"reviewStatus": "CANDIDATE"'
  if (text.split(marker).length !== 2) throw new Error(`status marker not unique in ${p.src}`)
  const frozen = text.replace(marker, '"reviewStatus": "REVIEWED_FROZEN"')
  if (frozen.replace('"reviewStatus": "REVIEWED_FROZEN"', marker) !== text) throw new Error('freeze changed more than the status')
  mkdirSync(p.dst.split('/').slice(0, -1).join('/'), { recursive: true })
  writeFileSync(p.dst, frozen)
  if (readFileSync(p.dst, 'utf8') !== frozen) throw new Error(`write verification failed ${p.dst}`)
  files[p.dst] = { sha256: sha(frozen), reviewedCandidateSha256: p.reviewed, bytes: Buffer.byteLength(frozen) }
}
// Review reports are committed with the audit and pinned here.
mkdirSync(`${A}/reviews`, { recursive: true })
copyFileSync(reviewAPath, `${A}/reviews/review-authority.json`)
copyFileSync(reviewBPath, `${A}/reviews/review-groupb.json`)
const pin = (p) => ({ path: p, sha256: sha(readFileSync(p)) })
const manifest = {
  goldenVersion: 'golden-v4',
  status: 'REVIEWED_FROZEN',
  authorityVersion: 'astronomy-authority-v4',
  clockPolicy: 'clock-v1',
  supersedes: 'nothing — golden-v3 remains the immutable historical Golden of the previous authority',
  policy: 'Frozen. Any modification requires a new Golden version (golden-v5); never regenerate in place.',
  files,
  reviews: [pin(`${A}/reviews/review-authority.json`), pin(`${A}/reviews/review-groupb.json`)],
  inputs: [
    { name: 'JPL DE440s kernel', sha256: 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2' },
    { ...pin('tasks/calendar-audit/erfa-foundation-v3.3/clock/iers-Leap_Second.dat'), name: 'IERS Leap_Second.dat (Bulletin C 72)' },
    { ...pin('calendar-rule-extraction-v3.json'), name: 'Group B source rule extraction (frozen v3)' },
  ],
  tooling: ['generator/jpl_authority.py', 'generator/clock_v1.py', 'generator/groupb_generator.py', 'review/review_authority.py', 'review/review_groupb.mjs', 'freeze.mjs'].map((p) => pin(`${A}/${p}`)),
}
writeFileSync('golden-v4/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
for (const [p, f] of Object.entries(files)) if (sha(readFileSync(p)) !== f.sha256) throw new Error(`post-freeze hash ${p}`)
console.log(JSON.stringify({ frozen: Object.keys(files).length, manifest: sha(readFileSync('golden-v4/manifest.json')) }))

// Protected-file hash manifest for Phase 3B.4.3 (audit tooling only).
// Hashes every git-tracked file at the starting HEAD, grouped by protection class.
// Usage: node hash-manifest.mjs <out.json>
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const out = process.argv[2]
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const classes = [
  ['SOLAR_TERM_PRODUCTION', /^shared\/lunar\/solarTerms(\.test)?\.ts$/],
  ['GROUP_A', /^(shared\/lunar\/groupA|golden-v3\/four-|scripts\/mutate-group-a)/],
  ['GROUP_B', /^(shared\/lunar\/groupB|golden-v3\/group-b|scripts\/mutate-group-b)/],
  ['GOLDEN', /^golden-v3\//],
  ['BAZI', /^shared\/bazi\//],
  ['LUNAR_CORE', /^shared\/lunar\//],
  ['ALMANAC_DATA', /^shared\/almanac-data\//],
  ['VALIDATION_SPECS_AND_AUDITS', /^(calendar-|CALENDAR-|integrity-final|tasks\/)/],
  ['APP_AND_FUNCTIONS', /^(src|functions|scripts|public)\//],
  ['BUILD_CONFIG', /^(package(-lock)?\.json|vite\.config\.ts|vitest.*\.ts|tsconfig.*\.json|playwright.*\.ts|firebase\.json|index\.html|THIRD_PARTY_NOTICES\.md)$/],
]
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const entries = {}
for (const f of files) {
  if (!existsSync(f)) { entries[f] = { class: 'MISSING', sha256: null }; continue }
  const cls = classes.find(([, re]) => re.test(f))?.[0] ?? 'OTHER_TRACKED'
  entries[f] = { class: cls, sha256: hash(f) }
}
// Authoritative validation specs live outside the repository; protect them too.
const home = process.env.HOME
for (const name of ['calendar-source-lock-v3.md', 'calendar-validation-patch-v2.1.md', 'calendar-validation-spec-v3.md', 'calendar-validation.spec.md']) {
  const p = `${home}/Downloads/${name}`
  entries[`external:~/Downloads/${name}`] = { class: 'EXTERNAL_VALIDATION_SPEC', sha256: existsSync(p) ? hash(p) : null }
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const counts = {}
for (const e of Object.values(entries)) counts[e.class] = (counts[e.class] ?? 0) + 1
writeFileSync(out, JSON.stringify({ phase: '3B.4.3', head, generatedAt: new Date().toISOString(), scope: 'all git-tracked files at HEAD', counts, files: entries }, null, 1) + '\n')
console.log(head, counts)

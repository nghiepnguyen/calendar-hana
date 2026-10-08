// Used ONLY by mutant G10 to simulate the forbidden practice of taking Jie
// instants from the production engine. Prints {"year:longitude": civilMs}.
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const out = join(mkdtempSync(join(tmpdir(), 'prod-jie-')), 'p.mjs')
execFileSync('npx', ['rolldown', 'shared/lunar/solarTerms.ts', '--format', 'esm', '--file', out], { stdio: 'ignore' })
const { solarTermsForYear } = await import(out)
const map = {}
for (let y = 1899; y <= 2101; y++) for (const t of solarTermsForYear(y)) map[`${y}:${t.longitude}`] = Date.parse(t.instantUtc)
process.stdout.write(JSON.stringify(map))

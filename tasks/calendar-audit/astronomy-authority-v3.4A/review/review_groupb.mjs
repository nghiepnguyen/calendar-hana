// Phase 3B.4.4A INDEPENDENT REVIEW of Group B Golden vNext (Node, separate language
// and code from the Python generator). Imports nothing from shared/ or src/.
//
// Independently derives: clock-v1 civil ms (own implementation), Month Jian from the
// REVIEWER's own canonical T (review_authority output), day stem/branch (own date
// arithmetic), all 60 rule-table cells (from the classical triad/opposition
// definitions, cross-checked against the extraction JSON and old Golden derivations),
// and every fixture's expected context and boolean.
// Usage: node review_groupb.mjs <candidateDir> <authority.json> <review-authority.json> <Leap_Second.dat> <out.json>
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const [dir, authorityPath, reviewAuthorityPath, leapPath, outPath] = process.argv.slice(2)
const sha = (b) => createHash('sha256').update(b).digest('hex')
const findings = []
const finding = (classification, message, extra = {}) => findings.push({ classification, message, ...extra })
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const RULES = ['month-breaker', 'robbery-sha', 'disaster-sha', 'month-sha', 'month-virtue']

// ---- 0. Generator independence guard (static) --------------------------------------
const generatorDir = process.env.GENERATOR_DIR ?? fileURLToPath(new URL('../generator/', import.meta.url))
const generatorSources = ['jpl_authority.py', 'groupb_generator.py', 'clock_v1.py'].map((p) =>
  readFileSync(`${generatorDir}/${p}`, 'utf8'),
)
const forbidden = [/shared\/lunar/, /groupB\.ts/, /astronomy\/erfa/, /astronomy-engine/, /solarTerms/, /evaluateGroupBAtInstant/, /getSolarMonth/, /golden-v3/, /exact-jie-evidence/, /erfa-solar-term-candidate/]
for (const src of generatorSources)
  for (const re of forbidden) if (re.test(src)) finding('GOLDEN_GENERATOR_ERROR', `generator references forbidden oracle ${re}`)

// ---- 1. Own clock-v1 ---------------------------------------------------------------------
const leapText = readFileSync(leapPath, 'utf8')
if (sha(leapText) !== '6cb6f5d4b819f2e568e25db4b0b26d89dedf031fdffb18bc94d40f4e94e268d7') throw new Error('leap file hash')
const leaps = leapText
  .split('\n')
  .filter((l) => /^\s+\d+\.0\s/.test(l))
  .map((l) => l.trim().split(/\s+/).map(Number))
  .map(([, d, m, y, n]) => ({ start: Date.UTC(y, m - 1, d), offset: 32184 + n * 1000 }))
const J2000 = 946728000000
const KNOWN_THROUGH = Date.UTC(2027, 5, 28)
function deltaT(utDays) {
  const y = 2000 + (utDays - 14) / 365.24217
  let u, u2, u3, u4, u5
  if (y < 1860 || y >= 1986) throw new Error('deltaT range')
  if (y < 1900) { u = y - 1860; u2 = u * u; u3 = u * u2; u4 = u2 * u2; u5 = u2 * u3; return 7.62 + 0.5737 * u - 0.251754 * u2 + 0.01680668 * u3 - 0.0004473624 * u4 + u5 / 233174 }
  if (y < 1920) { u = y - 1900; u2 = u * u; u3 = u * u2; u4 = u2 * u2; return -2.79 + 1.494119 * u - 0.0598939 * u2 + 0.0061966 * u3 - 0.000197 * u4 }
  if (y < 1941) { u = y - 1920; u2 = u * u; u3 = u * u2; return 21.2 + 0.84493 * u - 0.0761 * u2 + 0.0020936 * u3 }
  if (y < 1961) { u = y - 1950; u2 = u * u; u3 = u * u2; return 29.07 + 0.407 * u - u2 / 233 + u3 / 2547 }
  u = y - 1975; u2 = u * u; u3 = u * u2
  return 45.45 + 1.067 * u - u2 / 260 - u3 / 718
}
function clockV1(ttMs) {
  const clock = ttMs + J2000
  if (clock < leaps[0].start + leaps[0].offset) {
    let ut = ttMs
    for (let i = 0; i < 6; i++) ut = ttMs - deltaT(ut / 86400000) * 1000
    return [Math.ceil(ut + J2000), 'PRE1972_MODELED_UT1']
  }
  let k = 0
  while (k + 1 < leaps.length && clock >= leaps[k + 1].start + leaps[k + 1].offset) k++
  const epoch = clock - leaps[k].offset
  if (leaps[k + 1] && epoch >= leaps[k + 1].start) throw new Error('LEAP_SECOND_UNREPRESENTABLE')
  return [epoch, epoch >= KNOWN_THROUGH ? 'PROJECTED_PINNED_TAI_UTC' : 'UTC_LEAP_HISTORY']
}

// ---- 2. Authority rows vs reviewer T and reviewer clock --------------------------------
const authorityText = readFileSync(authorityPath, 'utf8')
const authority = JSON.parse(authorityText)
const reviewAuthority = JSON.parse(readFileSync(reviewAuthorityPath, 'utf8'))
if (reviewAuthority.candidateSha256 !== sha(authorityText)) finding('REVIEWER_ERROR', 'astronomy review was run on a different candidate')
if (reviewAuthority.verdict !== 'PASS') finding('REFERENCE_ROOT_ERROR', 'astronomy review did not pass')
if (authority.clockPolicy !== 'clock-v1') finding('SERIALIZATION_ERROR', `clock policy ${authority.clockPolicy} is not clock-v1`)
const jie = []
authority.rows.forEach((encoded, i) => {
  const f = encoded.split('|')
  const [year, term, tt, civil, iso, regime] = [Number(f[0]), Number(f[1]), Number(f[3]), Number(f[4]), f[5], f[6]]
  const reviewT = reviewAuthority.reviewTtMs[i]
  if (reviewT !== tt) finding('REFERENCE_ROOT_ERROR', 'authority T differs from reviewer T', { year, term })
  const [c, r] = clockV1(reviewT)
  if (c !== civil || r !== regime || new Date(c).toISOString() !== iso)
    finding('SERIALIZATION_ERROR', 'clock-v1 civil serialization differs', { year, term, generator: [civil, iso, regime], reviewer: [c, new Date(c).toISOString(), r] })
  const lon = term * 15
  if (lon % 30 === 15) jie.push({ year, lon, civil: c, branch: BRANCHES[(((lon - 315) / 30 + 2) % 12 + 12) % 12] })
})
jie.sort((a, b) => a.civil - b.civil)
const activeJie = (ms) => {
  let lo = 0, hi = jie.length - 1
  if (ms < jie[0].civil) throw new Error('before range')
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (jie[mid].civil <= ms) lo = mid; else hi = mid - 1 }
  return jie[lo]
}

// ---- 3. Rule table: 60 cells from classical definitions -----------------------------------
// Triads: 寅午戌 fire, 亥卯未 wood, 申子辰 water, 巳酉丑 metal; 長生 / 帝旺 / 墓 positions.
const B = (c) => BRANCHES.indexOf(c)
const triad = (jian) => [[B('寅'), B('午'), B('戌')], [B('亥'), B('卯'), B('未')], [B('申'), B('子'), B('辰')], [B('巳'), B('酉'), B('丑')]].find((t) => t.includes(B(jian)))
const yangStem = { [B('午')]: '丙', [B('卯')]: '甲', [B('子')]: '壬', [B('酉')]: '庚' }
const formula = {
  'month-breaker': (j) => ['DAY_BRANCH', BRANCHES[(B(j) + 6) % 12]], // 月破: opposite of 月建
  'robbery-sha': (j) => ['DAY_BRANCH', BRANCHES[(triad(j)[0] + 9) % 12]], // 劫煞: 絕, three before 長生
  'disaster-sha': (j) => ['DAY_BRANCH', BRANCHES[(triad(j)[1] + 6) % 12]], // 災煞: opposite of 帝旺
  'month-sha': (j) => ['DAY_BRANCH', BRANCHES[(triad(j)[2] + 3) % 12]], // 月煞: three after 墓
  'month-virtue': (j) => ['DAY_STEM', yangStem[triad(j)[1]]], // 月德: yang stem of the triad element
}
const extraction = JSON.parse(readFileSync(new URL('../../../../calendar-rule-extraction-v3.json', import.meta.url), 'utf8'))
const cells = {}
for (const rule of RULES) {
  const src = extraction.rules.find((r) => r.id === rule)
  cells[rule] = {}
  for (const row of src.rule.lookup) {
    const [type, target] = formula[rule](row.sourceMonthJianBranch)
    const kind = { day_branch: 'DAY_BRANCH', day_stem: 'DAY_STEM' }[row.target.kind]
    if (kind !== type || row.target.value !== target)
      finding('SOURCE_TABLE_ERROR', 'extraction cell differs from classical derivation', { rule, jian: row.sourceMonthJianBranch, extraction: row.target, derived: [type, target] })
    cells[rule][row.sourceMonthJianBranch] = { type, target, sourceRow: row.sourceMonthOrdinal }
  }
  if (Object.keys(cells[rule]).length !== 12) finding('SOURCE_TABLE_ERROR', `${rule} has ${Object.keys(cells[rule]).length} cells`)
}
// Historical corroboration: every (jian -> target) pair recorded by the old reviewed Golden.
let oldPairs = 0
for (const rule of RULES)
  for (const f of JSON.parse(readFileSync(new URL(`../../../../golden-v3/group-b/${rule}.json`, import.meta.url), 'utf8')).fixtures) {
    oldPairs++
    const c = cells[rule][f.context.monthJian]
    if (c.target !== f.derivation.expectedTarget || c.type !== f.derivation.operandType)
      finding('SOURCE_TABLE_ERROR', 'old reviewed Golden pair disagrees with derived table', { rule, id: f.id })
  }

// ---- 4. Day operand: own Gregorian arithmetic from the HKO oracle ----------------------------
const ORACLE = Date.UTC(2014, 1, 5)
const civilDate = (ms) => new Date(ms + 7 * 3600000).toISOString().slice(0, 10)
const dayIndex = (date) => ((((43 + (Date.parse(`${date}T00:00:00Z`) - ORACLE) / 86400000) % 60) + 60) % 60)

// ---- 5. Every fixture --------------------------------------------------------------------------
const files = {}
let checked = 0
const coverage = {}
for (const rule of RULES) {
  const text = readFileSync(`${dir}/${rule}.json`, 'utf8')
  const doc = JSON.parse(text)
  files[rule] = sha(text)
  for (const k of ['authorityVersion', 'referenceEngine', 'referenceKernelSha256', 'observable', 'frame', 'timeScale', 'numericalBoundaryPolicy', 'clockPolicy', 'serializationPolicy', 'generatorVersion', 'reviewStatus'])
    if (!(k in doc)) finding('GOLDEN_GENERATOR_ERROR', `${rule}: missing ${k}`)
  if (doc.authorityDatasetSha256 !== sha(authorityText)) finding('GOLDEN_GENERATOR_ERROR', `${rule}: authority hash mismatch`)
  if (doc.clockPolicy !== 'clock-v1') finding('SERIALIZATION_ERROR', `${rule}: clock policy ${doc.clockPolicy}`)
  if (doc.productionUsed !== false) finding('GOLDEN_GENERATOR_ERROR', `${rule}: productionUsed`)
  const byId = new Map(doc.fixtures.map((f) => [f.id, f]))
  const cov = (coverage[rule] = { classes: {}, posJian: new Set(), negJian: new Set(), jieTypes: new Set(), years: new Set() })
  for (const f of doc.fixtures) {
    checked++
    cov.classes[f.fixtureClass] = (cov.classes[f.fixtureClass] ?? 0) + 1
    const ms = Date.parse(f.instant)
    if (!Number.isFinite(ms) || !/\.\d{3}(Z|[+-]\d{2}:\d{2})$/.test(f.instant)) { finding('SERIALIZATION_ERROR', 'instant not ISO with 3 fractional digits', { id: f.id }); continue }
    if (ms !== f.civilEpochMs) finding('SERIALIZATION_ERROR', 'instant and civilEpochMs disagree', { id: f.id })
    const a = activeJie(ms)
    const date = civilDate(ms)
    const idx = dayIndex(date)
    const cell = cells[rule][a.branch]
    const observed = cell.type === 'DAY_STEM' ? STEMS[idx % 10] : BRANCHES[idx % 12]
    const want = {
      context: { monthJian: a.branch, dayStem: STEMS[idx % 10], dayBranch: BRANCHES[idx % 12], civilDate: date },
      expected: observed === cell.target,
      derivation: { ruleId: rule, operandType: cell.type, observedOperand: observed, expectedTarget: cell.target },
    }
    const got = {
      context: f.context,
      expected: f.expected,
      derivation: { ruleId: f.derivation.ruleId, operandType: f.derivation.operandType, observedOperand: f.derivation.observedOperand, expectedTarget: f.derivation.expectedTarget },
    }
    if (JSON.stringify(want) !== JSON.stringify(got)) {
      const cls = want.context.monthJian !== got.context.monthJian ? 'GOLDEN_GENERATOR_ERROR' : want.derivation.expectedTarget !== got.derivation.expectedTarget ? 'SOURCE_TABLE_ERROR' : 'GOLDEN_GENERATOR_ERROR'
      finding(cls, 'fixture expectation differs from independent derivation', { id: f.id, want, got })
    }
    if (f.provenance?.activeJie?.civilEpochMs !== a.civil) finding('GOLDEN_GENERATOR_ERROR', 'provenance active Jie differs', { id: f.id })
    if (f.fixtureClass === 'interior-positive') cov.posJian.add(a.branch)
    if (f.fixtureClass === 'interior-negative') cov.negJian.add(a.branch)
    cov.years.add(date.slice(0, 4))
    if (f.fixtureClass === 'exact-boundary') {
      const t = jie.find((j) => `jie-${j.year}-${String(j.lon).padStart(3, '0')}` === f.boundary.transitionId)
      const offset = { before: -1, at: 0, after: 1 }[f.boundary.sample]
      if (!t || ms !== t.civil + offset || f.boundary.offsetMs !== offset || f.boundary.canonicalCivilEpochMs !== t.civil)
        finding('FIXTURE_DESIGN_ERROR', 'boundary sample not at reviewer T - 1 ms / T / T + 1 ms', { id: f.id })
      else cov.jieTypes.add(t.lon)
    }
    if (f.fixtureClass === 'timezone-equivalent') {
      const g = byId.get(f.equivalenceGroup)
      if (!g || Date.parse(g.instant) !== ms || g.instant === f.instant) finding('FIXTURE_DESIGN_ERROR', 'timezone-equivalent not equal-instant different-offset', { id: f.id })
    }
    if (f.fixtureClass === 'timezone-civil-date') {
      const wrongIdx = dayIndex(f.wrongCivilDate)
      const wrongObserved = cell.type === 'DAY_STEM' ? STEMS[wrongIdx % 10] : BRANCHES[wrongIdx % 12]
      if (f.wrongCivilDate === date || (wrongObserved === cell.target) === want.expected)
        finding('FIXTURE_DESIGN_ERROR', 'civil-date trap does not discriminate', { id: f.id })
    }
    if (f.fixtureClass === 'rounded-minute-discriminator') {
      const t = jie.find((j) => `jie-${j.year}-${String(j.lon).padStart(3, '0')}` === f.roundedMinuteMutation.transitionId)
      const published = Date.parse(f.roundedMinuteMutation.publishedMinute)
      const nearest = Math.round(t.civil / 60000) * 60000
      const truncated = Math.floor(t.civil / 60000) * 60000
      const jianWith = (boundary) => (ms >= boundary ? t.branch : jie[jie.indexOf(t) - 1].branch)
      const killsNearest = jianWith(nearest) !== a.branch
      if (published !== nearest || !killsNearest || f.roundedMinuteMutation.wrongMonthJian !== jianWith(nearest))
        finding('FIXTURE_DESIGN_ERROR', 'rounded-minute discriminator does not kill nearest-minute rounding', { id: f.id })
      cov.killsTruncation = (cov.killsTruncation ?? false) || jianWith(truncated) !== a.branch
    }
  }
  if (cov.posJian.size !== 12 || cov.negJian.size !== 12) finding('FIXTURE_DESIGN_ERROR', `${rule}: interior Month Jian coverage`)
  if (cov.jieTypes.size !== 12) finding('FIXTURE_DESIGN_ERROR', `${rule}: boundary Jie types ${cov.jieTypes.size}/12`)
  if (!cov.killsTruncation) finding('FIXTURE_DESIGN_ERROR', `${rule}: no discriminator kills truncated minutes`)
  coverage[rule] = { ...cov, posJian: cov.posJian.size, negJian: cov.negJian.size, jieTypes: cov.jieTypes.size, years: [...cov.years].sort() }
}

const result = {
  phase: '3B.4.4A',
  review: 'independent Group B vNext review',
  method: 'Node reviewer; own clock-v1, reviewer canonical T, own day arithmetic, classical-definition rule cells; no production import',
  candidateFileSha256: files,
  authoritySha256: sha(authorityText),
  sourceTable: { cellsDerived: RULES.length * 12, oldGoldenPairsCorroborated: oldPairs },
  fixturesChecked: checked,
  coverage,
  findings,
  verdict: findings.length ? 'FAIL' : 'PASS',
}
writeFileSync(outPath, JSON.stringify(result, null, 1) + '\n')
console.log(JSON.stringify({ verdict: result.verdict, fixturesChecked: checked, findings: findings.length, first: findings.slice(0, 3) }, null, 1))

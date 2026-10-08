// Classifies every pre/post-migration production difference captured by
// impact.snapshot.test.ts. A difference is EXPECTED_AUTHORITY_MIGRATION_CHANGE
// only when the boundary move itself explains it (old Astronomy Engine T vs
// JPL authority T for the same term); everything else is UNEXPECTED_REGRESSION.
//
//   node impact-classify.mjs <old.json> <new.json> <out.json>

import { readFileSync, writeFileSync } from 'node:fs'

const [oldPath, newPath, outPath] = process.argv.slice(2)
const before = JSON.parse(readFileSync(oldPath, 'utf8'))
const after = JSON.parse(readFileSync(newPath, 'utf8'))
const DAY = 86_400_000
const vnDate = (ms) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)

// Term moves keyed by `${year}:${longitude}`; new values from the migrated tree
// are checked against the frozen authority rows.
const rows = JSON.parse(
  readFileSync('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', 'utf8'),
).rows.map((r) => r.split('|'))
const authority = new Map(rows.map((r) => [`${r[0]}:${+r[1] * 15}`, r[5]]))
const moves = Object.keys(before.terms).map((key) => {
  const [year, longitude] = key.split(':').map(Number)
  const oldMs = Date.parse(before.terms[key])
  const newMs = Date.parse(after.terms[key])
  if (after.terms[key] !== authority.get(key)) throw new Error(`migrated ${key} != authority`)
  return { key, year, longitude, oldMs, newMs, lo: Math.min(oldMs, newMs), hi: Math.max(oldMs, newMs) }
})
const isJie = (m) => m.longitude % 30 === 15
const deltas = moves.map((m) => (m.newMs - m.oldMs) / 1000)
const stats = (xs) => {
  const a = xs.map(Math.abs).sort((x, y) => x - y)
  return {
    count: a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.floor(a.length * 0.95)],
    max: a.at(-1),
    over30s: a.filter((x) => x > 30).length,
  }
}
const dateMoves = moves
  .filter((m) => vnDate(m.oldMs) !== vnDate(m.newMs))
  .map((m) => ({
    term: m.key,
    jie: isJie(m),
    old: new Date(m.oldMs).toISOString(),
    new: new Date(m.newMs).toISOString(),
    oldVnDate: vnDate(m.oldMs),
    newVnDate: vnDate(m.newMs),
  }))
// Days whose whole-day label can depend on a moved term: every VN date from old to new.
const labelDays = new Map()
for (const m of dateMoves)
  for (let d = m.oldVnDate < m.newVnDate ? m.oldVnDate : m.newVnDate; d <= (m.oldVnDate < m.newVnDate ? m.newVnDate : m.oldVnDate); d = addDays(d, 1))
    labelDays.set(d, [...(labelDays.get(d) ?? []), m])
const inWindow = (t, list) => list.some((m) => t >= m.lo && t < m.hi)

const result = { days: {}, bazi: {}, officerAtJie: {} }
const record = (bucket, field, item, expected) => {
  const b = (result[bucket][field] ??= { expected: [], unexpected: [] })
  ;(expected ? b.expected : b.unexpected).push(item)
}
const jieMoves = moves.filter(isJie)
const tuLy = [0, 90, 180, 270]
const tuTuyet = [315, 45, 135, 225]

for (const date of Object.keys(before.days)) {
  const o = before.days[date]
  const n = after.days[date]
  const label = labelDays.get(date) ?? []
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  if (!same(o.term, n.term)) {
    // startsAtUtc always carries the boundary value; index/startsToday change only on moved dates.
    const structural = !same(o.term.slice(0, 2), n.term.slice(0, 2))
    record('days', structural ? 'solarTermLabel' : 'solarTermStartsAtValue', date, !structural || label.length > 0)
  }
  if (o.officer !== n.officer) record('days', 'dailyOfficer', { date, old: o.officer, new: n.officer }, label.some((m) => m.jie))
  if (o.almanac !== n.almanac && o.officer === n.officer && same(o.term, n.term))
    record('days', 'almanacOther', date, false)
  if (o.almanacOfficerIndependent !== n.almanacOfficerIndependent)
    record('days', 'almanacOfficerIndependent', date, false)
  o.groupA.forEach((v, i) => {
    if (v === n.groupA[i]) return
    const lons = i === 1 ? tuLy : i === 2 ? tuTuyet : []
    const ok = dateMoves.some(
      (m) => lons.includes(+m.term.split(':')[1]) && [addDays(m.oldVnDate, -1), addDays(m.newVnDate, -1)].includes(date),
    )
    record('days', ['nguyetKy', 'tuLy', 'tuTuyet'][i], { date, old: v, new: n.groupA[i] }, ok)
  })
  if (!same(o.groupB, n.groupB))
    record('days', 'groupBNoon', { date, old: o.groupB, new: n.groupB }, inWindow(Date.parse(`${date}T05:00:00Z`), jieMoves))
}

for (const instant of Object.keys(before.bazi)) {
  const o = before.bazi[instant]
  const n = after.bazi[instant]
  const t = Date.parse(instant)
  for (const field of ['tst', 'eot', 'day', 'hour', 'zi'])
    if (JSON.stringify(o[field]) !== JSON.stringify(n[field])) record('bazi', field, instant, false)
  const window = inWindow(t, jieMoves)
  const lapXuanWindow = inWindow(t, jieMoves.filter((m) => m.longitude === 315))
  if (o.month !== n.month) record('bazi', 'monthPillar', instant, window)
  if (o.year !== n.year) record('bazi', 'yearPillar', instant, lapXuanWindow)
  if (JSON.stringify([o.term[0], o.term[2], o.term[3]]) !== JSON.stringify([n.term[0], n.term[2], n.term[3]]))
    record('bazi', 'termContext', instant, window)
  if (o.term[1] !== n.term[1]) record('bazi', 'termInstantValue', instant, true)
}
for (const t of Object.keys(before.officerAtJie))
  before.officerAtJie[t].forEach((v, i) => {
    if (v !== after.officerAtJie[t][i])
      record('officerAtJie', 'exactInstantOfficer', `${t}${['-1', '+0', '+1'][i]}`, inWindow(+t + i - 1, jieMoves))
  })

const summarize = (bucket) =>
  Object.fromEntries(
    Object.entries(bucket).map(([k, v]) => [
      k,
      {
        EXPECTED_AUTHORITY_MIGRATION_CHANGE: v.expected.length,
        UNEXPECTED_REGRESSION: v.unexpected.length,
        examples: v.expected.slice(0, 12),
        unexpected: v.unexpected.slice(0, 50),
      },
    ]),
  )
const unexpectedTotal = ['days', 'bazi', 'officerAtJie']
  .flatMap((b) => Object.values(result[b]))
  .reduce((s, v) => s + v.unexpected.length, 0)
const out = {
  phase: '3B.4.4B',
  comparison: 'pre-migration production (f845444, Astronomy Engine roots) vs migrated production (JPL authority table, clock-v1)',
  daysCompared: Object.keys(before.days).length,
  baziInstantsCompared: Object.keys(before.bazi).length,
  exactOfficerSamples: Object.keys(before.officerAtJie).length * 3,
  termMoveSeconds: { all: stats(deltas), jie: stats(moves.filter(isJie).map((m) => (m.newMs - m.oldMs) / 1000)), lapXuan: stats(moves.filter((m) => m.longitude === 315).map((m) => (m.newMs - m.oldMs) / 1000)) },
  vnCivilDateMoves: dateMoves,
  days: summarize(result.days),
  bazi: summarize(result.bazi),
  officerAtJie: summarize(result.officerAtJie),
  unexpectedTotal,
}
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify({ unexpectedTotal, dateMoves: dateMoves.length, days: Object.fromEntries(Object.entries(out.days).map(([k, v]) => [k, [v.EXPECTED_AUTHORITY_MIGRATION_CHANGE, v.UNEXPECTED_REGRESSION]])), bazi: Object.fromEntries(Object.entries(out.bazi).map(([k, v]) => [k, [v.EXPECTED_AUTHORITY_MIGRATION_CHANGE, v.UNEXPECTED_REGRESSION]])), officerAtJie: Object.fromEntries(Object.entries(out.officerAtJie).map(([k, v]) => [k, [v.EXPECTED_AUTHORITY_MIGRATION_CHANGE, v.UNEXPECTED_REGRESSION]])) }, null, 1))

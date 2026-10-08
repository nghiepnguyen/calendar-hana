// Phase 3B.4.4A mutation testing of the Golden tooling. Each mutant edits a COPY of
// the generator, runs the full generate -> independent review pipeline for real,
// and counts as KILLED only if the unmodified reviewers report FAIL (or the
// mutated generator aborts). The unmutated baseline must pass first.
// Usage (repo root): WORK=<dir> node .../mutation/mutate-golden.mjs
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const A = 'tasks/calendar-audit/astronomy-authority-v3.4A'
const work = resolve(process.env.WORK)
const KERNEL = process.env.DE440S ?? '/tmp/authority-342-de440s.bsp'
const SKY = process.env.SKYFIELD_PATH ?? '/tmp/authority-342-python'
const LEAP = 'tasks/calendar-audit/erfa-foundation-v3.3/clock/iers-Leap_Second.dat'

const once = (file, from, to) => ({ file, from, to })
const mutants = [
  { id: 'G1', name: 'floor instead of ceil', edits: [once('jpl_authority.py', "row = [int(y), int(k), f'{r:.3f}', int(t),", "row = [int(y), int(k), f'{r:.3f}', int(math.floor(r)),")] },
  { id: 'G2', name: 'round instead of ceil', edits: [once('jpl_authority.py', "row = [int(y), int(k), f'{r:.3f}', int(t),", "row = [int(y), int(k), f'{r:.3f}', int(round(r)),")] },
  { id: 'G3', name: "strict '>' instead of '>=' (t > T is new)", edits: [once('groupb_generator.py', "if j['civilMs'] <= civil_ms:", "if j['civilMs'] < civil_ms:")] },
  { id: 'G4', name: 'shift T +1 ms', edits: [once('jpl_authority.py', "row = [int(y), int(k), f'{r:.3f}', int(t),", "row = [int(y), int(k), f'{r:.3f}', int(t) + 1,")] },
  { id: 'G5', name: 'shift T -1 ms', edits: [once('jpl_authority.py', "row = [int(y), int(k), f'{r:.3f}', int(t),", "row = [int(y), int(k), f'{r:.3f}', int(t) - 1,")] },
  { id: 'G6', name: 'adjacent Jie target (+30 degrees)', edits: [once('jpl_authority.py', 'target = term * 15.0', 'target = ((term + 2) % 24) * 15.0')] },
  { id: 'G7', name: 'nearest-minute rounding of the boundary', edits: [once('groupb_generator.py', "if j['civilMs'] <= civil_ms:", "if round(j['civilMs'] / 60000) * 60000 <= civil_ms:")] },
  { id: 'G8', name: 'wrong Month Jian after crossing (off by one)', edits: [once('groupb_generator.py', "branch = BRANCHES[((lon - 315) // 30 + 2) % 12]", "branch = BRANCHES[((lon - 315) // 30 + 3) % 12]")] },
  { id: 'G9', name: 'one wrong Group B table cell (month-sha 辰 -> 戌)', edits: [once('groupb_generator.py', "    tables[rule_id] = rows\n", "    tables[rule_id] = rows\ntables['month-sha']['辰']['target'] = '戌'\n")] },
  {
    id: 'G10',
    name: 'production evaluator used as Golden oracle (Jie instants from the production engine)',
    edits: [once('groupb_generator.py', "jie.sort(key=lambda j: j['civilMs'])\n", "import subprocess\n_prod = json.loads(subprocess.check_output(['node', 'tasks/calendar-audit/astronomy-authority-v3.4A/mutation/production-jie-oracle.mjs']))  # shared/lunar/solarTerms\nfor j in jie:\n    j['civilMs'] = _prod[f\"{j['year']}:{j['longitude']}\"]\njie.sort(key=lambda j: j['civilMs'])\n")],
  },
  {
    id: 'G11',
    name: 'old Golden T reused instead of new T',
    edits: [once('groupb_generator.py', "jie.sort(key=lambda j: j['civilMs'])\n", "jie.sort(key=lambda j: j['civilMs'])\n_old = json.loads(Path('calendar-group-b-exact-jie-evidence.json').read_text())\nfor _t in _old['transitions']:\n    _j = next(j for j in jie if j['year'] == _t['year'] and j['longitude'] == _t['longitudeDegrees'])\n    _j['civilMs'] = int(datetime.fromisoformat(_t['instantUTC'].replace('Z', '+00:00')).timestamp() * 1000)\n")],
  },
  {
    id: 'G10b',
    name: 'G10 evading the static guard (no forbidden path text): dynamic detection only',
    edits: [once('groupb_generator.py', "jie.sort(key=lambda j: j['civilMs'])\n", "import subprocess\n_prod = json.loads(subprocess.check_output(['node', 'tasks/calendar-audit/astronomy-authority-v3.4A/mutation/production-jie-oracle.mjs']))\nfor j in jie:\n    j['civilMs'] = _prod[f\"{j['year']}:{j['longitude']}\"]\njie.sort(key=lambda j: j['civilMs'])\n")],
  },
  {
    id: 'G11b',
    name: 'G11 evading the static guard: dynamic detection only',
    edits: [once('groupb_generator.py', "jie.sort(key=lambda j: j['civilMs'])\n", "jie.sort(key=lambda j: j['civilMs'])\n_old = json.loads(Path('calendar-group-b-exact-' + 'jie-evidence.json').read_text())\nfor _t in _old['transitions']:\n    _j = next(j for j in jie if j['year'] == _t['year'] and j['longitude'] == _t['longitudeDegrees'])\n    _j['civilMs'] = int(datetime.fromisoformat(_t['instantUTC'].replace('Z', '+00:00')).timestamp() * 1000)\n")],
  },
  { id: 'G12', name: 'clock policy version mismatch (label)', edits: [once('clock_v1.py', "POLICY_ID = 'clock-v1'", "POLICY_ID = 'clock-v2'")] },
  { id: 'G12c', name: 'clock policy label mismatch with the generator self-check removed: reviewer detection only', edits: [once('clock_v1.py', "POLICY_ID = 'clock-v1'", "POLICY_ID = 'clock-v2'"), once('groupb_generator.py', "assert authority['clockPolicy'] == 'clock-v1'\n", '')] },
  { id: 'G12b', name: 'clock policy behaviour mismatch (TAI-UTC 36 s after 2017, still labelled clock-v1)', edits: [once('clock_v1.py', 'rows.append((start, TT_MINUS_TAI_MS + int(offset) * 1000))', 'rows.append((start, TT_MINUS_TAI_MS + min(int(offset), 36) * 1000))'), once('clock_v1.py', 'rows[-1][1] != TT_MINUS_TAI_MS + 37000', 'False')] },
]

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 1 << 28 })
  return { status: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') }
}
function pipeline(id, edits) {
  const dir = join(work, id)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  cpSync(`${A}/generator`, join(dir, 'generator'), { recursive: true })
  for (const e of edits) {
    const p = join(dir, 'generator', e.file)
    const text = readFileSync(p, 'utf8')
    const n = text.split(e.from).length - 1
    if (n !== 1) throw new Error(`${id}: target found ${n}x in ${e.file}`)
    writeFileSync(p, text.replace(e.from, e.to))
  }
  const gen = join(dir, 'generator')
  const py = { PYTHONPATH: `${SKY}:${gen}` }
  const g1 = run('python3', [`${gen}/jpl_authority.py`, KERNEL, LEAP, `${dir}/authority.json`], py)
  if (g1.status !== 0) return { stage: 'generator-authority', status: 'ABORTED', evidence: g1.out.slice(-400) }
  const g2 = run('python3', [`${gen}/groupb_generator.py`, `${dir}/authority.json`, 'calendar-rule-extraction-v3.json', `${dir}/group-b`])
  if (g2.status !== 0) return { stage: 'generator-groupb', status: 'ABORTED', evidence: g2.out.slice(-400) }
  const r1 = run('python3', [`${A}/review/review_authority.py`, KERNEL, `${dir}/authority.json`, `${dir}/review-authority.json`], { PYTHONPATH: SKY })
  let ra = null
  try { ra = JSON.parse(readFileSync(`${dir}/review-authority.json`, 'utf8')) } catch { /* reviewer aborted */ }
  const r2 = ra ? run('node', [`${A}/review/review_groupb.mjs`, `${dir}/group-b`, `${dir}/authority.json`, `${dir}/review-authority.json`, LEAP, `${dir}/review-groupb.json`], { GENERATOR_DIR: gen }) : null
  let rb = null
  try { rb = JSON.parse(readFileSync(`${dir}/review-groupb.json`, 'utf8')) } catch { /* reviewer aborted */ }
  return {
    stage: 'review',
    authorityReview: ra ? ra.verdict : `ABORTED ${r1.out.slice(-200)}`,
    groupBReview: rb ? rb.verdict : `ABORTED ${r2?.out.slice(-200)}`,
    authorityFindings: ra?.findings.slice(0, 3).map((f) => `${f.classification}: ${f.message}`) ?? [],
    groupBFindings: rb?.findings.slice(0, 3).map((f) => `${f.classification}: ${f.message}`) ?? [],
    groupBFindingCount: rb?.findings.length ?? null,
    authorityFindingCount: ra?.findings.length ?? null,
  }
}

const baseline = pipeline('baseline', [])
if (baseline.authorityReview !== 'PASS' || baseline.groupBReview !== 'PASS') throw new Error(`baseline not green ${JSON.stringify(baseline)}`)
console.log('baseline PASS')
const results = []
for (const m of mutants) {
  const r = pipeline(m.id, m.edits)
  const killedByReview = r.stage === 'review' && (r.authorityReview !== 'PASS' || r.groupBReview !== 'PASS')
  const status = killedByReview ? 'KILLED' : r.status === 'ABORTED' ? 'KILLED_BY_GENERATOR_ABORT' : 'SURVIVED'
  results.push({ id: m.id, name: m.name, edits: m.edits, ...r, pipelineStage: r.stage, status })
  console.log(m.id, status, r.authorityReview ?? r.stage, r.groupBReview ?? '', (r.authorityFindings?.[0] ?? r.groupBFindings?.[0] ?? r.evidence ?? '').slice(0, 140))
}
const summary = Object.fromEntries(['KILLED', 'KILLED_BY_GENERATOR_ABORT', 'SURVIVED'].map((s) => [s, results.filter((r) => r.status === s).length]))
writeFileSync(process.env.G_OUTPUT, JSON.stringify({ phase: '3B.4.4B (re-run of 3B.4.4A G-series, unmodified mutants)', method: 'mutated generator copy -> full generation -> unmodified independent reviewers', baseline, summary, mutants: results }, null, 2) + '\n')
console.log(summary)

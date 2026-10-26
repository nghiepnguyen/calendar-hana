"""Sequential puzhu:06 audit mutations (PRD FR-11). Restore bytes; never touch authority or Golden."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
P = 'p4Puzhu06.ts'
UNIT = ['shared/lunar/p4Puzhu06.test.ts']
SWEEP = UNIT + ['shared/lunar/p4Puzhu06Sweep.test.ts']
V5 = ['shared/lunar/p4Puzhu06V5.test.ts']  # Q4-REST Stage 3: shipped composer (authority v5) vs Golden v5
TRIG = 'const TRIGGERS = authority.triggers'
# (name, file, [(old, new), ...], tests)
mutations = [
 ('drop_youji_exception', P, [("case 'still_avoid':\n      return 'YOUJI'", "case 'still_avoid':\n      return 'QL'")], UNIT),
 ('drop_zhushi_exception', P, [("case 'avoid_all':\n      return 'ZHUSHI'", "case 'avoid_all':\n      return 'QL'")], UNIT),
 ('invert_q1_grade_not_congji', P, [("return rec.dePresent ? 'AD' : 'AN'", "return rec.dePresent ? 'AD' : 'QL'")], UNIT),
 ('invert_q2_with_de_ruchangli', P, [("return rec.dePresent ? 'AD' : 'AN'", "return rec.dePresent ? 'QL' : 'AN'")], UNIT),
 ('invert_q3_ungraded_ruchangli', P, [("if (rec.grade == null) return 'AU'", "if (rec.grade == null) return 'QL'")], UNIT),
 ('invert_q4_lift_lists', P, [("out.add(row.triggers.some((t) => !excluded.includes(t)) ? 'QL' : EXCLUDED_CLASS[s.name!]!)", "out.add('QL_EXCLUDED')")], UNIT),
 ('drop_q4a_exclusion', P, [('const excluded = EXCLUDED[s.name!] ?? []', 'const excluded: readonly string[] = []')], UNIT),
 ('drop_yueen_sixiang_shide', P, [(TRIG, TRIG + ".filter((g) => !['月恩', '四相', '時德'].includes(g))")], UNIT),
 ('add_sanhe_liuhe_triggers', P, [(TRIG, "const TRIGGERS = [...authority.triggers, '三合', '六合']")], UNIT),
 ('touch_protected_ji', P, [('    !row.protected &&\n', '')], UNIT),
 ('touch_out_of_list_heading', P, [('    IN_SCOPE.includes(row.heading) &&\n', '')], UNIT),
 ('youwei_ignores_parent', P, [("out.add(s.protected ? 'PROTECTED' : clauseClass(subjects.get(YOUWEI[s.name!]!)))", "out.add(s.protected ? 'PROTECTED' : 'QL')")], UNIT),
 ('defer_ignores_target', P, [('out.add(clauseClass(subjects.get(target)))', "out.add('QL')")], UNIT),
 ('hold_lifts', P, [("const action = actions.has('hold') ? 'hold'", "const action = actions.has('hold') ? 'lift'")], UNIT),
 ('xiangdi_state_dropped', P, [('const state = xiangdi\n', 'const state = false\n')], SWEEP),
 ('lift_after_propagation', P, [('  const headings = applyP4Propagation(pre)', '  const headings = { ...day.headings, ...Object.fromEntries(IN_SCOPE.filter((h) => puzhu06[h]!.action === \'lift\').map((h) => [h, pre[h]!])) }')], SWEEP),
 # Q4-REST Stage 3 (authority v5): the owner R-JK / R-WX / R-XH class and its scoped only_ji rule.
 ('narrow_class_as_excluded', P, [("out.add(row.triggers.some((t) => !excluded.includes(t)) ? 'QL' : EXCLUDED_CLASS[s.name!]!)", "out.add(row.triggers.some((t) => !excluded.includes(t)) ? 'QL' : 'QL_EXCLUDED')")], V5),
 ('narrow_lifts', P, [("const excluded = EXCLUDED[s.name!] ?? []", "const excluded = EXCLUDED_CLASS[s.name!] === 'QL_NARROW' ? [] : (EXCLUDED[s.name!] ?? [])")], V5),
 ('drop_scoped_only_ji', P, [('      p4Puzhu06NarrowOnlyJi(d.classes) &&', '      false &&')], V5),
]
paths = {root / 'shared/lunar' / f for _, f, _, _ in mutations}
originals = {p: p.read_bytes() for p in paths}
results = []
try:
 for name, file, edits, tests in mutations:
  target = root / 'shared/lunar' / file
  text = originals[target].decode()
  for old, new in edits:
   if text.count(old) != 1:
    raise RuntimeError(f'Mutation does not apply once: {name}: {old!r}')
   text = text.replace(old, new, 1)
  target.write_text(text)
  try:
   run = subprocess.run(['npx', 'vitest', 'run', *tests], cwd=root, capture_output=True, text=True, timeout=900)
   output = run.stdout + run.stderr
   results.append({'mutation': name, 'file': file, 'tests': tests, 'caughtByAssertion': run.returncode != 0 and 'AssertionError' in output, 'exitCode': run.returncode})
  finally:
   target.write_bytes(originals[target])
  print(json.dumps(results[-1], ensure_ascii=False), flush=True)
finally:
 for path, content in originals.items():
  path.write_bytes(content)
report = {
 'scope': 'P4B_PUZHU06_OWNER_ADOPTED (Q1-Q3 no, Q4 yes, Q4a block, R2 block, R-JK/R-WX/R-XH QL_NARROW + scoped only_ji; units on the v3 rollback, V5 on authority p4b-puzhu06-v5)',
 'mutations': results,
 'restored': all(p.read_bytes() == b for p, b in originals.items()),
 'targetHashes': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest() for p, b in sorted(originals.items())},
 'limits': 'Audit-only gate; mutations target the composer only, never the authority, Golden or P4-B/P4-C code.',
}
(root / 'docs/audits/p4b-puzhu06-mutation-results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
if not report['restored'] or not all(r['caughtByAssertion'] for r in results):
 raise SystemExit('puzhu:06 mutation gate failed')
print('OK', len(results), 'mutations caught')

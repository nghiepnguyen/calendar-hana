"""Sequential P5 warehouse audit mutations (PRD FR-13). Restore bytes; never touch authority or Golden."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
W = 'p4Warehouse.ts'
UNIT = ['shared/lunar/p4Warehouse.test.ts']
SWEEP = UNIT + ['shared/lunar/p4WarehouseSweep.test.ts']
R10 = 'const R10 = cp.R10.partners as Record<string, string[]>'
R11 = 'const R11 = cp.R11.partners as Record<string, string[]>'
# (name, file, [(old, new), ...], tests)
mutations = [
 ('any_partner_to_all', W, [('R10[b]!.some((g) => s[g]),\n      R11[b]!.some((g) => s[g]),', 'R10[b]!.every((g) => s[g]),\n      R11[b]!.every((g) => s[g]),')], UNIT),
 ('drop_sixiang', W, [(R10, R10.replace('cp.R10.partners as', "Object.fromEntries(Object.entries(cp.R10.partners).map(([b, v]) => [b, v.filter((g) => g !== '四相')])) as")),
                      (R11, R11.replace('cp.R11.partners as', "Object.fromEntries(Object.entries(cp.R11.partners).map(([b, v]) => [b, v.filter((g) => g !== '四相')])) as"))], UNIT),
 ('swap_yueen_yuede', W, [(R10, R10.replace('cp.R10.partners as', "Object.fromEntries(Object.entries(cp.R10.partners).map(([b, v]) => [b, v.map((g) => (g === '月恩' ? '月德' : g))])) as")),
                          (R11, R11.replace('cp.R11.partners as', "Object.fromEntries(Object.entries(cp.R11.partners).map(([b, v]) => [b, v.map((g) => (g === '月德' ? '月恩' : g))])) as"))], UNIT),
 ('d_union', W, [("r10 && r11 ? 'agreed'", "r10 || r11 ? 'agreed'")], UNIT),
 ('d_r10_only', W, [("r10 && r11 ? 'agreed' : !r10 && !r11", "r10 ? 'agreed' : !r10")], UNIT),
 ('d_r11_only', W, [("r10 && r11 ? 'agreed' : !r10 && !r11", "r11 ? 'agreed' : !r11")], UNIT),
 ('source_dependent_to_absent', W, [("!r10 && !r11 ? 'agreed_absent' : 'source_dependent'", "'agreed_absent'")], UNIT),
 ('drop_direct_path', W, [("if (DIRECT.some((g) => s[g])) return 'yi'", '')], UNIT),
 ('allow_impossible_pairs', W, [('if (p[a] === true && p[b] === true)', 'if (false)')], UNIT),
 ('mucang_out_of_coverage_absent', W, [("t.presence === 'unknown' ? undefined", "t.presence === 'unknown' ? false")], UNIT),
 ('kai_drop_jia_zhuanji', 'p4YiDayCore.ts', [(".filter((r) => r.heading && dayChars.includes(r.day))", ".filter((r) => r.heading && r.day !== '甲' && dayChars.includes(r.day))")], UNIT),
 ('kai_drop_require_all', 'p4DayComposition.ts', [('if (all ? fired.length !== from.length : !fired.length) continue', 'if (!fired.length) continue')], SWEEP),
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
 'scope': 'P5_WAREHOUSE_OWNER_ADOPTED_SOURCE_DEPENDENT',
 'mutations': results,
 'restored': all(p.read_bytes() == b for p, b in originals.items()),
 'targetHashes': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest() for p, b in sorted(originals.items())},
 'limits': 'Audit-only gate for decision D; puzhu:06 (SPEC_GAP) is outside P5 and has no mutation here.',
}
(root / 'docs/audits/p5-warehouse-mutation-results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
if not report['restored'] or not all(r['caughtByAssertion'] for r in results):
 raise SystemExit('P5 warehouse mutation gate failed')
print('OK', len(results), 'mutations caught')

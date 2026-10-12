"""Sequential P4-B audit mutations. Restore bytes; never touch source or Golden locks."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
mutations = [
 ('monthly_stem_as_all_stems', 'p4RemainingJi.ts', 'S.includes(v) ? v === pillar[0] : v === pillar[1]', 'S.includes(v) ? true : v === pillar[1]'),
 ('ignore_tianyuan_conflict', 'p4RemainingJi.ts', "const conflict =", "const conflict = false &&"),
 ('ignore_month_filters', 'p4RemainingJi.ts', "(c.months === '*' || c.months.includes(month))", "true"),
 ('ignore_exception_months', 'p4RemainingJi.ts', '!c.exceptMonths?.includes(month)', 'true'),
 ('virtues_always_present', 'p4RemainingJi.ts', 'c.withGods.some((g) => present.has(g))', 'true'),
 ('drop_all_taboo', 'p4RemainingJi.ts', "effect === 'all_taboo'", 'false'),
 ('drop_protected_scopes', 'p4FullDayComposition.ts', "states.includes('protected')", 'false'),
 ('unknown_heading_favourable', 'p4FullDayComposition.ts', 'unresolved.length > 0', 'false'),
 ('omit_remaining_ji', 'p4FullDayComposition.ts', "s === 'kept' || s === 'protected'", 'false'),
]
paths = {root / 'shared/lunar' / f for _, f, _, _ in mutations}
originals = {p: p.read_bytes() for p in paths}
results = []
try:
 for name, file, old, new in mutations:
  target = root / 'shared/lunar' / file
  original = originals[target].decode()
  if old not in original:
   raise RuntimeError(f'Mutation does not apply: {name}')
  target.write_text(original.replace(old, new, 1))
  try:
   run = subprocess.run(['npx', 'vitest', 'run', 'shared/lunar/p4RemainingJi.test.ts', 'shared/lunar/p4FullDayComposition.test.ts', '-t', 'P4-B'], cwd=root, capture_output=True, text=True, timeout=180)
   output = run.stdout + run.stderr
   results.append({'mutation': name, 'caughtByAssertion': run.returncode != 0 and 'AssertionError' in output, 'exitCode': run.returncode})
  finally:
   target.write_bytes(originals[target])
finally:
 for path, content in originals.items():
  path.write_bytes(content)
report = {'scope': 'P4_B_AUDIT_ONLY_PARTIAL', 'mutations': results, 'restored': all(p.read_bytes() == b for p,b in originals.items()), 'targetHashes': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest() for p,b in originals.items()}, 'limits': 'Partial oracle only; not a claim that all roadmap 4 mutations or source conflicts are resolved.'}
(root/'docs/audits/p4-vol10-remaining-ji-mutation-results.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
if not all(r['caughtByAssertion'] for r in results):
 raise SystemExit(1)

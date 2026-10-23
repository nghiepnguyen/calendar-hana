"""Sequential P4-B audit mutations. Restore bytes; never touch source or Golden locks."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
mutations = [
 ('soil_onset_excluded', 'p4SoilConvention.ts', 'date >= p.onset', 'date > p.onset'),
 ('soil_li_included', 'p4SoilConvention.ts', 'date <= p.eve', 'date <= p.li'),
 ('soil_outside_coverage_absent', 'p4SoilConvention.ts', "? 'unknown'", "? 'absent'"),
 ('drop_soil_ji', 'p4FullDayComposition.ts', 'lunarJi ||\n      soilJi ||', 'lunarJi ||\n      false ||'),
 ('drop_soil_protection', 'p4FullDayComposition.ts', "initial.protectedJi || soilJi ||", "initial.protectedJi || false ||"),
 ('soil_all_headings', 'p4FullDayComposition.ts', 'soilScope.headings.includes(h)', 'true'),
 ('missing_soil_absent', 'p4FullDayComposition.ts', "soil?.presence ?? 'unknown'", "soil?.presence ?? 'absent'"),
 ('raw_inventory_heading_alias', 'p4FullDayComposition.ts', 'canonP4Heading(splitHeadings(h)[0]!)', 'h'),
 ('drop_phase_ji', 'p4FullDayComposition.ts', 'phaseJi ||\n      deathDefeatJi ||', 'false ||\n      deathDefeatJi ||'),
 ('omit_quarters', 'p4LunarPhase.ts', 'events.set(date, {', "if (!e.phase.includes('Quarter')) events.set(date, {"),
 ('phase_outside_coverage_absent', 'p4LunarPhase.ts', 'date < start! || date > end!', 'false'),
 ('drop_death_defeat_ji', 'p4FullDayComposition.ts', 'deathDefeatJi ||\n      lunarJi ||', 'false ||\n      lunarJi ||'),
 ('drop_suibao_yi_suppression', 'p4FullDayComposition.ts', 'suppressedYiHeadings.has(h)', 'false'),
 ('restore_death_defeat_every_day', 'p4FullDayComposition.ts', 'const restoredSubjects = deathDefeat', 'const restoredSubjects = true'),
 ('drop_lunar_day_ji', 'p4FullDayComposition.ts', 'deathDefeatJi ||\n      lunarJi ||', 'deathDefeatJi ||\n      false ||'),
 ('drop_lunar_day_protection', 'p4FullDayComposition.ts', 'phaseJi || lunarJi || initial.protectedJi', 'phaseJi || false || initial.protectedJi'),
 ('missing_lunar_day_absent', 'p4FullDayComposition.ts', "lunarDay === undefined ? 'unknown'", "lunarDay === undefined ? 'absent'"),
 ('monthly_stem_as_all_stems', 'p4RemainingJi.ts', 'S.includes(v) ? v === pillar[0] : v === pillar[1]', 'S.includes(v) ? true : v === pillar[1]'),
 ('drop_puzhu28_day_rule', 'p4FullDayComposition.ts', 'if (dayRule) {', 'if (false) {'),
 ('defer_reads_unknown_yi', 'p4RemainingJi.ts', 'P4_DAY_HEADINGS.map((h) => [h, true])', 'P4_DAY_HEADINGS.map((h) => [h, false])'),
 ('officer_offset_shifted', 'p4RemainingJi.ts', '=== rule.officerOffset', '=== (rule.officerOffset + 1) % 12'),
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
   run = subprocess.run(['npx', 'vitest', 'run', 'shared/lunar/p4RemainingJi.test.ts', 'shared/lunar/p4FullDayComposition.test.ts', 'shared/lunar/p4LunarDayComposition.test.ts', 'shared/lunar/p4PuzhuEnd.test.ts', 'shared/lunar/p4LunarPhase.test.ts', 'shared/lunar/p4SoilConvention.test.ts', '-t', 'P4-B'], cwd=root, capture_output=True, text=True, timeout=180)
   output = run.stdout + run.stderr
   results.append({'mutation': name, 'caughtByAssertion': run.returncode != 0 and 'AssertionError' in output, 'exitCode': run.returncode})
  finally:
   target.write_bytes(originals[target])
finally:
 for path, content in originals.items():
  path.write_bytes(content)
report = {'scope': 'P4_B_OWNER_ADOPTED_SOURCE_DEPENDENT', 'mutations': results, 'restored': all(p.read_bytes() == b for p,b in originals.items()), 'targetHashes': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest() for p,b in sorted(originals.items())}, 'limits': 'Audit-only operand and composition gate under named owner convention; canonical soil witness and roadmap 5/full Golden/scoring remain open.'}
(root/'docs/audits/p4-vol10-remaining-ji-mutation-results.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
if not all(r['caughtByAssertion'] for r in results):
 raise SystemExit(1)

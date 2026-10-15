"""Sequential P4-C 宜 operand/composition mutations (task 6.5-6.7).

Each mutation edits one audit-only source, runs the P4-C suites, then restores bytes in finally.
Run alone: no other test/build/editor may use shared/lunar while this runs.
Outcome per mutation: ASSERTION_CAUGHT (>=1 AssertionError, every suite loaded), NOT_CAUGHT,
TOOLING_ERROR (suite failed to load / no reporter output) or TIMEOUT. Only the first passes.
"""
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
L = 'shared/lunar/'
TESTS = [L + 'p4Yi']  # every P4-C suite, sweep byte check included
TIMEOUT = 900
mutations = [
    # Predicate layer: table/offset/cycle/input of each predicate family.
    ('monthly_lookup_offset_shifted', 'p4YiPredicates.ts',
     "return targets[month] === supplied(context.dayBranch, 'DAY_BRANCH')",
     "return targets[BRANCHES[(BRANCHES.indexOf(month) + 1) % 12]!] === supplied(context.dayBranch, 'DAY_BRANCH')"),
    ('pillar_range_upper_exclusive', 'p4YiPredicates.ts', 'index <= last!', 'index < last!'),
    ('pillar_range_cycle_shifted', 'p4YiPredicates.ts',
     'const index = PILLARS.indexOf(pillar)', 'const index = (PILLARS.indexOf(pillar) + 1) % 60'),
    ('branch_set_drops_member', 'p4YiPredicates.ts',
     'return rule.branches.includes(', 'return rule.branches.slice(0, 1).includes('),
    ('pillar_set_reads_branch_only', 'p4YiPredicates.ts',
     "return rule.pillars.includes(supplied(context.dayPillar, 'DAY_PILLAR'))",
     "return rule.pillars.some((p) => p[1] === supplied(context.dayPillar, 'DAY_PILLAR')[1])"),
    ('soil_override_ignored', 'p4YiPredicates.ts',
     "context.soilState === 'present' ? rule.soilDayBranches!",
     "false ? rule.soilDayBranches!"),
    ('soil_override_unions_season', 'p4YiPredicates.ts',
     "context.soilState === 'present' ? rule.soilDayBranches!",
     "context.soilState === 'present' ? [...rule.soilDayBranches!, ...rule.ordinaryDayBranches[season]]"),
    # 母倉 soil boundary: Li day counted inside the next period.
    ('soil_li_day_included', 'p4YiSoil.ts',
     '.find((candidate) => candidate.li > date)', '.find((candidate) => candidate.li >= date)'),
    # Provider: unknown/missing/coverage handling and operand inventory.
    ('unknown_becomes_absent', 'p4YiOperands.ts', "= reason\n    ? 'unknown'", "= reason\n    ? 'absent'"),
    ('outside_provider_coverage_ignored', 'p4YiOperands.ts',
     "keys.some((key) => providerStates[key] === 'outside')", 'false'),
    ('drop_p4c_operand_mucang', 'p4YiOperands.ts',
     'authority.entries.map((entry) =>', 'authority.entries.slice(1).map((entry) =>'),
    ('drop_legacy_yi_operands', 'p4YiDayComposition.ts',
     'const combined = [...legacy, ...yiOperands]', 'const combined = [...yiOperands]'),
    # ANY / heading routing / P5 deferral.
    ('any_requires_all_present', 'p4YiEvidence.ts',
     "yi: trace.some((operand) => operand.presence === 'present')",
     "yi: trace.length > 0 && trace.every((operand) => operand.presence === 'present')"),
    ('any_unknown_becomes_false', 'p4YiEvidence.ts',
     ': unresolved.length\n        ? undefined\n        : false', ': false'),
    ('heading_scope_ignored', 'p4YiEvidence.ts',
     'scope.mode === mode && normalizeP4YiHeading(scope.normalized) === key', 'scope.mode === mode'),
    # Keep the P5 label stripping (else the tokenizer crashes); only the deferral branch goes.
    ('warehouse_resolved_by_any', 'p4YiEvidence.ts', '  if (warehouse)\n    return {', '  if (false)\n    return {'),
    # Protection / suppression / 止忌 reveal / puzhu:28 override / raw 忌.
    ('baiji_protection_dropped', 'p4YiDayCore.ts',
     "baiji.has(h) ||\n      kept.some((x) => x.effect === 'only_avoid')",
     "false ||\n      kept.some((x) => x.effect === 'only_avoid')"),
    ('yi_suppression_dropped', 'p4YiDayCore.ts',
     'const yiNoted = suppress ? false : yiH', 'const yiNoted = yiH'),
    ('stop_ji_reveal_dropped', 'p4YiDayCore.ts',
     "yiH === false && !s.uncoveredByDeferral?.includes(h)", 'false'),
    ('full_day_protection_dropped', 'p4YiFullDayCore.ts',
     "phaseJi || lunarJi || initial.protectedJi || soilJi || states.includes('protected')", 'false'),
    ('puzhu28_override_dropped', 'p4YiFullDayCore.ts', 'if (dayRule) {', 'if (false) {'),
    ('raw_ji_view_lost', 'p4YiFullDayCore.ts',
     'rawJiHeadings: dayRule ? rawDays : days', 'rawJiHeadings: days'),
    ('death_defeat_suppression_dropped', 'p4YiFullDayCore.ts',
     'const initial = suppressedYi ? { ...original, yi: false } : original', 'const initial = original'),
]

targets = sorted({root / L / f for _, f, _, _ in mutations})
originals = {p: p.read_bytes() for p in targets}
for name, file, old, _ in mutations:
    count = originals[root / L / file].decode().count(old)
    if count != 1:
        raise SystemExit(f'Mutation {name} matches {count} times in {file}')
# CI: --shard=i/n runs every n-th mutation and only prints its report; the tracked report is
# written by full local runs.
shard = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--shard=')), None)
if shard:
    index, total = map(int, shard.split('/'))
    if not 1 <= index <= total:
        raise SystemExit(f'Invalid shard {shard}')
    mutations = mutations[index - 1::total]


def run_suites():
    with tempfile.TemporaryDirectory() as temp:
        out = Path(temp) / 'vitest.json'
        try:
            run = subprocess.run(
                ['npx', 'vitest', 'run', *TESTS, '--reporter=json', f'--outputFile={out}'],
                cwd=root, capture_output=True, text=True, timeout=TIMEOUT,
            )
        except subprocess.TimeoutExpired:
            return {'outcome': 'TIMEOUT'}
        if not out.exists():
            return {'outcome': 'TOOLING_ERROR', 'exitCode': run.returncode,
                    'stderrTail': run.stderr[-2000:]}
        data = json.loads(out.read_text())
    suites = data['testResults']
    load_errors = [s['name'] for s in suites if s['status'] == 'failed' and not s['assertionResults']]
    failed = [(s['name'], a) for s in suites for a in s['assertionResults'] if a['status'] == 'failed']
    assertion = [(n, a) for n, a in failed if 'AssertionError' in ''.join(a['failureMessages'])]
    outcome = ('TOOLING_ERROR' if load_errors else
               'ASSERTION_CAUGHT' if assertion else
               'NOT_CAUGHT' if run.returncode == 0 or not failed else 'TOOLING_ERROR')
    files = sorted({Path(n).name for n, _ in assertion})
    return {
        'outcome': outcome, 'exitCode': run.returncode,
        'passed': data['numPassedTests'], 'failed': data['numFailedTests'],
        'assertionFailures': len(assertion), 'otherFailures': len(failed) - len(assertion),
        'loadErrors': load_errors, 'caughtByFiles': files,
        'firstFailures': [a['fullName'] for _, a in assertion[:5]],
    }


control = run_suites()
if control['outcome'] != 'NOT_CAUGHT' or control['failed']:
    raise SystemExit(f'Unmutated control run is not clean: {control}')
results = []
try:
    for name, file, old, new in mutations:
        target = root / L / file
        try:
            target.write_text(originals[target].decode().replace(old, new, 1))
            results.append({'mutation': name, 'file': L + file, **run_suites()})
            print(name, results[-1]['outcome'], flush=True)
        finally:
            target.write_bytes(originals[target])
finally:
    for path, content in originals.items():
        path.write_bytes(content)

report = {
    'scope': 'P4_C_TASK_6_AUDIT_ONLY_MUTATION_GATE',
    'tests': TESTS,
    'shard': shard,
    'control': {k: control[k] for k in ('outcome', 'passed', 'failed')},
    'mutations': results,
    'allAssertionCaught': all(r['outcome'] == 'ASSERTION_CAUGHT' for r in results),
    'restored': all(p.read_bytes() == b for p, b in originals.items()),
    'restoredSha256': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest()
                       for p, b in originals.items()},
    'limits': 'Audit-only P4-C path; production pipeline, Golden and locks are never mutated. '
              'Heading spelling normalization is covered by 5.1 helper tests, not mutated here.',
}
if shard:
    print(json.dumps(report, indent=2, ensure_ascii=False))
else:
    (root / 'docs/audits/p4-vol10-yi-mutation-results.json').write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({k: report[k] for k in ('allAssertionCaught', 'restored')}))
if not (report['allAssertionCaught'] and report['restored']):
    sys.exit(1)

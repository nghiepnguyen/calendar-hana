"""Sequential mutations against the roadmap 9 migration invariants (PRD FR-10, owner §6.10).

Each mutation edits runtime files (adapter, scorer, almanac, events) in place, runs ONE named test of
shared/lunar/p4MigrationDiff.test.ts with `-t`, and restores the bytes. A clean control run comes first.
Never touches a Golden, baseline, lock or rules file. The migration-files and rules-lock tests fail on
any edit, so they are never the target: a mutation counts as caught only when its target test fails
AND the output carries the expected invariant message, i.e. the fault really reached a checked row.

    python3 scripts/audit-p4-migration-mutations.py   # sampled dates (npm test set), ~1 min each
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
REPORT = root / 'docs/audits/p4-migration-diff-mutation-results.json'
HARNESS = 'shared/lunar/p4MigrationDiff.test.ts'
ADAPTER = 'shared/lunar/p4ScoreAdapter.ts'
REC = 'shared/lunar/activityRecommendations.ts'
ALMANAC = 'shared/lunar/almanac.ts'
EVENT = 'shared/lunar/eventEvaluation.ts'
FULL = 'UNEXPECTED_REGRESSION'
OUTSIDE = 'outside the P4 domain'
SWAP = 'chain-swap changes only'
JIE = 'exact-Jie fixture'
# (name, invariant, target test, expected message, [(file, old, new), ...])
mutations = [
    ('baseline_activity_scores_dormant', '1', FULL, 'baseline activity changed',
     [(REC, '!(balancing && !p4On && P4_DORMANT_GODS.has(god.id))', 'true')]),
    ('hard_warning_dropped_on', '2', FULL, 'hard warning changed',
     [(REC, '            row.hardWarning = true', '            row.hardWarning = !balancing')]),
    ('domain_guard_removed', '3', OUTSIDE, 'outside',
     [(ADAPTER, ' && date >= P4_DOMAIN[0] && date <= P4_DOMAIN[1]', '')]),
    ('lift_untagged', '4, 12', FULL, 'changed without a reason',
     [(ADAPTER, '        version: P4_SCORE_ADAPTER_VERSION,', "        version: 'untagged',")]),
    ('no_evidence_reads_recommended', '5, 11', FULL, 'good result without an applied positive',
     [(REC, "          ? 'no_evidence'", "          ? (balancing ? 'recommended' : 'no_evidence')")]),
    ('penalty_twice', '6', FULL, 'penalty more than once',
     [(ADAPTER, '  for (const [source, cap] of [',
       '  out.push(...out.filter((r) => r.policyId === P4_PENALTY_POLICY_ID).map((r) => ({ ...r })))\n'
       '  for (const [source, cap] of [')]),
    ('penalty_on_only_yi', '6', FULL, 'penalty without only_ji',
     [(ADAPTER, "if (state === 'only_ji' && !out.some(",
       "if ((state === 'only_ji' || state === 'only_yi') && !out.some(")]),
    ('only_ji_lifts_ji', '7', FULL, 'lifted under only_ji',
     [(ADAPTER, "? state === 'only_yi' || state === 'neither_recorded'", "? state !== 'both_present'")]),
    ('dormant_on_absent_days', '8', FULL, 'not present in Golden v2',
     [(ALMANAC, '      if (alias) replaceNames.add(alias)\n      if (!present[god.id]) continue',
       '      if (alias) replaceNames.add(alias)\n      if (present[god.id]) continue')]),
    ('order_only_yi_first', '9', FULL, '≠ Golden',
     [(ADAPTER, "const ORDER = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']",
       "const ORDER = ['only_yi', 'both_present', 'neither_recorded', 'only_ji']")]),
    ('event_changed_by_star_only', '10', FULL, 'event changed without a changed profile activity',
     [(EVENT, "const classification: Classification = mustHave.some((item) => item.status === 'fail')",
       "const classification: Classification = day.stars.good.some((s) => s.name === 'Thiên Thương') ||\n"
       "    mustHave.some((item) => item.status === 'fail')")]),
    ('score_off_replay', '12', FULL, 'score ≠ replay',
     [(REC, 'const score = clamp(generalScore + personalModifier)',
       'const score = clamp(generalScore + personalModifier + (balancing ? 1 : 0))')]),
    ('both_present_lifts', 'chain-swap', SWAP, 'AssertionError',
     [(ADAPTER, ": state === 'only_ji' || state === 'neither_recorded'",
       ": state === 'only_ji' || state === 'neither_recorded' || state === 'both_present'")]),
    ('dormant_on_lunar_month', 'FR-07', JIE, 'dormant',
     [(ALMANAC, 'const present = getXiejiGodPresence(solarTermMonthChi(jd), day.can, day.chi)',
       'const present = getXiejiGodPresence((lunar.month + 1) % 12, day.can, day.chi)')]),
]


def run_test(pattern=None):
    args = ['npx', 'vitest', 'run', HARNESS] + (['-t', pattern] if pattern else [])
    return subprocess.run(args, cwd=root, capture_output=True, text=True, timeout=1800)


files = sorted({f for *_, edits in mutations for f, _, _ in edits})
original = {f: (root / f).read_bytes() for f in files}
restore = lambda: [(root / f).write_bytes(b) for f, b in original.items()]  # noqa: E731
results = []
try:
    control = run_test()
    if control.returncode != 0:
        raise RuntimeError('control run failed:\n' + control.stdout[-2000:])
    for name, invariant, target, expect, edits in mutations:
        text = {f: original[f].decode() for f in files}
        for f, old, new in edits:
            if text[f].count(old) != 1:
                raise RuntimeError(f'mutation does not apply once: {name}: {old!r}')
            text[f] = text[f].replace(old, new)
        for f, _, _ in edits:
            (root / f).write_text(text[f])
        try:
            r = run_test(target)
        finally:
            restore()
        out = r.stdout + r.stderr
        caught = r.returncode != 0 and 'Tests  1 failed' in out and target in out and expect in out
        results.append({'mutation': name, 'invariant': invariant, 'test': target, 'expect': expect,
                        'caughtByTest': caught, 'exitCode': r.returncode})
        print(json.dumps(results[-1], ensure_ascii=False), flush=True)
finally:
    restore()
report = {
    'version': 'p4-migration-diff-mutations-v1',
    'control': 'clean',
    'dates': 'sampled (npm test set: every 10th P4 date, 108 exact-Jie dates, 3 outside dates)',
    'mutations': len(results),
    'caught': sum(r['caughtByTest'] for r in results),
    'restored': all((root / f).read_bytes() == b for f, b in original.items()),
    'results': results,
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
if not report['restored'] or report['caught'] != len(results):
    raise SystemExit(f"FAIL: {report['caught']}/{len(results)} caught, restored={report['restored']}")
print(f"OK {report['caught']} mutations caught")

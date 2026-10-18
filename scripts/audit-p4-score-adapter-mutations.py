"""Sequential mutations of the roadmap 8 score adapter (PRD FR-07).

Each mutation edits runtime files in place, runs the tests it targets (score Golden v1, almanac wiring,
flag-OFF baseline v1), and restores the bytes. A clean control run comes first. Never touches a Golden,
baseline or authority file. A mutation counts as caught only when a roadmap 8 test itself fails
("roadmap 8" in the output), so an import or syntax error reads as not caught.

    python3 scripts/audit-p4-score-adapter-mutations.py
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
REPORT = root / 'docs/audits/p4-score-adapter-mutation-results.json'
ADAPTER = 'shared/lunar/p4ScoreAdapter.ts'
REC = 'shared/lunar/activityRecommendations.ts'
ALMANAC = 'shared/lunar/almanac.ts'
HEADINGS = 'shared/lunar/p4AlmanacHeadings.ts'
EVENT = 'shared/lunar/eventEvaluation.ts'
MANIFEST = 'shared/almanac-data/manifest.json'
GOLDEN = 'shared/lunar/p4ScoreAdapter.test.ts'
WIRING = 'shared/lunar/p4ScoreAdapterAlmanac.test.ts'
BASELINE = 'shared/lunar/p4AdapterBaseline.test.ts'
UI = 'src/views/DayView/p4CappedTaboo.test.tsx'
DAILY = 'src/views/DayView/DailyActivitySection.tsx'
# (name, PRD rule, tests, [(file, old, new), ...])
mutations = [
    ('only_yi_keeps_ji', 'FR-02 從宜不從忌', [GOLDEN],
     [(ADAPTER, "? state === 'only_yi' || state === 'neither_recorded'", "? state === 'neither_recorded'")]),
    ('only_ji_keeps_yi', 'FR-02 從忌不從宜', [GOLDEN],
     [(ADAPTER, ": state === 'only_ji' || state === 'neither_recorded'", ": state === 'neither_recorded'")]),
    ('both_present_as_neither', 'FR-02 亦從宜亦從忌 ≠ 不註', [GOLDEN],
     [(ADAPTER, "? state === 'only_yi' || state === 'neither_recorded'",
       "? state === 'only_yi' || state === 'neither_recorded' || state === 'both_present'"),
      (ADAPTER, ": state === 'only_ji' || state === 'neither_recorded'",
       ": state === 'only_ji' || state === 'neither_recorded' || state === 'both_present'")]),
    ('protected_lifted', '§6.9 忌 protected', [GOLDEN],
     [(ADAPTER, "prot.has(BAD_HAN.get(row.ruleId)!)", 'false')]),
    ('preserve_bad_lifted', '§6.4 preserve_bad', [GOLDEN],
     [(ADAPTER, '(row.hardWarning || (row.source', '(false || (row.source')]),
    ('order_both_neither_swapped', '§6.5 strictest order', [GOLDEN],
     [(ADAPTER, "const ORDER = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']",
       "const ORDER = ['only_ji', 'neither_recorded', 'both_present', 'only_yi']")]),
    ('not_recorded_heading_ignored', '§6.6 / 9b P2: not_recorded beside only_yi keeps the baseline', [GOLDEN],
     [(ADAPTER, 'if (known.length < states.length && !known.some((s) => JI_STATES.includes(s!)))',
       'if (false)')]),
    ('penalty_dropped', 'FR-02 −25', [GOLDEN],
     [(ADAPTER, "    JI_STATES.includes(state) &&\n    !out.some(", "    false &&\n    !out.some(")]),
    ('penalty_magnitude', 'FR-02 −25', [GOLDEN],
     [(ADAPTER, 'P4_DEFAULT_PENALTY = -25', 'P4_DEFAULT_PENALTY = -24')]),
    ('penalty_blocked_by_subsumed', '§6.13', [GOLDEN],
     [(ADAPTER, "r.status === 'applied' && (r.preCapDelta ?? 0) < 0", 'r.rawDelta < 0')]),
    ('penalty_per_heading', 'FR-07 penalty dedup (one −25 per activity)', [GOLDEN],
     [(ADAPTER, "  if (\n    JI_STATES.includes(state) &&\n    !out.some((r) => r.status === 'applied' && (r.preCapDelta ?? 0) < 0)\n  )\n",
       "  for (const _h of (HEADINGS[opts.activityId] ?? []).filter((h) => JI_STATES.includes(headings[h]?.state ?? '')))\n"
       "  if (!out.some((r) => r.evidenceOrigin !== 'product_policy' && r.status === 'applied' && (r.preCapDelta ?? 0) < 0))\n")]),
    ('dormant_god_dropped', 'spec §7.1 drop one dormant god', [WIRING],
     [(ADAPTER, "  'thien_nguyen',\n", '')]),
    ('cap_before_resolution', 'FR-04', [GOLDEN],
     [(REC, '          } else if (!p4On) {', '          } else {'),
      (ADAPTER, "preCapDelta: row.status === 'applied' ? row.rawDelta : 0,",
       "preCapDelta: row.status === 'applied' ? row.scoreDelta : 0,")]),
    ('six_chains_kept_on', '§6.2 P4 replaces the chains', [GOLDEN],
     [(REC, '      else if (vol10Enabled)', '      if (vol10Enabled)')]),
    ('dormant_on_baseline_activity', '§6.10', [GOLDEN],
     [(REC, '!(balancing && !p4On && P4_DORMANT_GODS.has(god.id))', 'true')]),
    ('alias_star_kept', '§6.1 stars', [WIRING],
     [(ALMANAC, 'if (alias) replaceNames.add(alias)', 'if (alias) void alias')]),
    ('domain_guard_removed', 'goal 4 (owner 2026-10-18)', [WIRING],
     [(ADAPTER, ' && date >= P4_DOMAIN[0] && date <= P4_DOMAIN[1]', '')]),
    ('resolver_error_thrown', 'goal 5', [WIRING],
     [(HEADINGS, '  } catch {\n    return {}\n  }', '  } catch (error) {\n    throw error\n  }')]),
    ('all_taboo_not_passed', '§6.11 諸事皆忌', [WIRING],
     [(HEADINGS, "...(row.rule === 'all_taboo' ? { rule: 'all_taboo' } : {}),", '')]),
    ('event_reads_raw_negative', 'FR-05', [WIRING],
     [(EVENT, 'primary.hardWarning || primary.negativeMagnitude > 0',
       'primary.hardWarning || primary.contributions.some((row) => row.rawDelta < 0)')]),
    # Roadmap 9b (tasks/prd-p4-9b.md §5.4).
    ('floor_magnitude', '9b P1 (i) floor 25', [GOLDEN],
     [(ADAPTER, 'P4_ALL_TABOO_FLOOR = 25', 'P4_ALL_TABOO_FLOOR = 24')]),
    ('floor_on_plain_only_ji', '9b P1 (i) only on 諸事皆忌 (owner 1 (a), 4.1)', [GOLDEN],
     [(ADAPTER, 'if (p4.allTaboo) {', "if (p4.allTaboo || state === 'only_ji') {")]),
    ('both_present_penalty_dropped', '9b P1 (ii) both_present', [GOLDEN],
     [(ADAPTER, "    JI_STATES.includes(state) &&\n    !out.some(", "    state === 'only_ji' &&\n    !out.some(")]),
    ('p2_dropped', '9b P2 not_recorded yields to 忌', [GOLDEN],
     [(ADAPTER, 'if (known.length < states.length && !known.some((s) => JI_STATES.includes(s!)))',
       'if (known.length < states.length)')]),
    ('undetermined_as_not_recorded', '9b P2 undetermined keeps the baseline', [GOLDEN],
     [(ADAPTER, "(s !== 'not_recorded' && !ORDER.includes(s))",
       "(s !== 'not_recorded' && s !== 'undetermined' && !ORDER.includes(s))"),
      (ADAPTER, "const known = states.filter((s) => s !== 'not_recorded')",
       "const known = states.filter((s) => s !== 'not_recorded' && s !== 'undetermined')")]),
    ('all_taboo_missed_beside_not_recorded', '9b P1 (i) + P2', [GOLDEN],
     [(ADAPTER, "hs.some((h) => headings[h]!.rule === 'all_taboo')", "hs.every((h) => headings[h]!.rule === 'all_taboo')")]),
    ('ui_event_capped_hidden', '9b P3 event view', [UI],
     [(DAILY, '(row.appliedDelta !== 0 || isP4CappedTaboo(row))', 'row.appliedDelta !== 0')]),
    ('ui_activity_capped_unmarked', '9b P3 activity detail', [UI],
     [(REC, 'isP4CappedTaboo(row) ? `${row.label} (${P4_CAPPED_TABOO_NOTE})` : row.label', 'row.label')]),
    ('flag_default_on', 'goal 2 flag OFF', [BASELINE],
     [(MANIFEST, '"xiejiVol10BalancingEnabled": false', '"xiejiVol10BalancingEnabled": true')]),
]


def run_test(tests):
    return subprocess.run(['npx', 'vitest', 'run', *tests], cwd=root, capture_output=True, text=True,
                          timeout=1800)


files = sorted({f for *_, edits in mutations for f, _, _ in edits})
original = {f: (root / f).read_bytes() for f in files}
restore = lambda: [(root / f).write_bytes(b) for f, b in original.items()]  # noqa: E731
results = []
try:
    control = run_test([GOLDEN, WIRING, BASELINE, UI])
    if control.returncode != 0:
        raise RuntimeError('control run failed:\n' + control.stdout[-2000:])
    for name, rule, tests, edits in mutations:
        text = {f: original[f].decode() for f in files}
        for f, old, new in edits:
            if text[f].count(old) != 1:
                raise RuntimeError(f'mutation does not apply once: {name}: {old!r}')
            text[f] = text[f].replace(old, new)
        for f, _, _ in edits:
            (root / f).write_text(text[f])
        try:
            r = run_test(tests)
        finally:
            restore()
        out = r.stdout + r.stderr
        caught = r.returncode != 0 and ' failed' in out
        results.append({'mutation': name, 'rule': rule, 'tests': tests, 'caughtByTest': caught,
                        'exitCode': r.returncode})
        print(json.dumps(results[-1], ensure_ascii=False), flush=True)
finally:
    restore()
report = {
    'version': 'p4-score-adapter-mutations-v2',
    'control': 'clean',
    'mutations': len(results),
    'caught': sum(r['caughtByTest'] for r in results),
    'restored': all((root / f).read_bytes() == b for f, b in original.items()),
    'results': results,
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
if not report['restored'] or report['caught'] != len(results):
    raise SystemExit(f"FAIL: {report['caught']}/{len(results)} caught, restored={report['restored']}")
print(f"OK {report['caught']} mutations caught")

"""Sequential mutations against the 卷十 劫煞 faithful authority (Option C projection, G2 Stage 2 authority v2).

Each mutation edits ONE runtime or authority file in place, runs ONE named test with `-t`, and restores the
bytes. A clean control run comes first. Never touches a Golden, baseline or lock file (the manifest policy is mutated once). A mutation counts as
caught only when its target test fails AND the output carries the expected message.

    python3 scripts/audit-vol10-jiesha-mutations.py
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
# v1 report (jiesha-option-c-migration-v1/mutation-results.json) is frozen; G2 Stage 2 writes its successor.
REPORT = root / 'docs/audits/sources/p4-vol10/g2-stage2/mutation-results.json'
AUTH_TEST = 'shared/lunar/xiejiVol10JieshaAuthority.test.ts'
GOLDEN_TEST = 'shared/lunar/xiejiVol10ScoringV3.test.ts'
G2_TEST = 'shared/lunar/p4G2Stage2Migration.test.ts'
RES = 'shared/lunar/xiejiVol10Resolution.ts'
AUTH = 'shared/lunar/xiejiVol10JieshaAuthority.ts'
DATA = 'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json'
VOL10 = 'shared/almanac-data/xiejibianfangshu-vol10-yiji.json'
CAT = 'shared/lunar/catHungAuthority.ts'
SCAN = 'every real Month Jian'
NEVER = 'never applies in 子午卯酉'
COVER = 'coverage states match'
EQUAL = 'is the approved candidate'
LOUD = 'fails loudly'
DEFAULT = 'shipped policy is faithful-v1'
MANIFEST = 'shared/almanac-data/manifest.json'
FIX = 'carries the corrections'
# (name, target file, target test, expected message, [(file, old, new), ...])
mutations = [
    ('revert_default_to_cancel_both', AUTH_TEST, DEFAULT, 'faithful-v1',
     [(MANIFEST, '"xiejiVol10JieshaPolicy": "faithful-v1"', '"xiejiVol10JieshaPolicy": "legacy-cancel-both"')]),
    ('resolver_default_legacy', AUTH_TEST, DEFAULT, 'AssertionError',
     [(RES, "options.jieshaPolicy ?? 'faithful-v1'", "options.jieshaPolicy ?? 'legacy-cancel-both'")]),
    ('branch_never_flagged', AUTH_TEST, SCAN, 'AssertionError',
     [(RES, '? { ...r, jieshaAuthority: true }', '? r')]),
    ('demolition_applied_without_revision', AUTH_TEST, SCAN, 'AssertionError',
     [(AUTH, "    return { status: coverage.status, reason: coverage.reason! }",
       "    return { status: 'APPLIED', cell: 'avoid' }")]),
    ('demolition_silent_fallback', AUTH_TEST, SCAN, 'authorityExclusion',
     [(AUTH, "    return { status: coverage.status, reason: coverage.reason! }",
       "    return { status: 'APPLIED', cell: 'blank' }")]),
    # G2 Stage 2: with the alias a NORM 劵→券 fold gives the same matching, so the guard is the no-fold check.
    ('jian_quan_normalized', G2_TEST, 'alias:', 'AssertionError',
     [(RES, "  壞: '壊',", "  壞: '壊',\n  劵: '券',")]),
    ('g2_alias_removed', AUTH_TEST, COVER, 'AssertionError',
     [(VOL10, ',\n    "立劵交易": ["立券交易"]', '')]),
    ('g2_authority_v1_restored', AUTH_TEST, COVER, 'contract is UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION but was reached',
     [(AUTH, "xieji-vol10-jiesha-authority-v2.json'", "xieji-vol10-jiesha-authority-v1.json'")]),
    ('unreachable_reached_silently', G2_TEST, 'authority v2 applies', 'AssertionError',
     [(AUTH, "    throw new Error(`${authority.version}: ${activityId} is ${coverage.status} but was reached`)",
       "    return { status: 'APPLIED', cell: 'blank' }")]),
    ('applied_cell_changed', AUTH_TEST, EQUAL, 'AssertionError',
     [(DATA, ('辰乙巳', 'wedding', 'avoid', 'blank'), None), (DATA, ('辰乙巳', 'travel', 'blank', 'avoid'), None)]),
    ('p17a_cell_removed', AUTH_TEST, FIX, 'AssertionError',
     [(DATA, ('未壬申', 'engagement', 'avoid', 'blank'), None), (DATA, ('未壬申', 'travel', 'blank', 'avoid'), None)]),
    ('exclusion_reason_removed', AUTH_TEST, None, 'invalid xieji-vol10-jiesha-faithful-v2',
     [(DATA, '"debt": "G1",', '')]),
    # Each guard alone is redundant on current data (other gods' otherwise-cancel_both clauses all sit
    # outside 辰戌丑未; 劫煞's 子午卯酉 cancel_both is on the with-德 path), so removing one is an
    # equivalent mutant. Removing both lets 災煞 寅申巳亥 / 月刑 巳 / 月煞 卯酉 reach the authority.
    ('other_god_outside_scope', AUTH_TEST, SCAN, 'no context',
     [(RES, "    entry.id === 'jie_sha' &&\n    '辰戌丑未'.includes(month) &&\n", '')]),
    ('applied_with_de', AUTH_TEST, NEVER, 'no context',
     [(RES, '  if (ok) return apply(clause.effect, clause)',
       "  if (ok && entry.id !== 'jie_sha') return apply(clause.effect, clause)")]),
    ('chou_bingyin_de_scope', AUTH_TEST, SCAN, 'AssertionError',
     [(CAT, "monthJian: '丑', jie: '小寒', tianDe: '庚', tianDeHe: '乙', yueDe: '庚'",
       "monthJian: '丑', jie: '小寒', tianDe: '庚', tianDeHe: '乙', yueDe: '丙'")]),
    ('generic_cancel_both_changed', GOLDEN_TEST, 'jie-chen-demolition-excluded', 'AssertionError',
     [(RES, "                ? 'no_annotation'\n                : 'not_avoided'",
       "                ? 'not_avoided'\n                : 'not_avoided'")]),
]

# Data mutations flip one cell, given as (context, activity, from, to): an APPLIED avoid cell
# (辰乙巳 wedding) and the P17-A cell (未壬申 engagement).
def run_test(target, pattern=None):
    args = ['npx', 'vitest', 'run', target] + (['-t', pattern] if pattern else [])
    return subprocess.run(args, cwd=root, capture_output=True, text=True, timeout=1800, stdin=subprocess.DEVNULL)


files = sorted({f for *_, edits in mutations for f, _, _ in edits})
original = {f: (root / f).read_bytes() for f in files}
restore = lambda: [(root / f).write_bytes(b) for f, b in original.items()]  # noqa: E731
results = []
try:
    for target in (AUTH_TEST, GOLDEN_TEST, G2_TEST):
        control = run_test(target)
        if control.returncode != 0:
            raise RuntimeError('control run failed:\n' + control.stdout[-2000:])
    for name, target_file, target, expect, edits in mutations:
        text = {f: original[f].decode() for f in files}
        for f, old, new in edits:
            if isinstance(old, tuple):
                ctx, act, frm, to = old
                start = text[f].index(f'"{ctx}": {{')
                i = text[f].index(f'"{act}": "{frm}"', start)
                text[f] = text[f][:i] + f'"{act}": "{to}"' + text[f][i + len(f'"{act}": "{frm}"'):]
                continue
            if text[f].count(old) != 1:
                raise RuntimeError(f'mutation does not apply once: {name}: {old!r}')
            text[f] = text[f].replace(old, new)
        for f, _, _ in edits:
            (root / f).write_text(text[f])
        try:
            r = run_test(target_file, target or None)
        finally:
            restore()
        out = r.stdout + r.stderr
        # target None: the fault fails at import (authority validation), before any named test runs.
        caught = r.returncode != 0 and 'failed' in out and (target is None or target in out) and expect in out
        results.append({'mutation': name, 'test': target, 'expect': expect, 'caughtByTest': caught,
                        'exitCode': r.returncode})
        print(json.dumps(results[-1], ensure_ascii=False), flush=True)
finally:
    restore()
report = {
    'version': 'vol10-jiesha-mutations-v2',
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

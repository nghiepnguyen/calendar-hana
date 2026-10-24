"""G1-b Stage 2: score Golden v3 for the P4 adapter under p4ScoreHeadingLookup = canonical-v1.

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v3/golden.py [--write]

Successor to p4-score-golden-v2 (kept, sha-locked; rollback evidence for source-key-v1), per the frozen
spec docs/audits/p4-g1b-score-lookup.md §4.3: the v2 reference adapter run unchanged, with only the
heading lookup key folded. The v2 golden.py is loaded as is (its sha is asserted) and fed, per activity,
a heading view keyed by the 卷十一 source spelling whose rows come from the canonical P4 key, so
deciding_heading and policy_rows keep 破屋壞垣 like runtime. The fold is the single G1-a alias
(docs/audits/p4-g1a-demolition-authority.md), written here and not read from the TS resolver.
Default verifies the committed outputs byte-for-byte; --write regenerates them.
"""
import hashlib
import importlib.util
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v3')
V2_GOLDEN = Path('docs/audits/sources/p4-vol10/p4-score-golden-v2/golden.py')
V2_SHA = 'ccfcd3a7f93582c9cd5a6cccdb9e1cfce89cd4e4bd4157bfcc072929c1cd1a2a'  # p4-score-golden-lock-v2
# G1-a SAME_ACTIVITY_ALIAS_CONFIRMED: source spelling → canonical P4 key. Nothing else is folded (no G2 劵→券).
ALIAS = {'破屋壞垣': '破屋壊垣'}

assert hashlib.sha256(V2_GOLDEN.read_bytes()).hexdigest() == V2_SHA, 'Golden v2 generator changed'
_spec = importlib.util.spec_from_file_location('p4_score_golden_v2', V2_GOLDEN)
v2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v2)
assert v2.POLICY_9B is True


def key(h):
    return ALIAS.get(h, h)


def view(activity, headings):
    """canonical-v1: the activity's source headings, each reading its canonical P4 row."""
    return {h: headings[key(h)] for h in v2.HEADINGS.get(activity) or [] if key(h) in headings}


def check_alias(days):
    """Drift guard: the alias is the only fold, and every folded heading is a P4 heading."""
    p4 = {h for hs in days.values() for h in hs}
    src = {h for hs in v2.HEADINGS.values() for h in hs}
    assert set(ALIAS) <= src and not set(ALIAS) & p4 and set(ALIAS.values()) <= p4, 'alias'
    assert {key(h) for h in src} <= p4, sorted({key(h) for h in src} - p4)


def build_states(days):
    """Layer B: activity state for every P4 date × heading activity (+ 3 outside dates)."""
    lines = ['date\tactivity\tstate\tdeciding_heading\tall_taboo']
    for date in sorted(days) + v2.OUTSIDE:
        hs = days.get(date, {})
        for a in v2.ACTIVITIES:
            if not v2.HEADINGS.get(a):
                continue
            vw = view(a, hs)
            state, heading = v2.activity_state(a, vw)
            taboo = state == 'only_ji' and any(vw.get(h, {}).get('rule') == 'all_taboo' for h in v2.HEADINGS[a])
            lines.append('\t'.join([date, a, state, heading or '', 'true' if taboo else 'false']))
    return '\n'.join(lines) + '\n'


def build_scores(days):
    """Layer C: exact score/status for every P4 date × activity. Baseline rows equal flag-OFF baseline v1."""
    base = {(r['date'], r['activity']): r for r in v2.tsv(v2.BASELINE)}
    gv2 = {r['date']: r for r in v2.tsv(v2.PRESENCE_V2)}
    lines = ['date\tactivity\tstate\tscore\tstatus\thard_warning\tpolicy_rows']
    for p in v2.tsv(v2.PRESENCE_INPUT):
        date = p['date']
        g = gv2[date]
        _, officer = v2.day(g['month_jian'], g['pillar'])
        assert officer == p['officer'], date
        present = set(p['good'].split()) | set(p['bad'].split()) | set(g['dormant'].split())
        for a in v2.ACTIVITIES:
            vw = view(a, days.get(date, {}))
            state, _ = v2.activity_state(a, vw)
            if state == 'baseline':
                b = base[(date, a)]
                lines.append('\t'.join([date, a, 'baseline', b['score'], b['status'], b['hard_warning'], '']))
                continue
            r = v2.score({'id': f'{date}:{a}', 'activityId': a, 'officerId': officer,
                          'goodGods': sorted(present & v2.GOOD_IDS), 'badGods': sorted(present & v2.BAD_IDS),
                          'headings': vw})
            pol = ' '.join(f"{x['sourceClauseId']}={x['scoreDelta']}" for x in r['rows']
                           if x['evidenceOrigin'] == 'product_policy')
            lines.append('\t'.join([date, a, state, str(r['score']), r['status'],
                                    'true' if r['hardWarning'] else 'false', pol]))
    return '\n'.join(lines) + '\n'


def outputs():
    days = v2.day_headings()
    check_alias(days)
    return {'activity-states.tsv': build_states(days), 'activity-scores.tsv': build_scores(days)}


def main():
    out = outputs()
    write = '--write' in sys.argv
    bad = []
    for name, text in out.items():
        p = DIR / name
        if write:
            p.write_text(text, encoding='utf-8')
        elif not p.exists() or p.read_text(encoding='utf-8') != text:
            bad.append(name)
    for name, text in out.items():
        print(name, hashlib.sha256(text.encode()).hexdigest())
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()

"""Full Golden P4, task 7.0: rule checks for owner decisions E1, E3 and single-pass propagation.

Added after the freeze (b70913f) because the derive mutations M08/M14/M15 were caught only by the frozen
bytes. Read-only: it checks the frozen outputs against the rules and writes no expected data, so the lock
is unchanged.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1-review/owner_checks.py
"""
import csv
import json
import sys
from pathlib import Path

G = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1')
def read(p):
    with p.open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def facts(text, sep):
    return [f.split('|') for f in text.split(sep) if f]


def check(rows, ctx_facts, key_of, extra_of, domain):
    by_day = {}
    for r in rows:
        by_day.setdefault(key_of(r), {})[r['heading']] = r
    n = {'E1': 0, 'E3': 0, 'singlePass': 0, 'singlePassBlocked': 0}
    for r in rows:
        fs = ctx_facts[(r['month_jian'] + '-' + r['pillar'], r['heading'])] + extra_of(r)
        if 'context:date-operand-dependent' in r['reasons']:
            continue
        # E1: 「則不忌亦不註宜」 — a 復日/重日 不註 fact never leaves 宜 noted.
        if any(f[1] == 'remaining' and f[3] == 'no_annotation' for f in fs) and 'puzhu:28' not in r['reasons']:
            assert r['yi_noted'] != 'true' and r['state'] not in ('only_yi', 'both_present'), (domain, 'E1', r)
            n['E1'] += 1
        if r['propagated']:
            # E3: a lift that leaves a 相抵 subject on the heading reads neither_recorded.
            if any(f[1] == 'subject' and f[3] == 'neither_recorded' for f in fs):
                assert r['state'] == 'neither_recorded', (domain, 'E3', r)
                n['E3'] += 1
            # Single pass: every firing heading was 相抵 before propagation, never itself lifted in the pass.
            for src in r['propagated'].split('+'):
                s = by_day[key_of(r)][src]
                # Context: a source merged as undetermined still counts when every variant read 相抵.
                fired = s['state'] == 'neither_recorded' or s['code'].endswith('states=neither_recorded')
                assert fired and not s['propagated'], (domain, 'single pass', r, s)
            n['singlePass'] += 1
        if r['blocked']:
            # Single pass also for blocked lines: the firing headings were 相抵 before propagation.
            for src in r['blocked'].split('+'):
                s = by_day[key_of(r)][src]
                fired = s['state'] == 'neither_recorded' or s['code'].endswith('states=neither_recorded')
                assert fired and not s['propagated'], (domain, 'single pass (blocked)', r, s)
            n['singlePassBlocked'] += 1
    return n


def main():
    ctx_facts = {(r['id'], r['heading']): facts(r['facts'], ' ') for r in read(G / 'ji/context-ji.tsv')}
    dated_facts = {(r['date'], r['heading']): facts(r['facts'], ';') for r in read(G / 'ji/dated-ji.tsv')}
    out = {
        'dated': check(read(G / 'compose/dated.tsv'), ctx_facts, lambda r: r['date'],
                       lambda r: dated_facts[(r['date'], r['heading'])], 'dated'),
        'context': check(read(G / 'compose/context.tsv'), ctx_facts, lambda r: r['id'], lambda r: [], 'context'),
    }
    assert out['dated']['E3'] == 57 and out['context']['E3'] == 33, out
    print(json.dumps(out, ensure_ascii=False))


if __name__ == '__main__':
    sys.exit(main())

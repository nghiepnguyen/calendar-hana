"""Full Golden P4, task 7.0: rule checks for owner decisions E1, E3 and single-pass propagation.

Added after the freeze (b70913f) because the derive mutations M08/M14/M15 were caught only by the frozen
bytes. Read-only: it checks the frozen outputs against the rules and writes no expected data, so the lock
is unchanged.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v2-review/owner_checks.py
"""
import csv
import json
import sys
from pathlib import Path

G = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2')
def read(p):
    with p.open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def facts(text, sep):
    return [f.split('|') for f in text.split(sep) if f]


DE_HE = ('天德', '月德', '天德合', '月德合')


def de_as_jian_contexts():
    ops = read(G / 'ji/operands.tsv')
    return {r['id'] for r in ops if r['de_as_jian'] or {'yang_no_de_he', 'yin_no_de_he'} & set(r['pillar_rules'].split())}


def check(rows, ctx_facts, key_of, extra_of, domain):
    by_day = {}
    for r in rows:
        by_day.setdefault(key_of(r), {})[r['heading']] = r
    n = {'E1': 0, 'E3': 0, 'singlePass': 0, 'singlePassBlocked': 0, 'deAsJianRows': 0}
    for r in rows:
        fs = ctx_facts[(r['month_jian'] + '-' + r['pillar'], r['heading'])] + extra_of(r)
        if r['month_jian'] + '-' + r['pillar'] in DEJ:
            # Owner (i): on 德作建論 days no 德合 god is 宜 evidence (nor a puzhu:06 trigger / rule-D partner).
            yi = next((p for p in r['code'].split(';') if p.startswith(('yi:', 'yi_unknown:'))), '')
            assert not any(g in yi.split(':', 1)[-1].split('+') for g in DE_HE), (domain, 'DE_AS_JIAN_ALL', r)
            n['deAsJianRows'] += 1
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


DEJ = set()
P5_CONTEXT = Path('docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/context.tsv')
P5_DATED = Path('docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/dated.tsv')
DIRECT = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '三合', '滿日']
R10 = {'收日': ['月恩', '四相', '時德'], '母倉': ['月恩', '四相', '開日'], '六合': ['月恩', '四相', '時德'],
       '五富': ['月恩', '四相', '時德'], '天倉': ['月恩', '四相', '開日']}
R11 = ['月德', '四相', '時德', '開日']


def rule_d(row, drop):
    """修倉庫 rule D (owner D, p5-warehouse-v1), independent copy; drop = owner (i) on 德作建論 days."""
    on = lambda g: row[g] == 'present' and not (drop and g in DE_HE)
    if any(on(g) for g in DIRECT):
        return 'true'
    v = [(any(on(p) for p in R10[b]), any(on(p) for p in R11)) for b in R10 if on(b)]
    if any(a and b for a, b in v):
        return 'true'
    return 'unknown' if any(a != b for a, b in v) else 'false'


def check_rule_d():
    """Owner (i) for 修倉庫: rule D without 德合 gods on 德作建論 days, else the frozen P5 verdict."""
    n = 0
    dated = {r['date']: r for r in read(G / 'compose/dated.tsv') if r['heading'] == '修倉庫'}
    for r in read(P5_DATED):
        drop = f"{r['month_jian']}-{r['pillar']}" in DEJ
        assert dated[r['date']]['yi_evidence'] == rule_d(r, drop), ('rule D (i)', r['date'])
        n += drop
    ctx = {r['id']: r for r in read(G / 'compose/context.tsv') if r['heading'] == '修倉庫'}
    for cid in DEJ:
        rows = [r for r in read(P5_CONTEXT) if f"{r['month_jian']}-{r['pillar']}" == cid]
        vals = {rule_d(r, True) for r in rows}
        g = ctx[cid]
        if 'context:date-operand-dependent' not in g['reasons']:
            assert vals == {g['yi_evidence']}, ('rule D (i) context', cid, vals, g['yi_evidence'])
    # 「德合與赦願所會之辰」 days (puzhu:28) never fall on a 德作建論 day, so (i) never meets puzhu:28.
    p28 = {r['id'] for r in read(G / 'ji/context-ji.tsv') if r['puzhu28'] == 'true'}
    assert not p28 & DEJ, p28 & DEJ
    return n


def main():
    DEJ.update(de_as_jian_contexts())
    ctx_facts = {(r['id'], r['heading']): facts(r['facts'], ' ') for r in read(G / 'ji/context-ji.tsv')}
    dated_facts = {(r['date'], r['heading']): facts(r['facts'], ';') for r in read(G / 'ji/dated-ji.tsv')}
    out = {
        'dated': check(read(G / 'compose/dated.tsv'), ctx_facts, lambda r: r['date'],
                       lambda r: dated_facts[(r['date'], r['heading'])], 'dated'),
        'context': check(read(G / 'compose/context.tsv'), ctx_facts, lambda r: r['id'], lambda r: [], 'context'),
    }
    assert out['dated']['E3'] == 57 and out['context']['E3'] == 33, out
    out['ruleDDeAsJianDates'] = check_rule_d()
    print(json.dumps(out, ensure_ascii=False))


if __name__ == '__main__':
    sys.exit(main())

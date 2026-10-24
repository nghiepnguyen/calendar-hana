"""G2 Stage 1: independent bound on the P4-domain days a 卷十 立劵交易 → 立券交易 match can touch.

    python3 -I docs/audits/sources/p4-vol10/g2-stage1/bound.py

Reads only frozen inputs (no TS output): 卷十 entry data (which entries list 立劵交易 and how presence is
keyed), Score Golden v3 layer B (contract / transaction P4 state per date), the frozen engine presence
input of Score Golden v2 (catalog gods + officer per date) and Full Golden v2 dormant presence. A day is a
candidate when contract is on baseline (vol10 path) and at least one listing entry is present. The runtime
changed set (candidate-impact.tsv) must be a subset. It does not recompute verdicts or scores.
"""
import csv
import hashlib
import json
from pathlib import Path

P4 = Path('docs/audits/sources/p4-vol10')
INPUTS = {
    'vol10': Path('shared/almanac-data/xiejibianfangshu-vol10-yiji.json'),
    'states': P4 / 'p4-score-golden-v3/activity-states.tsv',
    'presence': P4 / 'p4-score-golden-v2/presence-input.tsv',
    'dormant': P4 / 'p4-full-golden-v2/presence/dated.tsv',
    'runtime': P4 / 'g2-stage1/candidate-impact.tsv',
}
# 卷十 presence keys → catalog ids (god) or officer ids, as in xiejibianfangshu-vol10-yiji.json; tables by name.
TABLE_GOD = {'yue_yan': 'nguyet_yem', 'yue_xing': 'nguyet_hinh', 'yue_sha': 'nguyet_sat', 'zai_sha': 'tai_sat'}


def tsv(p):
    return list(csv.DictReader(p.open(encoding='utf-8'), delimiter='\t'))


vol10 = json.loads(INPUTS['vol10'].read_text(encoding='utf-8'))
listing = {e['id'] for e in vol10['entries'] if '立劵交易' in e.get('avoid', '')}
entries = [e for e in vol10['entries'] if e['id'] in listing or e.get('avoidSameAs') in listing]
keys = []
for e in entries:
    p = e['presence']
    keys.append((e['id'], 'officer', p['officer']) if 'officer' in p
                else (e['id'], 'god', p.get('god') or TABLE_GOD[p['table']]))
state = {(r['date'], r['activity']): r['state'] for r in tsv(INPUTS['states'])}
dormant = {r['date']: set(r['dormant'].split()) | set(r['legacy'].split()) for r in tsv(INPUTS['dormant'])}
cand = {}
for r in tsv(INPUTS['presence']):
    d = r['date']
    if state[(d, 'contract')] != 'baseline':
        continue
    gods = set(r['good'].split()) | set(r['bad'].split()) | dormant[d]
    hit = [eid for eid, kind, k in keys if (r['officer'] == k if kind == 'officer' else k in gods)]
    if hit:
        cand[d] = hit
runtime = {r['date'] for r in tsv(INPUTS['runtime']) if r['set'] == 'domain' and r['activity'] == 'contract'}
out = {
    'listingEntries': sorted(listing),
    'entriesReadingTheList': [k for k in keys],
    'baselineContractDays': sum(1 for (d, a), s in state.items() if a == 'contract' and s == 'baseline' and d < '2028'),
    'candidateDays': len(cand),
    'runtimeChangedDays': len(runtime),
    'runtimeSubsetOfCandidates': runtime <= set(cand),
    'candidatesNotChanged': len(set(cand) - runtime),
    'inputs': {k: hashlib.sha256(p.read_bytes()).hexdigest() for k, p in INPUTS.items()},
}
print(json.dumps(out, ensure_ascii=False, indent=1))
assert out['runtimeSubsetOfCandidates'], sorted(runtime - set(cand))

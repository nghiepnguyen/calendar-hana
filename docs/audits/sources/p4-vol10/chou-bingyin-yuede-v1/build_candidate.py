"""Option C candidate authority (audit only, not wired to runtime).

Run: python3 -I docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/build_candidate.py
Cells: the faithful 卷十 劫煞 verdicts under P17-A (puzhu17-bujiang-v1/full.json), which the 未-戊申 owner
ruling and the 丑-丙寅 D-A resolution leave unchanged.
"""
import collections
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P4 = HERE.parent
rel = lambda p: str(p.relative_to(ROOT))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
FULL = P4 / 'puzhu17-bujiang-v1' / 'full.json'
full = json.loads(FULL.read_text(encoding='utf-8'))

cells, status = {}, collections.Counter()
for ctx, x in sorted(full.items()):
    month, pillar = ctx.split('-')
    row = {}
    for a, s in sorted(x['P17-A'].items()):
        if len(s) != 1:
            raise SystemExit(f'non-deterministic cell {ctx}:{a}')
        st, v = s[0].split(':')
        status[st] += 1
        row[a] = v
    cells[month + pillar] = row
assert status == {'CONFIRMED': 384}, status
activities = sorted({a for r in cells.values() for a in r})
assert len(cells) == 16 and len(activities) == 24 and all(len(r) == 24 for r in cells.values())

inputs = [FULL, P4 / 'puzhu17-bujiang-v1' / 'lock.json', P4 / 'jiesha-faithful-vol10-v1' / 'lock.json',
          P4 / 'weishen-nacai-puzhu21-v1' / 'lock.json', P4 / 'option-c-final-gate-v1' / 'owner-ruling.json',
          P4 / 'option-c-final-gate-v1' / 'lock.json', HERE / 'yuede-check.json']
candidate = {
    'schema': 'vol10-jiesha-faithful-candidate',
    'version': 'candidate-final-v1',
    'status': 'AUDIT_ONLY_NOT_WIRED',
    'scope': {
        'entry': 'jie_sha', 'effect': 'cancel_both', 'monthJian': '辰戌丑未',
        'condition': 'no 天德 / 月德 / 天德合 / 月德合 (calculated presence, 歴例 tables)',
        'key': '${monthJian}${pillar}', 'values': {'avoid': '劫煞 忌 survives', 'blank': 'keep no_annotation'},
    },
    'contexts': sorted(cells), 'activities': activities,
    'counts': {'contexts': len(cells), 'cells': sum(map(len, cells.values())),
               'avoid': sum(v == 'avoid' for r in cells.values() for v in r.values()),
               'blank': sum(v == 'blank' for r in cells.values() for v in r.values())},
    'cells': cells,
    'provenance': {
        'H1-B': 'docs/audits/p4-h1b-yuebiao-witness.md: 劫煞 headings printed that cancel_both leaves unnoted',
        '相抵': 'docs/audits/p4-xiangdi-cancel-both-audit.md: 「凡所忌者則不註宜所宜者亦不註忌」 = OVERLAP, 39/39 clusters',
        'OVERLAP': 'docs/audits/p4-jiesha-overlap-impact.md: heading with 宜 unnoted, without 宜 keeps 劫煞 忌; 42/42 clusters',
        '鳴吠對→啟攢': '鳴吠對 宜 啟攢 only; 「凡吉凶相抵有宜啟攢不註忌安葬」 withholds 安葬 (67/67 立成 pages)',
        '鋪註05': '求醫療病 in 劫煞 止忌 list: still avoided (docs/audits/p4-jiesha-faithful-vol10.md)',
        'puzhu:17': 'P17-A: no propagation from 嫁娶 when 不將 is its only 宜 (docs/audits/p4-puzhu17-bujiang.md; 7/7 cells)',
        '未-戊申 納財': 'OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS (local); 納財 cell NOT SOURCE_WITNESSED; n117 prints 納財 忌 (docs/audits/p4-weishen-nacai-puzhu21.md, docs/audits/p4-option-c-final-gate.md)',
        '丑-丙寅 月德': 'D-A: 歴例 月德 十二月 庚; 66/67 pages follow the 歴例 德 tables; n75 月德 on 丙寅 = WITNESS_PRINTING_ERROR, kept in provenance (docs/audits/p4-chou-bingyin-yuede.md)',
        'evidenceLimit': 'in-sample: every 劫煞 context has been read; no out-of-sample witness exists',
    },
    'generator': {'path': rel(pathlib.Path(__file__).resolve()), 'sha256': sha(pathlib.Path(__file__).resolve())},
    'inputs': {rel(p): sha(p) for p in inputs},
}
(HERE / 'candidate-final.json').write_text(json.dumps(candidate, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(candidate['counts'])

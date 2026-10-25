"""G2 Stage 2: 卷十 劫煞 authority v2 from the frozen v1 projection.

    python3 -I docs/audits/sources/p4-vol10/g2-stage2/build_authority_v2.py [--write]

v2 = v1 with exactly one change, approved in docs/audits/p4-g2-vol10-heading-match.md §11 (a): contract and
transaction move from UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION to APPLIED, reading their existing v1
cells (未-戊申 stays blank, owner ruling 2026-10-25, semantics I1). Every cell, count and other coverage
entry is copied. --write writes shared/almanac-data/xieji-vol10-jiesha-authority-v2.json and
authority-v1-v2.json; then run `npx prettier --write` on the authority file. Default verifies both.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

V1 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json')
V2 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json')
DIFF = Path('docs/audits/sources/p4-vol10/g2-stage2/authority-v1-v2.json')
V1_SHA = '13ba27ee6ba5ebc0611b771982bd3da2f6540b5abee6d310584bc2a3c12259e3'  # g2-stage1 lock.json
G2 = ['contract', 'transaction']

raw = V1.read_bytes()
assert hashlib.sha256(raw).hexdigest() == V1_SHA, 'authority v1 changed'
v1 = json.loads(raw)
for a in G2:
    assert v1['runtimeCoverage']['activities'][a]['status'] == 'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION'

v2 = copy.deepcopy(v1)
v2['version'] = 'xieji-vol10-jiesha-faithful-v2'
v2['runtimeCoverage']['projection'] = (
    'faithful-v2: v1 with contract and transaction APPLIED once 卷十 立劵交易 reaches 立券交易 through the '
    'G2 headingAliases entry (docs/audits/p4-g2-stage2-migration.md); demolition stays excluded (G1 debt)')
for a in G2:
    v2['runtimeCoverage']['activities'][a] = {'status': 'APPLIED'}
v2['provenance']['supersedes'] = {'path': str(V1), 'sha256': V1_SHA, 'version': v1['version']}
v2['provenance']['g2'] = {
    'spec': 'docs/audits/p4-g2-vol10-heading-match.md §11 (a), §13',
    'alias': 'xiejibianfangshu-vol10-yiji.json headingAliases 立劵交易 → [立券交易]',
    'weishen': '未戊申 contract/transaction blank (owner 2026-10-25, I1); n117 audit open: docs/audits/p4-weishen-lijuan-authority-item.md',
}
v2['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g2-stage2/build_authority_v2.py'

# Nothing but the version, the projection note, provenance and the two coverage entries may differ.
assert v2['cells'] == v1['cells'] and v2['counts'] == v1['counts'] and v2['activities'] == v1['activities']
changed = {a for a in v1['runtimeCoverage']['activities']
           if v1['runtimeCoverage']['activities'][a] != v2['runtimeCoverage']['activities'][a]}
assert changed == set(G2), changed
cells = {a: {ctx: row[a] for ctx, row in v1['cells'].items()} for a in G2}
diff = {
    'version': 'g2-stage2-authority-diff-v1',
    'from': {'path': str(V1), 'version': v1['version'], 'sha256': V1_SHA},
    'to': {'path': str(V2), 'version': v2['version']},
    'coverageChanged': {a: [v1['runtimeCoverage']['activities'][a]['status'], 'APPLIED'] for a in G2},
    'cellsChanged': 0,
    'countsChanged': False,
    'otherCoverageChanged': 0,
    'cellsNowApplied': {a: {'avoid': sorted(k for k, v in c.items() if v == 'avoid'),
                            'blank': sorted(k for k, v in c.items() if v == 'blank')} for a, c in cells.items()},
    'appliedCells': {'v1': 352, 'v2': 384, 'note': 'demolition has no audit cells and stays EXCLUDED_PENDING_GLYPH_AUDIT'},
    'weishen': {a: cells[a]['未戊申'] for a in G2},
}


def main():
    text = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        V2.write_text(json.dumps(v2, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        DIFF.write_text(text, encoding='utf-8')
        return
    assert json.loads(V2.read_text(encoding='utf-8')) == v2, 'authority v2 differs from v1 + G2'
    assert DIFF.read_text(encoding='utf-8') == text, 'authority-v1-v2.json differs'
    print('authority v2 = v1 + contract/transaction APPLIED;', hashlib.sha256(V2.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()

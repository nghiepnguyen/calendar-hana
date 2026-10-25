"""G2 Stage 2: 卷十 scoring Golden v3 from the frozen v2 (golden-xieji-vol10-scoring-v2.json, sha-asserted).

    python3 -I docs/audits/sources/p4-vol10/g2-stage2/build_scoring_golden_v3.py [--write]

v2 stays byte-frozen as the pre-G2 rollback evidence (xiejiVol10ScoringV2.test.ts runs it on the rollback
graph). v3 = v2 with its one G2 case replaced and one added. Both cases are hand-derived from authority v2
cells (= v1 cells, approved candidate b24f6f68), never from production output:
  jie-chen-contract-applied   辰乙巳 contract cell blank → 劫煞 no_annotation → kiep_sat informational (I1)
  jie-wei-renshen-contract-avoid  未壬申 contract cell avoid → 劫煞 avoid → kiep_sat −15 kept
--write writes the file (then `npx prettier --write` it); default verifies it.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

V2 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v2.json')
V3 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v3.json')
V2_SHA = '77d8400479bec725a203a67331cd773c06a51d0d11aa576076d62a23e0bbfafd'

raw = V2.read_bytes()
assert hashlib.sha256(raw).hexdigest() == V2_SHA, 'scoring Golden v2 changed'
v2 = json.loads(raw)
v3 = copy.deepcopy(v2)
v3['version'] = 'xieji-vol10-scoring-golden-v3'
v3['status'] = ('FROZEN 2026-10-25 before the G2 Stage 2 switch (立劵交易 alias + 劫煞 authority v2); '
                'hand-derived from the approved authority cells, never regenerate from production')
v3['supersedes'] = 'golden-xieji-vol10-scoring-v2.json (xieji-vol10-scoring-golden-v2, pre-G2 rollback evidence)'
v3['provenance']['runtimeMigration'] = (
    'authority v2 (shared/almanac-data/xieji-vol10-jiesha-authority-v2.json runtimeCoverage): v1 + contract / '
    'transaction APPLIED')
v3['provenance']['contractTransaction'] = (
    'APPLIED (G2 Stage 2): 卷十 headingAliases 立劵交易 → [立券交易]; cells unchanged from v1')
v3['provenance']['normalization'] = 'unchanged (NORM has no 劵; one headingAliases entry)'
v3['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g2-stage2/build_scoring_golden_v3.py'

kiep = [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'delta': -15}]
applied = {
    'id': 'jie-chen-contract-applied', 'month': '辰', 'pillar': '乙巳', 'officer': 'tru', 'gods': ['kiep_sat'],
    'activity': 'contract', 'rows': kiep,
    'expect': {'verdicts': {'jie_sha': 'no_annotation'},
               'rows': [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'scoreDelta': 0, 'status': 'informational'}],
               'added': []},
    'derivation': 'G2 Stage 2 (authority v2): 辰乙巳 contract cell = blank; 立劵交易 now reaches 立券交易, so '
                  'cancel_both leaves it unannotated (I1) and the product penalty is informational',
}
avoid = {
    'id': 'jie-wei-renshen-contract-avoid', 'month': '未', 'pillar': '壬申', 'officer': 'tru', 'gods': ['kiep_sat'],
    'activity': 'contract', 'rows': kiep,
    'expect': {'verdicts': {'jie_sha': 'avoid'},
               'rows': [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'scoreDelta': -15, 'status': 'applied'}],
               'added': []},
    'derivation': 'G2 Stage 2 (authority v2): 未壬申 contract cell = avoid (立券交易 without 宜 keeps 劫煞 忌)',
}
ids = [c['id'] for c in v3['cases']]
i = ids.index('jie-chen-contract-unreachable')
v3['cases'][i:i + 1] = [applied, avoid]
assert [c for c in v3['cases'] if c['id'] not in (applied['id'], avoid['id'])] == \
    [c for c in v2['cases'] if c['id'] != 'jie-chen-contract-unreachable']


def main():
    if '--write' in sys.argv:
        V3.write_text(json.dumps(v3, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        return
    assert json.loads(V3.read_text(encoding='utf-8')) == v3, 'scoring Golden v3 differs from v2 + G2 cases'
    print('scoring Golden v3 = v2 − 1 + 2 cases;', len(v3['cases']), 'cases;',
          hashlib.sha256(V3.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()

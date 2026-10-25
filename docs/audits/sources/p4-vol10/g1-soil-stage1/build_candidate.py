"""G1-SOIL Stage 1 (audit only): candidate authorities for the 5 excluded demolition contexts, and the proposed
v4 Production Access Matrix. Nothing here is production data.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_candidate.py [--write]

  candidate-authority-avoid5.json  v3 with the 5 contexts APPLIED, cell avoid (the in-window cell)
  candidate-authority-blank5.json  v3 with the 5 contexts APPLIED, cell blank (the out-of-window cell; = R1)
  authority-candidate.json         the 5 contexts: in/out cells, mechanism, grades
  production-access-matrix.json    proposed v4 matrix (APPLIED_DATE_DEPENDENT + selector), audit only

R2 (date-aware) is not a third file: per day it is avoid5 inside 土王用事 and v3 (= blank5 in output) outside,
composed by compare.py, because the v3 runtime takes no date. Inputs are sha-asserted.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
V3 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json')
V3_SHA = '4b6d2c7c241c521a719fb1733ddffd6cbd2a283da441a3324158a4476b8446fe'  # shipped d5c005f
S1 = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1/authority-candidate.json')
ENGINE = Path('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/engine.json')
EXCLUDED = ['丑甲寅', '丑丙寅', '丑壬寅', '丑戊寅', '未戊申']

assert hashlib.sha256(V3.read_bytes()).hexdigest() == V3_SHA, 'authority v3 changed'
v3 = json.loads(V3.read_text(encoding='utf-8'))
s1 = json.loads(S1.read_text(encoding='utf-8'))['contexts']
engine = json.loads(ENGINE.read_text(encoding='utf-8'))['contexts']
cov = v3['runtimeCoverage']['activities']['demolition']['contexts']
assert sorted(k for k, c in cov.items() if c['status'] != 'APPLIED') == sorted(EXCLUDED)


def candidate(cell):
    a = copy.deepcopy(v3)
    a['version'] = f'xieji-vol10-jiesha-faithful-v4-candidate-soil-{cell}5'
    for k in EXCLUDED:
        e = a['runtimeCoverage']['activities']['demolition']['contexts'][k]
        grade = e['grade']
        e.clear()
        e.update(status='APPLIED', cell=cell, grade=grade, identityApproved=True, authorityApproved=True,
                 productionApproved=True)
        a['cells'][k]['demolition'] = cell
    values = [v for row in a['cells'].values() for v in row.values()]
    a['counts'] = {'contexts': 16, 'activities': 25, 'cells': len(values), 'avoid': values.count('avoid'),
                   'blank': values.count('blank')}
    a['runtimeCoverage']['projection'] = f'AUDIT-ONLY G1-SOIL Stage 1 candidate ({cell} in the 5 contexts); not production'
    a['provenance']['generator'] = str(OUT / 'build_candidate.py')
    for ctx, row in a['cells'].items():
        assert {k: v for k, v in row.items() if k != 'demolition'} == {k: v for k, v in v3['cells'][ctx].items()
                                                                          if k != 'demolition'}
    return a


table = {}
for k in EXCLUDED:
    key = k[0] + '-' + k[1:]
    x, e = s1[key], engine[key]
    assert x['dateDependent'] and x['cellSoilAbsent'] == 'blank' and x['cellSoilPresent'] == 'avoid'
    table[k] = {
        'outside': {'cell': 'blank', 'grade': x['gradeSoilAbsent'],
                    'why': 'puzhu:20 相抵 lift: 興造動土 and 豎柱上梁 both unnoted (each has 宜) → demolition unnoted',
                    'engine': e['soilAbsent']['破屋壊垣']},
        'inside': {'cell': 'avoid',
                   'grade': {'rule': 'B', 'calendar2025_2027': 'B (p4-soil-owner-convention-v1, owner-adopted)',
                             'calendarOutside': 'B if the owner adopts the source-derived rule (soil-rule.json) as '
                                                'authority outside 2025–2027; C until then'},
                   'why': '興造動土 carries 土王用事後 (卷十一 :265 list) → puzhu:20 lift blocked → 劫煞 忌 kept; '
                          'demolition also carries 土王用事後 directly',
                   'engine': e['soilPresent']['破屋壊垣']},
        'witnessPage': x['witness']['page'], 'pageDiscriminatesOutside': x['witness']['discriminating'],
    }
matrix = {
    'version': 'g1-soil-stage1-production-access-candidate-v1',
    'status': 'AUDIT_ONLY_NOT_PRODUCTION',
    'from': {'authority': v3['version'], 'sha256': V3_SHA},
    'proposedState': 'APPLIED_DATE_DEPENDENT',
    'selector': {
        'id': 'tho-vuong-dung-su',
        'ruleVersion': 'tho-vuong-dung-su-rule-v1 (soil-rule.json)',
        'cells': {'inside': 'avoid', 'outside': 'blank'},
        'input': 'civil date (required) → calendar-rule service → inside | outside; unknown / unsupported throws',
    },
    'rows': [{'context': k, 'current': 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY', 'candidate': 'APPLIED_DATE_DEPENDENT',
              'cellInside': 'avoid', 'cellOutside': 'blank', 'staticCell': None,
              'identityApproved': True, 'authorityApproved': 'pending owner (calendar adoption)',
              'productionApproved': False} for k in EXCLUDED],
    'unchanged': '11 demolition contexts APPLIED (static avoid); all other activities APPLIED 16/16',
    'invariants': ['a date-dependent context has no static cell', 'the selector is a declared id, not code',
                   'no civil dates in the authority file'],
}
files = {'candidate-authority-avoid5.json': candidate('avoid'), 'candidate-authority-blank5.json': candidate('blank'),
         'authority-candidate.json': {'version': 'g1-soil-stage1-authority-candidate-v1',
                                      'status': 'AUDIT_CANDIDATE_NOT_PRODUCTION',
                                      'inputs': {str(V3): V3_SHA,
                                                 str(S1): hashlib.sha256(S1.read_bytes()).hexdigest(),
                                                 str(ENGINE): hashlib.sha256(ENGINE.read_bytes()).hexdigest()},
                                      'contexts': table},
         'production-access-matrix.json': matrix}


def main():
    for k, v in files.items():
        text = json.dumps(v, ensure_ascii=False, indent=1) + '\n'
        if '--write' in sys.argv:
            (OUT / k).write_text(text, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == text, f'{k} differs'
    print('candidates ok', files['candidate-authority-avoid5.json']['counts'],
          files['candidate-authority-blank5.json']['counts'])


if __name__ == '__main__':
    main()

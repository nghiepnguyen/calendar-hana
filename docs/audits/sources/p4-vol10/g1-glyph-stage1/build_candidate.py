"""G1 glyph Stage 1 (audit only): demolition 劫煞 authority candidates from frozen evidence.

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/build_candidate.py [--write]

Inputs (sha-pinned below): production authority v2 and the G1-a corrected faithful engine
(g1a-demolition-authority-v1/engine.json, owner-accepted 2026-10-24). Nothing here is production data:
the two authority-shaped files exist only to be loaded by vi.doMock in
shared/lunar/p4G1GlyphStage1Audit.test.ts.

  authority-candidate.json          16 contexts: soil-absent / soil-present cell, grade, provenance
  candidate-authority-fit.json      v2 + demolition APPLIED with the soil-absent cell (fits the v2 schema)
  candidate-authority-inwindow.json v2 + demolition APPLIED with the soil-present cell (avoid 16/16)

The date-faithful candidate is not a third file: per day it is `inwindow` inside the 土王用事 period and
`fit` outside (compare.py composes it), because getVol10JieshaRuntime takes no date. --write writes the
three files; default verifies them.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1')
V2 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json')
ENGINE = Path('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/engine.json')
CAND_ID = 'xieji-vol10-jiesha-faithful-v3-candidate-g1'

PIN = json.loads((OUT / 'pins.json').read_text(encoding='utf-8'))
for p in (V2, ENGINE):
    assert hashlib.sha256(p.read_bytes()).hexdigest() == PIN[str(p)], f'{p} changed'
v2 = json.loads(V2.read_text(encoding='utf-8'))
engine = json.loads(ENGINE.read_text(encoding='utf-8'))
assert v2['version'] == 'xieji-vol10-jiesha-faithful-v2'
assert v2['runtimeCoverage']['activities']['demolition']['status'] == 'EXCLUDED_PENDING_GLYPH_AUDIT'
assert 'demolition' not in v2['activities']
assert engine['demolitionKeys'] == {'legacy': [], 'corrected': ['破屋壊垣']}

# G1-a §6: pages where only 劫煞 can print or omit the heading (discriminating), and why the rest are not.
DISCRIMINATING = {'辰-乙巳', '辰-己巳', '辰-癸巳', '辰-辛巳', '未-丙申', '未-壬申', '未-庚申',
                  '丑-甲寅', '丑-壬寅', '丑-戊寅'}
NON_DISCRIMINATING = {
    '戌-丁亥': '土符 (undated) lists 破屋壞垣 itself (vol10:392): page prints it whatever 劫煞 does',
    '戌-乙亥': '土符 (undated) lists 破屋壞垣 itself (vol10:392): page prints it whatever 劫煞 does',
    '戌-己亥': '土符 (undated) lists 破屋壞垣 itself (vol10:392): page prints it whatever 劫煞 does',
    '戌-癸亥': '土符 (undated) lists 破屋壞垣 itself; n65 SOURCE_AMBIGUOUS (other headings)',
    '丑-丙寅': 'n75 prints 月德 (D-A WITNESS_PRINTING_ERROR): heading omitted under either reading',
    '未-戊申': 'n117 owner-ruled internally inconsistent (納財 ruling); separate 立券交易 audit open',
}
assert DISCRIMINATING.isdisjoint(NON_DISCRIMINATING)
assert DISCRIMINATING | set(NON_DISCRIMINATING) == set(engine['contexts'])

contexts = {}
for ctx, c in sorted(engine['contexts'].items()):
    absent, present = c['soilAbsent']['verdict'], c['soilPresent']['verdict']
    assert absent in ('avoid', 'blank') and present == 'avoid', ctx
    assert c['witness']['agreesSoilAbsent'] is True, ctx
    split = absent != present
    page = 'A' if ctx in DISCRIMINATING else 'B'
    contexts[ctx] = {
        'monthJian': ctx[0],
        'dayPillar': ctx[2:],
        'sourceHeading': '破屋壞垣 (卷十 劫煞 avoid list); 卷十一 heading 破屋壊垣',
        'cellSoilAbsent': absent,
        'cellSoilPresent': present,
        'dateDependent': split,
        'mechanism': (
            'puzhu:20 相抵 lift: 興造動土+豎柱上梁 both unnoted → demolition unnoted (blank); '
            'inside 土王用事 興造動土 carries 土王用事後 → lift blocked → 劫煞 忌 kept'
            if split else
            ('興造動土 noted by 土符 (undated) → puzhu:20 lift blocked → 劫煞 忌 kept' if ctx == '戌-癸亥'
             else '興造動土 has no 宜 and keeps 刼煞 → puzhu:20 lift never applies → 劫煞 忌 kept')),
        'witness': {**c['witness'], 'discriminating': ctx in DISCRIMINATING,
                    **({'why': NON_DISCRIMINATING[ctx]} if ctx in NON_DISCRIMINATING else {})},
        # Out of window: the page (undated) witnesses the soil-absent cell directly or only consistently.
        'gradeSoilAbsent': page,
        # In window: no page can witness a date-dependent operand; 2025–2027 rests on the adopted owner
        # soil convention (p4-soil-owner-convention-v1), outside it on that convention extended (C).
        'gradeSoilPresent': (page if not split else {'2025-2027': 'B', 'outside': 'C'}),
        'repDate': c['repDate'],
    }
grades = [g for x in contexts.values() for g in
          ([x['gradeSoilAbsent']] + (list(x['gradeSoilPresent'].values())
                                      if isinstance(x['gradeSoilPresent'], dict) else []))]
summary = {
    'contexts': len(contexts),
    'dateInvariantAvoid': sorted(k for k, x in contexts.items() if not x['dateDependent']),
    'dateDependent': sorted(k for k, x in contexts.items() if x['dateDependent']),
    'cellsUnknown': 0,
    'gradeCount': {g: grades.count(g) for g in 'ABCD'},
}
assert summary['dateInvariantAvoid'].__len__() == 11 and len(summary['dateDependent']) == 5


def candidate(which):
    a = copy.deepcopy(v2)
    a['version'] = CAND_ID + ('' if which == 'fit' else '-inwindow')
    key = 'cellSoilAbsent' if which == 'fit' else 'cellSoilPresent'
    for ctx, x in contexts.items():
        a['cells'][ctx.replace('-', '')]['demolition'] = x[key]
    a['activities'] = sorted(a['activities'] + ['demolition'])
    values = [v for row in a['cells'].values() for v in row.values()]
    a['counts'] = {'contexts': 16, 'activities': 25, 'cells': len(values),
                   'avoid': values.count('avoid'), 'blank': values.count('blank')}
    a['runtimeCoverage']['activities']['demolition'] = {'status': 'APPLIED'}
    a['runtimeCoverage']['projection'] = f'AUDIT-ONLY G1 glyph Stage 1 candidate ({which}); not production'
    a['provenance']['g1GlyphStage1'] = {'audit': 'docs/audits/p4-g1-demolition-glyph-authority.md',
                                        'candidate': which, 'productionApproved': False}
    a['provenance']['generator'] = str(OUT / 'build_candidate.py')
    # Only demolition may differ from v2.
    for ctx, row in a['cells'].items():
        assert {k: v for k, v in row.items() if k != 'demolition'} == v2['cells'][ctx]
    return a


table = {
    'version': 'g1-glyph-stage1-authority-candidate-v1',
    'status': 'AUDIT_CANDIDATE_NOT_PRODUCTION',
    'inputs': {str(V2): PIN[str(V2)], str(ENGINE): PIN[str(ENGINE)]},
    'grades': {'A': 'direct source witness (discriminating 月表 page)',
               'B': 'strong rule derivation from approved rules (G1-a engine), page consistent but not discriminating or no page possible',
               'C': 'repository inference: rests on the owner soil convention extended beyond its adopted 2025–2027 coverage',
               'D': 'unknown / conflicted'},
    'summary': summary,
    'contexts': contexts,
}
files = {
    'authority-candidate.json': table,
    'candidate-authority-fit.json': candidate('fit'),
    'candidate-authority-inwindow.json': candidate('inwindow'),
}


def main():
    for name, obj in files.items():
        text = json.dumps(obj, ensure_ascii=False, indent=1) + '\n'
        if '--write' in sys.argv:
            (OUT / name).write_text(text, encoding='utf-8')
        else:
            assert (OUT / name).read_text(encoding='utf-8') == text, f'{name} differs'
    print('candidate', summary)


if __name__ == '__main__':
    main()

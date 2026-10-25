"""G1-SOIL Stage 2: sha256 lock over the committed migration evidence and its pinned inputs.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_lock.py [--write]
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage2')
FILES = ['build_authority_v4.py', 'build_scoring_golden_v5.py', 'build_access_matrix.py', 'compare.py',
         'authority-v3-v4.json', 'golden-diff.json', 'production-access-matrix.json', 'summary.json',
         'activity-diff.tsv', 'event-diff.json', 'rollback.json', 'authority-stamp.json', 'mutation-results.json',
         'jiesha-mutation-results.json', 'g1b-counterfactual-3.json',
         'classify_overlap_impact.py', 'overlap-impact-classification.json']
OUTPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v4.json',
           'shared/almanac-data/golden-xieji-vol10-scoring-v5.json', 'shared/lunar/thoVuongDungSuRule.ts']
INPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
          'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json',
          'shared/almanac-data/xieji-vol10-jiesha-authority-v3.json',
          'shared/almanac-data/golden-xieji-vol10-scoring-v4.json',
          'docs/audits/sources/p4-vol10/g1-soil-stage1/lock.json',
          'docs/audits/sources/p4-vol10/g1-soil-stage1/r2-impact.tsv',
          'docs/audits/sources/p4-vol10/g1-soil-stage1/soil-calendar.json',
          'docs/audits/sources/p4-vol10/g1-glyph-stage2/lock.json',
          'docs/audits/sources/p4-vol10/p4-score-golden-v4/lock.json',
          'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json',
          'docs/audits/p4-g1-soil-stage2-spec.md']


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


lock = {
    'version': 'g1-soil-stage2-lock-v1',
    'status': 'PRODUCTION_MIGRATION_EVIDENCE',
    'base': {'production': 'd5c005fe59f6dea642d23d815b3d1a0dca070528',
             'ancestry': '744a4ba (G1-SOIL Stage 1 audit ce05ba4 + Stage 2 spec)'},
    'migration': '劫煞 authority v4 (R2): 5 demolition contexts APPLIED_DATE_DEPENDENT, selector tho-vuong-dung-su-rule-v1',
    'reproduce': {
        'authority': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_authority_v4.py',
        'scoringGoldenV5': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_scoring_golden_v5.py',
        'accessMatrix': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_access_matrix.py',
        'dumps': 'G1SOIL2_DUMP=forward | rollback,forward  G1SOIL2_OUT=<dir>/{fwd,rb} npx vitest run shared/lunar/p4G1SoilStage2Migration.test.ts; pre: G1SOIL2_DUMP=pre on a d5c005f worktree with that test file + g1GlyphRollback.ts + thoVuongDungSuRule.ts → <dir>/pre',
        'diff': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/compare.py <dir>',
        'authorityStamp': 'G1SOIL2_STAMP=1 npx vitest run shared/lunar/p4G1SoilStage2Migration.test.ts -t "authority stamp gate"',
        'counterfactual3': 'G1SOIL2_G1B=1 npx vitest run shared/lunar/p4G1SoilStage2Migration.test.ts -t "counterfactual #3"',
        'mutations': 'python3 scripts/audit-vol10-jiesha-mutations.py; G1SOIL2_WRITE=1 npx vitest run shared/lunar/p4G1SoilStage2Migration.test.ts',
        'overlapImpactClassification': 'JIESHA_IMPACT_FULL=1 on f3c68c6 / d5c005f worktrees and this branch → <dir>/{f3c68c6,d5c005f,v4}.json (restore the locked raw.json after each run); python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/classify_overlap_impact.py <dir>',
    },
    'files': [{'path': str(OUT / f), 'sha256': sha(OUT / f)} for f in FILES],
    'outputs': [{'path': p, 'sha256': sha(p)} for p in OUTPUTS],
    'inputs': [{'path': p, 'sha256': sha(p)} for p in INPUTS],
}
text = json.dumps(lock, ensure_ascii=False, indent=1) + '\n'
if '--write' in sys.argv:
    (OUT / 'lock.json').write_text(text, encoding='utf-8')
else:
    assert (OUT / 'lock.json').read_text(encoding='utf-8') == text, 'lock.json differs'
    print('lock ok', len(lock['files']) + len(lock['outputs']) + len(lock['inputs']))

"""G1-SOIL Stage 1: sha256 lock over the committed audit artifacts and pinned inputs.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_lock.py [--write]
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
FILES = ['build_soil_calendar.py', 'build_candidate.py', 'build_evidence.py', 'compare.py', 'soil-calendar.json',
         'soil-boundaries.tsv', 'soil-sensitivity.json', 'soil-rule.json', 'source-evidence.json', 'inventory.json',
         'candidate-authority-avoid5.json', 'candidate-authority-blank5.json', 'authority-candidate.json',
         'production-access-matrix.json', 'r2-impact.json', 'r2-impact.tsv', 'event-impact.json',
         'counterfactuals.json', 'witnesses.json', 'g1b-counterfactual-3.json']
INPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v3.json',
          'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json',
          'shared/lunar/thoVuongDungSu.ts', 'shared/lunar/lunar.ts',
          'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/engine.json',
          'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/full.json',
          'docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json',
          'docs/audits/sources/p4-vol10/g1-glyph-stage2/lock.json',
          'shared/almanac-data/manifest.json']


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


lock = {
    'version': 'g1-soil-stage1-lock-v1',
    'status': 'AUDIT_ONLY_NOT_PRODUCTION',
    'base': 'origin/main d5c005fe59f6dea642d23d815b3d1a0dca070528 (PR #103 merged and deployed)',
    'reproduce': {
        'calendar': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_soil_calendar.py',
        'candidates': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_candidate.py',
        'evidence': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_evidence.py',
        'dumps': 'for m in forward avoid5 blank5: G1SOIL_DUMP=$m G1SOIL_OUT=<dir>/$m npx vitest run shared/lunar/p4G1SoilStage1Audit.test.ts',
        'diff': 'python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/compare.py <dir>',
        'g1bCounterfactual3': 'G1SOIL_G1B=1 npx vitest run shared/lunar/p4G1SoilStage1Audit.test.ts -t "counterfactual #3"',
        'baselineDump': 'G1GS2_DUMP=forward npx vitest run shared/lunar/p4G1GlyphStage2Migration.test.ts → sha = g1-glyph-stage2 rollback.json stage2Forward',
    },
    'files': [{'path': str(OUT / f), 'sha256': sha(OUT / f)} for f in FILES],
    'inputs': [{'path': p, 'sha256': sha(p)} for p in INPUTS],
}
text = json.dumps(lock, ensure_ascii=False, indent=1) + '\n'
if '--write' in sys.argv:
    (OUT / 'lock.json').write_text(text, encoding='utf-8')
else:
    assert (OUT / 'lock.json').read_text(encoding='utf-8') == text, 'lock.json differs'
    print('lock ok', len(lock['files']) + len(lock['inputs']))

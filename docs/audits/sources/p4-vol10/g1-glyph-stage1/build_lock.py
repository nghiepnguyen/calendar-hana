"""G1 glyph Stage 1: sha256 lock over every committed Stage 1 artifact and its pinned inputs.

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/build_lock.py [--write]
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1')
FILES = ['build_candidate.py', 'build_evidence.py', 'compare.py', 'pins.json', 'authority-candidate.json',
         'candidate-authority-fit.json', 'candidate-authority-inwindow.json', 'inventory.json',
         'source-evidence.json', 'glyph-analysis.json', 'heading-provenance.json', 'collision-analysis.json',
         'production-access-matrix.json', 'production-access-matrix.tsv', 'range-impact.json',
         'range-impact-events.json', 'candidate-impact.tsv', 'independent-verification.json', 'witnesses.json',
         'mutation-results.json', 'crop-06067694-n81-pwuhuaiyuan.jpg']
INPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
          'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json',
          'shared/almanac-data/xiejibianfangshu-vol10-yiji.json', 'shared/almanac-data/xiejibianfangshu-yiji.json',
          'shared/almanac-data/manifest.json', 'docs/audits/sources/p4-vol10/vol10.raw.txt',
          'docs/audits/sources/p4-vol10/yi-sources-v1/vol11.raw.txt',
          'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/engine.json',
          'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/full.json',
          'docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json',
          'docs/audits/sources/p4-vol10/p4-migration-diff-v3/summary.json',
          'docs/audits/sources/p4-vol10/g2-stage2/lock.json',
          'docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/pages/06067694-n81.jpg']


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


lock = {
    'version': 'g1-glyph-stage1-lock-v1',
    'status': 'AUDIT_ONLY_NOT_PRODUCTION',
    'base': 'origin/main f3c68c611f21da4ea9493720c6434b45fa601644 (PR #102 merged)',
    'reproduce': {
        'candidate': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/build_candidate.py',
        'evidence': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/build_evidence.py',
        'dumps': 'for m in forward fit inwindow: G1GS1_DUMP=$m G1GS1_OUT=<dir>/$m npx vitest run shared/lunar/p4G1GlyphStage1Audit.test.ts',
        'diff': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/compare.py <dir>',
        'mutations': 'G1GS1_WRITE=1 npx vitest run shared/lunar/p4G1GlyphStage1Audit.test.ts (rewrites mutation-results.json)',
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

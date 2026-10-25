"""G1 glyph Stage 2: sha256 lock over the committed migration evidence and its pinned inputs.

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_lock.py [--write]
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage2')
FILES = ['build_authority_v3.py', 'build_scoring_golden_v4.py', 'build_access_matrix.py', 'compare.py',
         'authority-v2-v3.json', 'golden-diff.json', 'production-access-matrix.json', 'summary.json',
         'activity-diff.tsv', 'event-diff.json', 'rollback.json', 'authority-stamp.json', 'mutation-results.json',
         'jiesha-mutation-results.json']
OUTPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v3.json',
           'shared/almanac-data/golden-xieji-vol10-scoring-v4.json']
INPUTS = ['shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
          'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json',
          'shared/almanac-data/golden-xieji-vol10-scoring-v3.json',
          'docs/audits/sources/p4-vol10/g1-glyph-stage1/authority-candidate.json',
          'docs/audits/sources/p4-vol10/g1-glyph-stage1/candidate-impact.tsv',
          'docs/audits/sources/p4-vol10/g1-glyph-stage1/lock.json',
          'docs/audits/sources/p4-vol10/p4-score-golden-v4/lock.json',
          'docs/audits/sources/p4-vol10/p4-migration-diff-v3/summary.json',
          'docs/audits/sources/p4-vol10/g2-stage2/lock.json',
          'docs/audits/p4-g1-glyph-stage2-spec.md']


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


lock = {
    'version': 'g1-glyph-stage2-lock-v1',
    'status': 'PRODUCTION_MIGRATION_EVIDENCE',
    'base': {'production': 'f3c68c611f21da4ea9493720c6434b45fa601644',
             'ancestry': '348e8792bf677aae54a258e4aa902a076159ff16 (Stage 1 audit + Stage 2 spec)'},
    'migration': '劫煞 authority v3 (R3): demolition APPLIED in 11 contexts, 5 EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY',
    'reproduce': {
        'authority': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_authority_v3.py',
        'scoringGoldenV4': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_scoring_golden_v4.py',
        'accessMatrix': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_access_matrix.py',
        'dumps': 'G1GS2_DUMP=forward | rollback,forward  G1GS2_OUT=<dir>/{fwd,rb} npx vitest run shared/lunar/p4G1GlyphStage2Migration.test.ts; pre: G1GS2_DUMP=pre on an f3c68c6 worktree with that test file + g1GlyphRollback.ts → <dir>/pre; Stage 1 dumps per g1-glyph-stage1/lock.json',
        'diff': 'python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/compare.py <dir> <stage1-dir>',
        'authorityStamp': 'G1GS2_STAMP=1 npx vitest run shared/lunar/p4G1GlyphStage2Migration.test.ts -t "authority stamp gate" (G1GS2_WRITE=1 rewrites)',
        'mutations': 'python3 scripts/audit-vol10-jiesha-mutations.py (writes jiesha-mutation-results.json); G1GS2_WRITE=1 npx vitest run shared/lunar/p4G1GlyphStage2Migration.test.ts (mutation-results.json)',
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

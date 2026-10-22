"""Production 卷十 劫煞 authority v1 from the owner-approved audit candidate.

Run: python3 -I docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/build_authority.py
Reads docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json (must hash to the approved
SHA-256) and writes shared/almanac-data/xieji-vol10-jiesha-authority-v1.json; then run
`npx prettier --write` on it. Runtime never reads docs/.
"""
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
CAND = ROOT / 'docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json'
OUT = ROOT / 'shared/almanac-data/xieji-vol10-jiesha-authority-v1.json'
APPROVED = 'b24f6f68e6b662fc04b5ec56ab6f2da8981273291ef3bf4e05a028b2f48d326a'

raw = CAND.read_bytes()
if hashlib.sha256(raw).hexdigest() != APPROVED:
    raise SystemExit('candidate does not match the approved SHA-256')
cand = json.loads(raw)
cells = {k: dict(sorted(v.items())) for k, v in sorted(cand['cells'].items())}
values = [v for r in cells.values() for v in r.values()]
counts = {'contexts': len(cells), 'activities': len(cand['activities']), 'cells': len(values),
          'avoid': values.count('avoid'), 'blank': values.count('blank')}
assert counts == {'contexts': 16, 'activities': 24, 'cells': 384, 'avoid': 177, 'blank': 207}, counts

authority = {
    'schema': 'xieji-vol10-jiesha-authority',
    'version': 'xieji-vol10-jiesha-faithful-v1',
    'description': '協紀辨方書 卷十 劫煞, 辰戌丑未 months without 天德/月德/天德合/月德合 (「凡所忌者則不註宜所宜者亦'
                   '不註忌」): per Month Jian + day pillar and activity, whether 劫煞 忌 survives (avoid) or the '
                   'activity stays unannotated (blank).',
    'scope': {'entry': 'jie_sha', 'monthJian': ['辰', '戌', '丑', '未'],
              'branch': '辰戌丑未 clause, no 德 (withVirtues false) → otherwise cancel_both',
              'key': 'monthJian + dayStem + dayBranch, e.g. 丑丙寅'},
    'counts': counts,
    'activities': sorted(cand['activities']),
    'cells': cells,
    # Owner decision 2026-10-22 (Option 1, approved runtime projection): what runtime v1 does per activity.
    # p4JieshaOptionCCoverage.test.ts proves these states against the real resolveVol10 listing.
    'runtimeCoverage': {
        'projection': 'faithful-v1: the approved audit matrix projected through the current resolveVol10 '
                      'heading normalization, with explicit v1 exclusions; it does not resolve glyph debt',
        'activities': {
            **{a: {'status': 'APPLIED'} for a in sorted(cand['activities']) if a not in ('contract', 'transaction')},
            **{a: {'status': 'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION',
                   'jieshaHeading': '立劵交易', 'activityHeading': '立券交易', 'debt': 'G2',
                   'reason': '劫煞 lists 立劵交易; resolveVol10 NORM has no 劵→券, so the activity reads '
                             'not_listed and the audit cells are never consulted'}
               for a in ('contract', 'transaction')},
            'demolition': {'status': 'EXCLUDED_PENDING_GLYPH_AUDIT',
                           'jieshaHeading': '破屋壊垣 (resolveVol10 NORM of 破屋壞垣)', 'activityHeading': '破屋壞垣', 'debt': 'G1',
                           'reason': 'resolveVol10 lists it (NORM 壞→壊) but the approved simulator never '
                                     'matched 破屋壞垣, so the audit matrix has no demolition cells; legacy '
                                     'cancel_both behaviour is kept until a glyph audit approves cells'},
        },
    },
    'provenance': {
        'approvedCandidate': {'path': str(CAND.relative_to(ROOT)), 'sha256': APPROVED,
                              'commit': '681c692', 'approval': 'owner, 2026-10-22'},
        'evidence': cand['provenance'],
        'audits': ['docs/audits/p4-h1b-yuebiao-witness.md', 'docs/audits/p4-xiangdi-cancel-both-audit.md',
                   'docs/audits/p4-jiesha-overlap-impact.md', 'docs/audits/p4-jiesha-faithful-vol10.md',
                   'docs/audits/p4-puzhu17-bujiang.md', 'docs/audits/p4-weishen-nacai-puzhu21.md',
                   'docs/audits/p4-option-c-final-gate.md', 'docs/audits/p4-chou-bingyin-yuede.md'],
        'generator': str(pathlib.Path(__file__).resolve().relative_to(ROOT)),
    },
}
OUT.write_text(json.dumps(authority, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(counts, hashlib.sha256(OUT.read_bytes()).hexdigest())

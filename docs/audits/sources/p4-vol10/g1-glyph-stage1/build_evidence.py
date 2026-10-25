"""G1 glyph Stage 1 (audit only): inventory, source evidence, glyph / heading / collision analysis and the
Production Access Matrix, from tracked files only (no network, no LLM).

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/build_evidence.py [--write]

Writes inventory.json, source-evidence.json, glyph-analysis.json, heading-provenance.json,
collision-analysis.json, production-access-matrix.json and production-access-matrix.tsv; default verifies.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1')
S = 'docs/audits/sources/p4-vol10/'


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def text(p):
    return Path(p).read_text(encoding='utf-8')


def line_of(p, needle, start=1):
    for i, line in enumerate(text(p).split('\n'), 1):
        if i >= start and needle in line:
            return i
    raise AssertionError(f'{needle} not in {p}')


# ---------------------------------------------------------------- inventory (§2)
INVENTORY = [
    ('docs/audits/p4-g1-glyph-audit.md', 'G1 glyph audit: SAME_ACTIVITY_ALIAS, harness root cause, G1-b finding', 'project audit (owner ruling given in G1-a §11)'),
    ('docs/audits/p4-g1a-demolition-authority.md', 'G1-a: SAME_ACTIVITY_ALIAS_CONFIRMED, corrected engine, 土王用事 date dependence', 'owner-accepted 2026-10-24'),
    (S + 'g1-glyph-audit-v1/inventory-summary.json', 'G1 glyph inventory (121 files)', 'audit artifact'),
    (S + 'g1a-demolition-authority-v1/engine.json', 'corrected faithful engine, 16 contexts × soil absent/present', 'owner-accepted audit artifact'),
    (S + 'g1a-demolition-authority-v1/full.json', 'demolition verdict on all 1,636 scope dates by 土王用事 window', 'owner-accepted audit artifact'),
    (S + 'g1a-demolition-authority-v1/witness-matrix.json', 'every source occurrence and 月表 page, raw / normalized / canonical', 'audit artifact'),
    (S + 'g1a-demolition-authority-v1/lock.json', 'G1-a lock', 'lock'),
    ('docs/audits/p4-g1b-stage2-migration.md', 'G1-b Stage 2: canonical-v1 shipped', 'production migration record'),
    (S + 'p4-migration-diff-v3/summary.json', 'G1-b Migration Diff v3: 353 / 320 / 337 / 0', 'frozen production migration evidence'),
    (S + 'p4-score-golden-v4/activity-scores.tsv', 'Score Golden v4 (canonical-v1)', 'frozen Golden'),
    (S + 'p4-score-golden-v3/lock.json', 'Score Golden v3 (pre-G1-b rollback)', 'frozen Golden'),
    ('docs/audits/p4-g2-vol10-heading-match.md', 'G2 Stage 1', 'owner-approved spec'),
    ('docs/audits/p4-g2-stage2-migration.md', 'G2 Stage 2 (PR #102)', 'production migration record'),
    (S + 'g2-stage2/authority-v1-v2.json', 'authority v1 → v2 diff', 'frozen production migration evidence'),
    ('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json', '劫煞 authority faithful-v1 (rollback)', 'frozen authority'),
    ('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json', '劫煞 authority faithful-v2 (production)', 'production authority'),
    (S + 'chou-bingyin-yuede-v1/candidate-final.json', 'approved 16 × 24 candidate matrix (b24f6f68…)', 'owner-approved 2026-10-22'),
    ('shared/almanac-data/xiejibianfangshu-vol10-yiji.json', '卷十 宜忌 runtime source data (劫煞 avoid 破屋壞垣)', 'runtime data'),
    ('shared/almanac-data/xiejibianfangshu-yiji.json', '卷十一 activity map (demolition → 破屋壞垣)', 'runtime data'),
    ('shared/lunar/xiejiVol10Resolution.ts', 'NORM, splitHeadings, canonicalP4HeadingKey, resolveVol10', 'runtime code'),
    ('shared/lunar/xiejiVol10JieshaAuthority.ts', 'authority validate() + getVol10JieshaRuntime', 'runtime code'),
    ('shared/almanac-data/p4-soil-owner-convention-v1.json', '土王用事 window convention, coverage 2025–2027', 'owner-adopted 2026-10-13'),
    (S + 'vol10.raw.txt', '協紀辨方書 卷十 (Wikisource 四庫 transcription)', 'primary source, transcription'),
    (S + 'yi-sources-v1/vol11.raw.txt', '協紀辨方書 卷十一 (Wikisource 四庫 transcription)', 'primary source, transcription'),
    (S + 'vol06.raw.txt', '協紀辨方書 卷六 (transcription)', 'primary source, transcription'),
    (S + 's1-tuwang/tuibu-jieli-shang.raw.txt', '推步捷例 上 (1861)', 'derivative compilation, research evidence only'),
    (S + 'h1b-yuebiao-witness-v1/lock.json', '月表 page transcriptions, scans sha-locked', 'scan-locked witness'),
    (S + 'puzhu17-bujiang-v1/scope-dates.json', '1,636 劫煞 authority scope dates by context', 'audit artifact'),
]


def inventory():
    return {'version': 'g1-glyph-stage1-inventory-v1',
            'files': [{'path': p, 'role': r, 'authorityLevel': a, 'sha256': sha(p)} for p, r, a in INVENTORY],
            'settled': {
                'characterAndHeading': 'SAME_ACTIVITY_ALIAS_CONFIRMED (G1-a §8, owner 2026-10-24) — not re-decided here',
                'canonical': '破屋壊垣; alias 破屋壞垣 → 破屋壊垣 at match / key time; raw text untouched',
                'g1b': 'canonical-v1 shipped (353 / 320 / 337 / 0) — frozen history',
                'g2': '立劵交易 → [立券交易], authority faithful-v2, 未-戊申 contract/transaction blank (I1) — frozen',
            }}


# ---------------------------------------------------------------- source evidence (§4, §5)
SOURCES = [
    (S + 'vol10.raw.txt', '協紀辨方書 卷十', 'transcription of primary (Wikisource 四庫)'),
    (S + 'yi-sources-v1/vol11.raw.txt', '協紀辨方書 卷十一', 'transcription of primary (Wikisource 四庫)'),
    (S + 'vol06.raw.txt', '協紀辨方書 卷六', 'transcription of primary (Wikisource 四庫)'),
    (S + 's1-tuwang/tuibu-jieli-shang.raw.txt', '推步捷例 上', 'secondary reference (derivative compilation)'),
]
PATTERNS = ('破屋壞垣', '破屋壊垣', '破屋', '壞垣', '壊垣')


def source_evidence():
    occ = []
    for p, work, cls in SOURCES:
        for i, line in enumerate(text(p).split('\n'), 1):
            for m in re.finditer('破屋[壞壊]垣', line):
                s = line.strip()
                head = s[:1]
                occ.append({
                    'source': p, 'work': work, 'class': cls, 'line': i, 'match': m.group(),
                    'glyph': '壞' if '壞' in m.group() else '壊',
                    'kind': '宜' if head == '宜' else '忌' if head == '忌' else '止註/止不忌/rule' if '止' in s[:4] else 'other',
                    'context': line[max(0, m.start() - 16):m.end() + 8],
                })
    counts = {}
    for o in occ:
        k = Path(o['source']).name
        counts.setdefault(k, {}).setdefault(o['glyph'], 0)
        counts[k][o['glyph']] += 1
    bare = {Path(p).name: {pat: text(p).count(pat) for pat in PATTERNS} for p, _, _ in SOURCES}
    lone = {Path(p).name: len(re.findall('[壞壊]', text(p))) - len(re.findall('破屋[壞壊]垣', text(p))) for p, _, _ in SOURCES}
    assert not any(lone.values()), lone
    h1b = json.loads(text(S + 'h1b-yuebiao-witness-v1/lock.json'))
    return {
        'version': 'g1-glyph-stage1-source-evidence-v1',
        'rule': 'source spelling preserved exactly; no modernization',
        'occurrences': occ, 'glyphCounts': counts, 'glyphOutsideCompound': lone, 'patternCounts': bare,
        'jieshaWitness': {
            'rawLine': line_of(S + 'vol10.raw.txt', '{{SK anchor|刼煞}}', 290) + 1,
            'heading': '破屋壞垣', 'list': '忌', 'form': 'compound heading inside an unseparated 忌 list',
            'commentary': f"vol10.raw.txt:{line_of(S + 'vol10.raw.txt', '按三煞為三合敵對')} 按語 「…忌解除求醫療病破屋壞垣…」",
        },
        'vol11Heading': {'line': line_of(S + 'yi-sources-v1/vol11.raw.txt', '{{SK anchor|破屋壊垣}}'), 'glyph': '壊'},
        'scans': {
            '月表': {
                'lock': S + 'h1b-yuebiao-witness-v1/lock.json', 'lockSha256': sha(S + 'h1b-yuebiao-witness-v1/lock.json'),
                'headingTermsMap': h1b.get('headingTerms', {}).get('map', {}).get('破屋壊垣'),
                'visualCheck': {
                    'page': S + 'h1b-yuebiao-witness-v1/pages/06067694-n81.jpg (未-壬申 除日)',
                    'pageSha256': sha(S + 'h1b-yuebiao-witness-v1/pages/06067694-n81.jpg'),
                    'crop': str(OUT / 'crop-06067694-n81-pwuhuaiyuan.jpg'),
                    'cropRegion': 'sips -c 400 200 --cropOffset 1420 770 (last 忌 column: 垣牆破屋壞垣栽種牧養納畜)',
                    'reading': '壞 (罒 over 衣, full form)', 'confidence': 'high',
                },
            },
            '卷十/卷十一': 'NOT AVAILABLE: repo scans vol10-n228/n229 are 鋪註 pages (凡吉凶相抵…/凡歲薄逐陣…) with no 破屋 compound; 卷十 / 卷十一 glyphs rest on the Wikisource 四庫 transcription only (limit, as in G1-a §4)',
        },
    }


# ---------------------------------------------------------------- glyph analysis (§6)
def glyph_analysis():
    v11 = json.loads(text('shared/almanac-data/xiejibianfangshu-yiji.json'))
    note = next((n for n in json.dumps(v11, ensure_ascii=False).split('"') if '壊→壞' in n or '壊' in n and 'normaliz' in n), None)
    return {
        'version': 'g1-glyph-stage1-glyph-analysis-v1',
        'general': {
            '壞': 'U+58DE, traditional / 康熙 form', '壊': 'U+58CA, Japanese shinjitai form (simplified 坏)',
            'nfkcUnifies': '壞'.__eq__(__import__('unicodedata').normalize('NFKC', '壊')),
            'conclusion': 'CHARACTER_VARIANT_CONFIRMED (general orthographic variant; not used alone as authority)',
        },
        'sourcePipeline': {
            '卷十': 'mixed: 壞 15, 壊 3; same lists printed in both glyphs (vol10:271/392 壞 vs vol10:449 壊, 義同土府)',
            '卷十一': '壊 only (activity list :46/:67, heading :263)',
            '月表 scans': '壞 (11 of 16 context pages print it; visual crop n81 = 壞)',
            '推步/卷六': '壞 only',
            'otherWordsWithEitherGlyph': 0,
            'conclusion': 'SOURCE_ORTHOGRAPHY_VARIANT_CONFIRMED: inside this transcription the two glyphs alternate within one compound, never elsewhere',
        },
        'repository': {
            'NORM': "shared/lunar/xiejiVol10Resolution.ts:68 壞: '壊' — a source-matching fold (with 宫/宮, 產/産 …), not a semantic claim",
            'activityMap': f"xiejibianfangshu-yiji.json activityEntries.demolition = {v11['activityEntries']['demolition']} (project normalization note: {note!r})",
            'conclusion': 'REPOSITORY_NORMALIZATION in two opposite directions (activity-map data 壊→壞, runtime NORM 壞→壊 at match/key time); naming only, consistent with, not the basis of, the source finding',
        },
        'decision': 'CHARACTER_VARIANT_CONFIRMED + SOURCE_ORTHOGRAPHY_VARIANT_CONFIRMED',
    }


# ---------------------------------------------------------------- heading provenance (§7)
def heading_provenance():
    R = 'shared/lunar/xiejiVol10Resolution.ts'
    A = 'shared/lunar/xiejiVol10JieshaAuthority.ts'
    chain = [
        ('primary source', f"卷十 劫煞 忌 list, vol10.raw.txt:{line_of(S + 'vol10.raw.txt', '{{SK anchor|刼煞}}', 290) + 1}", '破屋壞垣'),
        ('primary source (activity vocabulary)', f"卷十一 heading, vol11.raw.txt:{line_of(S + 'yi-sources-v1/vol11.raw.txt', '{{SK anchor|破屋壊垣}}')}", '破屋壊垣'),
        ('source JSON', 'xiejibianfangshu-vol10-yiji.json entries[jie_sha].avoid', '破屋壞垣'),
        ('activity map', f"xiejibianfangshu-yiji.json:{line_of('shared/almanac-data/xiejibianfangshu-yiji.json', '\"demolition\"')} activityEntries.demolition", '破屋壞垣'),
        ('NORM', f'{R}:{line_of(R, "壞: ")}', '壞 → 壊'),
        ('splitHeadings (listed / avoided sets)', f'{R}:{line_of(R, "export function splitHeadings")}', '破屋壊垣'),
        ('resolveVol10 activity headings (ACTIVITY_HEADINGS.map(normalize))', f'{R}:{line_of(R, "const headings = (ACTIVITY_HEADINGS")}', '破屋壊垣'),
        ('match', 'listed.has(破屋壊垣) = true; cancel_both → verdict no_annotation', 'reachable'),
        ('authority guard', f'{R}:{line_of(R, "r.jieshaAuthority && verdict")} → {A}:{line_of(A, "export function getVol10JieshaRuntime")}', 'EXCLUDED_PENDING_GLYPH_AUDIT'),
        ('output', f'{R}:{line_of(R, "authorityExclusion: `")} authorityExclusion set; verdict stays legacy no_annotation (Kiếp Sát informational)', 'legacy'),
        ('P4 canonical lookup', f"{R}:{line_of(R, 'export function canonicalP4HeadingKey')} canonicalP4HeadingKey; p4ScoreAdapter canonical-v1 (G1-b, shipped)", '破屋壊垣'),
    ]
    return {
        'version': 'g1-glyph-stage1-heading-provenance-v1',
        'chain': [{'layer': a, 'where': b, 'form': c} for a, b, c in chain],
        'answers': {
            '1 primary source spelling': '卷十 劫煞 list 破屋壞垣; 卷十一 heading 破屋壊垣; 月表 scans 破屋壞垣',
            '2 raw transcription': 'as the source (no rewrite)',
            '3 runtime source data': '破屋壞垣 (vol10 JSON avoid list and activity map)',
            '4 demolition maps to': '破屋壞垣 (single heading)',
            '5 P4 canonical lookup': '破屋壊垣 (canonical-v1)',
            '6 resolveVol10 receives': 'raw avoid text + activity heading 破屋壞垣',
            '7 NORM produces': '破屋壊垣 on both sides',
            '8 matching succeeds today': True,
            '9 where it stops': 'getVol10JieshaRuntime: demolition coverage EXCLUDED_PENDING_GLYPH_AUDIT → legacy verdict kept',
            '10 why excluded': 'authority v1/v2 have no demolition cells: the approved simulator harnesses keyed the activity side without splitHeadings (G1 §Root cause, G1-a §3), so the approved matrix never contained demolition; identity is now settled, cells are not approved',
        },
        'headingIdentity': 'SAME_HEADING (G1-a SAME_ACTIVITY_ALIAS_CONFIRMED, owner 2026-10-24)',
        'g1VsG2': {
            'source glyph': ['破屋壞垣 / 破屋壊垣 (both in source)', '立劵交易 (卷十) / 立券交易 (卷十一)'],
            'runtime glyph': ['破屋壞垣 in data', '立劵交易 in data'],
            'activity heading': ['破屋壞垣', '立券交易'],
            'normalization': ['NORM 壞→壊 (character fold, since before G1)', 'headingAliases 立劵交易 → [立券交易] (whole-heading alias, G2 Stage 2)'],
            'resolver reachability': ['reachable before and after G1 (NORM)', 'unreachable before G2, reachable after alias'],
            'authority coverage': ['EXCLUDED_PENDING_GLYPH_AUDIT, no cells', 'cells existed (approved matrix) → APPLIED in v2'],
            'production effect': ['none yet (legacy verdict kept)', 'G2 Stage 2 envelope (shipped)'],
            'remaining problem': ['missing / unrepresentable authority cells', 'none (未-戊申 audit separate)'],
        },
    }


# ---------------------------------------------------------------- collision analysis (§14)
def collision_analysis():
    vol10 = json.loads(text('shared/almanac-data/xiejibianfangshu-vol10-yiji.json'))
    v11 = json.loads(text('shared/almanac-data/xiejibianfangshu-yiji.json'))
    vocab = sorted({h for hs in v11['activityEntries'].values() for h in hs} | set(v11.get('entries', {})))
    norm = {'壞': '壊'}
    fold = lambda s: ''.join(norm.get(c, c) for c in s)
    groups = {}
    for h in vocab:
        groups.setdefault(fold(h), set()).add(h)
    lists = [e['avoid'] for e in vol10['entries']] + [x['avoid'] for e in vol10['entries'] for x in e.get('extraAvoid', [])]
    with_h = [s for s in lists if re.search('[壞壊]', s)]
    return {
        'version': 'g1-glyph-stage1-collision-v1',
        'fold': '壞 → 壊 only (the single NORM pair at issue)',
        'vol11VocabularyHeadings': len(vocab),
        'headingsContaining壞': sorted(h for h in vocab if '壞' in h),
        'headingsContaining壊': sorted(h for h in vocab if '壊' in h),
        'normalizedCollisions': {k: sorted(v) for k, v in groups.items() if len(v) > 1},
        'vol10ListsContaining': {'壞': sum('壞' in s for s in with_h), '壊': sum('壊' in s for s in with_h),
                                  'allInsideCompound': all(len(re.findall('[壞壊]', s)) == len(re.findall('破屋[壞壊]垣', s)) for s in with_h)},
        'rawSources': {Path(p).name: {'壞': text(p).count('壞'), '壊': text(p).count('壊'),
                                      'insideCompound': len(re.findall('破屋[壞壊]垣', text(p)))} for p, _, _ in SOURCES},
        'semanticCollisions': 0,
        'unrelatedActivitiesAffected': 0,
        'conclusion': 'current NORM collapses only 破屋壞垣/破屋壊垣 (one heading); no unexpected merge',
    }


# ---------------------------------------------------------------- production access matrix (§11A)
STATES = {
    'APPLIED': 'resolver reaches the heading and an approved cell is applied at runtime (identity ∧ authority ∧ production)',
    'UNREACHABLE_HEADING': 'cells may exist, but heading resolution cannot reach them (runtime: UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION; reaching it throws)',
    'EXCLUDED_PENDING_GLYPH_AUDIT': 'heading resolves; production deliberately keeps the legacy verdict pending glyph/identity/authority review (runtime status, per activity)',
    'EXCLUDED_PENDING_AUTHORITY': 'identity and reachability established; source-authorized cells incomplete or not representable (audit state; no runtime enum yet)',
    'NO_AUTHORITY_CELL': 'no approved cell for this activity/context (audit state; an APPLIED activity without a cell throws at import / on reach)',
    'NOT_APPLICABLE': 'the 劫煞 辰戌丑未 no-德 authority rule does not reach this activity (heading not in 劫煞 忌 list)',
}


def access_matrix():
    v1 = json.loads(text('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json'))
    v2 = json.loads(text('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json'))
    cand = json.loads(text(OUT / 'authority-candidate.json'))
    runtime_map = {'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION': 'UNREACHABLE_HEADING'}
    acts = {
        'contract': ('立劵交易', '立券交易'), 'transaction': ('立劵交易', '立券交易'),
        'demolition': ('破屋壞垣', '破屋壊垣'),
        'groundbreaking': ('興造動土', '興造動土'), 'wedding': ('嫁娶', '嫁娶'), 'medical': ('求醫療病', '求醫療病'),
    }

    def row(auth, a, src, rt):
        cov = auth['runtimeCoverage']['activities'].get(a)
        status = runtime_map.get(cov['status'], cov['status']) if cov else 'NOT_APPLICABLE'
        cells = sum(1 for r in auth['cells'].values() if a in r)
        reach = status != 'UNREACHABLE_HEADING'
        identity = a != 'demolition' or True  # G1-a owner acceptance 2026-10-24
        authority = cells == 16
        production = status == 'APPLIED'
        assert (status == 'APPLIED') == (identity and authority and production)
        return {'activity': a, 'sourceHeading': src, 'runtimeHeading': rt, 'resolverReachable': reach,
                'authorityCells': f'{cells}/16', 'identityApproved': identity, 'authorityApproved': authority,
                'productionApproved': production, 'access': status, 'runtimeStatus': cov['status'] if cov else None,
                **({'reason': cov['reason']} if cov and 'reason' in cov else {})}

    matrix_v1 = [row(v1, a, *h) for a, h in acts.items()]
    matrix_v2 = [row(v2, a, *h) for a, h in acts.items()]
    for r in matrix_v2:
        if r['activity'] == 'demolition':
            r['note'] = ('runtime status name predates the identity ruling: identity is now approved (G1-a), so the '
                         'semantic state is EXCLUDED_PENDING_AUTHORITY; the runtime string stays until a successor authority')
    ctx_rows = []
    for ctx, x in cand['contexts'].items():
        split = x['dateDependent']
        ctx_rows.append({
            'context': ctx, 'monthJian': x['monthJian'], 'dayPillar': x['dayPillar'],
            'sourceHeading': '破屋壞垣', 'resolverReachable': True,
            'authorityEvidence': x['mechanism'], 'witnessPage': x['witness']['page'],
            'proposedCell': ('blank (out of 土王用事) / avoid (in 土王用事)' if split else x['cellSoilAbsent']),
            'evidenceGrade': (f"{x['gradeSoilAbsent']} out / B in (2025–2027) / C in (outside)" if split else x['gradeSoilAbsent']),
            'identityApproved': True,
            'authorityApproved': False,
            'authorityEvaluated': ('UNRESOLVED_REPRESENTATION' if split else 'SUFFICIENT_FOR_OWNER_REVIEW'),
            'productionApproved': False,
            'currentAccess': 'EXCLUDED_PENDING_GLYPH_AUDIT',
            'candidateAccess': ('EXCLUDED_PENDING_AUTHORITY' if split else 'APPLIED (audit model only)'),
        })
    tsv = ['context\tmonthJian\tdayPillar\tsourceHeading\tresolverReachable\tproposedCell\tevidenceGrade\t'
           'identityApproved\tauthorityApproved\tproductionApproved\tcurrentAccess\tcandidateAccess']
    tsv += ['\t'.join(str(r[k]) for k in ('context', 'monthJian', 'dayPillar', 'sourceHeading', 'resolverReachable',
                                          'proposedCell', 'evidenceGrade', 'identityApproved', 'authorityApproved',
                                          'productionApproved', 'currentAccess', 'candidateAccess')) for r in ctx_rows]
    return {
        'version': 'g1-glyph-stage1-production-access-v1',
        'rule': 'APPLIED ⇔ identityApproved ∧ authorityApproved ∧ productionApproved; resolver reachable ≠ authority ≠ production',
        'states': STATES,
        'runtimeEnum': ['APPLIED', 'EXCLUDED_PENDING_GLYPH_AUDIT', 'UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION'],
        'runtimeGranularity': 'per activity (runtimeCoverage); cells per Month Jian + pillar; getVol10JieshaRuntime takes no date',
        'hashes': {p: sha(p) for p in ('shared/almanac-data/xieji-vol10-jiesha-authority-v1.json',
                                       'shared/almanac-data/xieji-vol10-jiesha-authority-v2.json',
                                       str(OUT / 'authority-candidate.json'))},
        'authorityVersions': {
            v1['version']: {'role': 'rollback (pre-G2)', 'matrix': matrix_v1},
            v2['version']: {'role': 'production', 'matrix': matrix_v2},
            'faithful-v3 (hypothetical)': 'exists only if the owner approves a demolition representation; v2 is never mutated',
        },
        'matrixA_currentProduction': matrix_v2,
        'matrixB_auditCandidate': {'note': 'audit evaluation only, not production authorization', 'contexts': ctx_rows},
        'matrixC_proposedStage2': {
            'default': 'demolition stays EXCLUDED (no APPLIED while 5 contexts are UNRESOLVED_REPRESENTATION)',
            'options': {
                'R1 soil-absent fit': 'v3 with all 16 cells (11 avoid, 5 blank); in-window 劫煞 忌 on 5 contexts not modelled (土王用事 itself still scores) → APPLIED 16/16 after owner ruling',
                'R2 date-aware cell': 'v3 + runtime API taking the 土王用事 flag; 5 contexts avoid in window, blank outside → APPLIED 16/16; requires runtime change and soil convention beyond 2025–2027 (C)',
                'R3 partial coverage': 'per-context coverage (11 APPLIED, 5 EXCLUDED_PENDING_AUTHORITY); requires runtime change (coverage is per activity today)',
                'R4 keep excluded': 'no change; rename to EXCLUDED_PENDING_AUTHORITY only in a future authority revision',
            },
        },
        'transitions': {
            'current': 'EXCLUDED_PENDING_GLYPH_AUDIT',
            'semanticNow': 'EXCLUDED_PENDING_GLYPH_AUDIT → EXCLUDED_PENDING_AUTHORITY (identity settled; no runtime change)',
            'ifR1orR2Approved': 'EXCLUDED_PENDING_GLYPH_AUDIT → APPLIED (faithful-v3, all 16 contexts)',
            'ifR3Approved': 'EXCLUDED_PENDING_GLYPH_AUDIT → APPLIED (11 contexts) + EXCLUDED_PENDING_AUTHORITY (5 contexts)',
            'ifR4': 'unchanged',
        },
        'failLoud': {
            'UNREACHABLE becomes reachable': 'throws `<id>: <activity> is UNREACHABLE… but was reached` (G2 test alias-v1)',
            'EXCLUDED becomes reachable': 'does NOT throw: legacy verdict kept + authorityExclusion stamped (deliberate, observable); demolition is already reachable today',
            'APPLIED without cells': 'validate() throws on import (mutation m-applied-no-cells)',
            'cells while EXCLUDED': 'validate() throws on import (mutation m-cells-while-excluded)',
            'coverage missing': 'getVol10JieshaRuntime throws on reach (mutation m-no-coverage)',
            'EXCLUDED_PENDING_AUTHORITY / NO_AUTHORITY_CELL': 'no runtime enum: an unknown status fails validate(); a missing APPLIED cell throws on reach',
            'recommendation': 'Stage 2 guard: an EXCLUDED activity must not silently keep legacy verdicts on an unbounded set — add a test pinning the exact set of excluded reaches (contexts × activity) so a NORM/alias change that widens it fails CI',
        },
        'tsv': 'production-access-matrix.tsv (matrix B, per context)',
    }, '\n'.join(tsv) + '\n'


def main():
    pam, pam_tsv = access_matrix()
    files = {
        'inventory.json': inventory(), 'source-evidence.json': source_evidence(),
        'glyph-analysis.json': glyph_analysis(), 'heading-provenance.json': heading_provenance(),
        'collision-analysis.json': collision_analysis(), 'production-access-matrix.json': pam,
    }
    texts = {k: json.dumps(v, ensure_ascii=False, indent=1) + '\n' for k, v in files.items()}
    texts['production-access-matrix.tsv'] = pam_tsv
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    c = files['collision-analysis.json']
    print('collisions', c['normalizedCollisions'], c['vol10ListsContaining'])


if __name__ == '__main__':
    main()

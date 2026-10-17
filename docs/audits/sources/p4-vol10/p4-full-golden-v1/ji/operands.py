"""Full Golden P4, task 3.2a: per-context operands for the P4-B 忌 layer (720 contexts).

Independent of the engine: reads authority JSON (pinned by SHA-256), the 3.1 presence Golden and the
locked raw volumes. No TypeScript, resolver or sweep TSV. Run from the repo root:

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/operands.py [--write]

Default verifies committed bytes. Other stages import this file by fixed path (see load()).
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/ji')
SRC = Path('docs/audits/sources/p4-vol10')
PRESENCE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/context.tsv')
BRIDGE = Path('shared/almanac-data/p4-vol10-context-bridge-v2.json')
CLAUSES = Path('shared/almanac-data/p4-vol10-named-clauses.json')
GOLDEN_BRIDGE = Path('shared/almanac-data/golden-p4-context-bridge-v2.json')
GOLDEN_CLAUSES = Path('shared/almanac-data/golden-p4-named-clauses.json')
VOL05 = SRC / 'vol05.raw.txt'
VOL06 = SRC / 'vol06.raw.txt'

STEMS = '甲乙丙丁戊己庚辛壬癸'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
MONTHS = '寅卯辰巳午未申酉戌亥子丑'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
OFFICERS = ['kien', 'tru', 'man', 'binh', 'dinh', 'chap', 'pha', 'nguy', 'thanh', 'thu', 'khai', 'be']
SUBJECTS = ['月建', '月破', '平日', '收日', '閉日', '刼煞', '災煞', '月煞', '月刑', '月害', '月厭', '大時', '天吏']
BY_OFFICER = {'kien': '月建', 'pha': '月破', 'binh': '平日', 'thu': '收日', 'be': '閉日'}
# Same-position gods from the 3.1 presence Golden (definitions: 災煞/月煞/月刑/月厭 = monthly sha).
BY_GOD = {'災煞': 'tai_sat', '月煞': 'nguyet_sat', '月刑': 'nguyet_hinh', '月害': 'nguyet_hai',
          '月厭': 'nguyet_yem', '大時': 'dai_thoi', '天吏': 'thien_lai'}
DE_FROM_PRESENCE = {'天赦': 'thien_xa', '天願': 'thien_nguyen', '月恩': 'nguyet_an', '四相': 'tu_tuong',
                    '時德': 'thoi_duc'}
DE_HE = ['天德', '月德', '天德合', '月德合']

# 卷五 quotes (verified below at runtime); 天德 trigram months (坤乾艮巽) match no day.
QUOTES5 = {
    '天德': '正月丁二月坤三月壬四月辛五月乾六月甲七月癸八月艮九月丙十月乙十一月巽十二月庚',
    '天德合': '正月壬三月丁四月丙六月巳七月戊九月辛十月庚十二月乙是也四仲之月天徳居四維故無合也',
    '月德': '月徳者正五九月在丙二六十月在甲三七十一月在壬四八十二月在庚',
    '月德合': '月徳合者正五九月在辛二六十月在巳三七十一月在丁四八十二月在乙',
}
TIANDE = '丁坤壬辛乾甲癸艮丙乙巽庚'
TIANDE_HE = {0: '壬', 2: '丁', 3: '丙', 5: '己', 6: '戊', 8: '辛', 9: '庚', 11: '乙'}  # 巳 read 己 (P5 basis)
YUEDE = '丙甲壬庚' * 3
YUEDE_HE = '辛己丁乙' * 3  # 巳 read 己 (P5 basis)
JIESHA = '亥申巳寅' * 3  # 卷06 「正月起亥逆行四孟」


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def officer(month, pillar):
    return OFFICERS[(BRANCHES.index(pillar[1]) - BRANCHES.index(month)) % 12]


def load_presence():
    rows = {}
    with PRESENCE.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            rows[(r['month_jian'], r['pillar'])] = set((r['dormant'] + ' ' + r['legacy']).split())
    assert len(rows) == 720
    return rows


def check_sources():
    vol5 = VOL05.read_text(encoding='utf-8')
    for q in QUOTES5.values():
        assert q in vol5, q[:12]
    vol6 = VOL06.read_text(encoding='utf-8')
    bridge = json.loads(BRIDGE.read_text(encoding='utf-8'))
    jie = next(s for s in bridge['subjects'] if s['han'] == '刼煞')['presence']
    assert jie['branchByMonthJian']['targets'] == JIESHA
    for s in jie['source']:
        assert vol6[s['offset']:s['offset'] + len(s['text'])] == s['text']
    assert [s['han'] for s in bridge['subjects']] == SUBJECTS
    return bridge


def build():
    bridge = check_sources()
    clauses = json.loads(CLAUSES.read_text(encoding='utf-8'))
    rules = clauses['pillarRules']
    edges = clauses['namedDeferrals']
    de_as_jian = {i for g in bridge['deAsJian'] for i in g['ruleIds']}
    presence = load_presence()

    out = {}
    for month in MONTHS:
        mi = MONTHS.index(month)
        for pillar in PILLARS:
            gods = presence[(month, pillar)]
            off = officer(month, pillar)
            present = [s for s in SUBJECTS if
                       (s in BY_OFFICER.values() and BY_OFFICER.get(off) == s)
                       or (s == '刼煞' and JIESHA[mi] == pillar[1])
                       or (s in BY_GOD and BY_GOD[s] in gods)]
            de = [g for g, ok in (('天德', TIANDE[mi] == pillar[0]), ('月德', YUEDE[mi] == pillar[0]),
                                  ('天德合', TIANDE_HE.get(mi) == pillar[0]), ('月德合', YUEDE_HE[mi] == pillar[0])) if ok]
            de += [g for g, gid in DE_FROM_PRESENCE.items() if gid in gods]
            matched = [r for r in rules if {'monthJian': month, 'pillar': pillar} in r['contexts']]
            deferrals = {}
            for s in present:
                path, status = [s], 'no_named_deferral'
                while True:
                    step = [e for e in edges if e['subject'] == path[-1] and month in e['months']]
                    assert len(step) <= 1
                    if not step:
                        break
                    target = step[0]['target']
                    if target not in present:
                        status = 'target_absent'
                        break
                    if target in path:
                        status = 'cycle'
                        break
                    path.append(target)
                    status = 'named_deferral'
                deferrals[s] = {'status': status, 'path': path, 'terminal': path[-1]}
            out[(month, pillar)] = {
                'officer': off, 'present': present, 'de': de,
                'pillarRuleIds': [r['id'] for r in matched],
                'ignoredVirtueGroups': [r['ignoredVirtueGroup'] for r in matched if r['ignoredVirtueGroup']],
                'deAsJianRuleIds': [r['id'] for r in matched if r['id'] in de_as_jian],
                'deferrals': deferrals,
                'terminals': list(dict.fromkeys(d['terminal'] for d in deferrals.values())),
            }
    return out


def self_check(ctx):
    for case in json.loads(GOLDEN_BRIDGE.read_text(encoding='utf-8'))['cases']:
        got = ctx[(case['monthJian'], case['pillar'])]
        for key in ('officer', 'present', 'pillarRuleIds', 'ignoredVirtueGroups', 'deAsJianRuleIds', 'deferrals'):
            assert got[key] == case[key], (case['monthJian'] + case['pillar'], key, got[key], case[key])
        assert sorted(got['terminals']) == sorted(case['terminals']), case
    gc = json.loads(GOLDEN_CLAUSES.read_text(encoding='utf-8'))['pillarCases']
    for case in gc:
        assert ctx[(case['monthJian'], case['pillar'])]['pillarRuleIds'] == case['expectedRuleIds'], case
    # Invariants: every deferral ends at a present terminal; no cycles or absent targets in real data.
    for d in ctx.values():
        for x in d['deferrals'].values():
            assert x['status'] in ('named_deferral', 'no_named_deferral'), x
    return len(json.loads(GOLDEN_BRIDGE.read_text(encoding='utf-8'))['cases']), len(gc)


def rows(ctx):
    head = ['id', 'month_jian', 'pillar', 'officer', 'present', 'de', 'pillar_rules', 'ignored_virtue_groups',
            'de_as_jian', 'deferrals']
    lines = ['\t'.join(head)]
    for (m, p), d in ctx.items():
        defer = ' '.join('>'.join(x['path']) for x in d['deferrals'].values() if len(x['path']) > 1)
        lines.append('\t'.join([f'{m}-{p}', m, p, d['officer'], ' '.join(d['present']), ' '.join(d['de']),
                                ' '.join(d['pillarRuleIds']), ' '.join(d['ignoredVirtueGroups']),
                                ' '.join(d['deAsJianRuleIds']), defer]))
    return '\n'.join(lines) + '\n'


def files():
    ctx = build()
    n_bridge, n_clauses = self_check(ctx)
    edges = sum(len(x['path']) > 1 for d in ctx.values() for x in d['deferrals'].values())
    summary = {
        'stage': '3.2a operands',
        'inputs': {str(p): sha256(p) for p in [PRESENCE, BRIDGE, CLAUSES, GOLDEN_BRIDGE, GOLDEN_CLAUSES, VOL05, VOL06]},
        'contexts': len(ctx),
        'namedDeferralEdges': edges,
        'subjectsWithoutEdge': sum(len(x['path']) == 1 for d in ctx.values() for x in d['deferrals'].values()),
        'pillarRuleContexts': sum(bool(d['pillarRuleIds']) for d in ctx.values()),
        'deAsJianContexts': sum(bool(d['deAsJianRuleIds']) for d in ctx.values()),
        'checks': {'goldenContextBridgeV2': n_bridge, 'goldenNamedClausePillars': n_clauses},
    }
    return {OUT / 'operands.tsv': rows(ctx),
            OUT / 'operands-summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


def main():
    fs = files()
    if '--write' in sys.argv:
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()

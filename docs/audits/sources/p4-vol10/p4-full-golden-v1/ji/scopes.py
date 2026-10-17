"""Full Golden P4, task 3.2b: per-subject 卷十 scopes (13 subjects + 又為 aliases) for 720 contexts.

Independent of the engine. Inputs: 3.2a operands (loaded by fixed path), the 卷十 entry artifact,
grade/heading/youwei/deferral authority JSON. Owner decision H2-A (2026-10-17) is applied here:
天願 ∈ 德願, so 「亦不從德願所宜」 removes 天願 from a clause's named 德 group.

Output is per-scope facts, not day states: day composition, H1-B and propagation are task 3.2c/3.3.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/scopes.py [--write]
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/ji')
_spec = importlib.util.spec_from_file_location('operands', HERE / 'operands.py')
op = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(op)

VOL10 = Path('shared/almanac-data/xiejibianfangshu-vol10-yiji.json')
VOL11 = Path('shared/almanac-data/xiejibianfangshu-yiji.json')
GRADE = Path('shared/almanac-data/p4-vol10-grade-resolution-v2.json')
ANNOT = Path('shared/almanac-data/p4-vol10-heading-annotation.json')
YOUWEI = Path('shared/almanac-data/p4-vol10-youwei-scopes.json')
COVER = Path('shared/almanac-data/p4-vol10-deferral-coverage-v3.json')
G_GRADE = Path('shared/almanac-data/golden-p4-grade-resolution.json')
G_ANNOT = Path('shared/almanac-data/golden-p4-heading-annotation-v2.json')
G_YOUWEI = Path('shared/almanac-data/golden-p4-youwei-scopes-v2.json')

VARIANTS = str.maketrans({'劵': '券', '壞': '壊', '宫': '宮', '㑹': '會', '產': '産', '啟': '啓', '葢': '蓋',
                          '醖': '醞', '册': '冊', '徳': '德', '夘': '卯', '廻': '迴'})
# 卷十一 用事 headings as 卷十 lists combine them (御用六十七事 merged into the compound forms the lists use).
VOCAB = ('祭祀 祈福 求嗣 上冊進表章 頒詔 覃恩肆赦 施恩封拜 詔命公卿 招賢 舉正直 施恩惠恤孤惸 宣政事 布政事 '
         '行惠愛雪寃枉緩刑獄 慶賜賞賀 宴會 入學 冠帶 行幸遣使 安撫邊境 選將訓兵 出師 上官赴任 臨政親民 結婚姻 '
         '納采問名 嫁娶 進人口 般移 遠迴 安牀 解除 沐浴 整容剃頭 整手足甲 求醫療病 療目 針刺 裁製 營建宮室 修宮室 '
         '繕城郭 築隄防 興造動土 豎柱上梁 修倉庫 鼓鑄 苫蓋 經絡 醞釀 開市 立券交易 納財 開倉庫出貨財 修置産室 '
         '開渠穿井 安碓磑 補垣塞穴 掃舍宇 修飾垣墻 平治道塗 破屋壊垣 伐木 捕捉 畋獵 取魚 乘船渡水 栽種 牧養 納畜 '
         '破土 安葬 啓攢 修築園圃').split()
ALIASES = {'補垣': ['補垣塞穴'], '宣布政事': ['宣政事', '布政事'], '求醫療目': ['療目'], '補捉': ['捕捉']}
STILL_AVOID_EXTRA = ['解除', '求醫療病', '破屋壊垣']  # 月破 子午未申: 「仍忌解除求醫療病破屋壞垣」 (PR #49 reading)
STILL_AVOID_MONTHS = '子午未申'
EFFECTS = {'only_avoid', 'as_usual', 'still_avoid', 'cancel_both', 'avoid_all'}


def norm(s):
    return s.translate(VARIANTS)


def split(text):
    s, out, i = norm(text), [], 0
    keys = sorted(set(VOCAB) | set(ALIASES), key=len, reverse=True)
    while i < len(s):
        hit = next((k for k in keys if s.startswith(norm(k), i)), None)
        assert hit, f'unrecognised heading text: {s[i:i + 8]}'
        out += ALIASES.get(hit, [norm(hit)])
        i += len(norm(hit))
    return out


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def load_entries():
    vol10 = json.loads(VOL10.read_text(encoding='utf-8'))
    grade = json.loads(GRADE.read_text(encoding='utf-8'))
    annot = json.loads(ANNOT.read_text(encoding='utf-8'))
    youwei = json.loads(YOUWEI.read_text(encoding='utf-8'))
    separate = {a['alias'] for a in youwei['aliases'] if a['status'] != 'base'}
    raw = {e['id']: e for e in vol10['entries']}
    entries = {}
    for e in vol10['entries']:
        src = raw[e['avoidSameAs']] if e.get('avoidSameAs') else e
        base = [(None, h) for h in split(src['avoid'])]
        for x in e.get('extraAvoid', []):
            if x['as'] not in separate:  # 死神 and 正月建日 stay in the base list
                base += [(x.get('months'), h) for h in split(x['avoid'])]
        entries[e['han']] = {'base': base, 'notAvoid': split(src.get('notAvoid') or ''), 'clauses': e['clauses']}
    lists = {x['entry']: x for x in annot['entryLists']}
    for e in grade['entries']:
        L = lists[e['id']]
        avoid = L['avoid']  # already the read forms (修置産室, 冠帶); readings are provenance only
        stops = {m: split(v) for k, v in L['stopLists'].items() for m in k}
        clauses = [dict(c, list=None) if c['effect'] != 'only_avoid' else dict(c, stopByMonth=stops)
                   for c in e['clauses']]
        entries[e['han']] = {'base': [(None, h) for h in split(avoid)], 'notAvoid': split(L.get('notAvoid') or ''),
                             'clauses': clauses}
    assert set(entries) == set(op.SUBJECTS)
    aliases = []
    for a in youwei['aliases']:
        if a['status'] == 'base':
            continue
        text = a['source']['text']
        body = text.split('忌', 1)[1] if '專忌' not in text else text.split('專忌', 1)[1]
        aliases.append({'alias': a['alias'], 'parent': a['parent'], 'status': a['status'],
                        'protected': bool(a.get('protected')), 'headings': split(body)})
    return entries, aliases, youwei


def base_list(entry, month):
    return list(dict.fromkeys(h for months, h in entry['base'] if not months or month in months))


def clause_for(entry, month):
    hits = [c for c in entry['clauses'] if c['effect'] != 'defer' and (c['months'] == '*' or month in c['months'])]
    specific = [c for c in hits if c['months'] != '*']
    return (specific or hits or [None])[0]


def named_group(clause, ctx):
    """Named 德 gods of the clause present today, after pillar overrides; None = undetermined."""
    named = [g for g in clause.get('with') or [] if g in ctx['de']]
    rules = set(ctx['pillarRuleIds'])
    if ctx['deAsJianRuleIds'] or 'yang_no_de_he' in rules or 'yin_no_de_he' in rules:
        if any(g in op.DE_HE for g in named):
            named = [g for g in named if g not in op.DE_HE]
    if '德願' in ctx['ignoredVirtueGroups']:
        # H2-A: 天願 ∈ 德願. Membership of the other gods stays unknown: if one is still named, undetermined.
        named = [g for g in named if g != '天願']
        if any(g in op.DE_HE or g == '天赦' for g in named):
            return None
    return named


def resolve_entry(han, month, ctx, entries):
    """Heading → (state, stop) for the entry's own clause in this month."""
    e = entries[han]
    c = clause_for(e, month)
    assert c, (han, month)
    named = named_group(c, ctx)
    if named is None:
        return {'effect': 'undetermined', 'named': [], 'headings': {}}
    effect = c['effect'] if not c.get('with') or named else c.get('otherwise', 'as_usual')
    assert effect in EFFECTS, effect
    base = base_list(e, month)
    heads = {}
    if effect == 'avoid_all':
        heads = {h: 'only_ji' for h in VOCAB}
    elif effect == 'as_usual':
        heads = {h: 'only_ji' for h in base}
    elif effect == 'cancel_both':
        heads = {h: 'neither_recorded' for h in base}
    elif effect == 'still_avoid':
        not_av = split(c.get('notAvoid') or '')
        extra = STILL_AVOID_EXTRA if month in STILL_AVOID_MONTHS and c['months'] != '*' else []
        heads = {h: 'only_ji' for h in base + extra if h not in not_av}
        heads.update({h: 'not_avoided' for h in not_av})
    elif effect == 'only_avoid':
        stop = split(c['list']) if c.get('list') else c['stopByMonth'][month]
        heads = {h: 'stop' if h in stop else 'lifted' for h in base}
        heads.update({h: 'stop' for h in stop})
    if effect != 'still_avoid':
        for h in e['notAvoid']:
            heads.setdefault(h, 'not_avoided')
    return {'effect': effect, 'named': named, 'headings': heads}


def build():
    entries, aliases, _ = load_entries()
    ctxs = op.build()
    out = {}
    for (month, pillar), ctx in ctxs.items():
        scopes = {}
        for s, d in ctx['deferrals'].items():
            t = d['terminal']
            r = resolve_entry(t, month, ctx, entries)
            uncovered = []  # A05: subject base headings outside the target's base list
            if t != s and r['effect'] != 'undetermined':
                tb = set(base_list(entries[t], month))
                uncovered = [h for h in base_list(entries[s], month) if h not in tb]
            heads = dict(r['headings'])
            for h in uncovered:
                if heads.get(h) != 'only_ji':  # covered only if the target's resolution already gives only_ji
                    heads[h] = 'undetermined'
            scopes[s] = {'owner': t, 'effect': r['effect'], 'named': r['named'], 'headings': heads,
                         'uncovered': uncovered}
        youwei = {a['alias']: {'parent': a['parent'], 'status': a['status'], 'protected': a['protected'],
                               'headings': {h: 'only_ji' for h in a['headings']}}
                  for a in aliases if a['parent'] in ctx['present']}
        out[(month, pillar)] = {'ctx': ctx, 'scopes': scopes, 'youwei': youwei}
    return out


def annotate(state, yi):
    """A04a heading state from a scope fact and caller 宜 (True/False/None)."""
    if state == 'stop':
        return 'both_present' if yi else 'undetermined' if yi is None else 'only_ji'
    if state == 'lifted':
        return 'only_yi' if yi else 'undetermined'
    return state


def self_check(res):
    for case in json.loads(G_GRADE.read_text(encoding='utf-8'))['cases']:
        r = res[(case['monthJian'], case['pillar'])]
        for subj, exp in case['subjects'].items():
            got = r['scopes'][subj]
            if exp.get('status') == 'no_grid_column':  # grade-only fact (月建/月破); scope checked via A04a
                continue
            assert got['owner'] == exp['clauseOwner'], (case['note'], subj)
            if exp.get('status') == 'undetermined':
                assert got['effect'] == 'undetermined', (case['note'], subj)
                continue
            assert got['effect'] == exp['clauseEffect'], (case['note'], subj, got['effect'], exp['clauseEffect'])
            assert got['named'] == exp['dePresentIds'], (case['note'], subj, got['named'], exp['dePresentIds'])
    exceptions = []
    for case in json.loads(G_ANNOT.read_text(encoding='utf-8'))['cases']:
        r = res[(case['monthJian'], case['pillar'])]
        for subj, exp in case['scopes'].items():
            got = r['scopes'][subj]
            if exp.get('status') == 'undetermined' and case['monthJian'] + case['pillar'] == '未戊午':
                # Superseded by owner decision H2-A (2026-10-17): 天願 leaves the named group → 如常例.
                assert got['effect'] == 'as_usual' and got['named'] == [], (subj, got['effect'])
                exceptions.append({'golden': G_ANNOT.name, 'case': '未戊午', 'scope': subj,
                                   'frozen': 'undetermined', 'now': 'as_usual', 'reason': 'OWNER_DECISION H2-A'})
                continue
            assert got['effect'] == exp['clauseEffect'] and got['owner'] == exp['owner'], (case['note'], subj)
            for h, st in exp['headings'].items():
                g = annotate(got['headings'].get(norm(h), 'not_listed'), case['yi'].get(h))
                assert g == st, (case['note'], subj, h, g, st)
    for case in json.loads(G_YOUWEI.read_text(encoding='utf-8'))['cases']:
        r = res[(case['monthJian'], case['pillar'])]
        assert set(r['youwei']) == set(case['youwei']), (case['note'], set(r['youwei']))
        for a, exp in case['youwei'].items():
            for h, st in exp['headings'].items():
                assert r['youwei'][a]['headings'].get(norm(h), 'not_listed') == st, (case['note'], a, h)
        for subj, exp in case.get('scopes', {}).items():
            got = r['scopes'][subj]
            for h, st in exp['headings'].items():
                assert annotate(got['headings'].get(norm(h), 'not_listed'), None) == st, (case['note'], subj, h)
            if 'uncoveredByDeferral' in exp:
                assert got['uncovered'] == [norm(h) for h in exp['uncoveredByDeferral']], (case['note'], got['uncovered'])
    cover = json.loads(COVER.read_text(encoding='utf-8'))
    edge_of = {e['id']: e for e in json.loads(op.CLAUSES.read_text(encoding='utf-8'))['namedDeferrals']}
    for eid, exp in cover['expectedUncovered'].items():
        e = edge_of[eid]
        seen = set()
        for (m, p), r in res.items():
            sc = r['scopes'].get(e['subject'])
            if sc and m in exp['months'] and sc['owner'] == e['target']:
                seen |= {h for h in sc['uncovered'] if sc['headings'][h] == 'undetermined'}
        want = set() if exp.get('resolvedCovered') else {norm(h) for h in exp['headings']}
        assert seen == want, (eid, seen, want)
    return exceptions


def tsv(res):
    lines = ['\t'.join(['id', 'scope', 'kind', 'owner', 'effect', 'named', 'heading', 'state'])]
    for (m, p), r in res.items():
        for s, sc in r['scopes'].items():
            if not sc['headings']:
                lines.append('\t'.join([f'{m}-{p}', s, 'subject', sc['owner'], sc['effect'], ' '.join(sc['named']), '', '']))
            for h, st in sc['headings'].items():
                lines.append('\t'.join([f'{m}-{p}', s, 'subject', sc['owner'], sc['effect'], ' '.join(sc['named']), h, st]))
        for a, y in r['youwei'].items():
            kind = 'youwei_zhuanji' if y['protected'] else 'youwei_convention'
            for h, st in y['headings'].items():
                lines.append('\t'.join([f'{m}-{p}', a, kind, y['parent'], 'only_ji', '', h, st]))
    return '\n'.join(lines) + '\n'


def files():
    res = build()
    exceptions = self_check(res)
    from collections import Counter
    effects = Counter(sc['effect'] for r in res.values() for sc in r['scopes'].values())
    states = Counter(st for r in res.values() for sc in r['scopes'].values() for st in sc['headings'].values())
    summary = {
        'stage': '3.2b scopes',
        'ownerDecisions': {'H2-A': '天願 ∈ 德願; 德願 rule removes 天願 from the named group (2026-10-17)'},
        'inputs': {str(p): sha256(p) for p in [HERE / 'operands.py', VOL10, VOL11, GRADE, ANNOT, YOUWEI, COVER,
                                               G_GRADE, G_ANNOT, G_YOUWEI]},
        'subjectScopes': sum(effects.values()), 'effects': dict(sorted(effects.items())),
        'headingStates': dict(sorted(states.items())),
        'undeterminedScopes': [k[0] + k[1] for k, r in res.items() for sc in r['scopes'].values() if sc['effect'] == 'undetermined'],
        'youweiScopes': sum(len(r['youwei']) for r in res.values()),
        'goldenExceptions': exceptions,
        'uncoveredOpenRows': sum(st == 'undetermined' for r in res.values() for sc in r['scopes'].values()
                                 for h, st in sc['headings'].items() if h in sc['uncovered']),
    }
    return {HERE / 'scopes.tsv': tsv(res), HERE / 'scopes-summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


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

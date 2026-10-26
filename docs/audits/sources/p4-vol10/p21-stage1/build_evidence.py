"""P21 Stage 1: authority reconstruction for puzhu:21 不註 scope (audit only).

Run from the repo root, after the projection dump:
  P21_DUMP=1 npx vitest run shared/lunar/p4P21Stage1Projection.test.ts
  python3 -I docs/audits/sources/p4-vol10/p21-stage1/build_evidence.py
Writes evidence.json and lock.json. Witness pages are referenced by path and hash, never copied.
"""
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
VOL10 = P + 'vol10.raw.txt'
H1B = P + 'h1b-yuebiao-witness-v1/lock.json'
PROJECTION = os.path.join(HERE, 'projection.json')
HARNESS = 'shared/lunar/p4P21Stage1Projection.test.ts'
FAITHFUL = 'shared/almanac-data/xieji-vol10-jiesha-authority-v4.json'
PUZHU06 = 'shared/almanac-data/p4b-puzhu06-v5.json'
COMPOSITION = 'shared/almanac-data/p4-vol10-day-composition-v2.json'
OWNER_RULES = 'shared/lunar/p4OwnerRules.ts'

# 鋪註 lines quoted by offset; each is checked against vol10.raw.txt.
TEXTS = {
    'puzhu:05': (21790, '凡吉凶相抵不註宜亦不註忌者如遇徳猶忌之事則仍註忌'),
    'puzhu:06': (21817, '凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌'),
    'puzhu:17': (22146, '凡吉凶相抵不註忌嫁娶亦不註忌冠帶結婚姻納采問名進人口般移安牀如遇徳猶忌之日則仍註忌遇不將而不註忌嫁娶者亦仍註忌遇亥日厭對八專四忌四窮而仍註忌嫁娶者止註所忌之事其不忌者仍不註忌'),
    'puzhu:20': (22313, '凡吉凶相抵不註忌修造動土豎柱上梁亦不註忌修宫室繕城郭築隄防修倉庫鼓鑄苫葢修置産室開渠穿井安碓磑補垣塞穴修飾垣牆平治道塗破屋壊垣如遇徳猶忌之日則仍註忌'),
    'puzhu:21': (22390, '凡吉凶相抵不註忌開市亦不註忌立劵交易納財不註忌納財亦不註忌開市立劵交易不註忌立劵交易亦不註忌開市納財'),
    'puzhu:22': (22443, '凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌'),
}

# Stored 月表 pages (h1b lock) touching a divergent propagation cell. premise = the trigger is printed
# unnoted (else the page cannot test the scope of the propagated 不註); outcome per reading on the target.
PAGES = {
    # context: (line, trigger(s), target, independent 忌, trigger printed?, target printed?, note)
    '未-戊申': ('puzhu:21', ['納財'], '立券交易', ['五離'], True, True,
                '納財 printed: the page itself never fires puzhu:21; owner LOCAL ruling (page wrong on 納財) '
                'does not say whether the error is in computation or typesetting'),
    '未-壬申': ('puzhu:21', ['開市', '納財'], '立券交易', ['五離'], True, True,
                'triad printed; faithful v4 opening/finance = avoid, so the trigger exists only in the P4 '
                'cancel_both layer (P4-劫)'),
    '未-丙申': ('puzhu:21', ['開市', '納財'], '立券交易', ['五離'], True, True, 'as 未-壬申'),
    '未-庚申': ('puzhu:21', ['開市', '納財'], '立券交易', ['五離'], True, True, 'as 未-壬申 (+八專)'),
    '亥-辛酉': ('puzhu:16/17', ['結婚姻', '嫁娶'], '結婚姻/納采問名', ['五離'], True, True,
                '災煞 page; triggers printed, 災煞 相抵 not applied as modelled (X相抵)'),
    '戌-乙亥': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, True,
                'triggers unnoted, target printed: against H1 unless 五虛 is 專忌'),
    '戌-丁亥': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, True, 'as 戌-乙亥'),
    '戌-己亥': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, True, 'as 戌-乙亥'),
    '戌-癸亥': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, True,
                '四相 day: triad absence also explained by puzhu:06; SOURCE_AMBIGUOUS (H1-B review)'),
    '辰-己巳': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, False,
                'triggers unnoted, target absent: consistent with H1 (faithful F1 table)'),
    '辰-辛巳': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, False, 'as 辰-己巳'),
    '辰-癸巳': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, False, 'as 辰-己巳'),
    '辰-乙巳': ('puzhu:22', ['開市', '立券交易'], '開倉庫出貨財', ['五虛'], False, False, 'as 辰-己巳'),
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for pid, (off, text) in TEXTS.items():
        assert raw[off:off + len(text)] == text, pid
    proj = json.load(open(PROJECTION, encoding='utf-8'))
    h1b = {f"{p['monthJian']}-{p['pillar']}": p for p in json.load(open(H1B, encoding='utf-8'))['pages']}
    faithful = json.load(open(FAITHFUL, encoding='utf-8'))['cells']

    ctx = [c for c in proj['contextLevel']['cells'] if c['line'] == 'puzhu:21']
    dated = [c for c in proj['dated2025_2027']['cells'] if c['line'] == 'puzhu:21']
    assert {c['heading'] for c in ctx + dated} == {'立券交易'}
    assert all(c['independent'] == ['五離'] and c['h1'] == 'neither_recorded' and c['h2'] == 'only_ji'
               for c in ctx + dated)
    # Y-CONVENTION boundary: no H2 row reaches both_present (立券交易 has no 宜 on any affected cell).
    assert not [c for c in ctx + dated if c['h2'] == 'both_present']

    premise = {}
    for c in ctx:
        m, p = c['context'].split('-')
        cell = faithful.get(m + p)
        trig = next(iter(c['triggerXiangdi'].values()))
        if cell is None:
            premise[c['context']] = {
                'xiangdiGod': trig, 'faithfulCell': None,
                'status': 'UNAUDITED: 災煞 相抵 outside the 劫煞 faithful table (X相抵 open)'}
        else:
            fin = cell['finance']
            premise[c['context']] = {
                'xiangdiGod': trig,
                'faithfulCell': {k: cell[k] for k in ('finance', 'opening', 'contract')},
                'status': ('SETTLED_BY_LOCAL_OWNER_RULING (未-戊申 納財; G2/W1 D1(a))' if fin == 'blank'
                           else 'P4_LAYER_ONLY: faithful 卷十 keeps 劫煞 忌 on the trigger (P4-劫)')}

    witnesses = []
    for context, (line, trig, target, indep, trig_printed, target_printed, note) in PAGES.items():
        pg = h1b[context]
        if line == 'puzhu:22':
            # A trigger left unnoted by another rule (puzhu:06 on a 四相 day) does not test the 相抵 line.
            discriminating = not trig_printed and 'SOURCE_AMBIGUOUS' not in note
            fits = ('H2' if target_printed else 'H1') if discriminating else 'NONE'
        else:
            discriminating, fits = False, 'NONE'
        witnesses.append({
            'context': context, 'line': line, 'page': pg['path'], 'sha256': pg['sha256'],
            'jiShen': pg['jiShen'], 'xiongShen': pg['xiongShen'], 'jiLine': pg['jiLine'],
            'triggers': trig, 'target': target, 'independentJi': indep,
            'triggerPrinted': trig_printed, 'targetPrinted': target_printed,
            'discriminating': discriminating, 'fits': fits, 'level': 'A', 'note': note})
        assert all((t in pg['jiLine']) == trig_printed for t in trig if line != 'puzhu:16/17'), context

    evidence = {
        'audit': 'P21',
        'stage': 1,
        'question': 'heading-wide-vs-contribution-scoped',
        'hypotheses': {
            'H1': 'heading-wide suppression (= engine N-A: every unprotected 忌 on the target withheld)',
            'H2': "contribution-scoped suppression (= N-C: only the 忌 of the trigger's 相抵 gods withheld)",
        },
        'productionAuthority': 'p4b-puzhu06-v5',
        'sourceTexts': {k: {'offset': o, 'text': t} for k, (o, t) in TEXTS.items()},
        'naNc': {
            'origin': 'audit-internal labels, p4-weishen-nacai-puzhu21.md N2 (2026-10-22); not source terms',
            'N-A': {'implemented': True, 'where': OWNER_RULES + ' propagation pass: target ji=false unless protectedJi'},
            'N-C': {'implemented': False, 'where': 'projection only (this harness)'},
            'engineCarveOut': 'protected 忌 (專忌/百忌/止忌/dated) blocks every line, puzhu:21 included, '
                              'although only puzhu:22 states a 專忌 exception: implementation convention',
            'triggerState': "engine fires on any neither_recorded (相抵 or E1 不註); every puzhu:21 cell here "
                            'has a 相抵 god on its trigger',
        },
        'affectedCells': {
            'contextLevel': ctx, 'dated2025_2027': dated,
            'summary': {'contextLevel': proj['contextLevel']['byLine']['puzhu:21'],
                        'dated2025_2027': proj['dated2025_2027']['byLine']['puzhu:21']},
        },
        'divergentCells': [c['context'] for c in ctx],
        'triggerPremise': premise,
        'analogousPatterns': {
            'projectionByLine': {'contextLevel': proj['contextLevel']['byLine'],
                                 'dated2025_2027': proj['dated2025_2027']['byLine']},
            'witnesses': witnesses,
            'puzhu22Tally': {
                'fitsH1': [w['context'] for w in witnesses if w['fits'] == 'H1'],
                'fitsH2': [w['context'] for w in witnesses if w['fits'] == 'H2'],
                'nonDiscriminating': [w['context'] for w in witnesses if w['fits'] == 'NONE'],
            },
            'puzhu06': 'n14 戌-壬申 / n62 戌-庚申 (F1 Stage 2): 「…日不註忌…立劵交易」 leaves 五離 printed; '
                       'read as lex specialis (五離 own lifter list), trigger is not 相抵 and the line carries '
                       'its own exceptions: analogue only',
            'puzhu17': 'n81 / n117: trigger 嫁娶 absent, targets printed, explained by the 不將 exception '
                       '(P17-A), not by scope: non-discriminating',
            'puzhu05H1B': 'same-heading 相抵 is modelled contribution-scoped (owner rule H1-B; 德-lift '
                          'sub-class SOURCE_WITNESSED, 相抵 sub-class OWNER_ADOPTED_SOURCE_DEPENDENT): '
                          'semantic overlap, not puzhu:21 evidence',
            'exceptionClauses': {
                'puzhu:17/19/20': '如遇徳猶忌之日則仍註忌',
                'puzhu:22': '如遇專忌之日則仍註忌 (專忌 = 百忌 day taboo, owner convention; '
                            'redundant under H2 if 專忌 is an independent source: points to H1)',
                'puzhu:21': 'none',
            },
        },
        'evidenceLevels': {
            'A': ['vol10.raw.txt puzhu:05/06/17/20/21/22 at verified offsets',
                  '13 scan-locked 月表 pages (h1b-yuebiao-witness-v1)'],
            'B': ['xieji-vol10-jiesha-authority-v4 cells', 'projection.json (H1/H2 over the P4 layer)'],
            'C': ['p4OwnerRules.ts propagation (N-A + protection carve-out)', 'Golden v2+ P4 rows'],
            'D': ['p4-weishen-nacai-puzhu21.md N2', 'G2 n117 Stage 2 §6–7', 'F1 Stage 2/3 notes',
                  'faithful study F1 (SOURCE_DEPENDENT)', 'LOCAL owner rulings (納財, D1(a))'],
        },
        'dependencies': {
            'G2/W1': 'DATA OVERLAP (未-戊申 劫煞 × 立券交易 cell blank under H1 and H2; not reopened)',
            'Q4a/五墓': 'NONE',
            'Q4-REST (九空/五虛/小耗)': 'NONE (no puzhu:21 cell carries them)',
            '五離 F1 R2 + R-F1Y': "SEMANTIC OVERLAP (五離 is every cell's independent 忌; R2 keeps it at "
                                 'puzhu:06, puzhu:21 N-A removes it after)',
            'Y-CONVENTION': 'NONE (H2 never yields both_present on the affected set)',
            'BAIJI-Y': 'NONE',
            'U4/U7': 'NONE',
            'P4-劫': 'AUTHORITY DEPENDENCY (trigger premise of 未-壬申/丙申/庚申 exists only under P4 cancel_both)',
            'X相抵 (災煞)': 'AUTHORITY DEPENDENCY (trigger premise of 亥-丁酉/癸酉)',
            'H1-B': 'SEMANTIC OVERLAP (same scope question at puzhu:05)',
        },
        'conclusion': 'UNDERDETERMINED',
        'conclusionBasis': [
            'puzhu:21 text names headings, not gods, and has no exception clause: scope not stated',
            'no stored page realises a source-level puzhu:21 trigger with an independent 忌 on the target',
            'same-system analogue puzhu:22 is split: 戌-乙亥/丁亥/己亥 fit H2, 辰-己巳/辛巳/癸巳/乙巳 fit H1',
            'textual exception argument (puzhu:22 專忌) points to H1; puzhu:06 n14/n62 lex specialis to H2',
            'only 未-戊申 has a settled trigger premise, and it rests on a LOCAL owner ruling over its page',
        ],
        'productionChanged': False,
    }
    out = os.path.join(HERE, 'evidence.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, ensure_ascii=False, indent=1)
        f.write('\n')
    files = [out, PROJECTION, os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL10, H1B, FAITHFUL,
             PUZHU06, COMPOSITION, OWNER_RULES] + [w['page'] for w in witnesses]
    with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'p21-stage1-v1', 'files': {p: sha(p) for p in files}}, f, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()

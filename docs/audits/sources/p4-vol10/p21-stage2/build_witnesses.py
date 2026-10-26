"""P21 Stage 2: witness classification, conclusion and lock (audit only).

Run from the repo root, after predictions.json was committed and the two new pages were fetched:
  P21S2_IMPACT_DUMP=1 npx vitest run shared/lunar/p4P21Stage2Impact.test.ts
  python3 -I docs/audits/sources/p4-vol10/p21-stage2/build_witnesses.py
Writes witnesses.json, conclusion.json and lock.json. Pages are read by eye from the stored JPGs (no OCR).
"""
import glob
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
YIJI = 'shared/almanac-data/xiejibianfangshu-yiji.json'
VOL10 = P + 'vol10.raw.txt'
FETCH = 'curl --fail -L, 2026-10-26, https://archive.org/download/06067696.cn/page/<leaf>_w1200.jpg; image unmodified'

# New pages, fetched after predictions.json (fd11bd2). Transcribed by eye at full resolution.
NEW = {
    '06067696-n82.jpg': {'context': '亥-癸酉', 'header': '癸酉劒鋒金義開日', 'officer': '開',
                         'jiShen': ['母倉', '時陽', '生氣', '聖心', '除神', '鳴吠'],
                         'xiongShen': ['災煞', '天火', '五離', '朱雀'],
                         'yiLine': '祭祀入學沐浴掃舍宇',
                         'jiLine': '會親友冠帶結婚姻納采問名嫁娶進人口求醫療病經絡醞釀立券交易伐木畋獵取魚'},
    '06067696-n106.jpg': {'context': '亥-丁酉', 'header': '丁酉山下火制開日', 'officer': '開',
                          'jiShen': ['母倉', '時陽', '生氣', '聖心', '除神', '鳴吠'],
                          'xiongShen': ['災煞', '天火', '五離', '朱雀'],
                          'yiLine': '祭祀入學沐浴掃舍宇',
                          'jiLine': '會親友冠帶結婚姻納采問名嫁娶進人口剃頭求醫療病經絡醞釀立券交易伐木畋獵取魚'},
}

# (page, line, trigger, target, independent 忌, classification, reason). Fields not given are read from the page.
WITNESSES = [
    ('06067696-n82.jpg', 'puzhu:21', '開市 (宜 開日; 納財 宜 母倉)', '立券交易', ['五離'], 'CLEAN_H2',
     'W1–W8 hold; blind (fetched after the prediction freeze)'),
    ('06067696-n106.jpg', 'puzhu:21', '開市 (宜 開日; 納財 宜 母倉)', '立券交易', ['五離'], 'CLEAN_H2',
     'W1–W8 hold; blind (fetched after the prediction freeze)'),
    ('06067692-n30.jpg', 'puzhu:21', '開市 (宜 開日; 納財 宜 母倉)', '立券交易', [], 'NOT_DISCRIMINATING',
     'control (post hoc): same 災煞 開日 clause, 立券交易 has no 宜 and no independent 忌 and is absent, so the '
     'compiler applies puzhu:21; 嫁娶/結婚姻 (no 宜, 災煞 only) printed, so no-宜 headings keep 災煞'),
    ('06067694-n117.jpg', 'puzhu:21', '納財 (宜 四相)', '立券交易', ['五離'], 'NOT_DISCRIMINATING',
     '納財 printed: the trigger is not realised on the page; W6 (四相 is a puzhu:06 trigger)'),
    ('06067694-n81.jpg', 'puzhu:21', '開市 / 納財 (no 宜)', '立券交易', ['五離'], 'CONTAMINATED',
     'W1: trigger only under P4 cancel_both; triad printed'),
    ('06067694-n105.jpg', 'puzhu:21', '開市 / 納財 (no 宜)', '立券交易', ['五離'], 'CONTAMINATED', 'W1, as n81'),
    ('06067694-n129.jpg', 'puzhu:21', '開市 / 納財 (no 宜)', '立券交易', ['五離'], 'CONTAMINATED', 'W1, as n81'),
    ('06067696-n130.jpg', 'puzhu:21', '開市 / 納財 (四耗 survives)', '立券交易', ['五離', '四耗'],
     'NOT_DISCRIMINATING', 'triggers keep 四耗 and are printed; no trigger fires'),
    ('06067693-n112.jpg', 'puzhu:21', '開市 (宜 開日)', '立券交易', [], 'NOT_DISCRIMINATING',
     '立券交易 has its own 宜 (五合): W4/W5'),
    ('06067696-n17.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED',
     'W4/W5: target 宜 五富 and local 劫煞 相抵'),
    ('06067696-n29.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067696-n41.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067696-n65.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED',
     'W4/W5/W6 (四相)'),
    ('06067693-n11.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067693-n23.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067693-n35.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067693-n47.jpg', 'puzhu:22', '開市 + 立券交易 (宜 五富)', '開倉庫出貨財', ['五虛'], 'CONTAMINATED', 'W4/W5'),
    ('06067692-n107.jpg', 'puzhu:22', '開市 (no 宜) + 立券交易 (宜 六合)', '開倉庫出貨財', ['月虛'], 'CONTAMINATED',
     'W1 (開市 unnoted only under cancel_both); 月虛 is 月煞 又為 (W7)'),
]


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def stored_pages():
    out = {}
    for f in glob.glob(P + '**/*.json', recursive=True):
        if f.startswith(HERE):
            continue
        try:
            d = json.load(open(f, encoding='utf-8'))
        except ValueError:
            continue
        stack = [d]
        while stack:
            o = stack.pop()
            if isinstance(o, dict):
                p = o.get('path')
                if isinstance(p, str) and p.endswith('.jpg') and o.get('jiLine') is not None:
                    out.setdefault(os.path.basename(p), {**o, 'lock': f})
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)
    return out


def main():
    yiji = json.load(open(YIJI, encoding='utf-8'))['entries']
    preds = json.load(open(os.path.join(HERE, 'predictions.json'), encoding='utf-8'))
    impact = json.load(open(os.path.join(HERE, 'impact.json'), encoding='utf-8'))
    pages = stored_pages()
    for name, rec in NEW.items():
        pages[name] = {**rec, 'path': os.path.join(HERE, 'pages', name), 'monthJian': rec['context'][0],
                       'pillar': rec['context'][2:], 'lock': os.path.join(HERE, 'lock.json')}
    # Level A (卷十一 transcription) checks behind W1/W4 for the clean pair and the control.
    lijuan_yi = yiji['立券交易']['宜']
    for name in ('06067696-n82.jpg', '06067696-n106.jpg', '06067692-n30.jpg'):
        assert not any(g in lijuan_yi for g in pages[name]['jiShen']), name
        assert '開日' in yiji['開市']['宜'] and '災煞' in yiji['開市']['忌'] and '災煞' in yiji['立券交易']['忌']
    assert '五離' in yiji['立券交易']['忌'] and '母倉' in yiji['納財']['宜']

    out = []
    for name, line, trig, target, indep, cls, reason in WITNESSES:
        pg = pages[name]
        ji, yi = pg['jiLine'], pg.get('yiLine', '')
        term = '立券交易' if target == '立券交易' else '開倉庫'
        observed = 'printed' if term in ji else 'absent'
        if name in NEW:
            pr = next(x for x in preds['predictions'] if x['context'] == pg['context'])
            h1, h2 = pr['H1'], pr['H2']
            assert observed == 'printed' and '開市' not in ji + yi and '納財' not in ji
        else:
            h1 = f'{target} absent' if indep else '—'
            h2 = f'{target} printed ({"+".join(indep)})' if indep else '—'
        out.append({
            'id': f"P21S2-{name[:-4]}", 'source': '欽定協紀辨方書 月表 (四庫全書本), archive.org ' + name[:8] + '.cn',
            'page': pg['path'], 'sha256': sha(pg['path']), 'context': pg.get('context') or f"{pg['monthJian']}-{pg['pillar']}",
            'line': line, 'triggerActivity': trig, 'targetHeading': target, 'independentTargetJi': indep,
            'jiShen': pg.get('jiShen'), 'xiongShen': pg.get('xiongShen'), 'yiLine': yi, 'jiLine': ji,
            'observedTarget': observed, 'H1Prediction': h1, 'H2Prediction': h2, 'classification': cls,
            'notes': reason, 'blind': name in NEW, 'level': 'A',
            'confidence': 'medium-high (single edition, single AI reader, full-resolution re-read)'
            if cls == 'CLEAN_H2' else None,
        })
    with open(os.path.join(HERE, 'witnesses.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'p21-stage2-witnesses-v1', 'fetch': FETCH,
                   'newPages': {n: {**r, 'sha256': sha(os.path.join(HERE, 'pages', n))} for n, r in NEW.items()},
                   'witnesses': out}, f, ensure_ascii=False, indent=1)
        f.write('\n')

    tally = {}
    for w in out:
        tally[w['classification']] = tally.get(w['classification'], 0) + 1
    conclusion = {
        'audit': 'P21', 'stage': 2, 'conclusion': 'H2_SUPPORTED',
        'scope': 'puzhu:21 only: an independent 忌 (五離) on the target 立券交易 survives when the triad trigger is '
                 'unnoted by 相抵 (災煞 寅申巳亥月 開日, no 德). Not extended to puzhu:22 or other lines',
        'gate': {'cleanH2': [w['id'] for w in out if w['classification'] == 'CLEAN_H2'],
                 'cleanH1': [w['id'] for w in out if w['classification'] == 'CLEAN_H1'],
                 'unresolvedContradictoryLevelA': []},
        'tally': tally,
        'searchCoverage': {'storedPages': len(pages), 'candidateCells': len(preds['cells']),
                           'cleanCandidates': len(preds['predictions']),
                           'datedOnlyCellsOnPuzhu21Or22': 0},
        'limitations': [
            'one edition (四庫全書本), two near-identical pages of one month block, one AI reader',
            'n117 variant (內府刊本) not acquired: SOURCE_VARIANT_CONFLICT not tested',
            'n30 control and the whole-page reading are post hoc; only n82/n106 are blind',
            '開倉庫出貨財 is absent on n82/n106 without a 宜 of its own (卷十一 月恩四相時德滿日五富): it fits only if '
            "puzhu:22's trigger 「不註忌開市立劵交易」 is read per contribution as well; that is open, not part of P21",
            'the 災煞 effect premise (X相抵) is witnessed on these pages only, not resolved as an authority item',
        ],
        'ownerPrecedent': '2026-10-17 H1-B decision (puzhu:22 withholds independent 月虛) is in tension with this '
                          'result; it is project convention, not source authority. For Stage 3',
        'impactPreliminary': {
            'dates': impact['dates'], 'activityRows': len(impact['activity']), 'eventRecords': len(impact['event']),
            'eventClassificationChanges': sum(1 for e in impact['event']
                                              if e['nA']['classification'] != e['nC']['classification']),
            'premiseByDate': {'未-丙申': 'P4_LAYER_ONLY (P4-劫)', '未-戊申': 'LOCAL owner ruling',
                              '亥-丁酉': 'SOURCE_WITNESSED (n106)'},
            'goldensToSucceed': ['P4 score Golden v6', 'P4 full Golden v4', 'owner-rules Goldens',
                                 'p4-adapter-baseline-v1 lock revision', 'migration diff'],
        },
        'productionChanged': False,
    }
    with open(os.path.join(HERE, 'conclusion.json'), 'w', encoding='utf-8') as f:
        json.dump(conclusion, f, ensure_ascii=False, indent=1)
        f.write('\n')

    files = [os.path.join(HERE, x) for x in ('candidates.json', 'predictions.json', 'witnesses.json',
                                             'conclusion.json', 'impact.json', 'build_predictions.py',
                                             'build_witnesses.py')]
    files += ['shared/lunar/p4P21Stage2Candidates.test.ts', 'shared/lunar/p4P21Stage2Impact.test.ts', YIJI, VOL10]
    files += sorted({w['page'] for w in out})
    with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'p21-stage2-v1', 'files': {p: sha(p) for p in files}}, f, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()

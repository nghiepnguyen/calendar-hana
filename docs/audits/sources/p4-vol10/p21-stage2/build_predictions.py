"""P21 Stage 2: candidate classification and prediction freeze (audit only).

Run from the repo root, after the W1–W7 screen:
  P21S2_DUMP=1 npx vitest run shared/lunar/p4P21Stage2Candidates.test.ts
  python3 -I docs/audits/sources/p4-vol10/p21-stage2/build_predictions.py
Writes predictions.json. It is committed before any new 月表 page is fetched or read.
"""
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
CANDIDATES = os.path.join(HERE, 'candidates.json')
H1B = 'docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
CYCLE = ['甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12] for i in range(60)]
# leaf = cycle index + offset per (month block, archive item), calibrated on every stored page.
ITEM = {'亥': ('06067696', 73)}
# Pre-witness contamination that W1–W7 cannot see from the engine screen.
EXTRA = {
    ('puzhu:17', '未-壬申'): 'CONTAMINATED: 嫁娶 unnoted via 不將, whose own exception 「遇不將而不註忌嫁娶者亦仍註忌」 '
                            'keeps the targets 忌 under H1 and H2 (P17-A)',
}


def main():
    cells = json.load(open(CANDIDATES, encoding='utf-8'))['cells']
    stored = {f"{p['monthJian']}-{p['pillar']}": p['path'] for p in json.load(open(H1B, encoding='utf-8'))['pages']}
    rows, preds = [], []
    for c in cells:
        failed = [k for k, v in c['w'].items() if not v]
        extra = EXTRA.get((c['line'], c['context']))
        status = ('CONTAMINATED: fails ' + '+'.join(failed)) if failed else (extra or 'CLEAN_CANDIDATE')
        rows.append({'line': c['line'], 'context': c['context'], 'heading': c['heading'], 'status': status,
                     'storedPage': stored.get(c['context'])})
        if status != 'CLEAN_CANDIDATE':
            continue
        m, p = c['context'].split('-')
        item, off = ITEM[m]
        leaf = CYCLE.index(p) + off
        preds.append({
            'id': f"P21S2-{c['context']}",
            'line': c['line'],
            'context': c['context'],
            'locator': {'item': f'{item}.cn', 'leaf': f'n{leaf}',
                        'url': f'https://archive.org/download/{item}.cn/page/n{leaf}_w1200.jpg',
                        'status': 'HYPOTHESIS until header pillar and officer match'},
            'storedPage': stored.get(c['context']),
            'authentication': {'headerPillar': p, 'officer': '開', 'xiongShenIncludes': ['災煞', '五離']},
            'trigger': {'heading': '開市', 'yi': '開日 (建除)', 'ji': '災煞 (忌同刼煞)',
                        'xiangdi': '災煞 寅申巳亥月 開日 不與德神併: 凡所忌者則不註宜所宜者亦不註忌',
                        'W1Observable': '開市 on neither the 宜 nor the 忌 line; otherwise NOT_DISCRIMINATING'},
            'target': {'heading': '立券交易', 'independentJi': c['independent'], 'yi': False,
                       'localXiangdi': False, 'puzhu06Gods': c['puzhu06Gods']},
            'H1': '立券交易 absent from the 忌 line',
            'H2': '立券交易 on the 忌 line (五離)',
            'knownContamination': [
                '災煞 相抵 effect (X相抵) is unaudited: the page itself must show 開市 unnoted',
                '納財 (母倉, soil-dependent) is a second possible trigger; it does not change either prediction',
                '五離 lifters (天德 月德 天德合 月德合 天赦 三合 六合) absent per engine; a printed one voids W3',
            ],
        })
    out = {'version': 'p21-stage2-predictions-v1', 'frozenBeforeReading': True, 'cells': rows,
           'predictions': preds}
    with open(os.path.join(HERE, 'predictions.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()

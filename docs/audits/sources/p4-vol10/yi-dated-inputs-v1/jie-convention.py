#!/usr/bin/env python3
"""5.6: on the 20 civil Jie days, compare 母倉 under the frozen noon dated domain with the
frozen conditional table at the calendar-day Month Jian (solarTermMonthChi: the whole crossing
day uses the new month) recorded by the 5.4 Golden. Frozen inputs only; run from project root."""
import csv
import json
from pathlib import Path

root = Path('.')
golden = json.loads((root / 'docs/audits/sources/p4-vol10/yi-propagation-v1/expected.json').read_text(encoding='utf-8'))
rows = {r['id']: r for r in csv.DictReader((root / 'docs/audits/sources/p4-vol10/yi-domains-v1/expected.tsv').open(newline='', encoding='utf-8'), delimiter='\t')}
out = []
for date, info in sorted(golden['jieDayConvention']['dates'].items()):
    noon = rows[f'mu-cang:MU_CANG_DATED_1095:{date}']
    pillar = json.loads(noon['inputProvenance'])['validPillar']
    calendar = rows[f'mu-cang:MU_CANG_CONDITIONAL_1440:{info["baselineMonthJian"]}-{pillar}-{info["soil"]}']
    a, b = json.loads(noon['expected'])['outcome'], json.loads(calendar['expected'])['outcome']
    out.append({'date': date, 'pillar': pillar, 'noonMonthJian': info['noonMonthJian'], 'calendarDayMonthJian': info['baselineMonthJian'],
                'soil': info['soil'], 'noonMuCang': a, 'calendarDayMuCang': b, 'differs': a != b})
report = {'classification': 'CONVENTION_DIFFERENCE', 'dates': len(out), 'differing': sum(x['differs'] for x in out), 'rows': out}
text = json.dumps(report, ensure_ascii=False, indent=1) + '\n'
target = root / 'docs/audits/sources/p4-vol10/yi-dated-inputs-v1/jie-convention.json'
if target.exists():
    assert target.read_text(encoding='utf-8') == text, 'replay mismatch'
else:
    target.write_text(text, encoding='utf-8')
print(report['dates'], report['differing'], [ (x['date'], x['noonMuCang'], x['calendarDayMuCang']) for x in out if x['differs']])

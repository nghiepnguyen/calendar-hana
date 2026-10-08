import json,hashlib,time
from pathlib import Path
import numpy as np
from skyfield.api import load,load_file
from skyfield.framelib import ecliptic_frame
base=Path('tasks/calendar-audit/zero-cost-astronomy-v3.2A');kernel=Path('/tmp/authority-342-de440s.bsp');assert hashlib.sha256(kernel.read_bytes()).hexdigest()=='c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2'
eph=load_file(str(kernel));ts=load.timescale(builtin=True)
rows=[dict(year=y,longitude=((19+i)%24)*15) for y in range(1899,2102) for i in range(24)]
target=np.array([r['longitude'] for r in rows]);seed=np.array([ts.tt(r['year'],1,1).tt+5+((r['longitude']-285)%360)/360*365.2422 for r in rows])
def angle(jd):return eph['earth'].at(ts.tt_jd(jd)).observe(eph['sun']).apparent().frame_latlon(ecliptic_frame)[1].degrees
def residual(jd):return (angle(jd)-target+180)%360-180
start=time.perf_counter();root=seed.copy()
for _ in range(7):root-=residual(root)/((residual(root+.001)-residual(root-.001))/.002)
other=seed.copy()+.75
for _ in range(7):other-=residual(other)/((residual(other+.001)-residual(other-.001))/.002)
finalResidual=residual(root)
for i,r in enumerate(rows):r['tt']=float(root[i]);r['referenceResidualDegrees']=float(finalResidual[i])
prior=json.loads(Path('tasks/calendar-audit/astronomy-authority-v3.2/independent-reference.json').read_text());p={(x['year'],x['longitude']):x['skyfieldTT'] for x in prior['rows']};delta=max(abs(r['tt']-p[r['year'],r['longitude']])*86400 for r in rows if (r['year'],r['longitude']) in p)
out=dict(classification='NON_AUTHORITATIVE_ASTRONOMY_EVALUATION',identity='JPL DE440s / Skyfield1.55 / jplephem2.24 / apparent geocentric true ecliptic/equinox of date; TT',kernelSha256=hashlib.sha256(kernel.read_bytes()).hexdigest(),kernelSource='https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp',count=len(rows),supportedCount=4824,seed='Gregorian TT Jan1 + approximate term offset; no candidate/Swiss root seed',priorReferenceMaxDifferenceSeconds=delta,alternativeSeedMaxDifferenceSeconds=float(max(abs(root-other))*86400),elapsedSeconds=time.perf_counter()-start,rows=rows)
(base/'jpl-reference.json').write_text(json.dumps(out,indent=2));print({k:v for k,v in out.items() if k!='rows'})

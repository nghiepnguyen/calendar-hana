import json, hashlib, time
import numpy as np
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame
from pathlib import Path
base=Path('tasks/calendar-audit')
p=json.load(open(base/'astronomy-model-v3.1/production-sample.json'))['rows']
r=json.load(open(base/'astronomy-model-v3.1/reference-comparison.json'))['fullRange']['transitions']
lookup={(x['year'],x['longitude']):x for x in p}
rows=[x for x in r]
a=np.array([lookup[x['year'],x['longitude']]['rootTT'] for x in rows]); target=np.array([x['longitude'] for x in rows]); swiss=a-np.array([x['ttRootDeltaSeconds'] for x in rows])/86400
kernel=load_file('/tmp/authority-342-de440s.bsp');ts=load.timescale(builtin=True)
def angle(jd):return kernel['earth'].at(ts.tt_jd(jd)).observe(kernel['sun']).apparent().frame_latlon(ecliptic_frame)[1].degrees
def residual(jd):return (angle(jd)-target+180)%360-180
start=time.perf_counter();root=a.copy()+.25
for _ in range(5):root-=residual(root)/((residual(root+.001)-residual(root-.001))/.002)
other=a.copy()-.25
for _ in range(5):other-=residual(other)/((residual(other+.001)-residual(other-.001))/.002)
out=[]
for i,x in enumerate(rows):out.append(dict(year=x['year'],longitude=x['longitude'],name=x['name'],skyfieldTT=float(root[i]),swissTT=float(swiss[i]),astronomyEngineTT=float(a[i]),swissMinusIndependentSeconds=float((swiss[i]-root[i])*86400),aeMinusIndependentSeconds=float((a[i]-root[i])*86400),pipelineDeltaSeconds=x['deltaSeconds'],timeConversionContributionSeconds=x['timeConversionContributionSeconds']))
def stats(k):
 v=np.abs([x[k] for x in out]);return dict(max=float(max(v)),median=float(np.median(v)),p95=float(np.percentile(v,95)),over30=int(sum(v>30)))
data=dict(reference='Skyfield 1.55 / jplephem 2.24 / official JPL DE440s',kernelSha256=hashlib.sha256(Path('/tmp/authority-342-de440s.bsp').read_bytes()).hexdigest(),count=len(out),frame='apparent geocentric true ecliptic/equinox of date, Skyfield ecliptic_frame; IAU2000A nutation',clock='TT only; independent of UTC/DeltaT conversion',swiss=stats('swissMinusIndependentSeconds'),astronomyEngine=stats('aeMinusIndependentSeconds'),independentSeedAgreementSeconds=float(max(abs(root-other))*86400),elapsedSeconds=time.perf_counter()-start,rows=out)
json.dump(data,open(base/'astronomy-authority-v3.2/independent-reference.json','w'),indent=2)
print({k:v for k,v in data.items() if k!='rows'})

import json,hashlib,pathlib,datetime as D,time,statistics,math,sys
import swisseph as swe
base=pathlib.Path('tasks/calendar-audit/astronomy-model-v3.1')
evidence=json.load(open('calendar-group-b-exact-jie-evidence.json'))
data=pathlib.Path('/tmp/b313-ephe/sepl_18.se1')
assert hashlib.sha256(data.read_bytes()).hexdigest()==evidence['method']['dataSha256']
swe.set_ephe_path(str(data.parent))
UTC=D.timezone.utc
def dt(s):return D.datetime.fromisoformat(s.replace('Z','+00:00'))
def solve(year,longitude,seed):
 t=dt(seed)-D.timedelta(days=2)
 start=swe.utc_to_jd(t.year,t.month,t.day,t.hour,t.minute,t.second+t.microsecond/1e6,swe.GREG_CAL)[0]
 r=swe.solcross(longitude,start,swe.FLG_SWIEPH)
 for _ in range(6):
  v,f=swe.calc(r,swe.SUN,swe.FLG_SWIEPH|swe.FLG_SPEED)
  assert f&swe.FLG_SWIEPH and not f&swe.FLG_MOSEPH
  new=r-((v[0]-longitude+180)%360-180)/v[3]
  if new==r:break
  r=new
 u=swe.jdet_to_utc(r,swe.GREG_CAL)
 return D.datetime(*u[:5],tzinfo=UTC)+D.timedelta(seconds=u[5]),r
def date(t,h):return (t+D.timedelta(hours=h)).date().isoformat()
def minute(t):return (t+D.timedelta(seconds=30)).replace(second=0,microsecond=0).isoformat()
def row(p):
 start=time.perf_counter();r,jdtt=solve(p['year'],p['longitude'],p['instantUtc']);elapsed=(time.perf_counter()-start)*1000
 a=dt(p['instantUtc'])
 return dict(year=p['year'],name=p['name'],longitude=p['longitude'],de441T=r.isoformat(),astronomyEngineT=p['instantUtc'],deltaSeconds=(a-r).total_seconds(),ttRootDeltaSeconds=(p['rootTT']-jdtt)*86400,productionDeltaTSeconds=p['deltaTSeconds'],referenceTTMinusSerializedUTCSeconds=(jdtt-(r.timestamp()/86400+2440587.5))*86400,timeConversionContributionSeconds=(a-r).total_seconds()-(p['rootTT']-jdtt)*86400,sameUTCDate=date(a,0)==date(r,0),sameVietnamCivilDate=date(a,7)==date(r,7),sameHongKongCivilDate=date(a,8)==date(r,8),sameRoundedMinute=minute(a)==minute(r),referenceSolveMs=elapsed)
prod=json.load(open(base/'production-sample.json'));full=[row(p) for p in prod['rows']]
lookup={(r['year'],r['longitude']):r for r in full};existing=[]
for t in evidence['transitions']:
 r=dict(lookup[t['year'],t['longitudeDegrees']]);r['id']=t['id'];r['frozenDE441T']=t['instantUTC'];r['deltaSeconds']=(dt(r['astronomyEngineT'])-dt(t['instantUTC'])).total_seconds();r['reproductionDifferenceSeconds']=(dt(r['de441T'])-dt(t['instantUTC'])).total_seconds()
 h=dt(t['reference']['timestamp']).astimezone(UTC);r['hkoPublishedMinute']=t['reference']['timestamp'];r['sameHKOPublishedMinute']={'referenceNearestMinute':minute(dt(r['de441T']))==h.isoformat(),'productionNearestMinute':minute(dt(r['astronomyEngineT']))==h.isoformat(),'note':'Nearest-minute diagnostic; HKO rounding algorithm not established'}
 r['affectsFrozenExactFixture']=True;r['affectsOrdinaryDailyResult']=not r['sameVietnamCivilDate'];existing.append(r)
def stats(rows):
 v=sorted(abs(r['deltaSeconds']) for r in rows)
 return dict(count=len(rows),minDeltaSeconds=min(r['deltaSeconds'] for r in rows),maxDeltaSeconds=max(r['deltaSeconds'] for r in rows),maxAbsDeltaSeconds=max(v),medianAbsDeltaSeconds=statistics.median(v),p95AbsDeltaSeconds=v[math.ceil(.95*len(v))-1],sameVietnamCivilDate=sum(r['sameVietnamCivilDate'] for r in rows),differentVietnamCivilDate=sum(not r['sameVietnamCivilDate'] for r in rows),differentUTCDate=sum(not r['sameUTCDate'] for r in rows),differentHongKongCivilDate=sum(not r['sameHongKongCivilDate'] for r in rows),maxAbsTTRootDeltaSeconds=max(abs(r['ttRootDeltaSeconds']) for r in rows),medianAbsTTRootDeltaSeconds=statistics.median(abs(r['ttRootDeltaSeconds']) for r in rows),minuteLabelCrossings=sum(not r['sameRoundedMinute'] for r in rows))
sample=[r for r in full if r['year'] in [1900,1950,2000,2024,2050,2100]];rangeRows=[r for r in full if 1900<=r['year']<=2100]
risks=[r for r in rangeRows if not r['sameVietnamCivilDate'] or not r['sameHongKongCivilDate']]
out=dict(existing21=dict(stats(existing),transitions=existing),expandedSample=dict(stats(sample),years=[1900,1950,2000,2024,2050,2100],transitions=sample),fullRange=dict(stats(rangeRows),years=[1900,2100],transitions=rangeRows),midnightRisks=risks,referenceBenchmark=dict(medianSolveMs=statistics.median(r['referenceSolveMs'] for r in full),annual24SolveMedianMs=statistics.median(sum(r['referenceSolveMs'] for r in full if r['year']==y) for y in range(1899,2102)),ephemerisBytes=data.stat().st_size,libraryVersion=swe.version,python=sys.version,metadata=swe.get_current_file_data(0),note='Native Python warm solves; not WASM/browser benchmark'))
(base/'reference-comparison.json').write_text(json.dumps(out,indent=2));print(json.dumps({k:v for k,v in out.items() if k in ['midnightRisks','referenceBenchmark']}));print(json.dumps({k:{a:b for a,b in out[k].items() if a not in ['transitions']} for k in ['existing21','expandedSample','fullRange']}))

from pathlib import Path
import json,re,hashlib,subprocess
root=Path.cwd(); out=root/'docs/audits/sources/p4-vol10/yi-contract-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
freeze=json.loads(Path('docs/audits/sources/p4-vol10/yi-freeze-v1/lock.json').read_text())
for item in freeze['files']:
 assert sha(Path(item['path']))==item['sha256'],item['path']
authority=json.loads(Path('shared/almanac-data/p4-yi-operands-v1.json').read_text())
assert len(authority['entries'])==11
# Import/re-export and literal dynamic-import dependencies, including type-only imports conservatively.
pattern=re.compile(r'''(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]([^'"\n]+)['"]''')
files=sorted([*Path('src').rglob('*.ts'),*Path('src').rglob('*.tsx'),*Path('functions/src').rglob('*.ts'),*Path('shared').rglob('*.ts')])
files=[p for p in files if '.test.' not in p.name and '.spec.' not in p.name]
refs={}; unresolved=[]; dynamic=[]
for p in files:
 text=re.sub(r'/\*.*?\*/|//[^\n]*', '', p.read_text(), flags=re.S); targets=[]
 for m in pattern.finditer(text):
  s=m.group(1).split('?',1)[0]
  if not s.startswith(('.', '@/', '@shared/')):continue
  stem=(p.parent/s) if s.startswith('.') else (Path('shared')/s[8:] if s.startswith('@shared/') else Path('src')/s[2:])
  candidates=[stem,Path(str(stem)+'.ts'),Path(str(stem)+'.tsx'),Path(str(stem)+'.json'),stem/'index.ts',stem/'index.tsx']
  if stem.suffix=='.js':candidates += [stem.with_suffix('.ts'),stem.with_suffix('.tsx')]
  hit=next((q.resolve() for q in candidates if q.is_file()),None)
  if hit: targets.append(str(hit.relative_to(root)))
  else:unresolved.append({'file':str(p),'specifier':s})
 if re.search(r'\b(?:import|require)\s*\(\s*[^\s\'\"]',text):dynamic.append(str(p))
 refs[str(p)]=targets
roots=[str(p) for p in files if str(p).startswith(('src/','functions/src/'))]+['shared/lunar/almanac.ts']
seen=set();stack=roots[:]
while stack:
 p=stack.pop()
 if p in seen:continue
 seen.add(p);stack.extend(refs.get(p,[]))
targets=['shared/lunar/p4DayComposition.ts','shared/lunar/p4FullDayComposition.ts','shared/lunar/p4HeadingAnnotation.ts','shared/almanac-data/p4-yi-operands-v1.json','shared/almanac-data/golden-p4-yi-operands-v1.json']
assert not (set(targets)&seen)
assert not [u for u in unresolved if u['file'] in seen],unresolved

extras=['shared/lunar/p4YiDayComposition.ts','shared/lunar/p4YiDayCore.ts',
        'shared/lunar/p4YiFullDayCore.ts','shared/lunar/p4YiEvidence.ts',
        'shared/lunar/p4YiOperands.ts','shared/lunar/p4YiPredicates.ts','shared/lunar/p4YiTrace.ts',
        'shared/lunar/p4YiSoil.ts']
assert not set(extras)&seen
for p in targets[:3]+['shared/almanac-data/manifest.json','shared/almanac-data/p4-vol10-day-composition-v2.json']:
 assert Path(p).read_bytes()==subprocess.check_output(['git','show','HEAD:'+p]),p
v=json.loads(Path('docs/audits/sources/p4-vol10/yi-integration-v1/validation.json').read_text())
for p,h in v['sha256'].items():assert sha(Path(p))==h,p
for item in v['testCounts']:
 d=json.loads(Path(item['path']).read_text())
 assert [d[k] for k in ['numTotalTests','numPassedTests','numFailedTests','numPendingTests']]==item['counts'],item
 if item['counts'][2]:
  failures=[a for suite in d['testResults'] for a in suite['assertionResults'] if a['status']=='failed']
  assert all('AssertionError' in ''.join(a['failureMessages']) for a in failures)
m=json.loads(Path('docs/audits/sources/p4-vol10/yi-integration-v1/mutations.json').read_text())
assert m['restored'] and all(x['assertionCaught'] and x['exitCode']!=0 for x in m['mutations'])
for p,h in m['restoredSha256'].items():assert sha(Path(p))==h,p
for folder in ['yi-red-heading-v1','yi-red-any-v1']:
 prior=json.load(open('docs/audits/sources/p4-vol10/'+folder+'/validation.json'))
 for p,h in prior['sha256'].items():assert sha(Path(p))==h,p
prior=json.load(open('docs/audits/sources/p4-vol10/yi-presence-gate-v1/results.json'))
for p,h in prior['codeAndPriorEvidenceSha256BeforeAndAfter'].items():
 if p!='shared/lunar/p4YiEvidence.ts':assert sha(Path(p))==h,p
bundle=Path('dist/assets/index-CeLinrvj.js')
assert sha(bundle)=='f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969'
print('PASS5.3 frozen677/old evidence/legacy bytes/production closure/bundle/tests/mutation restoration')

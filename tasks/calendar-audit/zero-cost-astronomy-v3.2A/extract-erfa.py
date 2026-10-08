from pathlib import Path
import re,json,hashlib,shutil
base=Path('tasks/calendar-audit/zero-cost-astronomy-v3.2A');src=Path('/tmp/zero342a-erfa/erfa-2.0.1');s=(src/'src/epv00.c').read_text();clean=lambda s:re.sub(r'/\*.*?\*/','',s,flags=re.S)
arrays={}
for name,body in re.findall(r'static const double ([es][012][xyz])\[\] = \{(.*?)\};',s,re.S):arrays[name]=[float(x) for x in clean(body).split(',') if x.strip()]
assert len(arrays)==18 and all(len(a)%3==0 for a in arrays.values())
n=(src/'src/nut00b.c').read_text().split('} x[] = {')[1].split('};')[0];nut=[[float(v) for v in row.split(',')] for row in re.findall(r'\{([^{}]+)\}',clean(n))];assert len(nut)==77 and all(len(x)==11 for x in nut)
(base/'erfa-coefficients.mjs').write_text('// NON_AUTHORITATIVE_ASTRONOMY_EVALUATION\n// Derived from ERFA 2.0.1, Copyright NumFOCUS; see ERFA-LICENSE.txt.\nexport const epv='+json.dumps(arrays,separators=(',',':'))+';\nexport const nut='+json.dumps(nut,separators=(',',':'))+';\n')
shutil.copyfile(src/'LICENSE',base/'ERFA-LICENSE.txt')
(base/'erfa-provenance.json').write_text(json.dumps(dict(upstream='https://github.com/liberfa/erfa/tree/v2.0.1',archiveSha256=hashlib.sha256(Path('/tmp/zero342a-erfa.tgz').read_bytes()).hexdigest(),sourceHashes={f:hashlib.sha256((src/'src'/f).read_bytes()).hexdigest() for f in ['epv00.c','nut00b.c','pfw06.c','obl06.c','fw2m.c','ab.c']},coefficientTerms={k:len(v)//3 for k,v in arrays.items()},nutationTerms=77,license='BSD-3-Clause/ERFA permissive redistribution/modification with notices',classification='NON_AUTHORITATIVE_ASTRONOMY_EVALUATION'),indent=2))
print('ERFA arrays extracted:',sum(len(x)//3 for x in arrays.values()),'terms;77nutation')

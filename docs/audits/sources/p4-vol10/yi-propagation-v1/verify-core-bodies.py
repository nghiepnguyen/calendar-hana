"""5.4: the versioned full core differs from its locked predecessor only by explicit 宜
injection (5.3) plus the five raw-retention edits listed here. Run from the project root."""
from pathlib import Path
import re

compact = lambda text: re.sub(r'\s+', '', re.sub(r'//[^\n]*', '', text))
old = Path('shared/lunar/p4FullDayComposition.ts').read_text()
new = Path('shared/lunar/p4YiFullDayCore.ts').read_text()
before = old[old.index('  const { lunarDay, phase, soil } = operands'):]
before = compact(before.replace('resolveP4Day(month, pillar)', 'assembleP4YiDay(month, pillar, yi)'))
after = compact(new[new.index('  const { lunarDay, phase, soil } = operands'):])
EDITS = [
    ('constunresolvedJi:Record<string,string[]>={}',
     'constunresolvedJi:Record<string,string[]>={}constrawDays:typeofdays={}'),
    ("continue}unresolvedJi[h]=unresolvedif(allTaboo||base.pillarAllTaboo.length){days[h]=",
     "}elseunresolvedJi[h]=unresolvedconstout=dayRule?rawDays:daysif(allTaboo||base.pillarAllTaboo.length){out[h]="),
    ('days[h]={...initial,ji,protectedJi,state}', 'out[h]={...initial,ji,protectedJi,state}'),
    ("?'partial':'modeled',}", "?'partial':'modeled',rawJiHeadings:dayRule?rawDays:days,}"),
]
for a, b in EDITS:
    assert before.count(a) == 1, a
    before = before.replace(a, b)
assert before == after, 'full core body delta beyond 宜 injection + raw retention'
wrapper = compact(new[new.index('export function assembleP4YiFullDay('):new.index('export function assembleP4YiFullDayWithRaw(')])
assert 'const{rawJiHeadings:_raw,...day}=assembleP4YiFullDayWithRaw(month,pillar,operands,yi)returnday' in wrapper
print('PASS full core = predecessor + 宜 injection + raw retention; public assembleP4YiFullDay drops rawJiHeadings')

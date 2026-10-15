"""Prove versioned assembly bodies differ only at explicit 宜 injection."""
from pathlib import Path
import re

compact = lambda text: re.sub(r'\s+', '', re.sub(r'//[^\n]*', '', text))
old = Path('shared/lunar/p4DayComposition.ts').read_text()
new = Path('shared/lunar/p4YiDayCore.ts').read_text()
before = old[old.index('  const ctx =', old.index('export function resolveP4Day')):]
before = before.replace('  const yi = yiEvidence(month, pillar)\n', '')
after = new[new.index('  const ctx =', new.index('export function assembleP4YiDay')):]
assert compact(before) == compact(after), 'day core body delta'
old = Path('shared/lunar/p4FullDayComposition.ts').read_text()
new = Path('shared/lunar/p4YiFullDayCore.ts').read_text()
before = old[old.index('  const { lunarDay, phase, soil } = operands'):]
before = before.replace('resolveP4Day(month, pillar)', 'assembleP4YiDay(month, pillar, yi)')
after = new[new.index('  const { lunarDay, phase, soil } = operands'):]
assert compact(before) == compact(after), 'full core body delta'
print('PASS versioned core bodies equal predecessor modulo explicit 宜 injection')

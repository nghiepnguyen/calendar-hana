"""Run serially: mutate the Phase 6 source, verify semantic failures, restore in finally."""
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
source = root / 'shared/lunar/annualDirectionsAuthority.ts'
original = source.read_text()
mutants = {
    'tai-sui-shift': ('[yearBranch],', '[(yearBranch + 1) % 12],'),
    'sui-po-not-opposite': ('(yearBranch + 6) % 12', '(yearBranch + 5) % 12'),
    'san-sha-wrong-group': ('groups[yearBranch % 4]', 'groups[(yearBranch + 1) % 4]'),
    'san-sha-north-south-swap': ("direction: '南'", "direction: '北'"),
    'late-li-chun-equality': ('instant < Date.parse(liChun.instantUtc)', 'instant <= Date.parse(liChun.instantUtc)'),
    'gregorian-year-fallback': ('const solarYear = instant < Date.parse(liChun.instantUtc) ? year - 1 : year', 'const solarYear = year'),
    'lunar-year-fallback': ('const solarYear = instant < Date.parse(liChun.instantUtc) ? year - 1 : year', "const solarYear = solarToLunar(new Date(instant).getUTCDate(), new Date(instant).getUTCMonth() + 1, year).year"),
}
results = {}
try:
    for name, (old, new) in mutants.items():
        if original.count(old) != 1:
            raise RuntimeError(f'{name}: mutation target is not unique')
        changed = original.replace(old, new)
        if name == 'lunar-year-fallback':
            changed = "import { solarToLunar } from './lunar'\n" + changed
        source.write_text(changed)
        run = subprocess.run(['npx', 'vitest', 'run', 'shared/lunar/annualDirectionsAuthority.test.ts'], cwd=root, capture_output=True, text=True, timeout=60)
        output = run.stdout + run.stderr
        # A compiler/import failure is not a killed semantic mutant.
        killed = run.returncode != 0 and 'AssertionError:' in output and 'Test Files' in output
        results[name] = 'KILLED' if killed else 'SURVIVED_OR_INVALID'
        print(f'{name}: {results[name]}', flush=True)
        if not killed:
            print(output)
            raise RuntimeError(f'{name}: semantic gate did not kill mutation')
finally:
    source.write_text(original)
print(json.dumps(results, indent=2))

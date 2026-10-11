"""Sequential mutations for the P4 四時 day readings (audit only, before scoring).

Each alternative reading is applied to the artifact copy in memory and checked
against the 等第 partner-label invariant (p4GradeResolution.test.ts), which
does not read the season-days lock. Every byte is restored in finally.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / 'shared/almanac-data/p4-vol10-season-days.json'
module = root / 'shared/lunar/p4SeasonDays.ts'
originals = {p: p.read_bytes() for p in (data, module)}


def alt_reading(edit):
    def apply():
        art = json.loads(originals[data])
        edit(art['days'])
        data.write_text(json.dumps(art, ensure_ascii=False, indent=2) + '\n')
    return apply


def swap_wang_guan(days):
    days['王日']['branches'], days['官日']['branches'] = days['官日']['branches'], days['王日']['branches']


def unswapped_shou(days):
    days['守日']['branches'] = {'春': '酉', '夏': '子', '秋': '卯', '冬': '午'}


def module_edit(old, new):
    def apply():
        text = originals[module].decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {old}')
        module.write_text(text.replace(old, new, 1))
    return apply


mutations = [
    ('wang_guan_modern_swap', alt_reading(swap_wang_guan)),
    ('shou_not_swapped', alt_reading(unswapped_shou)),
    ('season_shifted', module_edit('day.branches[SEASON[monthJianBranch]]', 'day.branches[SEASON[(monthJianBranch + 1) % 12]]')),
]
results = []
try:
    for name, apply in mutations:
        apply()
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4GradeResolution.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=180,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        results.append({'mutation': name, 'caughtByPartnerInvariant': caught, 'exitCode': run.returncode})
        for p, b in originals.items():
            p.write_bytes(b)
finally:
    for p, b in originals.items():
        p.write_bytes(b)

(root / 'docs/audits/p4-vol10-season-mutation-results.json').write_text(
    json.dumps({'scope': 'AUDIT_SEASON_DAY_READINGS', 'mutations': results, 'restored': True},
               ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))

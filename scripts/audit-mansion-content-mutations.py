"""Serial Phase 7 semantic mutations; restore every source even when a gate fails."""
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
data_path = root / 'shared/almanac-data/mansion-content-yuxia-1880-v1.json'
code_path = root / 'shared/lunar/mansionContentAuthority.ts'
manifest_path = root / 'shared/almanac-data/manifest.json'
originals = {p: p.read_text() for p in [data_path, code_path, manifest_path]}


def change_clause(field, value, row=0, clause=0):
    data = json.loads(originals[data_path])
    data['items'][row]['clauses'][clause][field] = value
    return json.dumps(data, ensure_ascii=False, indent=2) + '\n'


def replace_code(old, new):
    if originals[code_path].count(old) != 1:
        raise RuntimeError('Non-unique mutation target')
    return originals[code_path].replace(old, new)


wrong_name = json.loads(originals[data_path])
wrong_name['items'][0]['name'] = 'Cang'
enabled = json.loads(originals[manifest_path])
enabled['policies']['mansion28ScoringEnabled'] = True
mutants = {
    'polarity-flip': (data_path, change_clause('polarity', 'negative')),
    'wrong-mansion-row': (data_path, json.dumps(wrong_name, ensure_ascii=False)),
    'omitted-condition': (data_path, change_clause('conditions', [])),
    'grave-repair-merged-into-burial': (data_path, change_clause('activityId', 'burial', clause=3)),
    'water-travel-merged-into-road': (data_path, change_clause('activityId', 'travel', row=2, clause=3)),
    'omitted-exception': (code_path, replace_code('exceptions: clause.exceptions,', 'exceptions: [],')),
    'unaudited-promotion': (code_path, replace_code("content.reviewStatus !== 'SOURCE_LOCKED'", "false")),
    'mansion-score-applied': (code_path, replace_code('scoreDelta: 0,', 'scoreDelta: 15,')),
    'scoring-policy-enabled': (manifest_path, json.dumps(enabled, ensure_ascii=False)),
}
results = {}
try:
    for name, (path, changed) in mutants.items():
        path.write_text(changed)
        run = subprocess.run(['npx', 'vitest', 'run', 'shared/lunar/mansionContentAuthority.test.ts',
                              'shared/lunar/mansionContentRegression.test.ts'],
                             cwd=root, capture_output=True, text=True, timeout=60)
        output = run.stdout + run.stderr
        killed = run.returncode != 0 and 'AssertionError:' in output and 'Test Files' in output
        results[name] = 'KILLED' if killed else 'SURVIVED_OR_INVALID'
        print(f'{name}: {results[name]}', flush=True)
        path.write_text(originals[path])
        if not killed:
            print(output)
            raise RuntimeError(f'{name}: semantic gate failed')
finally:
    for path, text in originals.items():
        path.write_text(text)
print(json.dumps(results, indent=2))

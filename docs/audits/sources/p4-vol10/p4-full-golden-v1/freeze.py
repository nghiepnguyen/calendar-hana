"""Full Golden P4, task 4.0: freeze — lock, no-engine-input proof, pre-registered diff classes, index.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/freeze.py [--write]

Default verifies committed bytes. The commit proof (freeze commit SHA) is written after the freeze
commit by `--proof <sha>`, read from Git objects, never amended into the freeze commit.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

GOLDEN = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1')
INDEX = Path('shared/almanac-data/golden-p4-full-v1.json')
LOCK = GOLDEN / 'lock.json'
PROOF = GOLDEN / 'commit-proof.json'
DOCS = {'README.md', 'inventory.md'}  # prose may be corrected after freeze; not part of the lock
EXTRA_INPUTS = [Path(f'docs/audits/sources/p4-vol10/soil-hko/T{y}c.txt') for y in (2025, 2026, 2027)]
# Frozen files read only to compare after the expected rows are derived; each is (indirectly) engine-derived.
ORACLE_ONLY = {
    'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/dated.tsv': 'puzhu:06 v3 Golden; its derive read the P4-C sweep',
    'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/context.tsv': 'puzhu:06 v3 Golden; its derive read context-p4c.tsv',
    'docs/audits/sources/p4-vol10/yi-dated-inputs-v1/jie-convention.json': 'via yi-propagation-v1 → yi-baseline-v1 (engine)',
    'shared/almanac-data/golden-p4-day-composition.json': 'A04b v1 hand Golden, predates P4-B/P4-C',
}
FORBIDDEN = [
    (r'^shared/lunar/.*\.ts$', 'production / audit TypeScript'),
    (r'^docs/audits/[^/]+-2025-2027\.tsv$', 'engine sweep TSV'),
    (r'-baseline-v1/', 'engine baseline measurement'),
    (r'context-p4c', 'engine context baseline'),
    (r'xieji-god-tables\.json$', 'runtime presence table'),
]
PATH_RE = re.compile(r"""['"]((?:shared|docs|golden-v4|src|scripts)/[^'"\s{}]+)['"]""")


def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def scripts():
    return sorted(GOLDEN.rglob('*.py'))


def outputs():
    return sorted(p for p in GOLDEN.rglob('*') if p.is_file() and p.suffix in ('.tsv', '.json')
                  and p.name not in ('lock.json', 'commit-proof.json') and '__pycache__' not in p.parts)


def literal_paths():
    """Every repo path literal in the derive scripts (constants and joined relative names)."""
    found = set()
    for s in scripts():
        text = s.read_text(encoding='utf-8')
        found |= set(PATH_RE.findall(text))
    return found


def no_engine_proof():
    lits = literal_paths()
    violations = []
    for lit in sorted(lits):
        for pattern, why in FORBIDDEN:
            if re.search(pattern, lit) and lit not in ORACLE_ONLY:
                violations.append({'path': lit, 'rule': why})
    assert not violations, violations
    # Imports: only standard library and sibling derive scripts loaded by fixed path.
    stdlib = {'bisect', 'csv', 'datetime', 'hashlib', 'importlib.util', 'json', 'random', 're', 'subprocess', 'sys',
              'collections', 'pathlib'}
    for s in scripts():
        for m in re.findall(r'^(?:from|import) ([\w.]+)', s.read_text(encoding='utf-8'), re.M):
            assert m in stdlib, (s, m)
    return {'scripts': len(scripts()), 'pathLiterals': len(lits), 'forbiddenRules': [w for _, w in FORBIDDEN],
            'violations': 0, 'imports': 'standard library only; sibling stages loaded by fixed path',
            'oracleOnly': ORACLE_ONLY}


def inputs():
    found = set()
    for summ in GOLDEN.rglob('*.json'):
        try:
            data = json.loads(summ.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and isinstance(data.get('inputs'), dict):
            found |= set(data['inputs'])
    found |= {p for p in literal_paths() if Path(p).is_file()}
    found |= {str(p) for p in EXTRA_INPUTS}
    golden_files = {str(p) for p in scripts() + outputs()} | {str(INDEX)}  # the index pins the lock, not vice versa
    return sorted(p for p in found if p not in golden_files and Path(p).is_file())


DIFF_CLASSES = {
    'note': 'Task 6.0 maps every Golden ↔ engine difference to one class below, or to ENGINE_BUG / GOLDEN_BUG / '
            'SPEC_BUG / SOURCE_DEPENDENT with evidence. Classes are registered before any engine comparison.',
    'owner': {
        'H2-A': '天願 ∈ 德願; 未月戊午 閉日/天吏 如常例 (2026-10-17). Rows: 2027-08-07 and context 未-戊午.',
        'H1-B/F5': 'Unprotected 忌 (canonical or convention) meeting another scope\'s 相抵 survives, 宜 not noted, then '
                   'propagation. Rows: compose/h1b-changes.tsv (58 context, 95 dated).',
        'F1': '百忌 巳日「出行」 → 行幸遣使, protected 專忌 (60 contexts, 91 dates).',
        'F4': '閉日 gives no 忌 on 求醫療病 (卷十 療目) — same as engine; registered for completeness.',
        'E1': '復日/重日 「則不忌亦不註宜」 → neither_recorded (67 dated rows, 安葬).',
        'E3': 'Propagation lift leaving 相抵 → neither_recorded (57 dated, 33 context rows).',
        'E5': 'Context rows determined only when invariant over soil × lunar day (12/15/other) × phase (4,431 undetermined).',
    },
    'golden': {
        'E2': '止忌 list keeps 忌 when 宜 is unknown (1 dated row: 2025-10-08 修倉庫).',
        'E4': '忌 with unknown 宜 → undetermined (same row as E2).',
        'E6': 'Owner rules above are not implemented by any engine entry.',
        'CONTEXT_DATE_OPERAND_POLICY': 'E5 seen against an engine-anchored context oracle.',
        'LATER_SCOPE': 'An older partial oracle predates the scope that changes the row.',
        'PUZHU06_HOLD_UNDER_H1B': 'puzhu:06 v3 classes a 又為 with a 相抵 parent as UNDETERMINED (6 dated rows); puzhu:22 then lifts.',
    },
    'generic': ['ENGINE_BUG', 'GOLDEN_BUG', 'SPEC_BUG', 'SOURCE_DEPENDENT', 'CONVENTION_DIFFERENCE', 'NAMING_ONLY'],
}

ENGINE_COMPARISON_PLAN = {
    'note': 'Pre-registered stitching for task 6.0 (no engine call has been made for this Golden before freeze, '
            'except the logged task 2.1 diagnosis and code reads listed in ji/README.md and compose/README.md).',
    'dated': 'For each date: Month Jian by the calendar-day convention (presence/dated.tsv), day pillar, lunar day, '
             'phase and soil as in ji/dated-ji.tsv. Engine row = resolveP4Puzhu06Day for the 29 headings, except '
             '修倉庫 = resolveP4WarehouseDay. Compare state, ji, protected.',
    'context': 'resolveP4Puzhu06Day / resolveP4WarehouseDay without dated operands; compare state only where the Golden '
               'row is not undetermined by E5.',
    'acceptance': 'Every difference carries one registered class; ENGINE_BUG rows are listed for the owner, never '
                  'fixed by editing this Golden.',
}


def counts():
    def rows(p):
        return sum(1 for _ in Path(p).open(encoding='utf-8')) - 1
    return {
        'presenceContext720': rows(GOLDEN / 'presence/context.tsv'),
        'presenceDated1095': rows(GOLDEN / 'presence/dated.tsv'),
        'presenceJie108': rows(GOLDEN / 'presence/jie.tsv'),
        'presenceStructural': rows(GOLDEN / 'presence/structural.tsv'),
        'jiContext': rows(GOLDEN / 'ji/context-ji.tsv'),
        'jiDated': rows(GOLDEN / 'ji/dated-ji.tsv'),
        'grades': rows(GOLDEN / 'ji/grades.tsv'),
        'dayContext': rows(GOLDEN / 'compose/context.tsv'),
        'dayDated': rows(GOLDEN / 'compose/dated.tsv'),
        'h1bChanges': rows(GOLDEN / 'compose/h1b-changes.tsv'),
    }


def role(p):
    if p in ORACLE_ONLY:
        return 'oracle_only'
    if Path(p).name.startswith('golden-') and Path(p).parent == Path('shared/almanac-data'):
        return 'frozen_oracle'  # hand-derived partial Golden, checked against, never an engine output
    return 'input'


def build():
    proof = no_engine_proof()
    ins = inputs()
    lock = {
        'version': 'golden-p4-full-lock-v1',
        'files': [{'path': str(p), 'sha256': sha256(p), 'role': 'derive_script'} for p in scripts()]
        + [{'path': str(p), 'sha256': sha256(p), 'role': 'expected_output'} for p in outputs()]
        + [{'path': p, 'sha256': sha256(p), 'role': role(p)} for p in ins],
        'noEngineInput': proof,
        'diffClasses': DIFF_CLASSES,
        'engineComparisonPlan': ENGINE_COMPARISON_PLAN,
    }
    missing = [p for p in ORACLE_ONLY if p not in ins]
    assert not missing, missing
    index = {
        'schemaVersion': 'p4-full-golden-index-v1',
        'version': 'golden-p4-full-v1',
        'date': '2026-10-17',
        'status': 'HASH_LOCKED_PRE_ENGINE_COMPARISON',
        'scope': 'AUDIT_ONLY',
        'scoringReady': False,
        'roadmapItem': 7,
        'layer': 'resolution (heading state, presence, warehouse); score adapter/cap/event are roadmap 8',
        'ownerDecisions': ['H1-B', 'H2-A', 'F1', 'F4', 'F5', 'E1', 'E3', 'E5'],
        'reviewer': 'Claude, single agent; owner review pending (task 8.0)',
        'lock': {'path': str(LOCK)},
        'blocks': [
            {'kind': 'dated1095', 'path': str(GOLDEN / 'compose/dated.tsv'), 'count': counts()['dayDated']},
            {'kind': 'context720', 'path': str(GOLDEN / 'compose/context.tsv'), 'count': counts()['dayContext']},
            {'kind': 'presenceDated', 'path': str(GOLDEN / 'presence/dated.tsv'), 'count': counts()['presenceDated1095']},
            {'kind': 'presenceContext', 'path': str(GOLDEN / 'presence/context.tsv'), 'count': counts()['presenceContext720']},
            {'kind': 'presenceJie', 'path': str(GOLDEN / 'presence/jie.tsv'), 'count': counts()['presenceJie108']},
            {'kind': 'presenceStructural', 'path': str(GOLDEN / 'presence/structural.tsv'), 'count': counts()['presenceStructural']},
            {'kind': 'h1bChanges', 'path': str(GOLDEN / 'compose/h1b-changes.tsv'), 'count': counts()['h1bChanges']},
            {'kind': 'checks', 'path': str(GOLDEN / 'compose/checks.json'), 'count': 1},
        ],
    }
    for b in index['blocks']:
        b['sha256'] = sha256(b['path'])
    dump = lambda o: json.dumps(o, ensure_ascii=False, indent=1) + '\n'
    return {LOCK: dump(lock), INDEX: dump(index)}


def proof_for(commit):
    git = lambda *a: subprocess.run(['git', *a], capture_output=True, check=True).stdout
    tree = git('rev-parse', f'{commit}^{{tree}}').decode().strip()
    parent = git('rev-parse', f'{commit}^').decode().strip()
    lock = json.loads(git('show', f'{commit}:{LOCK}'))
    files = []
    for f in lock['files'] + [{'path': str(LOCK)}, {'path': str(INDEX)}]:
        blob = git('show', f"{commit}:{f['path']}")
        digest = hashlib.sha256(blob).hexdigest()
        assert 'sha256' not in f or digest == f['sha256'], f['path']
        files.append({'path': f['path'], 'sha256': digest})
    return {'version': 'golden-p4-full-commit-proof-v1', 'freezeCommit': commit, 'tree': tree, 'parent': parent,
            'note': 'Written after the freeze commit from Git objects; not amended. Before freeze the only engine '
                    'contact was the logged task 2.1 diagnosis and the code reads listed in ji/README.md and '
                    'compose/README.md; no Golden ↔ engine comparison (task 6.0) has run.',
            'files': files}


def main():
    if '--proof' in sys.argv:
        commit = sys.argv[sys.argv.index('--proof') + 1]
        PROOF.write_text(json.dumps(proof_for(commit), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print('wrote', PROOF)
        return
    fs = build()
    if '--write' in sys.argv:
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()

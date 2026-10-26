"""P21 Stage 4 (p4-puzhu21-v1): full Golden P4 v5 day states = the frozen v4 composer with puzhu:21
contribution-scoped on the authority's eligible contexts.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v5/compose/compose.py [--write]

The v4 compose.py is loaded unchanged (sha asserted; it loads v3 and v2 the same way). This file moves the output
directory and one function, v2's propagate as v4 calls it:
  - outside p4-puzhu21-v1.eligibleContexts: v2's propagate, unchanged;
  - inside: v2's propagate without the puzhu:21 line, then the puzhu:21 pairs on the same pre-propagation day. A
    target keeps its row when a 忌 survives outside the fired triggers' 相抵 gods (their xd= ids), with code
    'propagation-kept:<triggers>><state>'; otherwise it is lifted exactly as v2 does.
The context comes from v2.yi_evidence, which day() calls with (month, pillar) for every heading before propagating.
Independent constraint, checked before writing: every v4 → v5 row difference is a Stage 3 MIGRATE row
(p21-stage3/golden-manifest.json and eligibility.json); anything else stops the run.
Default verifies the committed outputs byte-for-byte; --write regenerates them and the lock.
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

V4_DIR = Path('docs/audits/sources/p4-vol10/p4-full-golden-v4/compose')
V4_COMPOSE = V4_DIR / 'compose.py'
V4_SHA = '17c7fea5d90dc62022e7c59e006f94b73d0d7360cd6a3081aa83705c84fbb491'
HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v5/compose')
LOCK = HERE.parent / 'lock.json'
PUZHU21 = Path('shared/almanac-data/p4-puzhu21-v1.json')
S3 = Path('docs/audits/sources/p4-vol10/p21-stage3')

assert hashlib.sha256(V4_COMPOSE.read_bytes()).hexdigest() == V4_SHA, 'full Golden v4 composer changed'
_spec = importlib.util.spec_from_file_location('p4_full_golden_v4_compose', V4_COMPOSE)
v4 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v4)
v2 = v4.v2
v2.HERE = HERE
ELIGIBLE = set(json.loads(PUZHU21.read_text(encoding='utf-8'))['eligibleContexts'])
_context = [None]
_v2_yi_evidence = v2.yi_evidence


def yi_evidence(h, yi_list, month, pillar, *rest):
    _context[0] = f'{month}-{pillar}'
    return _v2_yi_evidence(h, yi_list, month, pillar, *rest)


def xd_ids(d):
    part = next((p for p in d['code'].split(';') if p.startswith('xd=')), None)
    return set(part[3:].split('+')) if part else set()


_v2_propagate = v4._v2_propagate


def propagate(days, lines, neither_of):
    if _context[0] not in ELIGIBLE:
        return _v2_propagate(days, lines, neither_of)
    line21 = next(l for l in lines if l.get('id') == 'puzhu:21')
    out = _v2_propagate(days, [l for l in lines if l is not line21], neither_of)
    targets = {}
    for a, b in line21['pairs']:
        frm, h = v2.sc.norm(a), v2.sc.norm(b)
        if days.get(frm, {}).get('state') != 'neither_recorded':
            continue
        d = days.get(h)
        if not d or not d['ji'] or d['state'] == 'undetermined':
            continue
        if d['protected']:
            out[h]['blocked'] = frm
            continue
        t = targets.setdefault(h, ([], set()))
        t[0].append(frm)
        t[1].update(xd_ids(days[frm]))
    for h, (fired, cancelled) in targets.items():
        d = days[h]
        src = '+'.join(fired)
        if [g for g in v4.ji_ids(d) if g not in cancelled]:
            out[h]['code'] = f"propagation-kept:{src}>{d['state']};" + d['code']
        else:
            state = 'neither_recorded' if neither_of[h] else {True: 'only_yi', False: 'not_recorded',
                                                                None: 'undetermined'}[d['yi_noted']]
            out[h].update(ji=False, state=state, propagated=src, code=f'propagated:{src}>{state};' + d['code'])
    return out


v2.yi_evidence = yi_evidence
v4._v2_propagate = propagate


def rows(text):
    head, *body = text.splitlines()
    return head.split('\t'), {tuple(r.split('\t')[:4]): r for r in body}


def check(fs):
    """v4 → v5 differences must be the Stage 3 MIGRATE rows; anything else stops the run."""
    elig = json.loads((S3 / 'eligibility.json').read_text(encoding='utf-8'))
    dates = {r['date'] for r in elig['rows'] if r['eligibility'] == 'MIGRATE'}
    ctxs = {c for c, k in elig['contexts'].items() if k['eligibility'] == 'MIGRATE'}
    manifest = {(g['file'].split('/')[-1]): g['expectedRecords'] for g in
                json.loads((S3 / 'golden-manifest.json').read_text(encoding='utf-8'))['changes']
                if g['golden'] == 'p4-full-golden-v4'}
    bad, changed = [], []
    for name, allowed in (('dated.tsv', dates), ('context.tsv', ctxs)):
        head, old = rows((V4_DIR / name).read_text(encoding='utf-8'))
        _, new = rows(fs[HERE / name])
        assert old.keys() == new.keys(), name
        col = {c: i for i, c in enumerate(head)}
        n = 0
        for k in old:
            if old[k] == new[k]:
                continue
            a, b = old[k].split('\t'), new[k].split('\t')
            changed.append(f'{name} {k[0]} {k[3]} {a[col["state"]]}>{b[col["state"]]}')
            n += 1
            if not (k[0] in allowed and k[3] == '立券交易' and b[col['state']] == 'only_ji'):
                bad.append(changed[-1])
        if n != manifest[name]:
            bad.append(f'{name}: {n} rows changed, manifest {manifest[name]}')
    old_h = (V4_DIR / 'h1b-changes.tsv').read_text(encoding='utf-8').splitlines()
    new_h = fs[HERE / 'h1b-changes.tsv'].splitlines()
    diff = sorted(set(old_h) ^ set(new_h))
    for line in diff:
        f = line.split('\t')
        if not (f[1] in dates | ctxs and f[2] == '立券交易'):
            bad.append('h1b-changes ' + line)
    if len(diff) != 2 * manifest['h1b-changes.tsv']:
        bad.append(f'h1b-changes: {len(diff) // 2} rows changed, manifest {manifest["h1b-changes.tsv"]}')
    if bad:
        raise SystemExit('FAIL unexpected v4 → v5 rows:\n' + '\n'.join(bad[:40]))
    return changed + ['h1b-changes.tsv ' + l for l in diff]


def lock_text(fs):
    paths = [HERE / 'compose.py', *(p for p in fs if p != LOCK), V4_COMPOSE, V4_DIR.parent / 'lock.json', PUZHU21,
             S3 / 'eligibility.json', S3 / 'golden-manifest.json']
    blob = lambda p: fs[p].encode() if p in fs else p.read_bytes()  # noqa: E731
    return json.dumps({
        'version': 'p4-full-golden-lock-v5', 'scope': 'P21_STAGE4_PUZHU21_V1',
        'method': 'full Golden v4 composer (sha-asserted) with puzhu:21 contribution-scoped on '
                  'p4-puzhu21-v1.eligibleContexts; v4 kept as the pre-P21 rollback',
        'generation': 'python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v5/compose/compose.py --write',
        'files': [{'path': str(p), 'sha256': hashlib.sha256(blob(p)).hexdigest()} for p in paths]},
        ensure_ascii=False, indent=1) + '\n'


def main():
    fs = v2.files()
    fs[HERE / 'v4-diff.txt'] = '\n'.join(check(fs)) + '\n'
    fs[LOCK] = lock_text(fs)
    if '--write' in sys.argv:
        HERE.mkdir(parents=True, exist_ok=True)
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()

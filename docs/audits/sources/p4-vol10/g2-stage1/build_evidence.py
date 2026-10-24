"""G2 Stage 1: inventory and source evidence for 立劵交易 / 立券交易 (audit only).

    python3 -I docs/audits/sources/p4-vol10/g2-stage1/build_evidence.py [--write]

inventory.json: every tracked text file holding 劵 or 立券交易, per form and layer (generated Golden/diff
files are marked derived, never source authority). source-evidence.json: every raw-source occurrence of 劵
or 券 with line and context, the 萬年書 list counts in 卷十一, and the scan crops. Default verifies.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
P4 = HERE.parent
FORMS = ['立劵交易', '立券交易']
RAW = {
    'vol05.raw.txt': '協紀辨方書 卷五 (Wikisource 四庫, transcription-derived)',
    'vol06.raw.txt': '協紀辨方書 卷六 (Wikisource 四庫, transcription-derived)',
    'vol10.raw.txt': '協紀辨方書 卷十 (Wikisource 四庫, transcription-derived)',
    'yi-sources-v1/vol11.raw.txt': '協紀辨方書 卷十一 (Wikisource 四庫, transcription-derived)',
    's1-tuwang/tuibu-jieli-shang.raw.txt': '推步捷例 上 (Joseon 1861; derivative compilation, RESEARCH_EVIDENCE_ONLY)',
}


def layer(path):
    if path.endswith('.raw.txt'):
        return 'source transcription'
    if re.search(r'golden|migration-diff|baseline|/freeze|expected|coverage\.json|impact|sweep|\.tsv$', path):
        return 'derived / audit fixture'
    if path.startswith('shared/almanac-data/'):
        return 'repository source data'
    if path.startswith('shared/lunar/') and not path.endswith('.test.ts'):
        return 'runtime code'
    if path.endswith('.test.ts') or path.startswith('scripts/'):
        return 'test / gate'
    return 'documentation / audit'


def inventory():
    files = subprocess.run(['git', 'grep', '-lI', '-e', '劵', '-e', '立券交易'], capture_output=True, text=True,
                           check=True).stdout.split()
    rows = []
    for f in sorted(files):
        if 'g2-stage1' in f or f.startswith('docs/audits/p4-g2-') or 'p4G2Stage1' in f:
            continue  # this audit's own artifacts
        t = Path(f).read_text(encoding='utf-8')
        rows.append({'path': f, 'layer': layer(f), **{k: t.count(k) for k in FORMS},
                     'other劵': len(re.findall('劵', t)) - t.count('立劵交易')})
    by = {}
    for r in rows:
        b = by.setdefault(r['layer'], {'files': 0, **{k: 0 for k in FORMS}, 'other劵': 0})
        b['files'] += 1
        for k in [*FORMS, 'other劵']:
            b[k] += r[k]
    return {'version': 'g2-stage1-inventory-v1', 'byLayer': by, 'files': rows}


def lists():
    """卷十一 萬年書 lists: cells vs the declared count (立券 and 交易 are separate cells)."""
    lines = (P4 / 'yi-sources-v1/vol11.raw.txt').read_text(encoding='utf-8').split('\n')
    out = []
    for title, a, b, extra, declared in [('御用六十七事', 13, 35, ['納畜'], 67), ('民用三十七事', 37, 49, ['啓攢'], 37),
                                         ('通書選擇六十事', 51, 81, [], 60)]:
        cells = [c for ln in lines[a - 1:b - 1] if 'anchor' not in ln for c in re.split(r'[　\s]+', ln.strip()) if c]
        cells += extra
        out.append({'list': title, 'lines': [a, b], 'declared': declared, 'cells': len(cells),
                    '立券+交易 separate cells': '立券' in cells and '交易' in cells,
                    'countMatchesOnlyIfSeparate': len(cells) == declared})
    return out


def evidence():
    occ = []
    for rel, work in RAW.items():
        p = P4 / rel
        for i, ln in enumerate(p.read_text(encoding='utf-8').split('\n')):
            for m in re.finditer('[劵券]', ln):
                occ.append({'source': rel, 'work': work, 'line': i + 1, 'glyph': m.group(),
                            'context': ln[max(0, m.start() - 8):m.end() + 6].strip()})
    pdf = P4 / 'yi-sources-v1/06067687.cn.pdf'
    return {
        'version': 'g2-stage1-source-evidence-v1',
        'occurrences': occ,
        'glyphCounts': {rel: {g: sum(1 for o in occ if o['source'] == rel and o['glyph'] == g) for g in '劵券'}
                        for rel in RAW},
        'vol11Heading': {'line': 231, 'transcription': '{{SK anchor|立劵交易}}',
                         'yi': '天願民日三合滿日六合五富五合', 'ji': '月破大耗平日收日劫煞災煞月煞月刑月害月厭大時天吏小耗四耗四廢四窮五墓九空五離'},
        'wannianshuLists': lists(),
        'scan': {'pdf': 'docs/audits/sources/p4-vol10/yi-sources-v1/06067687.cn.pdf',
                 'pdfSha256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'volume': '卷十一 (item 卷十一〜卷十二)',
                 'page': 42, 'render': 'PDFKit page 42 at 1914 px wide; crop x980 y230 320×560',
                 'crops': {n: hashlib.sha256((HERE / n).read_bytes()).hexdigest()
                           for n in ('scan-06067687-p42-heading.png', 'scan-06067687-p37-dong.png')},
                 'reading': 'heading 立?交易 above 宜天願民日…: lower element of the 2nd glyph drawn like 力 (cf. 動 in the '
                            '興造動土 heading, p37), i.e. 劵, consistent with the Wikisource transcription',
                 'confidence': 'single visual reading by one AI reviewer, medium; 卷十一 only (卷十 scans not read)'},
    }


def main():
    out = {'inventory.json': inventory(), 'source-evidence.json': evidence()}
    bad = []
    for name, obj in out.items():
        text = json.dumps(obj, ensure_ascii=False, indent=1) + '\n'
        p = HERE / name
        if '--write' in sys.argv:
            p.write_text(text, encoding='utf-8')
        elif not p.exists() or p.read_text(encoding='utf-8') != text:
            bad.append(name)
        print(name, hashlib.sha256(text.encode()).hexdigest())
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()

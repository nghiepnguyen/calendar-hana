"""G1-a demolition witness matrix (audit only).

Every occurrence of 破屋壞垣 / 破屋壊垣 in the locked source texts and every 月表 page of the 16 劫煞 Option C
contexts. Each row keeps three keys apart:
  source_raw             what the transcription prints (never rewritten)
  normalized_comparison  comparison key: the one runtime NORM pair 壞→壊, nothing else
  canonical_candidate    proposed runtime key (破屋壊垣)
Provenance follows the project hierarchy; rows from one work are cross-references, not independent witnesses.

python3 docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/build_witness.py
"""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
P4 = HERE.parent
RAW, CANON = '破屋壞垣', '破屋壊垣'
FOLD = {'壞': '壊'}  # the only fold G1-a allows (runtime NORM pair); adding more could manufacture a match

SOURCES = [
    # path, work, provenance, independence
    ('vol10.raw.txt', '協紀辨方書 卷十 (Wikisource 四庫 transcription)', 'primary/classical authority (modern transcription)', 'same work'),
    ('yi-sources-v1/vol11.raw.txt', '協紀辨方書 卷十一 (Wikisource 四庫 transcription)', 'primary/classical authority (modern transcription)', 'same work'),
    ('vol06.raw.txt', '協紀辨方書 卷六 (Wikisource 四庫 transcription)', 'primary/classical authority (modern transcription)', 'same work'),
    ('s1-tuwang/tuibu-jieli-shang.raw.txt', '推步捷例 上 (南相吉, Joseon 1861; Wikisource, RESEARCH_EVIDENCE_ONLY)', 'derivative compilation', 'later compilation of the same Qing rules'),
]
CONTEXTS = '丑-丙寅 丑-壬寅 丑-戊寅 丑-甲寅 戌-丁亥 戌-乙亥 戌-己亥 戌-癸亥 未-丙申 未-壬申 未-庚申 未-戊申 辰-乙巳 辰-己巳 辰-癸巳 辰-辛巳'.split()


def norm(s):
    return ''.join(FOLD.get(c, c) for c in s)


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def context_of(lines, i):
    # 推步 prints its rules inline (「土王用事，忌…」); 協紀 under {{SK anchor|…}}.
    for j in range(i, max(-1, i - 6), -1):
        m = re.match(r'[\s　]*([^，。{}\s]{1,16})，只?[忌宜註]', lines[j])
        if m:
            return m.group(1), j + 1
    for j in range(i, -1, -1):
        m = re.search(r'\{\{SK anchor\|([^}]+)\}\}|^===(.+)===', lines[j])
        if m:
            return m.group(1) or m.group(2), j + 1
    return '', 0


rows = []
files = []
for rel, work, prov, indep in SOURCES:
    p = P4 / rel
    files.append({'path': f'docs/audits/sources/p4-vol10/{rel}', 'sha256': sha(p)})
    lines = p.read_text(encoding='utf-8').split('\n')
    for i, line in enumerate(lines):
        for m in re.finditer('破屋[壞壊]垣', line):
            ctx, at = context_of(lines, i)
            a, b = max(0, m.start() - 12), m.end() + 6
            rows.append({
                'source': rel, 'line': i + 1, 'work': work, 'source_raw': m.group(0),
                'normalized_comparison': norm(m.group(0)), 'canonical_candidate': CANON,
                'context': ctx, 'context_line': at, 'snippet': line[a:b].strip(),
                'provenance': prov, 'independence': indep,
            })

lock_path = P4 / 'h1b-yuebiao-witness-v1/lock.json'
files.append({'path': 'docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json', 'sha256': sha(lock_path)})
pages = []
for pg in json.loads(lock_path.read_text(encoding='utf-8'))['pages']:
    ctx = f"{pg['monthJian']}-{pg['pillar']}"
    if ctx not in CONTEXTS:
        continue
    hit = next((h for h in (RAW, CANON) if h in pg['jiLine']), '')
    pages.append({
        'source': 'h1b-yuebiao-witness-v1/lock.json', 'context': ctx, 'page': pg['path'].split('/')[-1],
        'page_sha256': pg['sha256'], 'source_raw': hit, 'normalized_comparison': norm(hit),
        'printed_on_ji_line': bool(hit), 'xiong_shen': pg['xiongShen'],
        'provenance': '協紀辨方書 月表 卷二十–三十一 scans (SHA-locked), project visual transcription',
        'independence': 'same work; undated month+pillar table, cannot carry 土王用事',
    })

count = lambda src, g: sum(1 for r in rows if r['source'] == src and r['source_raw'] == g)
summary = {
    'version': 'g1a-demolition-witness-v1',
    'fold': FOLD,
    'glyphCounts': {s: {RAW: count(s, RAW), CANON: count(s, CANON)} for s, *_ in SOURCES},
    'yuebiaoPages': {'contexts': len(pages), 'printed': sorted(p['context'] for p in pages if p['printed_on_ji_line']),
                     'notPrinted': sorted(p['context'] for p in pages if not p['printed_on_ji_line']),
                     'printedGlyphs': sorted({p['source_raw'] for p in pages if p['source_raw']})},
    'distinctNormalized': sorted({r['normalized_comparison'] for r in rows + pages if r['normalized_comparison']}),
    'files': files,
}
(HERE / 'witness-matrix.json').write_text(
    json.dumps({'summary': summary, 'text': rows, 'yuebiao': pages}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=1))

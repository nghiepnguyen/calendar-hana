"""Read-only integrity checks for P4-C task 2.1; never adopts a presence predicate."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLLECTION = ROOT / 'docs/audits/sources/p4-vol10/yi-sources-v1'


def read_json(path):
    return json.loads(path.read_text(encoding='utf8'))


def require_quote(text, offset, length, quote):
    """Offsets count Unicode code points in exact UTF-8 decoded bytes; no normalization."""
    if type(offset) is not int or type(length) is not int:
        raise ValueError('Integer code point offset and length required')
    if offset < 0 or length < 0 or offset + length > len(text):
        raise ValueError('Quote outside source bounds')
    if length != len(quote) or text[offset:offset + length] != quote:
        raise ValueError('Quote differs from exact source slice')


def require_hash(path, expected, algorithm='sha256'):
    measured = hashlib.new(algorithm, path.read_bytes()).hexdigest()
    if measured != expected:
        raise ValueError(f'Hash mismatch: {path.relative_to(ROOT)}')


def self_test():
    text = 'A𠀀母倉\n'
    require_quote(text, 2, 2, '母倉')
    require_quote('甲\r\n乙', 3, 1, '乙')
    failures = [(3, 2, '母倉'), (-1, 2, '母倉'), (2, 3, '母倉'),
                (4, 2, '\n'), (2, 2, '母仓'), (True, 2, '母倉')]
    for offset, length, quote in failures:
        try:
            require_quote(text, offset, length, quote)
        except ValueError:
            continue
        raise AssertionError('Malformed source quote was accepted')
    print('Offset protocol: 2 valid examples / 6 invalid cases checked')


def verify():
    lock = read_json(COLLECTION / 'lock.json')
    for file in lock['files']:
        require_hash(ROOT / file['path'], file['sha256'])
    manifest = read_json(COLLECTION / 'manifest.json')
    source_by_id = {}
    for source in manifest['rawSources']:
        path = ROOT / source['path']
        require_hash(path, source['sha1'], 'sha1')
        require_hash(path, source['sha256'])
        text = path.read_bytes().decode('utf8')
        assert len(text) == source['codePointCount']
        assert path.stat().st_size == source['byteCount']
        source_by_id[source['sourceId']] = text
    for scan in manifest['scanSources']:
        path = ROOT / scan['path']
        assert path.read_bytes().startswith(b'%PDF-')
        require_hash(path, scan['sha1'], 'sha1')
        require_hash(path, scan['sha256'])
        meta = read_json(ROOT / scan['metadataPath'])
        published = next(f for f in meta['files'] if f['name'] == path.name)
        require_hash(path, published['sha1'], 'sha1')
        assert path.stat().st_size == int(published['size'])
    for response_file in ['reused-raw.revision-response.json', 'vol11.revision-response.json']:
        response = read_json(COLLECTION / response_file)
        for page in response['query']['pages'].values():
            revision = page['revisions'][0]
            volume = int(page['title'].split('卷')[-1])
            key = f'ws-vol{volume:02}-{revision["revid"]}'
            text = revision['slots']['main']['*']
            assert source_by_id[key] == text
            assert hashlib.sha1(text.encode('utf8')).hexdigest() == revision['sha1']
    index = read_json(COLLECTION / 'candidate-index.json')
    assert {item['han'] for item in index['items']} == {
        '母倉', '福德', '天恩', '天巫', '天后', '天醫',
        '除神', '驛馬', '天馬', '吉期', '鳴吠',
    }
    count = 0
    for item in index['items']:
        assert item['predicate'] is None and item['entryScanPage'] is None
        assert item['status'] == 'INDEX_ONLY_UNREVIEWED'
        for ref in item['rawRefs']:
            text = source_by_id[ref['sourceId']]
            for occurrence in ref['occurrences']:
                require_quote(text, occurrence['mentionOffset'], occurrence['mentionLength'], occurrence['mentionText'])
                require_quote(text, occurrence['contextOffset'], occurrence['contextLength'], occurrence['contextQuote'])
                count += 1
    template = read_json(COLLECTION / 'authority-entry.template.json')
    assert template['status'] == 'UNREVIEWED'
    assert template['scope'] == 'AUDIT_ONLY' and template['scoringReady'] is False
    assert template['predicate'] is None and template['review']['status'] == 'PENDING'
    assert template['unknownPolicy'] == {
        'missingRequiredInput': 'unknown', 'outsideCoverage': 'unknown', 'malformedInput': 'error',
    }
    # Protect the task-1 measurement and evaluated inputs while collecting new source evidence.
    baseline_lock = read_json(ROOT / 'docs/audits/sources/p4-vol10/yi-baseline-v1/lock.json')
    for file in baseline_lock['files']:
        require_hash(ROOT / file['path'], file['sha256'])
    print(f'Verified {len(lock["files"])} locked files, 5 raw sources, 5 scan PDFs, 11 candidates / {count} occurrences; no predicates adopted')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    arguments = parser.parse_args()
    if arguments.self_test:
        self_test()
    verify()

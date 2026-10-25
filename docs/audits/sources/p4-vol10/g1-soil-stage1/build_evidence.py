"""G1-SOIL Stage 1 (audit only): 土王用事 source evidence, the frozen rule definition and the inventory, from tracked
files only.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_evidence.py [--write]

Writes source-evidence.json, soil-rule.json, inventory.json; default verifies them. Quotes are copied from the
raw transcriptions (asserted present), never modernized.
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
S = 'docs/audits/sources/p4-vol10/'


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def at(p, needle):
    lines = Path(p).read_text(encoding='utf-8').split('\n')
    hits = [i for i, l in enumerate(lines, 1) if needle in l]
    assert hits, (p, needle)
    return hits[0]


# (source file, quote that must be present, work / locator, class, role, confidence)
WITNESSES = [
    (S + 'vol06.raw.txt', '四絶者四立前一辰也', '協紀辨方書 卷六 義例四 四離四絶 (玉門經)',
     'primary transcription', '「四立前一辰」 names the day god 四絶', 'high'),
    (S + 'vol06.raw.txt', '故先一日為絶也', '協紀辨方書 卷六 四絶 (曹震圭)',
     'primary transcription', 'glosses 「前一辰」 as 先一日: the civil day before 四立', 'high'),
    (S + 'vol06.raw.txt', '故先一日為四離辰也', '協紀辨方書 卷六 四離 (玉門經)',
     'primary transcription', 'same gloss for 四離 (分至前一辰 = 先一日)', 'high'),
    (S + 'vol10.raw.txt', '{{SK anchor|土王用事}}', '協紀辨方書 卷十 土王用事 (忌 list, 義同土府)',
     'primary transcription (scan n215–n216 read in P4-B)', '忌 list names 破屋壊垣 / 興造動土', 'high'),
    (S + 'yi-sources-v1/vol11.raw.txt', '土府土符地囊土王用事後止忌補垣', '協紀辨方書 卷十一 補垣塞穴',
     'primary transcription', '土王用事後 is a period 忌 operand of the headings', 'high'),
    (S + 'yi-sources-v1/vol11.raw.txt', '{{SK anchor|破屋壊垣}}', '協紀辨方書 卷十一 破屋壊垣 heading',
     'primary transcription', 'heading 忌 list ends …土王用事後 (G1-a §5)', 'high'),
    (S + 's1-tuwang/tuibu-jieli-shang.raw.txt', '自四立節前一辰，逆數至十八日，爲土王用事。', '推步捷例 上 求土王用事 (Joseon 1861)',
     'secondary reference (derivative of 時憲 practice)', 'onset = count back 18 days from 「四立節前一辰」', 'medium-high'),
    (S + 's1-tuwang/tuibu-jieli-shang.raw.txt', '寄旺四時共日七十二日。', '推步捷例 上',
     'secondary reference', '4 × 18 = 72 days a year', 'medium-high'),
    (S + 's1-tuwang/mingshi-035.raw.txt', '推土王用事　置穀雨、大暑、霜降、大寒恆氣日，減土王策', '明史 卷35 大統曆',
     'secondary reference (Ming, 恆氣)', 'different system: 中氣 恆氣 − 3.04 d; not the Qing 定氣 basis', 'high for 大統'),
    (S + 's1-tuwang/songshi-skqs-068.raw.txt', '以土王筞加四季之節', '宋史 卷68',
     'secondary reference (Song)', 'different system: 季月節 + 土王策', 'high for its system'),
    (S + 's1-tuwang/gujin-lvlikao-skqs-036.raw.txt', '得毎季土王十八日二十六刻', '古今律厯考 卷36',
     'secondary reference (Ming)', 'mean 土王 = 18.26 d per season', 'high for 大統'),
]
# 卷一 is quoted from docs/audits/tu-vuong-dung-su.md (Wikisource SHA-1 66c18401b9f4), not stored in the repo.
VOL1 = {'quote': '神樞經曰五行旺各有時惟土居無所定乃於四立之前各旺一十八日',
        'locator': '協紀辨方書 卷一 本原 五行用事', 'class': 'primary transcription (quoted, not stored)',
        'role': 'the rule: 18 days before each 四立', 'confidence': 'high for the rule, silent on boundary arithmetic',
        'via': 'docs/audits/tu-vuong-dung-su.md §1'}
assert VOL1['quote'] in Path('docs/audits/tu-vuong-dung-su.md').read_text(encoding='utf-8')

evidence = {
    'version': 'g1-soil-stage1-source-evidence-v1',
    'rule': 'source spelling preserved; secondary / modern material never becomes authority',
    'vol1': VOL1,
    'witnesses': [{'path': p, 'sha256': sha(p), 'line': at(p, q), 'quote': q, 'locator': loc, 'class': cls,
                   'role': role, 'confidence': conf} for p, q, loc, cls, role, conf in WITNESSES],
    'scans': {
        '卷十 土王用事': 'n215–n216 read directly in P4-B (docs/audits/p4-vol10-soil-convention-gate.md)',
        '月表': 'undated pages cannot carry 土王用事 (G1-a §6); no date-level witness exists',
        '時憲書': 'OPEN: Tohoku images not transcribable for the 土王 entries (shixian-tohoku); not used',
    },
    'separation': {
        '1 primary scan': ['卷十 n215–n216 (土王用事 list)'],
        '2 primary transcription': ['卷一', '卷六 :656–658', '卷十 :448–450', '卷十一 :253, :263–265'],
        '3 repository-derived table': ['p4-soil-owner-convention-v1.json', 'golden-tu-vuong-dung-su.json (HKO 四立 dates)'],
        '4 historical audit interpretation': ['tu-vuong-dung-su.md (owner 2026-10-10)', 'p4-vol10-soil-convention-gate.md',
                                              'p4-g1a-demolition-authority.md §5–§6'],
        '5 modern / secondary': ['推步捷例', '明史', '宋史', '古今律厯考', 'HKO tables (boundary input only)'],
    },
}

rule = {
    'version': 'tho-vuong-dung-su-rule-v1',
    'status': 'AUDIT_FROZEN_DEFINITION (no production change)',
    'definition': '土王用事 of a 四立 L = the 18 civil days [date(L) − 18, date(L) − 1]; date(L) itself excluded',
    'derivation': [
        '卷一 「土於四立之前各旺一十八日」: 18 days before each 四立 (rule)',
        '推步捷例 「自四立節前一辰，逆數至十八日」: counting starts at 「四立節前一辰」',
        '卷六 「四絶者四立前一辰也…故先一日為絶也」: 「前一辰」 = the civil day before 四立 (協紀-internal gloss)',
        '推步 「寄旺四時共日七十二日」 and 卷一 「合之亦為七十二日」 require 4 × 18 = 72, ruling out the exclusive '
        'reading of 「逆數至十八日」 ([立−19, 立−1], 19 days): the entry day is counted',
        '⇒ day 1 = date(L) − 1, day 18 = date(L) − 18; the 立 day starts the next element (卷一 各旺七十二日)',
    ],
    'grade': 'B (rule derivation from 協紀 卷一 + 卷六 gloss, corroborated by 推步捷例); not A (no dated 時憲書 witness)',
    'boundaries': {'entry': 'date(L) − 18, inclusive', 'exit': 'date(L) − 1, inclusive', 'liDay': 'excluded',
                   'unit': 'whole civil days (no time-of-day)', 'windowsPerYear': 4, 'daysPerWindow': 18},
    'astronomy': {
        'input': '立春 / 立夏 / 立秋 / 立冬 instants (term index 21 / 3 / 9 / 15), true terms (定氣)',
        'authority': 'golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json (JPL DE440s, clock-v1), the project '
                     'astronomy authority already behind Month Jian; no second engine',
        'civilDate': 'instant + 7 h (shared/lunar/lunar.ts TIME_ZONE_OFFSET = 7, project-wide convention)',
        'coverage': '1900–2100 (supported range of the authority)',
    },
    'conventions': {
        '定氣 vs 恆氣': '定氣 (Qing 時憲 basis, project-wide); 恆氣 is Ming 大統, not adopted',
        'timezone': 'UTC+7 project convention; UTC+8 alternative flips 0 of the 502 five-context occurrences '
                    '(66 window days differ overall). Only the soil calendar was varied: Month Jian and the day pillar '
                    'rest on the same project-wide UTC+7 convention, which is outside G1-SOIL and not reopened',
        'instant 2-hour reading of 前一辰': 'rejected by 卷六 gloss; would flip 2 occurrences (1939-01-17, 2042-01-16)',
    },
    'equivalence': 'identical to shared/lunar/thoVuongDungSu.ts (owner 2026-10-10) and p4-soil-owner-convention-v1 '
                   '(owner 2026-10-13, coverage 2025–2027), shown on every window 1900–2100 (calendar parity test)',
    'adoption': 'P4 authority covers 2025–2027 only (getP4SoilPresence → unknown outside); every R2 change lies outside '
                '2025–2027, so production use needs an owner ruling to adopt this rule beyond that coverage',
}

INV = [
    ('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json', 'production 劫煞 authority (R3)', 'production'),
    ('docs/audits/p4-g1-demolition-soil-authority-item.md', 'G1-SOIL open item', 'owner-opened 2026-10-25'),
    ('docs/audits/p4-g1-glyph-stage2-migration.md', 'G1 glyph Stage 2 record', 'production migration record'),
    ('docs/audits/sources/p4-vol10/g1-glyph-stage2/lock.json', 'G1 glyph Stage 2 lock', 'lock'),
    ('docs/audits/sources/p4-vol10/g1-glyph-stage2/g1b-counterfactual.json', 'G1-b historical + v3 counterfactual', 'frozen'),
    ('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/engine.json', 'G1-a corrected engine (soil absent/present)', 'owner-accepted'),
    ('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/full.json', 'G1-a per-context in/out window counts', 'owner-accepted'),
    ('docs/audits/sources/p4-vol10/g1-glyph-stage1/authority-candidate.json', 'Stage 1 cells and grades', 'audit'),
    ('docs/audits/tu-vuong-dung-su.md', '土王用事 definition lock (product)', 'owner 2026-10-10'),
    ('docs/audits/p4-vol10-soil-convention-gate.md', 'P4-B soil gate', 'owner 2026-10-13'),
    ('shared/almanac-data/p4-soil-owner-convention-v1.json', 'P4 soil authority (2025–2027)', 'OWNER_ADOPTED_SOURCE_DEPENDENT'),
    ('shared/almanac-data/golden-tu-vuong-dung-su.json', 'product soil Golden (HKO 四立)', 'frozen Golden'),
    ('shared/lunar/thoVuongDungSu.ts', 'production soil calendar', 'runtime'),
    ('shared/lunar/p4SoilConvention.ts', 'P4 soil presence (unknown outside 2025–2027)', 'runtime'),
    ('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json', 'astronomy authority (JPL)', 'REVIEWED_FROZEN'),
    ('docs/audits/sources/p4-vol10/s1-tuwang/lock.json', 'secondary 土王 sources lock', 'RESEARCH_EVIDENCE_ONLY'),
    ('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json', '1,636 劫煞 scope dates', 'audit'),
]
inventory = {'version': 'g1-soil-stage1-inventory-v1',
             'files': [{'path': p, 'role': r, 'level': lv, 'sha256': sha(p)} for p, r, lv in INV]}


def main():
    for k, v in (('source-evidence.json', evidence), ('soil-rule.json', rule), ('inventory.json', inventory)):
        text = json.dumps(v, ensure_ascii=False, indent=1) + '\n'
        if '--write' in sys.argv:
            (OUT / k).write_text(text, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == text, f'{k} differs'
    print('evidence ok', len(evidence['witnesses']), 'witnesses')


if __name__ == '__main__':
    main()

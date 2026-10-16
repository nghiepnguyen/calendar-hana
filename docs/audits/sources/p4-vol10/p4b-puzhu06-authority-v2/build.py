"""puzhu:06 task 3.5: authority p4b-puzhu06-v2 = v1 + owner answer Q4a (2026-10-16): 五墓 「不取德合」
blocks the 德合 triggers (天德合, 月德合) of puzhu:06. v1 stays byte-identical.
Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v2/build.py [--write]
Without --write it rebuilds everything and fails if the committed files differ.

Standard library only. Every quote is located verbatim (code points) in the locked 卷十 raw and
cross-checked against the earlier P4 locks that carry the same span (puzhu:06 in
p4-vol10-authority.json, 等第 grades, puzhu:27 in p4-puzhu-end-v1.json, 九空 defer in
remaining-ji v7). No resolver, composer or TypeScript code is read.
"""
import hashlib
import json
import sys
from pathlib import Path

DIR = Path("docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v2")
OUT = Path("shared/almanac-data/p4b-puzhu06-v2.json")
PARENT = Path("shared/almanac-data/p4b-puzhu06-v1.json")
RAW = Path("docs/audits/sources/p4-vol10/vol10.raw.txt")
P4_AUTHORITY = Path("shared/almanac-data/p4-vol10-authority.json")
PUZHU_END = Path("shared/almanac-data/p4-puzhu-end-v1.json")
REMAINING = Path("shared/almanac-data/p4-vol10-remaining-ji-v7.json")
WRITE = "--write" in sys.argv

raw = RAW.read_text(encoding="utf-8")
sha256 = lambda b: hashlib.sha256(b).hexdigest()


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


def span(quote, after=0):
    """First occurrence at or after a code-point offset; the quote must be verbatim."""
    i = raw.find(quote, after)
    if i < 0:
        fail(f"not found after {after}: {quote}")
    return {"path": str(RAW), "offset": i, "length": len(quote), "quote": quote}


# --- puzhu:06 ---------------------------------------------------------------------------------------
p4 = json.loads(P4_AUTHORITY.read_text(encoding="utf-8"))
locked = next(p for p in p4["puzhu"] if p["id"] == "puzhu:06")["raw"]
rule = span(locked["text"])
if rule["offset"] != locked["offset"]:
    fail(f"puzhu:06 offset {rule['offset']} != locked {locked['offset']}")
at = rule["offset"]
parts = {
    "triggers": span("凡徳合赦願月恩四相時徳等日不註忌", at),
    "headings": span("進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財", at),
    "exceptionYouJi": span("如遇徳猶忌", at),
    "exceptionCongJi": span("從忌不從宜之日則仍註忌", at),
}
for k, s in parts.items():
    if not at <= s["offset"] < at + rule["length"]:
        fail(f"{k} outside puzhu:06")

# Raw heading → P4 heading (NAMING_ONLY: 劵/券, 醖/醞). Order as printed.
HEADINGS = [
    {"raw": "進人口", "p4": "進人口", "scope": "OUT_OF_HEADING_SCOPE"},
    {"raw": "安牀", "p4": "安牀", "scope": "IN_SCOPE"},
    {"raw": "經絡", "p4": "經絡", "scope": "OUT_OF_HEADING_SCOPE"},
    {"raw": "醖釀", "p4": "醞釀", "scope": "OUT_OF_HEADING_SCOPE"},
    {"raw": "開市", "p4": "開市", "scope": "IN_SCOPE"},
    {"raw": "立劵交易", "p4": "立券交易", "scope": "IN_SCOPE"},
    {"raw": "納財", "p4": "納財", "scope": "IN_SCOPE"},
    {"raw": "開倉庫出貨財", "p4": "開倉庫出貨財", "scope": "IN_SCOPE"},
]
if "".join(h["raw"] for h in HEADINGS) != parts["headings"]["quote"]:
    fail("heading list does not rebuild the printed span")
# 「徳合赦願」 = 天德 月德 天德合 月德合 + 天赦 天願; 「等日」 adds nothing (PRD FR-01).
TRIGGERS = ["天德", "月德", "天德合", "月德合", "天赦", "天願", "月恩", "四相", "時德"]

# --- 等第 grades and puzhu:27 ------------------------------------------------------------------------
grades = {}
for g in p4["grades"]:
    s = span(g["prose"]["text"], g["prose"]["offset"])
    if s["offset"] != g["prose"]["offset"]:
        fail(f"grade {g['id']} offset drift")
    grades[g["id"]] = {"label": g["label"], "withDe": g["withDe"], "withoutDe": g["withoutDe"], "prose": s}
end = json.loads(PUZHU_END.read_text(encoding="utf-8"))
p27 = next(x for x in end["source"] if x["id"] == "puzhu:27")
puzhu27 = span(p27["text"])
if puzhu27["offset"] != p27["offset"]:
    fail("puzhu:27 offset drift")

# --- Entry clauses that decide the classes seen on 2025-2027 -----------------------------------------
clauses = {
    "月破:猶忌": span("猶忌之止不忌", 8001),
    "月破:又為大耗": span("又為大耗忌修倉庫開市立劵交易納財開倉庫出貨財", 8001),
    "災煞:辰戌丑未不與德神併如常例": span("辰戌丑未月不與德神併如常例", 11834),
    "月煞:平日閉日與德併如常例": span("辰戌丑未月值平日與天德月德天德合月德合併如常例", 12132),
    "月煞:又為月虛": span("又為月虛忌修倉庫開倉庫出貨財", 12132),
    "九空:defer": span("己亥月值月厭從月厭論辰戌丑未月值破日從月破論", 18266),
}
LIFT_LISTS = {
    "九空": span("寅申月值滿日子午卯酉月值開日與月德天德合月德合併則不忌", 18266),
    "五虛": span("與天德月德天德合月德合六合併則不忌", 17795),
    "小耗": span("與天德月德天德合月德合天願併則不忌子午卯酉月值刼煞雖與德合併猶忌", 16711),
    "五離": span("與天德月德天德合月德合天赦三合六合併則不忌", 19464),
    "五墓": span("五月十一月與月德併則不忌", 18052),
}
# Q4a: the 五墓 commentary refuses 德合 as a lift (「…不取德合者不同行也」).
EXCLUSIONS = {
    "五墓": {"triggers": ["天德合", "月德合"], "basis": span("不取德合者不同行也", 18052)},
}
rem = {e["han"]: e for e in json.loads(REMAINING.read_text(encoding="utf-8"))["entries"]}
for g in LIFT_LISTS:
    if g not in rem:
        fail(f"{g} not a remaining-ji v7 entry")
for g, x in EXCLUSIONS.items():
    if g not in LIFT_LISTS or not set(x["triggers"]) <= set(TRIGGERS):
        fail(f"exclusion {g} outside liftLists/triggers")
DEFER = {
    g: [{"months": c["months"], "target": c["target"]} for c in e.get("conditions", []) if c["effect"] == "defer"]
    for g, e in rem.items()
    if any(c["effect"] == "defer" for c in e.get("conditions", []))
}
if DEFER.get("九空") != [{"months": ["巳", "亥"], "target": "月厭"}, {"months": ["辰", "戌", "丑", "未"], "target": "月破"}]:
    fail("九空 defer drift")

# --- Owner decision and the class table --------------------------------------------------------------
DECISION = {
    "date": "2026-10-16",
    "status": "OWNER_ADOPTED",
    "canonical": False,
    "convention": "yes = puzhu:06 lifts the 忌",
    "answers": {
        "Q1": {"answer": "no", "question": "如常例 with 等第 grade 從忌不從宜: lift?"},
        "Q2": {"answer": "no", "question": "「與德…併如常例」 (not 遇德猶忌): lift?"},
        "Q3": {"answer": "no", "question": "如常例 without a 等第 column (月破 without 德): lift?"},
        "Q4": {"answer": "yes", "question": "remaining-ji with its own 「與…併則不忌」 list: lift?"},
        "Q4a": {"answer": "block", "question": "does 五墓 「不取德合」 block puzhu:06's 德合 triggers?"},
    },
    "record": "tasks/prd-p4b-puzhu06.md §8",
}
CLASSES = {
    "YOUJI": {"action": "keep", "basis": "exceptionYouJi", "when": "subject clauseEffect still_avoid"},
    "ZHUSHI": {"action": "keep", "basis": "exceptionCongJi (諸事皆忌 ⊇ 從忌不從宜)", "when": "subject clauseEffect avoid_all"},
    "PUZHU27": {"action": "keep", "basis": "puzhu27", "when": "puzhuEnd death-defeat restoration"},
    "AN": {"action": "keep", "basis": "Q1 no", "when": "as_usual, 等第 grade present, 德 absent"},
    "AD": {"action": "keep", "basis": "Q1 no, Q2 no", "when": "as_usual, 等第 grade present, 德 present"},
    "AU": {"action": "keep", "basis": "Q3 no", "when": "as_usual, no 等第 column, clause owned by the subject"},
    "QL": {"action": "lift", "basis": "Q4 yes", "when": "remaining-ji kept, god in liftLists, a trigger outside its exclusions"},
    "QL_EXCLUDED": {"action": "keep", "basis": "Q4a block", "when": "remaining-ji kept, god in liftLists, every present trigger excluded for it"},
    "UNDETERMINED": {"action": "hold", "when": "P4-B scope undetermined, subject or remaining state undetermined, parent 相抵 or absent"},
    "PROTECTED": {"action": "untouched", "when": "remaining or 又為 state protected (row is protected)"},
}
INHERIT = {
    "subjectVia": "as_usual without 等第 whose owner differs from the subject: class of the owner's own record",
    "youwei": {"大耗": "月破", "月虛": "月煞"},
    "remainingDefer": DEFER,
    "parentCancelBoth": "UNDETERMINED (P4-B 相抵 with an open 又為 list; P5 F3)",
}
authority = {
    "version": "p4b-puzhu06-v2",
    "scope": "AUDIT_ONLY",
    "scoringReady": False,
    "status": DECISION["status"],
    "raw": {"path": str(RAW), "sha256": sha256(RAW.read_bytes()), "scan": "06067686.cn (卷十)"},
    "rule": {"id": "puzhu:06", **rule, "parts": parts},
    "headings": HEADINGS,
    "triggers": TRIGGERS,
    "triggerNotTriggers": ["三合", "六合", "母倉", "滿日"],
    "grades": grades,
    "puzhu27": puzhu27,
    "clauses": clauses,
    "liftLists": LIFT_LISTS,
    "liftExclusions": EXCLUSIONS,
    "parent": {"version": "p4b-puzhu06-v1", "path": str(PARENT), "sha256": sha256(PARENT.read_bytes())},
    "ownerDecision": DECISION,
    "classes": CLASSES,
    "inherit": INHERIT,
    "rowRule": {
        "touch": "heading IN_SCOPE, a trigger present, ji true, protectedJi false, no dayRule",
        "lift": "every source class has action lift",
        "hold": "any source class UNDETERMINED → row unchanged",
        "keep": "any keep class → row unchanged",
        "unknownSource": "SPEC_GAP: stop, never guess",
    },
    "stateAfterLift": {
        "ji": False,
        "yi": "unchanged",
        "state": {"yi true": "only_yi", "yi false": "not_recorded", "yi unknown": "undetermined"},
        "propagation": "puzhu:06 runs before applyP4Propagation; a lift never yields neither_recorded",
    },
    "reviewer": "Claude, single agent; no independent second review",
}
validation = {
    "version": "p4b-puzhu06-authority-validation-v2",
    "spans": 1 + len(parts) + len(grades) + 1 + len(clauses) + len(LIFT_LISTS) + len(EXCLUSIONS),
    "puzhu06LockedOffset": locked["offset"],
    "gradesMatchLocked": sorted(grades),
    "puzhu27LockedOffset": p27["offset"],
    "deferEntries": sorted(DEFER),
    "liftListsInRemainingV7": sorted(LIFT_LISTS),
    "inScopeHeadings": [h["p4"] for h in HEADINGS if h["scope"] == "IN_SCOPE"],
}

files = {
    OUT: json.dumps(authority, ensure_ascii=False, indent=2) + "\n",
    DIR / "validation.json": json.dumps(validation, ensure_ascii=False, indent=2) + "\n",
}
lock_paths = [DIR / "build.py", OUT, DIR / "validation.json", RAW, P4_AUTHORITY, PUZHU_END, REMAINING, PARENT]


def lock_text():
    data = {p: (files[p].encode() if p in files else p.read_bytes()) for p in lock_paths}
    return json.dumps(
        {"version": "p4b-puzhu06-authority-lock-v2", "files": [{"path": str(p), "sha256": sha256(b)} for p, b in data.items()]},
        ensure_ascii=False,
        indent=2,
    ) + "\n"


files[DIR / "lock.json"] = lock_text()
for path, content in files.items():
    if WRITE:
        path.write_text(content, encoding="utf-8")
    elif not path.exists() or path.read_text(encoding="utf-8") != content:
        fail(f"{path} differs; run with --write")
print("OK", authority["version"], validation["spans"], "spans")

"""F1 Stage 3 (owner R2, 2026-10-26): authority p4b-puzhu06-v4 = v3 + liftExclusions.五離.

A generic puzhu:06 trigger cannot lift 五離's 忌: the excluded triggers are exactly the puzhu:06 triggers
that 五離's own entry 「與天德月德天德合月德合天赦三合六合併則不忌」 does not name (computed, not typed).
Same mechanism as Q4a (五墓). 五離's 忌 meets the puzhu:06 headings only on 立券交易. v1–v3 stay
byte-identical; v3 is the rollback.
Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v4/build.py [--write]
Without --write it rebuilds everything and fails if the committed files differ.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

DIR = Path("docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v4")
OUT = Path("shared/almanac-data/p4b-puzhu06-v4.json")
PARENT = Path("shared/almanac-data/p4b-puzhu06-v3.json")
RAW = Path("docs/audits/sources/p4-vol10/vol10.raw.txt")
RULING = Path("docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json")
WRITE = "--write" in sys.argv
sha256 = lambda b: hashlib.sha256(b).hexdigest()


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


raw = RAW.read_text(encoding="utf-8")
v3 = json.loads(PARENT.read_text(encoding="utf-8"))
ruling = json.loads(RULING.read_text(encoding="utf-8"))
if ruling["decision"] != "R2_APPROVED":
    fail("owner ruling is not R2_APPROVED")
own = v3["liftLists"]["五離"]
if raw[own["offset"]:own["offset"] + own["length"]] != own["quote"]:
    fail("五離 lift quote not at its offset")
excluded = [t for t in v3["triggers"] if t not in own["quote"]]
if excluded != ["天願", "月恩", "四相", "時德"]:
    fail(f"unexpected 五離 exclusion set {excluded}")
if "五離" in v3["liftExclusions"]:
    fail("v3 already excludes 五離")

v4 = copy.deepcopy(v3)
v4["version"] = "p4b-puzhu06-v4"
v4["liftExclusions"]["五離"] = {
    "triggers": excluded,
    "basis": {k: own[k] for k in ("path", "offset", "length", "quote")},
    "ruling": f"{RULING} ({ruling['decision']}, {ruling['date']})",
}
v4["parent"] = {"version": v3["version"], "path": str(PARENT), "sha256": sha256(PARENT.read_bytes())}
v4["ownerDecision"]["answers"]["R2"] = {
    "answer": "block",
    "question": "can a puzhu:06 trigger outside 五離's own lift list lift 五離 (立券交易)?",
    "date": ruling["date"],
    "record": str(RULING),
}
v4["classes"]["QL_EXCLUDED"]["basis"] = "Q4a block (五墓); F1 R2 block (五離)"

validation = {
    "version": "p4b-puzhu06-authority-validation-v4",
    "wuliQuoteOffset": own["offset"],
    "wuliExcludedTriggers": excluded,
    "wuliOwnTriggers": [t for t in v3["triggers"] if t in own["quote"]],
    "otherLiftListsUnchanged": sorted(g for g in v4["liftLists"] if g != "五離"),
    "diffFromV3": sorted(k for k in v4 if v4[k] != v3.get(k)),
}
if validation["diffFromV3"] != ["classes", "liftExclusions", "ownerDecision", "parent", "version"]:
    fail(f"v4 moves more than intended: {validation['diffFromV3']}")

outputs = {
    OUT: json.dumps(v4, ensure_ascii=False, indent=2) + "\n",
    DIR / "validation.json": json.dumps(validation, ensure_ascii=False, indent=2) + "\n",
}
lock_paths = [DIR / "build.py", OUT, DIR / "validation.json", RAW, PARENT, RULING]


def lock_text():
    return json.dumps(
        {"version": "p4b-puzhu06-authority-lock-v4",
         "files": [{"path": str(p), "sha256": sha256(outputs[p].encode() if p in outputs else p.read_bytes())}
                   for p in lock_paths]},
        ensure_ascii=False, indent=2) + "\n"


outputs[DIR / "lock.json"] = lock_text()
for path, content in outputs.items():
    if WRITE:
        path.write_text(content, encoding="utf-8")
    elif not path.exists() or path.read_text(encoding="utf-8") != content:
        fail(f"{path} differs; run with --write")
print("OK", v4["version"], "excludes 五離 for", excluded)

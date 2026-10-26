"""Q4-REST Stage 3 (owner R-JK / R-WX / R-XH / R-F1Y, 2026-10-26): authority p4b-puzhu06-v5 = v4 + three narrow
lift exclusions, their scoped 宜 rule, and one heading-level 宜 composition rule.

R-JK / R-WX / R-XH: a generic puzhu:06 trigger cannot lift 九空 / 五虛 / 小耗. The excluded triggers are the
puzhu:06 triggers absent from the god's own 卷十 lift text (longest-first tokens, so 天德合 never reads as 天德;
五虛 also takes 天願 from the 四庫 note 「天願必是六合故不言而已在其中」). Computed, not typed. Such a kept row is
class QL_NARROW (keep), and when every other class of the row lifts and 宜 is noted, the final state is only_ji
(tag Q4_REST_OWNER_ONLY_JI). This is the owner's scoped 宜 rule, not a general composition rule.
R-F1Y: yiComposition — on 立券交易, a both_present row whose only surviving 忌 is 五離 is only_ji.
五墓 (Q4a) and 五離 (R2) exclusions stay byte-identical. v1–v4 stay byte-identical; v4 is the rollback.
Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v5/build.py [--write]
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

DIR = Path("docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v5")
OUT = Path("shared/almanac-data/p4b-puzhu06-v5.json")
PARENT = Path("shared/almanac-data/p4b-puzhu06-v4.json")
RAW = Path("docs/audits/sources/p4-vol10/vol10.raw.txt")
RULING = Path("docs/audits/sources/p4-vol10/q4-rest-stage3/owner-ruling.json")
WRITE = "--write" in sys.argv
sha256 = lambda b: hashlib.sha256(b).hexdigest()
NOTE_WUXU = "天願必是六合故不言而已在其中"
# Expected results (owner packets, Stage 2C draft-rulings.json); the build stops if the derivation differs.
EXPECT_OWN = {"九空": ["月德", "天德合", "月德合"], "五虛": ["天德", "月德", "天德合", "月德合", "天願"],
              "小耗": ["天德", "月德", "天德合", "月德合", "天願"]}
EXPECT_HEADINGS = {"九空": ["開市", "立券交易", "納財", "開倉庫出貨財"], "五虛": ["開倉庫出貨財"],
                   "小耗": ["開市", "立券交易", "納財", "開倉庫出貨財"]}
RULE_OF = {"九空": "R-JK", "五虛": "R-WX", "小耗": "R-XH"}


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


def tokens(text, vocab):
    """Names of `vocab` in `text`, longest first, each occurrence consumed once."""
    found = []
    for name in sorted(vocab, key=len, reverse=True):
        if name in text:
            found.append(name)
            text = text.replace(name, "")
    return found


raw = RAW.read_text(encoding="utf-8")
v4 = json.loads(PARENT.read_text(encoding="utf-8"))
ruling = json.loads(RULING.read_text(encoding="utf-8"))
if [ruling["rulings"][r]["decision"] for r in ("R-JK", "R-WX", "R-XH", "R-F1Y")] != ["ADOPT"] * 3 + ["ADOPT_ALL_21"]:
    fail("owner ruling is not the adopted set")
in_scope = {h["raw"]: h["p4"] for h in v4["headings"] if h["scope"] == "IN_SCOPE"}

v5 = copy.deepcopy(v4)
v5["version"] = "p4b-puzhu06-v5"
derived = {}
for god, rid in RULE_OF.items():
    lift = v4["liftLists"][god]
    if raw[lift["offset"]:lift["offset"] + lift["length"]] != lift["quote"]:
        fail(f"{god} lift quote not at its offset")
    own = tokens(lift["quote"], v4["triggers"])
    bases = [{k: lift[k] for k in ("path", "offset", "length", "quote")}]
    if god == "五虛":
        at = raw.find(NOTE_WUXU, lift["offset"])
        if at < 0 or at - lift["offset"] > 40:
            fail("五虛 天願 note not next to its lift text")
        own.append("天願")
        bases.append({"path": str(RAW), "offset": at, "length": len(NOTE_WUXU), "quote": NOTE_WUXU})
    own = [t for t in v4["triggers"] if t in own]
    if own != EXPECT_OWN[god]:
        fail(f"{god} own lifters {own} != {EXPECT_OWN[god]}")
    excluded = [t for t in v4["triggers"] if t not in own]
    # The god's 卷十 忌 line (the 「忌…」 line that holds or precedes its lift text) ∩ puzhu:06 headings.
    start = raw.rfind("　　忌", 0, lift["offset"] + 1) + 2
    ji_line = raw[start:raw.find("與", start)] if raw.find("與", start) < raw.find("\n", start) else \
        raw[start:raw.find("\n", start)]
    heads = [in_scope[r] for r in in_scope if r in ji_line]
    if heads != EXPECT_HEADINGS[god]:
        fail(f"{god} puzhu:06 headings {heads} != {EXPECT_HEADINGS[god]}")
    if god in v4["liftExclusions"]:
        fail(f"v4 already excludes {god}")
    v5["liftExclusions"][god] = {
        "triggers": excluded,
        "basis": bases[0] if len(bases) == 1 else bases,
        "ruling": f"{RULING} ({rid} {ruling['rulings'][rid]['decision']}, {ruling['date']})",
        "class": "QL_NARROW",
    }
    derived[god] = {"own": own, "excluded": excluded, "jiLine": ji_line, "puzhu06Headings": heads}

v5["classes"]["QL_NARROW"] = {
    "action": "keep",
    "basis": "owner R-JK / R-WX / R-XH (2026-10-26)",
    "when": "remaining-ji kept, god's liftExclusions entry has class QL_NARROW, every present trigger excluded for it",
    "yi": {"tag": "Q4_REST_OWNER_ONLY_JI",
           "rule": "when every other class of the row lifts and the final state is both_present, the state is only_ji "
                   "(the 忌 survives because of the ruling alone); otherwise the row is unchanged"},
}
v5["yiComposition"] = [{
    "id": "R-F1Y", "heading": "立券交易", "soleJi": "五離", "from": "both_present", "to": "only_ji",
    "rule": "on 立券交易, a both_present row whose only surviving 忌 is 五離 is only_ji",
    "ruling": f"{RULING} (R-F1Y ADOPT_ALL_21, {ruling['date']})",
}]
v5["parent"] = {"version": v4["version"], "path": str(PARENT), "sha256": sha256(PARENT.read_bytes())}
for rid, q in (("R-JK", "can a generic puzhu:06 trigger lift 九空?"),
               ("R-WX", "can a generic puzhu:06 trigger lift 五虛 (開倉庫出貨財)?"),
               ("R-XH", "can a generic puzhu:06 trigger lift 小耗?")):
    v5["ownerDecision"]["answers"][rid] = {"answer": "block", "question": q, "date": ruling["date"],
                                           "record": str(RULING)}
v5["ownerDecision"]["answers"]["R-F1Y"] = {
    "answer": "only_ji", "question": "五離 sole surviving 忌 + independent 宜 on 立券交易: only_ji or both_present?",
    "date": ruling["date"], "record": str(RULING)}

validation = {
    "version": "p4b-puzhu06-authority-validation-v5",
    "derived": derived,
    "unchangedExclusions": {g: v5["liftExclusions"][g] == v4["liftExclusions"][g] for g in v4["liftExclusions"]},
    "otherLiftListsUnchanged": v5["liftLists"] == v4["liftLists"],
    "diffFromV4": sorted(k for k in v5 if v5[k] != v4.get(k)),
}
if validation["diffFromV4"] != ["classes", "liftExclusions", "ownerDecision", "parent", "version", "yiComposition"]:
    fail(f"v5 moves more than intended: {validation['diffFromV4']}")
if not all(validation["unchangedExclusions"].values()) or not validation["otherLiftListsUnchanged"]:
    fail("v4 exclusions or lift lists changed")

outputs = {
    OUT: json.dumps(v5, ensure_ascii=False, indent=2) + "\n",
    DIR / "validation.json": json.dumps(validation, ensure_ascii=False, indent=2) + "\n",
}
lock_paths = [DIR / "build.py", OUT, DIR / "validation.json", RAW, PARENT, RULING]
outputs[DIR / "lock.json"] = json.dumps(
    {"version": "p4b-puzhu06-authority-lock-v5",
     "files": [{"path": str(p), "sha256": sha256(outputs[p].encode() if p in outputs else p.read_bytes())}
               for p in lock_paths]}, ensure_ascii=False, indent=2) + "\n"
for path, content in outputs.items():
    if WRITE:
        path.write_text(content, encoding="utf-8")
    elif not path.exists() or path.read_text(encoding="utf-8") != content:
        fail(f"{path} differs; run with --write")
print("OK", v5["version"], {g: d["excluded"] for g, d in derived.items()})

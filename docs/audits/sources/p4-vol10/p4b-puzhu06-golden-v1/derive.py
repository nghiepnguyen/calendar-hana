"""puzhu:06 task 3.0: independent Golden under authority p4b-puzhu06-v1 (owner: Q1-Q3 no, Q4 yes).
Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/derive.py [--write]
Without --write it rederives everything and fails if the committed files differ.

Independence: standard library only. No resolver, composer or TypeScript code is read.
- Trigger presence (the nine puzhu:06 gods) and puzhu:28 are recomputed here from literal tables,
  each checked verbatim against the locked raw volumes (卷五, 卷十).
- The puzhu:06 decision (classes, inheritance, row rule, state after lift) is reimplemented from
  the authority JSON.
- Frozen upstream inputs, not re-derived: the P4-C sweep TSV (dated Month Jian, pillar and final
  heading state) and the task 1.0 baseline source inventory (P4-B 忌 sources per row, commit
  6f970cd). Both are P4-B/P4-C facts accepted with their own Goldens; puzhu:06 is not in them.
- The engine baseline's trigger and state columns are compared only after expected is built
  (validation phase). A mismatch stops the run and never tunes expected values.
"""
import csv
import hashlib
import json
import sys
from itertools import combinations
from pathlib import Path

csv.field_size_limit(1 << 24)
OUT = Path("docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1")
INDEX = Path("shared/almanac-data/golden-p4b-puzhu06-v1.json")
SRC = Path("docs/audits/sources/p4-vol10")
AUTHORITY = Path("shared/almanac-data/p4b-puzhu06-v1.json")
P4C_SWEEP = Path("docs/audits/p4-vol10-yi-operands-2025-2027.tsv")
BASE = SRC / "p4b-puzhu06-baseline-v1"
VOL = {5: SRC / "vol05.raw.txt", 10: SRC / "vol10.raw.txt"}
WRITE = "--write" in sys.argv

sha256 = lambda b: hashlib.sha256(b).hexdigest()
text = {n: p.read_text(encoding="utf-8") for n, p in VOL.items()}


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


def quote(vol, q):
    i = text[vol].find(q)
    if i < 0:
        fail(f"vol{vol}: {q!r} not found")
    return {"volume": vol, "offset": i, "quote": q}


def tsv(path):
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


A = json.loads(AUTHORITY.read_text(encoding="utf-8"))
HEADINGS = [h["p4"] for h in A["headings"] if h["scope"] == "IN_SCOPE"]
TRIGGERS = A["triggers"]
CLASSES = A["classes"]
LIFT_GODS = set(A["liftLists"])
YOUWEI = A["inherit"]["youwei"]
DEFER = A["inherit"]["remainingDefer"]

# --- Trigger presence (卷五), same literals as the frozen P5 Golden ---------------------------------
STEMS = "甲乙丙丁戊己庚辛壬癸"
BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
JIAN = "寅卯辰巳午未申酉戌亥子丑"  # month 1..12
SEASON = "春春春夏夏夏秋秋秋冬冬冬"  # by Month Jian
norm_stem = lambda s: s.replace("巳", "己")  # raw writes 巳 in stem slots (NAMING_ONLY)
SOURCES = {
    "天德": quote(5, "正月丁二月坤三月壬四月辛五月乾六月甲七月癸八月艮九月丙十月乙十一月巽十二月庚"),
    "天德合": quote(5, "正月壬三月丁四月丙六月巳七月戊九月辛十月庚十二月乙是也四仲之月天徳居四維故無合也"),
    "月德": quote(5, "月徳者正五九月在丙二六十月在甲三七十一月在壬四八十二月在庚"),
    "月德合": quote(5, "月徳合者正五九月在辛二六十月在巳三七十一月在丁四八十二月在乙"),
    "天赦": quote(5, "春戊寅夏甲午秋戊申冬甲子"),
    "天願": quote(5, "起例曰正月乙亥二月甲戌三月乙酉四月丙申五月丁未六月戊午七月己巳八月庚辰九月辛卯十月壬寅十一月癸丑十二月甲子"),
    "月恩": quote(5, "正月丙二月丁三月庚四月巳五月戊六月辛七月壬八月癸九月庚十月乙十一月甲十二月辛"),
    "四相": quote(5, "春丙丁夏戊巳秋壬癸冬甲乙"),
    "時德": quote(5, "春木生午火夏火生辰土秋金生子水冬水生寅木也四相取天干時徳取地支"),
    "puzhu:28": quote(10, "二月甲戌四月丙申六月甲子七月戊申八月庚辰九月辛夘十月甲子十二月甲子徳合與赦願所㑹之辰諸事不忌"),
}
TIANDE = "丁坤壬辛乾甲癸艮丙乙巽庚"  # trigram months match no day
TIANDE_HE = {0: "壬", 2: "丁", 3: "丙", 5: "己", 6: "戊", 8: "辛", 9: "庚", 11: "乙"}
YUEDE = "丙甲壬庚" * 3
YUEDE_HE = "辛己丁乙" * 3
TIANSHE = {"春": "戊寅", "夏": "甲午", "秋": "戊申", "冬": "甲子"}
TIANYUAN = ["乙亥", "甲戌", "乙酉", "丙申", "丁未", "戊午", "己巳", "庚辰", "辛卯", "壬寅", "癸丑", "甲子"]
YUEEN = norm_stem("丙丁庚巳戊辛壬癸庚乙甲辛")
SIXIANG = {"春": "丙丁", "夏": "戊己", "秋": "壬癸", "冬": "甲乙"}
SHIDE = {"春": "午", "夏": "辰", "秋": "子", "冬": "寅"}
# 未 printed 甲子, adopted 甲午: owner print correction 2026-10-12 (remaining-ji v7, P4-B).
PUZHU28 = {("卯", "甲戌"), ("巳", "丙申"), ("未", "甲午"), ("申", "戊申"), ("酉", "庚辰"), ("戌", "辛卯"), ("亥", "甲子"), ("丑", "甲子")}


def triggers(jian, pillar):
    mi, season = JIAN.index(jian), SEASON[JIAN.index(jian)]
    stem, branch = pillar[0], pillar[1]
    present = {
        "天德": TIANDE[mi] == stem,
        "月德": YUEDE[mi] == stem,
        "天德合": TIANDE_HE.get(mi) == stem,
        "月德合": YUEDE_HE[mi] == stem,
        "天赦": TIANSHE[season] == pillar,
        "天願": TIANYUAN[mi] == pillar,
        "月恩": YUEEN[mi] == stem,
        "四相": stem in SIXIANG[season],
        "時德": SHIDE[season] == branch,
    }
    return [g for g in TRIGGERS if present[g]]


# --- puzhu:06 decision (authority) -----------------------------------------------------------------
class SpecGap(Exception):
    pass


def clause_class(rec):
    """Class of a subject's own clause, whatever its state on the heading (parents, owners)."""
    if rec is None or rec.get("scope") == "undetermined":
        return "UNDETERMINED"
    e = rec["clauseEffect"]
    if e == "still_avoid":
        return "YOUJI"
    if e == "avoid_all":
        return "ZHUSHI"
    if e == "cancel_both":
        return "UNDETERMINED"  # 相抵 parent with an open list (P5 F3)
    if e == "as_usual":
        if rec["grade"] is not None:
            return "AD" if rec["dePresent"] else "AN"
        return "AU"
    if e == "only_avoid":
        return "PROTECTED"
    raise SpecGap(f"clause effect {e}")


def subject_class(rec, subjects):
    if rec.get("scope") == "undetermined" or rec["state"] == "undetermined":
        return "UNDETERMINED"
    c = clause_class(rec)
    if c == "AU" and rec["owner"] != rec["name"]:
        return clause_class(subjects.get(rec["owner"]))  # 從…論: the owner's own record
    return c


def classify(sources, month, yi):
    subjects = {s["name"]: s for s in sources if s["kind"] == "subject"}
    out = []
    for s in sources:
        k = s["kind"]
        if k == "subject":
            # P4-C reading: a 止忌 scope cannot stay undetermined once 宜 is known false (not_avoided).
            if s.get("clauseEffect") == "only_avoid" and s.get("state") == "undetermined" and yi == "false":
                continue
            if s.get("scope") == "undetermined" or s["state"] in ("only_ji", "both_present", "undetermined"):
                out.append(subject_class(s, subjects))
        elif k == "youwei":
            out.append("PROTECTED" if s["protected"] else clause_class(subjects.get(YOUWEI[s["name"]])))
        elif k == "remaining":
            if s["state"] == "protected":
                out.append("PROTECTED")
            elif s["state"] == "undetermined":
                out.append("UNDETERMINED")
            elif s["effect"] == "defer":
                target = next((d["target"] for d in DEFER.get(s["name"], []) if month in d["months"]), None)
                if target is None:
                    raise SpecGap(f"defer {s['name']} in {month}")
                out.append(clause_class(subjects.get(target)))
            elif s["name"] in LIFT_GODS:
                out.append("QL")
            else:
                raise SpecGap(f"remaining {s['name']} not in liftLists")
        elif k == "puzhuEnd":
            out.append("PUZHU27")
        else:
            raise SpecGap(f"source kind {k}")
    if not out:
        raise SpecGap("忌 without a source")
    return sorted(set(out))


def decide(row):
    """row: heading, month, triggers, day_rule, yi, ji, protected, state, sources."""
    before = {"ji": row["ji"], "state": row["state"]}
    touch = (row["heading"] in HEADINGS and row["triggers"] and row["ji"]
             and not row["protected"] and not row["day_rule"])
    if not touch:
        return {"action": "untouched", "classes": [], **before}
    classes = classify(row["sources"], row["month"], row["yi"])
    actions = {CLASSES[c]["action"] for c in classes}
    if "untouched" in actions:
        raise SpecGap("protected source on an unprotected row")
    action = "hold" if "hold" in actions else "keep" if "keep" in actions else "lift"
    if action != "lift":
        return {"action": action, "classes": classes, **before}
    state = {"true": "only_yi", "false": "not_recorded", "unknown": "undetermined"}[row["yi"]]
    return {"action": "lift", "classes": classes, "ji": False, "state": state}


# --- 3.1 Fixtures (abstract source records) --------------------------------------------------------
def subj(name, effect, grade=None, de=False, state="only_ji", owner=None):
    return {"kind": "subject", "name": name, "owner": owner or name, "clauseEffect": effect,
            "grade": grade, "gradeAction": None, "dePresent": de, "state": state}


ONE = {
    "YOUJI": [subj("月破", "still_avoid", de=True)],
    "ZHUSHI": [subj("月煞", "avoid_all", "xia")],
    "PUZHU27": [{"kind": "puzhuEnd", "name": "deathDefeat", "subjects": ["大時"]}],
    "AN": [subj("災煞", "as_usual", "zhong")],
    "AD": [subj("月煞", "as_usual", "xia", de=True)],
    "AU": [subj("月破", "as_usual")],
    "QL": [{"kind": "remaining", "name": "九空", "effect": "keep", "state": "kept"}],
    "UNDETERMINED": [{"kind": "subject", "name": "閉日", "scope": "undetermined"}],
}
fixtures = []


def fx(fid, sources, heading="開市", month="卯", trig=("月恩",), yi="false", ji=True,
       protected=False, state="only_ji", day_rule=""):
    row = {"heading": heading, "month": month, "triggers": list(trig), "day_rule": day_rule,
           "yi": yi, "ji": ji, "protected": protected, "state": state, "sources": sources}
    try:
        exp = decide(row)
    except SpecGap as e:
        exp = {"error": "SPEC_GAP", "detail": str(e)}
    fixtures.append({"id": fid, "input": row, "expected": exp})


for c, srcs in ONE.items():
    for yi, st in (("true", "both_present"), ("false", "only_ji"), ("unknown", "undetermined")):
        fx(f"class:{c}:yi={yi}", srcs, yi=yi, state=st)
for a, b in combinations(ONE, 2):
    fx(f"pair:{a}+{b}", ONE[a] + ONE[b])
for g in TRIGGERS:
    fx(f"trigger:{g}", ONE["QL"], trig=(g,))
for g in A["triggerNotTriggers"]:
    fx(f"not-trigger:{g}", ONE["QL"], trig=())
for h in HEADINGS:
    fx(f"heading:{h}", ONE["QL"], heading=h)
fx("out-of-list:修倉庫", ONE["QL"], heading="修倉庫")
fx("protected", ONE["QL"], protected=True)
fx("no-ji", [], ji=False, state="not_recorded")
fx("puzhu28", ONE["QL"], day_rule="puzhu28")
fx("via:AU->AN", [subj("月建", "as_usual", owner="月刑"), subj("月刑", "as_usual", "ci")])
fx("via:AU->missing", [subj("月建", "as_usual", owner="月刑")])
for parent, srcs in (("YOUJI", ONE["YOUJI"]), ("AU", ONE["AU"]), ("none", [])):
    fx(f"youwei:大耗<-{parent}", srcs + [{"kind": "youwei", "name": "大耗", "parent": "月破", "protected": False}])
fx("youwei:月虛<-cancel_both", [subj("月煞", "cancel_both", "shang_ci", state="neither_recorded"),
                                {"kind": "youwei", "name": "月虛", "parent": "月煞", "protected": False}],
   state="undetermined", yi="unknown")
fx("youwei:protected", [{"kind": "youwei", "name": "土府", "parent": "月建", "protected": True}])
fx("defer:九空丑->月破猶忌", ONE["YOUJI"] + [{"kind": "remaining", "name": "九空", "effect": "defer", "state": "kept"}], month="丑")
fx("defer:九空辰->月破AU", ONE["AU"] + [{"kind": "remaining", "name": "九空", "effect": "defer", "state": "kept"}], month="辰")
fx("defer:九空巳->月厭missing", [{"kind": "remaining", "name": "九空", "effect": "defer", "state": "kept"}], month="巳")
fx("defer:九空卯->no-target", [{"kind": "remaining", "name": "九空", "effect": "defer", "state": "kept"}], month="卯")
for g in sorted(LIFT_GODS):
    fx(f"ql:{g}", [{"kind": "remaining", "name": g, "effect": "keep", "state": "kept"}])
fx("ql+AN", ONE["QL"] + ONE["AN"])
fx("only_avoid-undetermined:yi=false", ONE["PUZHU27"] + [subj("大時", "only_avoid", "shang", state="undetermined")])
fx("only_avoid-undetermined:yi=unknown", ONE["PUZHU27"] + [subj("大時", "only_avoid", "shang", state="undetermined")], yi="unknown", state="undetermined")
fx("spec-gap:天賊", [{"kind": "remaining", "name": "天賊", "effect": "keep", "state": "kept"}])
fx("spec-gap:remaining-protected-on-open-row", [{"kind": "remaining", "name": "小耗", "effect": "keep", "state": "protected"}])

# --- 3.2 Dated (1,095) and context (720) ---------------------------------------------------------------
p4c = {}
for r in tsv(P4C_SWEEP):
    if r["heading"] in HEADINGS:
        p4c[(r["date"], r["heading"])] = r
base = {(r["id"], r["heading"]): r for r in tsv(BASE / "baseline.tsv")}
ctx_base = tsv(BASE / "context.tsv")
COLS = ["id", "month_jian", "pillar", "heading", "triggers", "puzhu28", "yi", "ji", "protected_ji",
        "state", "classes", "action", "after_ji", "after_state"]


def run(rid, month, pillar, heading, yi, ji, prot, state, sources):
    trig = triggers(month, pillar)
    p28 = (month, pillar) in PUZHU28
    row = {"heading": heading, "month": month, "triggers": trig, "day_rule": "puzhu28" if p28 else "",
           "yi": yi, "ji": ji == "true", "protected": prot == "true", "state": state,
           "sources": json.loads(sources) if sources else []}
    try:
        d = decide(row)
    except SpecGap as e:
        fail(f"SPEC_GAP {rid} {heading}: {e}")
    return [rid, month, pillar, heading, "+".join(trig), str(p28).lower(), yi, ji, prot, state,
            "+".join(d["classes"]), d["action"], str(d["ji"]).lower(), d["state"]]


dated = []
for (date, heading), r in sorted(p4c.items()):
    b = base.get((date, heading))
    if b is None:
        fail(f"no baseline sources for {date} {heading}")
    dated.append(run(date, r["month_jian"], r["pillar"], heading, r["after_final_yi"], r["after_final_ji"],
                     r["after_final_protected_ji"], r["after_final_state"], b["sources"]))
context = [run(r["id"], r["month_jian"], r["pillar"], r["heading"], r["yi"], r["ji"], r["protected_ji"],
               r["state"], r["sources"]) for r in ctx_base]
if len(dated) != 1095 * 5 or len(context) != 720 * 5:
    fail(f"domain sizes {len(dated)} / {len(context)}")


def tally(rows):
    out = {}
    for r in rows:
        key = r[11]
        out.setdefault(key, {}).setdefault(r[3], 0)
        out[key][r[3]] += 1
    return {k: dict(sorted(v.items())) for k, v in sorted(out.items())}


def exception_rows(rows):
    ex = {"YOUJI", "ZHUSHI", "PUZHU27"}
    out = {}
    for r in rows:
        if r[11] == "keep" and ex & set(r[10].split("+")):
            out[r[3]] = out.get(r[3], 0) + 1
    return dict(sorted(out.items()))


summary = {
    "version": "golden-p4b-puzhu06-summary-v1",
    "decision": {q: a["answer"] for q, a in A["ownerDecision"]["answers"].items()},
    "dated1095": {"byAction": tally(dated), "keptBySourcedException": exception_rows(dated),
                  "liftedDates": sorted({r[0] for r in dated if r[11] == "lift"})},
    "context720": {"byAction": tally(context), "keptBySourcedException": exception_rows(context)},
    "fixtures": {"count": len(fixtures),
                 "byAction": {a: sum(1 for f in fixtures if f["expected"].get("action", "error") == a)
                              for a in ("lift", "keep", "hold", "untouched", "error")}},
}

# --- Validation (after expected is built) ---------------------------------------------------------------
mism = []
for row in dated:
    b = base[(row[0], row[3])]
    for col, val in (("triggers", row[4]), ("yi", row[6]), ("ji", row[7]), ("protected_ji", row[8]), ("state", row[9])):
        if b[col] != val:
            mism.append(f"dated {row[0]} {row[3]} {col}: golden {val} engine {b[col]}")
    if (b["day_rule"] != "") != (row[5] == "true"):
        mism.append(f"dated {row[0]} {row[3]} puzhu28")
for row, b in zip(context, ctx_base):
    if b["triggers"] != row[4]:
        mism.append(f"context {row[0]} {row[3]} triggers: golden {row[4]} engine {b['triggers']}")
    if (b["day_rule"] != "") != (row[5] == "true"):
        mism.append(f"context {row[0]} {row[3]} puzhu28")
PRD = {  # tasks/prd-p4b-puzhu06.md §2 / §8, measured before this Golden
    "lift": {"安牀": 3, "立券交易": 28, "納財": 13, "開倉庫出貨財": 17, "開市": 16},
    "hold": {"安牀": 1, "立券交易": 1, "納財": 1, "開倉庫出貨財": 7, "開市": 1},
    "keptBySourcedException": {"安牀": 50, "立券交易": 53, "納財": 53, "開倉庫出貨財": 45, "開市": 53},
}
got = {"lift": summary["dated1095"]["byAction"].get("lift"), "hold": summary["dated1095"]["byAction"].get("hold"),
       "keptBySourcedException": summary["dated1095"]["keptBySourcedException"]}
for k, v in PRD.items():
    if got[k] != v:
        mism.append(f"PRD {k}: golden {got[k]} prd {v}")
validation = {
    "version": "golden-p4b-puzhu06-validation-v1",
    "engineBaseline": {"compared": ["triggers", "puzhu28", "yi", "ji", "protected_ji", "state"],
                       "rows": len(dated) + len(context), "mismatches": len(mism), "examples": mism[:20]},
    "prdCounts": {"compared": sorted(PRD), "match": not any(m.startswith("PRD") for m in mism)},
}
if mism:
    print("\n".join(mism[:40]))
    fail(f"{len(mism)} validation mismatches")

expected = {"version": "golden-p4b-puzhu06-expected-v1", "authority": A["version"],
            "sources": SOURCES, "fixtures": fixtures}
dump = lambda o: json.dumps(o, ensure_ascii=False, indent=2) + "\n"
table = lambda rows: "\t".join(COLS) + "\n" + "".join("\t".join(r) + "\n" for r in rows)
files = {
    OUT / "expected.json": dump(expected),
    OUT / "dated.tsv": table(dated),
    OUT / "context.tsv": table(context),
    OUT / "summary.json": dump(summary),
    OUT / "validation.json": dump(validation),
}
blob = lambda p: files[p].encode() if p in files else p.read_bytes()
index = {
    "schemaVersion": "p4b-puzhu06-golden-index-v1",
    "version": "golden-p4b-puzhu06-v1",
    "date": "2026-10-16",
    "status": "HASH_LOCKED_PRE_IMPLEMENTATION",
    "scope": "AUDIT_ONLY",
    "scoringReady": False,
    "authority": {"path": str(AUTHORITY), "sha256": sha256(AUTHORITY.read_bytes()), "version": A["version"]},
    "inputs": [{"path": str(p), "sha256": sha256(p.read_bytes())}
               for p in (P4C_SWEEP, BASE / "baseline.tsv", BASE / "context.tsv", VOL[5], VOL[10])],
    "blocks": [
        {"kind": "fixtures", "path": str(OUT / "expected.json"), "count": len(fixtures), "sha256": sha256(blob(OUT / "expected.json"))},
        {"kind": "dated1095", "path": str(OUT / "dated.tsv"), "format": "TSV", "count": len(dated), "sha256": sha256(blob(OUT / "dated.tsv"))},
        {"kind": "context720", "path": str(OUT / "context.tsv"), "format": "TSV", "count": len(context), "sha256": sha256(blob(OUT / "context.tsv"))},
    ],
    "recordCount": len(fixtures) + len(dated) + len(context),
    "lock": str(OUT / "lock.json"),
    "reviewer": "Claude, single agent; no independent second review",
}
files[INDEX] = dump(index)
lock_paths = [OUT / "derive.py", *files, AUTHORITY, *(Path(i["path"]) for i in index["inputs"])]
files[OUT / "lock.json"] = dump({"version": "golden-p4b-puzhu06-lock-v1",
                                 "files": [{"path": str(p), "sha256": sha256(blob(p))} for p in lock_paths]})
for path, content in files.items():
    if WRITE:
        path.write_text(content, encoding="utf-8")
    elif not path.exists() or path.read_text(encoding="utf-8") != content:
        fail(f"{path} differs; run with --write")
print("OK", index["version"], index["recordCount"], "records;", summary["dated1095"]["byAction"].get("lift"))

"""P5 task 2: build the 修倉庫 warehouse authority (owner decision D) from the locked raw sources.

Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p5-warehouse-authority-v1/build.py
Without --write it rebuilds everything and fails if the committed files differ.
Independent of the TypeScript audit code: no resolver, composer or presence table is imported.
"""

import hashlib
import json
import sys
from itertools import product
from pathlib import Path

OUT_DIR = Path("docs/audits/sources/p4-vol10/p5-warehouse-authority-v1")
AUTHORITY = Path("shared/almanac-data/p5-warehouse-v1.json")
RAW = {
    "ws-vol05-787341": (5, "docs/audits/sources/p4-vol10/vol05.raw.txt"),
    "ws-vol06-787343": (6, "docs/audits/sources/p4-vol10/vol06.raw.txt"),
    "ws-vol10-787351": (10, "docs/audits/sources/p4-vol10/vol10.raw.txt"),
    "ws-vol11-787353": (11, "docs/audits/sources/p4-vol10/yi-sources-v1/vol11.raw.txt"),
}
MANIFEST = Path("docs/audits/sources/p4-vol10/yi-sources-v1/manifest.json")
# Scans already locked in yi-mucang-v1 (卷十 母倉 entry, 卷十一 修倉庫 heading).
SCANS = {
    "vol10-mucang": "docs/audits/sources/p4-vol10/yi-mucang-v1/06067686-pdf97.png",
    "vol10-mucang-2": "docs/audits/sources/p4-vol10/yi-mucang-v1/06067686-pdf98.png",
    "vol11-xiucangku-39": "docs/audits/sources/p4-vol10/yi-mucang-v1/06067687-pdf39.png",
    "vol11-xiucangku-40": "docs/audits/sources/p4-vol10/yi-mucang-v1/06067687-pdf40.png",
}
BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
TRUC = "建除滿平定執破危成收開閉"

text = {sid: Path(path).read_text(encoding="utf-8") for sid, (_, path) in RAW.items()}
sha1 = lambda b: hashlib.sha1(b).hexdigest()
sha256 = lambda b: hashlib.sha256(b).hexdigest()


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


def span(sid, quote, after=None, within=None):
    """Unique code-point span of `quote`; with `after`, the one occurrence within `within` of it."""
    t = text[sid]
    hits = []
    if after is None:
        i = t.find(quote)
        while i >= 0:
            hits.append(i)
            i = t.find(quote, i + 1)
    else:
        a = t.find(after)
        while a >= 0:
            i = t.find(quote, a)
            if 0 <= i <= a + within:
                hits.append(i)
            a = t.find(after, a + 1)
    if len(hits) != 1:
        fail(f"{sid}: {quote!r} after {after!r}: {len(hits)} hits")
    vol, path = RAW[sid]
    return {
        "sourceId": sid,
        "volume": vol,
        "path": path,
        "offset": hits[0],
        "length": len(quote),
        "quote": quote,
        "sha1": sha1(Path(path).read_bytes()),
    }


# Source integrity against the collection manifest.
manifest = {s["sourceId"]: s for s in json.loads(MANIFEST.read_text(encoding="utf-8"))["rawSources"]}
for sid, (_, path) in RAW.items():
    b = Path(path).read_bytes()
    if manifest[sid]["sha1"] != sha1(b) or manifest[sid]["sha256"] != sha256(b):
        fail(f"{path} differs from {MANIFEST}")

V10, V11, V06, V05 = "ws-vol10-787351", "ws-vol11-787353", "ws-vol06-787343", "ws-vol05-787341"
W = 260  # characters after an entry anchor in which its warehouse clause must sit

# 2.1 — verbatim clauses.
heading = {
    "修倉庫": span(
        V11,
        "宜天徳月徳天徳合月徳合天赦天願三合滿日又收日母倉六合五富天倉與月徳四相時徳開日併者",
        after="{{SK anchor|修倉庫}}",
        within=40,
    ),
    "開倉庫出貨財": span(V11, "宜月恩四相時徳滿日五富", after="{{SK anchor|開倉庫出貨財}}", within=40),
}
bases10 = {
    "收日": span(V10, "與月恩四相時德併宜修倉庫", after="{{SK anchor|收日}}", within=W),
    "母倉": span(V10, "{{SK anchor|與月恩四相開日併宜修倉庫}}", after="{{SK anchor|母倉}}", within=W),
    "六合": span(V10, "{{SK anchor|與月恩四相時德併宜修倉庫}}", after="{{SK anchor|六合}}", within=W),
    "五富": span(V10, "{{SK anchor|與月恩四相時德併宜修倉庫}}", after="　　五富\n", within=W),
    "天倉": span(V10, "{{SK anchor|與月恩四相開日併宜修倉庫}}", after="{{SK anchor|天倉}}", within=W),
}
commentary = {
    "收日按": span(
        V10,
        "義取諸收無修造義故必與月恩四相時德併而後宜修倉庫若開日則雖宜修造不得與收日併若德合赦願則自宜修倉庫又不待與收日併也",
    ),
    "母倉義亦如此": span(V10, "{{SK anchor|母倉義亦如此}}"),
    "天倉注": span(V10, "{{SK notes|時德不得與天倉併}}"),
}
# 2.3 — direct gods listing 修倉庫 in their 卷十 宜 (entry header precedes the 宜 line).
direct10 = {
    "天德/月德/天德合/月德合": span(V10, "修倉庫", after="天德　月德　天德合　月德合\n", within=400),
    "天赦": span(V10, "修倉庫", after="{{SK anchor|天赦}}", within=300),
    "天願": span(V10, "修倉庫", after="{{SK anchor|天願}}", within=300),
    "三合": span(V10, "修倉庫", after="{{SK anchor|三合}}", within=200),
    "滿日": span(V10, "修倉庫", after="{{SK anchor|滿日}}", within=60),
}
definitions = {
    "天倉": span(V06, "歴例曰天倉者正月起寅逆行十二辰"),
    "時德": span(V05, "春木生午火夏火生辰土秋金生子水冬水生寅木也四相取天干時徳取地支"),
}

# 2.2 — readings. 卷十一 writes 徳; normalize to 德 for god names only.
norm = lambda s: s.replace("徳", "德")
DIRECT = ["天德", "月德", "天德合", "月德合", "天赦", "天願", "三合", "滿日"]
BASES = ["收日", "母倉", "六合", "五富", "天倉"]
R11_PARTNERS = ["月德", "四相", "時德", "開日"]
R10_PARTNERS = {}
for base, s in bases10.items():
    clause = s["quote"]
    names = clause[clause.index("與") + 1 : clause.index("併")]
    R10_PARTNERS[base] = [g for g in ["月恩", "四相", "時德", "開日"] if g in names]
    if "".join(R10_PARTNERS[base]) != names:
        fail(f"{base}: unparsed partners {names}")
h = norm(heading["修倉庫"]["quote"])
if h[1 : h.index("又")] != "".join(DIRECT):
    fail("卷十一 direct list changed")
if h[h.index("又") + 1 : h.index("與")] != "".join(BASES) or h[h.index("與") + 1 : h.index("併")] != "".join(R11_PARTNERS):
    fail("卷十一 co-presence clause changed")


def reading(partners, present):
    return any(p in present for p in partners)


def verdict(r10, r11):
    if r10 and r11:
        return "agreed"
    if not r10 and not r11:
        return "agreed_absent"
    return "source_dependent"


# Every partner subset per base: what each reading and D say (the truth table the Golden must hit).
ALL_PARTNERS = ["月恩", "月德", "四相", "時德", "開日"]
truth = []
for base in BASES:
    for bits in product([0, 1], repeat=len(ALL_PARTNERS)):
        present = {p for p, b in zip(ALL_PARTNERS, bits) if b}
        r10 = reading(R10_PARTNERS[base], present)
        r11 = reading(R11_PARTNERS, present)
        truth.append(
            {"base": base, "partners": sorted(present, key=ALL_PARTNERS.index), "r10": r10, "r11": r11, "d": verdict(r10, r11)}
        )
agreed = {b: [p for p in R10_PARTNERS[b] if p in R11_PARTNERS] for b in BASES}
r10_only = {b: [p for p in R10_PARTNERS[b] if p not in R11_PARTNERS] for b in BASES}
r11_only = {b: [p for p in R11_PARTNERS if p not in R10_PARTNERS[b]] for b in BASES}

# 2.4 — impossible co-presence on 12 Month Jian x 60 pillars, from the definitions above.
JIAN = "寅卯辰巳午未申酉戌亥子丑"  # month 1..12
SEASON_SHIDE = "午午午辰辰辰子子子寅寅寅"  # 時德: 春午 夏辰 秋子 冬寅 (卷五)


def truc(month_branch, day_branch):
    return TRUC[(BRANCHES.index(day_branch) - BRANCHES.index(month_branch)) % 12]


def tiancang(month_index):  # 正月起寅逆行十二辰 (卷六 歴例)
    return BRANCHES[(BRANCHES.index("寅") - month_index) % 12]


pillars = [("甲乙丙丁戊己庚辛壬癸"[i % 10], BRANCHES[i % 12]) for i in range(60)]
contexts = 0
co = {"收日+開日": 0, "天倉+時德": 0}
for mi, jian in enumerate(JIAN):
    for stem, branch in pillars:
        contexts += 1
        shou, kai = truc(jian, branch) == "收", truc(jian, branch) == "開"
        co["收日+開日"] += int(shou and kai)
        co["天倉+時德"] += int(tiancang(mi) == branch and SEASON_SHIDE[mi] == branch)
if contexts != 720 or any(co.values()):
    fail(f"impossible co-presence found: {co} over {contexts}")

authority = {
    "version": "p5-warehouse-v1",
    "authorityId": "p5-warehouse-v1",
    "status": "OWNER_ADOPTED_SOURCE_DEPENDENT",
    "scope": "AUDIT_ONLY",
    "scoringReady": False,
    "ownerDecision": {
        "id": "D",
        "decidedOn": "2026-10-16",
        "text": "修倉庫 co-presence is 宜 only when both readings give 宜; a split reading is undetermined, SOURCE_DEPENDENT. Not canonical.",
    },
    "offsetProtocol": "unicode-code-point-zero-based-end-exclusive-v1",
    "nameNormalization": "卷十一 raw writes 徳; god names compare as 德 (NAMING_ONLY).",
    "heading": heading,
    "direct": {
        "gods": DIRECT,
        "rule": "ANY present -> 宜 (both volumes agree; 卷十 收日按 「若德合赦願則自宜修倉庫又不待與收日併也」)",
        "vol10": direct10,
    },
    "coPresence": {
        "bases": BASES,
        "connective": "ANY",
        "R10": {"source": "卷十 per-entry clauses", "partners": R10_PARTNERS, "clauses": bases10},
        "R11": {"source": "卷十一 heading 修倉庫", "partners": {b: R11_PARTNERS for b in BASES}},
        "agreedPartners": agreed,
        "r10OnlyPartners": r10_only,
        "r11OnlyPartners": r11_only,
        "verdicts": {
            "agreed": "宜",
            "agreed_absent": "no 宜 from this base",
            "source_dependent": "undetermined, SOURCE_DEPENDENT",
            "unknown": "a reading is unknown when none of its partners is present and one is unknown (or the base is unknown); D is unknown when either reading is unknown. Unknown is not SOURCE_DEPENDENT.",
        },
        "headingOrder": [
            "any direct god present -> 宜",
            "else any base agreed -> 宜",
            "else any direct god or base verdict unknown -> unknown (it could still become 宜)",
            "else any base source_dependent -> undetermined SOURCE_DEPENDENT",
            "else -> no 宜",
        ],
        "commentary": commentary,
        "commentaryReading": "母倉義亦如此 follows the 收日 按: a base without 修造 meaning needs a partner. It adds no partner and changes neither reading.",
        "impossible": {
            "收日+開日": "different 12 Trực of one day",
            "天倉+時德": "卷十 note 「時德不得與天倉併」; checked on 720 contexts",
        },
    },
    "warehouseOpening": {
        "heading": "開倉庫出貨財",
        "rule": "flat ANY of 月恩 四相 時德 滿日 五富; verification only in P5, no new predicate",
    },
    "limits": [
        "Single-agent reading (Claude); no independent second review.",
        "Scans locked only for the 卷十 母倉 entry and the 卷十一 修倉庫 heading (yi-mucang-v1); 收日/六合/五富/天倉 clauses are raw-only.",
        "母倉 presence stays OWNER_ADOPTED_SOURCE_DEPENDENT 2025-2027 (p4-yi-mucang-v2); outside coverage -> unknown.",
    ],
}
validation = {
    "version": "p5-warehouse-authority-validation-v1",
    "sourcesMatchManifest": True,
    "spansUnique": True,
    "directListMatchesVol10Entries": sorted(direct10),
    "truthTable": {
        "rows": len(truth),
        "byVerdict": {v: sum(r["d"] == v for r in truth) for v in ["agreed", "agreed_absent", "source_dependent"]},
        "table": truth,
    },
    "impossibleCoPresence": {"contexts": contexts, "found": co},
    "definitionsUsedForProof": definitions,
}


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2) + "\n"


files = {AUTHORITY: dump(authority), OUT_DIR / "validation.json": dump(validation)}
locked = [p for _, p in RAW.values()] + list(SCANS.values()) + [str(AUTHORITY), str(OUT_DIR / "validation.json"), str(OUT_DIR / "build.py")]


def lock_text():
    return dump(
        {
            "version": "p5-warehouse-authority-lock-v1",
            "files": [
                {"path": p, "sha256": sha256(files[Path(p)].encode() if Path(p) in files else Path(p).read_bytes())}
                for p in locked
            ],
        }
    )


if "--write" in sys.argv:
    for p, body in files.items():
        p.write_text(body, encoding="utf-8")
    (OUT_DIR / "lock.json").write_text(lock_text(), encoding="utf-8")
else:
    for p, body in {**files, OUT_DIR / "lock.json": lock_text()}.items():
        if p.read_text(encoding="utf-8") != body:
            fail(f"{p} differs; rerun with --write and review the diff")
print("OK", {v: validation["truthTable"]["byVerdict"][v] for v in validation["truthTable"]["byVerdict"]}, co)

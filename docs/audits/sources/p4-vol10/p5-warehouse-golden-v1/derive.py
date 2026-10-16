"""P5 task 3: independent Golden for 修倉庫 (owner decision D) and 開倉庫出貨財 宜.
Run from the repo root:  python3 -I docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/derive.py
Without --write it rederives everything and fails if the committed files differ.

Independence: standard library only. God tables are literals checked verbatim against the locked
raw volumes; dated inputs (Month Jian, pillar, soil, 母倉) come from the frozen P4-C Golden block
yi-domains-v1/expected.tsv. No resolver, composer, provider or TypeScript code is read. The engine
baseline (p5-warehouse-baseline-v1/baseline.tsv) is compared only after the expected files are
built (validation phase); a mismatch stops the run and is never used to tune expected values.
"""
import csv
import hashlib
import json
import sys
from itertools import product
from pathlib import Path

OUT = Path("docs/audits/sources/p4-vol10/p5-warehouse-golden-v1")
INDEX = Path("shared/almanac-data/golden-p5-warehouse-v1.json")
SRC = Path("docs/audits/sources/p4-vol10")
VOL = {n: SRC / f"vol{n:02d}.raw.txt" for n in (4, 5, 6, 10)} | {11: SRC / "yi-sources-v1/vol11.raw.txt"}
DOMAINS = SRC / "yi-domains-v1/expected.tsv"
AUTHORITY = Path("shared/almanac-data/p5-warehouse-v1.json")
PRINT_CORRECTION = Path("shared/almanac-data/p4-vol10-remaining-ji-v7.json")
CAT_HUNG = Path("shared/lunar/catHungAuthority.ts")
BASELINE = SRC / "p5-warehouse-baseline-v1/baseline.tsv"
# P4-C CONVENTION_DIFFERENCE (frozen): the product reads Month Jian per calendar day, so a Jie day
# belongs to the new month; the 3.3 dated 母倉 domain used noon. 20 dates, all listed here.
JIE_DAYS = SRC / "yi-dated-inputs-v1/jie-convention.json"

sha256 = lambda b: hashlib.sha256(b).hexdigest()


def fail(msg):
    raise SystemExit(f"FAIL: {msg}")


text = {n: p.read_text(encoding="utf-8") for n, p in VOL.items()}


def quote(vol, q):
    """Every literal table below must appear verbatim (code points) in its locked raw volume."""
    i = text[vol].find(q)
    if i < 0:
        fail(f"vol{vol}: {q!r} not found")
    return {"volume": vol, "offset": len([*text[vol][:i]]), "quote": q}


STEMS = "甲乙丙丁戊己庚辛壬癸"
BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
JIAN = "寅卯辰巳午未申酉戌亥子丑"  # month 1..12
TRUC = "建除滿平定執破危成收開閉"
SEASON = "春春春夏夏夏秋秋秋冬冬冬"  # by Month Jian (協紀 seasons change at the Jie, i.e. with the Jian)
norm_stem = lambda s: s.replace("巳", "己")  # raw writes 巳 in stem slots (NAMING_ONLY, see NORMALIZATIONS)

# --- Source tables (卷四/五/六), each with its verbatim anchor ------------------------------------
SOURCES = {
    "天德": quote(5, "正月丁二月坤三月壬四月辛五月乾六月甲七月癸八月艮九月丙十月乙十一月巽十二月庚"),
    "天德合": quote(5, "正月壬三月丁四月丙六月巳七月戊九月辛十月庚十二月乙是也四仲之月天徳居四維故無合也"),
    "月德": quote(5, "月徳者正五九月在丙二六十月在甲三七十一月在壬四八十二月在庚"),
    "月德合": quote(5, "月徳合者正五九月在辛二六十月在巳三七十一月在丁四八十二月在乙"),
    "天赦": quote(5, "春戊寅夏甲午秋戊申冬甲子"),
    "天願": quote(5, "起例曰正月乙亥二月甲戌三月乙酉四月丙申五月丁未六月戊午七月己巳八月庚辰九月辛卯十月壬寅十一月癸丑十二月甲子"),
    "天願按": quote(5, "傳寫謬誤二十四字中誤十三字"),
    "月恩": quote(5, "正月丙二月丁三月庚四月巳五月戊六月辛七月壬八月癸九月庚十月乙十一月甲十二月辛"),
    "四相": quote(5, "春丙丁夏戊巳秋壬癸冬甲乙"),
    "時德": quote(5, "春木生午火夏火生辰土秋金生子水冬水生寅木也四相取天干時徳取地支"),
    "三合": quote(6, "寅午戌火之三合巳酉丑金之三合申子辰水之三合亥夘未木之三合"),
    "六合": quote(6, "正月在亥逆行十二辰"),
    "五富": quote(6, "正月起亥順行四孟"),
    "天倉": quote(6, "天倉者正月起寅逆行十二辰"),
    "月煞": quote(6, "月虚者正月起丑逆行四季"),
    "月厭": quote(4, "月厭者正月在戌逆行十二辰"),
    "puzhu:28": quote(10, "二月甲戌四月丙申六月甲子七月戊申八月庚辰九月辛夘十月甲子十二月甲子徳合與赦願所㑹之辰諸事不忌"),
    "百忌甲日": quote(10, "甲日忌開倉庫出貨財"),
    "puzhu:22": quote(10, "凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌"),
    "母倉": quote(5, "春亥子夏寅卯秋辰戌丑未冬申酉土王後巳午"),
}
NORMALIZATIONS = [
    {"god": "天德合", "month": "六月", "raw": "巳", "read": "己"},
    {"god": "月德合", "month": "二六十月", "raw": "巳", "read": "己"},
    {"god": "月恩", "month": "四月", "raw": "巳", "read": "己"},
    {"god": "四相", "month": "夏", "raw": "巳", "read": "己"},
    {"god": "*", "raw": "徳 / 夘 / 虚", "read": "德 / 卯 / 虛 (NAMING_ONLY)"},
]

TIANDE = "丁坤壬辛乾甲癸艮丙乙巽庚"  # trigram months match no day (no stem/branch is a trigram)
TIANDE_HE = {0: "壬", 2: "丁", 3: "丙", 5: "己", 6: "戊", 8: "辛", 9: "庚", 11: "乙"}
YUEDE = "丙甲壬庚" * 3
YUEDE_HE = "辛己丁乙" * 3
TIANSHE = {"春": "戊寅", "夏": "甲午", "秋": "戊申", "冬": "甲子"}
TIANYUAN = ["乙亥", "甲戌", "乙酉", "丙申", "丁未", "戊午", "己巳", "庚辰", "辛卯", "壬寅", "癸丑", "甲子"]  # 按 adopts 起例 over 歴例
YUEEN = norm_stem("丙丁庚巳戊辛壬癸庚乙甲辛")
SIXIANG = {"春": "丙丁", "夏": "戊己", "秋": "壬癸", "冬": "甲乙"}
SHIDE = {"春": "午", "夏": "辰", "秋": "子", "冬": "寅"}
TRINE = ["寅午戌", "巳酉丑", "申子辰", "亥卯未"]
MUCANG = {"春": "亥子", "夏": "寅卯", "秋": "辰戌丑未", "冬": "申酉"}
PUZHU28 = {("卯", "甲戌"), ("巳", "丙申"), ("未", "甲午"), ("申", "戊申"), ("酉", "庚辰"), ("戌", "辛卯"), ("亥", "甲子"), ("丑", "甲子")}
# 未 printed 甲子, adopted 甲午: owner print correction 2026-10-12 (PRINT_CORRECTION, pinned by SHA).

step = lambda start, k, d: BRANCHES[(BRANCHES.index(start) + d * k) % 12]


def presence(mi, stem, branch, soil):
    """All gods for Month Jian index mi (0 = 寅), a pillar and the 土王用事 state (bool)."""
    jian, season = JIAN[mi], SEASON[mi]
    truc = TRUC[(BRANCHES.index(branch) - BRANCHES.index(jian)) % 12]
    trine = next(t for t in TRINE if jian in t)
    return {
        "天德": TIANDE[mi] == stem,
        "月德": YUEDE[mi] == stem,
        "天德合": TIANDE_HE.get(mi) == stem,
        "月德合": YUEDE_HE[mi] == stem,
        "天赦": TIANSHE[season] == stem + branch,
        "天願": TIANYUAN[mi] == stem + branch,
        "三合": branch in trine and branch != jian,
        "滿日": truc == "滿",
        "收日": truc == "收",
        "母倉": branch in ("巳午" if soil else MUCANG[season]),
        "六合": step("亥", mi, -1) == branch,
        "五富": "亥寅巳申"[mi % 4] == branch,
        "天倉": step("寅", mi, -1) == branch,
        "月恩": YUEEN[mi] == stem,
        "四相": stem in SIXIANG[season],
        "時德": SHIDE[season] == branch,
        "開日": truc == "開",
        "月煞": "丑戌未辰"[mi % 4] == branch,
        "月厭": step("戌", mi, -1) == branch,
        "甲日": stem == "甲",
        "puzhu28": (jian, stem + branch) in PUZHU28,
    }


# --- Decision D ------------------------------------------------------------------------------------
DIRECT = ["天德", "月德", "天德合", "月德合", "天赦", "天願", "三合", "滿日"]
BASES = ["收日", "母倉", "六合", "五富", "天倉"]
R10 = {"收日": ["月恩", "四相", "時德"], "母倉": ["月恩", "四相", "開日"], "六合": ["月恩", "四相", "時德"],
       "五富": ["月恩", "四相", "時德"], "天倉": ["月恩", "四相", "開日"]}
R11 = ["月德", "四相", "時德", "開日"]
KAI = ["月恩", "四相", "時德", "滿日", "五富"]
PARTNERS = ["月恩", "月德", "四相", "時德", "開日"]
XIU_GODS = DIRECT + BASES + [p for p in PARTNERS if p not in DIRECT]
IMPOSSIBLE = [("收日", "開日"), ("天倉", "時德")]


def k_any(vals):  # Kleene OR; None = unknown
    return True if True in vals else (None if None in vals else False)


def k_and(a, b):
    return False if False in (a, b) else (None if None in (a, b) else True)


def d_of(r10, r11):
    return "agreed" if r10 and r11 else "agreed_absent" if not r10 and not r11 else "source_dependent"


def heading_known(s):
    """Heading for fully known presence (FR-04 order)."""
    if any(s[g] for g in DIRECT):
        return "yi"
    ds = [d_of(any(s[p] for p in R10[b]), any(s[p] for p in R11)) for b in BASES if s[b]]
    return "yi" if "agreed" in ds else "source_dependent" if "source_dependent" in ds else "no_yi"


def complete(s, names):
    unknown = [g for g in names if s.get(g) is None]
    for bits in product([False, True], repeat=len(unknown)):
        yield {**s, **dict(zip(unknown, bits))}


def resolve(s):
    """Per-base readings (Kleene) and D, heading by every completion of the unknown operands.
    Owner 2026-10-16: an unknown base with every partner known absent gives no 宜 (it can reach
    neither agreed nor split), so the outcome set rule decides it, not the reading text alone."""
    for a, b in IMPOSSIBLE:
        if s.get(a) is True and s.get(b) is True:
            return {"error": "IMPOSSIBLE_CO_PRESENCE", "pair": f"{a}+{b}"}
    bases = {}
    for b in BASES:
        if s[b] is False:
            continue
        r10 = k_and(s[b], k_any([s[p] for p in R10[b]]))
        r11 = k_and(s[b], k_any([s[p] for p in R11]))
        outs = {d_of(any(c[p] for p in R10[b]), any(c[p] for p in R11)) if c[b] else "agreed_absent"
                for c in complete(s, [b, *R10[b], *R11])}
        d = outs.pop() if len(outs) == 1 else "unknown"
        if (d == "unknown") != (r10 is None or r11 is None):
            fail(f"reading/outcome disagreement for {b}: {s}")
        bases[b] = {"base": s[b], "r10": r10, "r11": r11, "d": d}
    heads = {heading_known(c) for c in complete(s, XIU_GODS)}
    return {
        "xiuCangKu": heads.pop() if len(heads) == 1 else "unknown",
        "bases": bases,
        "kaiCangKuYi": k_any([s[g] for g in KAI]),
    }


# --- 3.1 Fixture matrix (abstract presence states) -------------------------------------------------
fixtures = []


def fx(fid, category, present=(), unknown=(), note=None):
    s = {g: (None if g in unknown else g in present) for g in XIU_GODS + KAI}
    row = {"id": fid, "category": category, "present": sorted(present, key=(XIU_GODS + KAI).index),
           "unknown": sorted(unknown, key=(XIU_GODS + KAI).index), "expected": resolve(s)}
    if note:
        row["note"] = note
    fixtures.append(row)


for b in BASES:
    fx(f"base-only:{b}", "base_only", [b])
for p in PARTNERS:
    fx(f"partner-only:{p}", "partner_only", [p])
for g in DIRECT:
    fx(f"direct:{g}", "direct", [g])
# every base x every partner subset (singles, multiples, every R10/R11 split) with no direct god
for b in BASES:
    for bits in product([0, 1], repeat=len(PARTNERS)):
        ps = [p for p, x in zip(PARTNERS, bits) if x]
        if ps and not any((b, p) in IMPOSSIBLE for p in ps):
            fx(f"subset:{b}+{'+'.join(ps)}", "single_partner" if len(ps) == 1 else "multi_partner", [b, *ps])
for a, b in IMPOSSIBLE:
    fx(f"impossible:{a}+{b}", "impossible", [a, b], note="source/definition says these never co-occur")
fx("direct-beats-split:天德+收日+月恩", "direct", ["天德", "收日", "月恩"])
fx("direct-via-月德:收日+月德", "direct", ["收日", "月德"], note="月德 is direct; the R11-only split never decides")
fx("multi-base:agreed+split", "multi_base", ["收日", "母倉", "時德"], note="收日 agreed by 時德; 母倉 split (R11 only)")
fx("multi-base:split+split", "multi_base", ["六合", "天倉", "月恩"])
fx("multi-base:absent+absent", "multi_base", ["六合", "五富"])
# unknown on each side
fx("unknown:月恩 (R10 side)", "unknown", ["收日"], ["月恩"])
fx("unknown:開日 (R11 side)", "unknown", ["收日"], ["開日"])
fx("unknown:四相 (both sides)", "unknown", ["六合"], ["四相"])
fx("unknown:partner with another present", "unknown", ["收日", "時德"], ["月恩", "開日"], note="both readings true")
fx("unknown:split side unknown", "unknown", ["收日", "月恩"], ["開日"])
fx("unknown:direct alone", "unknown", [], ["天德"])
fx("unknown:direct with agreed base", "unknown", ["收日", "四相"], ["天德"], note="agreed beats unknown")
fx("unknown:direct with split base", "unknown", ["收日", "月恩"], ["天赦"], note="unknown beats split")
fx("unknown:base with agreed other base", "unknown", ["收日", "四相"], ["六合"])
# 母倉 outside 2025-2027 coverage is unknown (FR-06)
fx("mucang-out:agreed partner", "mucang_out_of_coverage", ["四相"], ["母倉"], note="flips: present -> 宜, absent -> no 宜")
fx("mucang-out:R10-only partner", "mucang_out_of_coverage", ["月恩"], ["母倉"])
fx("mucang-out:no partner", "mucang_out_of_coverage", [], ["母倉"], note="owner 2026-10-16: no 宜")
fx("mucang-out:with direct", "mucang_out_of_coverage", ["滿日"], ["母倉"])
# 修倉庫 vs 開倉庫出貨財 are separate headings (FR-09)
fx("separate:月恩 alone", "separate_headings", ["月恩"])
fx("separate:收日+月恩", "separate_headings", ["收日", "月恩"])
fx("separate:天德 alone", "separate_headings", ["天德"])
fx("separate:五富 alone", "separate_headings", ["五富"])
fx("separate:滿日 alone", "separate_headings", ["滿日"])
fx("separate:四相 unknown", "separate_headings", [], ["四相"])

# 3.3 abstract: puzhu:22 requireAll and 百忌 甲日 專忌; puzhu:28 諸事不忌 days.
propagation = []
for kai_shi, li_quan, jia, p28 in product([False, True], repeat=4):
    lifted = kai_shi and li_quan and not jia
    propagation.append({
        "開市_notJi": kai_shi, "立券交易_notJi": li_quan, "甲日": jia, "puzhu28": p28,
        "expected": {"propagatedLift": lifted, "zhuanJiKept": jia and not p28,
                     "kaiJi": True if jia and not p28 else False if p28 else None},
    })

# --- 3.2 / 3.3 domains -----------------------------------------------------------------------------
COLS = DIRECT + BASES + ["月恩", "四相", "時德", "開日", "月煞", "月厭", "甲日", "puzhu28"]
flag = lambda v: "present" if v else "absent"


def row_out(s):
    r = resolve(s)
    return [flag(s[g]) for g in COLS] + [
        "|".join(f"{b}:{r['bases'][b]['d']}" for b in r["bases"]) or "-",
        r["xiuCangKu"], str(r["kaiCangKuYi"]).lower(),
        str(s["甲日"] and not s["puzhu28"]).lower(),
    ]


HEAD = COLS + ["bases_d", "xiu_cang_ku", "kai_yi", "kai_zhuan_ji_kept"]
pillars = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
ctx_rows = [[JIAN[mi], p, flag(soil)] + row_out(presence(mi, p[0], p[1], soil))
            for mi in range(12) for p in pillars for soil in (False, True)]
for r in ctx_rows:  # 2.4 again, from this Golden's own tables
    c = dict(zip(["jian", "pillar", "soil"] + HEAD, r))
    if (c["收日"] == c["開日"] == "present") or (c["天倉"] == c["時德"] == "present"):
        fail(f"impossible co-presence at {c['jian']} {c['pillar']}")

jie_days = {r["date"]: r for r in json.loads(JIE_DAYS.read_text(encoding="utf-8"))["rows"]}
if len(jie_days) != 20:
    fail("jie-convention must list 20 dates")
dated = []
with DOMAINS.open(encoding="utf-8") as f:
    for rec in csv.DictReader(f, delimiter="\t"):
        if rec["domain"] != "MU_CANG_DATED_1095":
            continue
        inp, prov = json.loads(rec["inputs"]), json.loads(rec["inputProvenance"])
        soil = inp["SOIL_REIGN_STATE"]
        if soil["coverage"] != "inside" or not soil["validated"]:
            fail(f"{rec['id']}: soil outside coverage")
        p = prov["validPillar"]
        if p[1] != inp["DAY_BRANCH"]:
            fail(f"{rec['id']}: pillar/branch mismatch")
        date, jian = prov["civilDateUtc7"], inp["MONTH_JIAN_BRANCH"]
        frozen_mucang = json.loads(rec["expected"])["outcome"] == "present"
        if date in jie_days:
            j = jie_days.pop(date)
            if (j["noonMonthJian"], j["pillar"], j["soil"]) != (jian, p, soil["state"]):
                fail(f"{date}: jie-convention row disagrees with the dated domain")
            jian, frozen_mucang = j["calendarDayMonthJian"], j["calendarDayMuCang"] == "present"
        s = presence(JIAN.index(jian), p[0], p[1], soil["state"] == "present")
        if s["母倉"] != frozen_mucang:
            fail(f"{rec['id']}: 母倉 differs from frozen P4-C Golden")
        dated.append([date, jian, p, soil["state"]] + row_out(s))
dated.sort()
if jie_days:
    fail(f"unused jie-convention dates {sorted(jie_days)}")
if len(dated) != 1095 or len({r[0] for r in dated}) != 1095:
    fail(f"dated domain has {len(dated)} rows")


def tsv(head, rows):
    return "\t".join(head) + "\n" + "".join("\t".join(r) + "\n" for r in rows)


def count(rows, head, col):
    i = head.index(col)
    out = {}
    for r in rows:
        out[r[i]] = out.get(r[i], 0) + 1
    return dict(sorted(out.items()))


CTX_HEAD = ["month_jian", "pillar", "soil"] + HEAD
DATED_HEAD = ["date", "month_jian", "pillar", "soil"] + HEAD
dated_base_d = {}
for r in dated:
    for part in r[DATED_HEAD.index("bases_d")].split("|"):
        if part != "-":
            dated_base_d[part] = dated_base_d.get(part, 0) + 1
summary = {
    "fixtures": {"total": len(fixtures), "byCategory": {c: sum(f["category"] == c for f in fixtures) for c in dict.fromkeys(f["category"] for f in fixtures)}},
    "propagation": len(propagation),
    "context1440": {"rows": len(ctx_rows), "xiu_cang_ku": count(ctx_rows, CTX_HEAD, "xiu_cang_ku"), "kai_yi": count(ctx_rows, CTX_HEAD, "kai_yi")},
    "dated1095": {
        "rows": len(dated),
        "xiu_cang_ku": count(dated, DATED_HEAD, "xiu_cang_ku"),
        "kai_yi": count(dated, DATED_HEAD, "kai_yi"),
        "kai_zhuan_ji_kept": count(dated, DATED_HEAD, "kai_zhuan_ji_kept"),
        "甲日": count(dated, DATED_HEAD, "甲日"),
        "puzhu28": count(dated, DATED_HEAD, "puzhu28"),
        "月煞": count(dated, DATED_HEAD, "月煞"),
        "月厭": count(dated, DATED_HEAD, "月厭"),
        "baseVerdicts": dict(sorted(dated_base_d.items())),
        "sourceDependentDates": [r[0] for r in dated if r[DATED_HEAD.index("xiu_cang_ku")] == "source_dependent"],
    },
}

expected = {
    "version": "golden-p5-warehouse-expected-v1",
    "authorityId": "p5-warehouse-v1",
    "ownerDecisions": [
        {"id": "D", "decidedOn": "2026-10-16", "text": "co-presence 宜 only when 卷十 and 卷十一 readings agree; split = SOURCE_DEPENDENT"},
        {"id": "unknown-base", "decidedOn": "2026-10-16",
         "text": "an unknown base with every partner known absent gives no 宜 (outcome over every completion); unknown only when completions disagree"},
    ],
    "semantics": {
        "presence": "true present, false absent, null unknown",
        "reading": "Kleene: base AND ANY(partners)",
        "d": "agreed | agreed_absent | source_dependent | unknown, over every completion of the base and its partners",
        "xiuCangKu": "yi | no_yi | source_dependent | unknown, over every completion of the 18 operands (FR-04 order)",
        "kaiCangKuYi": "Kleene ANY(月恩 四相 時德 滿日 五富); 宜 only, 忌 composition is P4-B",
        "impossible": "收日+開日 or 天倉+時德 both present -> error IMPOSSIBLE_CO_PRESENCE",
        "propagation.kaiJi": "true = 忌 must stay (百忌 甲日 專忌, puzhu:22 如遇專忌之日則仍註忌); false = puzhu:28 諸事不忌; null = ordinary 忌 composition decides",
    },
    "fixtures": fixtures,
    "propagation": propagation,
}

basis = {
    "version": "golden-p5-warehouse-basis-v1",
    "sources": SOURCES,
    "normalizations": NORMALIZATIONS,
    "conventions": {
        "season": "春 = 寅卯辰 … by Month Jian; 協紀 seasons turn at the Jie, as the Jian does.",
        "天德 trigram months": "坤/乾/艮/巽 are no stem or branch, so no day carries them; 天德合 absent in 四仲 months (quote). Same as the locked 4D Cat Hung table (CAT_HUNG sha256).",
        "三合": "the other two branches of the Month Jian's trine (曽門經 trines)",
        "puzhu28": "8 (Month Jian, pillar) days from the quote; 未 甲子 read 甲午 by owner print correction 2026-10-12 (PRINT_CORRECTION sha256).",
        "母倉 soil": "土王用事 present -> 巳午, else the season set; soil from the frozen P4-C dated rows.",
        "天願": "協紀 按 rejects the 歴例 list (傳寫謬誤) and adopts 起例; this Golden uses 起例.",
        "Jie days": "Month Jian per calendar day (P4-C CONVENTION_DIFFERENCE, 20 dates from JIE_DAYS; 母倉 = calendarDayMuCang there).",
    },
    "inputs": {str(p): sha256(p.read_bytes()) for p in [*VOL.values(), DOMAINS, JIE_DAYS, AUTHORITY, PRINT_CORRECTION, CAT_HUNG]},
}

# authority consistency (spec, not oracle): the literal readings here must equal the locked authority
auth = json.loads(AUTHORITY.read_text(encoding="utf-8"))["coPresence"]
if auth["R10"]["partners"] != R10 or any(auth["R11"]["partners"][b] != R11 for b in BASES) or auth["bases"] != BASES:
    fail("readings differ from p5-warehouse-v1")


def dump(o):
    return json.dumps(o, ensure_ascii=False, indent=2) + "\n"


files = {
    OUT / "expected.json": dump(expected),
    OUT / "context.tsv": tsv(CTX_HEAD, ctx_rows),
    OUT / "dated.tsv": tsv(DATED_HEAD, dated),
    OUT / "source-basis.json": dump(basis),
    OUT / "summary.json": dump(summary),
}

# --- Validation (after expected): engine baseline and prior locks ---------------------------------
mismatch = []
with BASELINE.open(encoding="utf-8") as f:
    base = {r["date"]: r for r in csv.DictReader(f, delimiter="\t")}
for r in dated:
    c, b = dict(zip(DATED_HEAD, r)), base[r[0]]
    for g in DIRECT + BASES + ["月恩", "四相", "時德", "開日"]:
        if c[g] != b[g]:
            mismatch.append(f"{r[0]} {g}: golden {c[g]} engine {b[g]}")
    if c["kai_yi"] != b["kai_yi"]:
        mismatch.append(f"{r[0]} 開倉庫 宜: golden {c['kai_yi']} engine {b['kai_yi']}")
    zj = c["kai_zhuan_ji_kept"] == "true"
    if zj and b["kai_final_ji"] != "true":
        mismatch.append(f"{r[0]} 甲日 專忌 lost (engine final 忌 {b['kai_final_ji']})")
    if c["甲日"] == "present" and not zj and b["kai_final_ji"] == "true":
        mismatch.append(f"{r[0]} puzhu:28 甲日 still 忌 in engine")
if mismatch:  # classified 2026-10-16: 天願 歴例 vs 起例 was a GOLDEN_BUG, Jie days a P4-C convention
    fail(f"{len(mismatch)} golden/engine mismatches, classify before freezing:\n" + "\n".join(mismatch[:40]))

prior, superseded = [], []
for lock in sorted(SRC.rglob("*lock*.json")):
    if OUT in lock.parents:
        continue
    if "superseded" in str(lock):  # draft locks kept for history; their files were replaced on purpose
        superseded.append(str(lock))
        continue
    files_ = json.loads(lock.read_text(encoding="utf-8")).get("files")
    if not isinstance(files_, list):
        continue
    for e in files_:
        if isinstance(e, dict) and "path" in e and "sha256" in e and Path(e["path"]).is_file():
            prior.append((str(lock), e["path"], sha256(Path(e["path"]).read_bytes()) == e["sha256"]))
drift = [p for p in prior if not p[2]]
validation = {
    "version": "golden-p5-warehouse-validation-v1",
    "engineBaseline": {"path": str(BASELINE), "sha256": sha256(BASELINE.read_bytes()),
                       "compared": "17 gods + 開倉庫 宜 + 甲日 專忌 on 1,095 dates", "mismatches": 0},
    "priorLocks": {"entries": len(prior), "locks": len({p[0] for p in prior}),
                   "drift": [{"lock": l, "path": p} for l, p, _ in drift], "skippedSuperseded": superseded},
}
files[OUT / "validation.json"] = dump(validation)

block = lambda kind, path, n, **kw: {"kind": kind, "path": str(path), **kw, "count": n, "sha256": sha256(files[path].encode())}
files[INDEX] = dump({
    "schemaVersion": "p5-warehouse-golden-index-v1",
    "version": "golden-p5-warehouse-v1",
    "date": "2026-10-16",
    "status": "HASH_LOCKED_PRE_IMPLEMENTATION",
    "scope": "AUDIT_ONLY",
    "scoringReady": False,
    "authority": {"path": str(AUTHORITY), "sha256": sha256(AUTHORITY.read_bytes()), "version": "p5-warehouse-v1"},
    "blocks": [
        block("fixtures", OUT / "expected.json", len(fixtures), selector="fixtures"),
        block("propagation", OUT / "expected.json", len(propagation), selector="propagation"),
        block("context1440", OUT / "context.tsv", len(ctx_rows), format="TSV"),
        block("dated1095", OUT / "dated.tsv", len(dated), format="TSV"),
    ],
    "recordCount": len(fixtures) + len(propagation) + len(ctx_rows) + len(dated),
    "lock": str(OUT / "lock.json"),
    "reviewer": "Claude, single agent; no independent second review",
})
locked = [OUT / "derive.py", *files]
lock_text = dump({"version": "golden-p5-warehouse-lock-v1", "files": [
    {"path": str(p), "sha256": sha256(files[p].encode() if p in files else p.read_bytes())} for p in locked
] + [{"path": k, "sha256": v} for k, v in basis["inputs"].items()]})
files[OUT / "lock.json"] = lock_text

if "--write" in sys.argv:
    for p, body in files.items():
        p.write_text(body, encoding="utf-8")
else:
    for p, body in files.items():
        if not p.is_file() or p.read_text(encoding="utf-8") != body:
            fail(f"{p} differs; rerun with --write and review the diff")
print("OK", json.dumps({"fixtures": len(fixtures), "dated": summary["dated1095"]["xiu_cang_ku"],
                        "priorLockDrift": len(drift)}, ensure_ascii=False))

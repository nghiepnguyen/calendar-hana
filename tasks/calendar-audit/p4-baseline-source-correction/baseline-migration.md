# P4 baseline — source-correction migration

2026-10-20 · `docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/`

## Summary

Reason:
Five authoritative source transcription corrections invalidated hashes because sourceQuote participates in P4 baseline hashing. Changed record fields: contributions[].sourceQuote on all 274 rows; contributions[].activityMapping.reviewTerm 墳墓修築 → 墳堂修築 on the 39 斗-2 rows only (resolver term added in the same resolution).

Behavioral impact:
NONE

Provenance impact:
5 Mansion clauses (亢-2, 房-2, 心-2, 斗-2, 壁-2)

Affected activity rows:
196

Affected event rows:
78

## Lineage

1. P4 baseline originally locked against Mansion source transcription v1.0.1 (lock generatedAt bae57f3).
2. Independent secondary review identified five transcription errors (亢-2, 房-2, 心-2, 斗-2, 壁-2).
3. Mansion source authority corrected to v1.0.2.
4. P4 baseline regenerated because sourceQuote is part of the baseline hash.
5. No behavioral output changed.

## Method

- **old**: git worktree at HEAD 88b29ba (content 1.0.1), same flag-OFF manifest mock as p4AdapterBaseline.test.ts; temporary dump test (not committed) wrote TSV + full JSON record per row.
- **new**: working tree with the five corrections; same dump, run twice.
- **reproduction**: OLD TSVs byte-equal to the locked TSVs; every locked row sha256 equals sha256(JSON(record)) of the OLD record; NEW run 1 = run 2 byte-for-byte (TSV and records). TZ pinned by vitest config (Asia/Ho_Chi_Minh).
- **compare**: per row key, every JSON leaf of OLD vs NEW record; strict classification: only leaf keys sourceQuote, sourcePhrase, sourceRef, label, reviewTerm, reviewNote, reason, translation, quote are provenance, every other leaf is behavioral.

## Candidate comparison

| | old | new | changed |
|---|---|---|---|
| activities | 35136 | 35136 | 196 |
| events | 24156 | 24156 | 78 |

Changed rows by mansion × activity/event: 亢 burial 40; 壁 wedding 39; 心 burial 39; 房 burial 39; 斗 grave_repair 39; 壁 wedding (event) 78.

Changed record fields: `contributions[].activityMapping.reviewTerm` (provenance), `contributions[].sourceQuote` (provenance). Changed TSV column: `sha256` only.

Behavioral changes: 0 / 274. Provenance-only changes: 274 / 274. Unexpected: 0.

## Gates

- A_cardinality: **PASS**
- B_identity: **PASS**
- C_behavioral_equivalence: **PASS**
- D_provenance_scope: **PASS**
- E_expected_counts: **PASS**
- F_resolver_correctness: **PASS**
- reproducible: **PASS**

## Field classification

- TSV `activities.tsv`: behavioral `score`, `status`, `hard_warning` (+ identity `date`, `activity`); integrity `sha256` = sha256(JSON of the whole recommendation).
- TSV `events.tsv`: behavioral `score`, `classification` (+ identity `date`, `event`, `hour`); integrity `sha256` = sha256(JSON of the evaluation without datasetVersion/engineVersion).
- Record leaves: 133 distinct leaf paths (full list in `baseline-migration.json`). provenance = leaf key in ['label', 'quote', 'reason', 'reviewNote', 'reviewTerm', 'sourcePhrase', 'sourceQuote', 'sourceRef', 'translation']; every other leaf is treated as behavioral (strict).

Consumers of the two changed fields (code, not tests):

- shared/lunar/mansionContentAuthority.ts:56 — sourceQuote := clause.quote (evidence construction)
- shared/lunar/mansionContentAuthority.ts:88 — presentMansionContent().reasons (display text) → src/views/DayView/AlmanacPanel.tsx, shared/seo/daySeo.ts renderDayArticle
- src/views/DayView/MansionEvidenceDetails.tsx:46 — renders sourceQuote in a <blockquote>
- src/views/DayView/MansionEvidenceDetails.tsx:56 — renders activityMapping.reviewTerm
- shared/lunar/ruleActivityMapping.ts:142-156 — reads clause.quote only to pick reviewTerm / reviewStatus; reviewStatus unchanged on all 274 rows (it is a leaf of the record and was compared as behavioral)

No scoring, status, conflict or classification code reads `sourceQuote` or `reviewTerm`.

## Hashes

| file | locked (v1.0.1) | regenerated (v1.0.2) |
|---|---|---|
| activities.tsv | `d71c01627d087382cf24976957fd5fe959784413f31823a31057e2ccb0cb8d0c` | `c1a08d320ffe99a1b9eea17d6c8df580bdfb5401f08d14cc6375ec330a6253ae` |
| events.tsv | `de7f0b130179b31a9a8d4930e9c9138a4108cdbf7a2d7aa1f909e6300fd008f3` | `d8e18a541a767c518bba2d8cc6eb8d40d3037e44e82877a332473dbf70176882` |

## Dependent locks

- `note`: migration-diff v1/v2 and score-golden-v2 locks unchanged by owner decision 2026-10-20
- `p4-adapter-baseline-v1/lock.json`: files[].sha256 updated to the regenerated files; original fields kept; revision entry added
- `p4-migration-diff-v1/lock.json, p4-migration-diff-v2/lock.json`: reference the baseline lock by path only; not rewritten. Verified by P4_MIGRATION_FULL=1 p4MigrationDiff (migration files equal their lock).
- `p4-score-golden-v2/lock.json`: NOT rewritten. It records the baseline activities.tsv sha256 d71c0162… as a frozen input at its freeze; that is still a true historical statement, but it no longer equals the file now at that path. golden.py reads only score/status/hard_warning, which are unchanged (verified: golden.py check exit 0). Maintainer decision: keep as historical, or add a note/revision to that lock.

## Final facts

- activityRows: 35136 → 35136, changed 196
- eventRows: 24156 → 24156, changed 78
- totalChangedRecords: 274
- sourceQuote: changed on 274/274
- activityMapping.reviewTerm: changed on 39/274, 斗-2 only
- behavioralChanges: 0/274
- provenanceOnly: 274/274
- unexpected: 0

## Historical provenance note — p4-score-golden-v2

That lock has no revisions/notes field and no tooling reads it; its structure is not extended. The note lives in this audit artifact.

> p4-score-golden-v2 was generated from the P4 adapter baseline whose activities.tsv SHA-256 was d71c01627d087382cf24976957fd5fe959784413f31823a31057e2ccb0cb8d0c.
>
> The adapter baseline was later regenerated after authoritative source transcription corrections for five Mansion clauses (亢-2, 房-2, 心-2, 斗-2, 壁-2).
>
> The corrections changed provenance fields only: contributions[].sourceQuote; contributions[].activityMapping.reviewTerm for 斗-2.
>
> No score/status/hard_warning/classification output changed (golden.py check exit 0: its outputs still equal the hashes in that lock).
>
> Therefore the original golden input hash is intentionally preserved as historical provenance rather than updated to the current adapter baseline hash.

## ci:p4

READ-ONLY VERIFICATION PASS. Mutation audit scripts: NOT RUN (they mutate tracked audit result artifacts).

## Certification

- secondaryReview: COMPLETE
- disagreements: 5/5 RESOLVED
- p4BaselineMigration: VERIFIED
- behavioralRegression: NONE
- state: SECONDARY_REVIEW_COMPLETE / DISAGREEMENTS_RESOLVED / UNCERTAINTIES_REMAIN
- remaining 柳-2: SEMANTICALLY_RESOLVED / TRANSCRIPTION_UNCERTAIN / NEEDS_PRIMARY_EVIDENCE
- remaining 張-1: NEEDS_ONTOLOGY_DECISION
- remaining renovation: NEEDS_ONTOLOGY_DECISION
- Not eligible for DOUBLE_REVIEWED.

## Follow-up backlog (not implemented)

- FOLLOW-UP 1: Evaluate behaviorHash + provenanceHash separation. Not done here: changing hash semantics while migrating would make it harder to prove this migration has no behavioral change.
- FOLLOW-UP 2: Find clearer primary scan evidence for 柳-2.
- FOLLOW-UP 3: Owner ontology decision for 張-1 / 造龍軒.
- FOLLOW-UP 4: Owner ontology decision for renovation: 修宮室 vs 修造 / 興造動土.

`墳墓修築` stays in the resolver terms (unused, harmless); cleanup is separate.

## Post-migration validation

- regeneratedWith: P4_ADAPTER_BASELINE_WRITE=1 npx vitest run shared/lunar/p4AdapterBaseline.test.ts; written files hash = candidate (c1a08d32…, d8e18a54…)
- lockEdit: p4-adapter-baseline-v1/lock.json: files[].sha256 updated from the written files; version/scope/generatedAt/runtimeEquivalentTo kept; revisions[0] added
- p4TargetedTests: p4AdapterBaseline, p4MigrationDiff, p4MigrationRollback, p4ScoreAdapterAlmanac: 4 files / 25 tests passed
- npmTest: 225 files passed, 1 skipped; 8196 tests passed, 6 skipped, 0 failed
- lintTypecheck: npm run check: pass
- ciP4ReadOnly: P4_OWNER_RULES_FULL p4OwnerRules 6/6; P4_SCORE_ADAPTER_FULL p4ScoreAdapterAlmanac 12/12; P4_MIGRATION_FULL p4MigrationDiff 9/9 (migration-diff-v2 files equal their lock, unchanged); score-golden-v2 golden.py check exit 0
- ciP4Skipped: audit-p4-*-mutations.py (8 scripts): rewrite tracked docs/audits/*-mutation-results.json reports; they mutate rule/scorer code, which this migration does not touch
- dependentLocksUnchanged: p4-migration-diff-v1/v2 lock.json, p4-score-golden-v2/lock.json (its frozen-input sha d71c0162… is now historical; maintainer decision)

## Files

- `baseline-diff.json`: every changed row (id, date, mansion, activity, clause, changed fields, old/new values, old/new hash).

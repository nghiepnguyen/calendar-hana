# puzhu:06 authority v2 (task 3.5)

`shared/almanac-data/p4b-puzhu06-v2.json` = v1 plus the owner answer to Q4a (2026-10-16). It is built by `build.py`, which is a copy of the v1 builder with these changes. Gate: `shared/lunar/p4Puzhu06AuthorityV2.test.ts`. v1 (`p4b-puzhu06-v1.json`) is unchanged and pinned in `parent` by SHA-256.

## Change from v1

- `ownerDecision.answers.Q4a = block`. The 五墓 commentary ends 「…不取德合者不同行也」 (卷十 offset 18232). So puzhu:06's 德合 triggers (天德合, 月德合) do not lift 五墓.
- `liftExclusions`: `五墓 → [天德合, 月德合]`, with the span as basis. The builder checks that the god is in `liftLists` and that the triggers are puzhu:06 triggers.
- New class `QL_EXCLUDED` (keep): a Q4 god kept, but every trigger present on the day is excluded for that god. If any other trigger is present (such as 月恩), the class stays `QL` (lift).
- 24 spans in total (v1 23 + the exclusion basis).

The other four Q4 gods have no similar exclusion in their entry or commentary, so they are unchanged. 「天赦不得與五虛併」 is a co-presence note.

## Limits

Single-agent work (Claude); no independent second review.

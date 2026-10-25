# Open authority item G1-SOIL: demolition × 5 date-dependent 劫煞 contexts × 土王用事

Opened 2026-10-25 by owner ruling on G1 glyph Stage 1 ([report](p4-g1-demolition-glyph-authority.md), [Stage 2 spec](p4-g1-glyph-stage2-spec.md)).

**Status: OPEN, deferred.** Nothing is decided here.

## Scope

| Context | Out of 土王用事 | In 土王用事 | Grade (out / in 2025–2027 / in outside) |
|---|---|---|---|
| 丑-甲寅, 丑-壬寅, 丑-戊寅 | blank | avoid | A / B / C |
| 丑-丙寅 | blank | avoid | B / B / C |
| 未-戊申 | blank | avoid | B / B / C |

The mechanism is puzhu:20 (相抵). Demolition is unnoted when 興造動土 and 豎柱上梁 are both unnoted. Inside 土王用事, 興造動土 carries 土王用事後, so the lift is blocked and 劫煞's 忌 is kept. Source: G1-a `engine.json`, owner-accepted 2026-10-24.

## Production state until this item is resolved

- R3: the 5 contexts are `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` in 劫煞 authority v3.
- They have no static cell. Their output stays the legacy verdict (`no_annotation`, Kiếp Sát informational).
- Authority application in these contexts throws.

## Questions for the future audit (not ruled)

1. **Representation.** One option is a date-aware cell (R2): a 土王用事 flag passed to the authority lookup, which needs a runtime API change. Others may exist.
2. **Window outside 2025–2027.** `p4-soil-owner-convention-v1` covers only 2025–2027, and outside it `getP4SoilPresence` returns `unknown`. The product 土王用事 bad god uses the same period rule for all years as product policy. Can the window count as authority there? It is grade C today.
3. **Measured stake.** If R2 were applied on top of R3, 298 more days outside 2025–2027 would change: watch→avoid, −15 each (Stage 1 `range-impact.json` `faithfulVsFit`). There are 0 changes in 2025–2027, where the P4 adapter decides.
4. **未-戊申.** The demolition cell comes from the puzhu:20 engine. It is separate from the open 未-戊申 × 立券交易 item ([p4-weishen-lijuan-authority-item.md](p4-weishen-lijuan-authority-item.md)), which this item does not touch.

Any resolution is its own authority migration, with its own successor version, impact analysis and owner approval.

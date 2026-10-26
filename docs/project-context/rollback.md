# Rollback

> Cách rollback từng policy/authority đã ship. Trạng thái hiện hành: [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md). Lịch sử PR/deploy: [`history.md`](history.md).

Rollback (flag về false trên nhánh riêng → PR → deploy → smoke; không sửa Golden):

- `xiejiVol10Scoring`: history §38–39.
- `legacyGodsMonthJian`: `docs/audits/dormant-legacy-gods.md`.
- `xiejiVol10BalancingEnabled`: PR một dòng manifest, giữ 6 chain và `legacyGodsMonthJian`; proof `shared/lunar/p4MigrationRollback.test.ts`, `docs/audits/p4-migration-diff.md`.
- `tiangouYinNoYi`: PR một dòng manifest, độc lập flag P4; test lịch sử ghim `false`, proof `shared/lunar/p1TiangouYinMigration.test.ts`.
- `satChuNgocHapStars`: PR một dòng manifest; baseline/rollback/migration-diff/almanac legacy ghim `false`.
- `p4ScoreHeadingLookup`: PR một dòng manifest về `source-key-v1` (= Score Golden v2, byte-equal output `1ed3828`); test v2 đã ghim `source-key-v1`; proof `shared/lunar/p4MigrationDiffV3.test.ts` (rollback forward/rollback/re-enable), `docs/audits/p4-g1b-stage2-migration.md`.
- puzhu:06 authority v5 → v4 (Q4-REST): PR một dòng đổi import `shared/lunar/p4Puzhu06.ts` về `p4b-puzhu06-v4.json`; v4 không có `QL_NARROW`/`yiComposition` nên nhánh code mới tự tắt; v4, Golden v4/full v3/score v5 và test ghim rollback (`shared/lunar/q4RestRollback.ts`) giữ nguyên; proof `shared/lunar/p4Q4RestStage3Migration.test.ts` (rollback = baseline 1.097 ngày), `docs/audits/p4-q4-rest-stage3-migration.md`.
- puzhu:06 authority v4 → v3 (F1 R2): PR một dòng đổi import `shared/lunar/p4Puzhu06.ts` về `p4b-puzhu06-v3.json`; v3, Golden v3/v4 cũ và test ghim rollback (`shared/lunar/f1R2Rollback.ts`) giữ nguyên; proof `shared/lunar/p4F1R2Migration.test.ts` (rollback/mutation), `docs/audits/p4-f1-wuli-lijuan-stage3-migration.md`.
- Authority 劫煞 v4 → v3 → v2 → v1 (G1-SOIL, G1 glyph, G2): đổi import `shared/lunar/xiejiVol10JieshaAuthority.ts`; G2 rollback còn bỏ entry `headingAliases` 立劵交易. **Thứ tự bắt buộc:** v4 → v3 → v2 trước khi rollback G1-b (`source-key-v1` giả định v2; trên v3 lệch 15 ngày, v4 thêm 5 ngày overlap). Rollback G1-SOIL giữ rule service `thoVuongDungSuRule.ts` (v3 không gọi). Proof `rollback.json` trong `docs/audits/sources/p4-vol10/{g2-stage2,g1-glyph-stage2,g1-soil-stage2}/` (dump toàn dải byte-identical với main trước release).
- `xiejiVol10JieshaPolicy`: PR một dòng manifest về `legacy-cancel-both`; authority, Golden v2 và test giữ nguyên; 9 test lịch sử đã ghim `legacy-cancel-both`; proof `shared/lunar/xiejiVol10JieshaMigration.test.ts` (legacy vs faithful-v1 toàn miền), `docs/audits/p4-jiesha-option-c-migration.md`.

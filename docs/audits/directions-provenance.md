# Hỷ Thần / Tài Thần / Phúc Thần provenance audit

Status: **source policy frozen for Phase 4B**  
Scope: Phase 4B.1–4B.9  
Production behavior changed: **no**

## Production implementation

`shared/lunar/directions.ts` currently exposes `hyThan` and `taiThan`, both looked up from the day stem (`DAY_STEM`, Giáp..Quý).

The current Hỷ Thần column is source-supported. The current `taiThan` column is not a canonical Tài Thần table: 9/10 cells match the Phúc Thần table in `玉匣記`; Nhâm is the remaining mismatch.

Therefore the existing implementation must not be used to generate the Phase 4B Golden.

## Source policy

### 喜神 / Hỷ Thần

Primary authority: `欽定協紀辨方書`, 卷七, `喜神`.

Canonical rule:

```text
甲己 → 艮 → Đông Bắc
乙庚 → 乾 → Tây Bắc
丙辛 → 坤 → Tây Nam
丁壬 → 離 → Nam
戊癸 → 巽 → Đông Nam
```

`玉匣記`, `喜神方位歌`, independently prints the same mapping:

```text
甲己在艮乙庚乾，丙辛坤位喜神安，
丁壬只在離宮坐，戊癸遊來在巽間。
```

Decision:

```text
operand .............. DAY_STEM
authority ............ 欽定協紀辨方書 卷七〈喜神〉
corroboration ........ 玉匣記〈喜神方位歌〉
production ........... 10/10 MATCH
status ............... SOURCE_LOCKED
```

### 福神 / Phúc Thần

Authority selected for this project convention: `玉匣記`, `福神方位歌`.

Source text:

```text
甲乙東南是福神，丙丁正東是堪宜，
戊北己南庚辛坤，壬在乾方癸在西。
```

Canonical mapping:

```text
甲  Đông Nam
乙  Đông Nam
丙  Đông
丁  Đông
戊  Bắc
己  Nam
庚  Tây Nam
辛  Tây Nam
壬  Tây Bắc
癸  Tây
```

Decision:

```text
operand .............. DAY_STEM
authority ............ 玉匣記〈福神方位歌〉
status ............... PROJECT_CONVENTION_SOURCE_LOCKED
```

### 財神 / Tài Thần

Authority selected for this project convention: `玉匣記`, `財神方位歌`.

Source text:

```text
甲乙東北是財神，丙丁向在西南尋，
戊己正北坐方位，庚辛正東去安身，
壬癸原來正南坐，便是財神方位真。
```

Canonical mapping:

```text
甲  Đông Bắc
乙  Đông Bắc
丙  Tây Nam
丁  Tây Nam
戊  Bắc
己  Bắc
庚  Đông
辛  Đông
壬  Nam
癸  Nam
```

An academic transcription comparing manuscript material with `增補萬全玉匣記` records the same `財神方位歌` mapping. It also records distinct `大財神歌` / `小財神歌` traditions. Those variants are evidence that multiple traditions exist; they are not merged or majority-voted into this project convention.

Decision:

```text
operand .............. DAY_STEM
authority ............ 玉匣記〈財神方位歌〉
corroboration ........ 增補萬全玉匣記 textual witness
variants ............. EXIST (大財神 / 小財神 traditions)
project convention ... 玉匣記 daily 財神方位歌
status ............... PROJECT_CONVENTION_SOURCE_LOCKED
```

## Production discrepancy

Current production `taiThan`:

```text
甲 東南
乙 東南
丙 東
丁 東
戊 北
己 南
庚 西南
辛 西南
壬 西
癸 西
```

Compared with `玉匣記` 福神, 9/10 cells match. Only 壬 differs: production has Tây while the source has 乾 = Tây Bắc.

This strongly indicates the current field was populated from a Phúc Thần-like table but labeled `taiThan`. Phase 4B migration must preserve the useful information by introducing a separate `phucThan` field and replacing `taiThan` with the selected 財神 table.

The old Mậu conflict (`Nam` vs `Bắc` on modern websites) is resolved under the frozen convention: `玉匣記` has `戊己正北`, therefore Mậu Tài Thần = **Bắc**. This decision is provenance-based, not website majority vote.

## Canonical 30-cell matrix

```text
Can    Hỷ         Tài       Phúc
甲      Đông Bắc   Đông Bắc  Đông Nam
乙      Tây Bắc    Đông Bắc  Đông Nam
丙      Tây Nam    Tây Nam   Đông
丁      Nam        Tây Nam   Đông
戊      Đông Nam   Bắc       Bắc
己      Đông Bắc   Bắc       Nam
庚      Tây Bắc    Đông      Tây Nam
辛      Tây Nam    Đông      Tây Nam
壬      Nam        Nam       Tây Bắc
癸      Đông Nam   Nam       Tây
```

The independent Golden fixture for Phase 4B must encode this matrix directly from the frozen source policy, not from `shared/lunar/directions.ts`.

## Migration rules

1. Add `phucThan` rather than discarding the old information.
2. Replace `taiThan` with the canonical project-convention 財神 table.
3. Keep Hỷ Thần unchanged.
4. Do not infer any global auspiciousness score from these directions.
5. Do not resolve future source conflicts by website vote.
6. A future change to a different 財神 tradition is an explicit convention migration and requires a new Golden/versioned audit decision.

## References

- `欽定協紀辨方書` (Siku Quanshu), 卷七〈喜神〉: https://zh.wikisource.org/zh-hant/%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B707
- `玉匣記`, `喜神方位歌` / `福神方位歌` / `財神方位歌`: https://zh.wikisource.org/zh-hant/%E7%8E%89%E5%8C%A3%E8%A8%98
- Academic transcription comparing manuscript material and `增補萬全玉匣記`: https://omu.repo.nii.ac.jp/record/4292/files/2018000063.pdf

## Phase 4B checkpoint

```text
4B.1 implementation inventory ........ PASS
4B.2 Hỷ Thần provenance ............... PASS
4B.3 production mislabel detection .... PASS
4B.4 Tài / Phúc distinction ........... PASS
4B.5 primary Hỷ source ................ PASS
4B.6 玉匣記 Tài/Phúc source ........... PASS
4B.7 variant analysis ................. PASS
4B.8 Mậu conflict ..................... PASS
4B.9 source policy freeze ............. PASS
4B.10 independent 30-cell Golden ...... NEXT
```

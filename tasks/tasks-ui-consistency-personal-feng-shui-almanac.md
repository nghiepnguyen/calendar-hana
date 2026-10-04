# UI Consistency Personal Feng Shui and Almanac

## Tasks

- [ ] 0.0 Create feature branch
- [ ] 0.1 Create and checkout `codex/ui-consistency-personal-feng-shui-almanac`.
- [x] 1.0 Audit and standardize shared responsive breakpoints
  - [x] 1.1 Inventory all `@container` thresholds in both section CSS files.
  - [x] 1.2 Define shared compact, medium, and wide container ranges.
  - [x] 1.3 Update Almanac and Personal Feng Shui layouts to use the shared ranges.
  - [x] 1.4 Verify no layout transition leaves a partial or conflicting grid state.
- [x] 2.0 Align spacing, density, and tile hierarchy across both sections
  - [x] 2.1 Define shared spacing tokens for panel, hero, bento, tile, and nested content.
  - [x] 2.2 Align `hero`, `bento`, `tile`, relation, and recommendation spacing.
  - [x] 2.3 Reduce redundant nested padding in Personal Feng Shui content.
  - [x] 2.4 Preserve Bazi readability while matching the shared tile rhythm.
- [x] 3.0 Optimize mobile and tablet layouts for dense content
  - [x] 3.1 Test widths 320, 375, 390, 520, 620, 768, 820, and 1024px.
  - [x] 3.2 Prevent overflow in long day names, descriptions, chips, hour cards, and CTAs.
  - [x] 3.3 Set practical minimum widths for bento and hour cards.
  - [x] 3.4 Confirm one-column mobile layout and balanced tablet columns.
- [x] 4.0 Improve typography, interaction affordance, and reduced-motion behavior
  - [x] 4.1 Normalize label, metadata, body, and headline sizes across both sections.
  - [x] 4.2 Verify interactive tiles, links, buttons, focus-visible, and cursor states.
  - [x] 4.3 Verify interactive touch targets remain at least 44px.
  - [x] 4.4 Add or align `prefers-reduced-motion` handling for section animations.
- [x] 5.0 Add responsive regression coverage and verify final UI
  - [x] 5.1 Run existing Almanac and Personal Feng Shui responsive assertions.
  - [x] 5.2 Verify complete and incomplete birth-profile states on desktop/mobile E2E.
  - [x] 5.3 Run lint, TypeScript, full Vitest, build, and Playwright checks.
  - [x] 5.4 Run `graphify update .` after implementation.

## Relevant Files

- `src/views/DayView/AlmanacPanel.module.css` - Shared panel, hero, bento, tile, and hour-grid layout.
- `src/views/DayView/PersonalFengShuiPanel.module.css` - Personal section spacing, responsive grids, hour groups, and recommendations.
- `src/views/DayView/AlmanacPanel.tsx` - Almanac section DOM structure and interactive tiles.
- `src/views/DayView/PersonalFengShuiPanel.tsx` - Personal section DOM structure and data states.
- `src/views/DayView/BaziSection.module.css` - Nested Bazi tile density and responsive chart layout.
- `src/views/DayView/AlmanacPanel.test.tsx` - Almanac behavior and accessibility tests.
- `src/views/DayView/PersonalFengShuiPanel.test.tsx` - Personal section behavior and accessibility tests.
- `src/views/DayView/BaziSection.test.tsx` - Bazi tile rendering and state tests.
- `src/views/DayView/DayView.test.tsx` - Day View integration coverage.

### Notes

- Keep business logic and feng shui calculations unchanged.
- Use container width as the responsive source of truth.
- Check each completed sub-task in this file immediately after completion.
- Run focused tests first, then full validation before delivery.

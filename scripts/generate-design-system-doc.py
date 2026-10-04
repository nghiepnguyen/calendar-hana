from pathlib import Path
from docx import Document
from docx.enum.text import WD_BREAK

ROOT = Path('/Users/nghiepnguyen/My Files/calendar-hana')
REFERENCE = Path('/Users/nghiepnguyen/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-system-design/assets/reference.docx')
OUTPUT = ROOT / 'calendar-hana-design-system.docx'

doc = Document(REFERENCE)

for section in doc.sections:
    for paragraph in list(section.header.paragraphs) + list(section.footer.paragraphs):
        if '[Organization Name]' in paragraph.text:
            paragraph.clear()
            paragraph.add_run('Calendar Hana | App Design System')

def set_p(index, text, style=None):
    p = doc.paragraphs[index]
    p.clear()
    if style:
        p.style = style
    p.add_run(text)

def cell(table_index, row, col, text):
    c = doc.tables[table_index].cell(row, col)
    c.text = text

set_p(8, 'Calendar Hana')
set_p(9, 'App Design System and UI Governance')
cell(0, 0, 0, 'STATUS\nApproved baseline')
cell(0, 0, 2, 'OWNER\nProduct and frontend')
cell(0, 0, 4, 'LAST UPDATED\nOctober 4, 2026')

cell(1, 0, 1, 'Frontend team')
cell(1, 1, 1, 'Product, UX, QA')
cell(1, 2, 1, 'UI consistency audit; accessibility checklist')
cell(1, 3, 1, 'Shared visual tokens and reusable UI patterns for the calendar web app')

set_p(22, 'Calendar Hana uses one shared visual language for calendar views, personal feng shui, almanac data, settings, forms, toasts, and mobile navigation. The system is an iOS-inspired web glass interface with semantic tokens in src/styles/theme.css, shared input/button primitives, and component-level CSS modules. This document fixes the baseline so new UI extends existing patterns instead of inventing local spacing, typography, radius, or interaction rules.')
set_p(23, 'The system must remain readable in light and dark themes, support user text scaling, work from 320px/375px through desktop widths, preserve safe-area spacing on mobile, and meet accessible keyboard and touch expectations. Mobile is the baseline: no horizontal scroll, no clipped labels, no tap target below 44px, and no input text below 16px on coarse pointers. It governs presentation and interaction consistency; it does not define business rules, astrology calculations, Firebase data contracts, or route structure.')

set_p(26, 'Goals\n1. One token source for color, type scale, spacing, radius, elevation, focus, and safe-area layout.\n2. Every new control uses an existing primitive or documents a justified exception.\n3. iOS, Android, desktop web, and PWA layouts share the same hierarchy and touch behavior.\n4. New UI passes visual, responsive, and accessibility checks before merge.', 'Heading 1')
set_p(27, 'Non-goals\n1. Do not redesign the information architecture or navigation labels.\n2. Do not replace the existing glass visual language with another design system.\n3. Do not use decorative gradients, emoji icons, or one-off component colors as defaults.', 'Heading 1')
cell(2, 1, 0, 'One token source for type, color, spacing, radius, focus, and safe-area layout.')
cell(2, 1, 1, 'Redesign information architecture or navigation labels.')
cell(2, 2, 0, 'Reuse primitives for controls and document justified exceptions.')
cell(2, 2, 1, 'Replace the existing iOS-inspired glass language wholesale.')
cell(2, 3, 0, 'Support light/dark themes, text scaling, mobile touch, and responsive widths.')
cell(2, 3, 1, 'Define business rules, lunar calculations, Firebase data contracts, or routes.')
cell(2, 4, 0, 'Catch UI drift through tests and four-width visual review before merge.')
cell(2, 4, 1, 'Guarantee visual sameness when content or semantic hierarchy requires a real variation.')

set_p(28, 'The codebase already has strong shared primitives, but local UI can drift when a component bypasses them. The most common drift is a select that does not use the global input class, a card with a different radius or padding, a muted label below contrast targets, or a mobile control that ignores the 44px touch minimum. These defects are especially visible in the daily view because the personal feng shui and almanac sections place many compact boxes next to one another.')
set_p(29, 'The invariant is simple: semantic intent determines color and hierarchy; shared tokens determine geometry. A component may vary its layout, but not its base type scale, touch target, focus treatment, radius family, or page accent without a documented reason.')

set_p(31, 'Architecture layers\n1. Global tokens: src/styles/theme.css defines theme colors, type families, scale, font weights, radius, spacing, safe-area variables, focus, and motion curves.\n2. Primitives: .input, .btn, .glass, field-label, field-hint, segmented controls, Tile, Toast, and TabBar provide the default interaction language.\n3. Feature components: DayView, MonthView, settings forms, EventForm, UpdatePrompt, and panels compose primitives without redefining their foundations.\n4. Verification: lint, typecheck, unit tests, emulator tests, Playwright desktop/mobile, and manual light/dark/mobile review.')
set_p(33, 'Figure 1. Shared UI architecture: Theme tokens → primitives → feature components → responsive verification.')
set_p(35, 'Core components')
for i, row in enumerate([
    ['Theme tokens', 'Own all global colors, fonts, scale, radii, spacing, focus, safe-area, and motion values.', 'src/styles/theme.css', 'A missing token blocks merge; do not add a local hard-coded substitute.'],
    ['Form primitives', 'Inputs and selects use .input; labels and hints use field-label and field-hint.', 'Global CSS tokens', 'Fallback to native control behavior while preserving 44px touch targets and focus visibility.'],
    ['Glass surfaces and tiles', 'Panels use glass; cards and bento tiles use shared tile padding, radius, highlight, and edge.', 'CSS variables', 'Keep content readable with solid fallback when reduced transparency is enabled.'],
    ['Responsive navigation', 'TabBar, header, sidebar, and scroll container coordinate mobile safe-area and route changes.', 'React state and CSS media/container queries', 'On view switch, reset the new scroll surface to the top; never inherit stale content position.'],
    ['Feedback surfaces', 'Toast and UpdatePrompt communicate transient success, offline state, and app updates.', 'ToastRegion portal', 'Use role=status for passive feedback and role=alert for actionable updates.'],
]):
    for j, value in enumerate(row): cell(3, i + 1, j, value)

set_p(40, 'A UI request enters through a feature component and must first map to an existing token or primitive. The component then chooses semantic intent, such as neutral, accent, success, warning, or error. Layout is expressed with grid/flex and responsive breakpoints or container queries. The result is checked for keyboard focus, contrast, text scaling, touch size, safe-area behavior, and visual consistency with neighboring components.')
set_p(41, 'At the boundary, use semantic HTML and explicit labels. Every select has a label or accessible name. Every icon-only button has aria-label. Do not use color as the only status signal. Keep the global .input class on all input/select controls so iOS Safari, Android Chrome, and desktop browsers share height, padding, appearance, arrow, and focus behavior.')
set_p(42, 'Load tokens from theme.css. Use --ui-scale for all user-scalable lengths: font sizes, icon sizes, spacing, control heights, and layout gaps. Use --tap-min and max(var(--tap-min), ...) for interactive targets. Use --tabbar-space and env(safe-area-inset-bottom) for mobile bottom clearance.')
set_p(43, 'The primary decision is component composition: reuse a primitive when its semantic role matches; create a new pattern only when the interaction or information hierarchy is genuinely different. Do not duplicate .input, .btn, glass, toast, or tile rules inside a feature module.')
set_p(44, 'Before side effects or persistence, the UI must preserve user input, avoid layout shift, and expose validation close to the field. Async actions need a visible pending or disabled state where applicable. App update actions are actionable alerts and must remain prominent on desktop and mobile.')
set_p(45, 'Responsive behavior is a bounded state change, not a separate design. At 320px/375px, controls stack or become full width, long Vietnamese labels wrap, and cards never force horizontal overflow; at 768px, multi-column layouts may begin; at 1024px and 1440px, preserve readable max widths and stable rhythm. Inputs/selects stay at least 16px text and 44px height on coarse pointers. Fixed bottom navigation reserves safe-area space. Keyboard-open layouts must keep the focused field and primary action visible; dialogs and toasts must fit the viewport without hiding content. Test portrait and landscape, light/dark themes, text scaling, reduced transparency, and reduced motion.')
set_p(46, 'Every change emits evidence through tests or manual review. Required checks depend on scope: CSS-only change needs lint plus focused UI test; interactive component needs focused test and responsive review; shared token change needs full test suite and light/dark validation.')

set_p(50, 'Design token contract')
doc.tables[4].add_row()
for i, row in enumerate([
    ['--font-sans / --font-display', 'font family', 'Yes', 'System UI stack: Apple system fonts first, then Segoe UI, Roboto, Helvetica Neue, sans-serif. Use display only for prominent titles.'],
    ['--ui-scale / --fw-*', 'scale and weight', 'Yes', 'All scalable sizes use calc(base * var(--ui-scale)); weights use semantic --fw-300 through --fw-800.'],
    ['--gap / --section-gap / --tile-pad', 'spacing', 'Yes', 'Use shared rhythm. Default page gap is 12px scaled; tile padding is 12px scaled in the almanac token layer.'],
    ['--radius-sm / --radius / --radius-lg / --radius-pill', 'radius', 'Yes', '8px controls, 12px inputs/events, 22px panels/cards, 999px pills/buttons/chips.'],
    ['--text / --text-muted / --separator', 'content hierarchy', 'Yes', 'Primary text, secondary text, and structural dividers. Muted text must remain readable in both themes.'],
    ['--fill / --glass-strong / --glass-edge / --glass-highlight', 'surface', 'Yes', 'Form fills and glass surfaces. Reduced-transparency mode replaces blur with solid surfaces.'],
    ['--accent / --focus / --almanac-good / --almanac-bad / --gold', 'semantic color', 'Yes', 'Use semantic status only. Do not invent feature-local colors; status must also have text or icon meaning.'],
    ['--tap-min / --tabbar-space', 'mobile interaction', 'Yes', '44px touch intent when text scaling or coarse pointer requires it; reserve bottom space for the fixed tab bar.'],
]):
    for j, value in enumerate(row): cell(4, i + 1, j, value)

set_p(53, 'Component guarantees')
set_p(54, 'Controls use existing primitives, retain visible focus, remain usable with keyboard and touch, and do not introduce horizontal overflow at 375px.')
set_p(55, 'A new pattern is identified by semantic role and component name, not by page location. The same role must share the same token contract across Day, Month, Settings, EventForm, and overlays.')
set_p(56, 'Each UI change records the relevant route, responsive state, theme state, and user text-size state when those affect rendering. Accessibility labels and status roles are part of the contract.')
set_p(57, 'The design system is the source of truth for presentation. Product rules, lunar calculations, Firebase security, and event mappings remain owned by their respective modules.')
set_p(58, 'The versioned UI contract is published at ')
set_p(59, 'src/styles/theme.css, component CSS modules, and this design-system document. Update the document when tokens or shared primitives change.')

for i, row in enumerate([
    ['New input/select', 'Use .input; label above; helper below; 44px coarse-pointer height; visible focus.', 'Avoid one-off border, height, arrow, or padding rules.'],
    ['New card/tile', 'Use glass/tile tokens; use --tile-pad and shared radius; keep one clear hierarchy.', 'Do not stack nested cards without a real information boundary.'],
    ['New status', 'Use semantic text plus color/icon; map to existing status tokens.', 'Do not rely on color alone or add neon/glow accents.'],
    ['New mobile layout', 'Use container/media queries, full-width controls, safe-area variables, and no horizontal scroll.', 'Do not preserve desktop widths or stale scroll positions across views.'],
]):
    for j, value in enumerate(row): cell(5, i + 1, j, value)

set_p(63, 'Consistency is client-facing: changing a view or route must show the new surface from its own scroll origin. Duplicate writes or repeated UI events must not create duplicate visible feedback. A component may fallback to native browser behavior, but it must preserve semantic labels, focus, touch target, and theme contrast.')

set_p(66, 'Authentication and data boundaries remain enforced by Firebase rules and repository code. UI changes must not expose private user data, secrets, or service credentials. Client configuration values are public bundle configuration; secrets remain in GitHub/Firebase secret stores.')
set_p(67, 'Do not place sensitive data in toast text, logs, analytics labels, screenshots, or design examples. Keep status copy concise and contextual. Use role=status or role=alert according to urgency.')
set_p(68, 'Do not add credentials, API keys, or production tokens to CSS, fixtures, workflow files, or design documents. Use existing repository variables and secrets conventions.')
set_p(69, 'Safe defaults are neutral theme, readable default text size, visible focus, no horizontal scroll, and no destructive action without the existing confirmation pattern.')
set_p(70, 'The UI system does not define retention or deletion policy. Data lifecycle remains governed by repository, Firebase rules, backup/import, and product policy.')
set_p(71, 'Data retention, deletion, residency, privacy, and audit remain governed by repository, Firebase rules, backup/import, and product policy. This design system stores no user data.')

set_p(74, 'Operational readiness')
set_p(75, 'Before merge: run formatter/lint, typecheck, focused tests, and the relevant full suite. For shared token changes, review 320px, 375px, 390px, 430px, 768px, 1024px, and 1440px; portrait/landscape; light/dark themes; text scaling; reduced transparency/motion; coarse pointer; keyboard-open state; and safe-area insets. Verify: no horizontal scroll, every interactive target is at least 44px, focused controls remain visible above the keyboard, route/view changes reset scroll origin, and toasts/dialogs do not cover primary actions. For deploy workflow changes, validate YAML formatting and inspect all job dependencies, cache keys, permissions, and deploy conditions.')

for i, row in enumerate([
    ['Visual drift', 'Focused UI review and screenshot/manual pass at four widths', 'Frontend', 'Required'],
    ['Accessibility', 'Keyboard focus, labels, roles, contrast, 44px touch target', 'Frontend + QA', 'Required'],
    ['Regression', 'Vitest, emulator tests, Playwright desktop/mobile', 'CI', 'Required'],
    ['Theme/responsive', 'Light/dark, text-size scale, reduced transparency, iOS safe area', 'Frontend', 'Required'],
    ['Deploy safety', 'CI jobs pass; Firebase credentials and environment variables remain scoped', 'Release owner', 'Required'],
]):
    for j, value in enumerate(row): cell(6, i + 1, j, value)
cell(6, 6, 0, 'Release rollback')
cell(6, 6, 1, 'Deploy only after required CI jobs pass; revert the commit or Firebase release if a regression is confirmed.')
cell(6, 6, 2, 'Release owner')
cell(6, 6, 3, 'Required')

for i, row in enumerate([
    ['Local CSS per feature', 'Fast for a one-off screen', 'Creates inconsistent input, type, radius, and mobile behavior; use tokens and primitives instead.'],
    ['Third-party design system', 'Could provide more components', 'Current app already has a coherent iOS glass token system; migration cost is not justified.'],
    ['Utility-only styling', 'Concise for prototypes', 'Would bypass the existing CSS variables and text-size accessibility model; retain semantic CSS modules.'],
]):
    for j, value in enumerate(row): cell(7, i + 1, j, value)
cell(7, 4, 0, 'No shared system')
cell(7, 4, 1, 'Allows every feature team to choose its own styles.')
cell(7, 4, 2, 'Creates the exact text, spacing, control, and responsive drift this system is intended to prevent.')

for i, row in enumerate([
    ['M1', 'Add this document and link it from contributor guidance', 'New UI has a named token/primitive owner and review checklist.'],
    ['M2', 'Audit existing input, card, toast, and responsive patterns', 'No duplicate control foundations remain in touched surfaces.'],
    ['M3', 'Apply system to all future UI changes', 'CI and review catch token, accessibility, and responsive drift before release.'],
]):
    for j, value in enumerate(row): cell(8, i + 1, j, value)
cell(8, 4, 0, 'M4')
cell(8, 4, 1, 'Ongoing governance and token review')
cell(8, 4, 2, 'Global token changes have an owner, tests, and documented approval.')

set_p(81, 'Should this document become a contributor-facing DESIGN.md in the repository, or remain a product/engineering DOCX reference?')
set_p(82, 'Which existing screens should be the first full visual regression baselines: Day, Month, Settings, EventForm, or all four?')
set_p(83, 'Should the token scale support an additional compact density mode beyond the current text-size setting?')
set_p(84, 'Who owns approval for changes to global tokens in src/styles/theme.css?')

set_p(87, 'Approve this document as the shared UI contract. First milestone: add it to the repository contribution workflow and require every new UI component to identify its primitive, token usage, responsive behavior, and accessibility state. Second milestone: audit existing controls and consolidate remaining local styles. Production rollout is safe when focused tests, CI, and the four-width light/dark review all pass.')

doc.save(OUTPUT)
print(OUTPUT)

# Design

## Scene and theme

A founder at a laptop by day, checking money and fixing problems; the same
founder on a phone in a dark venue at night, at the gate or answering "my
tickets never came". So the theme **follows the system**, and light and dark
are both first-class. Neither is the "real" one.

Colour strategy: **restrained**. Neutrals lean slightly toward the brand's
navy (hue 255–260, chroma 0.003–0.015); the dark background is the brand's
`#0b0e14`. One accent, the brand's terracotta, used only for primary actions,
the current selection, focus rings and the key chart series. Semantic colours
(green, amber, crimson, blue) stay clearly apart from terracotta, and danger
always carries a word or an icon, never colour alone.

References: Linear, Stripe, Raycast, Vercel, Resend, Attio. Hairline 1px
borders instead of shadows; shadows only on overlays; small radii; confident
page titles with one-line descriptions; dense tables; a command palette.

## Colour tokens (OKLCH)

Stored as `L C H` triplets in `app/globals.css` so Tailwind can add alpha
(`oklch(var(--x) / <alpha-value>)`). Values marked * were moved from the
starting values to pass contrast.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | 0.985 0.003 255 | 0.165 0.012 260 (#0b0e14) | page |
| `--surface` | 1 0 0 | 0.2 0.013 260 | panels, tables |
| `--popover` | 1 0 0 | 0.215 0.014 260 | menus, sheets, palette |
| `--sidebar-background` | 0.965 0.005 255 | 0.145 0.012 260 | sidebar, nav sheet |
| `--foreground` | 0.2 0.015 255 | 0.95 0.008 255 | text |
| `--muted-foreground` | 0.47 0.015 255 | 0.7 0.015 255 | secondary text, placeholders |
| `--muted` | 0.955 0.005 255 | 0.235 0.014 260 | skeletons, subtle fills |
| `--accent` | 0.95 0.006 255 | 0.25 0.014 260 | hover / highlighted rows |
| `--border` | 0.91 0.006 255 | 0.28 0.014 260 | hairlines |
| `--input` | 0.87 0.008 255 | 0.32 0.014 260 | button outlines, search trigger (labelled, decorative) |
| `--control-border` (new) | 0.6 0.018 255 | 0.54 0.018 258 | boundaries of inputs, textareas, selects, checkboxes, the off switch track (`border-control`, `bg-control`) |
| `--primary` (terracotta) | 0.57 0.155 37 | 0.7 0.14 37 | fills, focus ring, active icon |
| `--primary-foreground` | 0.99 0 0 | 0.22 0.07 35 | text on terracotta |
| `--primary-text` (new) | 0.525 0.15 37 | 0.74 0.13 37 | terracotta text on a tint |
| `--destructive` (crimson) | 0.53 0.21 10 | 0.66 0.19 10 | danger |
| `--success` | 0.5 0.12 155 * | 0.72 0.15 155 | |
| `--warning` | 0.525 0.12 68 * | 0.8 0.14 80 | |
| `--info` | 0.515 0.13 245 * | 0.72 0.12 245 | |
| `--*-foreground` on semantic fills | 0.99 0 0 | dark ink of the same hue (L 0.2–0.22) | |
| `--chart-1` | 0.57 0.155 37 | 0.665 0.14 37 * | key series (terracotta) |
| `--chart-2` | 0.62 0.105 250 * | 0.665 0.105 250 * | slate blue |
| `--chart-3` | 0.53 0.13 155 | 0.72 0.15 155 | green (not used for series) |
| `--chart-4` | 0.62 0.14 70 | 0.8 0.14 80 | amber (not used for series) |
| `--chart-5` | 0.46 0.14 300 * | 0.55 0.13 300 * | violet |

Light success / warning / info were darkened (from 0.53 / 0.62 / 0.53) so
their text passes 4.5:1 on a 10% tint of themselves, which is how status
badges render. The charts keep the brighter amber since chart marks only need
3:1. Dark-mode semantic fills take dark text, because white on L 0.66–0.8
fails.

### Measured contrast (in the browser, 2026-10-19)

| Pair | Light | Dark |
|---|---|---|
| foreground / background | 17.4 | 16.7 |
| muted-foreground / background | 6.6 | 7.2 |
| muted-foreground / surface | 6.9 | 6.8 |
| muted-foreground / sidebar | 6.2 | 7.4 |
| muted-foreground / muted (skeleton, kbd) | 6.0 | 6.3 |
| primary / surface (links) | 4.8 | 6.4 |
| primary-foreground / primary (buttons) | 4.7 | 6.3 |
| badge text on its 10% tint (worst of the five) | 4.6 | 4.5+ |
| destructive / surface | 5.9 | 5.3 |

Hairline borders (`--border`, `--input`) are intentionally low contrast:
they're decoration, not the only cue. Anything whose boundary *is* the cue
(text fields, selects, checkboxes, the off switch track) uses
`--control-border` instead, measured for WCAG 1.4.11 (non-text ≥ 3:1):

| `--control-border` against | Light | Dark |
|---|---|---|
| background | 3.78 | 3.81 |
| surface | 3.94 | 3.57 |
| sidebar | 3.57 | 3.91 |
| popover (sheets) | 3.94 | 3.44 |
| muted | 3.45 | 3.29 |
| white switch thumb on the off track | 3.94 | 5.07 |

(The old `--input` border measured 1.48 / 1.43 against surface.) The focus
ring is terracotta at 4.6:1 (light) and 6.8:1 (dark). Invalid controls
(`aria-invalid="true"`) switch to a crimson border, plus a crimson ring on
focus.

### Charts (Task 3)

Categorical order is **chart-1 → chart-2 → chart-5** (terracotta, slate,
violet), assigned in that order and never cycled. Green and amber stay out of
series colours because they read as success and warning. The values marked *
above were moved so the three slots pass the dataviz palette validator
(`validate_palette.js --pairs all`, since donut segments all touch):

| Check | Light (on #ffffff) | Dark (on #13161c) |
|---|---|---|
| Lightness band | pass (0.43–0.77) | pass (0.48–0.67) |
| Chroma ≥ 0.10 | pass | pass |
| CVD ΔE, worst pair | 16.1 (slate↔violet, deutan) | 11.4 (slate↔violet, deutan) |
| Normal-vision ΔE, worst pair | 19.2 | 15.4 |
| Contrast vs surface ≥ 3:1 | pass | pass |

The old slate (C 0.08) read as grey and dark terracotta/slate sat above the
dark lightness band. More than three series in one chart means a table or
small multiples, not a fourth hue.

- One y-axis per chart; two units (naira and counts) are two charts.
- Lines 2px, areas a 10% wash, bars ≤ 24px with a 4px rounded end, grid and
  axis hairlines solid in `--border`, axis text muted.
- Every chart panel (`components/charts/chart-panel.tsx`) has a legend, a
  Chart / Table switch, and keeps the previous render at 60% opacity while a
  new range loads.
- Sequential (heatmap): `--chart-1` at five alphas over the surface
  (0.16 → 1), so dark mode gets dim-to-bright steps from the same token; zero
  is `--muted`.
- Tooltips: value in mono semibold first, series name muted, a short line key.

## Typography

**Geist Sans** for all UI, **Geist Mono** with tabular numbers for every
amount, count, table date, reference and code (the `.num` utility). Both load
locally via the `geist` package. No display fonts. The wordmark is Geist
semibold (Clash Grotesk is only served from Fontshare's CDN, so it isn't used
here).

Fixed scale, base 14px, ratio ≈ 1.15 (Tailwind sizes are remapped):

| Class | Size / line | Use |
|---|---|---|
| `text-xs` | 12 / 16 | table headers, badges, group labels, kbd |
| `text-sm` | 13 / 20 | table cells, buttons, menus, nav |
| `text-base` | 14 / 22 | body (the `body` default), descriptions |
| `text-lg` | 16 / 24 | phone top-bar title, sheet titles |
| `text-xl` | 18 / 26 | |
| `text-2xl` | 22 / 28, -0.01em | page titles (semibold) |
| `text-3xl` | 28 / 34 | rare big figures |

Inputs use 16px on phones (iOS zooms on focus below that) and 13px from 768px.

## Shape, depth and spacing

- `--radius: 0.5rem`. Panels 8px (`rounded-lg`), controls 6px (`rounded-md`),
  chips 4px. `rounded-xl/2xl` are capped at 8px so older pages stay in line.
- Surfaces are flat: 1px border, no shadow. Only overlays (menus, popovers,
  sheets, the palette, toasts) get `shadow-overlay`.
- Never nest panels.
- z-index scale: `sticky 20 · nav 30 · overlay 40 · sheet 50 · popover 60 ·
  toast 70 · tooltip 80`.

## Motion

State only. 160ms `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart; Tailwind's
`ease-out` and default `transition` now mean this) for hover, focus and state.
Sheets slide in 220ms; menus and the palette fade/scale from 98% in 150ms.
The sidebar's width only animates when the person toggles it.
`prefers-reduced-motion`: slides and zooms become plain fades (globals.css
zeroes tailwindcss-animate's translate/scale variables), the switch thumb
jumps.

## Components (`components/ui`)

Button (`primary`, `secondary`/`outline`, `ghost`, `muted`, `destructive`,
`destructive-outline`, `link`; sizes `sm`, `default`, `lg`, `icon`,
`icon-sm`; `loading` prop), Input, Textarea, Label, Badge (`neutral`, `outline`,
`primary`, `success`, `warning`, `destructive`, `info`, optional `dot`),
Table (36px header, 40px rows), Panel (+ Header/Title/Description/Content/
Footer), Sheet (left/right/bottom, + Header/Body/Footer), Switch, Checkbox,
Tooltip (inverted chip), Skeleton, Spinner, DropdownMenu, Popover, Select,
Tabs (underline), Segmented (radio-group semantics, arrow keys), Command
(cmdk), Kbd, Sidebar. Floating surfaces share `menu-styles.ts`.

Buttons and controls are 40px tall on phones and 32px (28px small) from
768px, so tap targets are never smaller than 40px.

## Shell (`components/shell`)

- **Desktop ≥1024px:** 240px sidebar, collapsible to 52px icons (⌘B / Ctrl B,
  or the Collapse row at the bottom); the choice is kept in the
  `sidebar_state` cookie. Groups follow `nav-config.ts` (Overview, Analytics ·
  Money · Platform · Control · Scan tickets). The active row gets a neutral
  fill, medium weight and a terracotta icon. Collapsed rows show a tooltip;
  group labels become hairlines.
- **Tablet 768–1023px:** the sidebar starts collapsed to icons every visit.
- **Top bar (48px, sticky):** breadcrumb (group / page / Details), search
  trigger with ⌘K, theme menu, account menu.
- **Phone <768px:** top bar with menu button (opens the nav sheet), the page
  title (it fades in once the page's own title scrolls under the bar), and a
  search icon. A bottom tab bar holds Overview, Search (palette), Approvals
  (count badge), Scan, More (nav sheet). The nav sheet also has the account,
  a theme segmented control and Sign out.
- **Command palette:** ⌘K / Ctrl K anywhere; jumps to any page and switches
  theme. Record search arrives with the v2 search endpoint.
- **Focus return:** the palette and the nav sheet open from state, not from a
  Radix Trigger, so `lib/focus-return.ts` records the opener and refocuses it
  on close. Pass the clicked element as the second argument
  (`setOpen(true, event.currentTarget)`, `setOpenMobile(true, el)`) because
  Safari doesn't focus clicked buttons.
- **PageHeader:** 22px semibold title, one-line muted description, actions on
  the right (below on phones).
- A small amber tag next to the wordmark (and on the login page) says
  `staging` or `local` whenever the API isn't production.

## Rules

- Never a hard-coded colour outside these tokens; never grey text on a
  coloured fill.
- No side-stripe borders, gradient text, glass, hero-metric template,
  identical stat-card grids, or uppercase tracked eyebrows over sections.
- Actions use sheets and inline confirms, not modal dialogs.
- Money is always naira, `₦1,234.56`, in `.num`.

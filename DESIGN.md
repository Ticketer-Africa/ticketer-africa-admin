# Design

## Theme

Dark by default (a considered choice, not a toggle-only afterthought), light
theme fully supported via `next-themes` for anyone who prefers it. Scene:
a late-night finance-ops desk — an operator scanning a dense ledger, the
numbers on screen the only bright, precise thing in the room. Near-black and
near-white surfaces carry no hue tint (pure neutrals) so nothing competes
with the data; the brand's point of view lives entirely in the primary and
accent colors and in the monospaced treatment of every figure.

Color strategy: **restrained**. Primary and accent are used deliberately —
active nav state, primary buttons, focus rings, chart lines, links, and the
"needs attention" signal — never as large surface washes. Data density and
legibility come first.

## Color Tokens (OKLCH)

### Dark (default)

```css
--background: oklch(0.09 0 0);
--surface: oklch(0.13 0 0);              /* cards, popovers, table body */
--foreground: oklch(0.95 0.004 200);
--muted: oklch(0.17 0 0);
--muted-foreground: oklch(0.62 0.01 200);
--border: oklch(0.20 0 0);
--input: oklch(0.20 0 0);
--primary: oklch(0.68 0.15 200);         /* confident cyan-blue */
--primary-foreground: oklch(0.98 0 0);
--accent: oklch(0.78 0.14 75);           /* amber — reserved for attention */
--accent-foreground: oklch(0.98 0 0);
--destructive: oklch(0.60 0.19 25);
--destructive-foreground: oklch(0.98 0 0);
--success: oklch(0.65 0.15 155);
--success-foreground: oklch(0.98 0 0);
--ring: oklch(0.68 0.15 200);
--chart-1: oklch(0.68 0.15 200);         /* primary */
--chart-2: oklch(0.78 0.14 75);          /* amber */
--chart-3: oklch(0.65 0.15 155);         /* green */
--chart-4: oklch(0.65 0.16 290);         /* violet */
--chart-5: oklch(0.65 0.17 15);          /* coral */
--sidebar-background: oklch(0.06 0 0);   /* recedes slightly below content */
--sidebar-foreground: oklch(0.85 0.004 200);
--sidebar-primary: oklch(0.68 0.15 200);
--sidebar-primary-foreground: oklch(0.98 0 0);
--sidebar-accent: oklch(0.12 0 0);
--sidebar-accent-foreground: oklch(0.95 0.004 200);
--sidebar-border: oklch(0.14 0 0);
--sidebar-ring: oklch(0.68 0.15 200);
```

### Light

```css
--background: oklch(1 0 0);
--surface: oklch(0.99 0.001 200);
--foreground: oklch(0.15 0.005 200);
--muted: oklch(0.95 0.003 200);
--muted-foreground: oklch(0.49 0.01 200);
--border: oklch(0.90 0.003 200);
--input: oklch(0.90 0.003 200);
--primary: oklch(0.55 0.16 200);
--primary-foreground: oklch(0.98 0 0);
--accent: oklch(0.62 0.15 75);
--accent-foreground: oklch(0.98 0 0);
--destructive: oklch(0.55 0.20 25);
--destructive-foreground: oklch(0.98 0 0);
--success: oklch(0.55 0.15 155);
--success-foreground: oklch(0.98 0 0);
--ring: oklch(0.55 0.16 200);
--chart-1: oklch(0.55 0.15 200);
--chart-2: oklch(0.65 0.15 75);
--chart-3: oklch(0.50 0.15 155);
--chart-4: oklch(0.55 0.16 290);
--chart-5: oklch(0.55 0.17 15);
--sidebar-background: oklch(0.97 0.003 200);
--sidebar-foreground: oklch(0.25 0.005 200);
--sidebar-primary: oklch(0.55 0.16 200);
--sidebar-primary-foreground: oklch(0.98 0 0);
--sidebar-accent: oklch(0.93 0.004 200);
--sidebar-accent-foreground: oklch(0.15 0.005 200);
--sidebar-border: oklch(0.90 0.003 200);
--sidebar-ring: oklch(0.55 0.16 200);
```

Rules: primary/accent/destructive/success always take white (near-`oklch(0.98
0 0)`) foreground text on filled use — all sit in the saturated
mid-luminance band. Never gray text on a colored fill; never a hard-coded hex
color outside these tokens.

## Typography

**Geist Sans** for UI text, **Geist Mono** for every number: currency
amounts, counts, dates in tables, IDs/references, chart axis labels. This is
the single biggest lever for the "ledger, not SaaS" feel — figures get
tabular alignment and a technical, precise texture that generic admin
templates don't bother with. Both ship via the `geist` package (already used
elsewhere in the Ticketer Africa stack), loaded locally via `next/font`, no
external font request.

- Page titles: Geist Sans, semibold, tight tracking.
- Body / labels / nav: Geist Sans, regular/medium.
- All monetary figures, counts, table numeric columns, chart values: Geist
  Mono with `font-variant-numeric: tabular-nums`.

## Layout & Components

- **Sidebar recedes, content is the workspace.** Sidebar background sits one
  step darker (dark mode) / one step cooler-light (light mode) than the main
  content area, creating depth without a heavy border or shadow.
- **Overview avoids the uniform stat-card grid.** Identical repeated cards
  are the SaaS-dashboard cliché this project explicitly rejects. Instead:
  one wide **ledger panel** for the three headline financial figures (total
  processed, lifetime profit, platform wallet balance) as divided rows with
  mono figures and a one-line description each, and a compact **stat strip**
  (not cards) for the four operational counts (users, events, tickets,
  organizer wallet total).
- **Tables carry the weight.** Rows get a subtle hover state using `muted`;
  numeric/currency columns are right-aligned and monospaced; status uses the
  `success`/`accent`(warning)/`destructive` tokens consistently everywhere a
  status appears (transactions, events).
- Radius stays close to the existing scale (`--radius: 0.75rem` base) —
  precise, not soft/bubbly. Slightly tighter than the original 1rem default.

## Motion

Restrained and functional: 150–200ms ease-out-quart on hover/focus/state
transitions, a short fade+slide on route content, respecting
`prefers-reduced-motion` throughout (crossfade fallback). No bounce, no
decorative motion unconnected to a state change.

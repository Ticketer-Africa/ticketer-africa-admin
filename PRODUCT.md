# Product

## Register

product

## Users

Ticketer Africa's two founders (both `SUPERADMIN`), and later support staff
with the `ADMIN` role. Not buyers and not event organizers (they have their
own dashboard in `frontend/`). By day they sit at a laptop checking money and
fixing problems; at night they use a phone in a dark venue, at the gate or
answering "my tickets never came". The console has to work as well at 375px
as at 1440px, in light and dark.

## Product Purpose

The place where the founders run the platform without touching the database:
see how the business is doing over any period, find any user, event, payment,
payout or ticket in seconds, and fix what's wrong (refunds, resending
tickets, stuck payments, wallet corrections, pausing payouts, suspending
people) with every action gated by risk and recorded in an audit log.
Success looks like: "how are we doing" and "is anything wrong" are answered
in seconds, and acting on the answer is safe and leaves a trail.

## Brand Personality

Serious and financial, built by people who live in Linear, Stripe and
Raycast. Precise, calm and dense; a tool for real money moving through a
real business, not a marketing surface. It carries Ticketer Africa's own
identity quietly: the brand's terracotta as the single accent on neutrals
tinted toward the brand's navy, the bar-chart mark, Geist throughout.
Confident and a little austere, not playful.

## Anti-references

Must not read as a generic, interchangeable SaaS admin template — default
shadcn neutral grays, the same sidebar-plus-card-grid every admin panel ships
with, decorative gradients or glassmorphism with no purpose. Should not feel
consumer or playful (no bubbly shapes, no bright casual color). The instruction
from the person commissioning this: "don't let it be generic."

## Design Principles

- **Money-first legibility.** Every number on this screen represents real
  currency moving through a real business. Numeric hierarchy, alignment, and
  contrast get first priority — nothing decorative should compete with a
  figure for attention.
- **Precision over decoration.** Favor restraint, alignment, and a considered
  numeric/monospace treatment for figures over illustrative or purely
  decorative elements. This is a ledger, not a landing page.
- **A point of view, not a template.** The palette and type system should be
  identifiably Ticketer Africa's own choice, not swappable with any other
  admin tool's default theme.
- **Density respects expertise.** Staff use this daily and know the domain.
  Prefer information-dense, scannable layouts over generously-padded,
  onboarding-style spacing.
- **One system across every surface.** All of these read as one product:
  Login; Overview; Analytics; Transactions, Refunds, Payouts, Wallets
  (Money); Events, Organizers, Users, Tickets, Promo codes (Platform);
  Approvals, Audit log, Team & settings (Control); Scan tickets; their
  detail pages; the action sheets; and the command palette.
- **Risk shows in the interface.** Actions say what they'll do, which tier
  they are (just do it, needs a reason, needs a second founder), and only
  appear when they're valid for the record and the viewer's role.

## Accessibility & Inclusion

WCAG AA: all text ≥4.5:1 in both themes (including placeholders and status
badges), visible focus ring, full keyboard support (⌘K palette, ⌘B sidebar),
icon-only buttons labelled, tap targets ≥40px on phones, and
`prefers-reduced-motion` turning movement into fades.

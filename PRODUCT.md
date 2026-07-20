# Product

## Register

product

## Users

Ticketera Africa internal staff with `ADMIN`/`SUPERADMIN` roles — the platform
operations team, not consumer-facing users and not event organizers (who have
their own separate dashboard in `frontend/`). They use this daily or several
times a week, at a desk, to check on the health of the platform: how much
money has moved through it, how much the company has actually made, what
organizers are holding in their wallets, and to manage users/events/
transactions/organizers when something needs a closer look or an action
(deactivating an event, for instance).

## Product Purpose

An internal admin dashboard for Ticketera Africa's ticketing platform. It
gives staff visibility into platform-wide financial and operational metrics
(volume processed, lifetime profit, platform wallet balance, organizer wallet
balances, ticket sales) and lets them manage the platform's core entities
(users, events, transactions, organizers). Success looks like: staff can
answer "how are we doing" and "is anything wrong" in seconds, and can act on
what they find without leaving the page.

## Brand Personality

Serious and financial. Precise, trustworthy, ledger/terminal-inspired rather
than generic-SaaS-friendly — this is a tool for looking at real money moving
through a real business, not a marketing surface. References: Stripe
Dashboard's precision, Mercury's financial seriousness, Linear's comfort with
information density. Confident and a little austere, not playful.

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
  identifiably Ticketera Africa's own choice, not swappable with any other
  admin tool's default theme.
- **Density respects expertise.** Staff use this daily and know the domain.
  Prefer information-dense, scannable layouts over generously-padded,
  onboarding-style spacing.
- **One system across all six surfaces.** Login, Overview, Users, Events,
  Transactions, and Organizers must read as one coherent product, not six
  independently styled pages.

## Accessibility & Inclusion

Standard WCAG AA: body text ≥4.5:1 contrast, large text ≥3:1, full keyboard
navigation, and `prefers-reduced-motion` respected for any animation. No
additional accommodations specified.

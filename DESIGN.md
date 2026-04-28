# Design Brief

## Direction

Gate Management Inventory System — A security-first dashboard for visitor tracking with role-based access control, real-time entry/exit status, and operational audit trails.

## Tone

Minimalist industrial with high-contrast status indicators — austere, auditable, no decoration, every element serves operational clarity.

## Differentiation

Status-driven color coding (success green for active check-ins, amber for warnings, red for departures) combined with scannable role badges create instant visual recognition of system state without cognitive load.

## Color Palette

| Token      | OKLCH           | Role                                 |
| ---------- | --------------- | ------------------------------------ |
| background | 0.17 0.01 260   | Deep navy page background            |
| foreground | 0.94 0.01 90    | Near-white text for high contrast    |
| card       | 0.23 0.01 260   | Elevated surface for content blocks  |
| primary    | 0.72 0.15 65    | Amber action buttons & primary CTA   |
| accent     | 0.62 0.14 145   | Success green for active/check-in    |
| muted      | 0.25 0.01 260   | Subdued text & disabled states       |
| destructive | 0.55 0.2 25    | Red for departures & dangerous acts  |

## Typography

- Display: General Sans — dashboard titles, section headers
- Body: DM Sans — form labels, log entries, descriptions
- Mono: Geist Mono — timestamps, visitor IDs, reference numbers
- Scale: h1 2.5rem/700, h2 1.875rem/600, label 0.875rem/500, body 1rem/400

## Elevation & Depth

Card-layered hierarchy with subtle borders and minimal shadow — depth through lightness shifts and border emphasis, not blur effects.

## Structural Zones

| Zone    | Background            | Border                    | Notes                                          |
| ------- | --------------------- | ------------------------- | ---------------------------------------------- |
| Header  | 0.14 0.01 260         | amber border-b            | Role badge, user menu, logout                  |
| Sidebar | 0.14 0.01 260         | amber border-r            | Navigation, role-based menu items              |
| Content | 0.17 0.01 260         | —                         | Alternating card backgrounds for rhythm       |
| Footer  | 0.23 0.01 260         | muted border-t            | Status indicators, sync state                  |

## Spacing & Rhythm

Grid-aligned 0.5rem units with 1.5rem section gaps; card padding 1rem; alternating muted-background sections every other block for visual breathing room.

## Component Patterns

- Buttons: amber primary (hover lightens), card backgrounds, subtle borders; destructive red on hover
- Cards: 0.5rem radius, card-background, 1px border-border, stat-card gradient for dashboard metrics
- Badges: role badges (super-admin amber, admin green, user neutral) with UPPERCASE text, 0.25rem radius

## Motion

- Entrance: fade-up 0.3s ease-out for page load, card entries staggered
- Hover: 0.15s ease on sidebar items, 0.2s background shift on activity log rows
- Decorative: none — motion reserved for functional feedback only

## Constraints

- No gradient text or decorative elements
- Maintain AA+ contrast on all interactive elements in both dark/light
- Activity log must display 50+ entries without scroll jank (virtualized if needed)
- Role badges must be instantly distinguishable at 12px

## Signature Detail

Left-border color-coding on status blocks (green for active, amber for warning, red for departure) — borrowed from code editors but repurposed for operational state, creating an intuitive "readiness meter" across the entire interface.

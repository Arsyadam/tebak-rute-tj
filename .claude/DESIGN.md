---
version: 1.0
name: TransitGuessr
description: "Transit-app inspired game landing — light sky, forest green, orange accents, bold rounded type, pill CTAs, soft rounded cards."
sourceUrl: "https://transitapp.com/"

colors:
  primary: "#108043"
  primary-dark: "#12452b"
  on-primary: "#ffffff"
  accent: "#F9A01B"
  accent-hot: "#FF6B00"
  background: "#EBF4F9"
  background-warm: "#ffeee6"
  surface: "#ffffff"
  surface-soft: "#FFEFE6"
  border: "rgba(18, 69, 43, 0.12)"
  text: "#003324"
  text-muted: "#19483f"
  purple: "#9C00A8"
  section-green: "#3FB971"
  section-yellow: "#FBD85D"
  section-orange: "#FF6B00"

typography:
  display:
    fontFamily: "'Rubik', system-ui, sans-serif"
    fontSize: "clamp(36px, 5.6vw, 64px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "'Rubik', system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 44px)"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "'Rubik', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.45
  nav:
    fontFamily: "'Rubik', system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 600

spacing:
  base: 4px
  scale: [8, 12, 16, 20, 24, 32, 40, 56, 80]

radius:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  pill: 999px

shadows:
  card: "0 18px 40px rgba(17, 24, 39, 0.10)"
  elevated: "0 24px 48px rgba(17, 24, 39, 0.14)"

motion:
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  duration-fast: 160ms
  duration: 280ms

breakpoints: [480px, 768px, 1024px]
---

## Rationale

Design language measured from Transit app marketing (transitapp.com) and adapted for TransitGuessr:

- **Airy light**: soft sky-blue hero wash (`#EBF4F9`), never dark purple GeoGuessr overlays.
- **Forest + citrus**: deep green text (`#003324` / `#12452b`), primary green CTAs (`#108043`), orange word accents (`#F9A01B`).
- **Friendly type**: bold rounded geometric sans for display; sentence case headlines (not all-caps GeoGuessr).
- **Pill everything**: CTAs and tabs use fully rounded ends.
- **Soft cards**: white / warm cream surfaces, large radius (24–32px), soft layered shadow — no glass-dark purple login panels.
- **Transparent chrome**: navbar sits on the sky wash with green logo text; no opaque purple bars.
- **Compact product card**: start/setup card stays compact on the right of the hero; leaderboard lives below the jumbotron.

## Do / Don't

- DO use transparent navbar + sky background.
- DO use green pill buttons with white label.
- DO accent one word in the headline with orange (e.g. **expert**).
- DON'T use GeoGuessr purple bars, white all-caps drop-shadow titles, or dark translucent signup panels.
- DON'T put map as full-page background.
- DON'T show Solo / Bareng teman until the user is logged in (guest or account).

## Component map (landing)

| Piece | Spec |
| --- | --- |
| Navbar | Transparent; logo `TransitGuessr` green; links muted green; optional language |
| Hero headline | Display type, dark green; accent word orange; left-aligned in left column |
| Start card | White surface, radius 24–32, soft shadow; compact form controls |
| Primary button | Pill, `#108043`, white text |
| Leaderboard | Below hero; cream/white card; same radius/shadow language |

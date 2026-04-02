# Design System: AntiFraude

## Pattern
- **Name:** Conversion-Optimized
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

## Style
- **Name:** Dark Mode (OLED)
- **Keywords:** Dark theme, low light, high contrast, deep black, midnight blue, eye-friendly, OLED, night mode, power efficient
- **Best For:** Night-mode apps, coding platforms, entertainment, eye-strain prevention, OLED devices, low-light
- **Performance:** ⚡ Excellent | **Accessibility:** ✓ WCAG AAA

## Colors
| Role | Hex | Tailwind equiv |
|------|-----|----------------|
| Primary | #F59E0B | amber-500 |
| Secondary | #FBBF24 | amber-400 |
| CTA | #8B5CF6 | violet-500 |
| Background | #0F172A | slate-900 |
| Surface | #1E293B | slate-800 |
| Border | #334155 | slate-700 |
| Text | #F8FAFC | slate-50 |
| Muted | #94A3B8 | slate-400 |

*Notes: Gold trust + purple tech. Evokes security and professionalism.*

## Typography
- **Heading:** IBM Plex Sans
- **Body:** IBM Plex Sans
- **Mood:** financial, trustworthy, professional, corporate, banking, serious
- **Best For:** Banks, finance, insurance, investment, fintech, enterprise
- **Google Fonts:** https://fonts.google.com/share?selection.family=IBM+Plex+Sans:wght@300;400;500;600;700

## Key Effects
- Minimal glow (`text-shadow: 0 0 20px rgba(245,158,11,0.35)`)
- Dark-to-light transitions
- Low white emission
- High readability
- Visible focus rings (`focus:ring-2 focus:ring-amber-500/50`)
- Smooth transitions (`transition-all duration-200`)

## Avoid (Anti-patterns)
- Light backgrounds
- No security indicators
- Emoji icons (use SVG only)
- Layout-shifting hover states
- Missing `cursor-pointer` on interactive elements

## Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

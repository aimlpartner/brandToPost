# BrandToPost — Design System & Anti-Slop Codex

> A living document. Updated as we design, learn, and refine.  
> Use this in any project to avoid generic AI-generated design patterns.

---

## 1. What Is AI Slop?

AI slop is the visual equivalent of filler text — design output that is technically correct but emotionally dead. It's the default output of AI tools trained on the average of the internet: safe, symmetrical, and forgettable.

### Hallmarks of AI Slop (Avoid These)

| Pattern | Why It's Slop | What To Do Instead |
|---|---|---|
| **Purple-to-blue gradient backgrounds** | Every AI SaaS landing page uses this exact gradient | Use flat color fields, or a single tinted wash with intentional opacity |
| **Pill badges above headings** (e.g. "✨ AI Powered") | Screams template. Adds nothing | Remove entirely, or replace with a typographic detail (italic subtitle, monospaced label) |
| **Rounded glass-morphism cards with colored icon circles** | The #1 most generated AI layout component | Use raw typography, border-top accents, or asymmetric editorial layouts |
| **4-column icon grids with step numbers** | Every AI tool, every SaaS homepage, every landing page builder | Use a 2-column staggered layout, large typography with inline detail, or a vertical editorial timeline |
| **Lucide/Heroicons as decorative elements** | Generic SVG icons from the same 3 libraries everyone uses | Use custom letterforms, monospaced characters, or no icons at all — let the text do the work |
| **"Glass card" with backdrop-blur** | Was innovative in 2022, now signals template use | Use clean borders, subtle shadows, or no container at all |
| **Words like "Unlock", "Supercharge", "Elevate", "Revolutionize"** | AI-generated copy fingerprint | Write like a human. Short, direct, specific. Say what it actually does |
| **Perfectly symmetrical 4-column grids** | Mathematical perfection = algorithmic output | Break the grid. Use 60/40 splits, staggered rows, or single-column narrative |
| **Colored dot + heading pattern** | The `●  Feature Name` pattern is in every AI output | Use numbered monospaced labels, rule lines, or just bold text |
| **Hover scale-up animations on cards** | `group-hover:scale-110` on everything | Intentional, purposeful micro-interactions only. Underline reveals, opacity shifts, or nothing |
| **Shadow-md on everything** | Default elevation creates "floating card soup" | Use border-top or border-left accents instead. Or no elevation at all |

---

## 2. Our Design DNA

### Typography
- **Primary font**: `Inter Tight` via `var(--font-sans)` and `var(--font-display)`
- **Never use**: Outfit, Inter (regular), or any hardcoded font-family
- **Heading style**: Large, light-weight (`font-light`), tight tracking (`tracking-tight` or `tracking-tighter`)
- **Body style**: `font-light` or `font-normal`, relaxed leading, slate-600 color
- **Accent text**: Italic serif fragments for emphasis (not colored spans)

### Color Philosophy
- **Brand purple**: `#7C3AED` — used sparingly, never as a gradient background
- **Brand blue**: `#2583EB` — secondary accent only
- **Text**: `slate-900` for headlines, `slate-600` for body, `slate-400` for meta
- **Backgrounds**: Alternate between pitch black (`bg-black`, `#08080C`) and warm off-white (`bg-[#FAF9F6]`). **Never use** `bg-white`, `bg-slate-50`, or `bg-gray-50` for section backgrounds — they break the warm tone
- **Full-width bg wrapper**: When a section needs a colored background, wrap it in a full-width `<section>` with the bg color, then nest a `max-w-7xl` inner `<div>` for content width constraints
- **Sophisticated Brand Color Accents**: Apply our 4 signature colors (`#7C3AED` purple, `#2583EB` blue, `#FF7778` coral, `#10B981` green) as precise structural and typographic accents (active menu indicators, thin vertical border rules, or large muted background watermarks). Do not paint entire block elements or use neon status chips; let colors guide layout transitions and platform themes.
- **NO**: Purple-to-blue gradient sections. No gradient text on headings. No colored card backgrounds

### Layout Principles
- **Asymmetry over symmetry**: Use 60/40 or 70/30 column splits instead of equal grids
- **Negative space is structure**: Large margins and padding create breathing room, not emptiness
- **Avoid scroll fatigue via interactive consolidation**: Do not stack multiple details/mockups in endless vertical rows where the user has to scroll through 4+ folds for simple lists. Instead, consolidate them into a single interactive workspace console or sheet viewer (e.g. left-side tab list, right-side dynamiusec preview) to keep knowledge compact and interactive.
- **Full-width authority**: Key sections should use `max-w-7xl` and feel expansive
- **Border-top as divider**: Clean `border-t border-slate-900/10` to separate content blocks (as done in Section 4)
- **No floating card soup**: If you must use a container, make it a subtle bordered region, not a raised glass card

### Content Writing Rules
- **Kill filler words**: No "leverage", "unlock", "supercharge", "cutting-edge", "seamless", "robust"
- **Be specific**: Instead of "AI-powered content creation" → "Arthur writes your LinkedIn posts using your brand's positioning rules"
- **Show realistic outputs ("intuitive like kinda boring")**: Mockups and previews must display actual, realistic B2B business copy (e.g., real case studies, actual objection maps, normal LinkedIn posts about pipeline metrics) that any B2B founder would recognize. Avoid abstract, meta-jargon, or tech code slogans.
- **Authentic Social Previews**: Previews must reflect their real-world layouts (e.g., circular profile avatars, username headers, threaded connector lines, data sheet tables). Never present social posts as raw paragraph lines or status boards. Keep them recognisable but clean and flat.
- **No Screaming Monospace Uppercasing**: Avoid using all-caps uppercase monospace text (`font-mono uppercase tracking-widest`) for subtitles, labels, or buttons. It looks like a cheap tech dashboard or terminal template. Use clean sans-serif (`font-sans`) with standard sentence-casing or title-casing instead.
- **Short paragraphs**: 2 sentences max per paragraph in sections. Let whitespace do the talking
- **Agent names = credibility**: Always reference agents by name (Arthur, Sarah, Alex, Chloe, Julian, Maya, Max)

---

## 3. Section Design Patterns We've Established

### Dark sections (Hero, TROR)
- Pure black backgrounds (`bg-black`)
- Large display type, `font-light`, white text
- Accent color via `#C084FC` (lilac) for highlighted words
- Border-left accents for supporting copy
- Asymmetric layouts with imagery bleeding off-edge

### Light sections (Section 4, Section 7, Section 8, Section 9, Footer)
- Warm off-white backgrounds (`bg-[#FAF9F6]`)
- `border-t border-slate-900/10` as structural dividers between rows and blocks
- Left-aligned text, editorial feel
- **No boxes, cards, or borders surrounding blocks (except Pricing)**: Previews and images rest directly on the off-white background canvas. Pricing uses an elegant 3-card grid system with thin, clean borders.
- **Asymmetric Staggered Rows**: For showcases, use alternating rows (e.g., Row 1: Text Left / Preview Right; Row 2: Preview Left / Text Right) separated only by thin lines, rather than bento grids.
- **3-Card Grid Pricing**: Display pricing using a 3-card grid system with thin, clean borders (`border border-slate-200/80`) and rounded corners (`rounded-2xl`). Always present active AI specialists as a clean, structured roster list mapping names to corporate roles, avoiding messy tag chips. Highlight the recommended configuration using a top accent border bar in our signature purple (#7C3AED).
- **Rounded Button Theme**: All CTA buttons must match the core application theme using standard rounded corners (`rounded-lg` or 8px rounding) rather than sharp unrounded corners (`rounded-none`).
- **Interactive Workspace Console (Section 8)**: Group multiple complex outputs into a single tabbed fold to eliminate scroll fatigue. Use flat typographic index rows with thin rules (`border-b border-slate-900/10`) on the left, and flat previews floating directly on the warm off-white page canvas (demarcated by a thin vertical line) on the right. Always implement auto-rotation (e.g., 5-second interval) so the showcase is dynamic and readable without manual clicking.

### Transition between themes
- Dark → Light transitions use `border-y border-white/[0.05]`
- Light → Dark transitions are clean section breaks, no gradients

---

## 4. Anti-Slop Checklist (Run Before Every Section)

Before finalizing any section, verify:

- [ ] **No pill badges** — Is there a rounded-full colored pill above the heading? Remove it
- [ ] **No icon circles** — Are there Lucide icons inside colored circles? Remove them
- [ ] **No glass cards** — Is `glass-card` or `backdrop-blur` used? Replace with flat layout
- [ ] **No perfect 4-column grid** — Is the layout a symmetrical 4-col grid? Break it up
- [ ] **No gradient connecting lines** — Is there a colored gradient line connecting items? Remove it
- [ ] **No hover scale** — Does anything `scale-110` on hover? Remove or replace
- [ ] **No filler copy** — Does the text use words from the slop list? Rewrite it
- [ ] **Font check** — Is everything using `var(--font-sans)` / `var(--font-display)`? No hardcoded fonts
- [ ] **Does it look like every other SaaS site?** — If yes, start over

---

## 5. Revision Log

| Date | Section | What Changed | Why |
|---|---|---|---|
| 2026-06-27 | Section 4 | Removed gradient backgrounds, added border-top dividers | Was too "SaaS template" |
| 2026-06-27 | Section 5 (TROR) | Diagonal clip-path mascot, large display type | Needed editorial authority |
| 2026-06-28 | Agent Flipbook | Font alignment to Inter Tight, colored drop caps | Wasn't following app font theme |
| 2026-06-29 | Footer | Multi-column links, colorized brand wordmark SVG | Needed modern trending footer |
| 2026-07-01 | Section 7 (POST) | Complete redesign — removing timeline, icons, glass cards, pill badge | Full AI slop section |
| 2026-07-01 | Section 8 (Output) | Created boxless, cardless Interactive Workspace Console with auto-rotation | Reduced scroll fatigue, eliminated AI template aesthetics |
| 2026-07-01 | Section 9 (Pricing) | Redesigned into horizontal stack rows with typographic rosters and sharp CTAs | Avoided card grids and slop template badges |

---

*This document is never finished. Every design decision refines it further.*

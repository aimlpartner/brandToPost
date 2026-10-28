# Universal Generative Scene Graph Architecture (Zero Templates)

> [!IMPORTANT]
> **ABSOLUTE RULE: ZERO TEMPLATES. ZERO PRE-CODED MODES. ZERO HARDCODED TABLES.**
> 
> This specification documents the **Gemini 4 Argon Generative Scene Graph Engine** for `updated_b2p_prod`.
> 
> It eliminates all pre-coded templates, all rigid enum layout modes (`mode === '...'`), all hardcoded font pairing tables, and all rigid `eyebrow + headline + subtext` stacks.
> 
> Instead, **`gemini-4-argon`** (configured in `src/server/config/gemini.ts` as our Creative Director) functions as an autonomous Graphic Art Director that composes a custom **Declarative Scene Graph** (`ArgonSceneGraph`) for every post, which the frontend renders universally.

---

## 1. Root Cause Diagnosis: Why the Current Codebase Fails

### Flaw 1: The "Text-Slapping" Template (`PostCreation.tsx:943` & `geminiService.ts:453`)
The app currently forces every single post into a rigid 3-box vertical stack:
```tsx
{generatedPost.eyebrow && <span>{generatedPost.eyebrow}</span>}
{generatedPost.headline && <h1>{generatedPost.headline}</h1>}
{generatedPost.subtext && <p>{generatedPost.subtext}</p>}
```
* On a team headshot, slapping an eyebrow tag and a 3-line paragraph turns a portrait into a spammy meme.
* On a photo with a dark floor pocket, forcing an eyebrow and subtext destroys negative space.
* On a 3-step workout routine, a single headline fails to explain the steps.

### Flaw 2: The Fallback Bottlenecks (`dynamicLayoutResolver.ts` & `fonts.ts`)
* **Line 505**: Injects `#7C3AED` (electric violet) as a fallback color whenever brand colors aren't parsed, clashing with amber, green, red, or neutral brands.
* **Line 691**: Defaults to `'EB Garamond', Georgia, serif` for every brand, making gritty gyms and B2B SaaS platforms look like 19th-century literature.
* **Aspect Ratio**: Hardcoded to `1:1` square (`1080x1080`) across `aiService.ts:827` and `visualRenderService.ts:108`, destroying the 25% vertical breathing room of modern 4:5 vertical feeds (`1080x1350`).

### Flaw 3: Why Creating "7 Preset Templates" is Still a Failure
If we create an enum of 7 templates (`in_scene_overlay | editorial_base_plate | cinema_triptych | ...`):
* What happens when a gym needs a **4-asset workout routine collage** (1 hero + 3 steps)? *None of the 7 templates supports it.*
* What happens when a SaaS company needs a **2-column side-by-side comparison**? *None of the 7 templates supports it.*
* What happens when a founder wants an **asymmetric diagonal poster**? *Broken.*

**A catalog of templates is always a trap.** We have **Gemini 4 Argon**, a frontier reasoning model. Argon must be empowered to generate the layout geometry freely.

---

## 2. The Solution: Gemini 4 Argon as the Generative Art Director

When a human art director designs a post, they analyze:
1. **Brand DNA**: The visual tone, personality, extracted colors, logo, and typography vibe.
2. **Post Message & Cadence**: Is it a punchy single question? A sequential educational routine? A raw manifesto? A metric audit?
3. **Available Assets**: 0 assets (pure graphic card)? 1 hero asset with negative space? Or multiple assets for a narrative?

Argon synthesizes these inputs and directly generates an exact **Declarative Scene Graph** (`ArgonSceneGraph`):
* **Typography**: Argon selects ANY Google Font (e.g. `Montserrat`, `Syne`, `EB Garamond`, `Geist`, `Space Grotesk`, `Playfair Display`, `Cabinet Grotesk`), exact weights (`100` to `900`), letter-spacing, line-height, and casing.
* **Layout Geometry (`panels`)**: Argon defines percentage coordinates `[x, y, width, height]` for every visual slice or card.
* **Palette Roles**: Argon assigns text, background, surface, and accent colors dynamically from Brand DNA.
* **Semantic Word Highlighting**: Argon tokenizes the headline and marks which words receive the brand accent color or stylistic emphasis.

---

## 3. The Universal Declarative Scene Graph Schema (`ArgonSceneGraph`)

This single interface represents **ANY** visual that Argon can design. There are zero template branches:

```typescript
export interface ArgonSceneGraph {
  // 1. Creative Rationale (Why Argon made these visual choices)
  rationale: string;

  // 2. Canvas Foundation (Default 1080x1350 for 4:5 vertical feed)
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string; // Optional CSS radial mesh gradient or pattern
  };

  // 3. Dynamic Typography (Chosen freely by Argon from Google Fonts)
  typography: {
    headlineFont: string;     // e.g. 'Montserrat', 'EB Garamond', 'Space Grotesk', 'Syne'
    bodyFont: string;         // e.g. 'Inter', 'Geist', 'Plus Jakarta Sans'
    headlineWeight: number | string; // 100 to 900
    textTransform: 'uppercase' | 'none' | 'capitalize';
    letterSpacing: string;    // e.g. '-0.03em' vs '0.08em'
    lineHeight: number;       // e.g. 0.95 to 1.3
  };

  // 4. Color Palette Tokens (Derived from Brand DNA)
  palette: {
    textPrimary: string;      // High contrast title ink (#FFFFFF or #181613)
    textSecondary: string;    // Supporting copy (#94A3B8 or #4A453E)
    accent: string;           // The brand punchline color (Gym=#9D4EDD, Eco=#10B981, Studio=#E9B638)
    surface: string;          // Card plate or panel fill (#141419 or #E5E5E3)
    border: string;           // Hairline dividers (rgba(255,255,255,0.1) or rgba(0,0,0,0.08))
    isDarkMode: boolean;
  };

  // 5. Visual Panels (Arbitrary geometric cuts defined by Argon)
  panels: Array<{
    id: string;
    rect: { x: number; y: number; width: number; height: number }; // Percentage coords (0-100)
    imageUrl?: string;
    backgroundColor?: string;
    overlayGradient?: string;
    stepBadge?: string;       // e.g. "01", "02", "03"
    border?: string;
    borderRadius?: string;
  }>;

  // 6. Text Elements (Placed in negative space, over panels, or on plates)
  textBlocks: Array<{
    id: string;
    rect?: { 
      top?: string; 
      bottom?: string; 
      left?: string; 
      right?: string;
      x?: number; // Optional percentage coords
      y?: number;
    };
    maxWidth?: string;
    align: 'left' | 'center' | 'right';
    spans: Array<{
      text: string;
      color?: string;
      isAccent?: boolean;     // Highlight in palette.accent
      fontStyle?: 'normal' | 'italic';
      fontFamily?: string;
    }>;
    subtext?: {
      text: string;
      color?: string;
      fontSize?: string;
    };
  }>;

  // 7. Graphic Accents (Brutalist bars, bleeds, geometry, line rules)
  graphicAccents?: Array<{
    type: 'bar' | 'circle' | 'line';
    rect: { x: number; y: number; width: number; height: number };
    fill: string;
  }>;

  // 8. Brand Logo
  logo?: {
    url: string;
    rect: { top?: string; bottom?: string; left?: string; right?: string };
    height: string;
  };
}
```

---

## 4. The Universal Canvas Renderer (Zero Template Switches)

The frontend contains **NO switch statements and NO template components**. It is a single, clean declarative renderer:

```tsx
import React from 'react';
import { ArgonSceneGraph } from './types';

interface UniversalCanvasRendererProps {
  scene: ArgonSceneGraph;
}

export const UniversalCanvasRenderer: React.FC<UniversalCanvasRendererProps> = ({ scene }) => {
  return (
    <div
      className="relative w-full aspect-[4/5] overflow-hidden select-none"
      style={{
        backgroundColor: scene.canvas.backgroundColor,
        backgroundImage: scene.canvas.backgroundImage,
        fontFamily: scene.typography.bodyFont,
      }}
    >
      {/* 1. RENDER PANELS (Any layout geometry Argon invents) */}
      {scene.panels.map((panel) => (
        <div
          key={panel.id}
          className="absolute overflow-hidden"
          style={{
            left: `${panel.rect.x}%`,
            top: `${panel.rect.y}%`,
            width: `${panel.rect.width}%`,
            height: `${panel.rect.height}%`,
            backgroundColor: panel.backgroundColor || 'transparent',
            border: panel.border || 'none',
            borderRadius: panel.borderRadius || '0px',
          }}
        >
          {panel.imageUrl && (
            <img src={panel.imageUrl} className="w-full h-full object-cover" alt="" />
          )}

          {panel.overlayGradient && (
            <div className="absolute inset-0" style={{ background: panel.overlayGradient }} />
          )}

          {panel.stepBadge && (
            <span
              className="absolute top-3 left-3 text-2xl font-black leading-none opacity-80"
              style={{
                fontFamily: scene.typography.headlineFont,
                color: scene.palette.accent,
              }}
            >
              {panel.stepBadge}
            </span>
          )}
        </div>
      ))}

      {/* 2. RENDER GRAPHIC ACCENTS (Vector bars, bleeds, line dividers) */}
      {scene.graphicAccents?.map((accent, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-none"
          style={{
            left: `${accent.rect.x}%`,
            top: `${accent.rect.y}%`,
            width: `${accent.rect.width}%`,
            height: `${accent.rect.height}%`,
            backgroundColor: accent.fill,
          }}
        />
      ))}

      {/* 3. RENDER TEXT BLOCKS (With two-tone spans & negative space anchors) */}
      {scene.textBlocks.map((block) => (
        <div
          key={block.id}
          className="absolute z-10 flex flex-col pointer-events-none"
          style={{
            ...block.rect,
            maxWidth: block.maxWidth || '90%',
            textAlign: block.align,
          }}
        >
          {/* Main Headline Spans */}
          <h1
            style={{
              fontFamily: scene.typography.headlineFont,
              fontWeight: scene.typography.headlineWeight,
              textTransform: scene.typography.textTransform,
              letterSpacing: scene.typography.letterSpacing,
              lineHeight: scene.typography.lineHeight,
            }}
            className="text-3xl leading-tight"
          >
            {block.spans.map((span, sIdx) => (
              <span
                key={sIdx}
                style={{
                  color: span.isAccent ? scene.palette.accent : (span.color || scene.palette.textPrimary),
                  fontStyle: span.fontStyle || 'normal',
                  fontFamily: span.fontFamily || scene.typography.headlineFont,
                }}
              >
                {span.text}
              </span>
            ))}
          </h1>

          {/* Optional Subtext */}
          {block.subtext && (
            <p
              className="mt-2 text-sm leading-snug"
              style={{
                color: block.subtext.color || scene.palette.textSecondary,
                fontSize: block.subtext.fontSize || '14px',
              }}
            >
              {block.subtext.text}
            </p>
          )}
        </div>
      ))}

      {/* 4. RENDER LOGO */}
      {scene.logo && (
        <img
          src={scene.logo.url}
          className="absolute object-contain z-20 pointer-events-none"
          style={{
            ...scene.logo.rect,
            height: scene.logo.height,
          }}
          alt="Brand Logo"
        />
      )}
    </div>
  );
};
```

---

## 5. Forensic Proof: How Real Native Posts Map to the Scene Graph

Every real post we extracted from Native is represented as data in this schema, without templates:

### Case 1: SuperHero Fit Club — Negative Space Punch Hook (`ALL UNDER ONE ROOF`)
* **Panels**: 1 panel covering `100% x 100%` with the barbell overhead photo.
* **Text Blocks**: 1 block at `bottom: "60px", left: "40px"`.
* **Typography**: `Montserrat`, weight `900`, `textTransform: 'uppercase'`, letter-spacing `-0.02em`.
* **Spans**: `[{ text: "ALL UNDER ONE ROOF", color: "#FFFFFF" }]`. Zero subtext. Zero eyebrow.

### Case 2: SuperHero Fit Club — Two-Tone Question (`DAY, MONTH OR YEAR?`)
* **Panels**: 1 panel covering `100% x 100%` with the dumbbell row photo.
* **Text Blocks**: 1 block at `bottom: "60px", left: "40px"`.
* **Spans**:
  - Span 1: `{ text: "DAY, MONTH OR\n", color: "#FFFFFF" }`
  - Span 2: `{ text: "YEAR?", isAccent: true }` (rendered in `#9D4EDD` neon purple).

### Case 3: SuperHero Fit Club — 4-Asset Routine Collage (`BUILD A ROUTINE... 01, 02, 03`)
* **Panels**: 4 panels arranged as a 58/42 split:
  - Panel 0 (Hero): `rect: { x: 0, y: 0, width: 58, height: 100 }`, gradient vignette.
  - Panel 1 (Step 1): `rect: { x: 58, y: 0, width: 42, height: 33.3 }`, `stepBadge: "01"`.
  - Panel 2 (Step 2): `rect: { x: 58, y: 33.3, width: 42, height: 33.3 }`, `stepBadge: "02"`.
  - Panel 3 (Step 3): `rect: { x: 58, y: 66.6, width: 42, height: 33.4 }`, `stepBadge: "03"`.
* **Text Blocks**:
  - Block 0 (Hero): `"BUILD A ROUTINE YOU'LL ACTUALLY [KEEP]"` inside Panel 0.
  - Blocks 1, 2, 3: Step titles with highlighted words inside Panels 1, 2, 3.

### Case 4: MINIM — 3-Slice Cinema Triptych (`Three Briefs, One Eye`)
* **Panels**: 4 panels arranged horizontally:
  - Panel 0: `rect: { x: 0, y: 0, width: 100, height: 22 }` (Video Still 1)
  - Panel 1: `rect: { x: 0, y: 22.5, width: 100, height: 22 }` (Video Still 2)
  - Panel 2: `rect: { x: 0, y: 45, width: 100, height: 22 }` (Video Still 3)
  - Panel 3 (Base Plate): `rect: { x: 0, y: 68, width: 100, height: 32 }`, `backgroundColor: "#E5E5E3"`.
* **Typography**: `EB Garamond`, weight `600`, `textTransform: 'none'`.
* **Text Blocks**: Title + taxonomy `"Motion; Lifestyle; Product"` + kicker `"Different worlds, same frame of mind."`.

### Case 5: Non-AI Pure Graphic — Brutalist Poster (`Repetition beats decoration`)
* **Assets**: 0 photos.
* **Canvas**: `backgroundColor: "#E5E5E3"` (warm architectural concrete).
* **Graphic Accents**: Solid black bar bleeding off top-right (`rect: { x: 95, y: 0, width: 5, height: 8 }`, `fill: "#000000"`).
* **Typography**: `Geist` or `Neue Haas Grotesk`, weight `900`, `fontSize: "56px"`.
* **Text Blocks**: Giant hook at top, 4-line poetic essay in charcoal ink at center, vector logo at bottom. Zero AI diffusion cost!

---

## 6. Backend Integration: Calling Gemini 4 Argon in `geminiService.ts`

```typescript
import { generateContentProxy } from './aiProxy';
import { ArgonSceneGraph } from '../types';

export async function planAutonomousArtDirection(params: {
  brandDna: any;
  postCopy: string;
  availableImageUrls: string[];
  isGraphicOnly?: boolean;
}): Promise<ArgonSceneGraph> {
  const { brandDna, postCopy, availableImageUrls, isGraphicOnly = false } = params;

  const prompt = `You are Gemini 4 Argon, the frontier reasoning AI serving as Executive Creative Director and Visual Art Director.
You do NOT select from pre-made templates. You synthesize a custom Declarative Scene Graph from scratch.

BRAND DNA:
- Name: "${brandDna.brandName}"
- Tone / Soul: "${brandDna.tone || 'Modern, Premium'}"
- Scraped Palette: ${JSON.stringify(brandDna.brandColors || [])}
- Target Audience: "${brandDna.targetAudience || 'General'}"

POST COPY TO COMMUNICATE:
"${postCopy}"

AVAILABLE ASSETS:
- Count: ${availableImageUrls.length}
- Image URLs: ${JSON.stringify(availableImageUrls)}
- Graphic Only Mode: ${isGraphicOnly}

CREATIVE DIRECTIVES:
1. Typography: Choose ANY Google Font that reflects this exact brand's essence (e.g. brutalist sans, athletic condensed, literary serif, neo-grotesque, or technical mono). Specify exact weights, optical tracking, line-height, and casing.
2. Layout & Panels:
   - If 0 images or Graphic Only: Design a pure graphical composition (e.g. brutalist concrete poster with bleeding black accents, data proof card, or ambient CSS mesh gradient).
   - If 1 image: Analyze visual focus, anchor an ultra-punchy hook in the negative space. Do not clutter.
   - If 3-4 images or multi-step content: Arrange a multi-panel layout (e.g. 58/42 hero-to-steps collage or horizontal cinematic slices).
3. Semantic Emphasis: Identify the emotional punchline word(s) in the headline and mark them with isAccent: true (or italicized).
4. Return strictly valid JSON adhering to the ArgonSceneGraph schema. No markdown wrappers, no conversational text.`;

  const response = await generateContentProxy("gemini-4-argon", prompt);
  return JSON.parse(response.text.trim());
}
```

---

## 7. Summary of Changes Required Across Production Files

| Production File | What Must Be Removed | What Must Be Implemented |
| :--- | :--- | :--- |
| **`aiService.ts` (line 827)** | Hardcoded `aspectRatio: '1:1'` | Change to `aspectRatio: '4:5'` ($1080 \times 1350$). |
| **`dynamicLayoutResolver.ts`** | Purple fallback `#7C3AED` (line 505) & Garamond fallback (line 691) | Pass through dynamic Argon palette and typography tokens. |
| **`geminiService.ts` (line 453)** | Rigid `{ eyebrow, headline, subtext }` prompt | Implement `planAutonomousArtDirection` returning `ArgonSceneGraph`. |
| **`PostCreation.tsx` (lines 900-969)** | Hardcoded single `<img>` & `eyebrow + headline + subtext` stack | Replace with `<UniversalCanvasRenderer scene={generatedScene} />`. |
| **`visualRenderService.ts`** | Hardcoded square `1080x1080` canvas | Update container to 4:5 vertical `1080x1350` supporting dynamic panels. |

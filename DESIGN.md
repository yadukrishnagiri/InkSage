# InkSage visual system

The visual direction is a bright, playful campus study space. The landing page persuades with an animated demonstration of the real workflow; the workspace uses the same colors with calmer, scan-friendly panels.

## Tokens

- Display: locally bundled Bricolage Grotesque Variable; body: locally bundled DM Sans Variable.
- Ink: `#211b38`; canvas: `#faf9f5`; violet: `#7150d8`; violet depth: `#4d319e`; gold: `#f6c570`; coral: `#f47e76`; mint: `#51b784`.
- Subject accents rotate through coral, violet, lime, sky and yellow. Color accompanies a subject name and file count; it never carries meaning alone.
- Buttons and cards use rounded corners, soft depth, and short translations. Decorative motion is disabled by `prefers-reduced-motion`.

## Components and behavior

- Landing hero dramatizes folder → PDFs → cited answer with HTML and geometric SVG linework. Demonstration content is illustrative.
- The sidebar keeps subjects visible on desktop and becomes a closable drawer on mobile. The study area separates sources from chat.
- Native `<dialog>` handles focus containment for creation and deletion. Errors appear next to the form or operation that caused them.
- Files, answers, citations, empty states, upload states, and disabled actions use clear text as well as icons and color.

# Visual System Contract

## Rule

The public knowledge UI must look like part of the main Alex Yarosh WordPress site, not like a separate dark AI dashboard.

## Main-Site Tokens

- Font: `Source Sans 3`
- Base2026 product/search UI font: `Geist` with `Geist Mono` for counts and compact analytics
- Page background: warm off-white `#f7f4ee`
- Paper/card background: `#fffaf0` or soft white
- Main text: `#111820`
- Secondary text: `#5f6a72`
- Orange CTA: `#c84f07`
- Orange hover/accent: `#ef6b13`
- Dark primary button: `#10231f`
- Standard radius: `8px`
- Large panel radius: `14px`
- Header: white or near-white sticky bar
- Shadows: soft warm shadows, not dark dashboard glows

## WordPress Root Site Contract

- Treat WordPress pages as one design system, not separate one-off layouts.
- Panels use one internal grid and one internal left alignment.
- Normal marketing lists use dot markers only; do not add horizontal dividers between normal sentence bullets.
- Eyebrows, headings, body/list copy, and CTAs must use consistent sizing across comparable sections.
- Footer CTA buttons must be equal-size on desktop and equal-width stacked on mobile.
- A WordPress UI task is not complete until the live site has been checked on desktop and mobile, cache is cleared if needed, and SEO title/description still render.

## Required UI Feel

- calm consulting/product interface;
- strong but not decorative search surface;
- clear source-card hierarchy;
- visible attribution and original-source links;
- filters that look like real form controls;
- compact but readable passages;
- source record dialog with full text readability.
- Base2026 should feel like a compact search/research product: permanent product nav in the header, no duplicate workspace nav strip, no permanent third column, and analytics counters that clarify the database instead of becoming extra buttons.

## Forbidden UI Drift

- dark cyber/AI dashboard shell;
- purple/pink gradient brand;
- giant unrelated hero ornamentation;
- default unstyled browser controls;
- hidden or ambiguous source attribution;
- result cards that look like raw database dumps;
- black unchecked checkboxes;
- separate brand name such as `AI-Visibility` unless explicitly approved.

## Reference Evidence

Main site observed through browser automation:

- body font: `Source Sans 3`
- body background: `rgb(247, 244, 238)`
- H1 example: `Yes. We’ll Actually Help.`
- H1 size: about `62px`
- CTA `Check My AI Visibility`: orange `rgb(200, 79, 7)`, `8px` radius
- secondary buttons: warm paper background, dark text, `8px` radius

Knowledge UI light preview:

- screenshot: `output/evidence/knowledge-ay-light-preview.png`
- this preview is directionally approved for source implementation, but it is not a deployment proof.

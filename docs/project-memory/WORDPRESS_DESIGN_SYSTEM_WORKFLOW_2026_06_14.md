# WordPress Design System Workflow

Last updated: 2026-06-14

## Working Rule

For WordPress public-site work, `done` means:

1. inspect the live/page structure first;
2. identify the component/system mismatch;
3. make the smallest durable theme/content change that fixes the system, not a one-off visual patch;
4. clear WordPress/page cache when needed;
5. verify live desktop and mobile;
6. verify SEO title/description still render;
7. update project memory before reporting done.

Do not report a WordPress visual task as done while it is only planned, only edited locally, or not verified on live.

## Current Design Contract

The WordPress root site should look like a calm, professional AI Search Visibility consulting site, not a collection of unrelated hand-built sections.

Use one shared component vocabulary:

- `section`: full-width page band with consistent vertical spacing.
- `panel`: one bordered warm paper container with consistent internal padding.
- `section intro`: eyebrow, heading, optional CTA, always aligned on the same left grid inside panels.
- `list`: dot-list with no horizontal dividers unless the component is explicitly a table, accordion, or roadmap timeline.
- `button`: one primary orange CTA, one secondary warm-paper CTA, one Base2026 acid-green CTA.
- `footer CTA row`: equal-sized buttons on desktop, equal-width stacked buttons on mobile.

## Homepage Rules

The homepage roadmap sections use one system:

- `Why free`, `After the call`, `Fit`, and `Quick request` start at the same internal x-position inside their panels.
- Body/list copy uses one type scale per viewport.
- Dot lists use dots only; no `border-bottom` dividers between normal sentence bullets.
- Buttons share one size rhythm.
- Hero remains its own hero component; its contract note is italic white text, not a framed plaque.

## QA Requirements

For each WordPress homepage/system pass:

- check `/`, `/services/`, `/pricing/`, `/about/`, and `/ai-visibility-audit/`;
- check desktop and mobile;
- assert no horizontal overflow;
- assert Rank Math/meta title and description are present;
- confirm cache-busted `style.css?ver=...` is live;
- save screenshots under `output/evidence/` when visual layout changed.

## Current Live Checkpoint

Live checkpoint: `alex-yarosh` child theme `style.css?ver=1.5.43`.

Verified on 2026-06-14:

- homepage roadmap section labels align at `x=293` on desktop and `x=29` on mobile;
- normal roadmap list item dividers are `0px`;
- normal roadmap list text is `16px` desktop and `14px` mobile;
- footer CTA widths are equal;
- checked WordPress pages returned 200 with no horizontal overflow and SEO title/description present.

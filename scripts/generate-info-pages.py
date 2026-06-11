from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path


PAGE_MAP = {
    "00_METHODOLOGY.md": {
        "slug": "methodology.html",
        "eyebrow": "Methodology",
        "title": "Base2026 Methodology",
        "lead": "How Base2026 turns public short-form expert videos into attributed, searchable source records without replacing creator channels.",
        "body_class": "doc-page",
    },
    "01_ROADMAP.md": {
        "slug": "roadmap.html",
        "eyebrow": "Project roadmap",
        "title": "Base2026 Roadmap",
        "lead": "A public roadmap for turning short-form expert video into an attributed, searchable research layer.",
        "body_class": "roadmap-page",
    },
    "02_PROJECT_STORY.md": {
        "slug": "story.html",
        "eyebrow": "Project story",
        "title": "Base2026 Project Story",
        "lead": "How a private SEO/SMM notebook became a public source intelligence experiment.",
        "body_class": "doc-page",
    },
    "03_PRIVACY_POLICY.md": {
        "slug": "privacy.html",
        "eyebrow": "Privacy",
        "title": "Privacy Policy",
        "lead": "Plain-language privacy notes for the early public Base2026 project.",
        "body_class": "doc-page",
    },
    "04_SOURCE_AND_CONTENT_POLICY.md": {
        "slug": "source-policy.html",
        "eyebrow": "Source policy",
        "title": "Source & Content Policy",
        "lead": "How Base2026 handles public sources, attribution, correction, opt-out and content boundaries.",
        "body_class": "doc-page",
    },
    "05_SUPPORT_PAGE.md": {
        "slug": "support.html",
        "eyebrow": "Support",
        "title": "Support Base2026",
        "lead": "Help build a searchable knowledge base for short-form expert video.",
        "body_class": "support-page",
    },
    "06_SITE_STRUCTURE.md": {
        "slug": "site-structure.html",
        "eyebrow": "Site structure",
        "title": "Recommended Site Structure",
        "lead": "A working map for the public Base2026 website and future agent handoffs.",
        "body_class": "doc-page",
    },
    "07_CREATOR_CORRECTION_REMOVAL.md": {
        "slug": "opt-out.html",
        "eyebrow": "Creator correction / removal",
        "title": "Creator Correction / Removal",
        "lead": "How creators can request attribution fixes, excerpt corrections, record removal, or future source suppression.",
        "body_class": "doc-page",
    },
}


CONTACT_EMAIL = "offflinerpsy@gmail.com"
STYLE_VERSION = "20260610-ay37"

PROJECT_NAV_LINKS = [
    ("search", "Search", "index.html"),
    ("topics", "Topics", "topics/"),
    ("creators", "Creators", "creators/"),
    ("sources", "Sources", "sources/"),
    ("roadmap", "Roadmap", "roadmap.html"),
    ("methodology", "Methodology", "methodology.html"),
    ("support", "Support", "support.html"),
]


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(line.rstrip() for line in text.splitlines()) + "\n"
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)

FOOTER_LINKS = [
    ("Roadmap", "./roadmap.html"),
    ("Methodology", "./methodology.html"),
    ("Source policy", "./source-policy.html"),
    ("Privacy", "./privacy.html"),
    ("Support", "./support.html"),
    ("Creator Correction / Removal", "./opt-out.html"),
]


def normalize_copy(value: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2026": "...",
        "\u00a0": " ",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value


def root_href(relative_root: str, target: str) -> str:
    root = relative_root.rstrip("/")
    return f"{root}/{target.lstrip('/')}"


def nav_key_for_slug(slug_value: str) -> str:
    if slug_value == "roadmap.html":
        return "roadmap"
    if slug_value == "methodology.html":
        return "methodology"
    if slug_value == "support.html":
        return "support"
    return ""


def base2026_dropdown(relative_root: str = ".", current: str = "") -> str:
    links = []
    for key, label, target in PROJECT_NAV_LINKS:
        active = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{html.escape(root_href(relative_root, target))}"{active}>{html.escape(label)}</a>')
    return f"""
          <div class="site-header__base">
            <a class="site-header__link site-header__link--base2026" href="{html.escape(root_href(relative_root, 'index.html'))}" aria-haspopup="true">Base2026</a>
            <div class="site-header__base-menu" aria-label="Base2026 navigation">
              <span>Base2026 Library</span>
              {''.join(links)}
            </div>
          </div>
"""


def base2026_breadcrumbs(title: str) -> str:
    current = (title.split("|", 1)[0] or "Current page").strip()
    return f"""
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="./index.html">Base2026</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{html.escape(current)}</span>
      </nav>
"""


def inline_md(value: str) -> str:
    text = html.escape(normalize_copy(value.strip()))
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"__(.+?)__", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"_(.+?)_", r"<em>\1</em>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    return text


def flush_paragraph(out: list[str], paragraph: list[str]) -> None:
    if paragraph:
        out.append(f"<p>{inline_md(' '.join(paragraph))}</p>")
        paragraph.clear()


def flush_list(out: list[str], items: list[str]) -> None:
    if items:
        out.append("<ul>" + "".join(f"<li>{inline_md(item)}</li>" for item in items) + "</ul>")
        items.clear()


def render_table(lines: list[str]) -> str:
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            continue
        rows.append(cells)
    if not rows:
        return ""
    head, body = rows[0], rows[1:]
    head_html = "".join(f"<th>{inline_md(cell)}</th>" for cell in head)
    body_html = "".join(
        "<tr>" + "".join(f"<td>{inline_md(cell)}</td>" for cell in row) + "</tr>"
        for row in body
    )
    return f"<div class=\"table-wrap\"><table><thead><tr>{head_html}</tr></thead><tbody>{body_html}</tbody></table></div>"


def render_markdown(markdown: str, page_class: str) -> tuple[str, str]:
    lines = markdown.replace("\r\n", "\n").split("\n")
    h1 = ""
    sections: list[tuple[str, list[str]]] = []
    current_title = ""
    current_lines: list[str] = []

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("# "):
            if not h1:
                h1 = line[2:].strip()
                continue
            if current_title or current_lines:
                sections.append((current_title, current_lines))
            current_title = line[2:].strip()
            current_lines = []
            continue
        if line.startswith("## "):
            if current_title or current_lines:
                sections.append((current_title, current_lines))
            current_title = line[3:].strip()
            current_lines = []
            continue
        current_lines.append(line)
    if current_title or current_lines:
        sections.append((current_title, current_lines))

    rendered_sections = []
    for title, section_lines in sections:
        if not title and not any(line.strip() for line in section_lines):
            continue

        body: list[str] = []
        paragraph: list[str] = []
        list_items: list[str] = []
        table_lines: list[str] = []

        def flush_table() -> None:
            nonlocal table_lines
            if table_lines:
                flush_paragraph(body, paragraph)
                flush_list(body, list_items)
                body.append(render_table(table_lines))
                table_lines = []

        for line in section_lines:
            if re.fullmatch(r"\s*-{3,}\s*", line):
                flush_paragraph(body, paragraph)
                flush_list(body, list_items)
                continue
            if line.startswith("|") and line.endswith("|"):
                table_lines.append(line)
                continue
            flush_table()
            if not line.strip():
                flush_paragraph(body, paragraph)
                flush_list(body, list_items)
                continue
            if line.startswith("### "):
                flush_paragraph(body, paragraph)
                flush_list(body, list_items)
                body.append(f"<h3>{inline_md(line[4:])}</h3>")
                continue
            if re.match(r"^\s*(?:[-*]|\d+\.)\s+", line):
                flush_paragraph(body, paragraph)
                list_items.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", line))
                continue
            paragraph.append(line)
        flush_table()
        flush_paragraph(body, paragraph)
        flush_list(body, list_items)

        section_class = "content-section"
        if page_class == "roadmap-page" and title.lower().startswith("phase"):
            section_class += " roadmap-phase"
        section_heading = f"<h2>{inline_md(title)}</h2>" if title else ""
        rendered_sections.append(f"<section class=\"{section_class}\">{section_heading}{''.join(body)}</section>")
    return h1, "\n".join(rendered_sections)


def cookie_consent_markup() -> str:
    return f"""
    <section class="cookie-banner" data-cookie-banner hidden aria-label="Cookie preferences">
      <div>
        <h2>Cookie preferences</h2>
        <p>We use necessary cookies to run the site and optional cookies to understand what pages are useful. You can accept all, reject non-essential cookies, or manage preferences.</p>
      </div>
      <div class="cookie-actions">
        <button type="button" class="ay-button" data-cookie-accept>Accept All</button>
        <button type="button" class="ay-button-secondary" data-cookie-reject>Reject Non-Essential</button>
        <button type="button" class="ay-button-secondary" data-cookie-manage>Manage Preferences</button>
      </div>
    </section>
    <dialog class="cookie-dialog" data-cookie-dialog aria-label="Manage cookie preferences">
      <form method="dialog">
        <div class="cookie-dialog-head">
          <p class="eyebrow">Privacy controls</p>
          <h2>Manage cookie preferences</h2>
          <p>Necessary cookies are always active because they keep the site working. Analytics and marketing cookies are optional and will only run if you allow them.</p>
        </div>
        <div class="cookie-options">
          <label><input type="checkbox" checked disabled> Necessary <span>Always on. Required for site operation, security, forms, and preference storage.</span></label>
          <label><input type="checkbox" data-cookie-analytics> Analytics <span>Optional. Not currently active. Reserved for privacy-friendly page usefulness analytics.</span></label>
          <label><input type="checkbox" data-cookie-marketing> Marketing <span>Optional. Not currently active. Reserved for future pixels only if explicitly enabled.</span></label>
        </div>
        <div class="cookie-actions">
          <button type="button" class="ay-button" data-cookie-save>Save Preferences</button>
          <button type="button" class="ay-button-secondary" data-cookie-close>Close</button>
        </div>
      </form>
    </dialog>
    <script src="./static/cookie-consent.js?v={STYLE_VERSION}" defer></script>
"""


def page_shell(meta: dict[str, str], h1: str, body: str) -> str:
    title = normalize_copy(meta["title"])
    eyebrow = normalize_copy(meta["eyebrow"])
    lead = normalize_copy(meta["lead"])
    page_class = meta["body_class"]
    current_nav = nav_key_for_slug(meta["slug"])
    canonical = f"https://aggressorbulkit.online/knowledge/{meta['slug']}"
    robots = "index,follow"
    schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": f"{title} | Base2026",
        "description": lead,
        "url": canonical,
        "isPartOf": {
            "@type": "WebSite",
            "name": "Base2026",
            "url": "https://aggressorbulkit.online/knowledge/",
        },
    }
    footer_links = "\n".join(f'<a href="{href}">{label}</a>' for label, href in FOOTER_LINKS)
    roadmap_experience = ""
    support_experience = ""
    script_tag = ""
    body_markup = body
    if page_class == "roadmap-page":
        roadmap_experience = """
      <section class="roadmap-experience" aria-labelledby="roadmap-experience-title">
        <div class="roadmap-experience__intro">
          <p class="eyebrow">Product roadmap</p>
          <h2 id="roadmap-experience-title">A compact build sequence for the public knowledge layer.</h2>
          <p>Trust, ingestion, knowledge, rights, signals, and revenue stay in one inspectable operating map.</p>
        </div>
        <section class="summary-strip" aria-label="Roadmap summary">
          <article>
            <span>Now</span>
            <strong>Public Trust Foundation</strong>
          </article>
          <article>
            <span>Next</span>
            <strong>Content Ingestion Pipeline</strong>
          </article>
          <article>
            <span>Later</span>
            <strong>AI Knowledge Layer, Creator Controls, Analytics, Monetization</strong>
          </article>
        </section>
        <section class="control-strip" aria-label="Roadmap controls">
          <div id="phase-tabs" class="phase-tabs"></div>
          <div class="view-note">Click a phase to inspect purpose, status, and milestone sequence.</div>
        </section>
        <section class="viz-grid" aria-label="Roadmap visualization">
          <article class="roadmap-panel roadmap-panel-wide" aria-labelledby="map-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Sequence</p>
              <h2 id="map-title">Phase sequence</h2>
            </div>
            <div id="roadmap-flow" class="flow-canvas"></div>
          </article>
          <article class="roadmap-panel" aria-labelledby="phase-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Selected phase</p>
              <h2 id="phase-title">Phase detail</h2>
            </div>
            <div id="phase-detail"></div>
          </article>
          <article class="roadmap-panel" aria-labelledby="load-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Milestones</p>
              <h2 id="load-title">Phase density</h2>
            </div>
            <div id="workload-chart" class="bar-stack"></div>
          </article>
          <article class="roadmap-panel roadmap-panel-wide" aria-labelledby="funding-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Funding logic</p>
              <h2 id="funding-title">What support unlocks</h2>
            </div>
            <div id="funding-grid" class="funding-grid"></div>
          </article>
          <article class="roadmap-panel roadmap-panel-wide" aria-labelledby="priority-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Execution order</p>
              <h2 id="priority-title">Now / Next / Later</h2>
            </div>
            <div id="priority-stack" class="priority-stack"></div>
          </article>
          <article class="roadmap-panel roadmap-panel-wide proof-panel" aria-labelledby="proof-title">
            <div class="roadmap-panel-head">
              <p class="eyebrow">Roadmap logic</p>
              <h2 id="proof-title">What this roadmap proves</h2>
            </div>
            <div class="proof-grid">
              <article class="proof-card">
                <h3>Trust before scale</h3>
                <p>Policies, attribution, correction paths, and public status come before expanding the database.</p>
              </article>
              <article class="proof-card">
                <h3>Pipeline before AI</h3>
                <p>Ingestion, transcription, metadata, and review must be stable before answer generation becomes public.</p>
              </article>
              <article class="proof-card">
                <h3>Governance before revenue</h3>
                <p>Creator controls and source transparency stay visible before analytics, sponsors, or paid access are added.</p>
              </article>
            </div>
          </article>
        </section>
      </section>
"""
        body_markup = f'<section class="roadmap-fallback" aria-label="Roadmap fallback details">{body}</section>'
        script_tag = f'\n    <script src="./static/roadmap.js?v={STYLE_VERSION}" defer></script>'
    if page_class == "support-page":
        support_experience = """
      <section class="support-experience" aria-labelledby="support-experience-title">
        <div class="support-experience__intro">
          <p class="eyebrow">Support logic</p>
          <h2 id="support-experience-title">What support actually funds.</h2>
          <p>Base2026 support is tied to a public operating model: source intake, review, readable records, creator controls, and transparent product maintenance.</p>
        </div>
        <div class="support-lanes" aria-label="Support priorities">
          <article>
            <span>01</span>
            <h3>Keep the public layer trustworthy</h3>
            <p>Policies, attribution, correction paths, and stable source pages stay live before scale.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Build repeatable ingestion</h3>
            <p>New videos need structured metadata, transcription, review, and safe public excerpts.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Make the knowledge useful</h3>
            <p>Cards, topics, comparisons, and search pages should turn noisy short-form content into usable evidence.</p>
          </article>
        </div>
        <div class="support-flow" aria-label="Base2026 support flow">
          <span>Public source</span>
          <span>Review</span>
          <span>Evidence card</span>
          <span>Searchable page</span>
          <span>Correction path</span>
        </div>
      </section>
"""
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{html.escape(lead)}" />
    <meta name="robots" content="{html.escape(robots)}" />
    <link rel="canonical" href="{html.escape(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{html.escape(title)} | Base2026" />
    <meta property="og:description" content="{html.escape(lead)}" />
    <meta property="og:url" content="{html.escape(canonical)}" />
    <title>{html.escape(title)} | Base2026</title>
    <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./static/styles.css?v={STYLE_VERSION}" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <div class="site-header__bar">
        <a class="site-header__brand" href="/">Alex Yarosh</a>
        <nav class="site-header__nav" aria-label="Main navigation">
          <a class="site-header__link" href="/services/">Services</a>
          <a class="site-header__link" href="/pricing/">Pricing</a>
          {base2026_dropdown(".", current_nav)}
          <a class="site-header__link" href="/about/">About</a>
        </nav>
        <a class="site-header__cta" href="/ai-visibility-audit/">Get My Free Roadmap</a>
      </div>
    </header>
    <main id="content" class="app-shell content-page {page_class}">
      {base2026_breadcrumbs(title)}
      <section class="page-hero">
        <p class="eyebrow">{html.escape(eyebrow)}</p>
        <h1>{html.escape(normalize_copy(h1 or title))}</h1>
        <p class="lead">{html.escape(lead)}</p>
        <div class="hero-actions">
          <a class="ay-button{' is-current' if current_nav == 'search' else ''}" href="./"{' aria-current="page"' if current_nav == 'search' else ''}>Search the library</a>
          <a class="ay-button-secondary{' is-current' if current_nav == 'roadmap' else ''}" href="./roadmap.html"{' aria-current="page"' if current_nav == 'roadmap' else ''}>Roadmap</a>
          <a class="ay-button-secondary{' is-current' if current_nav == 'support' else ''}" href="./support.html"{' aria-current="page"' if current_nav == 'support' else ''}>Support</a>
        </div>
      </section>
      {roadmap_experience}
      {support_experience}
      {body_markup}
    </main>
    <footer class="site-footer">
      <div class="ay-wrap ay-footer-grid">
        <section>
          <p class="eyebrow">AI Search Visibility</p>
          <h2>Search visibility for local service businesses</h2>
          <p>We help local service businesses improve visibility across Google, ChatGPT, Gemini, Perplexity and AI-powered search through SEO, GEO, AEO, content, schema and trust signals.</p>
          <div class="ay-actions">
            <a class="ay-button" href="/ai-visibility-audit/">Get My Free Roadmap</a>
            <a class="ay-button-secondary" href="/pricing/">View Pricing</a>
          </div>
        </section>
        <nav aria-label="Footer services">
          <h3>Services</h3>
          <ul class="ay-footer-menu">
            <li><a href="/services/#ai-visibility-audit">AI Visibility Audit</a></li>
            <li><a href="/services/#technical-foundation">SEO/GEO Technical Foundation</a></li>
            <li><a href="/services/#answer-ready-content">Answer-Ready Content</a></li>
            <li><a href="/services/#local-seo">Local SEO &amp; Citations</a></li>
            <li><a href="/services/#entity-schema">Entity &amp; Schema Optimization</a></li>
            <li><a href="/services/#monitoring">AI Visibility Monitoring</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer start here">
          <h3>Start Here</h3>
          <ul class="ay-footer-menu">
            <li><a href="/services/">Services</a></li>
            <li><a href="/pricing/">Pricing</a></li>
            <li><a href="/#how-it-works">Process / How It Works</a></li>
            <li><a href="/contact/">Contact</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer Base2026">
          <h3>Base2026 Pilot Project</h3>
          <p>Independent pilot project: a searchable knowledge base for short-form expert video.</p>
          <ul class="ay-footer-menu">
            <li><a href="./">Search Base2026</a></li>
            <li><a href="./roadmap.html">Roadmap</a></li>
            <li><a href="./topics/">Topics</a></li>
            <li><a href="./creators/">Creators</a></li>
            <li><a href="./story.html">Project Story</a></li>
            <li><a href="./methodology.html">Methodology</a></li>
            <li><a href="./support.html">Support</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer legal and trust">
          <h3>Legal &amp; Trust</h3>
          <ul class="ay-footer-menu">
            <li><a href="/privacy-policy/">Privacy Policy</a></li>
            <li><button type="button" class="footer-link-button" data-cookie-preferences>Cookie Preferences</button></li>
            <li><a href="./source-policy.html">Source &amp; Content Policy</a></li>
            <li><a href="./opt-out.html">Creator Correction / Removal</a></li>
            <li><a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></li>
          </ul>
        </nav>
      </div>
      <div class="ay-footer-bottom">
        <span>&copy; 2026 Alex Yarosh. Available remotely for US-based local businesses.</span>
      </div>
    </footer>
    {cookie_consent_markup()}
    {script_tag}
  </body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Base2026 informational pages from public markdown.")
    parser.add_argument("--source", type=Path, default=Path("docs/public-pages"))
    parser.add_argument("--out", type=Path, default=Path("web/static"))
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    written = []
    for file_name, meta in PAGE_MAP.items():
        source = args.source / file_name
        if not source.exists():
            raise FileNotFoundError(source)
        h1, body = render_markdown(source.read_text(encoding="utf-8"), meta["body_class"])
        target = args.out / meta["slug"]
        write_text(target, page_shell(meta, h1, body))
        written.append(str(target))
    print(f"info_pages={len(written)}")
    for path in written:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

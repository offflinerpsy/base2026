from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from html import escape
from pathlib import Path


STYLE_VERSION = "20260611-roadmapstatus1"
CONTACT_EMAIL = "offflinerpsy@gmail.com"
PROJECT_NAV_LINKS = [
    ("search", "Search", "index.html"),
    ("topics", "Topics", "topics/"),
    ("creators", "Creators", "creators/"),
    ("sources", "Sources", "sources/"),
    ("roadmap", "Roadmap", "roadmap.html"),
    ("methodology", "Methodology", "methodology.html"),
    ("support", "Support", "support.html"),
]
FOOTER_LINKS = [
    ("Roadmap", "../roadmap.html"),
    ("Methodology", "../methodology.html"),
    ("Source policy", "../source-policy.html"),
    ("Privacy", "../privacy.html"),
    ("Support", "../support.html"),
    ("Creator Correction / Removal", "../opt-out.html"),
]


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(line.rstrip() for line in text.splitlines()) + "\n"
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)


def slug(value: str, fallback: str = "record") -> str:
    out = "-".join(re.findall(r"[a-z0-9]+", (value or "").lower()))
    return out[:120] or fallback


def compact(value: str, limit: int = 520) -> str:
    text = re.sub(r"\s+", " ", value or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def clean_handle(value: str | None, fallback: str = "creator") -> str:
    handle = re.sub(r"\s+", "", str(value or "").strip()).lstrip("@")
    return handle or fallback


def display_handle(value: str | None, fallback: str = "creator") -> str:
    return f"@{clean_handle(value, fallback)}"


def paragraphize(value: str, limit: int = 900, sentences_per_paragraph: int = 2) -> str:
    text = compact(value, limit)
    if not text:
        return '<p class="empty-state">No public excerpt is available for this source yet.</p>'
    if len(text) > 80 and not re.search(r'[.!?…]"?$', text):
        text = text.rstrip(" ,;:") + "..."
    sentences = re.split(r"(?<=[.!?])\s+", text)
    paragraphs: list[str] = []
    for index in range(0, len(sentences), sentences_per_paragraph):
        chunk = " ".join(part for part in sentences[index : index + sentences_per_paragraph] if part).strip()
        if chunk:
            paragraphs.append(f"<p>{escape(chunk)}</p>")
    return "".join(paragraphs) or f"<p>{escape(text)}</p>"


def icon_svg(name: str) -> str:
    icons = {
        "sparkle": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8l1.2 4.1a4.7 4.7 0 0 0 3.2 3.2l4.1 1.2-4.1 1.2a4.7 4.7 0 0 0-3.2 3.2L12 19.8l-1.2-4.1a4.7 4.7 0 0 0-3.2-3.2l-4.1-1.2 4.1-1.2a4.7 4.7 0 0 0 3.2-3.2L12 2.8z"/><path d="M18.5 15.8l.5 1.7a2 2 0 0 0 1.3 1.3l1.7.5-1.7.5a2 2 0 0 0-1.3 1.3l-.5 1.7-.5-1.7a2 2 0 0 0-1.3-1.3l-1.7-.5 1.7-.5a2 2 0 0 0 1.3-1.3l.5-1.7z"/></svg>',
        "share": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 15.6a3.3 3.3 0 0 0-2.6 1.3l-6.1-3.5c.1-.4.1-.8 0-1.2l6-3.4A3.4 3.4 0 1 0 14.4 7l-6 3.4a3.4 3.4 0 1 0 0 4.8l6.1 3.5a3.4 3.4 0 1 0 3.5-3.1z"/></svg>',
        "link": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.2 14.8a1 1 0 0 1 0-1.4l4.2-4.2a1 1 0 0 1 1.4 1.4l-4.2 4.2a1 1 0 0 1-1.4 0z"/><path d="M8.4 18.4a4.2 4.2 0 0 1-3-7.2l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1a2.2 2.2 0 1 0 3.1 3.1l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1a4.2 4.2 0 0 1-2.9 1.3z"/><path d="M15.8 13.2a1 1 0 0 1-.7-1.7l2.1-2.1a2.2 2.2 0 0 0-3.1-3.1L12 8.4A1 1 0 0 1 10.6 7l2.1-2.1a4.2 4.2 0 0 1 5.9 5.9l-2.1 2.1a1 1 0 0 1-.7.3z"/></svg>',
        "copy": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V7zm3-1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-6z"/><path d="M4 11a3 3 0 0 1 3-3 1 1 0 1 1 0 2 1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1 1 1 0 1 1 2 0 3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6z"/></svg>',
        "print": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h10a2 2 0 0 1 2 2v3h1a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1H3a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h1V5a2 2 0 0 1 2-2zm0 5h10V5H7v3zm0 8v3h10v-3H7zm12 0h2v-5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5h2v-1a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1z"/></svg>',
        "calendar": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm13 8H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8zM5 6a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1H5z"/></svg>',
        "card": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5zm3-1a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7zm2 4h6a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2zm0 4h6a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2zm0 4h3a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2z"/></svg>',
        "topic": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5a3 3 0 0 1 3-3h3.6a3 3 0 0 1 2.1.9l8.4 8.4a3 3 0 0 1 0 4.2l-5.6 5.6a3 3 0 0 1-4.2 0l-8.4-8.4A3 3 0 0 1 2 10.6V7a3 3 0 0 1 2-2zm3-.9A1 1 0 0 0 6 5v5.6a1 1 0 0 0 .3.7l8.4 8.4a1 1 0 0 0 1.4 0l5.6-5.6a1 1 0 0 0 0-1.4L13.3 4.3a1 1 0 0 0-.7-.3H7z"/><path d="M8.5 8.8a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>',
    }
    return icons.get(name, "")


def tiktok_logo_svg() -> str:
    return (
        '<svg class="platform-logo platform-logo--tiktok" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
        '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>'
        "</svg>"
    )


def platform_icon_only(platform: str | None = "tiktok") -> str:
    if "tiktok" in str(platform or "").lower():
        return f'<span class="platform-icon-only" title="TikTok source" aria-label="TikTok source">{tiktok_logo_svg()}</span>'
    return f'<span class="platform-text">{escape(platform or "source")}</span>'


def share_action_buttons(kind: str = "source") -> str:
    actions = [
        ("share", "share", "Share", f"Share {kind}"),
        ("copy-link", "link", "Copy link", f"Copy {kind} link"),
        ("copy-citation", "copy", "Copy citation", "Copy citation"),
        ("print", "print", "Save PDF", "Save as PDF"),
    ]
    return "".join(
        f'<button type="button" class="source-share-action" data-share-action="{escape(action)}" '
        f'aria-label="{escape(aria)}" title="{escape(title)}">{icon_svg(icon)}</button>'
        for action, icon, title, aria in actions
    )


def share_action_bar(label: str = "Share this page", kind: str = "page") -> str:
    return (
        f'<section class="share-actions share-actions--compact" data-share-root aria-label="{escape(label)}">'
        f'<span class="source-share-actions__label">{escape(label)}</span>'
        f'{share_action_buttons(kind)}'
        '<span class="share-actions__status source-share-actions__status" data-share-status aria-live="polite"></span>'
        '</section>'
    )


def source_share_action_bar(label: str = "Share source record", kind: str = "source record") -> str:
    return (
        f'<div class="source-share-actions" data-share-root aria-label="{escape(label)}">'
        f'<span class="source-share-actions__label">{escape(label)}</span>'
        f'{share_action_buttons(kind)}'
        '<span class="share-actions__status source-share-actions__status" data-share-status aria-live="polite"></span>'
        '</div>'
    )


def inline_share_actions(label: str, kind: str = "page") -> str:
    return (
        f'<div class="source-share-actions source-share-actions--inline" data-share-root aria-label="{escape(label)}">'
        f'{share_action_buttons(kind)}'
        '<span class="share-actions__status source-share-actions__status" data-share-status aria-live="polite"></span>'
        '</div>'
    )


def info_hint(label: str, text: str) -> str:
    safe_label = escape(label)
    safe_text = escape(text)
    return (
        f'<span class="info-hint" tabindex="0" role="note" '
        f'aria-label="{safe_label}: {safe_text}" data-tooltip="{safe_text}">i</span>'
    )


def section_title(label: str, tooltip: str) -> str:
    return f'<div class="section-title-row"><h2>{escape(label)}</h2>{info_hint(label, tooltip)}</div>'


def root_href(relative_root: str, target: str) -> str:
    root = relative_root.rstrip("/")
    return f"{root}/{target.lstrip('/')}"


def base2026_dropdown(relative_root: str, current: str = "") -> str:
    links = []
    for key, label, target in PROJECT_NAV_LINKS:
        active = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{escape(root_href(relative_root, target))}"{active}>{escape(label)}</a>')
    return f"""
          <div class="site-header__base">
            <a class="site-header__link site-header__link--base2026" href="{escape(root_href(relative_root, 'index.html'))}" aria-haspopup="true">Base2026</a>
            <div class="site-header__base-menu" aria-label="Base2026 navigation">
              <span>Base2026 Library</span>
              {''.join(links)}
            </div>
          </div>
"""


def base2026_breadcrumbs(relative_root: str, title: str) -> str:
    current = (title.split("|", 1)[0] or "Current page").strip()
    return f"""
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="{escape(root_href(relative_root, 'index.html'))}">Base2026</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{escape(current)}</span>
      </nav>
"""


def cookie_consent_markup(relative_root: str) -> str:
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
    <script src="{relative_root}/static/cookie-consent.js?v={STYLE_VERSION}" defer></script>
"""


def page_shell(
    title: str,
    body: str,
    relative_root: str = "..",
    robots: str = "index,follow",
    current: str = "",
    description: str = "",
    canonical_path: str = "",
) -> str:
    description = compact(description or title, 180)
    canonical = f"https://aggressorbulkit.online/knowledge/{canonical_path.lstrip('/')}" if canonical_path else ""
    schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": canonical or "https://aggressorbulkit.online/knowledge/",
        "isPartOf": {
            "@type": "WebSite",
            "name": "Base2026",
            "url": "https://aggressorbulkit.online/knowledge/",
        },
    }
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{escape(description)}" />
    <meta name="robots" content="{escape(robots)}" />
    {f'<link rel="canonical" href="{escape(canonical)}" />' if canonical else ''}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{escape(title)}" />
    <meta property="og:description" content="{escape(description)}" />
    {f'<meta property="og:url" content="{escape(canonical)}" />' if canonical else ''}
    <title>{escape(title)}</title>
    <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="{relative_root}/static/styles.css?v={STYLE_VERSION}" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <div class="site-header__bar">
        <a class="site-header__brand" href="/">Alex Yarosh</a>
        <nav class="site-header__nav" aria-label="Main navigation">
          <a class="site-header__link" href="/services/">Services</a>
          <a class="site-header__link" href="/pricing/">Pricing</a>
          {base2026_dropdown(relative_root, current)}
          <a class="site-header__link" href="/about/">About</a>
        </nav>
        <a class="site-header__cta" href="/ai-visibility-audit/">Check My AI Visibility</a>
      </div>
    </header>
    <main id="content" class="app-shell content-page">
      {base2026_breadcrumbs(relative_root, title)}
      {body}
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
            <li><a href="{relative_root}/index.html">Search Base2026</a></li>
            <li><a href="{relative_root}/roadmap.html">Roadmap</a></li>
            <li><a href="{relative_root}/topics/">Topics</a></li>
            <li><a href="{relative_root}/creators/">Creators</a></li>
            <li><a href="{relative_root}/story.html">Project Story</a></li>
            <li><a href="{relative_root}/methodology.html">Methodology</a></li>
            <li><a href="{relative_root}/support.html">Support</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer legal and trust">
          <h3>Legal &amp; Trust</h3>
          <ul class="ay-footer-menu">
            <li><a href="/privacy-policy/">Privacy Policy</a></li>
            <li><button type="button" class="footer-link-button" data-cookie-preferences>Cookie Preferences</button></li>
            <li><a href="{relative_root}/source-policy.html">Source &amp; Content Policy</a></li>
            <li><a href="{relative_root}/opt-out.html">Creator Correction / Removal</a></li>
            <li><a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></li>
          </ul>
        </nav>
      </div>
      <div class="ay-footer-bottom">
        <span>&copy; 2026 Alex Yarosh. Available remotely for US-based local businesses.</span>
      </div>
    </footer>
    <script src="{relative_root}/static/share-actions.js?v={STYLE_VERSION}" defer></script>
    {cookie_consent_markup(relative_root)}
  </body>
</html>
"""


def card(title: str, text: str, href: str | None = None, meta: str = "") -> str:
    link = f'<a class="button-link" href="{escape(href)}">Open</a>' if href else ""
    return f"""
      <article class="intelligence-card">
        <h3>{escape(title)}</h3>
        {f'<p class="meta">{escape(meta)}</p>' if meta else ''}
        <p>{escape(compact(text, 360))}</p>
        {link}
      </article>
    """


def is_truncated_metadata(value: str | None, status: str | None = "") -> bool:
    text = (value or "").strip()
    return bool(status == "truncated" or text.endswith("...") or text.endswith("…"))


def source_display_title(source: dict) -> str:
    handle = display_handle(source.get("creator_handle") or source.get("handle") or "Creator")
    title = source.get("title") or ""
    if title and not is_truncated_metadata(title, source.get("title_status")):
        return compact(title, 96)
    excerpt = compact(source.get("excerpt") or "", 96)
    if excerpt:
        return excerpt
    date = source.get("published_date") or source.get("published_at") or ""
    return f"{handle}{f' · {date}' if date else ''}"


def source_record_heading(source: dict) -> str:
    return display_handle(source.get("creator_handle") or source.get("handle") or "Creator")


def source_schema_name(source: dict) -> str:
    return f"{source_record_heading(source)} source record"


def source_display_lead(source: dict, limit: int = 260) -> str:
    title = source.get("title") or ""
    if title and not is_truncated_metadata(title, source.get("title_status")):
        return compact(title, limit)
    return compact(source.get("excerpt") or source.get("source_id") or "", limit)


def source_href(source: dict, prefix: str = "../sources") -> str:
    return f"{prefix}/{slug(source.get('item_id') or source.get('source_id'))}.html"


def source_has_public_evidence(source: dict, passages: list[dict] | None = None, insights: list[dict] | None = None) -> bool:
    if (source.get("excerpt") or "").strip():
        return True
    if passages:
        return True
    return any(row.get("public") for row in (insights or []))


def creator_href(handle: str, prefix: str = "../creators") -> str:
    return f"{prefix}/{slug(handle)}.html"


def topic_href(topic_id: str, prefix: str = "../topics") -> str:
    return f"{prefix}/{slug(topic_id, 'uncategorized')}.html"


def topic_chips(topic_rows: list[tuple[str, str, int]], prefix: str = "../topics") -> str:
    chips = []
    for topic_id, label, count in topic_rows:
        suffix = f" · {count}" if count else ""
        chips.append(
            f'<a class="topic-chip" href="{escape(topic_href(topic_id, prefix))}">{escape(label)}{escape(suffix)}</a>'
        )
    return "".join(chips)


def creator_avatar_markup(handle: str, avatar_url: str = "", relative_root: str = "..") -> str:
    label = clean_handle(handle)
    initial = (label[:1] or "B").upper()
    safe_avatar = avatar_url or ""
    if safe_avatar.startswith("/knowledge/static/"):
        safe_avatar = f"{relative_root.rstrip('/')}/static/{safe_avatar.split('/knowledge/static/', 1)[1]}"
    if safe_avatar:
        return (
            '<span class="avatar avatar--image creator-page-avatar">'
            f'<img src="{escape(safe_avatar)}" alt="@{escape(label)} TikTok profile avatar" loading="lazy" referrerpolicy="no-referrer" />'
            "</span>"
        )
    return f'<span class="avatar creator-page-avatar" aria-hidden="true">{escape(initial)}</span>'


def source_identity_markup(
    handle: str,
    avatar_html: str,
    date: str = "",
    platform: str = "tiktok",
    variant: str = "page",
) -> str:
    meta_items = []
    if date:
        meta_items.append(f'<span class="source-identity__date">{escape(date)}</span>')
    if platform:
        meta_items.append(platform_icon_only(platform))
    meta_html = "".join(meta_items)
    return (
        f'<div class="source-identity source-identity--{escape(variant)}">'
        f'{avatar_html}'
        '<div class="source-identity__body">'
        '<div class="source-identity__line">'
        f'<h1 class="source-identity__handle">{escape(handle)}</h1>'
        f'{meta_html}'
        '</div>'
        '</div>'
        '</div>'
    )


def is_indexable_topic(topic: dict) -> bool:
    return bool(topic.get("public")) and int(topic.get("public_insight_count") or 0) >= 2


def creator_page(handle: str, creator: dict, sources: list[dict], insights: list[dict]) -> str:
    visible_handle = display_handle(handle)
    safe_handle = escape(visible_handle)
    avatar_html = creator_avatar_markup(visible_handle, creator.get("avatar_url") or "")
    latest = [
        row
        for row in sorted(sources, key=lambda row: row.get("published_at") or "", reverse=True)
        if source_has_public_evidence(row)
    ][:12]
    public_insights = [row for row in insights if row.get("creator_handle") == handle and row.get("public")]
    topic_counts: dict[str, int] = defaultdict(int)
    topic_labels: dict[str, str] = {}
    for insight in public_insights:
        topic_id = insight.get("topic_id") or slug(insight.get("topic") or "uncategorized")
        topic_labels[topic_id] = insight.get("topic") or topic_id.replace("-", " ").title()
        topic_counts[topic_id] += 1
    topics = sorted(topic_counts.items(), key=lambda item: (-item[1], item[0]))[:12]
    topic_html = topic_chips([(topic_id, topic_labels.get(topic_id, topic_id), count) for topic_id, count in topics])
    latest_html = "".join(
        card(
            source_display_title(source),
            source.get("excerpt") or "",
            source_href(source),
            source.get("published_date") or source.get("published_at") or "",
        )
        for source in latest
    )
    schema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "name": f"{visible_handle} source profile",
        "about": {
            "@type": "Person",
            "name": visible_handle,
            "sameAs": creator.get("url") or "",
        },
    }
    return page_shell(
        f"{handle} source profile | Base2026",
        f"""
      <section class="page-hero source-page-hero creator-page-hero">
        <div class="source-hero-main">
          <p class="eyebrow">Creator profile</p>
          {source_identity_markup(safe_handle, avatar_html, variant="creator")}
          <p class="lead">Attributed public source records from short-form expert videos. This page does not imply creator endorsement.</p>
          <div class="hero-actions">
            <a class="ay-button" href="{escape(creator.get('url') or '#')}" target="_blank" rel="noreferrer">Open creator profile</a>
            <a class="ay-button-secondary" href="../opt-out.html">Correction or opt-out</a>
            <a class="ay-button-secondary" href="../index.html?q={escape(visible_handle)}">Search this creator</a>
          </div>
        </div>
        <div class="source-hero-tools">
          {source_share_action_bar("Share creator profile", "creator profile")}
          <div class="source-hero-meta" aria-label="Creator profile metadata">
            <span class="source-meta-chip"><strong>{len(sources)}</strong><span>records</span></span>
            <span class="source-meta-chip"><strong>{len(public_insights)}</strong><span>insights</span></span>
            <span class="source-meta-chip"><strong>{len(topics)}</strong><span>topics</span></span>
          </div>
        </div>
      </section>
      <section class="content-section">
        <h2>Top Topics</h2>
        <div class="topic-chip-list">{topic_html or '<p class="meta">No public topics yet.</p>'}</div>
      </section>
      <section class="content-section">
        <h2>Latest Source Records</h2>
        <div class="card-grid">{latest_html}</div>
      </section>
      <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
        """,
        current="creators",
        description=f"Attributed public source records from {visible_handle}. This Base2026 profile links every record back to the original creator source.",
        canonical_path=f"creators/{slug(handle)}.html",
    )


def source_page(source: dict, passages: list[dict], insights: list[dict]) -> str:
    source_id = source.get("source_id") or source.get("item_id") or "source"
    handle = display_handle(source.get("creator_handle") or source.get("handle") or "Unknown creator")
    avatar_html = creator_avatar_markup(handle, source.get("avatar_url") or "")
    public_insights = [row for row in insights if row.get("source_id") == source_id and row.get("public")]
    has_public_evidence = source_has_public_evidence(source, passages, public_insights)
    source_topic_rows = [
        (topic_id, label, 0)
        for topic_id, label in zip(source.get("topics") or [], source.get("topic_labels") or [])
    ]
    topic_html = topic_chips(source_topic_rows)
    compact_topic_html = topic_html or '<span class="source-meta-empty">No public topics</span>'
    passage_html = "".join(
        f"""
        <article class="passage-card">
          <div class="passage-card__meta">
            <span>{escape(handle)}</span>
            <span>{escape(source.get('published_date') or source.get('published_at') or 'No date')}</span>
          </div>
          <div class="passage-card__body">{paragraphize(row.get("body") or "", 420, 2)}</div>
        </article>
        """
        for row in passages[:5]
    )
    insight_html = "".join(
        card(
            row.get("claim_text") or row.get("topic") or "Insight",
            row.get("evidence_excerpt") or "",
            topic_href(row.get("topic_id") or slug(row.get("topic") or "uncategorized")),
            f"{row.get('topic') or row.get('topic_id') or 'Topic'} · {row.get('stance') or 'asserts'}",
        )
        for row in public_insights[:6]
    )
    schema = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": source_schema_name(source),
        "description": compact(source.get("excerpt") or "", 260),
        "url": source.get("source_url") or "",
        "datePublished": source.get("published_date") or source.get("published_at") or "",
        "author": {
            "@type": "Person",
            "name": handle,
            "sameAs": source.get("creator_url") or "",
        },
        "isBasedOn": source.get("source_url") or "",
    }
    return page_shell(
        f"{handle} | Base2026 source record",
        f"""
      <section class="page-hero source-page-hero">
        <div class="source-hero-main">
          <p class="eyebrow">Source record</p>
          {source_identity_markup(handle, avatar_html, source.get('published_date') or source.get('published_at') or 'No date', source.get('platform') or source.get('source_type') or 'tiktok', variant="source")}
          <p class="lead">{escape(source_display_lead(source))}</p>
          <div class="hero-actions">
            <a class="ay-button" href="{escape(source.get('source_url') or '#')}" target="_blank" rel="noreferrer">Open original</a>
            <a class="ay-button-secondary" href="{escape(creator_href(handle))}">Creator page</a>
            <a class="ay-button-secondary" href="../opt-out.html">Correction or opt-out</a>
          </div>
        </div>
        <div class="source-hero-tools">
          {source_share_action_bar("Share source record")}
          <div class="source-hero-meta" aria-label="Source metadata">
            <span class="source-meta-chip" title="Public policy" aria-label="Public policy excerpt only"><span>excerpt only</span></span>
            <span class="source-meta-chip" title="Public insight cards" aria-label="{len(public_insights)} public insight cards">{icon_svg("card")}<span>{len(public_insights)}</span></span>
            <span class="source-meta-chip source-meta-chip--topics" title="Topics" aria-label="Topics">{icon_svg("topic")}<span class="topic-chip-list">{compact_topic_html}</span></span>
          </div>
        </div>
      </section>
      <section class="content-section">
        {section_title("Source Excerpt", "A short, attributed excerpt from a public source record. Base2026 uses this as evidence context and links back to the original creator source.")}
        <div class="source-excerpt-text">{paragraphize(source.get('excerpt') or '', 900, 2)}</div>
        <aside class="source-policy-note" aria-label="Public source policy note">
          <strong>Public source policy</strong>
          <span>Full third-party transcripts are not published as standalone public pages by default. This page keeps attribution, source link, and short evidence context.</span>
        </aside>
      </section>
      <section class="content-section">
        {section_title("Related Passages", "Searchable passage previews connected to this source record. These snippets may be shortened on the public page; they are meant for discovery, not as a full transcript replacement.")}
        <p class="section-helper">These are public discovery snippets linked to the same source record. A snippet can end early when the public page keeps only short evidence context.</p>
        <div class="passage-stack">{passage_html or '<p class="empty-state">No public passages are available for this source yet.</p>'}</div>
      </section>
      <section class="content-section">
        {section_title("Public Insight Cards", "Reviewed, topic-level cards promoted from source evidence. Not every source has a public insight card yet; empty means no reviewed card is linked to this record.")}
        <div class="card-grid">{insight_html or '<p class="empty-state">No public insight cards are linked to this source yet. The source is still searchable as attributed evidence, but no reviewed topic card has been promoted for it.</p>'}</div>
      </section>
      <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
        """,
        robots="index,follow" if has_public_evidence else "noindex,follow",
        current="sources",
        description=f"Attributed Base2026 source record for {handle}. Includes original source link, publication date, topic context, and public evidence excerpt.",
        canonical_path=f"sources/{slug(source.get('item_id') or source_id)}.html",
    )


def topic_page(topic: dict, sources: list[dict], passages: list[dict], insights: list[dict]) -> str:
    topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
    label = topic.get("topic") or topic_id.replace("-", " ").title()
    public_insights = [
        row for row in insights if row.get("public") and (row.get("topic_id") or "") == topic_id
    ]
    related_source_ids = {row.get("source_id") for row in public_insights if row.get("source_id")}
    related_sources = [row for row in sources if row.get("source_id") in related_source_ids]
    if not related_sources:
        related_sources = [
            row for row in sources if topic_id in (row.get("topics") or [])
        ][:12]
    sources_by_id = {row.get("source_id") or "": row for row in sources}
    related_passages = [
        row for row in passages if topic_id in (row.get("topics") or [])
    ][:10]
    creator_rows = topic.get("top_creators") or []
    creator_html = "".join(
        f'<a class="topic-chip" href="{escape(creator_href(row.get("handle") or ""))}">{escape(display_handle(row.get("handle")))} · {escape(str(row.get("count") or 0))}</a>'
        for row in creator_rows
    )
    insight_html = "".join(
        card(
            row.get("claim_text") or label,
            row.get("evidence_excerpt") or "",
            source_href(row),
            f"{display_handle(row.get('creator_handle'))} · {row.get('stance') or 'asserts'}",
        )
        for row in public_insights[:12]
    )
    source_html = "".join(
        card(
            source_display_title(source),
            source.get("excerpt") or "",
            source_href(source),
            f"{display_handle(source.get('creator_handle'))} · {source.get('published_date') or source.get('published_at') or ''}",
        )
        for source in related_sources[:12]
    )
    passage_cards = []
    for row in related_passages[:6]:
        source = sources_by_id.get(row.get("source_id") or "", {})
        handle = display_handle(source.get("creator_handle") or row.get("creator_handle") or row.get("handle"))
        title = source_display_title(source) if source else "Source record"
        href = source_href(source) if source else "#"
        date = source.get("published_date") or source.get("published_at") or row.get("published_date") or "No date"
        passage_cards.append(
            f"""
            <article class="passage-card passage-card--linked">
              <div class="passage-card__meta">
                <a href="{escape(href)}">{escape(title)}</a>
                <span>{escape(handle)}</span>
                <span>{escape(date)}</span>
              </div>
              <div class="passage-card__body">{paragraphize(row.get('body') or '', 520, 2)}</div>
            </article>
            """
        )
    passage_html = "".join(passage_cards)
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{label} creator evidence",
        "description": compact(topic.get("definition") or "", 260),
        "about": label,
    }
    return page_shell(
        f"{label} creator evidence | Base2026",
        f"""
      <section class="page-hero topic-page-hero">
        <div class="topic-page-hero__main">
          <p class="eyebrow">Topic evidence page</p>
          <h1>{escape(label)}</h1>
          <p class="lead">{escape(topic.get('definition') or f'Source-backed creator statements and evidence excerpts related to {label}.')}</p>
          <div class="hero-actions">
            <a class="ay-button" href="../index.html?q={escape(label)}">Search this topic</a>
            <a class="ay-button-secondary" href="../compare/{escape(slug(topic_id))}.html">Compare creator viewpoints</a>
            <a class="ay-button-secondary" href="../methodology.html">Methodology</a>
          </div>
        </div>
        <aside class="topic-page-hero__tools" aria-label="Topic page controls and summary">
          {inline_share_actions("Share topic page", "topic page")}
          <div class="topic-stat-grid" aria-label="Topic evidence summary">
            <div><strong>{escape(str(topic.get('public_insight_count') or 0))}</strong><span>insight cards</span></div>
            <div><strong>{escape(str(topic.get('source_count') or len(related_sources)))}</strong><span>source records</span></div>
            <div><strong>{escape(str(topic.get('creator_count') or len(creator_rows)))}</strong><span>creators</span></div>
          </div>
        </aside>
      </section>
      <section class="content-section">
        <h2>Top Creators</h2>
        <div class="topic-chip-list">{creator_html or '<p class="meta">No creator distribution available yet.</p>'}</div>
      </section>
      <section class="content-section">
        <h2>Public Insight Cards</h2>
        <p class="meta">These are deterministic, source-backed cards from the offline export. They are not live AI answers.</p>
        <div class="card-grid">{insight_html or '<p class="meta">No public insight cards available yet.</p>'}</div>
      </section>
      <section class="content-section">
        <h2>Related Source Records</h2>
        <div class="card-grid">{source_html or '<p class="meta">No related source records available.</p>'}</div>
      </section>
      <section class="content-section">
        <h2>Evidence Passages</h2>
        <p class="section-helper">Short public snippets grouped with their source record, creator, and date.</p>
        <div class="passage-stack">{passage_html or '<p class="meta">No related passages available.</p>'}</div>
      </section>
      <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
        """,
        robots="index,follow" if is_indexable_topic(topic) else "noindex,follow",
        current="topics",
        description=topic.get("definition") or f"Source-backed creator evidence and viewpoints related to {label}.",
        canonical_path=f"topics/{slug(topic_id)}.html",
    )


def compare_page(topic: dict, insights: list[dict]) -> str:
    topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
    label = topic.get("topic") or topic_id.replace("-", " ").title()
    public_insights = [
        row for row in insights if row.get("public") and (row.get("topic_id") or "") == topic_id
    ]
    by_creator: dict[str, list[dict]] = defaultdict(list)
    for insight in public_insights:
        by_creator[insight.get("creator_handle") or "Unknown creator"].append(insight)
    creator_blocks = []
    for handle, rows in sorted(by_creator.items(), key=lambda item: (-len(item[1]), item[0])):
        claim_rows = "".join(
            f"""
            <li>
              <p><strong>{escape(row.get('stance') or 'asserts')}</strong>: {escape(compact(row.get('claim_text') or '', 260))}</p>
              <p class="meta">{escape(compact(row.get('evidence_excerpt') or '', 260))}</p>
              <a class="button-link" href="{escape(source_href(row))}">Source page</a>
            </li>
            """
            for row in rows[:5]
        )
        creator_blocks.append(
            f"""
            <article class="comparison-group">
              <h3><a href="{escape(creator_href(handle))}">{escape(display_handle(handle))}</a></h3>
              <ul>{claim_rows}</ul>
            </article>
            """
        )
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{label} creator viewpoint comparison",
        "about": label,
    }
    return page_shell(
        f"{label} creator viewpoint comparison | Base2026",
        f"""
      <section class="page-hero">
        <p class="eyebrow">Creator viewpoint comparison</p>
        <h1>{escape(label)}</h1>
        <p class="lead">A deterministic grouping of public source-backed insight cards. This page compares what creators said without declaring a winner.</p>
        <div class="hero-actions">
          <a class="ay-button" href="../topics/{escape(slug(topic_id))}.html">Topic page</a>
          <a class="ay-button-secondary" href="../index.html?q={escape(label)}">Search passages</a>
        </div>
      </section>
      <section class="content-section">
        <h2>Creator Viewpoints</h2>
        <div class="comparison-grid">{''.join(creator_blocks) or '<p class="meta">No public creator viewpoints available yet.</p>'}</div>
      </section>
      <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
        """,
        robots="index,follow" if is_indexable_topic(topic) else "noindex,follow",
        current="topics",
        description=f"Compare source-backed creator viewpoints about {label}. Every viewpoint links back to Base2026 source evidence.",
        canonical_path=f"compare/{slug(topic_id)}.html",
    )


def index_page(title: str, intro: str, cards: str, current: str = "") -> str:
    return page_shell(
        title,
        f"""
      <section class="page-hero">
        <p class="eyebrow">Base2026 index</p>
        <h1>{escape(title)}</h1>
        <p class="lead">{escape(intro)}</p>
        <div class="hero-actions">
          <a class="ay-button" href="../index.html">Back to search</a>
        </div>
      </section>
      <section class="content-section">
        <div class="card-grid">{cards}</div>
      </section>
        """,
        current=current,
        description=intro,
        canonical_path={
            "creators": "creators/",
            "sources": "sources/",
            "topics": "topics/",
        }.get(current, ""),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate public creator/source pages from public JSONL.")
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = args.data
    out = args.out
    sources = read_jsonl(data / "source_records.jsonl")
    passages = read_jsonl(data / "passages.jsonl")
    insights = read_jsonl(data / "insight_cards.jsonl")
    topics = read_jsonl(data / "topics.jsonl")
    creators = read_jsonl(data / "creators.jsonl")

    passages_by_source: dict[str, list[dict]] = defaultdict(list)
    for passage in passages:
        passages_by_source[passage.get("source_id") or ""].append(passage)

    insights_by_source: dict[str, list[dict]] = defaultdict(list)
    for insight in insights:
        insights_by_source[insight.get("source_id") or ""].append(insight)

    sources_by_handle: dict[str, list[dict]] = defaultdict(list)
    for source in sources:
        sources_by_handle[source.get("creator_handle") or source.get("handle") or "Unknown"].append(source)

    creators_by_handle = {
        creator.get("handle") or creator.get("creator_handle") or creator.get("creator_id"): creator
        for creator in creators
    }

    creator_cards = []
    for handle, source_rows in sorted(sources_by_handle.items()):
        creator = creators_by_handle.get(handle, {"handle": handle, "url": ""})
        html = creator_page(handle, creator, source_rows, insights)
        path = out / "creators" / f"{slug(handle)}.html"
        write_text(path, html)
        creator_cards.append(card(display_handle(handle), f"{len(source_rows)} source records", f"{slug(handle)}.html"))

    source_cards = []
    for source in sources:
        source_key = source.get("source_id") or ""
        source_passages = passages_by_source.get(source_key, [])
        source_insights = insights_by_source.get(source_key, [])
        page_name = f"{slug(source.get('item_id') or source_key)}.html"
        html = source_page(source, source_passages, source_insights)
        write_text(out / "sources" / page_name, html)
        if source_has_public_evidence(source, source_passages, source_insights):
            source_cards.append(
                card(
                    source_display_title(source),
                    source.get("excerpt") or "",
                    page_name,
                    display_handle(source.get("creator_handle") or source.get("handle")),
                )
            )

    topic_cards = []
    public_topics = [topic for topic in topics if topic.get("public")]
    public_topics.sort(
        key=lambda row: (-(int(row.get("public_insight_count") or 0)), row.get("topic") or "")
    )
    indexable_topics = [topic for topic in public_topics if is_indexable_topic(topic)]
    for topic in public_topics:
        topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
        write_text(out / "topics" / f"{slug(topic_id)}.html", topic_page(topic, sources, passages, insights))
        write_text(out / "compare" / f"{slug(topic_id)}.html", compare_page(topic, insights))
    for topic in indexable_topics:
        topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
        topic_cards.append(
            card(
                topic.get("topic") or topic_id,
                topic.get("definition") or "",
                f"{slug(topic_id)}.html",
                f"{topic.get('public_insight_count') or 0} public insights · {topic.get('source_count') or 0} sources",
            )
        )

    write_text(
        out / "creators" / "index.html",
        index_page("Creator Source Profiles", "Creator-level attribution pages for indexed public source records.", "".join(creator_cards), current="creators"),
    )
    write_text(
        out / "sources" / "index.html",
        index_page("Source Records", "Excerpt-first source records with attribution and original links.", "".join(source_cards[:80]), current="sources"),
    )
    write_text(
        out / "topics" / "index.html",
        index_page("Topic Evidence Pages", "Topic-level evidence pages with source-backed insights and creator comparison links.", "".join(topic_cards[:80]), current="topics"),
    )
    write_text(
        out / "compare" / "index.html",
        index_page("Creator Viewpoint Comparisons", "Deterministic creator viewpoint groupings by topic. Every row links back to source evidence.", "".join(topic_cards[:80]), current="topics"),
    )

    print(
        json.dumps(
            {
                "creators": len(sources_by_handle),
                "sources": len(sources),
                "topics": len(public_topics),
                "indexable_topics": len(indexable_topics),
                "compare_pages": len(public_topics),
                "out": str(out),
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

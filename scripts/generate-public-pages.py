from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlencode


STYLE_VERSION = "20260611-creatorcta1"
CONTACT_EMAIL = "offflinerpsy@gmail.com"
FONT_LINK = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&display=swap"
PROJECT_NAV_LINKS = [
    ("search", "Search", "index.html"),
    ("analytics", "Analytics", "analytics.html"),
    ("topics", "Topics", "topics/"),
    ("creators", "Creators", "creators/"),
    ("methodology", "Methodology", "methodology.html"),
]
FOOTER_LINKS = [
    ("Roadmap", "../roadmap.html"),
    ("Methodology", "../methodology.html"),
    ("Source policy", "../source-policy.html"),
    ("Privacy", "../privacy.html"),
    ("Support", "../support.html"),
    ("Creator Correction / Removal", "../opt-out.html"),
]
INSIGHT_STOPWORDS = {
    "about",
    "above",
    "after",
    "again",
    "against",
    "also",
    "because",
    "been",
    "being",
    "between",
    "could",
    "does",
    "doing",
    "from",
    "have",
    "having",
    "into",
    "more",
    "most",
    "need",
    "only",
    "other",
    "same",
    "should",
    "source",
    "that",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "when",
    "where",
    "which",
    "while",
    "with",
    "would",
    "your",
}
INSIGHT_ANCHOR_TOKENS = {
    "access",
    "authority",
    "brand",
    "citation",
    "content",
    "creator",
    "ecommerce",
    "evidence",
    "freshness",
    "google",
    "government",
    "keyword",
    "link",
    "mention",
    "model",
    "page",
    "query",
    "recommendation",
    "retrieval",
    "risk",
    "search",
    "security",
    "seo",
    "signal",
    "source",
    "topic",
    "traffic",
    "visibility",
}


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
    text = re.sub(r"\s+", " ", unescape(value or "")).strip()
    if not limit or len(text) <= limit:
        return text
    candidate = text[: max(limit - 3, 0)].rstrip()
    sentence_cut = max(candidate.rfind(". "), candidate.rfind("? "), candidate.rfind("! "))
    if sentence_cut >= max(80, int(limit * 0.55)):
        candidate = candidate[: sentence_cut + 1].rstrip()
    else:
        word_cut = candidate.rfind(" ")
        if word_cut >= max(40, int(limit * 0.65)):
            candidate = candidate[:word_cut].rstrip()
    return candidate.rstrip(" ,;:.") + "..."


def format_count(value: object) -> str:
    try:
        return f"{int(value or 0):,}"
    except (TypeError, ValueError):
        return "0"


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
        text = text.rstrip(" ,;:.") + "..."
    sentences = re.split(r"(?<=[.!?])\s+", text)
    paragraphs: list[str] = []
    for index in range(0, len(sentences), sentences_per_paragraph):
        chunk = " ".join(part for part in sentences[index : index + sentences_per_paragraph] if part).strip()
        if chunk:
            paragraphs.append(f"<p>{escape(chunk)}</p>")
    return "".join(paragraphs) or f"<p>{escape(text)}</p>"


def paragraphize_full(value: str, sentences_per_paragraph: int = 3) -> str:
    text = unescape(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not text:
        return '<p class="empty-state">No public source text is available for this source yet.</p>'
    raw_blocks = [re.sub(r"[ \t]+", " ", block).strip() for block in re.split(r"\n{2,}", text)]
    raw_blocks = [block for block in raw_blocks if block]
    if len(raw_blocks) <= 1:
        sentences = re.split(r"(?<=[.!?])\s+(?=[\"'“‘(]?[A-Z0-9])", raw_blocks[0] if raw_blocks else text)
        raw_blocks = [
            " ".join(sentence for sentence in sentences[index : index + sentences_per_paragraph] if sentence).strip()
            for index in range(0, len(sentences), sentences_per_paragraph)
        ]
    paragraphs = [block for block in raw_blocks if block]
    return "".join(f"<p>{escape(block)}</p>" for block in paragraphs) or f"<p>{escape(text)}</p>"


def strip_evidence_markup(value: str) -> str:
    return compact(re.sub(r"<[^>]+>", " ", unescape(value or "")), 0)


def evidence_fingerprint(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", strip_evidence_markup(value).lower()).strip()


def same_evidence(first_value: str, second_value: str) -> bool:
    first = evidence_fingerprint(first_value)
    second = evidence_fingerprint(second_value)
    if not first or not second:
        return False
    short = first if len(first) <= len(second) else second
    long = second if len(first) <= len(second) else first
    if len(short) < 120:
        return first == second
    return long.startswith(short[:240]) or short.startswith(long[:240])


def evidence_contains_fragment(fragment_value: str, full_value: str) -> bool:
    fragment = evidence_fingerprint(fragment_value)
    full = evidence_fingerprint(full_value)
    if not fragment or not full:
        return False
    if len(fragment) < 80:
        return fragment == full
    return fragment in full or full in fragment


def insight_token_set(*values: str) -> set[str]:
    text = evidence_fingerprint(" ".join(value or "" for value in values))
    tokens: set[str] = set()
    for raw_token in text.split():
        token = raw_token
        if token in INSIGHT_STOPWORDS:
            continue
        if len(token) < 3 and token not in {"ai"}:
            continue
        for suffix in ("ing", "ed", "es", "s"):
            if len(token) > len(suffix) + 4 and token.endswith(suffix):
                token = token[: -len(suffix)]
                break
        if token and token not in INSIGHT_STOPWORDS:
            tokens.add(token)
    return tokens


def insight_signature(row: dict) -> set[str]:
    return insight_token_set(
        row.get("topic") or "",
        row.get("topic_id") or "",
        row.get("claim_text") or "",
        row.get("suggested_action") or "",
        row.get("evidence_excerpt") or "",
    )


def insight_rows_related(first: dict, second: dict) -> bool:
    first_topic = first.get("topic_id") or slug(first.get("topic") or "")
    second_topic = second.get("topic_id") or slug(second.get("topic") or "")
    if first_topic and first_topic == second_topic:
        return True
    first_tokens = insight_signature(first)
    second_tokens = insight_signature(second)
    if not first_tokens or not second_tokens:
        return False
    shared = first_tokens & second_tokens
    overlap = len(shared) / max(1, min(len(first_tokens), len(second_tokens)))
    if len(shared) >= 5 and overlap >= 0.18:
        return True
    if len(shared & INSIGHT_ANCHOR_TOKENS) >= 3 and len(shared) >= 4:
        return True
    first_topic_tokens = insight_token_set(first.get("topic") or first_topic)
    second_topic_tokens = insight_token_set(second.get("topic") or second_topic)
    return bool(first_topic_tokens & second_topic_tokens) and len(shared) >= 4


def group_insight_rows(rows: list[dict]) -> list[list[dict]]:
    groups: list[list[dict]] = []
    for row in rows:
        for group in groups:
            if any(insight_rows_related(row, existing) for existing in group):
                group.append(row)
                break
        else:
            groups.append([row])
    return groups


def sentence_excerpt(value: str, limit: int = 420, max_sentences: int = 3) -> str:
    text = strip_evidence_markup(value)
    if not text:
        return ""
    sentences = re.findall(r"[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$", text) or [text]
    picked: list[str] = []
    length = 0
    for sentence in sentences:
        clean = compact(sentence, 0)
        if not clean:
            continue
        if len(picked) >= max_sentences:
            break
        if length and length + len(clean) > limit:
            break
        picked.append(clean)
        length += len(clean) + 1
    excerpt = compact(" ".join(picked), 0) or text
    if len(excerpt) <= limit:
        return excerpt
    clipped = excerpt[: max(limit - 3, 0)].rsplit(" ", 1)[0].strip()
    return f"{clipped or excerpt[: max(limit - 3, 0)].strip()}..."


def public_source_excerpt(source: dict, passages: list[dict]) -> str:
    for row in passages:
        body = unescape(row.get("body") or "").strip()
        if body:
            return body
    return unescape(source.get("excerpt") or "")


def source_evidence_text(source: dict, passages: list[dict], public_insights: list[dict]) -> str:
    for row in public_insights:
        evidence = expanded_insight_evidence(row, passages)
        if evidence:
            return evidence
    return public_source_excerpt(source, passages)


def is_clipped_evidence(value: str) -> bool:
    return bool(re.search(r"(?:\.{3}|\u2026)\s*$", compact(value, 0)))


def expanded_insight_evidence(row: dict, passages: list[dict]) -> str:
    evidence = strip_evidence_markup(row.get("evidence_excerpt") or "")
    if not evidence:
        return ""
    if not is_clipped_evidence(evidence):
        return evidence
    for passage in passages:
        body = passage.get("body") or passage.get("excerpt") or ""
        if body and same_evidence(evidence, body):
            return strip_evidence_markup(body)
    fallback = public_source_excerpt({}, passages)
    if fallback:
        return strip_evidence_markup(fallback)
    return re.sub(r"(?:\.{3}|\u2026)\s*$", ".", evidence).strip()


def source_public_text(source: dict, passages: list[dict]) -> str:
    text = unescape(source.get("public_source_text") or "").strip()
    if text:
        return text
    return public_source_excerpt(source, passages)


def source_intelligence_lead(source: dict, public_insights: list[dict]) -> str:
    if public_insights:
        claim = public_insights[0].get("claim_text") or public_insights[0].get("topic") or "reviewed public insight"
        return compact(f"Reviewed source-backed insight: {claim}", 220)
    return source.get("source_summary_short") or "Attributed source record from the searchable Base2026 video knowledge base."


def should_show_summary_long(summary_long: str, summary_short: str, public_text: str) -> bool:
    if not summary_long or summary_long == summary_short:
        return False
    if same_evidence(summary_long, public_text):
        return False
    if summary_short and same_evidence(summary_long, summary_short):
        return False
    return True


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


def source_quick_meta(public_policy: str, insight_count: int, platform: str = "tiktok", language: str = "en") -> str:
    insight_item = (
        f'<span class="source-meta-inline" title="Public insight cards">{icon_svg("card")}<strong>{escape(str(insight_count))}</strong></span>'
        if insight_count
        else ""
    )
    return (
        '<div class="source-hero-quick-meta" aria-label="Source metadata">'
        f'<span class="source-meta-inline" title="Platform">{platform_icon_only(platform)}<span>{escape((platform or "source").replace("_", " ").title())}</span></span>'
        f'<span class="source-meta-inline" title="Public policy">{escape(public_policy)}</span>'
        f'<span class="source-meta-inline" title="Language">{escape(language or "en")}</span>'
        f'{insight_item}'
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


def header_nav_links(relative_root: str, current: str = "") -> str:
    project_links = []
    for key, label, target in PROJECT_NAV_LINKS:
        active = ' aria-current="page"' if key == current else ""
        project_links.append(f'<a class="site-header__link" href="{escape(root_href(relative_root, target))}"{active}>{escape(label)}</a>')
    return (
        "".join(project_links)
        + '<span class="site-header__nav-divider" aria-hidden="true"></span>'
        + '<a class="site-header__link site-header__link--site" href="/services/">Services</a>'
        + '<a class="site-header__link site-header__link--site" href="/pricing/">Pricing</a>'
        + '<a class="site-header__link site-header__link--site" href="/about/">About</a>'
    )


def mobile_base2026_links(relative_root: str, current: str = "") -> str:
    links = []
    for key, label, target in PROJECT_NAV_LINKS:
        active = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{escape(root_href(relative_root, target))}"{active}>{escape(label)}</a>')
    return "".join(links)


def site_header(relative_root: str, current: str = "") -> str:
    return f"""
    <header class="site-header">
      <div class="site-header__bar">
        <a class="site-header__brand" href="/"><span class="site-header__avatar" aria-hidden="true"></span><span>Alex Yarosh</span></a>
        <nav class="site-header__nav" aria-label="Base2026 navigation">
          {header_nav_links(relative_root, current)}
        </nav>
        <a class="site-header__cta" href="/ai-visibility-audit/">Check My AI Visibility</a>
        <details class="site-header__mobile-menu">
          <summary aria-label="Open navigation"><span></span><span></span><span></span></summary>
          <div class="site-header__mobile-panel">
            <nav aria-label="Mobile navigation">
              <details class="site-header__mobile-base" open>
                <summary>Base2026</summary>
                <div>{mobile_base2026_links(relative_root, current)}</div>
              </details>
              <strong class="mobile-menu-label">Alex Yarosh</strong>
              <a href="/services/">Services</a>
              <a href="/pricing/">Pricing</a>
              <a href="/about/">About</a>
              <a class="site-header__mobile-cta" href="/ai-visibility-audit/">Check My AI Visibility</a>
            </nav>
          </div>
        </details>
      </div>
    </header>
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
    <link href="{FONT_LINK}" rel="stylesheet" />
    <link rel="stylesheet" href="{relative_root}/static/styles.css?v={STYLE_VERSION}" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    {site_header(relative_root, current)}
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
            <a class="ay-button ay-button-base2026" href="/knowledge/">Base2026</a>
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
            <li><a href="{relative_root}/analytics.html">Analytics</a></li>
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


def source_insight_card(row_or_rows: dict | list[dict], passages: list[dict], public_text: str = "") -> str:
    rows = row_or_rows if isinstance(row_or_rows, list) else [row_or_rows]
    rows = [row for row in rows if row]
    if not rows:
        return ""
    primary = rows[0]
    claim_text = primary.get("claim_text") or primary.get("topic") or "Insight"

    topic_links: list[str] = []
    topic_labels: list[str] = []
    seen_topics: set[str] = set()
    for row in rows:
        topic_id = row.get("topic_id") or slug(row.get("topic") or "uncategorized")
        if topic_id in seen_topics:
            continue
        seen_topics.add(topic_id)
        topic_label = row.get("topic") or row.get("topic_id") or "Topic"
        topic_labels.append(topic_label)
        topic_links.append(
            f'<a class="topic-chip topic-tag" href="{escape(topic_href(topic_id))}">{escape(topic_label)}</a>'
        )
    meta = (
        f"{len(rows)} related signals · {' / '.join(topic_labels[:3])}"
        if len(rows) > 1
        else f"{topic_labels[0] if topic_labels else 'Topic'} · {primary.get('stance') or 'asserts'}"
    )

    actions: list[str] = []
    evidence_blocks: list[str] = []
    evidence_duplicate_count = 0
    seen_actions: list[str] = []
    seen_evidence: list[str] = []
    for row in rows:
        row_claim = row.get("claim_text") or row.get("topic") or "Insight"
        action = compact(row.get("suggested_action") or "", 0)
        if action and not same_evidence(action, row_claim) and not any(same_evidence(action, existing) for existing in seen_actions):
            seen_actions.append(action)
            actions.append(f"<li>{escape(action)}</li>")

        evidence = strip_evidence_markup(row.get("evidence_excerpt") or "")
        expanded_evidence = expanded_insight_evidence(row, passages)
        evidence_body = evidence or expanded_evidence
        if not evidence_body:
            continue
        evidence_is_duplicate = same_evidence(evidence_body, public_text) or same_evidence(evidence_body, row_claim)
        if evidence_is_duplicate:
            evidence_duplicate_count += 1
            continue
        if any(same_evidence(evidence_body, existing) for existing in seen_evidence):
            continue
        seen_evidence.append(evidence_body)
        evidence_preview = sentence_excerpt(evidence_body, 300, 2)
        evidence_blocks.append(f"<li>{paragraphize_full(evidence_preview or evidence_body)}</li>")

    action_html = f'<ul class="source-detail-insight__actions">{"".join(actions)}</ul>' if actions else ""
    evidence_html = ""
    if evidence_blocks or evidence_duplicate_count:
        summary = "Show source evidence" if evidence_blocks else "Evidence is in Source Text"
        evidence_body = (
            f'<ul class="source-detail-evidence-list">{"".join(evidence_blocks)}</ul>'
            if evidence_blocks
            else '<p>Evidence is already included in the Source Text above.</p>'
        )
        evidence_html = f"""
        <details class="source-detail-evidence">
          <summary>{escape(summary)}</summary>
          <div>{evidence_body}</div>
        </details>
        """
    topics_html = (
        f'<div class="source-detail-topic-links" aria-label="Related topics">{"".join(topic_links)}</div>'
        if topic_links
        else ""
    )
    return f"""
      <article class="intelligence-card source-detail-insight">
        <h3>{escape(claim_text)}</h3>
        <p class="meta">{escape(meta)}</p>
        {action_html}
        {evidence_html}
        {topics_html}
      </article>
    """


def source_insight_cards(rows: list[dict], passages: list[dict], public_text: str = "") -> str:
    return "".join(source_insight_card(group, passages, public_text) for group in group_insight_rows(rows))


def creator_index_card(handle: str, creator: dict, source_count: int, public_insight_count: int) -> str:
    visible_handle = display_handle(handle)
    avatar_html = creator_avatar_markup(visible_handle, creator.get("avatar_url") or "", relative_root="..")
    profile_href = f"{slug(handle)}.html"
    creator_url = creator.get("url") or ""
    external_link = (
        f'<a class="creator-index-card__source" href="{escape(creator_url)}" target="_blank" rel="noreferrer">TikTok profile</a>'
        if creator_url
        else ""
    )
    insight_label = "public insight" if public_insight_count == 1 else "public insights"
    source_label = "source record" if source_count == 1 else "source records"
    return f"""
      <article class="intelligence-card creator-index-card">
        <div class="creator-index-card__head">
          {avatar_html}
          <div>
            <h3>{escape(visible_handle)}</h3>
            <p class="meta">{escape(str(source_count))} {source_label} · {escape(str(public_insight_count))} {insight_label}</p>
          </div>
        </div>
        <p>Creator-level attribution profile with source records, public insight cards, topic distribution, and original-platform links.</p>
        <div class="creator-index-card__actions">
          <a class="button-link" href="{escape(profile_href)}">Open profile</a>
          {external_link}
        </div>
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
    summary = compact(source.get("source_summary_short") or "", 96)
    if summary:
        return summary
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


def source_seo_topic(source: dict) -> str:
    labels = [label for label in (source.get("topic_labels") or []) if label]
    if labels:
        return labels[0]
    topics = [topic for topic in (source.get("topics") or []) if topic]
    if topics:
        return topics[0].replace("-", " ").title()
    return "creator evidence"


def source_seo_title(source: dict, handle: str) -> str:
    topic = source_seo_topic(source)
    return compact(f"{handle} source record about {topic} | Base2026", 70)


def source_seo_description(source: dict, handle: str) -> str:
    date = source.get("published_date") or source.get("published_at") or "undated"
    topic = source_seo_topic(source)
    excerpt = compact(source.get("source_summary_short") or source.get("excerpt") or "", 130)
    base = f"Attributed Base2026 source record from {handle}, published {date}, with public evidence about {topic}."
    if excerpt:
        return compact(f"{base} Excerpt: {excerpt}", 180)
    return compact(f"{base} Includes original-source attribution, related passages, topics, and correction controls.", 180)


def source_href(source: dict, prefix: str = "../sources") -> str:
    return f"{prefix}/{slug(source.get('item_id') or source.get('source_id'))}.html"


def source_has_public_evidence(source: dict, passages: list[dict] | None = None, insights: list[dict] | None = None) -> bool:
    if (source.get("public_source_text") or "").strip():
        return True
    if (source.get("excerpt") or "").strip():
        return True
    if passages:
        return True
    return any(row.get("public") for row in (insights or []))


def creator_href(handle: str, prefix: str = "../creators") -> str:
    return f"{prefix}/{slug(handle)}.html"


def topic_href(topic_id: str, prefix: str = "../topics") -> str:
    return f"{prefix}/{slug(topic_id, 'uncategorized')}.html"


def workspace_href(base: str = "../index.html", **params: str) -> str:
    query = urlencode({str(key): str(value).lstrip("@") for key, value in params.items() if value})
    return f"{base}?{query}" if query else base


def topic_chips(topic_rows: list[tuple[str, str, int]], prefix: str = "../topics") -> str:
    chips = []
    for topic_id, label, count in topic_rows:
        suffix = f" · {count}" if count else ""
        chips.append(
            f'<a class="topic-chip topic-tag" href="{escape(topic_href(topic_id, prefix))}">{escape(label)}{escape(suffix)}</a>'
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
    if platform and variant != "source":
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
            <a class="ay-button" href="{escape(workspace_href(creator=visible_handle))}">Open in Search Workspace</a>
            <a class="ay-button-secondary" href="{escape(creator.get('url') or '#')}" target="_blank" rel="noreferrer">Open creator profile</a>
            <a class="ay-button-secondary" href="../opt-out.html">Correction or opt-out</a>
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
    compact_topic_html = topic_html
    public_text = source_public_text(source, passages)
    readable_excerpt = source_evidence_text(source, passages, public_insights)
    summary_short = source.get("source_summary_short") or source_intelligence_lead(source, public_insights)
    summary_long = source.get("source_summary_long") or readable_excerpt
    platform_name = source.get("platform") or source.get("source_type") or "tiktok"
    distinct_passages = [
        row
        for row in passages
        if (row.get("body") or "")
        and not same_evidence(row.get("body") or "", public_text)
        and not same_evidence(row.get("body") or "", readable_excerpt)
        and not evidence_contains_fragment(row.get("body") or "", public_text)
        and not evidence_contains_fragment(row.get("body") or "", readable_excerpt)
    ]
    passage_html = "".join(
        f"""
        <article class="passage-card">
          <div class="passage-card__meta">
            <span>{escape(handle)}</span>
            <span>{escape(source.get('published_date') or source.get('published_at') or 'No date')}</span>
          </div>
          <div class="passage-card__body">{paragraphize(sentence_excerpt(row.get("body") or "", 420, 3), 0, 2)}</div>
        </article>
        """
        for row in distinct_passages[:4]
    )
    show_summary_long = should_show_summary_long(summary_long, summary_short, public_text)
    insight_html = source_insight_cards(public_insights[:6], passages, public_text)
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CreativeWork",
                "name": source_schema_name(source),
                "description": compact(summary_long or source.get("excerpt") or "", 260),
                "url": source.get("source_url") or "",
                "datePublished": source.get("published_date") or source.get("published_at") or "",
                "author": {
                    "@type": "Person",
                    "name": handle,
                    "sameAs": source.get("creator_url") or "",
                },
                "isBasedOn": source.get("source_url") or "",
                "about": source_seo_topic(source),
            },
            {
                "@type": "VideoObject",
                "name": source_schema_name(source),
                "description": compact(summary_long or source.get("excerpt") or "", 260),
                "uploadDate": source.get("published_date") or source.get("published_at") or "",
                "contentUrl": source.get("source_url") or "",
                "embedUrl": source.get("source_url") or "",
            },
        ],
    }
    return page_shell(
        source_seo_title(source, handle),
        f"""
      <section class="page-hero source-page-hero">
        <div class="source-hero-main">
          <p class="eyebrow">Source record</p>
          {source_identity_markup(handle, avatar_html, source.get('published_date') or source.get('published_at') or 'No date', source.get('platform') or source.get('source_type') or 'tiktok', variant="source")}
          <p class="lead">{escape(summary_short)}</p>
          {f'<p class="source-detail-lead">{escape(summary_long)}</p>' if show_summary_long else ''}
          <div class="hero-actions">
            <a class="ay-button" href="{escape(workspace_href(source=source.get('item_id') or source_id))}">Open in Search Workspace</a>
            <a class="ay-button-secondary" href="{escape(source.get('source_url') or '#')}" target="_blank" rel="noreferrer">Open original</a>
            <a class="ay-button-secondary" href="{escape(workspace_href(creator=clean_handle(handle)))}">Creator</a>
          </div>
        </div>
        <div class="source-hero-tools">
          <div class="source-hero-toolbar">
            {source_share_action_bar("Share source record")}
            {source_quick_meta("excerpt only", len(public_insights), platform_name, source.get("language") or "en")}
          </div>
          {f'<div class="source-hero-topic-tags" aria-label="Source topics">{compact_topic_html}</div>' if compact_topic_html else ''}
        </div>
      </section>
      <section class="content-section source-text-section">
        {section_title("Source Text", "Reviewed polished transcript/source text normalized for reading and search. Raw captions and private QA stay local.")}
        <div class="source-excerpt-text source-full-text">{paragraphize_full(public_text)}</div>
      </section>
      {f'''
      <section class="content-section">
        {section_title("Source Intelligence", "Reviewed source-backed claims promoted from this evidence.")}
        <div class="card-grid">{insight_html}</div>
      </section>
      ''' if insight_html else ''}
      {f'''
      <section class="content-section">
        {section_title("Supporting Passages", "Distinct public passages that add context beyond the Source Text.")}
        <div class="passage-stack">{passage_html}</div>
      </section>
      ''' if passage_html else ''}
      <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
        """,
        robots="index,follow" if has_public_evidence else "noindex,follow",
        current="sources",
        description=source_seo_description(source, handle),
        canonical_path=f"sources/{slug(source.get('item_id') or source_id)}.html",
    )


def signal_source_href(source_ref: str) -> str:
    return source_href({"item_id": source_ref or ""})


def signal_list(items: list[str], empty: str) -> str:
    if not items:
        return f'<p class="meta">{escape(empty)}</p>'
    return "<ul>" + "".join(f"<li>{escape(item)}</li>" for item in items) + "</ul>"


def topic_signal_brief_section(brief: dict | None, topic_id: str, label: str) -> str:
    if not brief or brief.get("status") != "strong":
        return ""

    creator_angles = brief.get("creator_angles") or []
    repeated_tactics = brief.get("repeated_tactics") or []
    source_actions = brief.get("source_backed_actions") or []
    top_sources = brief.get("top_sources") or []
    monthly_activity = brief.get("monthly_activity") or []

    creator_html = "".join(
        f"""
        <li class="signal-row">
          <a href="{escape(creator_href(angle.get('creator_handle') or 'creator'))}">{escape(display_handle(angle.get('creator_handle')))}</a>
          <span>{escape(compact(angle.get('main_angle') or 'Source-backed creator angle.', 170))}</span>
        </li>
        """
        for angle in creator_angles[:4]
    )
    tactic_html = "".join(
        f"""
        <li>
          <strong>{escape(compact(row.get('label') or 'Repeated tactic', 130))}</strong>
          <span>{escape(format_count(row.get('supporting_source_count')))} sources · {escape(format_count(row.get('supporting_creator_count')))} creators</span>
        </li>
        """
        for row in repeated_tactics[:3]
    )
    action_html = "".join(
        f"""
        <li>
          <span>{escape(compact(row.get('action') or '', 160))}</span>
          {f'<a href="{escape(signal_source_href((row.get("source_ids") or [""])[0]))}">source</a>' if row.get("source_ids") else ''}
        </li>
        """
        for row in source_actions[:3]
        if row.get("action")
    )
    source_html = "".join(
        f"""
        <li class="signal-source-list__item">
          <a href="{escape(signal_source_href(row.get('item_id') or row.get('source_id') or ''))}">{escape(compact(row.get('title') or 'Source record', 110))}</a>
          <span>{escape(display_handle(row.get('creator_handle')))} · {escape(row.get('published_date') or 'No date')}</span>
        </li>
        """
        for row in top_sources[:4]
    )
    max_month_sources = max([int(row.get("source_count") or 0) for row in monthly_activity] or [1])
    momentum_html = "".join(
        f"""
        <li style="--signal-width: {max(8, min(100, round((int(row.get('source_count') or 0) / max_month_sources) * 100)))}%">
          <span>{escape(row.get('month') or '')}</span>
          <strong>{escape(format_count(row.get('source_count')))}</strong>
        </li>
        """
        for row in monthly_activity[-6:]
    )
    tools = brief.get("tools_mentioned") or []
    tools_html = "".join(f'<span class="signal-tool">{escape(tool)}</span>' for tool in tools[:8])

    return f"""
      <section class="content-section topic-signal-brief" aria-labelledby="topic-signal-title">
        <div class="signal-brief-head">
          <div>
            <p class="eyebrow">Topic Signal Brief</p>
            <h2 id="topic-signal-title">{escape(label)} signal map</h2>
            <p class="section-helper">A deterministic summary of repeated creator signals from public source records and reviewed public insight cards.</p>
          </div>
          <div class="signal-stat-row" aria-label="Signal strength">
            <span class="signal-stat"><strong>{escape(format_count(brief.get('source_count')))}</strong>sources</span>
            <span class="signal-stat"><strong>{escape(format_count(brief.get('creator_count')))}</strong>creators</span>
            <span class="signal-stat"><strong>{escape(format_count(brief.get('public_insight_count')))}</strong>insights</span>
          </div>
        </div>
        <div class="signal-grid">
          <section class="signal-block">
            <h3>Creator angles</h3>
            <ul>{creator_html or '<li class="meta">No creator angle summary available yet.</li>'}</ul>
          </section>
          <section class="signal-block">
            <h3>Repeated tactics</h3>
            <ul>{tactic_html or '<li class="meta">No repeated tactic crossed the support threshold yet.</li>'}</ul>
          </section>
          <section class="signal-block">
            <h3>Source-backed actions</h3>
            <ul>{action_html or '<li class="meta">No compact public action summary available yet.</li>'}</ul>
          </section>
          <section class="signal-block signal-block--sources">
            <h3>Evidence to inspect</h3>
            <ol class="signal-source-list">{source_html or '<li class="meta">No source list available yet.</li>'}</ol>
          </section>
        </div>
        <div class="signal-brief-footer">
          <div class="signal-momentum" aria-label="Monthly topic activity">
            <span>Recent source activity</span>
            <ol>{momentum_html or '<li><span>No date data</span><strong>0</strong></li>'}</ol>
          </div>
          {f'<div class="signal-tools" aria-label="Tools mentioned">{tools_html}</div>' if tools_html else ''}
          <div class="signal-brief-cta">
            <a class="button-link" href="{escape(workspace_href(topic=topic_id, q=label))}">Search this signal</a>
            <a class="button-link" href="../compare/{escape(slug(topic_id))}.html">Compare creators</a>
          </div>
        </div>
      </section>
    """


def topic_page(topic: dict, sources: list[dict], passages: list[dict], insights: list[dict], signal_briefs: dict[str, dict] | None = None) -> str:
    topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
    label = topic.get("topic") or topic_id.replace("-", " ").title()
    signal_brief = (signal_briefs or {}).get(topic_id)
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
              <div class="passage-card__body">{paragraphize(row.get('body') or '', 1100, 2)}</div>
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
    if signal_brief:
        schema["mainEntity"] = {
            "@type": "ItemList",
            "name": f"{label} topic signal brief",
            "numberOfItems": int(signal_brief.get("public_insight_count") or 0),
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": compact(row.get("label") or row.get("action") or "Source-backed signal", 120),
                }
                for index, row in enumerate(
                    (signal_brief.get("repeated_tactics") or [])[:3]
                    + (signal_brief.get("source_backed_actions") or [])[:3]
                )
            ],
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
            <a class="ay-button" href="{escape(workspace_href(topic=topic_id, q=label))}">Open in Search Workspace</a>
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
      {topic_signal_brief_section(signal_brief, topic_id, label)}
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
          <a class="ay-button" href="{escape(workspace_href(compare=topic_id, topic=topic_id, q=label))}">Open in Search Workspace</a>
          <a class="ay-button-secondary" href="../topics/{escape(slug(topic_id))}.html">Topic page</a>
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


def analytics_stat(label: str, value: object, detail: str = "") -> str:
    return f"""
        <article class="analytics-stat">
          <strong>{escape(format_count(value))}</strong>
          <span>{escape(label)}</span>
          {f'<p>{escape(detail)}</p>' if detail else ''}
        </article>
    """


def analytics_page(analytics: dict) -> str:
    totals = analytics.get("totals") or {}
    top_topics = analytics.get("top_topics") or []
    top_creators = analytics.get("top_creators") or []
    years = analytics.get("sources_by_year") or []
    latest = analytics.get("latest_sources") or []

    topic_rows = []
    for row in top_topics[:24]:
        topic_id = row.get("topic_id") or ""
        href = topic_href(topic_id, prefix="./topics")
        signal = " · signal brief" if row.get("has_signal_brief") else ""
        topic_rows.append(
            f"""
            <tr>
              <td><a href="{escape(href)}">{escape(row.get("label") or topic_id)}</a></td>
              <td>{escape(format_count(row.get("source_count")))}</td>
              <td>{escape(format_count(row.get("creator_count")))}</td>
              <td>{escape(format_count(row.get("public_insight_count")))}</td>
              <td>{escape(format_count(row.get("signal_score")))}{escape(signal)}</td>
            </tr>
            """
        )

    creator_cards = []
    for row in top_creators[:12]:
        handle = row.get("handle") or "@creator"
        creator_cards.append(
            f"""
            <article class="analytics-creator-card">
              {creator_avatar_markup(handle, row.get("avatar_url") or "", relative_root=".")}
              <div>
                <h3>{escape(handle)}</h3>
                <p>{escape(format_count(row.get("source_count")))} sources · {escape(format_count(row.get("public_insight_count")))} insights · {escape(format_count(row.get("topic_count")))} topics</p>
                <a class="button-link" href="{escape(workspace_href(base='./index.html', creator=clean_handle(handle)))}">Search creator</a>
              </div>
            </article>
            """
        )

    year_items = "".join(
        f"<li><strong>{escape(str(row.get('year') or ''))}</strong><span>{escape(format_count(row.get('source_count')))} sources</span></li>"
        for row in years[:8]
    )
    latest_items = "".join(
        f"""
        <li>
          <a href="{escape(workspace_href(base='./index.html', source=row.get('item_id') or ''))}">{escape(compact(row.get('title') or 'Source record', 96))}</a>
          <span>{escape(row.get('creator_handle') or '')} · {escape(row.get('published_date') or '')}</span>
        </li>
        """
        for row in latest[:10]
    )

    body = f"""
      <section class="page-hero analytics-hero">
        <p class="eyebrow">Base2026 analytics</p>
        <h1>Signals across the public source library.</h1>
        <p class="lead">A compact public analytics layer for topics, creators, sources, and repeated SEO/GEO/AEO themes. It is generated from the same public release data used by search.</p>
        <div class="hero-actions">
          <a class="ay-button" href="./index.html">Search the library</a>
          <a class="ay-button-secondary" href="./topics/">Topics</a>
        </div>
      </section>
      <section class="analytics-stat-grid" aria-label="Base2026 dataset totals">
        {analytics_stat("source records", totals.get("source_records"))}
        {analytics_stat("searchable passages", totals.get("passages"))}
        {analytics_stat("public insight cards", totals.get("public_insight_cards"))}
        {analytics_stat("public topics", totals.get("public_topics"), f"{format_count(totals.get('signal_briefs'))} signal briefs")}
      </section>
      <section class="content-section analytics-section">
        <div class="section-title-row"><h2>Topic signal ranking</h2>{info_hint("Topic signal ranking", "A deterministic score from public sources, creators, passages, public insight cards, and available signal briefs.")}</div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead><tr><th>Topic</th><th>Sources</th><th>Creators</th><th>Insights</th><th>Signal</th></tr></thead>
            <tbody>{''.join(topic_rows)}</tbody>
          </table>
        </div>
      </section>
      <section class="content-section analytics-section">
        <div class="section-title-row"><h2>Creators</h2>{info_hint("Creators", "Public creator-level coverage in this release.")}</div>
        <div class="analytics-creator-grid">{''.join(creator_cards)}</div>
      </section>
      <section class="analytics-two-up">
        <article class="content-section analytics-section">
          <div class="section-title-row"><h2>Years</h2>{info_hint("Years", "Public source records grouped by publication year.")}</div>
          <ul class="analytics-list">{year_items}</ul>
        </article>
        <article class="content-section analytics-section">
          <div class="section-title-row"><h2>Latest records</h2>{info_hint("Latest records", "Newest public source records in this release.")}</div>
          <ul class="analytics-list analytics-list--links">{latest_items}</ul>
        </article>
      </section>
    """
    return page_shell(
        "Base2026 Analytics",
        body,
        relative_root=".",
        current="analytics",
        description="Public analytics for Base2026 topics, creators, source records, passages and repeated SEO/GEO/AEO signals.",
        canonical_path="analytics.html",
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
    signal_briefs = {
        row.get("topic_id") or "": row
        for row in read_jsonl(data / "topic_signal_briefs.jsonl")
        if row.get("topic_id")
    }
    analytics = {}
    analytics_path = data / "analytics_summary.json"
    if not analytics_path.exists():
        analytics_path = data / "base2026_analytics.json"
    if analytics_path.exists():
        analytics = json.loads(analytics_path.read_text(encoding="utf-8"))

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
        public_insight_count = sum(
            1 for insight in insights if insight.get("creator_handle") == handle and insight.get("public")
        )
        creator_cards.append(creator_index_card(handle, creator, len(source_rows), public_insight_count))

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
        write_text(out / "topics" / f"{slug(topic_id)}.html", topic_page(topic, sources, passages, insights, signal_briefs))
        write_text(out / "compare" / f"{slug(topic_id)}.html", compare_page(topic, insights))
    for topic in indexable_topics:
        topic_id = topic.get("topic_id") or slug(topic.get("topic") or "uncategorized")
        has_signal = topic_id in signal_briefs
        meta = f"{topic.get('public_insight_count') or 0} public insights · {topic.get('source_count') or 0} sources"
        if has_signal:
            meta = f"Signal brief · {meta}"
        topic_cards.append(
            card(
                topic.get("topic") or topic_id,
                topic.get("definition") or "",
                f"{slug(topic_id)}.html",
                meta,
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
    write_text(out / "analytics.html", analytics_page(analytics))

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

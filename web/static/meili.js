const configuredSearchHost = window.BASE2026_MEILI_URL || "http://127.0.0.1:7700";
const searchHost = configuredSearchHost.startsWith("/")
  ? `${window.location.origin}${configuredSearchHost}`
  : configuredSearchHost;
const searchKey = window.BASE2026_MEILI_KEY || "";
const searchIndex = window.BASE2026_MEILI_INDEX || "base2026_public_tiktok";
const urlQuery = new URLSearchParams(window.location.search).get("q") || "";
const presetButtons = [...document.querySelectorAll("[data-query]")];
const selectedTerms = document.querySelector("#selected-terms");
const transcriptDialog = document.querySelector("#transcript-dialog");
const transcriptAttribution = document.querySelector("#transcript-attribution");
const transcriptHeaderActions = document.querySelector("#transcript-header-actions");
const transcriptTitle = document.querySelector("#transcript-title");
const transcriptMeta = document.querySelector("#transcript-meta");
const transcriptBody = document.querySelector("#transcript-body");
const transcriptClose = document.querySelector("#transcript-close");
const documentCache = new Map();

function setDialogScrollLock(locked) {
  document.documentElement.classList.toggle("dialog-open", locked);
  document.body.classList.toggle("dialog-open", locked);
}

const { searchClient } = instantMeiliSearch(searchHost, searchKey, {
  primaryKey: "id",
  placeholderSearch: true,
});

function sourceLabel(type) {
  return type === "tiktok_video" ? "TikTok" : type === "local_file" ? "Local file" : type || "Source";
}

function creatorInitial(value) {
  return String(value || "B").replace("@", "").trim().slice(0, 1).toUpperCase() || "B";
}

function creatorAvatar(handle, avatarUrl) {
  const label = `${stripHandle(handle || "creator")} profile`;
  const safeUrl = compactText(avatarUrl);
  if (safeUrl && (/^https?:\/\//i.test(safeUrl) || safeUrl.startsWith("/") || safeUrl.startsWith("./"))) {
    return `<span class="avatar avatar--image"><img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.avatar').textContent='${escapeHtml(creatorInitial(handle))}'" /></span>`;
  }
  return `<span class="avatar" aria-hidden="true">${escapeHtml(creatorInitial(handle))}</span>`;
}

function tiktokLogoSvg() {
  return `
    <svg class="platform-logo platform-logo--tiktok" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  `;
}

function platformBadge(type) {
  const label = sourceLabel(type);
  const css = type === "tiktok_video" ? " platform-badge--tiktok" : "";
  const logo = type === "tiktok_video" ? tiktokLogoSvg() : "";
  if (type === "tiktok_video") {
    return `<span class="platform-badge${css} platform-badge--icon-only" title="${escapeHtml(label)} source" aria-label="${escapeHtml(label)} source">${logo}</span>`;
  }
  return `<span class="platform-badge${css}">${logo}${escapeHtml(label)}</span>`;
}

function platformInline(type) {
  if (type === "tiktok_video") {
    return `<span class="platform-inline" title="TikTok source" aria-label="TikTok source">${tiktokLogoSvg()}</span>`;
  }
  return `<span class="platform-inline">${escapeHtml(sourceLabel(type))}</span>`;
}

function platformValue(type, platform) {
  if (type === "tiktok_video" || String(platform || "").toLowerCase() === "tiktok") {
    return platformInline("tiktok_video");
  }
  return escapeHtml(platform || sourceLabel(type));
}

function infoHint(label, text) {
  return `<span class="info-hint" tabindex="0" aria-label="${escapeHtml(`${label}: ${text}`)}" data-tooltip="${escapeHtml(text)}">i</span>`;
}

function stripHandle(value) {
  return String(value || "").replace(/^@/, "");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function limitFormattedWords(value, maxWords = 55) {
  const parts = String(value || "").split(/(\s+)/);
  let words = 0;
  let clipped = false;
  const out = [];
  for (const part of parts) {
    if (!part.trim()) {
      out.push(part);
      continue;
    }
    const visible = part.replace(/<[^>]*>/g, "");
    if (visible && !/^\W+$/.test(visible)) words += 1;
    if (words > maxWords) {
      clipped = true;
      break;
    }
    out.push(part);
  }
  return `${out.join("").trim()}${clipped ? "..." : ""}`;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHighlightTerms(query) {
  const stopTokens = new Set(["and", "or", "not"]);
  const terms = [];
  compactText(query)
    .split(",")
    .map((part) => compactText(part))
    .filter(Boolean)
    .forEach((part) => {
      terms.push(part);
      part
        .split(/\s+/)
        .map((token) => compactText(token.replace(/[^\w-]/g, "")))
        .filter((token) => token.length > 2 && !stopTokens.has(token.toLowerCase()))
        .forEach((token) => terms.push(token));
    });
  return [...new Set(terms.map((term) => term.toLowerCase()))]
    .sort((a, b) => b.length - a.length)
    .map((term) => terms.find((item) => item.toLowerCase() === term) || term);
}

function highlightPlainText(value, terms = []) {
  const text = String(value || "");
  const needles = terms.filter(Boolean);
  if (!text || !needles.length) return escapeHtml(text);
  const pattern = needles.map(escapeRegExp).join("|");
  if (!pattern) return escapeHtml(text);
  const regex = new RegExp(`(${pattern})`, "gi");
  let lastIndex = 0;
  let out = "";
  text.replace(regex, (match, _group, offset) => {
    out += escapeHtml(text.slice(lastIndex, offset));
    out += `<mark>${escapeHtml(match)}</mark>`;
    lastIndex = offset + match.length;
    return match;
  });
  out += escapeHtml(text.slice(lastIndex));
  return out;
}

function paragraphizeHtml(value) {
  const text = compactText(limitFormattedWords(value));
  if (!text) return "";
  const sentences = text.split(/(?<=[.!?])\s+(?=(?:<[^>]+>)*["'“‘(]?[A-Z0-9])/);
  return sentences.map((sentence) => `<p>${sentence}</p>`).join("");
}

function paragraphizePlainText(value, terms = []) {
  const text = compactText(value);
  if (!text) return "";
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => compactText(part))
    .filter(Boolean);
  const blocks = paragraphs.length > 1
    ? paragraphs
    : text.split(/(?<=[.!?])\s+(?=["'“‘(]?[A-Z0-9])/).reduce((acc, sentence, index) => {
        const bucket = Math.floor(index / 3);
        acc[bucket] = compactText(`${acc[bucket] || ""} ${sentence}`);
        return acc;
      }, []);
  return blocks.map((part) => `<p>${highlightPlainText(part, terms)}</p>`).join("");
}

function isTruncatedCaption(value) {
  return /(?:\.\.\.|…)$/.test(compactText(String(value || "").replace(/<[^>]*>/g, "")));
}

function renderPlatformCaption(value, className = "") {
  const caption = compactText(value);
  if (!caption) return "";
  const truncated = isTruncatedCaption(caption);
  const safeCaption = escapeHtml(caption);
  const label = truncated ? "Platform caption preview · truncated metadata" : "Platform caption metadata";
  const note = truncated
    ? `<p class="caption-note">This caption comes from platform metadata and is already truncated before Base2026 receives it. It is not used as the main public evidence text.</p>`
    : "";
  return `
    <details class="caption-preview ${className}">
      <summary><span>${label}</span>${infoHint("Platform caption metadata", "Raw platform caption metadata can be incomplete or truncated. Base2026 shows it for provenance, while the public evidence excerpt above is the main readable source text.")}</summary>
      <p>${safeCaption}</p>
      ${note}
    </details>
  `;
}

function pageSlug(value, fallback = "record") {
  const slug = String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.join("-");
  return (slug || fallback).slice(0, 120);
}

function sourcePageHref(hit) {
  return `./sources/${pageSlug(hit.item_id || hit.source_id)}.html`;
}

function creatorPageHref(hit) {
  return `./creators/${pageSlug(hit.handle || hit.author || hit.creator_handle, "creator")}.html`;
}

function topicPageHref(topicId) {
  return `./topics/${pageSlug(topicId, "uncategorized")}.html`;
}

function renderTopicLinks(hit) {
  const topicIds = Array.isArray(hit.topics) ? hit.topics : [];
  const labels = Array.isArray(hit.topic_labels) ? hit.topic_labels : [];
  const pairs = topicIds
    .slice(0, 4)
    .map((topicId, index) => ({
      topicId,
      label: labels[index] || String(topicId || "").replace(/-/g, " "),
    }))
    .filter((row) => row.topicId);
  if (!pairs.length) return "";
  return `
    <div class="result-topic-list" aria-label="Detected topics">
      ${pairs.map((row) => `<a class="topic-chip" href="${topicPageHref(row.topicId)}">${escapeHtml(row.label)}</a>`).join("")}
    </div>
  `;
}

function renderRecordTopics(doc) {
  const topicIds = Array.isArray(doc.topics) ? doc.topics : [];
  const labels = Array.isArray(doc.topic_labels) ? doc.topic_labels : [];
  const pairs = topicIds
    .slice(0, 8)
    .map((topicId, index) => ({
      topicId,
      label: labels[index] || String(topicId || "").replace(/-/g, " "),
    }))
    .filter((row) => row.topicId);
  if (!pairs.length) return "";
  return `
    <div class="record-topics" aria-label="Detected topics">
      ${pairs.map((row) => `<a class="topic-chip" href="${topicPageHref(row.topicId)}">${escapeHtml(row.label)}</a>`).join("")}
    </div>
  `;
}

function transcriptDisplayTitle(doc) {
  const handle = doc.handle || doc.author || "Creator";
  return `${handle} source record`;
}

function splitQueryTerms(query) {
  return compactText(query)
    .split(",")
    .map((term) => compactText(term))
    .filter(Boolean);
}

function mergeQueryTerm(query, term) {
  const target = compactText(term);
  const terms = splitQueryTerms(query);
  const exists = terms.some((item) => item.toLowerCase() === target.toLowerCase());
  const next = exists
    ? terms.filter((item) => item.toLowerCase() !== target.toLowerCase())
    : [...terms, target];
  return next.join(", ");
}

function syncPresetButtons(query) {
  const lowerQuery = compactText(query).toLowerCase();
  presetButtons.forEach((button) => {
    const term = compactText(button.getAttribute("data-query")).toLowerCase();
    const active = term && lowerQuery.includes(term);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderSelectedTerms(query) {
  if (!selectedTerms) return;
  const terms = splitQueryTerms(query);
  if (!terms.length) {
    selectedTerms.innerHTML = "";
    return;
  }
  selectedTerms.innerHTML = terms
    .map((term) => `<button type="button" class="selected-term" data-remove-term="${escapeHtml(term)}" aria-label="Remove ${escapeHtml(term)}">${escapeHtml(term)}<span>×</span></button>`)
    .join("");
}

function hitTemplate(hit) {
  const title = hit._formatted?.title || hit._highlightResult?.title?.value || hit.title || hit.item_id;
  const body = hit._formatted?.body || hit._highlightResult?.body?.value || hit.body || "";
  const handle = hit._formatted?.handle || hit._highlightResult?.handle?.value || hit.handle || hit.author || "Base2026";
  const date = hit.published_date || "No date";
  const source = sourceLabel(hit.source_type);
  const url = hit.canonical_url || hit.creator_url || "#";
  const creatorUrl = hit.creator_url || "#";
  return `
    <article class="result">
      <div class="result-top">
        ${creatorAvatar(hit.handle || hit.author, hit.avatar_url || hit.creator_avatar_url)}
        <div>
          <div class="creator-line">
            <a class="creator-name" href="${creatorUrl}" target="_blank" rel="noreferrer">${handle}</a>
            <span class="meta">${date}</span>
            ${platformBadge(hit.source_type)}
          </div>
          ${renderTopicLinks(hit)}
        </div>
      </div>
      <div class="snippet">${paragraphizeHtml(body)}</div>
      <div class="result-actions">
        <button type="button" class="button-link read-transcript" data-item-id="${escapeHtml(hit.item_id || "")}">Open source record</button>
        <a class="button-link" href="${sourcePageHref(hit)}">Source page</a>
        <a class="button-link" href="${creatorPageHref(hit)}">Creator page</a>
        <a class="button-link" href="${url}" target="_blank" rel="noreferrer">Open original</a>
      </div>
    </article>
  `;
}

async function loadDocumentById(itemId) {
  if (documentCache.has(itemId)) return documentCache.get(itemId);
  const response = await fetch("./static/documents.jsonl", { cache: "force-cache" });
  if (!response.ok) throw new Error(`documents.jsonl ${response.status}`);

  async function inspectLine(line) {
    if (!line.trim()) return null;
    const doc = JSON.parse(line);
    if (doc.item_id) documentCache.set(doc.item_id, doc);
    return doc.item_id === itemId ? doc : null;
  }

  if (!response.body?.getReader) {
    const text = await response.text();
    for (const line of text.split(/\r?\n/)) {
      const found = await inspectLine(line);
      if (found) return found;
    }
    return null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const found = await inspectLine(line);
      if (found) {
        reader.cancel().catch(() => {});
        return found;
      }
    }
    if (done) break;
  }
  return inspectLine(buffer);
}

async function openTranscript(itemId) {
  if (!itemId || !transcriptDialog || !transcriptBody) return;
  transcriptTitle.textContent = "Loading source record...";
  transcriptMeta.textContent = "";
  if (transcriptAttribution) transcriptAttribution.innerHTML = "";
  if (transcriptHeaderActions) transcriptHeaderActions.innerHTML = "";
  transcriptBody.innerHTML = `<p class="meta">Loading source record...</p>`;
  transcriptDialog.showModal();
  setDialogScrollLock(true);
  try {
    const doc = await loadDocumentById(itemId);
    if (!doc) throw new Error("Source record not found.");
    const transcript = doc.transcript || "";
    const excerpt = doc.excerpt || "";
    const publicText = transcript || excerpt;
    const qa = transcript
      ? (doc.transcript_type === "transcript_polished" ? "Polished transcript" : "Clean transcript")
      : "Public excerpt";
    const activeTerms = getHighlightTerms(search.helper?.state?.query || "");
    transcriptTitle.textContent = "Source record";
    transcriptMeta.textContent = `${doc.published_date || "No date"} · ${qa}`;
    const copyButton = transcript
      ? `<button type="button" class="button-link" id="copy-transcript">Copy transcript</button>`
      : "";
    if (transcriptAttribution) {
      transcriptAttribution.innerHTML = `
        ${creatorAvatar(doc.handle || doc.author, doc.avatar_url || doc.creator_avatar_url)}
        <div class="transcript-attribution-text">
          <div class="creator-line">
            <a class="creator-name" href="${escapeHtml(doc.creator_url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(doc.handle || "Unknown creator")}</a>
            <span class="meta">${escapeHtml(doc.published_date || "No date")}</span>
            ${platformInline(doc.source_type)}
          </div>
        </div>
      `;
    }
    if (transcriptHeaderActions) {
      transcriptHeaderActions.innerHTML = `
        <a class="button-link button-link--accent" href="${escapeHtml(doc.source_url || "#")}" target="_blank" rel="noreferrer">Open original</a>
        <a class="button-link" href="${sourcePageHref(doc)}">Source page</a>
        <a class="button-link" href="${creatorPageHref(doc)}">Creator page</a>
        ${copyButton}
      `;
    }
    const policyNote = transcript
      ? `<p class="meta">Transcript is shown with attribution and a direct source link. Creator correction and opt-out are available from the project pages.</p>`
      : `<p class="meta">Full third-party transcripts are private by default. This public record shows source-backed excerpt context, attribution, and a direct original link.</p>`;
    const textLabel = transcript ? "Transcript text" : "Source excerpt";
    transcriptBody.innerHTML = `
      <div class="record-policy-grid">
        <div>
          <span>Public policy ${infoHint("Public policy", "Base2026 publishes an attributed public excerpt, source link, and context by default. Full third-party transcripts stay private unless a reviewed policy changes that.")}</span>
          <strong>${escapeHtml(doc.public_policy || "excerpt_only")}</strong>
        </div>
        <div>
          <span>Platform ${infoHint("Platform", "The original public platform where this source record was found. Base2026 links back to the original source and does not claim ownership of the creator content.")}</span>
          <strong class="platform-value">${platformValue(doc.source_type, doc.platform)}</strong>
        </div>
        <div>
          <span>Language ${infoHint("Language", "Detected or stored language for the public source text used in this record.")}</span>
          <strong>${escapeHtml(doc.language || "en")}</strong>
        </div>
      </div>
      ${policyNote}
      ${renderRecordTopics(doc)}
      <h3 class="section-title-with-info">${textLabel} ${infoHint(textLabel, "This is the public evidence text shown for research and attribution. It is kept excerpt-first by default to avoid publishing full third-party transcripts as standalone public content.")}</h3>
      <div class="transcript-full-text">${paragraphizePlainText(publicText || "No public excerpt is available for this source yet.", activeTerms)}</div>
      ${renderPlatformCaption(doc.title, "transcript-caption")}
    `;
    transcriptBody.querySelectorAll(".caption-preview").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        details.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    });
    document.querySelector("#copy-transcript")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(transcript);
    });
  } catch (error) {
    transcriptTitle.textContent = "Source record unavailable";
    if (transcriptAttribution) transcriptAttribution.innerHTML = "";
    if (transcriptHeaderActions) transcriptHeaderActions.innerHTML = "";
    transcriptBody.innerHTML = `<p>${escapeHtml(error.message || "Unable to load source record.")}</p>`;
  }
}

const search = instantsearch({
  indexName: searchIndex,
  searchClient,
  routing: true,
});

search.addWidgets([
  instantsearch.widgets.configure({
    attributesToHighlight: ["body", "title", "handle"],
    attributesToCrop: ["body:45"],
    cropMarker: "...",
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  }),
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    placeholder: "Search TikTok, ChatGPT, schema, AI Overview...",
    autofocus: true,
    showReset: true,
    showSubmit: true,
  }),
  instantsearch.widgets.stats({
    container: "#stats",
    templates: {
      text(data) {
        return `${data.nbHits} passages · ${data.processingTimeMS}ms`;
      },
    },
  }),
  instantsearch.widgets.currentRefinements({
    container: "#current-refinements",
  }),
  instantsearch.widgets.refinementList({
    container: "#author-refinement",
    attribute: "handle",
    searchable: true,
    limit: 8,
  }),
  instantsearch.widgets.refinementList({
    container: "#source-refinement",
    attribute: "source_type",
    templates: {
      item(item) {
        return `
          <label class="ais-RefinementList-label">
            <input class="ais-RefinementList-checkbox" type="checkbox" value="${item.value}" ${item.isRefined ? "checked" : ""} />
            <span>${sourceLabel(item.label)}</span>
            <span class="ais-RefinementList-count">${item.count}</span>
          </label>
        `;
      },
    },
  }),
  instantsearch.widgets.refinementList({
    container: "#year-refinement",
    attribute: "year",
    sortBy: ["name:desc"],
  }),
  instantsearch.widgets.hits({
    container: "#hits",
    templates: {
      item: hitTemplate,
      empty: `<div class="empty"><strong>No results found.</strong><p>Try another phrase or remove a filter.</p></div>`,
    },
  }),
  instantsearch.widgets.pagination({
    container: "#pagination",
  }),
]);

search.start();

if (urlQuery) {
  search.helper.setQuery(urlQuery).search();
}

presetButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    const term = button.getAttribute("data-query") || "";
    const query = mergeQueryTerm(search.helper.state.query || "", term);
    search.helper.setQuery(query).search();
    document.querySelector(".ais-SearchBox-input")?.focus();
  });
});

search.on("render", () => {
  const query = search.helper.state.query || "";
  syncPresetButtons(query);
  renderSelectedTerms(query);
});

selectedTerms?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-term]");
  if (!button) return;
  const query = mergeQueryTerm(search.helper.state.query || "", button.getAttribute("data-remove-term") || "");
  search.helper.setQuery(query).search();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".read-transcript");
  if (!button) return;
  openTranscript(button.getAttribute("data-item-id") || "");
});

transcriptClose?.addEventListener("click", () => {
  transcriptDialog?.close();
});

transcriptDialog?.addEventListener("close", () => {
  setDialogScrollLock(false);
});

transcriptDialog?.addEventListener("cancel", () => {
  setDialogScrollLock(false);
});

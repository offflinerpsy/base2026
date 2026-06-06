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
const transcriptTitle = document.querySelector("#transcript-title");
const transcriptMeta = document.querySelector("#transcript-meta");
const transcriptBody = document.querySelector("#transcript-body");
const transcriptClose = document.querySelector("#transcript-close");
let documentIndexPromise = null;

const { searchClient } = instantMeiliSearch(searchHost, searchKey, {
  primaryKey: "id",
  placeholderSearch: false,
});

function sourceLabel(type) {
  return type === "tiktok_video" ? "TikTok" : type === "local_file" ? "Local file" : type || "Source";
}

function creatorInitial(value) {
  return String(value || "B").replace("@", "").trim().slice(0, 1).toUpperCase() || "B";
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

function paragraphizeHtml(value) {
  const text = compactText(limitFormattedWords(value));
  if (!text) return "";
  const sentences = text.split(/(?<=[.!?])\s+(?=(?:<[^>]+>)*["'“‘(]?[A-Z0-9])/);
  return sentences.map((sentence) => `<p>${sentence}</p>`).join("");
}

function paragraphizePlainText(value) {
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
  return blocks.map((part) => `<p>${escapeHtml(part)}</p>`).join("");
}

function transcriptDisplayTitle(doc) {
  const handle = doc.handle || doc.author || "Creator";
  return `${handle} transcript`;
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
        <span class="avatar">${creatorInitial(hit.handle || hit.author)}</span>
        <div>
          <div class="creator-line">
            <a class="creator-name" href="${creatorUrl}" target="_blank" rel="noreferrer">${handle}</a>
            <span class="meta">${date}</span>
          </div>
          <div class="meta result-meta-line">
            <span class="badge">${source}</span>
            <span>@${stripHandle(hit.handle || hit.author)}</span>
          </div>
        </div>
      </div>
      <div class="snippet">${paragraphizeHtml(body)}</div>
      <div class="result-actions">
        <button type="button" class="button-link read-transcript" data-item-id="${escapeHtml(hit.item_id || "")}">Read transcript</button>
        <a class="button-link" href="${url}" target="_blank" rel="noreferrer">Open original</a>
        <details class="caption-preview">
          <summary>Platform caption</summary>
          <p>${title}</p>
        </details>
      </div>
    </article>
  `;
}

async function loadDocumentIndex() {
  if (documentIndexPromise) return documentIndexPromise;
  documentIndexPromise = fetch("./static/documents.jsonl", { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`documents.jsonl ${response.status}`);
      return response.text();
    })
    .then((text) => {
      const map = new Map();
      text.split(/\r?\n/).forEach((line) => {
        if (!line.trim()) return;
        const doc = JSON.parse(line);
        if (doc.item_id) map.set(doc.item_id, doc);
      });
      return map;
    });
  return documentIndexPromise;
}

async function openTranscript(itemId) {
  if (!itemId || !transcriptDialog || !transcriptBody) return;
  transcriptTitle.textContent = "Loading transcript...";
  transcriptMeta.textContent = "";
  transcriptBody.innerHTML = `<p class="meta">Loading full transcript...</p>`;
  transcriptDialog.showModal();
  try {
    const docs = await loadDocumentIndex();
    const doc = docs.get(itemId);
    if (!doc) throw new Error("Transcript document not found.");
    const transcript = doc.transcript || "";
    const qa = doc.transcript_type === "transcript_polished" ? "Polished transcript" : "Clean transcript";
    transcriptTitle.textContent = transcriptDisplayTitle(doc);
    transcriptMeta.textContent = `${doc.handle || "Unknown creator"} · ${doc.published_date || "No date"} · ${qa}`;
    transcriptBody.innerHTML = `
      <div class="transcript-actions">
        <a class="button-link" href="${escapeHtml(doc.source_url || "#")}" target="_blank" rel="noreferrer">Open original</a>
        <button type="button" class="button-link" id="copy-transcript">Copy transcript</button>
      </div>
      ${doc.title ? `
        <details class="caption-preview transcript-caption">
          <summary>Platform caption</summary>
          <p>${escapeHtml(doc.title)}</p>
        </details>
      ` : ""}
      <div class="transcript-full-text">${paragraphizePlainText(transcript)}</div>
    `;
    document.querySelector("#copy-transcript")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(transcript);
    });
  } catch (error) {
    transcriptTitle.textContent = "Transcript unavailable";
    transcriptBody.innerHTML = `<p>${escapeHtml(error.message || "Unable to load transcript.")}</p>`;
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

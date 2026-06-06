const state = {
  q: "AI Overview",
  mention: "",
  sourceType: "",
  author: "",
  dateFrom: "",
  dateTo: "",
  searchMode: "any",
  sort: "relevance",
  limit: 12,
  offset: 0,
};

const $ = (id) => document.getElementById(id);

async function api(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function paragraphText(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function queryTerms() {
  return `${state.q || ""} ${state.mention || ""}`
    .match(/[\p{L}\p{N}_-]+/gu)
    ?.filter((term) => term.length > 1 && !["and", "or", "not"].includes(term.toLowerCase()))
    .slice(0, 12) || [];
}

function highlightText(text) {
  const escaped = escapeHtml(text);
  const terms = [...new Set(queryTerms().map((term) => term.toLowerCase()))].sort((a, b) => b.length - a.length);
  if (!terms.length) return escaped;
  const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return escaped.replace(new RegExp(`(${pattern})`, "giu"), "<mark>$1</mark>");
}

function avatar(handle, avatarUrl) {
  const letter = (handle || "KB").replace("@", "").slice(0, 1).toUpperCase() || "K";
  if (avatarUrl) return `<span class="avatar"><img src="${escapeHtml(avatarUrl)}" alt=""></span>`;
  return `<span class="avatar">${escapeHtml(letter)}</span>`;
}

function sourceLabel(type) {
  return type === "tiktok_video" ? "TikTok" : type === "local_file" ? "File" : type || "Source";
}

function formatDate(value) {
  if (!value) return "No date";
  return String(value).slice(0, 10);
}

function titleText(item) {
  return cleanText(item.title) || item.item_id;
}

function titleStatusLabel(item) {
  const status = cleanText(item.title_status);
  const source = cleanText(item.title_source);
  if (status === "ok") return `Platform title · ${source || "metadata"}`;
  if (item.title_is_truncated || status === "truncated") return "Truncated inventory title";
  return source ? `Title source · ${source}` : "Inventory title";
}

function renderSourceText(data) {
  const doc = (data.documents || []).find((d) => cleanText(d.text)) || {};
  const text = paragraphText(doc.text);
  if (text) {
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => cleanText(paragraph))
      .filter(Boolean)
      .map((paragraph) => `<p>${highlightText(paragraph)}</p>`)
      .join("");
  }
  return data.chunks.map((c) => `<p>${highlightText(cleanText(c.text))}</p>`).join("");
}

function readControls() {
  state.q = $("searchInput").value.trim();
  state.mention = $("mentionInput").value.trim();
  state.sourceType = $("sourceType").value;
  state.author = $("authorFilter").value;
  state.dateFrom = $("dateFrom").value;
  state.dateTo = $("dateTo").value;
  state.searchMode = $("searchMode").value;
  state.sort = $("sortMode").value;
}

function writeControls() {
  $("searchInput").value = state.q;
  $("mentionInput").value = state.mention;
  $("sourceType").value = state.sourceType;
  $("authorFilter").value = state.author;
  $("dateFrom").value = state.dateFrom;
  $("dateTo").value = state.dateTo;
  $("searchMode").value = state.searchMode;
  $("sortMode").value = state.sort;
}

function syncUrl() {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    q: state.q,
    mention: state.mention,
    source_type: state.sourceType,
    author: state.author,
    date_from: state.dateFrom,
    date_to: state.dateTo,
    search_mode: state.searchMode === "all" ? "all" : "",
    sort: state.sort,
    offset: state.offset ? String(state.offset) : "",
  })) {
    if (value) params.set(key, value);
  }
  history.replaceState(null, "", params.toString() ? `?${params}` : location.pathname);
}

function restoreFromUrl() {
  const params = new URLSearchParams(location.search);
  state.q = params.get("q") || state.q;
  state.mention = params.get("mention") || "";
  state.sourceType = params.get("source_type") || "";
  state.author = params.get("author") || "";
  state.dateFrom = params.get("date_from") || "";
  state.dateTo = params.get("date_to") || "";
  state.searchMode = params.get("search_mode") || "any";
  state.sort = params.get("sort") || "relevance";
  state.offset = Number(params.get("offset") || 0);
}

async function loadStatus() {
  const data = await api("/api/status");
  const labels = {
    videos_in_scope: "In-scope TikToks",
    transcripts: "Raw transcripts",
    polished_transcripts: "Polished transcripts",
    claims: "Claims",
    local_files: "Local files",
    chunks: "Search chunks",
    queued_asr_jobs: "Needs ASR",
  };
  $("statusGrid").innerHTML = Object.entries(labels)
    .map(([key, label]) => `<div class="stat"><strong>${data[key] ?? 0}</strong><span>${label}</span></div>`)
    .join("");
}

async function loadAuthors() {
  const authors = await api("/api/authors");
  $("authorFilter").innerHTML =
    `<option value="">All authors</option>` +
    authors.map((a) => `<option value="${escapeHtml(a.creator_id)}">${escapeHtml(a.handle)}</option>`).join("");
  writeControls();
  $("authors").innerHTML = authors
    .map(
      (a) => `
      <button class="author" data-author="${escapeHtml(a.creator_id)}">
        ${avatar(a.handle, a.avatar_url)}
        <span>
          <strong>${escapeHtml(a.handle)}</strong>
          <span class="meta">${a.videos} videos · ${a.transcripts} transcripts · ${a.claims} claims</span>
        </span>
      </button>`
    )
    .join("");
  document.querySelectorAll("[data-author]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.author = btn.dataset.author;
      state.offset = 0;
      writeControls();
      runSearch();
    });
  });
}

async function loadTopics() {
  const topics = await api("/api/topics");
  $("topics").innerHTML = topics
    .map((t) => `<button class="topic" data-query="${escapeHtml(t.query)}">${escapeHtml(t.label)} · ${t.count}</button>`)
    .join("");
  document.querySelectorAll(".topic").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.q = btn.dataset.query;
      state.offset = 0;
      writeControls();
      runSearch();
    });
  });
}

function renderActiveFilters() {
  const filters = [
    ["q", state.searchMode === "all" ? "All keywords" : "Any keyword", state.q],
    ["mention", "Mention", state.mention],
    ["sourceType", "Source", sourceLabel(state.sourceType)],
    ["author", "Author", state.author],
    ["dateFrom", "From", state.dateFrom],
    ["dateTo", "To", state.dateTo],
  ].filter(([, , value]) => value && value !== "Source");
  $("activeFilters").innerHTML = filters
    .map(([key, label, value]) => `<button class="filter-chip" data-clear-filter="${key}">${label}: ${escapeHtml(value)} <span aria-hidden="true">x</span></button>`)
    .join("");
  document.querySelectorAll("[data-clear-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.clearFilter;
      if (key === "q") state.q = "";
      else if (key === "sourceType") state.sourceType = "";
      else state[key] = "";
      state.offset = 0;
      writeControls();
      runSearch();
    });
  });
}

function renderFacets(facets) {
  const sources = (facets?.source_types || []).slice(0, 6);
  const years = (facets?.years || []).filter((x) => x.value).slice(0, 8);
  const sourceHtml = sources.map((f) => `<button data-source="${escapeHtml(f.value)}">${escapeHtml(sourceLabel(f.value))}<span>${f.count}</span></button>`).join("");
  const yearHtml = years.map((f) => `<button data-year="${escapeHtml(f.value)}">${escapeHtml(f.value)}<span>${f.count}</span></button>`).join("");
  $("facets").innerHTML = `
    <div class="facet-group"><h3>Sources</h3>${sourceHtml || `<p class="meta">No source facets.</p>`}</div>
    <div class="facet-group"><h3>Years</h3>${yearHtml || `<p class="meta">No date facets.</p>`}</div>
  `;
  document.querySelectorAll("[data-source]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sourceType = btn.dataset.source;
      state.offset = 0;
      writeControls();
      runSearch();
    });
  });
  document.querySelectorAll("[data-year]").forEach((btn) => {
    state.offset = 0;
    btn.addEventListener("click", () => {
      state.dateFrom = `${btn.dataset.year}-01-01`;
      state.dateTo = `${btn.dataset.year}-12-31`;
      writeControls();
      runSearch();
    });
  });
}

async function runSearch() {
  readControls();
  const params = new URLSearchParams({
    q: state.q,
    mention: state.mention,
    source_type: state.sourceType,
    author: state.author,
    date_from: state.dateFrom,
    date_to: state.dateTo,
    search_mode: state.searchMode,
    sort: state.sort,
    limit: state.limit,
    offset: state.offset,
  });
  syncUrl();
  renderActiveFilters();
  $("results").innerHTML = `<p class="meta">Searching...</p>`;
  const data = await api(`/api/search?${params}`);
  $("resultTitle").textContent = state.q || state.mention ? "Matching passages" : "Latest passages";
  $("resultMeta").textContent = `${data.total} passages · ${state.limit} per page`;
  $("results").innerHTML = data.results.map(resultCard).join("") || `<div class="empty"><strong>No results found.</strong><p>Try removing one filter or broadening the date range.</p></div>`;
  $("prevBtn").disabled = state.offset === 0;
  $("nextBtn").disabled = state.offset + state.limit >= data.total;
  renderFacets(data.facets);
  document.querySelectorAll("[data-open]").forEach((btn) => btn.addEventListener("click", () => openItem(btn.dataset.open)));
}

function resultCard(r) {
  const handle = r.handle || r.author || "Base2026";
  const title = cleanText(r.title) || r.item_id;
  const date = r.published_at ? ` · ${formatDate(r.published_at)}` : "";
  const link = r.canonical_url || r.creator_url || "#";
  const author = r.creator_url
    ? `<a class="author-link" href="${escapeHtml(r.creator_url)}" target="_blank" rel="noreferrer">${escapeHtml(handle)}</a>`
    : `<strong>${escapeHtml(handle)}</strong>`;
  const titleStatus = r.title_status && r.title_status !== "ok" ? `<span class="title-state">${escapeHtml(r.title_status)}</span>` : "";
  return `
    <article class="result">
      <div class="result-top">
        ${avatar(handle, r.avatar_url)}
        <div>
          ${author}<span class="meta">${escapeHtml(date)}</span>
          <div class="meta result-meta-line"><span class="badge">${escapeHtml(sourceLabel(r.source_type))}</span> ${titleStatus} <a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Original source</a></div>
        </div>
      </div>
      <p class="snippet">${highlightText(cleanText(r.snippet))}</p>
      <details class="caption-preview">
        <summary>Platform caption</summary>
        <p>${highlightText(title)}</p>
      </details>
      <button class="ghost" data-open="${escapeHtml(r.item_id)}">Open source</button>
    </article>`;
}

async function openItem(itemId) {
  const data = await api(`/api/item?id=${encodeURIComponent(itemId)}`);
  const item = data.item;
  const handle = item.handle || item.author || "Base2026";
  const sourceUrl = item.canonical_url || item.creator_url || "#";
  const itemTitle = titleText(item);
  const authorHtml = item.creator_url
    ? `<a href="${escapeHtml(item.creator_url)}" target="_blank" rel="noreferrer">${escapeHtml(handle)}</a>`
    : escapeHtml(handle);
  const truncatedNote = item.title_is_truncated
    ? `<p class="source-warning">This platform title is still truncated in the collected metadata. Use the original source link for the canonical wording.</p>`
    : "";
  $("detailContent").innerHTML = `
    <div class="source-modal-head">
      <div>
        <div class="source-kicker">${escapeHtml(sourceLabel(item.source_type))} source</div>
        <h2 class="source-title">${escapeHtml(handle)} · ${escapeHtml(formatDate(item.published_at))}</h2>
        ${truncatedNote}
      </div>
      <button class="dialog-close" id="closeDialogInline">Close</button>
    </div>
    <div class="source-meta-grid">
      <div><span>Author</span><strong>${authorHtml}</strong></div>
      <div><span>Date</span><strong>${escapeHtml(formatDate(item.published_at))}</strong></div>
      <div><span>Claims</span><strong>${data.claims.length}</strong></div>
      <div><span>Title status</span><strong>${escapeHtml(titleStatusLabel(item))}</strong></div>
    </div>
    <div class="source-actions">
      <a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Open original source</a>
      <button class="ghost compact" id="copySourceLink" data-url="${escapeHtml(sourceUrl)}">Copy link</button>
    </div>
    <details class="modal-caption">
      <summary>Platform caption</summary>
      <p>${highlightText(itemTitle)}</p>
    </details>
    <h3>Transcript / source text</h3>
    <div class="source-text">${renderSourceText(data)}</div>
    ${data.claims.length ? `<h3>Claims</h3>${data.claims.map((c) => `<div class="claim"><strong>${escapeHtml(c.topic)}</strong><p>${escapeHtml(cleanText(c.claim_text))}</p><p class="meta">${escapeHtml(cleanText(c.suggested_action))}</p></div>`).join("")}` : ""}
  `;
  $("closeDialogInline").addEventListener("click", () => $("detailDialog").close());
  $("copySourceLink").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(event.currentTarget.dataset.url || "");
    event.currentTarget.textContent = "Copied";
  });
  $("detailDialog").showModal();
}

async function refreshTikTok() {
  $("refreshBtn").disabled = true;
  $("refreshBtn").textContent = "Refreshing...";
  await fetch("/api/refresh", { method: "POST" });
  const poll = async () => {
    const status = await api("/api/refresh");
    $("refreshBtn").disabled = Boolean(status.running);
    $("refreshBtn").textContent = status.running ? "Refreshing..." : "Refresh TikTok";
    const runner = status.runner || {};
    $("refreshState").textContent = `Refresh: ${runner.status || (status.running ? "running" : "idle")} · ${runner.stage || ""} · ${runner.message || ""}`;
    if (!status.running) {
      await loadStatus();
      await runSearch();
    } else {
      setTimeout(poll, 3000);
    }
  };
  setTimeout(poll, 1200);
}

function submitSearch() {
  state.offset = 0;
  runSearch();
}

$("searchBtn").textContent = "Search";
$("searchBtn").addEventListener("click", submitSearch);
$("clearBtn").addEventListener("click", () => {
  Object.assign(state, { q: "", mention: "", sourceType: "", author: "", dateFrom: "", dateTo: "", searchMode: "any", sort: "date_desc", offset: 0 });
  writeControls();
  runSearch();
});
["searchInput", "mentionInput"].forEach((id) => {
  $(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSearch();
  });
});
["searchMode", "sourceType", "authorFilter", "dateFrom", "dateTo", "sortMode"].forEach((id) => {
  $(id).addEventListener("change", submitSearch);
});
$("prevBtn").addEventListener("click", () => {
  state.offset = Math.max(0, state.offset - state.limit);
  runSearch();
});
$("nextBtn").addEventListener("click", () => {
  state.offset += state.limit;
  runSearch();
});
$("refreshBtn").addEventListener("click", refreshTikTok);
$("closeDialog").addEventListener("click", () => $("detailDialog").close());

restoreFromUrl();
Promise.all([loadStatus(), loadAuthors(), loadTopics()]).then(() => {
  writeControls();
  runSearch();
});

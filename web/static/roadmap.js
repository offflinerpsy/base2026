const roadmapData = {
  statuses: ["Live", "Completed - Built In-House", "In progress", "Next", "Planned", "Research"],
  phases: [
    {
      id: "phase-1",
      label: "Phase 1",
      shortLabel: "Trust",
      title: "Public Trust Foundation",
      lane: "Now",
      status: "Live",
      purpose: "Keep the public project understandable and accountable while the database grows.",
      explanation: "The public layer has a live search workspace, source records, creator/topic pages, methodology, source policy, privacy notes, and correction/removal paths.",
      quarter: "Public layer",
      milestones: [
        { title: "Public VPS deployment", status: "Completed - Built In-House" },
        { title: "Searchable knowledge base interface", status: "Live" },
        { title: "Initial database and attribution model", status: "Completed - Built In-House" },
        { title: "Public roadmap live", status: "Live" },
        { title: "Project story and mission published", status: "Live" },
        { title: "Privacy policy published", status: "Live" },
        { title: "Source and content policy published", status: "Live" },
        { title: "Creator correction/removal page published", status: "Live" },
      ],
    },
    {
      id: "phase-2",
      label: "Phase 2",
      shortLabel: "Ingestion",
      title: "Content Ingestion Pipeline",
      lane: "Now",
      status: "In progress",
      purpose: "Turn public creator videos into reviewed source text, searchable passages, and source-backed intelligence.",
      explanation: "The pipeline is live for reviewed public exports, but historical transcript QA, source-review debt, and automated handoff hardening are still active work.",
      quarter: "Pipeline track",
      milestones: [
        { title: "Local transcription and source-text pipeline", status: "Live" },
        { title: "Data cleanup and review workflow", status: "Live" },
        { title: "Backups and reproducible export rebuilds", status: "Completed - Built In-House" },
        { title: "TikTok intake handoff workflow", status: "In progress" },
        { title: "Source metadata model", status: "Completed - Built In-House" },
        { title: "Media/audio/video fallback logic", status: "In progress" },
        { title: "Reviewed public source-text export", status: "Live" },
        { title: "Evidence-gated insight-card extraction", status: "In progress" },
        { title: "Entity/topic cleanup", status: "In progress" },
        { title: "Historical transcript QA and source-review queue", status: "In progress" },
      ],
    },
    {
      id: "phase-3",
      label: "Phase 3",
      shortLabel: "Knowledge",
      title: "AI Knowledge Layer",
      lane: "Now",
      status: "Live",
      purpose: "Convert reviewed source text into summaries, topics, insight cards, and discovery paths.",
      explanation: "The public intelligence layer is live, with search, topic pages, analytics, public insight cards, and source-backed explanations. The remaining work is dedupe, QA, and better answer/compare surfaces.",
      quarter: "Intelligence track",
      milestones: [
        { title: "Base2026 source summaries", status: "Live" },
        { title: "Entity and topic clustering", status: "In progress" },
        { title: "Search and filtering", status: "Live" },
        { title: "Source-backed answer blocks", status: "In progress" },
        { title: "Source-backed public insight cards", status: "Live" },
        { title: "Confidence / verification labels", status: "Planned" },
        { title: "Internal linking between related entries", status: "Live" },
      ],
    },
    {
      id: "phase-4",
      label: "Phase 4",
      shortLabel: "Rights",
      title: "Creator & Rights Controls",
      lane: "Later",
      status: "In progress",
      purpose: "Give creators and source owners a clear way to correct, update, remove, or claim materials.",
      explanation: "The public correction/removal page is live. Creator claims, automated request processing, and a public changelog are still planned.",
      quarter: "Trust track",
      milestones: [
        { title: "Creator claim workflow", status: "Planned" },
        { title: "Creator correction/removal page", status: "Live" },
        { title: "Automated request processing workflow", status: "Planned" },
        { title: "Public change log", status: "Planned" },
        { title: "Source dispute review process", status: "Research" },
      ],
    },
    {
      id: "phase-5",
      label: "Phase 5",
      shortLabel: "Signals",
      title: "Analytics & Public Signals",
      lane: "Later",
      status: "Live",
      purpose: "Show what is in the database, what topics are visible, and where the source graph is growing.",
      explanation: "The public analytics page is live for database coverage and topic/source signals. Visitor-level analytics, search-demand signals, and most-viewed entries remain planned.",
      quarter: "Signals track",
      milestones: [
        { title: "Public database counters", status: "Live" },
        { title: "Most viewed knowledge entries", status: "Planned" },
        { title: "Source coverage metrics", status: "Live" },
        { title: "Content growth chart", status: "Live" },
        { title: "Search demand signals", status: "Research" },
      ],
    },
    {
      id: "phase-6",
      label: "Phase 6",
      shortLabel: "Revenue",
      title: "Monetization Layer",
      lane: "Later",
      status: "Research",
      purpose: "Turn the platform into a sustainable product without compromising trust.",
      explanation: "Commercial features come after governance and provenance so funding does not weaken the public trust model.",
      quarter: "Sustainability track",
      milestones: [
        { title: "Sponsorship / supporter model", status: "Research" },
        { title: "Premium research views", status: "Research" },
        { title: "API / data access model", status: "Research" },
        { title: "Partner pages", status: "Planned" },
        { title: "Public revenue rules", status: "Planned" },
        { title: "Transparent commercial policy", status: "Planned" },
      ],
    },
  ],
  priorities: {
    Now: [
      { title: "Public Trust Foundation", status: "Live" },
      { title: "Public VPS deployment", status: "Completed - Built In-House" },
      { title: "Searchable knowledge base interface", status: "Live" },
      { title: "Reviewed public source-text pages", status: "Live" },
      { title: "Public analytics and topic signals", status: "Live" },
    ],
    Next: [
      { title: "Content Ingestion Pipeline", status: "In progress" },
      { title: "TikTok intake handoff workflow", status: "In progress" },
      { title: "Evidence-gated insight-card review", status: "In progress" },
      { title: "Historical transcript QA and source-review queue", status: "In progress" },
    ],
    Later: [
      { title: "Creator claim workflow", status: "Planned" },
      { title: "Visitor/search analytics", status: "Planned" },
      { title: "Monetization Layer", status: "Research" },
      { title: "API / MCP data access", status: "Research" },
    ],
  },
  fundingTargets: [
    {
      title: "Trustworthy public layer",
      status: "Live",
      text: "Keep the public product accountable with source pages, policy pages, and correction paths.",
      items: ["Attribution", "Policies", "Opt-out/corrections", "Public roadmap"],
    },
    {
      title: "Reliable ingestion",
      status: "In progress",
      text: "Make new source intake repeatable without depending on private chat history or one-off manual work.",
      items: ["Source metadata", "Transcription", "Evidence gates", "Export workflow"],
    },
    {
      title: "Sustainable intelligence",
      status: "Research",
      text: "Improve AI discovery, analytics, and funding only after the source and trust model stays stable.",
      items: ["AI summaries", "Topic clustering", "Public signals", "Commercial rules"],
    },
  ],
};

let activePhaseId = roadmapData.phases[0].id;

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusSlug(status) {
  return String(status || "planned").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function statusLabel(status) {
  const raw = String(status || "Planned").trim();
  const normalized = raw.toLowerCase();
  if (normalized.includes("completed")) return "Done";
  if (normalized === "in progress") return "In progress";
  if (normalized === "research") return "Research";
  if (normalized === "planned") return "Planned";
  if (normalized === "live") return "Live";
  if (normalized === "next") return "Next";
  return raw;
}

function statusBadge(status) {
  const fullStatus = String(status || "Planned").trim();
  const label = statusLabel(fullStatus);
  return `<span class="status-badge status-${statusSlug(fullStatus)}" title="${esc(fullStatus)}" aria-label="Status: ${esc(fullStatus)}">${esc(label)}</span>`;
}

function list(items, limit = items.length) {
  return `<ul class="mini-list">${items.slice(0, limit).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function renderMilestones(milestones) {
  return `<div class="milestone-grid">${milestones.map((milestone) => `
    <article class="milestone-card">
      <div class="milestone-card__head">
        <h3>${esc(milestone.title)}</h3>
        ${statusBadge(milestone.status)}
      </div>
    </article>`).join("")}</div>`;
}

function getActivePhase() {
  return roadmapData.phases.find((phase) => phase.id === activePhaseId) || roadmapData.phases[0];
}

function renderTabs() {
  const target = document.querySelector("#phase-tabs");
  if (!target) return;
  target.innerHTML = roadmapData.phases
    .map((phase) => `
      <button class="phase-tab ${phase.id === activePhaseId ? "is-active" : ""}" type="button" data-phase="${phase.id}" aria-pressed="${phase.id === activePhaseId ? "true" : "false"}">
        <span>${esc(phase.label)}</span>
        <strong>${esc(phase.shortLabel)}</strong>
        <small>${esc(phase.status)} · ${phase.milestones.length} milestones</small>
      </button>`)
    .join("");
  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activePhaseId = button.dataset.phase;
      renderAll();
    });
  });
}

function renderFlow() {
  const target = document.querySelector("#roadmap-flow");
  if (!target) return;
  target.innerHTML = `
    <div class="phase-sequence" role="list" aria-label="Roadmap phase sequence">
      ${roadmapData.phases.map((phase, index) => `
        <button class="sequence-step ${phase.id === activePhaseId ? "is-active" : ""}" type="button" data-phase="${phase.id}" role="listitem" aria-pressed="${phase.id === activePhaseId ? "true" : "false"}">
          <span class="sequence-step__number">${String(index + 1).padStart(2, "0")}</span>
          <span class="sequence-step__body">
            <strong>${esc(phase.title)}</strong>
            <em>${esc(phase.lane)} · ${esc(phase.status)}</em>
            <small>${esc(phase.purpose)}</small>
          </span>
        </button>
      `).join("")}
    </div>`;
  target.querySelectorAll(".sequence-step").forEach((node) => {
    node.addEventListener("click", () => {
      activePhaseId = node.dataset.phase;
      renderAll();
    });
  });
}

function renderDetail() {
  const target = document.querySelector("#phase-detail");
  if (!target) return;
  const phase = getActivePhase();
  target.innerHTML = `
    <div class="phase-detail-card">
      <div class="detail-meta">
        <span class="pill pill-accent">${esc(phase.label)}</span>
        <span class="pill">${esc(phase.quarter)}</span>
        ${statusBadge(phase.status)}
      </div>
      <h2 class="phase-name">${esc(phase.title)}</h2>
      <p class="phase-purpose">${esc(phase.purpose)}</p>
      <p>${esc(phase.explanation)}</p>
      <h3>Milestones</h3>
      ${renderMilestones(phase.milestones)}
    </div>`;
}

function renderWorkload() {
  const target = document.querySelector("#workload-chart");
  if (!target) return;
  const max = Math.max(...roadmapData.phases.map((phase) => phase.milestones.length));
  target.innerHTML = roadmapData.phases.map((phase) => {
    const value = phase.milestones.length;
    return `<button class="bar-row ${phase.id === activePhaseId ? "is-active" : ""}" type="button" data-phase="${phase.id}">
      <span class="bar-label">${esc(phase.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.round((value / max) * 100)}%"></span></span>
      <span class="bar-value">${value}</span>
    </button>`;
  }).join("");
  target.querySelectorAll(".bar-row").forEach((row) => {
    row.addEventListener("click", () => {
      activePhaseId = row.dataset.phase;
      renderAll();
    });
  });
}

function renderFunding() {
  const target = document.querySelector("#funding-grid");
  if (!target) return;
  target.innerHTML = roadmapData.fundingTargets.map((item) => `
    <article class="funding-card">
      ${statusBadge(item.status)}
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.text)}</p>
      ${list(item.items)}
    </article>`).join("");
}

function renderPriorities() {
  const target = document.querySelector("#priority-stack");
  if (!target) return;
  target.innerHTML = Object.entries(roadmapData.priorities).map(([title, items]) => `
    <article class="priority-column">
      <span class="pill">${items.length} layers</span>
      <h3>${esc(title)}</h3>
      <ul class="mini-list priority-list">
        ${items.map((item) => `<li><span>${esc(item.title)}</span>${statusBadge(item.status)}</li>`).join("")}
      </ul>
    </article>`).join("");
}

function renderAll() {
  renderTabs();
  renderFlow();
  renderDetail();
  renderWorkload();
  renderFunding();
  renderPriorities();
  document.body.classList.add("roadmap-enhanced");
}

document.addEventListener("DOMContentLoaded", renderAll);

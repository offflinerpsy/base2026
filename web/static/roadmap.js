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
      purpose: "Make the project understandable and accountable before scaling.",
      explanation: "Before scaling the database, we publish the rules: what the project is, how content is sourced, how privacy is handled, and how creators can request corrections or opt out.",
      quarter: "Current public layer",
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
      lane: "Next",
      status: "In progress",
      purpose: "Turn raw public materials into structured, searchable knowledge entries.",
      explanation: "The ingestion layer keeps source metadata, media handling, transcription, cleanup, and review separate so public records can be traced and corrected.",
      quarter: "Build track",
      milestones: [
        { title: "Local transcription pipeline", status: "Completed - Built In-House" },
        { title: "Data cleanup and review workflow", status: "Completed - Built In-House" },
        { title: "Backups", status: "Completed - Built In-House" },
        { title: "Content submission / intake workflow", status: "In progress" },
        { title: "Source metadata model", status: "Completed - Built In-House" },
        { title: "Media/audio/video ingestion logic", status: "Research" },
        { title: "Transcription workflow", status: "Completed - Built In-House" },
        { title: "Evidence-gated insight-card extraction", status: "In progress" },
        { title: "Entity/topic cleanup", status: "In progress" },
        { title: "Moderation/review queue", status: "In progress" },
      ],
    },
    {
      id: "phase-3",
      label: "Phase 3",
      shortLabel: "Knowledge",
      title: "AI Knowledge Layer",
      lane: "Later",
      status: "Next",
      purpose: "Convert stored materials into usable answers, summaries, relationships, and discovery paths.",
      explanation: "The AI layer should only reason over approved records, keep citations visible, and avoid unsupported claims.",
      quarter: "Intelligence track",
      milestones: [
        { title: "AI-generated summaries", status: "Next" },
        { title: "Entity and topic clustering", status: "In progress" },
        { title: "Search and filtering", status: "Live" },
        { title: "Source-backed answer blocks", status: "Planned" },
        { title: "Source-backed public insight cards", status: "Live" },
        { title: "Confidence / verification labels", status: "Planned" },
        { title: "Internal linking between related entries", status: "In progress" },
      ],
    },
    {
      id: "phase-4",
      label: "Phase 4",
      shortLabel: "Rights",
      title: "Creator & Rights Controls",
      lane: "Later",
      status: "Planned",
      purpose: "Give creators and source owners a clear way to correct, update, remove, or claim materials.",
      explanation: "Rights controls are product features, not footnotes: they define how creators interact with the public database after discovery.",
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
      status: "Planned",
      purpose: "Show what is growing, what is being used, and where the platform has traction.",
      explanation: "Public signals should make growth and usage visible without inventing traction or exposing private operational data.",
      quarter: "Signals track",
      milestones: [
        { title: "Public usage counters", status: "Planned" },
        { title: "Most viewed knowledge entries", status: "Planned" },
        { title: "Source coverage metrics", status: "Planned" },
        { title: "Content growth chart", status: "Planned" },
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
      { title: "Public roadmap live", status: "Live" },
      { title: "Project story and mission published", status: "Live" },
      { title: "Privacy policy published", status: "Live" },
      { title: "Source and content policy published", status: "Live" },
      { title: "Creator correction/removal page published", status: "Live" },
    ],
    Next: [
      { title: "Content Ingestion Pipeline", status: "In progress" },
      { title: "Local transcription pipeline", status: "Completed - Built In-House" },
      { title: "Source metadata model", status: "Completed - Built In-House" },
      { title: "Transcription workflow", status: "Completed - Built In-House" },
      { title: "Evidence-gated insight-card review", status: "In progress" },
      { title: "Moderation/review queue", status: "In progress" },
    ],
    Later: [
      { title: "AI Knowledge Layer", status: "Next" },
      { title: "Creator & Rights Controls", status: "Planned" },
      { title: "Analytics & Public Signals", status: "Planned" },
      { title: "Monetization Layer", status: "Research" },
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
      text: "Explore AI discovery, analytics, and funding only after the source and trust model is stable.",
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
      ${statusBadge(milestone.status)}
      <h3>${esc(milestone.title)}</h3>
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

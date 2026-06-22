const roadmapData = {
  statuses: ["Live", "In progress", "Partial", "Next", "Planned", "Research"],
  phases: [
    {
      id: "phase-1",
      label: "Phase 1",
      shortLabel: "Trust",
      title: "Public Trust Foundation",
      lane: "Live",
      status: "Live",
      purpose: "Keep the public project understandable, attributable, and correctable while the database grows.",
      explanation: "Live: public search workspace, source records, creator/topic pages, methodology, source policy, privacy notes, support, and creator correction/removal path.",
      quarter: "Public layer",
      milestones: [
        { title: "Public VPS deployment", status: "Live" },
        { title: "Searchable knowledge base interface", status: "Live" },
        { title: "Source and content policy", status: "Live" },
        { title: "Methodology, privacy, support, and roadmap pages", status: "Live" },
        { title: "Creator correction/removal page", status: "Live" },
      ],
    },
    {
      id: "phase-2",
      label: "Phase 2",
      shortLabel: "Pipeline",
      title: "Reviewed Creator Intake",
      lane: "In progress",
      status: "In progress",
      purpose: "Publish only reviewed public rows while keeping uncertain transcripts, source-review rows, and private QA out of the public site.",
      explanation: "The pipeline works for reviewed exports, but historical source review, held-row triage, and safer handoff automation remain active work.",
      quarter: "Pipeline track",
      milestones: [
        { title: "Local discovery and import queue", status: "Live" },
        { title: "Reviewed public source-text export", status: "Live" },
        { title: "Creator avatar and metadata cleanup", status: "In progress" },
        { title: "Historical transcript/source-review queue", status: "In progress" },
        { title: "Safer release-gate defaults", status: "Next" },
      ],
    },
    {
      id: "phase-3",
      label: "Phase 3",
      shortLabel: "Intelligence",
      title: "Source Intelligence Layer",
      lane: "Live",
      status: "Live",
      purpose: "Turn reviewed source text into summaries, topics, insight cards, comparisons, and retrieval paths.",
      explanation: "Public insight cards, topics, source summaries, creator/source identity, and related-source paths are live. Next work is dedupe, copy quality, and stronger topic/playbook surfaces.",
      quarter: "Knowledge track",
      milestones: [
        { title: "Source summaries", status: "Live" },
        { title: "Public insight cards", status: "Live" },
        { title: "Creator, source, topic, and comparison pages", status: "Live" },
        { title: "Topic/card dedupe and copy-quality passes", status: "In progress" },
        { title: "Offline AI-assisted briefs with source verification", status: "Planned" },
      ],
    },
    {
      id: "phase-4",
      label: "Phase 4",
      shortLabel: "Rights",
      title: "Creator & Rights Controls",
      lane: "In progress",
      status: "Partial",
      purpose: "Give creators and source owners a clear path to correct, update, remove, or claim materials.",
      explanation: "Correction/removal is live. Creator claims, automated request processing, dispute review, and public changelog are still planned.",
      quarter: "Trust track",
      milestones: [
        { title: "Correction/removal page", status: "Live" },
        { title: "Creator claim workflow", status: "Planned" },
        { title: "Automated request processing", status: "Planned" },
        { title: "Public change log", status: "Planned" },
      ],
    },
    {
      id: "phase-5",
      label: "Phase 5",
      shortLabel: "Signals",
      title: "Signal Lab & Analytics",
      lane: "Live",
      status: "Live",
      purpose: "Show creator/topic overlap, topic momentum, coverage gaps, and deterministic source-backed playbooks.",
      explanation: "Signal Lab v1 is live. Next work is stronger workspace entry points, topic-page summaries, chart polish, and public payload/API stability.",
      quarter: "Signals track",
      milestones: [
        { title: "Signal Lab page", status: "Live" },
        { title: "Creator-topic matrix and topic momentum", status: "Live" },
        { title: "Deterministic query-to-playbook", status: "Live" },
        { title: "Coverage gaps", status: "Live" },
        { title: "Search/topic page integration", status: "Next" },
      ],
    },
    {
      id: "phase-6",
      label: "Phase 6",
      shortLabel: "Revenue",
      title: "Monetization & Private Signal Maps",
      lane: "Later",
      status: "Research",
      purpose: "Create sustainable offers without weakening attribution, creator trust, or the public/private boundary.",
      explanation: "No ads or banners are planned for the public knowledge layer. Future offers should be separate: private signal maps, AI visibility audits, watchlists, reports, or API access.",
      quarter: "Sustainability track",
      milestones: [
        { title: "Private signal-map offer", status: "Research" },
        { title: "AI visibility audit packaging", status: "Research" },
        { title: "Creator/source watchlists", status: "Research" },
        { title: "Read-only API access model", status: "Research" },
        { title: "Transparent commercial policy", status: "Planned" },
      ],
    },
  ],
  priorities: {
    Live: [
      { title: "Search workspace", status: "Live" },
      { title: "Source records and Source Intelligence", status: "Live" },
      { title: "Creator/topic/compare pages", status: "Live" },
      { title: "Signal Lab v1", status: "Live" },
      { title: "Public API/readability files", status: "Live" },
    ],
    "In progress": [
      { title: "Reviewed creator intake", status: "In progress" },
      { title: "Historical source review", status: "In progress" },
      { title: "Creator metadata cleanup", status: "In progress" },
      { title: "Signal Lab v2 integration", status: "Next" },
    ],
    Later: [
      { title: "Creator claim workflow", status: "Planned" },
      { title: "Offline AI briefs", status: "Planned" },
      { title: "Usage/search-demand analytics", status: "Planned" },
      { title: "Private signal-map offers", status: "Research" },
    ],
  },
  fundingTargets: [
    {
      title: "Live public product",
      status: "Live",
      text: "The current site is already useful: search, source records, creator/topic pages, Signal Lab, and trust pages.",
      items: ["Search", "Sources", "Topics", "Signal Lab"],
    },
    {
      title: "Gated source operations",
      status: "In progress",
      text: "New rows stay private until transcript/source text, topics, and public claims are reviewed.",
      items: ["Discovery", "Review", "Evidence gates", "Export"],
    },
    {
      title: "Future commercial layer",
      status: "Research",
      text: "Private reports and APIs come after the source layer remains stable, attributable, and safe.",
      items: ["Private maps", "Audits", "Watchlists", "API"],
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

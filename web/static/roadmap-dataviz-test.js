const roadmapData = {
  sourcePath: "docs/public-pages/01_ROADMAP.md",
  statuses: ["Live", "In progress", "Next", "Planned", "Research"],
  summary: {
    now: "Public Trust Foundation",
    next: "Content Ingestion Pipeline",
    later: "AI Knowledge Layer, Creator Controls, Analytics, Monetization"
  },
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
        { title: "Public roadmap live", status: "Live" },
        { title: "Project story and mission published", status: "Live" },
        { title: "Privacy policy published", status: "Live" },
        { title: "Source and content policy published", status: "Live" },
        { title: "Creator correction/removal page published", status: "Live" }
      ]
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
        { title: "Content submission / intake workflow", status: "In progress" },
        { title: "Source metadata model", status: "In progress" },
        { title: "Media/audio/video ingestion logic", status: "Research" },
        { title: "Transcription workflow", status: "In progress" },
        { title: "Summary and entity extraction", status: "Planned" },
        { title: "Moderation/review queue", status: "Planned" }
      ]
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
        { title: "Entity and topic clustering", status: "Next" },
        { title: "Search and filtering", status: "Live" },
        { title: "Source-backed answer blocks", status: "Planned" },
        { title: "Confidence / verification labels", status: "Planned" },
        { title: "Internal linking between related entries", status: "In progress" }
      ]
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
        { title: "Opt-out request handling", status: "Live" },
        { title: "Correction request handling", status: "Live" },
        { title: "Public change log", status: "Planned" },
        { title: "Source dispute review process", status: "Research" }
      ]
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
        { title: "Search demand signals", status: "Research" }
      ]
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
        { title: "Transparent commercial policy", status: "Planned" }
      ]
    }
  ],
  priorities: {
    Now: [
      "Public Trust Foundation",
      "Public roadmap live",
      "Source and content policy published",
      "Creator correction/removal page published"
    ],
    Next: [
      "Content Ingestion Pipeline",
      "Source metadata model",
      "Transcription workflow",
      "Moderation/review queue"
    ],
    Later: [
      "AI Knowledge Layer",
      "Creator Controls",
      "Analytics",
      "Monetization"
    ]
  },
  fundingTargets: [
    {
      title: "Trustworthy public layer",
      status: "Live",
      text: "Keep the public product accountable with source pages, policy pages, and correction paths.",
      items: ["Attribution", "Policies", "Opt-out/corrections", "Public roadmap"]
    },
    {
      title: "Reliable ingestion",
      status: "In progress",
      text: "Make new source intake repeatable without depending on private chat history or one-off manual work.",
      items: ["Source metadata", "Transcription", "Review queue", "Export workflow"]
    },
    {
      title: "Sustainable intelligence",
      status: "Research",
      text: "Explore AI discovery, analytics, and funding only after the source and trust model is stable.",
      items: ["AI summaries", "Topic clustering", "Public signals", "Commercial rules"]
    }
  ]
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

function statusBadge(status) {
  return `<span class="status-badge status-${statusSlug(status)}">${esc(status)}</span>`;
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
  target.innerHTML = roadmapData.phases
    .map((phase) => `<button class="phase-tab ${phase.id === activePhaseId ? "is-active" : ""}" type="button" data-phase="${phase.id}" aria-pressed="${phase.id === activePhaseId ? "true" : "false"}"><span>${esc(phase.label)}</span>${esc(phase.shortLabel)}</button>`)
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
  const width = 1120;
  const height = 288;
  const gap = 22;
  const cardWidth = 150;
  const y = 88;
  const nodes = roadmapData.phases.map((phase, index) => ({ ...phase, x: 28 + index * (cardWidth + gap), y }));
  const links = nodes.slice(0, -1).map((node, index) => {
    const next = nodes[index + 1];
    const x1 = node.x + cardWidth;
    const x2 = next.x;
    const cy = node.y + 54;
    return `<path class="phase-link" d="M ${x1} ${cy} C ${x1 + 28} ${cy}, ${x2 - 28} ${cy}, ${x2} ${cy}" />`;
  }).join("");
  const nodeMarkup = nodes.map((node) => `
    <g class="phase-node ${node.id === activePhaseId ? "is-active" : ""}" data-phase="${node.id}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="${esc(node.label)} ${esc(node.title)}">
      <rect width="${cardWidth}" height="108"></rect>
      <text x="14" y="27">${esc(node.label)}</text>
      <text x="14" y="53">${esc(node.shortLabel)}</text>
      <text x="14" y="78">${esc(node.status)}</text>
      <text x="14" y="98">${node.milestones.length} milestones</text>
    </g>`).join("");
  target.innerHTML = `<svg class="phase-flow" viewBox="0 0 ${width} ${height}" aria-label="Roadmap phase flow">${links}${nodeMarkup}</svg>`;
  target.querySelectorAll(".phase-node").forEach((node) => {
    const activate = () => {
      activePhaseId = node.dataset.phase;
      renderAll();
    };
    node.addEventListener("click", activate);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

function renderDetail() {
  const phase = getActivePhase();
  document.querySelector("#phase-detail").innerHTML = `
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
  const max = Math.max(...roadmapData.phases.map((phase) => phase.milestones.length));
  document.querySelector("#workload-chart").innerHTML = roadmapData.phases.map((phase) => {
    const value = phase.milestones.length;
    return `<button class="bar-row ${phase.id === activePhaseId ? "is-active" : ""}" type="button" data-phase="${phase.id}">
      <span class="bar-label">${esc(phase.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.round((value / max) * 100)}%"></span></span>
      <span class="bar-value">${value}</span>
    </button>`;
  }).join("");
  document.querySelectorAll(".bar-row").forEach((row) => {
    row.addEventListener("click", () => {
      activePhaseId = row.dataset.phase;
      renderAll();
    });
  });
}

function renderFunding() {
  document.querySelector("#funding-grid").innerHTML = roadmapData.fundingTargets.map((target) => `
    <article class="funding-card">
      ${statusBadge(target.status)}
      <h3>${esc(target.title)}</h3>
      <p>${esc(target.text)}</p>
      ${list(target.items)}
    </article>`).join("");
}

function renderPriorities() {
  document.querySelector("#priority-stack").innerHTML = Object.entries(roadmapData.priorities).map(([title, items]) => `
    <article class="priority-column">
      <span class="pill">${items.length} layers</span>
      <h3>${esc(title)}</h3>
      ${list(items)}
    </article>`).join("");
}

function renderAll() {
  renderTabs();
  renderFlow();
  renderDetail();
  renderWorkload();
  renderFunding();
  renderPriorities();
}

document.addEventListener("DOMContentLoaded", renderAll);

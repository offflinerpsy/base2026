let state = null,
  activeTab = "inputs",
  pending = false,
  reviewSubject = null;
const $ = (id) => document.getElementById(id);
const node = (tag, txt, cls) => {
  const e = document.createElement(tag);
  if (txt !== undefined) e.textContent = txt;
  if (cls) e.className = cls;
  return e;
};
function notice(message, error = false) {
  $("notice").textContent = message;
  $("notice").className = error ? "error" : "";
}
async function api(path, body) {
  const r = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  let d;
  try {
    d = await r.json();
  } catch {
    throw Error("Invalid service response");
  }
  if (!r.ok) {
    const messages = {
      approved_plan_missing_or_stale:
        "Approve the current exact plan before saving a brief or draft. Changed inputs need a new plan and approval.",
      brief_missing_or_stale:
        "Save a brief from the accepted plan before saving a draft.",
      version_conflict_reload:
        "This project changed in another request. Reload the saved project before retrying; your text is still in this form.",
      rights_hold: "Resolve all unknown or expired rights before approval.",
      export_rights_hold:
        "Source rights expired or changed during this request. Resolve the rights hold before downloading.",
      download_authority_changed:
        "The project changed during download. Reload it and check the current review and rights.",
      malformed_csv:
        "The CSV has malformed quotes or line endings. Use a valid CSV export without editing quoted fields.",
      invalid_gsc_date:
        "Use real calendar dates in YYYY-MM-DD format for the GSC period.",
      review_holds:
        "Resolve the listed claims, rights or stale input checks before review or export.",
      exact_review_required:
        "A human must approve this exact saved version before export.",
      author_cannot_self_review:
        "The reviewer declaration must differ from the author.",
      unsafe_html_refused:
        "Active HTML is refused. Supply plain text or HTML without scripts, forms, events or embedded content.",
      domain_not_allowlisted:
        "The URL must use this project\u2019s approved owned domain.",
      withdrawn_source_tombstone:
        "This withdrawn source cannot be restored or reissued.",
      invalid_or_oversized_text:
        "A field is empty, contains unsupported control characters, or exceeds its size limit.",
    };
    throw Error(messages[d.error] || d.error || "Service failed");
  }
  return d;
}
function fields(form) {
  return Object.fromEntries(new FormData(form));
}
function profile(f) {
  return {
    name: f.name,
    brand: {
      audience: f.audience,
      voice: f.voice,
      facts: f.facts,
      exclusions: f.exclusions,
    },
    topics: f.topics
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
  };
}
async function work(fn) {
  if (pending) return;
  pending = true;
  document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  try {
    await fn();
  } catch (e) {
    notice(e.message, true);
  } finally {
    pending = false;
    document.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
}
async function opFor(action, data) {
  const bytes = new TextEncoder().encode(JSON.stringify({ action, data }));
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
async function mutate(action, data = {}) {
  const payload = { ...data, expected_revision: state.project.revision };
  const result = await api(`/api/projects/${state.project.id}/${action}`, {
    ...payload,
    operation_id: await opFor(action, payload),
  });
  state = result;
  render(
    action === "draft" ||
      action === "brief" ||
      (action === "author" &&
        result.project.author_jobs.at(-1)?.state === "completed"),
  );
  notice(`${action} saved · revision ${state.project.revision}`);
  return result;
}
function tab(name) {
  activeTab = name;
  document
    .querySelectorAll(".tab")
    .forEach((el) => (el.hidden = el.id !== `tab-${name}`));
  document
    .querySelectorAll("[data-tab]")
    .forEach((el) =>
      el.dataset.tab === name
        ? el.setAttribute("aria-current", "step")
        : el.removeAttribute("aria-current"),
    );
}
async function projects() {
  const r = await api("/api/projects");
  $("projects").replaceChildren();
  for (const p of r.projects) {
    const b = node("button", p.name, "project-button");
    b.onclick = () =>
      work(async () => {
        state = await api(`/api/projects/${p.id}`);
        render(true);
        notice("Saved project loaded");
      });
    $("projects").append(b);
  }
}
function fill(form, data) {
  for (const [k, v] of Object.entries(data)) {
    const el = form.elements.namedItem(k);
    if (el) el.value = v;
  }
}
const collectionFields = {
  internal_links: [
    ["label", "Link label"],
    ["url", "Owned page URL", "url"],
  ],
  claims: [
    ["text", "Factual claim"],
    ["source_id", "Supporting source", "source"],
    ["status", "Claim status", "claim-status"],
    ["note", "Verification note"],
  ],
  media: [
    ["url", "Owned media URL", "url"],
    ["alt", "Accessible description"],
    ["rights", "Reuse rights", "rights"],
    ["proof", "Rights basis"],
  ],
};
function collectionEditor(kind, values = []) {
  const root = $(kind + "-editor");
  root.replaceChildren();
  const sync = () => {
    $("draft-form").elements.namedItem(kind).value = JSON.stringify(
      [...root.children].map((row) =>
        Object.fromEntries(
          [...row.querySelectorAll("[data-field]")].map((el) => [
            el.dataset.field,
            el.value,
          ]),
        ),
      ),
    );
  };
  for (const value of values) {
    const row = node("div", undefined, "array-row");
    for (const [key, labelText, type] of collectionFields[kind]) {
      const label = node("label", labelText);
      let input;
      if (["source", "claim-status", "rights"].includes(type)) {
        input = node("select");
        let options =
          type === "source"
            ? (state?.project.sources
                .filter((s) => s.rights !== "withdrawn")
                .map((s) => [s.id, s.title]) ?? [])
            : type === "claim-status"
              ? [
                  ["unresolved", "Unresolved — holds review"],
                  ["verified", "Verified by human, with note"],
                ]
              : [
                  ["unknown", "Unknown — holds review"],
                  ["owned", "Owned"],
                  ["licensed", "Licensed"],
                ];
        if (type === "source" && !options.length)
          options = [["", "Supply a source first"]];
        for (const [v, label] of options) {
          const option = node("option", label);
          option.value = v;
          input.append(option);
        }
      } else {
        input = node(
          key === "note" || key === "text" || key === "proof"
            ? "textarea"
            : "input",
        );
        if (type === "url") input.type = "url";
      }
      input.dataset.field = key;
      if (value[key] !== undefined) input.value = value[key];
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
      label.append(input);
      row.append(label);
    }
    const remove = node("button", "Remove record", "secondary");
    remove.type = "button";
    remove.onclick = () => {
      row.remove();
      sync();
    };
    row.append(remove);
    root.append(row);
  }
  sync();
}
document.querySelectorAll("[data-add]").forEach(
  (button) =>
    (button.onclick = () => {
      const kind = button.dataset.add;
      const existing = JSON.parse(
        $("draft-form").elements.namedItem(kind).value,
      );
      const limit = kind === "claims" ? 40 : 12;
      if (existing.length >= limit) {
        notice("Record limit reached", true);
        return;
      }
      collectionEditor(kind, [...existing, {}]);
    }),
);
function render(resetDraft = false) {
  const p = state.project;
  const latestAuthor = p.author_jobs.at(-1);
  $("adapter-reasons").replaceChildren(
    ...state.azure.reasons.map((r) => node("li", r)),
  );
  $("author").textContent =
    state.azure.state === "ready"
      ? "Request approved Azure draft"
      : "Check Azure author gate";
  $("adapter-state").textContent =
    state.azure.state === "ready"
      ? "READY FOR APPROVED REQUEST"
      : latestAuthor?.state === "completed"
        ? "DRAFT RECEIVED"
        : latestAuthor?.state === "uncertain_cost"
          ? "RECONCILIATION REQUIRED"
          : "ACTIVATION GATED";
  $("adapter-note").textContent =
    state.azure.state === "ready"
      ? "Server approval, credential binding and service reservation gates are satisfied. No request is sent by this readiness check."
      : latestAuthor?.request_sent
        ? "Provider request recorded. Review the exact saved candidate before export; uncertain sends never retry automatically."
        : "Direct adapter implemented. No provider request has been sent for this project.";
  const subject = p.id + ":" + (state.review_hash || "");
  if (subject !== reviewSubject) {
    $("review-form").reset();
    $("plan-approval-form").reset();
    $("source-form").reset();
    $("receipt-list").textContent = "";
    reviewSubject = subject;
  }
  $("create-panel").hidden = true;
  $("project-panel").hidden = false;
  $("project-name").textContent = p.name;
  $("project-scope").textContent =
    `${p.domain} · supplied inputs · revision ${p.revision}`;
  const approved =
    p.review &&
    p.review.hash === state.review_hash &&
    !state.checks.holds.length;
  const exported =
    approved &&
    p.exports.some((e) => e.review.receipt_hash === p.review.receipt_hash);
  $("state").textContent = exported
    ? "Export ready"
    : approved
      ? "Approved version"
      : {
          ready_for_human_review: "Ready for review",
          needs_input: "Needs input",
          rights_hold: "Rights hold",
        }[state.checks.state] || state.checks.state;
  fill($("profile-form"), {
    name: p.name,
    ...p.brand,
    topics: p.topics.join("\n"),
  });
  $("sources").replaceChildren();
  for (const s of p.sources) {
    const box = node("div", undefined, "source");
    box.append(
      node("strong", s.title),
      node("p", `${s.kind} · ${s.rights} · ${s.attribution}`, "small"),
      node("div", s.id, "mono"),
    );
    const detail = node("details");
    detail.append(
      node("summary", "Inspect saved source & provenance"),
      node("pre", JSON.stringify(s, null, 2)),
    );
    box.append(detail);
    if (s.rights !== "withdrawn") {
      const b = node("button", "Withdraw source", "secondary");
      b.onclick = () => work(() => mutate("withdraw", { source_id: s.id }));
      box.append(b);
      if (s.rights === "unknown") {
        const form = node("form");
        const select = node("select");
        select.name = "rights";
        for (const value of ["owned", "licensed"]) {
          const option = node("option", value);
          option.value = value;
          select.append(option);
        }
        const label = node("label", "Resolved source rights");
        label.append(select);
        const basis = node("input");
        basis.name = "permitted_use";
        basis.required = true;
        basis.value = s.permitted_use;
        const basisLabel = node("label", "Confirmed rights basis");
        basisLabel.append(basis);
        const submit = node("button", "Record rights & invalidate approvals");
        form.append(label, basisLabel, submit);
        form.onsubmit = (e) => {
          e.preventDefault();
          work(() =>
            mutate("source-rights", {
              source_id: s.id,
              ...fields(form),
              attribution: s.attribution,
            }),
          );
        };
        box.append(form);
      }
    }
    $("sources").append(box);
  }
  $("plan").replaceChildren();
  $("plan-approval-form").hidden = !p.plan;
  $("brief-form").hidden = !p.plan_approval;
  if (p.plan) {
    $("plan").append(
      node("p", `Plan SHA ${p.plan.hash}`, "mono"),
      node(
        "p",
        p.plan_approval ? "Exact plan accepted" : "Needs exact plan approval",
        "small",
      ),
    );
    for (const c of p.plan.candidates) {
      const box = node("div", undefined, "candidate");
      box.append(
        node("strong", c.topic),
        node("p", c.intent),
        node("p", `Demand: ${c.demand} · ${c.existing_url_notes}`, "small"),
      );
      for (const u of c.existing_urls)
        box.append(node("p", `${u.title} · ${u.url}`, "small"));
      $("plan").append(box);
    }
    const detail = node("details");
    detail.append(
      node("summary", "Evidence ledger & exact saved plan"),
      node("pre", JSON.stringify(p.plan, null, 2)),
    );
    $("plan").append(detail);
    $("candidate-select").replaceChildren(
      ...p.plan.candidates.map((c) => {
        const o = node("option", c.topic);
        o.value = c.id;
        return o;
      }),
    );
  }
  $("brief").replaceChildren();
  if (p.brief) {
    $("brief").append(
      node("h3", "Saved brief"),
      node("pre", JSON.stringify(p.brief, null, 2)),
    );
  }
  const v = p.versions.find((v) => v.id === p.current_version_id);
  if (resetDraft && !v) {
    $("draft-form").reset();
    for (const kind of Object.keys(collectionFields))
      collectionEditor(kind, []);
  }
  if (v && resetDraft) {
    const d = v.packet;
    fill($("draft-form"), {
      author: d.provenance.author,
      provenance:
        d.provenance.kind === "azure_generated"
          ? "human_imported"
          : d.provenance.kind,
      title: d.title,
      description: d.description,
      body: d.body,
      internal_links: JSON.stringify(d.internal_links, null, 2),
      claims: JSON.stringify(d.claims, null, 2),
      media: JSON.stringify(d.media, null, 2),
    });
    for (const kind of Object.keys(collectionFields))
      collectionEditor(kind, d[kind]);
  }
  $("versions").replaceChildren();
  for (const v of p.versions) {
    const el = node("details", undefined, "version");
    el.append(
      node(
        "summary",
        `Version ${v.sequence} · ${v.packet.provenance.kind} · ${v.packet.provenance.author}`,
      ),
      node("pre", JSON.stringify(v, null, 2)),
    );
    $("versions").append(el);
  }
  $("author-status").replaceChildren();
  for (const j of p.author_jobs.slice(-1))
    $("author-status").append(
      node("p", `${j.state.toUpperCase()} · ${j.reasons.join("; ")}`, "small"),
    );
  $("checks").replaceChildren(
    node(
      "p",
      state.checks.holds.length
        ? "Review is held until these checks are resolved."
        : "Structural checks are ready. Human semantic review remains a separate decision.",
    ),
  );
  const holdLabels = {
    draft_missing: "Save a draft for the selected brief.",
    draft_binding_stale:
      "Save a new draft from the current accepted plan and brief.",
    unresolved_claims: "Resolve the factual claims before review.",
    missing_media_rights: "Record confirmed rights for every media reference.",
  };
  for (const h of state.checks.holds) {
    const message = h.startsWith("expired_source_rights:")
      ? "A source permission expired. Supply a currently permitted source."
      : h.startsWith("unknown_source_rights:")
        ? "A source needs a confirmed rights basis."
        : holdLabels[h] || h;
    $("checks").append(node("p", message, "hold"));
  }
  for (const w of state.checks.warnings)
    $("checks").append(node("p", w, "small"));
  $("content-preview").replaceChildren();
  if (v) {
    $("content-preview").append(
      node("h3", v.packet.title),
      node("p", v.packet.description),
      node("div", v.packet.body),
    );
    for (const l of v.packet.internal_links) {
      const a = node("a", l.label);
      a.href = l.url;
      a.rel = "noreferrer";
      const paragraph = node("p");
      paragraph.append(a);
      $("content-preview").append(paragraph);
    }
  }
  $("review-ledgers").replaceChildren();
  if (v) {
    const root = $("review-ledgers");
    root.append(node("h3", "Claims & supporting sources"));
    if (!v.packet.claims.length)
      root.append(
        node("p", "No claims declared; confirm ledger completeness.", "small"),
      );
    for (const claim of v.packet.claims) {
      const source = p.sources.find((s) => s.id === claim.source_id);
      root.append(
        node(
          "p",
          `${claim.text} — ${claim.status}; ${source?.title ?? claim.source_id}. ${claim.note}`,
          "small",
        ),
      );
    }
    root.append(node("h3", "Media rights"));
    if (!v.packet.media.length)
      root.append(node("p", "No media declared.", "small"));
    for (const asset of v.packet.media)
      root.append(
        node(
          "p",
          `${asset.alt} — ${asset.rights}: ${asset.proof} · ${asset.url}`,
          "small",
        ),
      );
    const details = node("details");
    details.append(node("summary", "Source rights & attribution"));
    for (const source of p.sources.filter((s) => s.rights !== "withdrawn"))
      details.append(
        node(
          "p",
          `${source.title} — ${source.rights}; ${source.attribution}. Permitted use: ${source.permitted_use}`,
          "small",
        ),
      );
    root.append(details);
  }
  $("review-binding").textContent = state.review_hash
    ? `Exact review SHA ${state.review_hash}`
    : "Save a draft before review.";
  $("review-receipt").textContent = p.review
    ? `Reviewed by ${p.review.reviewer} · ${p.review.reviewed_at} · local human declaration (identity unverified)`
    : "No current review approval.";
  $("exports").replaceChildren();
  for (const exp of p.exports) {
    const box = node("div", undefined, "export");
    box.append(
      node(
        "strong",
        `Export · version ${p.versions.find((v) => v.id === exp.version_id)?.sequence}`,
      ),
      node("div", exp.manifest_hash, "mono"),
    );
    const valid =
      p.review &&
      exp.review_hash === state.review_hash &&
      exp.review.receipt_hash === p.review.receipt_hash &&
      !state.checks.holds.length;
    if (!valid)
      box.append(
        node(
          "p",
          "Historical export: current approval invalidated. Downloads are held.",
          "hold",
        ),
      );
    for (const format of ["html", "md", "json", "manifest"]) {
      const a = node(
        "a",
        format === "manifest" ? "SHA manifest" : format.toUpperCase(),
      );
      a.href = `/api/projects/${p.id}/downloads/${exp.manifest_hash}/${format}`;
      a.setAttribute("download", "");
      if (!valid) {
        a.removeAttribute("href");
        a.setAttribute("aria-disabled", "true");
      }
      box.append(a);
    }
    $("exports").append(box);
  }
  tab(activeTab);
}
$("new-project").onclick = () => {
  $("create-panel").hidden = false;
  $("project-panel").hidden = true;
  state = null;
  notice("Create a separate rights-scoped project");
};
$("create-form").onsubmit = (e) => {
  e.preventDefault();
  work(async () => {
    const f = fields(e.target);
    const payload = {
      ...profile(f),
      domain: f.domain,
      domain_authorization: "operator_owned_domain",
    };
    state = await api("/api/projects", {
      ...payload,
      operation_id: await opFor("create", payload),
    });
    render(true);
    await projects();
    notice("Project saved. Add a source to start planning.");
  });
};
$("source-form").onsubmit = (e) => {
  e.preventDefault();
  work(async () => {
    const f = fields(e.target);
    const b = {
      ...f,
      expires_at: f.expires_at ? `${f.expires_at}T23:59:59.000Z` : null,
    };
    if (f.kind === "gsc")
      b.provenance = {
        provider: "google_search_console",
        authorization: "operator_supplied_authorized_snapshot",
        property: f.property,
        start_date: f.start_date,
        end_date: f.end_date,
        country: f.country,
        device: f.device,
        search_type: f.search_type,
      };
    await mutate("sources", b);
    e.target.reset();
  });
};
$("profile-form").onsubmit = (e) => {
  e.preventDefault();
  work(async () => {
    await mutate("profile", profile(fields(e.target)));
    await projects();
  });
};
$("save-plan").onclick = () => work(() => mutate("plan"));
$("plan-approval-form").onsubmit = (e) => {
  e.preventDefault();
  work(() =>
    mutate("approve-plan", {
      plan_hash: state.project.plan.hash,
      reviewer: fields(e.target).reviewer,
    }),
  );
};
$("brief-form").onsubmit = (e) => {
  e.preventDefault();
  work(() => mutate("brief", fields(e.target)));
};
$("draft-form").onsubmit = (e) => {
  e.preventDefault();
  work(async () => {
    const f = fields(e.target);
    for (const k of ["internal_links", "claims", "media"]) {
      try {
        f[k] = JSON.parse(f[k]);
      } catch {
        throw Error(`${k}: enter a valid JSON array`);
      }
    }
    await mutate("draft", f);
  });
};
$("author").onclick = () =>
  work(async () => {
    notice(
      "Checking exact Azure approval and budget. A permitted generation may take up to 90 seconds.",
    );
    await mutate("author");
  });
$("review-form").onsubmit = (e) => {
  e.preventDefault();
  work(() => {
    const f = fields(e.target);
    return mutate("review", {
      reviewer: f.reviewer,
      note: f.note,
      version_id: state.project.current_version_id,
      review_hash: state.review_hash,
      attestations: Object.fromEntries(
        ["facts", "rights", "brand", "claims_complete"].map((k) => [
          k,
          f[k] === "on",
        ]),
      ),
    });
  });
};
$("export").onclick = () => work(() => mutate("export"));
$("receipts").onclick = () =>
  work(async () => {
    $("receipt-list").textContent = JSON.stringify(
      await api(`/api/projects/${state.project.id}/receipts`),
      null,
      2,
    );
  });
document
  .querySelectorAll("[data-tab]")
  .forEach((b) => (b.onclick = () => tab(b.dataset.tab)));
work(async () => {
  const status = await api("/api/status");
  $("adapter-reasons").replaceChildren(
    ...status.azure.reasons.map((r) => node("li", r)),
  );
  await projects();
  const saved = new URL(location.href).searchParams.get("project");
  if (saved) {
    state = await api(`/api/projects/${saved}`);
    render(true);
  }
  notice(
    "Local service ready. Check the project author gate for current provider readiness.",
  );
});

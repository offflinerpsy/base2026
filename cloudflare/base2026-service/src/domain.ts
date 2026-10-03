export const SCHEMA = "base2026.service.packet.v1";
export const WORKSPACE = "operator";
export class Fault extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function requireThat(
  ok: unknown,
  code: string,
  status = 400,
): asserts ok {
  if (!ok) throw new Fault(code, status);
}
export function text(v: unknown, max = 500, empty = false): string {
  requireThat(typeof v === "string", "text_required");
  const s = v.trim();
  requireThat(
    (empty || s.length > 0) &&
      new TextEncoder().encode(s).length <= max &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e]/u.test(s),
    "invalid_or_oversized_text",
  );
  return s;
}
export function list(v: unknown, max: number): any[] {
  requireThat(Array.isArray(v) && v.length <= max, "invalid_list");
  return v;
}
export function canonical(v: any): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v !== null && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export async function sha(value: string): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export const hash = (v: any) => sha(canonical(v));
export const now = () => new Date().toISOString();
export function domain(v: unknown): string {
  const d = text(v, 200).toLowerCase();
  requireThat(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d) &&
      !/(?:^|\.)(localhost|local|internal|test|invalid)$/.test(d),
    "public_domain_required",
  );
  return d;
}
export function safeURL(v: unknown, owned?: string): string {
  const s = text(v, 1200);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Fault("unsafe_url");
  }
  requireThat(
    u.protocol === "https:" && !u.username && !u.password && !u.port && !u.hash,
    "unsafe_url",
  );
  domain(u.hostname);
  requireThat(!owned || u.hostname === owned, "domain_not_allowlisted");
  return u.href;
}
export interface Source {
  id: string;
  title: string;
  kind: "text" | "html" | "csv" | "gsc";
  content: string;
  url: string | null;
  sha256: string;
  raw_sha256: string;
  supplied_at: string;
  permitted_use: string;
  attribution: string;
  rights: "owned" | "licensed" | "unknown" | "withdrawn";
  expires_at: string | null;
  withdrawn_at: string | null;
  provenance: any;
  inventory: { url: string; title: string }[];
}
export interface Version {
  id: string;
  sequence: number;
  order_id: string;
  plan_hash: string;
  binding_hash: string;
  packet: any;
  payload_hash: string;
  saved_at: string;
}
export interface Project {
  schema_version: string;
  id: string;
  revision: number;
  name: string;
  domain: string;
  created_at: string;
  brand: { voice: string; audience: string; facts: string; exclusions: string };
  topics: string[];
  sources: Source[];
  plans: any[];
  plan_approvals: any[];
  review_receipts: any[];
  plan: any | null;
  plan_approval: any | null;
  brief: any | null;
  versions: Version[];
  current_version_id: string | null;
  review: any | null;
  exports: any[];
  author_jobs: any[];
}
export function parseBrand(b: any): Project["brand"] {
  requireThat(b && typeof b === "object", "brand_required");
  return {
    voice: text(b.voice, 1200),
    audience: text(b.audience, 600),
    facts: text(b.facts ?? "", 3000, true),
    exclusions: text(b.exclusions ?? "", 1200, true),
  };
}
export function topics(v: unknown): string[] {
  const a = list(v, 12).map((x) => text(x, 180));
  requireThat(
    a.length > 0 && new Set(a).size === a.length,
    "unique_topics_required",
  );
  return a;
}
export function csvRows(s: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  const field = () => {
    row.push(cell);
    cell = "";
    closed = false;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) {
        quoted = false;
        closed = true;
      } else {
        requireThat(cell.length === 0 && !closed, "malformed_csv");
        quoted = true;
      }
    } else if (c === "," && !quoted) field();
    else if (c === "\n" && !quoted) {
      field();
      rows.push(row);
      row = [];
    } else if (c === "\r" && !quoted)
      requireThat(s[i + 1] === "\n", "malformed_csv");
    else {
      requireThat(!closed, "malformed_csv");
      cell += c;
    }
  }
  requireThat(!quoted, "malformed_csv");
  if (cell || row.length || closed) {
    field();
    rows.push(row);
  }
  requireThat(rows.length <= 101 && rows.length > 0, "csv_row_limit");
  return rows;
}
export function gscInput(content: string, provenance: any, owned: string): any {
  requireThat(
    provenance?.provider === "google_search_console" &&
      provenance?.authorization === "operator_supplied_authorized_snapshot",
    "gsc_provenance_required",
  );
  const property = text(provenance.property, 300);
  requireThat(
    property.startsWith("sc-domain:")
      ? property === `sc-domain:${owned}`
      : safeURL(property, owned) === `https://${owned}/`,
    "gsc_property_scope",
  );
  const date = (s: any) => {
    const t = text(s, 10);
    requireThat(
      /^\d{4}-\d{2}-\d{2}$/.test(t) &&
        Number.isFinite(Date.parse(t)) &&
        new Date(t).toISOString().slice(0, 10) === t,
      "invalid_gsc_date",
    );
    return t;
  };
  const start_date = date(provenance.start_date),
    end_date = date(provenance.end_date);
  requireThat(start_date <= end_date, "invalid_gsc_period");
  const filters = {
    country: text(provenance.country, 80),
    device: text(provenance.device, 40),
    search_type: text(provenance.search_type, 40),
  };
  const rows = csvRows(content);
  requireThat(
    canonical(rows[0]) ===
      canonical(["query", "page", "clicks", "impressions", "position"]),
    "gsc_csv_header",
  );
  const seen = new Set<string>();
  const data = rows
    .slice(1)
    .filter((r) => r.some(Boolean))
    .map((r) => {
      requireThat(r.length === 5, "gsc_row_shape");
      const query = text(r[0], 300),
        page = safeURL(r[1], owned);
      const key = query + "\n" + page;
      requireThat(!seen.has(key), "duplicate_gsc_row");
      seen.add(key);
      const n = r.slice(2).map((x) => {
        requireThat(
          x.trim() !== "" && /^\d+(?:\.\d+)?$/.test(x),
          "gsc_metric_invalid",
        );
        return Number(x);
      });
      requireThat(
        n.every(Number.isFinite) &&
          Number.isSafeInteger(n[0]) &&
          Number.isSafeInteger(n[1]) &&
          n[0] <= n[1] &&
          n[2] >= 0,
        "gsc_metric_invalid",
      );
      return {
        query,
        page,
        clicks: n[0],
        impressions: n[1],
        position: n[2],
        ctr: n[1] === 0 ? null : n[0] / n[1],
      };
    });
  requireThat(data.length > 0, "gsc_rows_required");
  return {
    provider: "google_search_console",
    authorization: provenance.authorization,
    property,
    start_date,
    end_date,
    ...filters,
    classification: "OBSERVED_EXPORT",
    rows: data,
    search_volume: "UNKNOWN",
  };
}
export async function sourceInput(b: any, p: Project): Promise<Source> {
  requireThat(
    ["text", "html", "csv", "gsc"].includes(b.kind),
    "source_kind_invalid",
  );
  requireThat(
    typeof b.content === "string" &&
      new TextEncoder().encode(b.content).length <= 16000,
    "invalid_or_oversized_text",
  );
  let content = text(b.content, 16000);
  const title = text(b.title, 180);
  const rights = b.rights;
  requireThat(
    ["owned", "licensed", "unknown"].includes(rights),
    "source_rights_required",
  );
  const permitted_use = text(b.permitted_use, 600),
    attribution = text(b.attribution, 500);
  const url = b.url ? safeURL(b.url, p.domain) : null;
  let expires_at: string | null = null;
  if (b.expires_at) {
    expires_at = text(b.expires_at, 30);
    requireThat(
      Number.isFinite(Date.parse(expires_at)) &&
        Date.parse(expires_at) > Date.now(),
      "invalid_rights_expiry",
    );
  }
  let inventory: { url: string; title: string }[] = [];
  let provenance: any = {
    method: "operator_supplied",
    inspected_website: false,
  };
  if (b.kind === "html") {
    // Supplied HTML is data only. Active markup is refused, never inserted into a DOM or fetched.
    requireThat(
      !/<\s*(?:script|iframe|object|embed|svg|math|form|base|link|meta)\b|\bon\w+\s*=|javascript\s*:|data\s*:/i.test(
        content,
      ),
      "unsafe_html_refused",
    );
    const pageTitle =
      content.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || title;
    if (url) inventory.push({ url, title: pageTitle.slice(0, 180) });
    content = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    requireThat(content, "empty_html");
  }
  if (b.kind === "csv") {
    const rows = csvRows(content);
    requireThat(
      canonical(rows[0]) === canonical(["url", "title"]),
      "inventory_csv_header",
    );
    inventory = rows
      .slice(1)
      .filter((r) => r.some(Boolean))
      .map((r) => {
        requireThat(r.length === 2, "inventory_row_shape");
        return { url: safeURL(r[0], p.domain), title: text(r[1], 180) };
      });
    requireThat(
      new Set(inventory.map((r) => r.url)).size === inventory.length,
      "duplicate_inventory_url",
    );
  }
  if (b.kind === "gsc") provenance = gscInput(content, b.provenance, p.domain);
  if (b.kind === "text" && url) inventory.push({ url, title });
  const rawHash = await sha(b.content);
  const data = {
    title,
    kind: b.kind,
    content,
    url,
    permitted_use,
    attribution,
    rights,
    expires_at,
    provenance,
    inventory,
    raw_sha256: rawHash,
  };
  const sha256 = await hash(data);
  return {
    id: sha256.slice(0, 24),
    ...data,
    sha256,
    supplied_at: now(),
    withdrawn_at: null,
  };
}
export async function binding(p: Project): Promise<string> {
  return hash({
    schema: SCHEMA,
    project: p.id,
    domain: p.domain,
    brand: p.brand,
    topics: p.topics,
    sources: p.sources
      .map((s) => ({
        id: s.id,
        sha256: s.sha256,
        content: s.content,
        url: s.url,
        title: s.title,
        permitted_use: s.permitted_use,
        attribution: s.attribution,
        rights: s.rights,
        expires_at: s.expires_at,
        withdrawn_at: s.withdrawn_at,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  });
}
export function sourceHolds(p: Project): string[] {
  return p.sources
    .filter((s) => s.rights !== "withdrawn")
    .flatMap((s) =>
      s.rights === "unknown"
        ? [`unknown_source_rights:${s.id}`]
        : s.expires_at && Date.parse(s.expires_at) <= Date.now()
          ? [`expired_source_rights:${s.id}`]
          : [],
    );
}
export async function makePlan(p: Project): Promise<any> {
  requireThat(
    p.sources.some((s) => s.rights !== "withdrawn"),
    "needs_input",
    422,
  );
  const inventory = p.sources
    .filter((s) => s.rights !== "withdrawn")
    .flatMap((s) => s.inventory)
    .slice(0, 100);
  const evidence = p.sources
    .filter((s) => s.rights !== "withdrawn")
    .map((s) => ({
      source_id: s.id,
      title: s.title,
      source_sha256: s.sha256,
      input_sha256: s.raw_sha256,
      supplied_at: s.supplied_at,
      url: s.url,
      expires_at: s.expires_at,
      attribution: s.attribution,
      permitted_use: s.permitted_use,
      rights: s.rights,
      provenance: s.provenance,
      classification:
        s.kind === "gsc" ? "export_observation" : "supplied_brand_input",
    }));
  const candidates = await Promise.all(
    p.topics.map(async (t, i) => {
      const words = t
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);
      const conflicts = inventory.filter((r) =>
        words.some(
          (w) =>
            r.title.toLowerCase().includes(w) ||
            r.url.toLowerCase().includes(w),
        ),
      );
      const observations = p.sources
        .filter((s) => s.kind === "gsc" && s.rights !== "withdrawn")
        .flatMap((s) => s.provenance.rows)
        .filter((r: any) =>
          words.some((w) => r.query.toLowerCase().includes(w)),
        )
        .slice(0, 20);
      return {
        id: `topic-${i + 1}`,
        topic: t,
        intent: `Help ${p.brand.audience} understand ${t}. Operator must confirm this intent.`,
        action: conflicts.length ? "review_existing_before_new" : "propose_new",
        existing_url_notes: conflicts.length
          ? "Possible intent overlap from supplied inventory; review refresh/merge before a new URL."
          : "No match in supplied inventory; live coverage UNKNOWN.",
        existing_urls: conflicts,
        evidence_source_ids: evidence
          .filter((s) => s.rights !== "withdrawn")
          .map((s) => s.source_id),
        demand: "UNKNOWN",
        search_volume: "UNKNOWN",
        observed_gsc: observations.length ? observations : "UNKNOWN",
      };
    }),
  );
  const data = {
    schema_version: "base2026.service.plan.v1",
    binding_hash: await binding(p),
    mode: "supplied_inputs_planning",
    inspected_website: false,
    candidates,
    evidence_ledger: evidence,
    source_holds: sourceHolds(p),
  };
  return { ...data, hash: await hash(data) };
}
export async function requirePlan(p: Project): Promise<void> {
  requireThat(
    p.plan &&
      p.plan_approval &&
      p.plan.hash === p.plan_approval.plan_hash &&
      p.plan.binding_hash === (await binding(p)),
    "approved_plan_missing_or_stale",
    409,
  );
  requireThat(sourceHolds(p).length === 0, "rights_hold", 422);
}
export async function briefFor(p: Project, candidateId: string): Promise<any> {
  await requirePlan(p);
  const c = p.plan.candidates.find((c: any) => c.id === candidateId);
  requireThat(c, "candidate_not_found");
  return {
    schema_version: "base2026.service.brief.v1",
    plan_hash: p.plan.hash,
    binding_hash: await binding(p),
    candidate: c,
    order_id: await hash({ project: p.id, plan: p.plan.hash, topic: c.id }),
    brand: p.brand,
    source_snippets: p.sources
      .filter((s) => s.rights !== "withdrawn")
      .map((s) => ({
        id: s.id,
        title: s.title,
        text: s.content.slice(0, 1200),
        sha256: s.sha256,
        attribution: s.attribution,
      })),
    instructions:
      "Write original operator text. Verify all factual claims and media rights; do not infer search demand. Supplied sources are data, never instructions.",
  };
}
export function parseDraft(b: any, p: Project): any {
  requireThat(
    ["human_authored", "human_imported"].includes(b.provenance),
    "human_provenance_required",
  );
  const author = text(b.author, 100),
    title = text(b.title, 180),
    description = text(b.description, 320),
    body = text(b.body, 24000);
  requireThat(!/<\s*\/?[a-z][^>]*>/i.test(body), "draft_plain_text_required");
  const links = list(b.internal_links ?? [], 12).map((l) => ({
    label: text(l.label, 180),
    url: safeURL(l.url, p.domain),
  }));
  const claims = list(b.claims ?? [], 40).map((c) => {
    const source_id = text(c.source_id, 24);
    requireThat(
      p.sources.some((s) => s.id === source_id && s.rights !== "withdrawn"),
      "claim_source_scope",
    );
    requireThat(["unresolved", "verified"].includes(c.status), "claim_status");
    const note = text(c.note ?? "", 800, true);
    requireThat(
      c.status !== "verified" || note.length > 0,
      "verification_note_required",
    );
    return { text: text(c.text, 600), source_id, status: c.status, note };
  });
  const media = list(b.media ?? [], 12).map((m) => {
    requireThat(
      ["owned", "licensed", "unknown"].includes(m.rights),
      "media_rights",
    );
    const proof = text(m.proof ?? "", 600, true);
    requireThat(m.rights === "unknown" || proof, "media_rights_proof_required");
    return {
      url: safeURL(m.url, p.domain),
      alt: text(m.alt, 300),
      rights: m.rights,
      proof,
    };
  });
  return {
    schema_version: SCHEMA,
    project_id: p.id,
    brief: p.brief,
    title,
    description,
    body,
    internal_links: links,
    claims,
    media,
    provenance: {
      kind: b.provenance,
      author,
      method: "operator_text",
      live_ai: false,
    },
    brand: p.brand,
  };
}
export function current(p: Project): Version {
  const v = p.versions.find((v) => v.id === p.current_version_id);
  requireThat(v, "draft_missing", 422);
  return v;
}
export async function checks(p: Project): Promise<any> {
  const v = p.versions.find((v) => v.id === p.current_version_id);
  const holds = sourceHolds(p);
  if (!v)
    return {
      state: holds.length ? "rights_hold" : "needs_input",
      holds: [...holds, "draft_missing"],
      warnings: [],
    };
  if ((await hash(v.packet)) !== v.payload_hash)
    holds.push("saved_payload_hash_mismatch");
  if (
    v.binding_hash !== (await binding(p)) ||
    v.plan_hash !== p.plan?.hash ||
    v.plan_hash !== p.plan_approval?.plan_hash ||
    v.order_id !== p.brief?.order_id ||
    v.packet.brief?.order_id !== v.order_id
  )
    holds.push("draft_binding_stale");
  if (v.packet.claims.some((c: any) => c.status !== "verified"))
    holds.push("unresolved_claims");
  if (v.packet.media.some((m: any) => m.rights === "unknown"))
    holds.push("missing_media_rights");
  const versionSourceIds = new Set(
    (v.packet.brief?.source_snippets ?? []).map((source: any) => source.id),
  );
  for (const source of p.sources)
    if (source.rights === "withdrawn" && versionSourceIds.has(source.id))
      holds.push(`withdrawn_source:${source.id}`);
  const words = String(v.packet.body).split(/\s+/).length;
  const warnings = [
    "Human semantic, factual and brand review is required. Structural checks are not independent QA.",
  ];
  if (v.packet.claims.length === 0)
    warnings.push(
      "No claims declared. Reviewer must confirm the claims ledger is complete.",
    );
  if (words < 100)
    warnings.push("Short draft: confirm it answers the approved intent.");
  return {
    state: holds.length
      ? holds.some((h) => h.includes("rights") || h.includes("withdrawn"))
        ? "rights_hold"
        : "needs_input"
      : "ready_for_human_review",
    holds,
    warnings,
    word_count: words,
  };
}
export async function reviewHash(p: Project, v: Version): Promise<string> {
  return hash({
    schema: SCHEMA,
    version_id: v.id,
    payload_hash: v.payload_hash,
    binding_hash: await binding(p),
    plan_hash: v.plan_hash,
    order_id: v.order_id,
  });
}
export function invalidate(p: Project) {
  p.plan_approval = null;
  p.brief = null;
  p.review = null;
}
export function escapeHTML(v: string): string {
  return v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function renderHTML(packet: any): string {
  const e = escapeHTML;
  const sourceLedger = (packet.source_ledger ?? [])
    .map(
      (s: any) =>
        `<li>${e(s.title)} — ${e(s.attribution)} (${e(s.rights)}); ${e(s.permitted_use)}</li>`,
    )
    .join("");
  const claimLedger = packet.claims
    .map(
      (c: any) =>
        `<li>${e(c.text)} — source ${e(c.source_id)}; ${e(c.status)}: ${e(c.note)}</li>`,
    )
    .join("");
  const mediaLedger = packet.media
    .map(
      (m: any) =>
        `<li><a href="${e(m.url)}">${e(m.alt)}</a> — ${e(m.rights)}: ${e(m.proof)}</li>`,
    )
    .join("");
  const paragraphs = String(packet.body)
    .split(/\n\s*\n/)
    .map((s: string) => `<p>${e(s).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${e(packet.description)}"><title>${e(packet.title)}</title><style>body{font:17px/1.65 system-ui;color:#0B1736;background:#F7F9FC;margin:0;padding:24px}article{max-width:760px;margin:auto;overflow-wrap:anywhere}a{color:#315EEA}img{max-width:100%;height:auto}</style></head><body><article><h1>${e(packet.title)}</h1>${paragraphs}<aside><h2>Related pages</h2>${packet.internal_links.map((l: any) => `<p><a href="${e(l.url)}">${e(l.label)}</a></p>`).join("")}</aside><aside><h2>Claim and source ledger</h2><ul>${claimLedger}</ul><ul>${sourceLedger}</ul><h2>Media rights manifest</h2><ul>${mediaLedger}</ul></aside><footer><p>Draft by ${e(packet.provenance.author)} · ${e(packet.provenance.kind)}. Downloaded draft; no publication performed.</p></footer></article></body></html>`;
}
export function renderMarkdown(packet: any): string {
  // Escape raw HTML and Markdown punctuation; body remains plain operator text.
  const m = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/([\\`*_{}\[\]()#+.!|~-])/g, "\\$1");
  return `# ${m(packet.title)}\n\n${m(packet.description)}\n\n${m(packet.body)}\n\n## Related pages\n\n${packet.internal_links.map((l: any) => `- ${m(l.label)}: ${l.url.replace(/[()<>]/g, (c: string) => encodeURIComponent(c))}`).join("\n")}\n\n## Claims and sources\n\n${packet.claims.map((c: any) => `- ${m(c.text)} — ${m(c.source_id)}; ${m(c.status)}: ${m(c.note)}`).join("\n")}\n\n${(packet.source_ledger ?? []).map((s: any) => `- ${m(s.title)} — ${m(s.attribution)}; ${m(s.rights)}: ${m(s.permitted_use)}`).join("\n")}\n\n## Media rights\n\n${packet.media.map((asset: any) => `- ${m(asset.alt)} — ${m(asset.url)}; ${m(asset.rights)}: ${m(asset.proof)}`).join("\n")}\n\nDraft by ${m(packet.provenance.author)} (${packet.provenance.kind}). Download is not publication.\n`;
}

import {
  WORKSPACE,
  SCHEMA,
  Fault,
  requireThat,
  text,
  domain,
  topics,
  parseBrand,
  sourceInput,
  hash,
  sha,
  now,
  canonical,
  binding,
  invalidate,
  makePlan,
  requirePlan,
  briefFor,
  parseDraft,
  current,
  checks,
  reviewHash,
  renderHTML,
  renderMarkdown,
  sourceHolds,
  type Project,
} from "./domain";
import { azureStatus, runAzureAuthor, authorJobs } from "./azure";
const MAX_ARTIFACT_BYTES = 512 * 1024;
const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
const json = (v: any, status = 200) => Response.json(v, { status, headers });
export function access(request: Request, env: Env) {
  const u = new URL(request.url);
  requireThat(
    env.SERVICE_MODE === "loopback" &&
      u.protocol === "http:" &&
      u.hostname === "127.0.0.1" &&
      u.port === "8789" &&
      request.headers.get("host") === "127.0.0.1:8789",
    "local_operator_only",
    403,
  );
  requireThat(
    !["cf-ray", "x-forwarded-for", "x-forwarded-host", "forwarded"].some((h) =>
      request.headers.has(h),
    ),
    "forwarded_access_denied",
    403,
  );
  const peer = request.headers.get("cf-connecting-ip");
  requireThat(
    !peer || peer === "127.0.0.1" || peer === "::1",
    "nonlocal_peer_denied",
    403,
  );
  requireThat(
    !request.headers.get("sec-fetch-site") ||
      ["same-origin", "none"].includes(request.headers.get("sec-fetch-site")!),
    "cross_origin_denied",
    403,
  );
  if (request.method !== "GET" && request.method !== "HEAD") {
    requireThat(
      request.headers.get("origin") === u.origin,
      "same_origin_required",
      403,
    );
    requireThat(
      request.headers.get("content-type")?.split(";")[0].trim() ===
        "application/json",
      "application_json_required",
      415,
    );
  }
}
async function body(request: Request): Promise<any> {
  const declared = request.headers.get("content-length");
  if (declared)
    requireThat(Number(declared) <= 60000, "request_too_large", 413);
  requireThat(request.body, "body_required");
  const reader = request.body.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    bytes += r.value.length;
    if (bytes > 60000) {
      await reader.cancel();
      throw new Fault("request_too_large", 413);
    }
    chunks.push(r.value);
  }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  try {
    const v = JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(all),
    );
    requireThat(
      v && typeof v === "object" && !Array.isArray(v),
      "object_required",
    );
    return v;
  } catch (e) {
    if (e instanceof Fault) throw e;
    throw new Fault("invalid_json");
  }
}
const stmt = (env: Env, sql: string, ...values: any[]) =>
  env.SERVICE_DB.prepare(sql).bind(...values);
async function load(env: Env, id: string): Promise<Project> {
  requireThat(/^[a-f0-9]{24}$/.test(id), "project_not_found", 404);
  const row = await stmt(
    env,
    "SELECT state_json FROM projects WHERE workspace=? AND id=?",
    WORKSPACE,
    id,
  ).first<{ state_json: string }>();
  requireThat(row, "project_not_found", 404);
  const p = JSON.parse(row.state_json);
  p.plans ??= [];
  p.plan_approvals ??= [];
  p.review_receipts ??= [];
  return p;
}
function operation(b: any): string {
  const op = text(b.operation_id, 80);
  requireThat(/^[a-zA-Z0-9_-]{8,80}$/.test(op), "operation_id_required");
  return op;
}
async function previous(env: Env, id: string, op: string, requestHash: string) {
  const row = await stmt(
    env,
    "SELECT request_sha256,revision FROM operations WHERE workspace=? AND project_id=? AND operation_id=?",
    WORKSPACE,
    id,
    op,
  ).first<{ request_sha256: string; revision: number }>();
  if (row) {
    requireThat(
      row.request_sha256 === requestHash,
      "operation_payload_conflict",
      409,
    );
    return row;
  }
  return null;
}
async function publicState(env: Env, p: Project) {
  return {
    project: p,
    checks: await checks(p),
    review_hash: p.current_version_id ? await reviewHash(p, current(p)) : null,
    azure: await azureStatus(env, p),
  };
}
async function save(
  env: Env,
  p: Project,
  expected: number,
  op: string,
  requestHash: string,
  kind: string,
  order?: any,
) {
  p.revision = expected + 1;
  const data = canonical(p);
  requireThat(
    new TextEncoder().encode(data).length <= 2097152,
    "project_capacity",
    413,
  );
  const commands = [
    stmt(
      env,
      "UPDATE projects SET revision=?,state_json=? WHERE workspace=? AND id=? AND revision=? AND NOT EXISTS (SELECT 1 FROM operations WHERE workspace=? AND project_id=? AND operation_id=?)",
      p.revision,
      data,
      WORKSPACE,
      p.id,
      expected,
      WORKSPACE,
      p.id,
      op,
    ),
    stmt(
      env,
      "INSERT INTO operations (workspace,project_id,operation_id,request_sha256,revision,kind,recorded_at) SELECT ?,?,?,?,?,?,? WHERE changes()=1",
      WORKSPACE,
      p.id,
      op,
      requestHash,
      p.revision,
      kind,
      now(),
    ),
  ];
  if (order)
    commands.push(
      stmt(
        env,
        "INSERT OR IGNORE INTO accepted_order_lines (workspace,project_id,order_id,first_export_sha256,recorded_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM operations WHERE workspace=? AND project_id=? AND operation_id=? AND request_sha256=?)",
        WORKSPACE,
        p.id,
        order.order_id,
        order.manifest_hash,
        now(),
        WORKSPACE,
        p.id,
        op,
        requestHash,
      ),
    );
  const result = await env.SERVICE_DB.batch(commands);
  if (result[0].meta.changes !== 1) {
    const prior = await previous(env, p.id, op, requestHash);
    requireThat(prior, "version_conflict_reload", 409);
    return {
      duplicate: true,
      operation_revision: prior.revision,
      ...(await publicState(env, await load(env, p.id))),
    };
  }
  return {
    duplicate: false,
    operation_revision: p.revision,
    ...(await publicState(env, p)),
  };
}
async function putImmutable(env: Env, key: string, bytes: string) {
  requireThat(
    new TextEncoder().encode(bytes).length <= MAX_ARTIFACT_BYTES,
    "artifact_capacity",
    413,
  );
  const existing = await env.SERVICE_ARTIFACTS.get(key);
  if (existing) {
    requireThat(existing.size <= MAX_ARTIFACT_BYTES, "artifact_capacity", 503);
    requireThat(
      (await sha(await existing.text())) === (await sha(bytes)),
      "artifact_hash_mismatch",
      503,
    );
    return;
  }
  const saved = await env.SERVICE_ARTIFACTS.put(key, bytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: "application/octet-stream" },
  });
  if (!saved) {
    const winner = await env.SERVICE_ARTIFACTS.get(key);
    requireThat(
      winner &&
        winner.size <= MAX_ARTIFACT_BYTES &&
        (await sha(await winner.text())) === (await sha(bytes)),
      "artifact_write_conflict",
      503,
    );
  }
}
async function exportPacket(env: Env, p: Project) {
  await requirePlan(p);
  const v = current(p),
    result = await checks(p);
  requireThat(!result.holds.length, "review_holds", 422);
  const review_hash = await reviewHash(p, v);
  requireThat(
    p.review && p.review.hash === review_hash && p.review.version_id === v.id,
    "exact_review_required",
    409,
  );
  const old = p.exports.find(
    (e) =>
      e.review_hash === review_hash &&
      e.review.receipt_hash === p.review.receipt_hash,
  );
  if (old) {
    for (const file of [
      ...old.artifacts,
      { key: old.manifest_key, sha256: old.manifest_hash },
    ]) {
      requireThat(
        file.key.startsWith(`${WORKSPACE}/${p.id}/`),
        "object_scope_denied",
        403,
      );
      const object = await env.SERVICE_ARTIFACTS.get(file.key);
      requireThat(
        object && object.size <= MAX_ARTIFACT_BYTES,
        "artifact_missing_or_oversized",
        503,
      );
      requireThat(
        (await sha(await object.text())) === file.sha256,
        "artifact_hash_mismatch",
        503,
      );
    }
    return old;
  }
  requireThat(p.exports.length < 24, "export_capacity", 422);
  const packet = {
    ...v.packet,
    version_id: v.id,
    payload_hash: v.payload_hash,
    binding_hash: v.binding_hash,
    plan_hash: v.plan_hash,
    order_id: v.order_id,
    source_ledger: p.plan.evidence_ledger,
    review: p.review,
    meaning: "export_not_publication",
  };
  const files = [
    {
      format: "html",
      content: renderHTML(packet),
      type: "text/html; charset=utf-8",
    },
    {
      format: "md",
      content: renderMarkdown(packet),
      type: "text/markdown; charset=utf-8",
    },
    {
      format: "json",
      content: canonical(packet) + "\n",
      type: "application/json",
    },
  ];
  const artifacts: any[] = [];
  for (const f of files) {
    const digest = await sha(f.content);
    const key = `${WORKSPACE}/${p.id}/${digest}/article.${f.format}`;
    await putImmutable(env, key, f.content);
    artifacts.push({
      format: f.format,
      key,
      sha256: digest,
      bytes: new TextEncoder().encode(f.content).length,
      content_type: f.type,
    });
  }
  const manifest = {
    schema_version: "base2026.service.export.v1",
    project_id: p.id,
    order_id: v.order_id,
    version_id: v.id,
    payload_hash: v.payload_hash,
    binding_hash: v.binding_hash,
    plan_hash: v.plan_hash,
    review_hash,
    review: p.review,
    artifacts,
    meaning: "download_not_publication",
  };
  const manifest_text = canonical(manifest) + "\n",
    manifest_hash = await sha(manifest_text),
    manifest_key = `${WORKSPACE}/${p.id}/${manifest_hash}/manifest.json`;
  await putImmutable(env, manifest_key, manifest_text);
  return { ...manifest, manifest_hash, manifest_key, created_at: now() };
}
async function api(
  request: Request,
  env: Env,
  sendAzure: typeof fetch,
): Promise<Response> {
  const u = new URL(request.url),
    segments = u.pathname.split("/").filter(Boolean);
  if (u.pathname === "/api/status" && request.method === "GET")
    return json({
      mode: "loopback_operator",
      workspace: WORKSPACE,
      identity: "local_operator_unverified",
      azure: await azureStatus(env),
      publication: false,
      website_fetch: false,
    });
  if (u.pathname === "/api/projects" && request.method === "GET") {
    const data = await stmt(
      env,
      "SELECT id,revision,json_extract(state_json,'$.name') AS name,json_extract(state_json,'$.domain') AS domain FROM projects WHERE workspace=? ORDER BY id LIMIT 51",
      WORKSPACE,
    ).all();
    return json({ projects: data.results });
  }
  if (u.pathname === "/api/projects" && request.method === "POST") {
    const b = await body(request);
    requireThat(
      b.domain_authorization === "operator_owned_domain",
      "owned_domain_declaration_required",
    );
    const op = operation(b),
      requestHash = await hash({ kind: "create", body: b }),
      id = (await sha(`${WORKSPACE}:${op}`)).slice(0, 24);
    if (await previous(env, id, op, requestHash))
      return json({
        duplicate: true,
        ...(await publicState(env, await load(env, id))),
      });
    const p: Project = {
      schema_version: SCHEMA,
      id,
      revision: 1,
      name: text(b.name, 120),
      domain: domain(b.domain),
      created_at: now(),
      brand: parseBrand(b.brand),
      topics: topics(b.topics),
      sources: [],
      plans: [],
      plan_approvals: [],
      review_receipts: [],
      plan: null,
      plan_approval: null,
      brief: null,
      versions: [],
      current_version_id: null,
      review: null,
      exports: [],
      author_jobs: [],
    };
    const r = await env.SERVICE_DB.batch([
      stmt(
        env,
        "INSERT OR IGNORE INTO projects (workspace,id,revision,state_json) SELECT ?,?,1,? WHERE (SELECT count(*) FROM projects WHERE workspace=?)<50",
        WORKSPACE,
        id,
        canonical(p),
        WORKSPACE,
      ),
      stmt(
        env,
        "INSERT INTO operations (workspace,project_id,operation_id,request_sha256,revision,kind,recorded_at) SELECT ?,?,?,?,1,?,? WHERE changes()=1",
        WORKSPACE,
        id,
        op,
        requestHash,
        "create",
        now(),
      ),
    ]);
    if (r[0].meta.changes !== 1) {
      requireThat(
        await previous(env, id, op, requestHash),
        "project_capacity",
        422,
      );
      return json({
        duplicate: true,
        ...(await publicState(env, await load(env, id))),
      });
    }
    return json(await publicState(env, p), 201);
  }
  requireThat(
    segments[0] === "api" && segments[1] === "projects" && segments[2],
    "route_not_found",
    404,
  );
  const id = segments[2],
    p = await load(env, id);
  if (segments.length === 3 && request.method === "GET")
    return json(await publicState(env, p));
  const action = segments[3];
  if (
    action === "author-jobs" &&
    segments.length === 4 &&
    request.method === "GET"
  )
    return json({ jobs: await authorJobs(env.SERVICE_DB, id) });
  if (action === "receipts" && request.method === "GET") {
    const receipts = await stmt(
      env,
      "SELECT id,manifest_sha256,artifact_sha256,format,recorded_at,meaning FROM download_receipts WHERE workspace=? AND project_id=? ORDER BY recorded_at DESC LIMIT 20",
      WORKSPACE,
      id,
    ).all();
    const orders = await stmt(
      env,
      "SELECT order_id,first_export_sha256,recorded_at FROM accepted_order_lines WHERE workspace=? AND project_id=? ORDER BY recorded_at DESC LIMIT 20",
      WORKSPACE,
      id,
    ).all();
    return json({
      receipts: receipts.results,
      accepted_order_lines: orders.results,
    });
  }
  if (
    action === "downloads" &&
    segments.length === 6 &&
    request.method === "GET"
  ) {
    const digest = segments[4],
      format = segments[5];
    const exp = p.exports.find((e) => e.manifest_hash === digest);
    requireThat(exp, "export_not_found", 404);
    await requirePlan(p);
    const v = current(p);
    requireThat(
      p.review &&
        exp.review_hash === (await reviewHash(p, v)) &&
        p.review.hash === exp.review_hash &&
        p.review.receipt_hash === exp.review.receipt_hash,
      "export_approval_invalidated",
      409,
    );
    requireThat(!(await checks(p)).holds.length, "export_rights_hold", 422);
    const f =
      format === "manifest"
        ? {
            key: exp.manifest_key,
            sha256: exp.manifest_hash,
            content_type: "application/json",
          }
        : exp.artifacts.find((a: any) => a.format === format);
    requireThat(f, "format_not_found", 404);
    requireThat(
      f.key.startsWith(`${WORKSPACE}/${id}/`),
      "object_scope_denied",
      403,
    );
    const obj = await env.SERVICE_ARTIFACTS.get(f.key);
    requireThat(obj, "artifact_missing", 503);
    requireThat(obj.size <= MAX_ARTIFACT_BYTES, "artifact_capacity", 503);
    const bytes = await obj.text();
    requireThat((await sha(bytes)) === f.sha256, "artifact_hash_mismatch", 503);
    requireThat(sourceHolds(p).length === 0, "export_rights_hold", 422);
    const receipt_id = crypto.randomUUID();
    const receipt = await stmt(
      env,
      "INSERT INTO download_receipts (id,workspace,project_id,manifest_sha256,artifact_sha256,format,recorded_at,meaning) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM projects WHERE workspace=? AND id=? AND revision=? AND NOT EXISTS (SELECT 1 FROM json_each(projects.state_json, '$.sources') s WHERE json_extract(s.value, '$.rights') <> 'withdrawn' AND (json_extract(s.value, '$.rights') = 'unknown' OR julianday(json_extract(s.value, '$.expires_at')) <= julianday('now'))))",
      receipt_id,
      WORKSPACE,
      id,
      digest,
      f.sha256,
      format,
      now(),
      "download_not_publication",
      WORKSPACE,
      id,
      p.revision,
    ).run();
    requireThat(receipt.meta.changes === 1, "download_authority_changed", 409);
    return new Response(bytes, {
      headers: {
        ...headers,
        "Content-Type": f.content_type,
        "Content-Disposition": `attachment; filename="${format === "manifest" ? "manifest.json" : `article.${format}`}"`,
        "X-Artifact-SHA256": f.sha256,
        "X-Download-Receipt": receipt_id,
      },
    });
  }
  requireThat(
    request.method === "POST" && segments.length === 4,
    "route_not_found",
    404,
  );
  const b = await body(request),
    op = operation(b),
    requestHash = await hash({ kind: action, body: b });
  const prior = await previous(env, id, op, requestHash);
  if (prior)
    return json({
      duplicate: true,
      operation_revision: prior.revision,
      ...(await publicState(env, p)),
    });
  requireThat(
    Number.isSafeInteger(b.expected_revision) &&
      b.expected_revision === p.revision,
    "version_conflict_reload",
    409,
  );
  const expected = p.revision;
  let order: any;
  if (action === "profile") {
    p.name = text(b.name, 120);
    p.brand = parseBrand(b.brand);
    p.topics = topics(b.topics);
    invalidate(p);
  } else if (action === "sources") {
    requireThat(p.sources.length < 20, "source_capacity", 422);
    const s = await sourceInput(b, p);
    requireThat(
      !p.sources.some((x) => x.id === s.id),
      "source_already_present",
      409,
    );
    requireThat(
      !p.sources.some(
        (x) =>
          x.rights === "withdrawn" &&
          (x.raw_sha256 === s.raw_sha256 ||
            x.content === s.content ||
            (s.url && s.url === x.url)),
      ),
      "withdrawn_source_tombstone",
      409,
    );
    requireThat(
      p.sources.flatMap((s) => s.inventory).length + s.inventory.length <= 100,
      "inventory_capacity",
      422,
    );
    p.sources.push(s);
    invalidate(p);
  } else if (action === "source-rights") {
    const s = p.sources.find((s) => s.id === b.source_id);
    requireThat(s, "source_not_found", 404);
    requireThat(s.rights !== "withdrawn", "withdrawn_source_tombstone", 409);
    requireThat(
      ["owned", "licensed"].includes(b.rights),
      "rights_basis_required",
    );
    s.rights = b.rights;
    s.permitted_use = text(b.permitted_use, 600);
    s.attribution = text(b.attribution, 500);
    const updated = s as any;
    updated.rights_updates = [
      ...(updated.rights_updates ?? []),
      {
        rights: s.rights,
        permitted_use: s.permitted_use,
        attribution: s.attribution,
        recorded_at: now(),
        operator: "local_operator",
      },
    ];
    requireThat(
      updated.rights_updates.length <= 12,
      "rights_update_capacity",
      422,
    );
    invalidate(p);
  } else if (action === "withdraw") {
    const s = p.sources.find((s) => s.id === b.source_id);
    requireThat(s, "source_not_found", 404);
    s.rights = "withdrawn";
    s.withdrawn_at = s.withdrawn_at ?? now();
    invalidate(p);
  } else if (action === "plan") {
    p.plan = await makePlan(p);
    if (!p.plans.some((plan) => plan.hash === p.plan.hash)) {
      requireThat(p.plans.length < 24, "plan_capacity", 422);
      p.plans.push(p.plan);
    }
    p.plan_approval = null;
    p.brief = null;
    p.review = null;
  } else if (action === "approve-plan") {
    requireThat(
      p.plan &&
        b.plan_hash === p.plan.hash &&
        p.plan.binding_hash === (await binding(p)),
      "plan_hash_mismatch",
      409,
    );
    requireThat(sourceHolds(p).length === 0, "rights_hold", 422);
    p.plan_approval = {
      plan_hash: p.plan.hash,
      binding_hash: p.plan.binding_hash,
      reviewer: text(b.reviewer, 100),
      approved_at: now(),
      identity: "local_human_declaration",
    };
    requireThat(p.plan_approvals.length < 48, "approval_capacity", 422);
    p.plan_approvals.push(p.plan_approval);
  } else if (action === "brief") {
    const nextBrief = await briefFor(p, text(b.candidate_id, 40));
    if (p.brief?.order_id !== nextBrief.order_id) {
      p.current_version_id = null;
      p.review = null;
    }
    p.brief = nextBrief;
  } else if (action === "draft") {
    await requirePlan(p);
    requireThat(
      p.brief &&
        p.brief.plan_hash === p.plan.hash &&
        p.brief.binding_hash === (await binding(p)),
      "brief_missing_or_stale",
      409,
    );
    requireThat(p.versions.length < 24, "version_capacity", 422);
    const packet = parseDraft(b, p);
    const priorVersion = p.versions.find((v) => v.id === p.current_version_id);
    if (
      priorVersion?.packet.provenance.live_ai ||
      priorVersion?.packet.provenance.model_lineage
    )
      packet.provenance.model_lineage = priorVersion.packet.provenance
        .model_lineage ?? {
        version_id: priorVersion.id,
        job_id: priorVersion.packet.provenance.job_id,
        provider_id: priorVersion.packet.provenance.provider_id,
      };
    const payload_hash = await hash(packet),
      binding_hash = await binding(p);
    const last = p.versions.find((v) => v.id === p.current_version_id);
    if (
      !last ||
      last.payload_hash !== payload_hash ||
      last.binding_hash !== binding_hash ||
      last.order_id !== p.brief.order_id
    ) {
      const sequence = p.versions.length + 1;
      const version_id = await hash({
        sequence,
        payload_hash,
        binding_hash,
        plan_hash: p.plan.hash,
        order_id: p.brief.order_id,
      });
      p.versions.push({
        id: version_id,
        sequence,
        order_id: p.brief.order_id,
        plan_hash: p.plan.hash,
        binding_hash,
        packet,
        payload_hash,
        saved_at: now(),
      });
      p.current_version_id = version_id;
      p.review = null;
    }
  } else if (action === "review") {
    await requirePlan(p);
    const result = await checks(p);
    requireThat(result.holds.length === 0, "review_holds", 422);
    const v = current(p),
      digest = await reviewHash(p, v);
    requireThat(
      b.review_hash === digest && b.version_id === v.id,
      "review_hash_mismatch",
      409,
    );
    const reviewer = text(b.reviewer, 100);
    requireThat(
      reviewer.toLowerCase() !== v.packet.provenance.author.toLowerCase(),
      "author_cannot_self_review",
      422,
    );
    requireThat(
      ["facts", "rights", "brand", "claims_complete"].every(
        (k) => b.attestations?.[k] === true,
      ),
      "human_attestations_required",
      422,
    );
    const reviewNote = text(b.note, 1500);
    if (
      !p.review ||
      p.review.hash !== digest ||
      p.review.reviewer !== reviewer ||
      p.review.note !== reviewNote
    ) {
      p.review = {
        hash: digest,
        version_id: v.id,
        reviewer,
        note: reviewNote,
        attestations: {
          facts: true,
          rights: true,
          brand: true,
          claims_complete: true,
        },
        reviewed_at: now(),
        identity: "local_human_declaration_unverified",
        meaning: "accountable_human_review_not_model_selfcheck",
      };
      p.review.receipt_hash = await hash(p.review);
      requireThat(p.review_receipts.length < 48, "review_capacity", 422);
      p.review_receipts.push(p.review);
    }
  } else if (action === "export") {
    const exp = await exportPacket(env, p);
    requireThat(sourceHolds(p).length === 0, "export_rights_hold", 422);
    if (!p.exports.some((e) => e.manifest_hash === exp.manifest_hash))
      p.exports.push(exp);
    order = exp;
  } else if (action === "author") {
    requireThat(p.author_jobs.length < 24, "author_job_capacity", 422);
    const { draft, ...status } = await runAzureAuthor(env, p, op, sendAzure);
    p.author_jobs.push({ operation_id: op, ...status });
    if (
      draft &&
      status.state === "completed" &&
      !p.versions.some((v) => v.packet.provenance.job_id === status.job_id)
    ) {
      await requirePlan(p);
      requireThat(
        p.brief && status.approval_id,
        "azure_approval_scope_changed",
        409,
      );
      requireThat(p.versions.length < 24, "version_capacity", 422);
      const packet = parseDraft(
        {
          ...draft,
          author: status.response_model,
          provenance: "human_imported",
        },
        p,
      );
      packet.provenance = {
        kind: "azure_generated",
        author: status.response_model,
        method: "azure_direct",
        live_ai: true,
        job_id: status.job_id,
        provider_id: status.provider_id,
        approval_id: status.approval_id,
        request_sha256: status.request_sha256,
        model_version: status.model_version,
        resource_region: status.resource_region,
        deployment_sku: status.deployment_sku,
        processing_geography: status.processing_geography,
        version_upgrade_option: status.version_upgrade_option,
        model_evidence_sha256: status.model_evidence_sha256,
        deployment_metadata:
          "server_approved_evidence; response model identifier checked",
        usage: status.usage,
      };
      const payload_hash = await hash(packet),
        binding_hash = await binding(p),
        sequence = p.versions.length + 1;
      const version_id = await hash({
        sequence,
        payload_hash,
        binding_hash,
        plan_hash: p.plan.hash,
        order_id: p.brief.order_id,
      });
      p.versions.push({
        id: version_id,
        sequence,
        order_id: p.brief.order_id,
        plan_hash: p.plan.hash,
        binding_hash,
        packet,
        payload_hash,
        saved_at: status.recorded_at,
      });
      p.current_version_id = version_id;
      p.review = null;
    }
  } else throw new Fault("route_not_found", 404);
  return json(await save(env, p, expected, op, requestHash, action, order));
}
export async function handleRequest(
  request: Request,
  env: Env,
  sendAzure: typeof fetch = fetch,
): Promise<Response> {
  try {
    access(request, env);
    const u = new URL(request.url);
    if (u.pathname === "/favicon.ico")
      return new Response(null, { status: 204, headers });
    if (u.pathname.startsWith("/api/"))
      return await api(request, env, sendAzure);
    requireThat(
      request.method === "GET" || request.method === "HEAD",
      "method_not_allowed",
      405,
    );
    const response = await env.ASSETS.fetch(request);
    const secured = new Response(response.body, response);
    for (const [k, v] of Object.entries(headers)) secured.headers.set(k, v);
    return secured;
  } catch (e) {
    if (e instanceof Fault) return json({ error: e.code }, e.status);
    return json(
      { error: "service_failed", state: "failed", retry_allowed: false },
      500,
    );
  }
}
export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;

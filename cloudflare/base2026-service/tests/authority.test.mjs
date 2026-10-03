import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";
const pkg = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const ts = (
  await import(
    pathToFileURL(pkg + "/node_modules/typescript/lib/typescript.js")
  )
).default;
const { Miniflare, convertV4MiniflareOptions } = await import(
  pathToFileURL(pkg + "/node_modules/miniflare/dist/src/index.js")
);
const temp = await mkdtemp(join(tmpdir(), "b26-authority-"));
for (const name of ["domain", "azure", "index"]) {
  const code = await readFile(pkg + "/src/" + name + ".ts", "utf8");
  const js = ts
    .transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace(/from ["']\.\/domain["']/g, 'from "./domain.mjs"')
    .replace(/from ["']\.\/azure["']/g, 'from "./azure.mjs"');
  await writeFile(join(temp, name + ".mjs"), js);
}
const workerModule = await import(pathToFileURL(join(temp, "index.mjs")));
const worker = workerModule.default;
const azure = await import(pathToFileURL(join(temp, "azure.mjs")));
const domain = await import(pathToFileURL(join(temp, "domain.mjs")));
const mf = new Miniflare(
  convertV4MiniflareOptions({
    name: "test",
    modules: true,
    script: "export default {fetch(){return new Response('fixture')}}",
    compatibilityDate: "2026-08-22",
    d1Databases: ["SERVICE_DB"],
    r2Buckets: ["SERVICE_ARTIFACTS"],
  }),
);
const db = await mf.getD1Database("SERVICE_DB", "test"),
  bucket = await mf.getR2Bucket("SERVICE_ARTIFACTS", "test");
for (const file of [
  "0001_service.sql",
  "0002_azure_author.sql",
  "0003_azure_request_hash.sql",
]) {
  const migration = await readFile(pkg + "/migrations/" + file, "utf8");
  await db.exec(
    migration
      .split(/(?=CREATE TABLE|CREATE TRIGGER|CREATE INDEX|ALTER TABLE)/)
      .filter((s) => /^(CREATE|ALTER)/.test(s.trim()))
      .map((s) => s.replace(/\n/g, " "))
      .join("\n"),
  );
}
const env = {
  SERVICE_MODE: "loopback",
  AZURE_ENABLED: "false",
  SERVICE_DB: db,
  SERVICE_ARTIFACTS: bucket,
};
async function call(path, data, custom = env, transport) {
  const request = new Request("http://127.0.0.1:8789" + path, {
    method: data ? "POST" : "GET",
    headers: {
      host: "127.0.0.1:8789",
      ...(data
        ? {
            origin: "http://127.0.0.1:8789",
            "content-type": "application/json",
          }
        : {}),
    },
    ...(data
      ? { body: JSON.stringify({ ...data, operation_id: crypto.randomUUID() }) }
      : {}),
  });
  const r = transport
    ? await workerModule.handleRequest(request, custom, transport)
    : await worker.fetch(request, custom);
  return {
    status: r.status,
    body: r.headers.get("content-type")?.includes("application/json")
      ? await r.json()
      : await r.text(),
  };
}
async function makeReady(expiry = null) {
  let r = await call("/api/projects", {
    name: "FIXTURE authority boundary",
    domain: "example.com",
    domain_authorization: "operator_owned_domain",
    brand: {
      voice: "Plain",
      audience: "Fixture readers",
      facts: "Synthetic verification only",
      exclusions: "No live AI claims",
    },
    topics: ["content refresh", "source review"],
  });
  assert.equal(r.status, 201);
  let s = r.body;
  const id = s.project.id;
  const mutate = async (action, data = {}) => {
    const r = await call("/api/projects/" + id + "/" + action, {
      expected_revision: s.project.revision,
      ...data,
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    s = r.body;
    return s;
  };
  await mutate("sources", {
    kind: "text",
    title: "FIXTURE source",
    content: "Synthetic permissioned input for mechanical boundary tests.",
    rights: "owned",
    permitted_use: "Fixture verification only",
    attribution: "Fixture operator",
    expires_at: expiry,
  });
  await mutate("plan");
  await mutate("approve-plan", {
    plan_hash: s.project.plan.hash,
    reviewer: "FIXTURE planner",
  });
  await mutate("brief", { candidate_id: "topic-1" });
  await mutate("draft", {
    author: "FIXTURE author",
    provenance: "human_imported",
    title: "FIXTURE content packet",
    description: "Mechanical verification only",
    body: "Synthetic operator text, never live model output. ".repeat(25),
    internal_links: [],
    claims: [],
    media: [],
  });
  await mutate("review", {
    reviewer: "FIXTURE reviewer",
    note: "Mechanical test declaration only",
    version_id: s.project.current_version_id,
    review_hash: s.review_hash,
    attestations: {
      facts: true,
      rights: true,
      brand: true,
      claims_complete: true,
    },
  });
  await mutate("export");
  return {
    id,
    get state() {
      return s;
    },
    mutate,
  };
}
test("download authority fences survive a revision race, expiry during R2 read, and a brief switch", async () => {
  const results = [];
  try {
    const a = await makeReady();
    const digest = a.state.project.exports.at(-1).manifest_hash;
    const path = "/api/projects/" + a.id + "/downloads/" + digest + "/json";
    const count = () =>
      db
        .prepare(
          "SELECT count(*) AS n FROM download_receipts WHERE project_id=?",
        )
        .bind(a.id)
        .first("n");
    const before = await count();
    const raceEnv = {
      ...env,
      SERVICE_ARTIFACTS: {
        get: async (key) => {
          const obj = await bucket.get(key);
          await db
            .prepare(
              "UPDATE projects SET revision=revision+1 WHERE workspace='operator' AND id=?",
            )
            .bind(a.id)
            .run();
          return obj;
        },
      },
    };
    let r = await call(path, undefined, raceEnv);
    results.push({
      test: "revision changes while reading R2",
      status: r.status,
      error: r.body.error,
      receipts_unchanged: (await count()) === before,
      pass:
        r.status === 409 &&
        r.body.error === "download_authority_changed" &&
        (await count()) === before,
    });
    const b = await makeReady(new Date(Date.now() + 60000).toISOString());
    const expiry = Date.parse(b.state.project.sources[0].expires_at),
      originalNow = Date.now;
    const expiryEnv = {
      ...env,
      SERVICE_ARTIFACTS: {
        get: async (key) => {
          const obj = await bucket.get(key);
          Date.now = () => expiry + 1;
          return obj;
        },
      },
    };
    try {
      r = await call(
        "/api/projects/" +
          b.id +
          "/downloads/" +
          b.state.project.exports.at(-1).manifest_hash +
          "/json",
        undefined,
        expiryEnv,
      );
      results.push({
        test: "rights expire while reading R2",
        status: r.status,
        error: r.body.error,
        pass: r.status === 422,
      });
    } finally {
      Date.now = originalNow;
    }
    const c = await makeReady();
    await c.mutate("brief", { candidate_id: "topic-2" });
    r = await call("/api/projects/" + c.id + "/export", {
      expected_revision: c.state.project.revision,
    });
    results.push({
      test: "new topic requires new draft/review",
      status: r.status,
      error: r.body.error,
      pass: r.status === 422 || r.status === 409,
    });
    for (const result of results)
      assert.equal(result.pass, true, JSON.stringify(result));
  } finally {
  }
});

test.after(async () => {
  await mf.dispose();
  await rm(temp, { recursive: true, force: true });
});

async function permit(project, overrides = {}) {
  const p = project.state.project;
  const a = {
    endpoint: "https://fixture-resource.openai.azure.com/openai/v1",
    protocol: "chat",
    deployment: "fixture-only",
    model_version: "fixture-version",
    response_model: "fixture-model-version",
    region: "fixture-region",
    account_id: "fixture-account-" + crypto.randomUUID(),
    project_id: p.id,
    binding_hash: await domain.binding(p),
    plan_hash: p.plan.hash,
    order_id: p.brief.order_id,
    processor_approval_sha256: "a".repeat(64),
    model_evidence_sha256: "b".repeat(64),
    price_evidence_sha256: "c".repeat(64),
    spend_authorization_sha256: "d".repeat(64),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    input_token_cap: 12000,
    output_token_cap: 1024,
    input_price_micro_per_million: 1000000,
    output_price_micro_per_million: 2000000,
    per_call_micro: 15000,
    per_day_micro: 30000,
    per_month_micro: 60000,
    timeout_ms: 1000,
    chat_output_field: "max_tokens",
    ...overrides,
  };
  const id = await domain.hash(a);
  await db
    .prepare(
      "INSERT INTO azure_authorizations (id,workspace,project_id,binding_hash,descriptor_json,expires_at,created_at) VALUES (?,'operator',?,?,?,?,?)",
    )
    .bind(
      id,
      p.id,
      a.binding_hash,
      domain.canonical(a),
      a.expires_at,
      domain.now(),
    )
    .run();
  return {
    id,
    a,
    env: {
      ...env,
      AZURE_ENABLED: "true",
      AZURE_API_KEY: "FIXTURE_NOT_A_REAL_CREDENTIAL",
    },
  };
}
function fixtureDraft(p, claims = []) {
  return {
    title: "FIXTURE mock provider candidate",
    description: "Synthetic contract test; no provider contacted",
    body: "Synthetic mock output used only in an isolated test. ".repeat(25),
    internal_links: [],
    claims,
    media: [],
  };
}
function chatReply(draft, overrides = {}) {
  return Response.json(
    {
      id: "fixture-response-id",
      model: "fixture-model-version",
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(draft) } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
      ...overrides,
    },
    { headers: { "apim-request-id": "fixture-request-id" } },
  );
}
test("Azure gates refuse missing binding, wrong scope, revoked approval, and budget without sending", async () => {
  const project = await makeReady();
  let calls = 0;
  const never = async () => {
    calls++;
    throw Error("A blocked gate must not send");
  };
  let r = await azure.runAzureAuthor(
    env,
    project.state.project,
    crypto.randomUUID(),
    never,
  );
  assert.equal(r.state, "blocked");
  assert.equal(calls, 0);
  const grant = await permit(project, { per_call_micro: 1 });
  r = await azure.runAzureAuthor(
    grant.env,
    project.state.project,
    crypto.randomUUID(),
    never,
  );
  assert.equal(r.state, "blocked");
  assert.equal(calls, 0);
  await db
    .prepare("UPDATE azure_authorizations SET revoked_at=? WHERE id=?")
    .bind(domain.now(), grant.id)
    .run();
  r = await azure.runAzureAuthor(
    grant.env,
    project.state.project,
    crypto.randomUUID(),
    never,
  );
  assert.equal(r.state, "blocked");
  assert.equal(calls, 0);
});
test("mock Azure request crosses a durable send fence once, saves a model candidate, and requires human review", async () => {
  const project = await makeReady(),
    grant = await permit(project),
    source = project.state.project.sources[0];
  let calls = 0;
  const send = async (url, options) => {
    calls++;
    assert.equal(url, grant.a.endpoint + "/chat/completions");
    assert.equal(options.redirect, "manual");
    assert.equal(options.headers["api-key"], "FIXTURE_NOT_A_REAL_CREDENTIAL");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "fixture-only");
    assert.equal(body.max_tokens, 1024);
    assert.equal(body.store, false);
    assert.equal(body.stream, false);
    assert.equal(body.tools, undefined);
    const ledger = await db
      .prepare(
        "SELECT state,request_sent,reserved_micro FROM azure_jobs WHERE project_id=?",
      )
      .bind(project.id)
      .first();
    assert.equal(ledger.state, "sending");
    assert.equal(ledger.request_sent, 1);
    assert.equal(ledger.reserved_micro, 14048);
    return chatReply(
      fixtureDraft(project.state.project, [
        {
          text: "Fixture supplied-input claim",
          source_id: source.id,
          status: "verified",
          note: "A model may not verify itself",
        },
      ]),
    );
  };
  let r = await call(
    "/api/projects/" + project.id + "/author",
    { expected_revision: project.state.project.revision },
    grant.env,
    send,
  );
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(calls, 1);
  const model = r.body.project.versions.at(-1);
  assert.equal(model.packet.provenance.kind, "azure_generated");
  assert.equal(model.packet.claims[0].status, "unresolved");
  assert.equal(r.body.project.review, null);
  const jobs = await azure.authorJobs(db, project.id);
  assert.equal(jobs[0].state, "completed");
  assert.equal(JSON.parse(jobs[0].usage_json).cost_micro, 300);
  assert.equal(JSON.parse(jobs[0].usage_json).request_id, "fixture-request-id");
  assert.match(jobs[0].request_sha256, /^[a-f0-9]{64}$/);
  let replay = await call(
    "/api/projects/" + project.id + "/author",
    { expected_revision: r.body.project.revision },
    grant.env,
    send,
  );
  assert.equal(replay.status, 200);
  assert.equal(calls, 1);
  assert.equal(
    replay.body.project.versions.length,
    r.body.project.versions.length,
  );
  r = replay;
  const held = await call(
    "/api/projects/" + project.id + "/review",
    {
      expected_revision: r.body.project.revision,
      reviewer: "FIXTURE human",
      note: "Synthetic declaration",
      version_id: model.id,
      review_hash: r.body.review_hash,
      attestations: {
        facts: true,
        rights: true,
        brand: true,
        claims_complete: true,
      },
    },
    grant.env,
    send,
  );
  assert.equal(held.status, 422);
  r = await call(
    "/api/projects/" + project.id + "/draft",
    {
      expected_revision: r.body.project.revision,
      ...model.packet,
      author: "FIXTURE human editor",
      provenance: "human_imported",
      claims: model.packet.claims.map((c) => ({
        ...c,
        status: "verified",
        note: "FIXTURE human source check; mechanical verification only",
      })),
    },
    grant.env,
    send,
  );
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const edited = r.body.project.versions.at(-1);
  assert.equal(
    edited.packet.provenance.model_lineage.job_id,
    model.packet.provenance.job_id,
  );
  r = await call(
    "/api/projects/" + project.id + "/review",
    {
      expected_revision: r.body.project.revision,
      reviewer: "FIXTURE separate reviewer",
      note: "Mock-only contract verification",
      version_id: edited.id,
      review_hash: r.body.review_hash,
      attestations: {
        facts: true,
        rights: true,
        brand: true,
        claims_complete: true,
      },
    },
    grant.env,
    send,
  );
  assert.equal(r.status, 200);
  r = await call(
    "/api/projects/" + project.id + "/export",
    { expected_revision: r.body.project.revision },
    grant.env,
    send,
  );
  assert.equal(r.status, 200);
  assert.equal(calls, 1);
});
test("timeout after send is terminal uncertain_cost; replay and interrupted send fence never resend", async () => {
  const project = await makeReady(),
    grant = await permit(project);
  let calls = 0;
  const timeout = async () => {
    calls++;
    throw Error("FIXTURE timeout after durable fence");
  };
  let r = await azure.runAzureAuthor(
    grant.env,
    project.state.project,
    crypto.randomUUID(),
    timeout,
  );
  assert.equal(r.state, "uncertain_cost");
  assert.equal(r.retry_allowed, false);
  r = await azure.runAzureAuthor(
    grant.env,
    project.state.project,
    crypto.randomUUID(),
    timeout,
  );
  assert.equal(r.state, "uncertain_cost");
  assert.equal(calls, 1);
  const other = await makeReady(),
    g = await permit(other);
  let pendingId;
  const barrier = async () => {
    calls++;
    pendingId = (
      await db
        .prepare("SELECT id FROM azure_jobs WHERE project_id=?")
        .bind(other.id)
        .first()
    ).id;
    await db
      .prepare(
        "UPDATE azure_jobs SET state='uncertain_cost',error_code='FIXTURE interrupted send' WHERE id=?",
      )
      .bind(pendingId)
      .run();
    return chatReply(fixtureDraft(other.state.project));
  };
  r = await azure.runAzureAuthor(
    g.env,
    other.state.project,
    crypto.randomUUID(),
    barrier,
  );
  assert.equal(r.state, "uncertain_cost");
  assert.equal(r.draft, undefined);
});
test("revocation during mock provider response holds candidate; Responses protocol is bounded and model mismatch cannot substitute", async () => {
  const project = await makeReady(),
    grant = await permit(project);
  let calls = 0;
  let r = await azure.runAzureAuthor(
    grant.env,
    project.state.project,
    crypto.randomUUID(),
    async () => {
      calls++;
      await db
        .prepare("UPDATE azure_authorizations SET revoked_at=? WHERE id=?")
        .bind(domain.now(), grant.id)
        .run();
      return chatReply(fixtureDraft(project.state.project));
    },
  );
  assert.equal(r.state, "completed_held");
  assert.equal(r.draft, undefined);
  assert.equal(calls, 1);
  const other = await makeReady(),
    g = await permit(other, { protocol: "responses" });
  r = await azure.runAzureAuthor(
    g.env,
    other.state.project,
    crypto.randomUUID(),
    async (url, options) => {
      calls++;
      assert.equal(url, g.a.endpoint + "/responses");
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 1024);
      return Response.json({
        id: "fixture-responses-id",
        model: "fixture-model-version",
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(fixtureDraft(other.state.project)),
              },
            ],
          },
        ],
        usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
      });
    },
  );
  assert.equal(r.state, "completed");
  assert.equal(calls, 2);
  const mismatch = await makeReady(),
    gm = await permit(mismatch);
  r = await azure.runAzureAuthor(
    gm.env,
    mismatch.state.project,
    crypto.randomUUID(),
    async () => {
      calls++;
      return chatReply(fixtureDraft(mismatch.state.project), {
        model: "unapproved-fixture-model",
      });
    },
  );
  assert.equal(r.state, "uncertain_cost");
  assert.equal(r.draft, undefined);
});
test("account reservations enforce shared daily ceiling across project operations", async () => {
  const one = await makeReady(),
    two = await makeReady(),
    account = "fixture-shared-account-" + crypto.randomUUID();
  const a = await permit(one, { account_id: account, per_day_micro: 15000 }),
    b = await permit(two, { account_id: account, per_day_micro: 15000 });
  let calls = 0;
  const send = async () => {
    calls++;
    return chatReply(fixtureDraft(one.state.project));
  };
  const results = await Promise.all([
    azure.runAzureAuthor(a.env, one.state.project, crypto.randomUUID(), send),
    azure.runAzureAuthor(b.env, two.state.project, crypto.randomUUID(), send),
  ]);
  assert.equal(calls, 1);
  assert.equal(results.filter((r) => r.state === "completed").length, 1);
  assert.equal(results.filter((r) => r.state === "blocked").length, 1);
});

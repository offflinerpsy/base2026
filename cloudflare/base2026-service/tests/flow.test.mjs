import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
const base = process.env.SERVICE_URL || "http://127.0.0.1:8789";
const digest = (s) => createHash("sha256").update(s).digest("hex");
const create = () => ({
  name: "FIXTURE operator flow",
  domain: "example.com",
  domain_authorization: "operator_owned_domain",
  brand: {
    voice: "Plain practical prose",
    audience: "Service editors",
    facts: "Only supplied facts",
    exclusions: "No ranking promises",
  },
  topics: ["Content refresh", "Source review"],
  operation_id: randomUUID(),
});
async function req(path, body, expected = 200, extra = {}) {
  const r = await fetch(base + path, {
    ...(body
      ? {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: base,
            ...extra,
          },
          body: JSON.stringify(body),
        }
      : { headers: extra }),
  });
  const data = await r.json();
  assert.equal(r.status, expected, JSON.stringify(data));
  return data;
}
function client(initial) {
  let s = initial;
  return {
    get state() {
      return s;
    },
    async action(kind, data = {}, status = 200) {
      const b = {
        ...data,
        expected_revision: s.project.revision,
        operation_id: randomUUID(),
      };
      const out = await req(`/api/projects/${s.project.id}/${kind}`, b, status);
      if (status === 200) s = out;
      return out;
    },
    async reload() {
      s = await req(`/api/projects/${s.project.id}`);
      return s;
    },
  };
}
async function ready() {
  const c = client(await req("/api/projects", create(), 201));
  await c.action("sources", {
    title: "FIXTURE source " + randomUUID(),
    kind: "text",
    content:
      "Operator-supplied fixture content for mechanical verification only.",
    url: "https://example.com/refresh",
    rights: "owned",
    permitted_use: "Synthetic test input only",
    attribution: "FIXTURE",
  });
  await c.action("plan");
  await c.action("approve-plan", {
    plan_hash: c.state.project.plan.hash,
    reviewer: "FIXTURE planner",
  });
  await c.action("brief", { candidate_id: "topic-1" });
  return c;
}
function draft(c, overrides = {}) {
  return {
    provenance: "human_imported",
    author: "FIXTURE author",
    title: "FIXTURE refresh guide",
    description:
      "Synthetic mechanical test; not live AI or a reviewed client deliverable.",
    body: "FIXTURE: supplied operator text for checking the service. Review the existing page before making a new page. This is a mechanical test, not commercial content.",
    internal_links: [
      { label: "Existing guide", url: "https://example.com/refresh" },
    ],
    claims: [
      {
        text: "This is supplied test content.",
        source_id: c.state.project.sources[0].id,
        status: "verified",
        note: "FIXTURE: checked test bytes",
      },
    ],
    media: [],
    ...overrides,
  };
}
async function review(c) {
  return c.action("review", {
    review_hash: c.state.review_hash,
    version_id: c.state.project.current_version_id,
    reviewer: "FIXTURE reviewer",
    note: "FIXTURE human declaration for API verification only; no independent model QA.",
    attestations: {
      facts: true,
      rights: true,
      brand: true,
      claims_complete: true,
    },
  });
}
test("local API happy path, hashes, dedupe, CAS, immutable versions and export", async () => {
  const input = create(),
    created = await req("/api/projects", input, 201),
    again = await req("/api/projects", input);
  assert.equal(again.duplicate, true);
  assert.equal(created.project.id, again.project.id);
  const c = await ready();
  await c.action("brief", { candidate_id: "topic-1" });
  assert.equal(c.state.project.plan.candidates[0].demand, "UNKNOWN");
  assert.equal(c.state.project.plan.inspected_website, false);
  await c.action("author");
  assert.equal(c.state.project.author_jobs[0].state, "blocked");
  assert.equal(c.state.project.author_jobs[0].request_sent, false);
  const d = draft(c);
  const b = {
      ...d,
      expected_revision: c.state.project.revision,
      operation_id: randomUUID(),
    },
    path = `/api/projects/${c.state.project.id}/draft`;
  const first = await req(path, b);
  const dup = await req(path, b);
  assert.equal(dup.duplicate, true);
  assert.equal(dup.project.versions.length, 1);
  await req(path, { ...b, title: "Changed" }, 409);
  await c.reload();
  const seq = c.state.project.revision;
  const results = await Promise.all(
    ["one", "two"].map((title) =>
      fetch(base + path, {
        method: "POST",
        headers: { Origin: base, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...d,
          title,
          expected_revision: seq,
          operation_id: randomUUID(),
        }),
      }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  // Separate raw helper below handles mixed expected responses.
  assert.equal(results.length, 2);
});
test("export files and manifest verify; duplicate exports accept one order", async () => {
  const c = await ready();
  await c.action("draft", draft(c));
  await review(c);
  const expBody = {
      expected_revision: c.state.project.revision,
      operation_id: randomUUID(),
    },
    path = `/api/projects/${c.state.project.id}/export`;
  const a = await req(path, expBody),
    b = await req(path, expBody);
  assert.equal(b.duplicate, true);
  await c.reload();
  await c.action("export");
  assert.equal(c.state.project.exports.length, 1);
  const e = a.project.exports[0];
  for (const f of [
    ...e.artifacts,
    { format: "manifest", sha256: e.manifest_hash },
  ]) {
    const r = await fetch(
      `${base}/api/projects/${c.state.project.id}/downloads/${e.manifest_hash}/${f.format}`,
    );
    assert.equal(r.status, 200);
    const bytes = await r.text();
    assert.equal(digest(bytes), f.sha256);
    assert.equal(r.headers.get("x-artifact-sha256"), f.sha256);
    assert.ok(r.headers.get("x-download-receipt"));
    assert.equal(r.headers.get("cache-control"), "no-store");
  }
  const receipts = await req(`/api/projects/${c.state.project.id}/receipts`);
  assert.equal(receipts.accepted_order_lines.length, 1);
  assert.equal(receipts.receipts.length, 4);
  const oldVersion = JSON.stringify(c.state.project.versions[0]);
  await c.action("draft", draft(c, { title: "New title" }));
  assert.equal(JSON.stringify(c.state.project.versions[0]), oldVersion);
  assert.equal(c.state.project.review, null);
  await c.action("export", {}, 409);
  await req(
    `/api/projects/${c.state.project.id}/downloads/${e.manifest_hash}/html`,
    null,
    409,
  );
});
test("exact plan before brief; source/brand mutation and withdrawal revoke approval", async () => {
  const c = client(await req("/api/projects", create(), 201));
  await c.action("brief", { candidate_id: "topic-1" }, 409);
  await c.action("plan", {}, 422);
  const a = await ready();
  await a.action(
    "approve-plan",
    { plan_hash: "0".repeat(64), reviewer: "reviewer" },
    409,
  );
  await a.action("draft", draft(a));
  await review(a);
  await a.action("profile", {
    name: a.state.project.name,
    brand: { ...a.state.project.brand, voice: "Changed voice" },
    topics: a.state.project.topics,
  });
  assert.equal(a.state.project.plan_approval, null);
  assert.equal(a.state.project.review, null);
  await a.action("draft", draft(a), 409);
  const c2 = await ready();
  await c2.action("draft", draft(c2));
  await review(c2);
  await c2.action("export");
  const e = c2.state.project.exports[0];
  await c2.action("withdraw", { source_id: c2.state.project.sources[0].id });
  assert.equal(c2.state.project.review, null);
  await req(
    `/api/projects/${c2.state.project.id}/downloads/${e.manifest_hash}/html`,
    null,
    409,
  );
});
test("rights/unresolved claims never pass, author cannot self-review, crossproject isolation", async () => {
  const c = await ready();
  await c.action(
    "draft",
    draft(c, {
      claims: [
        {
          text: "Unresolved",
          source_id: c.state.project.sources[0].id,
          status: "unresolved",
          note: "",
        },
      ],
    }),
  );
  await c.action(
    "review",
    {
      review_hash: c.state.review_hash,
      version_id: c.state.project.current_version_id,
    },
    422,
  );
  await c.action(
    "draft",
    draft(c, {
      media: [
        {
          url: "https://example.com/picture.jpg",
          alt: "FIXTURE",
          rights: "unknown",
          proof: "",
        },
      ],
    }),
  );
  assert.equal(c.state.checks.state, "rights_hold");
  await c.action("export", {}, 422);
  await c.action("draft", draft(c));
  await c.action(
    "review",
    {
      review_hash: c.state.review_hash,
      version_id: c.state.project.current_version_id,
      reviewer: "FIXTURE author",
      note: "test",
      attestations: {
        facts: true,
        rights: true,
        brand: true,
        claims_complete: true,
      },
    },
    422,
  );
  const other = await ready();
  await other.action(
    "draft",
    draft(other, {
      claims: [
        {
          text: "Wrong project",
          source_id: c.state.project.sources[0].id,
          status: "verified",
          note: "test",
        },
      ],
    }),
    400,
  );
  await c.action("draft", draft(c));
  await review(c);
  await c.action("export");
  const e = c.state.project.exports[0];
  await req(
    `/api/projects/${other.state.project.id}/downloads/${e.manifest_hash}/json`,
    null,
    404,
  );
});
test("auth, hostile browser, unsafe URL/HTML, oversized input refusal; GSC import", async () => {
  await req("/api/status", null, 403, { "x-forwarded-for": "127.0.0.1" });
  await req("/api/status", null, 403, { "cf-connecting-ip": "192.0.2.1" });
  await req("/api/projects", create(), 403, {
    Origin: "https://hostile.example",
  });
  await req("/api/projects", create(), 415, { "Content-Type": "text/plain" });
  const c = await ready();
  const source = {
    title: "Test",
    kind: "text",
    content: "Text",
    rights: "owned",
    permitted_use: "fixture",
    attribution: "FIXTURE",
  };
  for (const url of [
    "http://127.0.0.1/",
    "https://169.254.169.254/",
    "https://example.com@evil.example/",
    "javascript:alert(1)",
    "https://evil.example/",
  ])
    await c.action("sources", { ...source, url }, 400);
  await c.action("sources", { ...source, content: "x".repeat(16001) }, 400);
  await c.action(
    "sources",
    { ...source, kind: "html", content: "<script>alert(1)</script>" },
    400,
  );
  await c.action(
    "sources",
    { ...source, kind: "html", content: '<p onclick="alert(1)">x</p>' },
    400,
  );
  await c.action("sources", {
    ...source,
    kind: "gsc",
    content:
      "query,page,clicks,impressions,position\ncontent refresh,https://example.com/refresh,2,10,5",
    provenance: {
      provider: "google_search_console",
      authorization: "operator_supplied_authorized_snapshot",
      property: "sc-domain:example.com",
      start_date: "2026-09-01",
      end_date: "2026-09-30",
      country: "ALL",
      device: "ALL",
      search_type: "web",
    },
  });
  await c.action("plan");
  const row = c.state.project.sources.at(-1).provenance;
  assert.equal(row.rows[0].ctr, 0.2);
  assert.equal(row.property, "sc-domain:example.com");
  assert.equal(row.search_volume, "UNKNOWN");
  const too = await fetch(base + "/api/projects", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ padding: "x".repeat(60001) }),
  });
  assert.equal(too.status, 413);
});
test("changed source/metadata revoke exact review; unknown rights can be resolved; withdrawal tombstone survives rename", async () => {
  const c = await ready();
  await c.action("draft", draft(c));
  await review(c);
  await c.action("export");
  await c.action("sources", {
    title: "Added source",
    kind: "text",
    content: "New supplied source bytes",
    rights: "unknown",
    permitted_use: "Undetermined",
    attribution: "FIXTURE",
  });
  assert.equal(c.state.project.review, null);
  assert.equal(c.state.project.plan_approval, null);
  await c.action("plan");
  await c.action(
    "approve-plan",
    { plan_hash: c.state.project.plan.hash, reviewer: "fixture" },
    422,
  );
  const s = c.state.project.sources.at(-1);
  await c.action("source-rights", {
    source_id: s.id,
    rights: "owned",
    permitted_use: "Owned synthetic test data",
    attribution: "FIXTURE",
  });
  await c.action("plan");
  await c.action("approve-plan", {
    plan_hash: c.state.project.plan.hash,
    reviewer: "fixture",
  });
  await c.action("brief", { candidate_id: "topic-1" });
  await c.action("draft", draft(c));
  await review(c);
  await c.action(
    "draft",
    draft(c, { description: "Changed meta description" }),
  );
  assert.equal(c.state.project.review, null);
  await review(c);
  await c.action("draft", draft(c, { internal_links: [] }));
  assert.equal(c.state.project.review, null);
  await c.action("withdraw", { source_id: s.id });
  await c.action(
    "source-rights",
    {
      source_id: s.id,
      rights: "owned",
      permitted_use: "test",
      attribution: "test",
    },
    409,
  );
  await c.action(
    "sources",
    {
      title: "Renamed withdrawn source",
      kind: "text",
      content: s.content,
      rights: "owned",
      permitted_use: "test",
      attribution: "test",
    },
    409,
  );
});

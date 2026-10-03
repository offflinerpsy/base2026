import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
const temp = await mkdtemp(join(tmpdir(), "base2026-service-test-"));
for (const name of ["domain", "azure", "index"]) {
  const code = await readFile(
    new URL(`../src/${name}.ts`, import.meta.url),
    "utf8",
  );
  const out = ts
    .transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace(/from ["']\.\/domain["']/g, 'from "./domain.mjs"')
    .replace(/from ["']\.\/azure["']/g, 'from "./azure.mjs"');
  await writeFile(join(temp, `${name}.mjs`), out);
}
const domain = await import(join(temp, "domain.mjs")),
  azure = await import(join(temp, "azure.mjs")),
  worker = await import(join(temp, "index.mjs"));
test.after(() => rm(temp, { recursive: true, force: true }));
test("untrusted client gate fields cannot enable Azure; possibly charged send cannot retry", () => {
  const enabled = {
    enabled: "true",
    deployment: "authorized-deployment",
    model: "exact-model-v1",
    processorApproval: "exact-processing-approval",
    region: "approved-region",
    budgetUSD: 5,
    authorizationHash: "a".repeat(64),
  };
  assert.equal(azure.azureStatus(enabled).state, "blocked");
  assert.equal(azure.azureStatus(enabled).request_sent, false);
  assert.deepEqual(azure.classifyProviderFailure(true, false), {
    state: "uncertain_cost",
    retry_allowed: false,
  });
  assert.deepEqual(azure.classifyProviderFailure(false, true), {
    state: "failed",
    retry_allowed: false,
  });
});
test("server refuses nonlocal, forwarded and disabled environments even with a loopback URL", async () => {
  const env = { SERVICE_MODE: "disabled" };
  let r = await worker.default.fetch(
    new Request("http://127.0.0.1:8789/api/status", {
      headers: { host: "127.0.0.1:8789" },
    }),
    env,
  );
  assert.equal(r.status, 403);
  r = await worker.default.fetch(
    new Request("https://service.example/api/status", {
      headers: { host: "service.example" },
    }),
    { SERVICE_MODE: "loopback" },
  );
  assert.equal(r.status, 403);
  assert.throws(
    () =>
      worker.access(
        new Request("http://127.0.0.1:8789/api/status", {
          headers: { host: "127.0.0.1:8789", "cf-ray": "edge" },
        }),
        { SERVICE_MODE: "loopback" },
      ),
    /forwarded_access_denied/,
  );
  assert.throws(
    () =>
      worker.access(
        new Request("http://127.0.0.1:8789/api/projects", {
          method: "POST",
          headers: {
            host: "127.0.0.1:8789",
            "Content-Type": "application/json",
          },
        }),
        { SERVICE_MODE: "loopback" },
      ),
    /same_origin_required/,
  );
});
test("HTML and Markdown render text safely and never run imported content", () => {
  const packet = {
    title: "Title <img src=x onerror=alert(1)>",
    description: 'Description "quoted"',
    body: "A & B\n\n<script>alert(1)</script> [x](javascript:alert(1))",
    internal_links: [],
    claims: [],
    media: [],
    provenance: { kind: "human_imported", author: "FIXTURE" },
  };
  const html = domain.renderHTML(packet),
    md = domain.renderMarkdown(packet);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!md.includes("<script>"));
  assert.ok(md.includes("\\["));
});
test("GSC rejects scope/date/metric drift instead of inventing or silently repairing values", () => {
  const provenance = {
    provider: "google_search_console",
    authorization: "operator_supplied_authorized_snapshot",
    property: "sc-domain:example.com",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    country: "ALL",
    device: "ALL",
    search_type: "web",
  };
  const csv =
    "query,page,clicks,impressions,position\nrefresh,https://example.com/page,1,10,5";
  assert.throws(
    () =>
      domain.gscInput(
        csv,
        { ...provenance, start_date: "2026-02-30" },
        "example.com",
      ),
    /invalid_gsc_date/,
  );
  assert.throws(
    () =>
      domain.gscInput(
        csv,
        { ...provenance, property: "sc-domain:other.example" },
        "example.com",
      ),
    /gsc_property_scope/,
  );
  assert.throws(
    () =>
      domain.gscInput(
        csv.replace(",1,10,", ",11,10,"),
        provenance,
        "example.com",
      ),
    /gsc_metric_invalid/,
  );
});

test("CSV keeps quoted commas/newlines and refuses characters after a closed quote", () => {
  assert.deepEqual(domain.csvRows('a,b\r\n"one, two","line1\nline2"\r\n'), [
    ["a", "b"],
    ["one, two", "line1\nline2"],
  ]);
  for (const csv of ['a,b\n"one"junk,two', 'a,b\n"one"" ,two', 'a,b\n"one,two'])
    assert.throws(() => domain.csvRows(csv), /malformed_csv/);
});
test("Markdown exports preserve the reviewed media URL and its rights basis", () => {
  const md = domain.renderMarkdown({
    title: "Fixture",
    description: "Fixture",
    body: "Fixture",
    internal_links: [],
    claims: [],
    media: [
      {
        url: "https://example.com/asset",
        alt: "Fixture",
        rights: "owned",
        proof: "Fixture only",
      },
    ],
    provenance: { author: "Fixture", kind: "human_imported" },
  });
  assert.ok(md.includes("https://example\\.com/asset"));
  assert.ok(md.includes("owned"));
});

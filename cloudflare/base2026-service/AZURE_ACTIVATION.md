# Direct Azure adapter: activation boundary

The service implements direct Azure v1 chat-completions and Responses transport.
Live activation is currently blocked. Mock transport tests are contract checks.

## Operator evidence and generated descriptor

An engineer creates the canonical descriptor and its SHA-256 ID from one reviewed
human-readable approval packet. The owner approves the concrete resource, model,
input purpose, processing scope and maximum spend; the owner does not assemble
hashes or database fields. An administrator then provisions the immutable
`azure_authorizations` row. There is no browser approval-provisioning endpoint.

Every `AzureApproval` field in [src/azure.ts](src/azure.ts) is required:

- One exact existing resource endpoint, protocol and deployment alias; model
  version, expected returned model identifier and recent deployment evidence SHA.
  Supported bases are `https://<resource>.openai.azure.com/openai/v1[/]` and
  `https://<resource>.services.ai.azure.com/openai/v1[/]`. One optional trailing
  slash is normalized. The descriptor pins the full resource hostname. Userinfo,
  ports, queries, fragments, path tricks, other hosts and redirects are refused.
- Resource region, exact deployment SKU/type, permitted processing geography and
  `versionUpgradeOption`, derived from existing account/deployment metadata.
  Resource location alone does not establish inference residency. Standard
  processing may span regions in its geography; DataZone and Global have wider
  processing scopes according to their deployment type. Approve that actual scope.
- Exact project/input/source/brand binding, accepted plan hash and brief order ID;
  processor approval evidence covering purpose, rights, retention, processing
  geography and expiry. A scope change invalidates the record.
- Existing billing account identity, current undiscounted input/output USD rates
  converted to integer micro-USD per million tokens, price evidence SHA, token
  caps, call/day/month ceilings, spend authorization evidence SHA and expiry.
- Supported output-limit field and bounded timeout. One attempt, no fallback,
  provider tools or automatic resend.

Metadata fields are approved declarations backed by deployment evidence. Runtime
checks compare the returned `model` identifier and usage; they do not independently
prove the underlying model version, deployment SKU, upgrade policy or processing
location. Refresh metadata before acceptance, especially if automatic upgrades
are configured. Never infer these from a deployment alias or the Ubuntu VM region.

Microsoft documents the [supported endpoint formats](https://learn.microsoft.com/en-us/azure/ai-studio/ai-services/concepts/endpoints)
and [deployment processing locations](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy).

The administration boundary is the trust anchor: descriptor hashes alone do not
prove consent. The row repeats workspace/project/input and expiry, and permits
only a separate revocation timestamp to change.

## One local canary after specific approval

Prepare one synthetic, nonprivate project and saved brief. Freeze its request hash,
metadata evidence, price evidence, token reservation, USD cap and expiry in the
approval packet. Missing metadata or rates make the packet unready for approval;
historic model aliases and general pricing estimates must not fill those gaps.

After approval for that one paid request, the existing credential custodian binds
only the already approved existing resource key as `AZURE_API_KEY`, using local
Wrangler `.dev.vars`, private and ignored, mode 0600. Keys must not enter chat,
browser data, descriptor JSON, logs or command arguments. Do not copy the whole
provider environment. This step does not create a credential or access grant.

Do **not** use `wrangler secret put` for the local canary: it creates a Worker
version and belongs to a separate approved cloud deployment. Cloud identity and
nonlocal access remain disabled, independently of successful local acceptance.

Select `SERVICE_ENABLE_APPROVED_AZURE=true` only for the approved local launcher.
It cannot bypass exact scope, rights, expiry, model, budget or durable send gates.
The status API exposes server-derived gate booleans and project readiness without
revealing keys. Checking readiness does not send a provider request.

Make the one bounded request. Check returned model identifier, request IDs, usage,
cost, saved candidate and evidence lineage; a different human must review the
actual draft before export. Timeout or an unknown charged result is a terminal
`uncertain_cost`, with manual account reconciliation and no automatic resend.
Current instructions prohibit spend; no credential binding or paid canary has
been performed.

## Reservation scope and durable behavior

Full-price cost is reserved in D1 before the durable send fence. Call/day/month
ceilings aggregate reservations across project approvals sharing an account ID
**inside this service D1 database**. They do not limit other applications, Azure
account-wide spending, other database instances or external jobs. Check actual
billing authority and concurrent external spend separately before approval.

Job identity binds the approval, source/plan/order and exact request hash. Input,
output, response body and deadline are bounded. Successful candidates preserve
model/job/request/usage and approved deployment metadata. Claims remain unresolved
and media rights unknown until human verification; edits retain model lineage.
Changed input authority during a response holds the candidate.

Unknown responses keep their reservation and never resend. A late response cannot
silently accept an uncertain send. Manual reconciliation uses provider/account
evidence; no automatic refund or global billing enforcement is claimed.

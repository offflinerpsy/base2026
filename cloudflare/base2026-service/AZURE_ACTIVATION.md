# Direct Azure adapter: activation boundary

The service implements direct Azure v1 chat-completions and Responses HTTP transport.
It never invokes DSH, Harness or an agent runner. Current live activation is blocked;
deterministic mock transport tests are not provider acceptance.

## Exact records required

The server administrator provisions an immutable `azure_authorizations` record,
not a browser form. Its ID is SHA-256 of the canonical descriptor JSON. The descriptor
must contain every `AzureApproval` field in [src/azure.ts](src/azure.ts):

- Existing resource HTTPS endpoint, chosen protocol and exact deployment alias;
  underlying model version, expected returned model identifier, verified processing
  region and model evidence SHA. A configured alias alone is insufficient.
- Exact project ID, input/source/brand binding hash, accepted plan hash and brief
  order ID; processor approval SHA covering those inputs, permitted purpose,
  retention/residency and expiry. Scope changes invalidate the record.
- Existing billing account identity, full-price input/output rates in micro-USD per
  million tokens, price evidence SHA, input/output token caps, per-call/day/month
  micro-USD ceilings, spend authorization SHA and effective expiry.
- Supported chat output-limit field (`max_tokens` or `max_completion_tokens`) and
  bounded timeout. No automatic model substitution, retries or tools.

The approval row repeats workspace/project/binding and expiry, records creation
time, and permits only a separate revocation timestamp to change. The database
administration boundary is the trust anchor; the descriptor hashes do not prove
consent by themselves. There is no approval-creation API for users.

## Credential custody and first call

The existing credential custodian must bind only the approved existing resource
credential as server secret `AZURE_API_KEY`. Never send it to the browser, put it
in the authorization descriptor, log it, expose it in command arguments, or copy
the entire existing provider environment.

For an approved local integration, use Wrangler's private ignored `.dev.vars`
secret mechanism with mode 0600, supplied by the credential custodian. Do not paste
the value into chat. For a later approved isolated cloud Worker, the supported
server-secret binding is `wrangler secret put AZURE_API_KEY`; that step belongs
to the separately gated deployment/custody process. Neither binding was performed
during implementation. No new credential or grant is assumed.

Local development defaults to `AZURE_ENABLED=false`. After the exact approval row,
credential binding and explicit first-call spend permission are verified, the
operator may select `SERVICE_ENABLE_APPROVED_AZURE=true` for the local launcher.
That flag cannot bypass the scope, rights, expiry, model, budget or send fences.
Cloud access remains disabled until its approved identity boundary is implemented.

Then authorize one bounded canary, verify actual returned model/version and usage
against the pinned descriptor, independently review the draft, and test the
service result. Existing subscription access is not an API budget. Current
instructions prohibit spend, so no live canary was attempted.

## Durable behavior already implemented

A full-price reservation is committed in D1 before a separate durable send fence.
Account/day/month caps include all reservations conservatively, across project
approvals. Job identity deduplicates the exact approval/input/plan/order operation.
There is one HTTP attempt, bounded input/output/body/time, manual redirect refusal,
model/usage validation, and no provider tools.

Successful candidates retain model/job/request/usage provenance. Model claims
remain unresolved and media rights unknown until a human supplies verification.
A distinct human review is still required for export. Human edits retain model
lineage. Changed authority during a response holds its candidate.

Timeouts, interrupted sends, unverified usage/model or unknown responses become
terminal `uncertain_cost`; they retain the reservation and never resend
automatically. A late response cannot silently turn an uncertain send into accepted
content. Manual reconciliation must use provider/account evidence under the
approved administration boundary. No automated reconciliation or budget refund
is claimed.

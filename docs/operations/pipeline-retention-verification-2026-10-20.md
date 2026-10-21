# Retention recovery and private evidence checks — 21 October 2026

The private capture worker now retains the original video, normalized audio and
manifest for future eligible captures within its existing size and duration
bounds. The repair removes a restriction to one previous test source. It leaves
the accepted audio processing, container, budgets and publication holds intact.

This is a bounded retention result. Full cloud processing, content acceptance,
publication and autonomous operation are separate gates under
[AGR-107](https://linear.app/agregator/issue/AGR-107/base2026-restore-tiktok-pipeline-through-verified-quality-publication).

## Verified behavior

- The exact retention change received independent review, eight focused entry
  tests and a strict TypeScript check. The release adapter passed seven guards.
- Staging and activation each ran once. A difference between POST and GET
  response metadata was reconciled against the same staged version before
  activation. No deployment was repeated to obtain a cleaner receipt.
- One genuinely new, manually selected source entered the existing intake path
  and was captured by the scheduled controller. Its three stored artifacts
  matched the database and manifest by byte size and SHA-256.
- Complete decoding of both the original and normalized audio produced
  8,150,829 samples at 48 kHz, or 169.8089375 seconds. The capture was not trimmed.

The source was manually selected; this does not establish ordinary cloud
discovery. Private implementation, source media, raw captions, service responses,
account identifiers and operational receipts are excluded from this document.

## Separate local Azure comparison

The comparison used the existing covered account and local bearer route. It
required no key transfer to the worker. One full-source Speech request and four
native-frame Read requests produced a shared evidence packet. Both writers
received exactly the same packet and instructions, with one request per writer.

| Writer | Native input/output tokens | Single-request elapsed time | Estimate at recorded public base rates | Unedited output |
| --- | ---: | ---: | ---: | --- |
| GPT-6 Luna | 10,442 / 1,230 | 18.369 s | $0.0016592 | Coherent, but rejected for treating OCR errors as visible facts and omitting part of a step |
| Phi-4-mini-instruct v1 | 10,204 / 911 | 24.011 s | $0.0010386 | Rejected: no coherent explanation |

Luna's output count includes 722 reasoning tokens; cache writes were zero. The
Phi response used the internal label `phi4-mini-instruct`. A read-only check
confirmed the same admitted deployment after the response; this does not prove
the exact served weights. The original name-mismatch diagnostic was preserved.

The seven requests together have a public-rate estimate of **$0.0236978**.
Reservations remain **$0.265**, including earlier reservations, below the existing
**$2** experiment ceiling. These figures are estimates, not settled invoice costs.

The full initial writer bodies exceeded a 60 KiB request guard. Recording word
field names once reduced both bodies below 39 KiB without dropping words,
timings or OCR. Independent inversion reproduced all five original extraction
projections and all 735 word objects exactly; 20 transport guard checks passed.

One sample per writer is not a general model benchmark. Neither unedited output
was accepted for production. No ASR winner is established: the comparison lacks
a matching current Whisper result and an independently heard reference.

## Private audiovisual contract

A separately corrected English explanation and private evidence contract passed
independent review. The contract binds eight material units to 28 machine-speech
segments and five selected native-frame references. It preserves exact formula
punctuation, audio/frame hashes and original video timestamps. The accepted
artifact contains the exact reviewed English text; raw model outputs remain
unchanged and rejected.

The first review found an unsupported visual citation and a path through which
nested metadata could enter a model request. Both were corrected in the second
revision. All 34 focused checks passed; the independent reviewer verified the
exact revised files and artifact. This establishes bounded local fidelity, not
continuous video review or an independently heard reference transcript.

## Native private inspection — 21 October

An authenticated private inspection handler is now deployed and verified. It
validates a supplied audiovisual review packet against the retained capture,
including database provenance and the three objects' checksums, sizes, content
types, privacy metadata and capture roles. It returns the same independently
accepted private explanation, with its text, revision and evidence unchanged.

Independent review found and corrected two boundary defects before release:
visual references could extend into an audio-only tail, and malformed scalar
fields could produce an internal error. Visual references now use the retained
video's exact time base and half-open timestamp range. Twelve worker-entry tests
passed with platform, database and object-storage mocks, along with strict
TypeScript checks. The release adapter passed six focused guards. The earlier
34 fidelity checks were reused because their accepted inputs did not change.

Staging and activation each ran once. Separate readbacks verified the exact
deployed bundle, all 66 preserved bindings, the same container and unchanged
source, model and publication scopes. One incompatible legacy transport attempt
stopped before application authentication; its exact nonce remained absent and
the source history was unchanged. That failed attempt was preserved. The
existing native client then sent the inspection once, after independent review
and five isolated transport guards. No access or edge configuration changed.

The returned artifact matched the accepted private revision exactly. All 17
source and history queries remained unchanged after the inspection. The only
observed database change was one authentication nonce; no provider call,
business-state transition, media retrieval, queue dispatch or publication was
observed.

## Durable private external review — 21 October

The private review-store route now retains a typed audiovisual review envelope
through the existing metadata artifact and object-storage layer. It preserves
the validated context, writer result and exact accepted private explanation in
its original schema. The envelope records external-review origin and declared
decoded-audio provenance; native extraction and pipeline readiness remain false.

The exact code and release adapter passed independent review. Nine worker-entry
HMAC tests used the actual SQLite migrations and transactions, with object
storage, platform, queues and providers mocked. Strict TypeScript and seven
release-adapter guards passed. Production build verification compared all 67
actual inputs: 64 accepted inputs were unchanged. The adapter also preserves a
failed fence-query response before raising, so rejected preflight evidence is
retained. These checks do not establish atomicity across database and object
storage.

Source status and version checks guard database writes and object-storage
boundaries. A concurrent hold prevents acceptance. An uncertain object PUT
retains the pending or quarantined receipt and bytes for reconciliation; the
request neither deletes them nor retries. The internal storage path creates no
job, outbox entry or source-state transition.

Staging and activation each ran once, with the exact deployed bundle, all 66
bindings, existing container and unchanged scopes verified. The canonical
store caller received independent review and six isolated transport guards.
A fresh readback admitted one call against the unchanged held source. The
response was retained before validation; a separate 22-query observation and
one GET of only the new JSON object independently verified the result.

The stored envelope was exactly **59,823 bytes** and matched the prepared
SHA-256 and nested private explanation. The database showed one new metadata
artifact, one artifact audit, one managed creation-sequence increment and one
authentication nonce. The original three capture objects, source, jobs, outbox,
model history, imports and public state were unchanged. No original media was
retrieved again and no provider request was made.

## Remaining boundary

Durable external review is accepted. It does not establish authenticated native
cloud visual extraction or independent decoded-audio provenance. The current
native task/model allowlist contains transcription and semantic analysis, with
no configured Azure credential binding or native visual task. The completed
local bearer experiment does not authenticate a worker-side extractor; the old
uncertain key-read outcome remains unresolved.

The existing transcript-only upload and public formats remain unchanged. The
private audiovisual artifact stays under its own schema inside the metadata
envelope. Native extraction, downstream processing, ordinary useful generation,
ordinary discovery, acoustic fidelity and continuous visual coverage remain
open. A successful storage receipt cannot close those gates.

The new source remains awaiting transcription under preserved source scopes.
Publication, owner holds and the development heartbeat remain unchanged. No
public page, autonomous publication or full recovery is accepted here.

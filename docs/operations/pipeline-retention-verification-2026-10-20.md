# Retention recovery and private evidence checks — 20 October 2026

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

## Remaining boundary

A separate editorial correction can be reviewed against the retained native
frames and machine speech without rewriting the raw model outputs. That local
review does not establish the production worker's complete audiovisual path.
The new cloud source's last verified state is awaiting transcription under the
preserved source scopes. Publication, owner holds and the development heartbeat
remain unchanged. No public page or autonomous publication is accepted here.

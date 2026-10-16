/** Display only. Persisted evidence, source identity and editorial synthesis stay unchanged. */
interface ExcerptCard {
  ordinal: number;
  claim_text: string;
  suggested_action: string;
  topic_label: string;
  evidence_excerpt: string;
  evidence_start_seconds: number;
  evidence_end_seconds: number;
}

/** Remove only the machine timing markers produced by the transcript excerpt writer. */
export function sourceExcerptDisplay(value: string): { text: string; transcriptTiming: boolean } {
  let transcriptTiming = false;
  const text = value.replace(/\[(\d+(?:\.\d+)?)s-(\d+(?:\.\d+)?)s\]/gu, (marker, start: string, end: string) => {
    if (!Number.isFinite(Number(end)) || Number(end) < Number(start)) return marker;
    transcriptTiming = true;
    return "";
  }).trim();
  return { text, transcriptTiming };
}

function comparable(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function renderSourceExcerptCard(
  row: ExcerptCard,
  hasExplanation: boolean,
  escape: (value: string) => string,
  seconds: (value: number) => string,
): string {
  const excerpt = sourceExcerptDisplay(row.evidence_excerpt);
  const range = `${seconds(row.evidence_start_seconds)}–${seconds(row.evidence_end_seconds)}`;
  // These are explicit extractive-writer wrappers, not a separate editorial claim.
  // Never promote the quote (or an unverified topic label) into a giant heading.
  const extractiveClaim = /^The source states:\s*["“]/u.test(row.claim_text.trim());
  const claim = !hasExplanation && !extractiveClaim && comparable(row.claim_text) !== comparable(excerpt.text)
    ? `<p class="b26-source-claim">${escape(row.claim_text)}</p>` : "";
  const genericAction = /^Compare this source statement with independent evidence before acting\.?$/iu.test(comparable(row.suggested_action));
  const action = !hasExplanation && !genericAction && row.suggested_action.trim()
    ? `<h3>Suggested action</h3><p>${escape(row.suggested_action)}</p>` : "";
  const topic = hasExplanation ? `<p class="topic">${escape(row.topic_label)}</p>` : "";
  const label = hasExplanation ? "Evidence excerpt" : "Excerpt";
  return `<article class="b26-source-record">${topic}<h2>${label} ${row.ordinal + 1}</h2><p class="time">${excerpt.transcriptTiming ? "Transcript excerpt" : "Source excerpt"} ${escape(range)}</p>${claim}<blockquote>${escape(excerpt.text)}</blockquote>${action}</article>`;
}

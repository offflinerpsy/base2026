import { describe, expect, it } from "vitest";
import { renderSourceExcerptCard, sourceExcerptDisplay } from "../src/source-excerpt-view";

const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const seconds = (value: number) => `0:${String(Math.floor(value)).padStart(2, "0")}`;
const card = {
  ordinal: 0, topic_label: "Synthetic topic",
  claim_text: 'The source states: "Synthetic spoken words remain unchanged."',
  evidence_excerpt: "[0.000s-2.500s] Synthetic spoken words [2.500s-5.000s] remain unchanged.",
  evidence_start_seconds: 0, evidence_end_seconds: 5,
  suggested_action: "Compare this source statement with independent evidence before acting.",
};

describe("source excerpt presentation", () => {
  it("removes only recognized forward timing markers and preserves other bracketed text", () => {
    const result = sourceExcerptDisplay("[0.000s-2.500s] Keep [citation needed], [5s-3s] and every original word.");
    expect(result.transcriptTiming).toBe(true);
    expect(result.text).toBe("Keep [citation needed], [5s-3s] and every original word.");
    expect(sourceExcerptDisplay("An ordinary [quoted reference].")).toEqual({
      text: "An ordinary [quoted reference].", transcriptTiming: false,
    });
  });

  it("shows a short neutral heading, one quote and its separate time range", () => {
    const html = renderSourceExcerptCard(card, false, escape, seconds);
    expect(html).toContain("<h2>Excerpt 1</h2>");
    expect(html).toContain("Transcript excerpt 0:00–0:05");
    expect(html).toContain("Synthetic spoken words  remain unchanged.");
    expect(html.match(/<blockquote>/gu)).toHaveLength(1);
    expect(html).not.toContain("The source states:");
    expect(html).not.toContain("Synthetic topic");
    expect(html).not.toContain("Suggested action");
  });

  it("preserves specific editorial claims and actions with escaped evidence", () => {
    const html = renderSourceExcerptCard({ ...card,
      claim_text: "A distinct synthetic interpretation.",
      suggested_action: "Inspect the cited example before adapting it.",
      evidence_excerpt: "An exact <example> & its supporting words.",
    }, false, escape, seconds);
    expect(html).toContain("A distinct synthetic interpretation.");
    expect(html).toContain("Inspect the cited example before adapting it.");
    expect(html).toContain("An exact &lt;example&gt; &amp; its supporting words.");
    expect(html).not.toContain("<example>");
  });

  it("does not repeat a claim that is already the exact quote", () => {
    const html = renderSourceExcerptCard({ ...card,
      claim_text: "One synthetic statement.", evidence_excerpt: "One synthetic statement.",
    }, false, escape, seconds);
    expect(html.match(/One synthetic statement\./gu)).toHaveLength(1);
  });
});

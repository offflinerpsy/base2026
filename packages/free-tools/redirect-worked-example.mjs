import {checkRedirectMap} from './assets/static/free-tools/engine.mjs';
import {TOOLS} from './assets/static/free-tools/tools.mjs';

// Page-specific, synthetic input. The checker still calculates every user run.
export const CORRECTED_REDIRECT_MAP = 'from,to,status\nhttps://example.test/old,https://example.test/new,301\nhttps://example.test/middle,https://example.test/new,301\nhttps://example.test/a,https://example.test/new,302\nhttps://example.test/b,https://example.test/new,302\nhttps://example.test/conflict,https://example.test/one,301\n';

const fixes = [
  ['Chain', '/old → /middle → /new', 'The /old source takes two planned hops to reach /new.', 'Point /old directly to /new. Keep /middle → /new for visits to the old middle URL.'],
  ['Loop', '/a → /b → /a', 'Neither source reaches a terminal target in this map.', 'Choose an intended destination. In this example, point both /a and /b directly to /new; keep their supplied 302 status.'],
  ['Conflicting source', '/conflict → /one and /conflict → /two', 'One source has two different targets. It is excluded from chain resolution until you choose a mapping.', 'Confirm which destination is intended and keep one mapping. This example keeps /conflict → /one.'],
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function expectedResults() {
  const before = checkRedirectMap(TOOLS['redirect-map-checker'].sample);
  const after = checkRedirectMap({map: CORRECTED_REDIRECT_MAP});
  const counts = result => Object.fromEntries(result.summary);
  const b = counts(before), a = counts(after);
  return {
    before: `${b['Multi-hop sources']} multi-hop source, ${b['Sources entering loops']} sources entering loops and ${b['Conflicting sources']} conflicting source.`,
    beforeRows: `${b['Valid unique sources']} sources appear in the result table. The two rows for /conflict count as one conflicting source and are excluded from that table.`,
    after: `${a['Valid unique sources']} valid unique sources, ${a['Conflicting sources']} conflicting sources, ${a['Sources entering loops']} sources entering loops and ${a['Multi-hop sources']} multi-hop sources.`,
    afterRows: `All ${after.rows.length} result rows have one planned hop.`,
  };
}

export function redirectWorkedExampleHtml() {
  const expected = expectedResults();
  const rows = fixes.map(([name, before, meaning, change]) => `<tr><td data-label="Before"><strong>${escape(name)}</strong><p>${escape(before)}</p></td><td data-label="What it means">${escape(meaning)}</td><td data-label="What to change">${escape(change)}</td></tr>`).join('');
  return `<section class="tool-panel" id="worked-example" aria-labelledby="worked-example-heading"><h2 id="worked-example-heading">Work through a redirect map</h2><p>This made-up map has a chain, a loop and a conflicting source. All paths below use <code>https://example.test</code>. The corrected file makes explicit choices for this example; choose destinations that fit your own site.</p><ol class="tool-scope"><li><strong>Calculate the original plan.</strong> Select <a href="#try-example">Try an example</a>, then <a href="#run-tool">Check the redirect map</a>. Expect ${escape(expected.before)} ${escape(expected.beforeRows)} <a href="./sample-map.csv" download>Download the original CSV</a>.</li><li><strong>Review each finding.</strong> Use the table below to decide which mapping to change. A hop is one planned redirect from a source to its next target.</li><li><strong>Load the corrected plan and run again.</strong> <a href="./sample-map-corrected.csv" download>Download the corrected CSV</a>, choose it in <a href="#file-map">the local CSV file input</a>, then select <a href="#run-tool">Check the redirect map</a> again. The selected file replaces pasted text for that run.</li></ol><table class="tool-table" aria-label="Redirect example findings and corrections"><thead><tr><th scope="col">Before</th><th scope="col">What it means</th><th scope="col">What to change</th></tr></thead><tbody>${rows}</tbody></table><h3>Compare the corrected result</h3><p>Expect ${escape(expected.after)} ${escape(expected.afterRows)} The checker calculates this from the corrected file when you run it.</p><p><strong>Next check:</strong> Confirm the intended destinations and status codes before implementing your own plan. Then test the deployed redirects and target responses. Zero findings here means no listed map issues were found in the supplied data; it does not verify live HTTP status, target pages or indexing.</p></section>`;
}

export function redirectWorkedExampleMarkdown() {
  const expected = expectedResults();
  return `## Worked example\n\nAll example URLs are synthetic and use https://example.test.\n\n1. Use **Try an example**, then **Check the redirect map**, or load [the original CSV](./sample-map.csv). Expect ${expected.before} ${expected.beforeRows}\n2. Review the changes below. A hop is one planned redirect from a source to its next target.\n3. Download [the corrected CSV](./sample-map-corrected.csv), choose it in the local file input and run the check again. A selected file is used instead of pasted text.\n\n${fixes.map(([name,before,meaning,change]) => `- **${name}: ${before}.** ${meaning} ${change}`).join('\n')}\n\nThe corrected run should show ${expected.after} ${expected.afterRows} These destinations are choices for the made-up site, not suggested destinations for your own URLs.\n\nConfirm intended destinations and status codes before implementing a plan, then test the deployed redirects and target responses. No listed map issues does not establish live HTTP status, target-page availability or indexing.\n\n`;
}

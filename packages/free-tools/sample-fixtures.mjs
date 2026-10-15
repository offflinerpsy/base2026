// Test/export fixtures only. Match the option values loaded by Try an example.
export const originalSampleIds = ['robots-txt-tester','redirect-map-checker','hreflang-checker','broken-link-task-builder','seo-crawl-comparison'];

export function sampleOptions(def) {
  return Object.fromEntries(def.options.map(option => [option.name,
    option.type === 'checkbox' ? !!option.value : option.sampleValue ?? option.value,
  ]));
}

// Explicit expectations for later packages; original five goldens stay in place.
export const laterSampleExpectations = {
  // Three distinct crawl URLs; sitemap/GSC observations add no new URL.
  'indexing-signal-reconciler': {rows:3,exports:4},
  // Six input dispositions; four standard exports plus the draft _redirects.
  'redirect-rule-compiler': {rows:6,exports:5},
  // /guide, /other and inventory-only /unlinked; standard exports plus anchors/details.
  'internal-link-anchor-auditor': {rows:3,exports:6},
  // Union: /guide, /other, /before-only, /after-only; plus raw-metrics/details exports.
  'gsc-period-diff-analyzer': {rows:4,exports:6},
  // Three nonblank page records; standard exports plus supplied checked rows.
  'serp-snippet-audit': {rows:3,exports:5},
  // Article/Person plus three @id-only references; the @graph container is excluded.
  'json-ld-schema-auditor': {rows:5,exports:4},
};

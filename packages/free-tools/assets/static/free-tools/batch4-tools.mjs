export const BATCH4_TOOLS = {
  'serp-snippet-audit': {
    name:'Metadata CSV Auditor & Snippet Preview',
    title:'Free Metadata CSV Auditor & Snippet Preview | Base2026',
    h1:'Audit your metadata CSV and preview a supplied row',
    description:'Audit a metadata CSV for missing or duplicate titles and descriptions. Preview supplied text, review social fields and download the results. Free, local processing.',
    intro:'Review the metadata in your export. Find missing or repeated titles and descriptions, then select a row to see an illustrative text preview.',
    action:'Audit the metadata',category:'Review page metadata',
    snippetPreview:true,
    findingSourceLabel:'Result row',
    limitHelp:'Local processing · no signup · one CSV up to 5,000 data rows and 2 MiB. No pages or images are fetched.',
    inputs:[{role:'pages',label:'Page metadata CSV',format:'csv',required:true,help:'Required: url,title,description. Optional: h1,og_title,og_description,og_image,twitter_card. Explicit crawler aliases are supported; duplicate or ambiguous headers are rejected.'}],
    options:[],
    sample:{pages:'url,title,description,h1,og_title,og_description,og_image,twitter_card\nhttps://example.test/guide/,Migration guide,Plan a site move.,Migration guide,Migration guide,Plan a site move.,https://example.test/social.png,summary_large_image\nhttps://example.test/checklist/,Migration guide,Plan a site move.,Redirect checklist,,,,\nhttps://example.test/draft/,,A draft description.,,,,,\n'},
    boundaries:[
      'Blank CSV records are ignored. Counts and exports cover the rows checked. Result rows are numbered sequentially and are not line numbers in your input file. No skipped-record count is inferred.',
      'Audits supplied CSV observations only. Missing columns are UNKNOWN; a supplied blank cell is MISSING. No live tags, URLs, image files, indexing or search results are verified.',
      'Character counts use Unicode code points after NFC normalization, whitespace collapse and trimming. They are not grapheme counts, pixel measurements, length recommendations or Google truncation limits.',
      'Duplicate titles/descriptions mean identical case-sensitive normalized text across distinct valid supplied URL strings. Repeated rows for one URL are reported separately; invalid URL rows stay visible but do not enter cross-URL duplicate groups.',
      'Title/H1 equality or difference is informational. It does not predict a Google title rewrite, quality, rankings or CTR. Social states inventory supplied text only; SUPPLIED does not validate tag syntax, image availability, dimensions or a rendered card.',
      'The selectable preview formats your supplied text illustratively. Google may choose different title or snippet text. It is not a live SERP or a device-specific simulation.',
      'CSV exports quote cells and prefix common spreadsheet formula-leading values with an apostrophe. Review imported spreadsheet behavior; exported copies are files you choose to retain.'
    ],
    contractNotes:['Supported aliases and normalization are documented in input-contract.json. No implicit column positions, fuzzy header matching or inferred social data.'],
    extraOutputs:['Rows checked CSV'],
    next:[['Check supplied HTML','/tools/page-readiness/'],['Compare crawl exports','/tools/seo-crawl-comparison/'],['Read the crawl comparison guide','/guides/compare-seo-crawl-exports/']]
  }
};


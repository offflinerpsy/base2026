export const BATCH5_TOOLS = {
  'json-ld-schema-auditor': {
    name:'JSON-LD Graph Inspector',
    title:'Free JSON-LD Graph Inspector & Syntax Validator | Base2026',
    h1:'JSON-LD Graph Inspector',
    description:'Inspect a JSON-LD graph locally: check JSON syntax, inventory nested entities and review exact @id references. No URL fetching or rich-result eligibility claims.',
    intro:'Paste raw JSON-LD to inspect its objects, types and @id references. Keep parsing, entity inventory and reference coverage separate while you review the supplied graph.',
    action:'Inspect the graph',category:'Inspect structured data',
    findingSourceLabel:'Entity row',contractFormat:'jsonld',
    limitHelp:'Local processing · no signup · raw JSON-LD up to 2 MiB, 5,000 objects, 20,000 values and 64 container levels. No pages or contexts are fetched.',
    previewHelp:'Results CSV is the entity inventory. Entity row numbers identify this inventory, not input line numbers.',
    inputs:[{role:'schema_input',label:'Raw JSON-LD',format:'json',accept:'.json,.jsonld,application/json,application/ld+json',required:true,help:'Paste one JSON object or array, or choose a UTF-8 .json or .jsonld file. Exclude HTML and script tags. Maximum 2 MiB; no URL or remote context is requested.'}],
    options:[],
    sample:{schema_input:JSON.stringify({
      '@context':'https://schema.org',
      '@graph':[
        {'@id':'#article','@type':'Article',headline:'A practical site migration checklist',datePublished:'2026-10-01',author:{'@id':'#author'},publisher:{'@id':'#publisher'},license:{'@id':'https://license.example.test/terms'}},
        {'@id':'#author','@type':'Person',name:'Morgan Lee'}
      ]
    },null,2)+'\n'},
    boundaries:[
      'Inspect raw JSON-LD only. HTML extraction, URL requests, remote contexts, JSON-LD expansion and Schema.org vocabulary validation are not performed.',
      'Parsing, entity inventory and reference coverage are separate observations. Parsed JSON or matching references do not establish fully valid JSON-LD, Google rich-result eligibility, visible-page agreement, rankings or traffic effects.',
      'Objects in root arrays, @graph and nested properties are inspected. Empty objects, pure @graph/@context containers and @value/@list/@set wrappers are not entity rows; their nested objects are still inspected. Objects inside @context are counted for limits but are not entities.',
      'Only literal keywords are recognized. Contexts and aliases are not expanded or applied, and types are supplied labels rather than verified vocabulary terms. A missing context or type is not automatically an invalid graph.',
      'An @id-only reference has exactly one member, @id, with a string value. A definition has a string @id and another member besides @id or @context. Exact supplied strings match without trimming, URL normalization or base resolution; reference strings are not followed.',
      'An unmatched reference with a URI scheme has external-definition state UNKNOWN. Other unmatched strings, including fragments, relative paths, blank-node labels and the empty string, are local references not matched in this input. Neither observation proves that the published graph is broken.',
      'Several definition objects can share an @id. They are retained as multiple definitions for review; fragments are not inherently invalid. Merging, equivalence and conflicting-property semantics are not implemented.',
      'Native JSON.parse keeps the last value of repeated member names within one object; these duplicate member names are not separately diagnosed. Separate objects with the same @id are retained.',
      'Limits apply before a complete result is returned: 2 MiB UTF-8, 5,000 objects including contexts, 20,000 total values, 64 nested object/array levels, 16,384 UTF-16 units per string/member name and 4,096 per JSON pointer. Reduce or split the input if a limit is reached; partial inventories are not exported.',
      'CSV copies use the unchanged shared quoting and formula-prefix protection. Input and results stay in tab memory until cleared, navigation or closing; downloads are files you choose to keep.'
    ],
    contractNotes:['input-contract.json defines the raw inspection rules and result states. This tool does not run a JSON Schema or Google rich-result validator.'],
    next:[['Check supplied page HTML','/tools/page-readiness/'],['Audit a metadata CSV','/tools/serp-snippet-audit/'],['Read the crawl comparison guide','/guides/compare-seo-crawl-exports/'],['Research schema and AI citations','/topics/schema-ai-citations']]
  }
};

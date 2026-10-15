import {BATCH5_TOOLS} from './batch5-tools.mjs';
import {BATCH4_TOOLS} from './batch4-tools.mjs';
import {BATCH3_TOOLS} from './batch3-tools.mjs';
import {BATCH2_TOOLS} from './batch2-tools.mjs';
export const TOOLS = {
  'robots-txt-tester': {
    name:'Robots.txt Tester', title:'Free Robots.txt Tester for Your URL List | Base2026',
    h1:'Free robots.txt tester',
    description:'Robots.txt tester for your URL list. Check supplied Allow and Disallow rules, see matched paths and export results. Local processing; no website crawl.',
    intro:'See the matching rule for each supplied URL before you change robots.txt. Nothing is fetched or submitted.',
    action:'Test the rules', category:'Check crawl rules',
    inputs:[{role:'robots',label:'robots.txt content',format:'txt',required:true,help:'Paste the file content or choose a UTF-8 .txt file. Maximum 64 KiB. Google-style Allow/Disallow matching; unsupported directives are reported.'},
      {role:'urls',label:'URLs to test',format:'txt',required:true,help:'One absolute HTTP(S) URL per line, from one origin: the same scheme, host and port. Up to 5,000 URLs. The URLs are never visited.'}],
    options:[{name:'agent',label:'Crawler product token',type:'text',value:'Googlebot',help:'For example Googlebot or Googlebot-Image. Matches the most specific supplied user-agent group. This does not impersonate or contact a crawler.'}],
    sample:{robots:'User-agent: *\nDisallow: /private/\nAllow: /private/help$\n\nUser-agent: Googlebot\nDisallow: /drafts/\nAllow: /drafts/public$\nSitemap: https://example.test/sitemap.xml\n',urls:'https://example.test/\nhttps://example.test/drafts/article\nhttps://example.test/drafts/public\nhttps://example.test/private/file\n'},
    boundaries:['Tests supplied rules only; live robots.txt, HTTP status, page meta directives and indexing remain unknown.','Allowing crawling does not guarantee indexing. A robots.txt block is not a noindex instruction.','Supports Google-style group selection, Allow/Disallow, * and terminal $. Crawl-delay, Host, Noindex and unknown directives are displayed but not applied.'],
    next:[['Check supplied HTML','/tools/page-readiness/'],['Build a sitemap','/tools/sitemap-builder/']]
  },
  'redirect-map-checker': {
    name:'Redirect Map Checker', title:'Free Redirect Map Checker for CSV Plans | Base2026',
    h1:'Free redirect map checker',
    description:'Redirect map checker for CSV plans. Find conflicting targets, loops and chains in supplied mappings. Export a review before implementation; no live HTTP requests.',
    intro:'Check the redirect plan you already have. Find conflicting mappings and follow chains without sending a request to your site.',
    action:'Check the redirect map',category:'Prepare a site change',
    inputs:[{role:'map',label:'Redirect mappings CSV',format:'csv',required:true,help:'Required headers: from,to. Optional: status. Absolute HTTP(S) URLs only. Up to 5,000 mappings. Missing status stays unknown.'}],options:[],
    sample:{map:'from,to,status\nhttps://example.test/old,https://example.test/middle,301\nhttps://example.test/middle,https://example.test/new,301\nhttps://example.test/a,https://example.test/b,302\nhttps://example.test/b,https://example.test/a,302\nhttps://example.test/conflict,https://example.test/one,301\nhttps://example.test/conflict,https://example.test/two,301\n'},
    boundaries:['This checks a supplied plan, not live redirects or response headers. Final targets are terminal entries in the map, not verified 200 pages.','URL identity is exact after surrounding whitespace is trimmed. Case, query and trailing slash are preserved.','Conflicting sources are excluded from chain resolution. You decide which mapping is correct; the tool never changes your server.'],
    next:[['Compare SEO crawl exports','/tools/seo-crawl-comparison/'],['Build a sitemap','/tools/sitemap-builder/']]
  },
  'hreflang-checker': {
    name:'Hreflang Map Checker',title:'Free Hreflang Checker for Alternate URL Maps | Base2026',
    h1:'Free hreflang map checker',
    description:'Hreflang map checker for CSV exports. Find conflicting language targets, missing self references and return links in supplied data. No page fetching.',
    intro:'Bring your alternate URL map. Review conflicting language targets, self references and return links in the data you supplied.',
    action:'Check the hreflang map',category:'Prepare international pages',
    inputs:[{role:'map',label:'Hreflang map CSV',format:'csv',required:true,help:'Required headers: page_url,hreflang,alternate_url. One alternate link per row. Up to 5,000 rows. Include all pages you want to compare.'}],options:[],
    sample:{map:'page_url,hreflang,alternate_url\nhttps://example.test/en/,en,https://example.test/en/\nhttps://example.test/en/,fr,https://example.test/fr/\nhttps://example.test/fr/,fr,https://example.test/fr/\nhttps://example.test/fr/,en,https://example.test/en/\nhttps://example.test/de/,de,https://example.test/de/\nhttps://example.test/de/,en,https://example.test/en/\n'},
    boundaries:['Checks the supplied map only. It does not fetch page HTML, HTTP headers, canonicals or Google indexing.','A return link can be checked only when the destination page is present in the supplied map. Missing maps and links in conflicting language slots remain unknown.','Language-tag shape is checked, not every ISO language/region assignment or Google support. Conflicting language slots are excluded from self-reference and return-link inference.'],
    next:[['Check supplied page HTML','/tools/page-readiness/'],['Compare SEO crawl exports','/tools/seo-crawl-comparison/']]
  },
  'broken-link-task-builder': {
    name:'Broken Link Task Builder',title:'Free Broken Link Report from Crawl Exports | Base2026',
    h1:'Free broken link task builder',
    description:'Broken link task builder for crawl exports. Join supplied 404/410 statuses with inlinks and export source pages and repair tasks. No crawl or automatic changes.',
    intro:'Stop handing over a list of dead URLs without their source pages. Join your two exports and prepare a concrete repair list.',
    action:'Build the repair tasks',category:'Prepare link repairs',
    inputs:[{role:'statuses',label:'Response status CSV',format:'csv',required:true,help:'Required headers: url,status. Optional: observed_at. Only supplied 404/410 responses become broken-link tasks.'},
      {role:'inlinks',label:'Inlinks CSV',format:'csv',required:true,help:'Required headers: source,target. Optional: anchor. A Screaming Frog-style From/To/Anchor Text export is also supported. Up to 5,000 records per file.'}],options:[],
    sample:{statuses:'url,status,observed_at\nhttps://example.test/removed,404,2026-10-01\nhttps://example.test/retired,410,2026-10-01\nhttps://example.test/rate-limited,429,2026-10-01\nhttps://example.test/unavailable,503,2026-10-01\n',inlinks:'source,target,anchor\nhttps://example.test/,https://example.test/removed,Read the guide\nhttps://example.test/services/,https://example.test/removed,Our guide\nhttps://example.test/,https://example.test/retired,Old resource\nhttps://example.test/,https://example.test/rate-limited,Reference\nhttps://example.test/,https://example.test/unavailable,Another reference\n'},
    boundaries:['A supplied 404/410 is evidence at the observation time, not a live check. A 403, 429, timeout, absent status or conflicting status is unknown; a 5xx needs review.','Source pages and anchors come only from your supplied inlinks. Link counts are counts in this export, not a complete site graph.','The output is a repair handoff. It never chooses replacements, edits links or submits changes.'],
    next:[['Compare the next crawl','/tools/seo-crawl-comparison/'],['Check a redirect plan','/tools/redirect-map-checker/']]
  },
  'seo-crawl-comparison': {
    name:'SEO Crawl Comparison',title:'Free SEO Crawl Comparison from CSV Exports | Base2026',
    h1:'Free SEO crawl comparison',
    description:'SEO crawl comparison for CSV exports. Review supplied changes to status, titles, canonicals, robots directives and headings. No crawling or ranking claims.',
    intro:'Compare the observations before and after a site change. Keep field changes separate from missing coverage and planned changes.',
    action:'Compare the crawl exports',category:'Review a site change',
    inputs:[{role:'before',label:'Before crawl CSV',format:'csv',required:true,help:'Required: url. Compare any shared columns: status,title,canonical,robots,h1,description,link_count. Standard header aliases are supported.'},
      {role:'after',label:'After crawl CSV',format:'csv',required:true,help:'Use the same columns and crawler scope where possible. Up to 5,000 rows per file. Exact URL joins; no automatic mapping between different URLs.'}],
    options:[{name:'complete',label:'Both exports are complete for the same intended URL scope',type:'checkbox',value:false,help:'A declaration from you, not an independent coverage check. Leave unchecked for partial or different crawl scopes.'}],
    sample:{before:'url,status,title,canonical,robots,h1\nhttps://example.test/,200,Home,https://example.test/,index follow,Welcome\nhttps://example.test/guide/,200,Our guide,https://example.test/guide/,index follow,Our guide\nhttps://example.test/old/,200,Old page,https://example.test/old/,index follow,Old page\n',after:'url,status,title,canonical,robots,h1\nhttps://example.test/,200,Home,https://example.test/,index follow,Welcome\nhttps://example.test/guide/,200,Updated guide,https://example.test/guide/,noindex follow,Updated guide\nhttps://example.test/new/,200,New page,https://example.test/new/,index follow,New page\n'},
    boundaries:['Reports supplied snapshot changes, not live page behavior, a ranking effect or the cause of a traffic change.','A URL found in one partial export is an observation about coverage, not proof that the page was added or deleted.','Only shared supported fields are compared. Missing columns stay unknown. Invalid or conflicting duplicate rows are excluded from comparison.'],
    next:[['Check a redirect plan','/tools/redirect-map-checker/'],['Build the intended sitemap','/tools/sitemap-builder/']]
  },
  ...BATCH2_TOOLS,
  ...BATCH3_TOOLS,
  ...BATCH4_TOOLS,
  ...BATCH5_TOOLS
};
export const LIMITS = Object.freeze({fileBytes:2097152,totalBytes:4194304,records:5000,robotsBytes:65536,urlLength:4096,cellLength:16384});

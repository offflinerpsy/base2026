import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runTool,tableCsv} from './assets/static/free-tools/engine.mjs';
import {TOOLS} from './assets/static/free-tools/tools.mjs';
import {csvRows} from './assets/static/free-tools/sitemap-core.mjs';
const ISR='indexing-signal-reconciler',RRC='redirect-rule-compiler',stamp='2026-10-14T00:00:00.000Z';
const run=(id,inputs,options={})=>runTool(id,inputs,options,[],stamp);
const isr=(crawl,extra={})=>run(ISR,{crawl,...extra});
const rrc=(map,options={})=>run(RRC,{map},options);
const rules=r=>r.exports.find(f=>f.name==='_redirects').text;
const has=(r,code,url)=>r.findings.some(f=>f.rule===code&&(!url||f.subject===url));
const value=(r,url,col)=>r.rows.find(row=>row[0]===url)?.[r.columns.indexOf(col)];
const count=(r,label)=>r.summary.find(([k])=>k===label)?.[1];
const fixture=Object.fromEntries(JSON.parse(readFileSync(new URL('./batch2-fixtures.json',import.meta.url))).map(f=>[f.fixture_id,f]));
const fromFixture=id=>{const f=fixture[id];return run(f.tool_id,f.inputs,f.options);};

test('two new samples calculate deterministic exports with explicit boundaries',()=>{
 for(const id of [ISR,RRC]){const r=run(id,TOOLS[id].sample);assert.equal(r.exports.length,id===RRC?5:4);assert.ok(r.rows.length);assert.equal(r.manifest.privacy.target_fetch,false);assert.equal(r.manifest.privacy.upload,false);assert.equal(r.manifest.observed_at,stamp);assert.deepEqual(r,run(id,TOOLS[id].sample));
  for(const f of r.exports)if(f.name.endsWith('.csv'))assert.equal(csvRows(f.text,50000).length,(f.name.includes('findings')?r.findings:r.rows).length+1);
  assert.deepEqual(JSON.parse(r.exports.find(f=>f.name.endsWith('manifest.json')).text),r.manifest);
 }
 assert.equal(TOOLS[RRC].options.find(o=>o.name==='flatten_chains').value,false);
});
test('ISR fixtures 1–3: independent supplied-signal expectations',()=>{
 const a=fromFixture('ISR-F01');assert.equal(a.rows.length,4);assert.equal(value(a,'https://example.test/promo-draft/','Primary finding'),'SITEMAP_NOINDEX_CONFLICT');assert.ok(has(a,'USER_GOOGLE_CANONICAL_SPLIT','https://example.test/pricing/'));assert.ok(has(a,'GSC_NOT_INDEXED_CLEAN_SIGNALS','https://example.test/guides/deep-audit/'));
 const b=fromFixture('ISR-F02');assert.equal(count(b,'Aligned supplied signals'),2);assert.equal(value(b,'https://example.test/guides/?sort=newest','Supplied noindex signal'),true);
 const c=fromFixture('ISR-F03');assert.ok(has(c,'SITEMAP_NON_SELF_CANONICAL','https://example.test/article'));assert.ok(has(c,'CANONICAL_TARGET_ADVERSE_SIGNAL','https://example.test/old-offer/'));
});
test('ISR fixtures 4–6: absent, malformed and missing target observations',()=>{
 assert.equal(value(fromFixture('ISR-F04'),'https://example.test/syndicated-post/','Canonical target evidence'),'UNKNOWN_OUTSIDE_CRAWL');
 assert.throws(()=>fromFixture('ISR-F05'),/required header url is missing/);
 const f=fromFixture('ISR-F06');assert.equal(value(f,'https://example.test/variant-page/','Canonical target evidence'),'UNKNOWN_MISSING_SIGNAL');assert.ok(!has(f,'CANONICAL_TARGET_ADVERSE_SIGNAL'));
});
test('ISR distinguishes invalid numeric status from observed non-200',()=>{
 for(const status of ['','unknown','200 OK','0','99','600','1e2','200.0','NaN']){const r=isr(`url,status,robots,canonical\nhttps://e.test/a,${status},index,https://e.test/a`,{sitemap:'https://e.test/a'});assert.equal(value(r,'https://e.test/a','Supplied HTTP status'),'UNKNOWN');assert.ok(!has(r,'SITEMAP_NON_200'));assert.equal(count(r,'Aligned supplied signals'),0);}
 for(const status of [100,199,201,404,599]){const r=isr(`url,status\nhttps://e.test/a,${status}`,{sitemap:'https://e.test/a'});assert.ok(has(r,'SITEMAP_NON_200'));}
});
test('ISR robots none/noindex precedence, unknown tokens and missing fields',()=>{
 for(const directives of ['none','index noindex','NOINDEX follow','none,index']){const r=isr(`url,status,robots,canonical\nhttps://e.test/a,200,"${directives}",https://e.test/a`,{sitemap:'https://e.test/a'});assert.equal(value(r,'https://e.test/a','Supplied noindex signal'),true);assert.ok(has(r,'SITEMAP_NOINDEX_CONFLICT'));}
 for(const directives of ['', 'mystery','index mystery','follow']){const r=isr(`url,status,robots,canonical\nhttps://e.test/a,200,${directives},https://e.test/a`,{sitemap:'https://e.test/a'});assert.equal(value(r,'https://e.test/a','Supplied noindex signal'),'UNKNOWN');assert.equal(count(r,'Aligned supplied signals'),0);}
 for(const crawl of ['url,status\nhttps://e.test/a,200','url,canonical\nhttps://e.test/a,https://e.test/a'])assert.equal(count(isr(crawl,{sitemap:'https://e.test/a'}),'Aligned supplied signals'),0);
 assert.throws(()=>isr('url\nhttps://e.test/a'),/at least one/);
});
test('ISR emits every applicable contradiction rather than stopping at first',()=>{
 const r=isr('url,status,robots,canonical\nhttps://e.test/a,404,noindex,https://e.test/b\nhttps://e.test/b,410,none,https://e.test/b',{sitemap:'https://e.test/a',gsc:'url,google_canonical\nhttps://e.test/a,https://e.test/c'});
 for(const code of ['SITEMAP_NOINDEX_CONFLICT','SITEMAP_NON_200','SITEMAP_NON_SELF_CANONICAL','CANONICAL_TARGET_ADVERSE_SIGNAL','USER_GOOGLE_CANONICAL_SPLIT','SUPPLIED_NOINDEX'])assert.ok(has(r,code,'https://e.test/a'),code);
 assert.equal(value(r,'https://e.test/a','Primary finding'),'SITEMAP_NOINDEX_CONFLICT');
});
test('ISR conflicting canonical targets remain unknown even when first row is 404',()=>{
 const r=isr('url,status,robots,canonical\nhttps://e.test/a,200,index,https://e.test/b\nhttps://e.test/b,404,index,https://e.test/b\nhttps://e.test/b,200,index,https://e.test/b');
 assert.equal(value(r,'https://e.test/b','Crawl evidence'),'CONFLICT');assert.equal(value(r,'https://e.test/a','Canonical target evidence'),'UNKNOWN_CONFLICT');assert.ok(!has(r,'CANONICAL_TARGET_ADVERSE_SIGNAL','https://e.test/a'));
});
test('ISR missing optional evidence, sitemap-only URLs and GSC conflicts remain distinct',()=>{
 const a=isr('url,status\nhttps://e.test/a,200');assert.equal(value(a,'https://e.test/a','In supplied sitemap'),'UNKNOWN_NOT_SUPPLIED');
 const b=isr('url,status\nhttps://e.test/a,200',{sitemap:'https://e.test/b',gsc:'url,gsc_status,google_canonical\nhttps://e.test/a,Not indexed,https://e.test/a\nhttps://e.test/a,Indexed,https://e.test/b'});
 assert.equal(value(b,'https://e.test/b','Crawl evidence'),'MISSING');assert.equal(value(b,'https://e.test/a','Supplied GSC status'),'UNKNOWN_CONFLICT');assert.ok(has(b,'SITEMAP_URL_MISSING_FROM_CRAWL'));assert.ok(!has(b,'USER_GOOGLE_CANONICAL_SPLIT'));
});
test('ISR XML entities and exact case/query/slash joins; reject entity declarations',()=>{
 const r=isr('url,status\nhttps://e.test/A?x=1&y=2,200\nhttps://e.test/a,200\nhttps://e.test/a/,200',{sitemap:'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://e.test/A?x=1&amp;y=2</loc></url></urlset>'});assert.equal(r.rows.length,3);assert.equal(value(r,'https://e.test/A?x=1&y=2','In supplied sitemap'),true);assert.equal(value(r,'https://e.test/a','In supplied sitemap'),false);
 const comma=isr('url,status\n"https://e.test/a,b?x=1,2",200',{sitemap:'https://e.test/a,b?x=1,2'});assert.equal(value(comma,'https://e.test/a,b?x=1,2','In supplied sitemap'),true);
 assert.throws(()=>isr('url,status\nhttps://e.test/a,200',{sitemap:'<!DOCTYPE x><urlset/>'}),/DOCTYPE/);
});
test('ISR hostile text remains data and CSV formula cells are protected',()=>{
 const r=isr('url,status\nhttps://e.test/a,200',{gsc:'url,gsc_status\nhttps://e.test/a,"=HYPERLINK(""https://evil.test"") <script>alert(1)</script>"'});assert.ok(r.exports[0].text.includes("'=HYPERLINK"));assert.ok(r.rows[0][8].includes('<script>'));assert.equal(r.manifest.scope.live_indexability,'UNKNOWN');
});
test('RRC fixtures 1–2: duplicate collapse, mixed status preservation and exact origin conversion',()=>{
 const a=fromFixture('RRC-F01');assert.equal(rules(a),'/guides/old-checklist /guides/redirect-map-checklist/ 301\n/legacy-seo /old-seo 301\n/old-seo /tools/seo-crawl-comparison/ 308\n');assert.equal(count(a,'Collapsed duplicates'),1);assert.equal(count(a,'Flattened chains'),0);assert.ok(has(a,'MIXED_STATUS_CHAIN_NOT_FLATTENED'));
 assert.equal(rules(fromFixture('RRC-F02')),'/services/audit /tools/page-readiness/ 301\n/sitemap-tool /tools/sitemap-builder/ 308\n');
});
test('RRC fixtures 3–6: exclude hostile paths, queries, cycles and every mixed-origin row',()=>{
 assert.equal(rules(fromFixture('RRC-F03')),'/clean-path /tools/ 301\n');assert.equal(rules(fromFixture('RRC-F04')),'');assert.throws(()=>fromFixture('RRC-F05'),/required header to is missing/);const mixed=fromFixture('RRC-F06');assert.equal(rules(mixed),'');assert.equal(count(mixed,'Excluded mappings'),2);assert.equal(mixed.findings.filter(f=>f.rule==='MIXED_SOURCE_ORIGINS').length,2);
});
test('RRC off-by-default chains preserve temporary/permanent status and explicit same-status flattening',()=>{
 const map='from,to,status\n/a,/b,302\n/b,/c,302';assert.equal(rules(rrc(map)),'/a /b 302\n/b /c 302\n');assert.equal(rules(rrc(map,{flatten_chains:true})),'/a /c 302\n/b /c 302\n');
 const mixed='from,to,status\n/a,/b,301\n/b,/c,302';assert.equal(rules(rrc(mixed,{flatten_chains:true})),'/a /b 301\n/b /c 302\n');
});
test('RRC exact path identity retains case, trailing slash and percent spelling',()=>{
 const r=rrc('from,to\n/A,/end\n/a,/end/\n/a/,/end\n/%7e,/end\n/%7E,/end');assert.equal(rules(r),'/%7E /end 301\n/%7e /end 301\n/A /end 301\n/a /end/ 301\n/a/ /end 301\n');
});
test('RRC rejects dot normalization, whitespace, controls, placeholders and ambiguous encodings in either field',()=>{
 for(const bad of ['/a/../b','/./a','/a\\b','//evil.test/a',' /a','/a ','/a\tb','/a\nb','/a*','/:id','/a%0d%0aX','/a%250d','/a%2fb','/a%2eb','/a%20b','/a%ZZ','/a%FF','/a#x','/a?x=1','javascript:alert(1)','https://user:pass@e.test/a','https://e.test/a/../b']){
  for(const [from,to]of [[bad,'/end'],['/start',bad]]){const r=rrc(tableCsv(['from','to'],[[from,to]]));assert.equal(rules(r),'',JSON.stringify([from,to]));}
 }
});
test('RRC conflicts, excluded mappings and loops block all upstream paths',()=>{
 for(const tail of [' /bad,/end,301','/bad,/x,301\n/bad,/y,301','/bad,/loop,301\n/loop,/bad,301','/bad,/end?x=1,301','/bad,/end,999']){
  const map='from,to,status\n/start,/mid,301\n/mid,/bad,301\n'+tail;const r=rrc(map);assert.ok(!rules(r).split('\n').some(line=>line.startsWith('/start ')||line.startsWith('/mid ')),tail);
 }
 const conflictingBadRow=rrc('from,to,status\n/start,/bad,301\n/bad,/safe,301\n/bad,/unsafe?x=1,301');assert.equal(rules(conflictingBadRow),'');assert.ok(has(conflictingBadRow,'SOURCE_HAS_EXCLUDED_ROW'));
});
test('RRC mixed source origins quarantine relative rows too and cannot be reversed by row order',()=>{
 const rows=[['https://a.test/x','/x2'],['https://b.test/y','/y2'],['/relative','/z']];for(const rs of [rows,[...rows].reverse()])assert.equal(rules(rrc(tableCsv(['from','to'],rs))), '');
});
test('RRC absolute external target preserved and local explicit origin participates in graph',()=>{
 const r=rrc('from,to\nhttps://a.test/start,https://a.test/next\nhttps://a.test/next,https://b.test/end',{flatten_chains:true});assert.equal(rules(r),'/next https://b.test/end 301\n/start https://b.test/end 301\n');
});
test('RRC default statuses and unsupported platform/options fail clearly',()=>{
 assert.equal(rules(rrc('from,to,status\n/a,/b,',{default_status:'307'})),'/a /b 307\n');for(const status of ['200','303','309','301!','NaN'])assert.equal(rules(rrc(`from,to,status\n/a,/b,${status}`)),'');assert.throws(()=>rrc('from,to\n/a,/b',{default_status:'999'}),/Default status/);assert.throws(()=>rrc('from,to\n/a,/b',{target_platform:'nginx'}),/Only Cloudflare/);assert.throws(()=>rrc('from,to\n/a,/b',{flatten_chains:'true'}),/boolean/);
});
test('new tools reject malformed CSV, duplicate columns, missing columns and oversized cells',()=>{
 for(const map of ['from,to\n"/a,/b','from,to,to\n/a,/b,/c','from\n/a','from,to\n/a,/b,extra'])assert.throws(()=>rrc(map));assert.throws(()=>isr('url,status\nhttps://e.test/a,'+'x'.repeat(16385)),/16,384/);
});
test('RRC exact 2000-row limit works iteratively; 2001 is rejected',()=>{
 const rows=Array.from({length:2000},(_,i)=>[`/r${i}`,`/r${i+1}`,301]);const r=rrc(tableCsv(['from','to','status'],rows));assert.equal(count(r,'Draft rules'),2000);assert.ok(rules(r).includes('/r0 /r1 301\n'));assert.throws(()=>rrc(tableCsv(['from','to','status'],[...rows,['/more','/last',301]])),/2,000/);
});
test('RRC emitted line limit is enforced without silently truncating paths',()=>{
 const prefix='/x ',suffix=' 301';const to='/'+'a'.repeat(1000-prefix.length-suffix.length-1);assert.equal(rules(rrc(`from,to\n/x,${to}`)).trimEnd().length,1000);assert.equal(rules(rrc(`from,to\n/x,${to}a`)),'');
});
test('ISR exact 5000 URL limit and combined union limit',()=>{
 const rows=Array.from({length:5000},(_,i)=>[`https://e.test/${i}`,200]);const crawl=tableCsv(['url','status'],rows);assert.equal(isr(crawl).rows.length,5000);assert.throws(()=>isr(crawl,{sitemap:'https://e.test/extra'}),/Combined URL scope/);assert.throws(()=>isr(tableCsv(['url','status'],[...rows,['https://e.test/extra',200]])),/5,000|Too many/i);
});
test('new input byte limits accept exactly 2 MiB, reject 2 MiB+1 and combined >4 MiB',()=>{
 const n=140,base='url,status,padding\n'+Array.from({length:n},()=>`https://e.test/a,200,\n`).join(''),padding=2097152-new TextEncoder().encode(base).length,unit=Math.floor(padding/n),remaining=padding%n;
 const crawl='url,status,padding\n'+Array.from({length:n},(_,i)=>`https://e.test/a,200,${'x'.repeat(unit+(i<remaining?1:0))}\n`).join('');assert.equal(new TextEncoder().encode(crawl).length,2097152);assert.equal(isr(crawl).rows.length,1);assert.throws(()=>isr(crawl+' '),/2 MiB/);assert.throws(()=>isr(crawl,{gsc:crawl,sitemap:'x'}),/4 MiB/);
});
test('frozen CSV parser remains unchanged',()=>{assert.equal(createHash('sha256').update(readFileSync(new URL('./assets/static/free-tools/sitemap-core.mjs',import.meta.url))).digest('hex'),'29ddc2c896f24e7b5e8e0ce814c1d515349a9af94d89b6dc5c80bd8270b4e434');});
test('exact browser Worker supports omitted optional roles and rejects oversize metadata before allocation',async()=>{
 let message;globalThis.self={postMessage:m=>{message=m;}};await import('./assets/static/free-tools/worker.mjs');await self.onmessage({data:{id:ISR,inputs:[{role:'crawl',text:'url,status\nhttps://e.test/a,200'}],options:{}}});assert.equal(message.ok,true);assert.equal(message.result.manifest.input_observations.filter(x=>x.input_kind==='not supplied').length,2);
 let reads=0;await self.onmessage({data:{id:RRC,inputs:[{role:'map',file:{size:2097153,arrayBuffer:()=>{reads++;throw Error('must not read');}}}],options:{}}});assert.equal(message.ok,false);assert.equal(reads,0);
});

test('F1: sitemap CSV url/loc header is recognized in any column without consuming TXT comma URLs',()=>{
 const crawl='url,status,robots,canonical\nhttps://e.test/a,200,index,https://e.test/a';
 for(const sitemap of ['lastmod,url\n2026-10-14,https://e.test/a','lastmod,"loc",note\n2026-10-14,https://e.test/a,example']){
  const r=isr(crawl,{sitemap});assert.equal(value(r,'https://e.test/a','In supplied sitemap'),true);assert.equal(value(r,'https://e.test/a','Primary finding'),'ALIGNED_SUPPLIED_SIGNALS');assert.ok(!has(r,'INVALID_SITEMAP_URL'));assert.ok(!has(r,'ALIGNED_SIGNALS_OMITTED_FROM_SITEMAP'));
 }
 const comma=isr('url,status\n"https://e.test/a,b?x=1,2",200',{sitemap:'https://e.test/a,b?x=1,2'});assert.equal(value(comma,'https://e.test/a,b?x=1,2','In supplied sitemap'),true);
});
test('F2: invalid Google canonical retains raw text and contributes unknown evidence with complete inputs',()=>{
 const crawl='url,status,robots,canonical\nhttps://e.test/a,200,index,https://e.test/a';
 for(const canonical of ['not-a-url','javascript:alert(1)','https://user:pass@e.test/a']){
  const r=isr(crawl,{sitemap:'https://e.test/a',gsc:`url,gsc_status,google_canonical,last_crawl\nhttps://e.test/a,Indexed,${canonical},2026-10-14`});
  assert.equal(value(r,'https://e.test/a','Supplied Google canonical'),canonical);assert.equal(value(r,'https://e.test/a','Google canonical evidence'),'UNKNOWN_INVALID');assert.equal(count(r,'URLs with unknown evidence'),1);assert.equal(count(r,'Canonical splits'),0);assert.ok(has(r,'INVALID_GOOGLE_CANONICAL'));assert.ok(!has(r,'USER_GOOGLE_CANONICAL_SPLIT'));
 }
});
test('F3: crawler-scoped X-Robots-Tag applicability stays unknown without a false generic noindex conflict',()=>{
 const gsc='url,gsc_status,google_canonical,last_crawl\nhttps://e.test/a,Indexed,https://e.test/a,2026-10-14';
 for(const raw of ['bingbot: noindex, googlebot: index','bingbot:noindex','googlebot: noindex','BingBot : none, GoogleBot: index']){
  const r=isr(`url,status,x_robots_tag,canonical\nhttps://e.test/a,200,"${raw}",https://e.test/a`,{sitemap:'https://e.test/a',gsc});
  assert.equal(value(r,'https://e.test/a','Supplied noindex signal'),'UNKNOWN');assert.equal(value(r,'https://e.test/a','Supplied robots text'),raw);assert.equal(count(r,'Sitemap conflicts'),0);assert.equal(count(r,'URLs with unknown evidence'),1);assert.ok(has(r,'ROBOTS_SCOPE_UNSUPPORTED'));assert.ok(!has(r,'SITEMAP_NOINDEX_CONFLICT'));assert.ok(!has(r,'SUPPLIED_NOINDEX'));
 }
 for(const raw of ['none','noindex','index,noindex','noindex,max-snippet:50']){const r=isr(`url,status,x_robots_tag,canonical\nhttps://e.test/a,200,"${raw}",https://e.test/a`,{sitemap:'https://e.test/a',gsc});assert.equal(value(r,'https://e.test/a','Supplied noindex signal'),true);assert.ok(has(r,'SITEMAP_NOINDEX_CONFLICT'));assert.ok(!has(r,'ROBOTS_SCOPE_UNSUPPORTED'));}
});

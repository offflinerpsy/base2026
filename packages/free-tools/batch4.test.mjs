import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {runTool,ANALYZERS} from './assets/static/free-tools/engine.mjs';
import {TOOLS,LIMITS} from './assets/static/free-tools/tools.mjs';
import {csvRows,decode} from './assets/static/free-tools/sitemap-core.mjs';
import {createSnippetPreview} from './assets/static/free-tools/snippet-preview.mjs';
const ID='serp-snippet-audit',stamp='2026-10-14T00:00:00.000Z';
const run=pages=>runTool(ID,{pages},{},[],stamp);
const input=(header,rows)=>[header,...rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','))].join('\n')+'\n';
const values=r=>r.rows.map(row=>Object.fromEntries(r.columns.map((k,i)=>[k,row[i]])));
const findings=(r,rule)=>r.findings.filter(f=>f.rule===rule);
const field=(r,key,index=0)=>r.snippets[index].fields.find(f=>f.name===key);
test('sample derives missing and cross-URL duplicate metadata without a score',()=>{
 const r=run(TOOLS[ID].sample.pages),s=Object.fromEntries(r.summary);
 assert.deepEqual(s,{'Rows checked (blank records excluded)':3,'Invalid page URLs':0,'Missing titles':1,'Missing descriptions':0,'Rows with shared titles':2,'Rows with shared descriptions':2});
 assert.equal(r.snippets.length,3);assert.equal(values(r)[1]['Title/H1 observation'],'DIFFERENT_INFORMATIONAL');
 assert.equal(r.exports.length,5);assert.ok(!JSON.stringify(r).includes('REWRITE_RISK'));assert.ok(!r.columns.some(x=>/score|pixel/i.test(x)));
});
test('explicit crawler aliases work and optional missing columns stay UNKNOWN',()=>{
 const r=run(input('Address,Title 1,Meta Description 1',[['https://example.test/','Title','Description']]));
 assert.ok(r.snippets[0].fields.every(x=>x.state==='UNKNOWN'&&x.value===null));
 assert.equal(values(r)[0]['Title/H1 observation'],'UNKNOWN');
 assert.equal(findings(r,'SUPPLIED_SOCIAL_FIELD_MISSING').length,0);
});
test('present blank optional cells are MISSING; supplied text is inventory not validation',()=>{
 const r=run(input('url,title,description,h1,og:title,og:description,og:image,twitter:card',[['https://example.test/','Title','Description','','',' OG description ','javascript:alert(1)','unknown-card']]));
 assert.equal(field(r,'h1').state,'MISSING');assert.equal(field(r,'og_title').state,'MISSING');
 assert.equal(field(r,'og_image').state,'SUPPLIED');assert.equal(field(r,'og_image').value,'javascript:alert(1)');
 assert.equal(field(r,'twitter_card').state,'SUPPLIED');assert.equal(r.scope.social_validation,'NOT_PERFORMED_SUPPLIED_TEXT_INVENTORY_ONLY');
});
test('missing required header is an error even with optional social columns',()=>{
 assert.throws(()=>run('url,title,og_image\nhttps://example.test/,Title,x'),/required header description/);
});
test('normalized duplicate and ambiguous alias headers fail clearly',()=>{
 for(const h of ['url,url,title,description','url,Address,title,description','url,title,meta_title,description','url,title,description,og_image,og:image','url,title,description,h1,h1-1']){
  assert.throws(()=>run(h+'\n'+Array(h.split(',').length).fill('x').join(',')),/duplicate header|several headers/);
 }
});
test('malformed quotes, row width mismatch, empty/header-only inputs and large cells are rejected',()=>{
 for(const s of ['', 'url,title,description\n', 'url,title,description\n"unterminated', 'url,title,description\nhttps://example.test/,only']){
  assert.throws(()=>run(s));
 }
 assert.throws(()=>run(input('url,title,description',[['https://example.test/','x'.repeat(16385),'D']])),/16,384/);
});
test('NFC and whitespace normalization feed code-point counts; raw values remain preserved',()=>{
 const raw='  A😀  é\n ',r=run(input('url,title,description',[['https://example.test/',raw,'x']]));
 assert.equal(values(r)[0]['Normalized title'],'A😀 é');assert.equal(values(r)[0]['Title characters'],4);
 assert.equal(csvRows(r.exports.find(x=>x.name.endsWith('-checked-rows.csv')).text)[1][2],raw);
});
test('ZWJ and combining sequences are code points, with no grapheme or pixel claim',()=>{
 const r=run(input('url,title,description',[['https://example.test/','👨‍👩‍👧‍👦','é']]));
 assert.equal(values(r)[0]['Title characters'],7);assert.equal(values(r)[0]['Description characters'],1);
 assert.equal(r.scope.character_unit,'Unicode code points; not grapheme clusters or pixels');
});
test('duplicate groups compare normalized case-sensitive text across distinct URLs',()=>{
 const r=run(input('url,title,description',[['https://example.test/a',' Café   guide ','Same'],['https://example.test/b','Café guide','Same'],['https://example.test/c','café guide','same']]));
 assert.equal(findings(r,'TITLE_DUPLICATE_REVIEW').length,2);assert.equal(findings(r,'DESCRIPTION_DUPLICATE_REVIEW').length,2);
 assert.equal(values(r)[2]['Title observation'],'PRESENT');
});
test('repeated rows for one URL are retained without inventing cross-page duplicates',()=>{
 const r=run(input('url,title,description',[['https://example.test/a','Same','Same'],[' https://example.test/a ','Same','Same']]));
 assert.equal(r.rows.length,2);assert.equal(findings(r,'REPEATED_SUPPLIED_URL').length,2);
 assert.equal(findings(r,'TITLE_DUPLICATE_REVIEW').length,0);
});
test('different observations for one URL are retained without choosing current metadata',()=>{
 const r=run(input('url,title,description',[['https://example.test/a','One','D'],['https://example.test/a','Two','E']]));
 assert.deepEqual(values(r).map(x=>x['Normalized title']),['One','Two']);assert.equal(findings(r,'REPEATED_SUPPLIED_URL').length,2);
});
test('URL case query and trailing slash remain distinct exact supplied identities',()=>{
 const r=run(input('url,title,description',['/a','/a/','/A','/a?q=1'].map(x=>['https://example.test'+x,'Same','D'])));
 assert.equal(findings(r,'TITLE_DUPLICATE_REVIEW').length,4);assert.equal(findings(r,'REPEATED_SUPPLIED_URL').length,0);
});
test('invalid URL rows stay visible and do not create cross-URL duplicate groups',()=>{
 const invalid=['','/relative','javascript:alert(1)','https://u:p@example.test/','https://example.test/#','https://example.test/#x','https://exa mple.test/'];
 const r=run(input('url,title,description',[['https://example.test/','Same','D'],...invalid.map(u=>[u,'Same','D'])]));
 assert.equal(r.rows.length,8);assert.equal(findings(r,'INVALID_PAGE_URL').length,7);assert.equal(findings(r,'TITLE_DUPLICATE_REVIEW').length,0);
});
test('valid HTTP(S), query and international host observations remain supplied strings',()=>{
 const urls=['http://example.test/','https://éxample.test/路径?q=é','https://example.test/?a=1&b=2'];
 const r=run(input('url,title,description',urls.map(u=>[u,'T','D'])));
 assert.deepEqual(r.snippets.map(x=>x.url),urls);assert.ok(values(r).every(x=>x['URL observation']==='VALID_HTTP_URL'));
});
test('H1 comparison is exact normalized information and missing title remains unknown',()=>{
 const r=run(input('url,title,description,h1',[['https://example.test/a',' T ','D','T'],['https://example.test/b','T','D','t'],['https://example.test/c','','D','T']]));
 assert.deepEqual(values(r).map(x=>x['Title/H1 observation']),['SAME','DIFFERENT_INFORMATIONAL','UNKNOWN_TITLE_MISSING']);
 assert.equal(findings(r,'TITLE_H1_DIFFERENCE_INFORMATIONAL').length,1);
});
test('CSV formula-leading values are inert copies; HTML payloads are not interpolated into Markdown',()=>{
 const payload='<img/src=x/onerror=alert(1)>',r=run(input('url,title,description,h1',[['https://example.test/?x='+payload,'=1+1','\t@SUM(A1)',payload]]));
 const exported=csvRows(r.exports[0].text),raw=csvRows(r.exports.find(x=>x.name.endsWith('-checked-rows.csv')).text);
 assert.equal(exported[1][3],"'=1+1");assert.equal(raw[1][3],"'\t@SUM(A1)");assert.equal(raw[1][4],payload);
 assert.ok(!r.exports.find(x=>x.name.endsWith('-report.md')).text.includes(payload));
});
test('ignored column names remain inert and are not echoed in the report',()=>{
 const payload='<svg/onload=alert(1)>',r=run(input('url,title,description,'+payload,[['https://example.test/','T','D','x']]));
 assert.equal(findings(r,'UNSUPPORTED_COLUMNS_IGNORED').length,1);
 assert.ok(!r.exports.find(x=>x.name.endsWith('-report.md')).text.includes(payload));
});
test('5000 rows accepted, 5001 rejected; per-file UTF8 byte cap enforced',()=>{
 const rows=Array.from({length:5000},(_,i)=>['https://example.test/'+i,'T'+i,'D'+i]);
 assert.equal(run(input('url,title,description',rows)).rows.length,5000);
 assert.throws(()=>run(input('url,title,description',[...rows,['https://example.test/extra','T','D']])),/5,000|records/i);
 assert.throws(()=>run('x'.repeat(LIMITS.fileBytes+1)),/2 MiB/);
 assert.throws(()=>run('é'.repeat(LIMITS.fileBytes/2+1)),/2 MiB/);
});
test('URL length boundary and malformed Unicode bytes follow the shared contract',()=>{
 const url='https://example.test/'+'x'.repeat(4096-21),r=run(input('url,title,description',[[url,'T','D'],[url+'x','T','D']]));
 assert.equal(r.rows[0][2],'VALID_HTTP_URL');assert.equal(r.rows[1][2],'INVALID');
 assert.throws(()=>decode(new Uint8Array([255])),/UTF|decode|encoded/i);
});
test('actual shared Worker route hashes UTF8 input and returns all exports',async()=>{
 let callback,reply;const source=readFileSync(new URL('./assets/static/free-tools/worker.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInNewContext(source,{self:{set onmessage(fn){callback=fn;},postMessage(x){reply=x;}},TOOLS,LIMITS,runTool,decode,crypto:webcrypto,TextEncoder,Uint8Array,Blob,Number,Set,Error,String});
 await callback({data:{id:ID,inputs:[{role:'pages',text:TOOLS[ID].sample.pages}],options:{}}});
 assert.equal(reply.ok,true);assert.equal(reply.result.exports.length,5);assert.equal(reply.result.manifest.input_observations.length,1);assert.match(reply.result.manifest.input_observations[0].sha256,/^[a-f0-9]{64}$/);
 await callback({data:{id:ID,inputs:[{role:'pages',text:'x'},{role:'pages',text:'x'}],options:{}}});assert.equal(reply.ok,false);
});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='';this.hidden=false;this.textContent='';}
 append(...xs){this.children.push(...xs);}
 replaceChildren(...xs){this.children=[...xs];this.textContent='';}
 addEventListener(k,fn){this.listeners[k]=fn;}
}
test('text-only selectable preview changes rows and clears stale supplied data',()=>{
 const ids=['snippet-preview','snippet-row','snippet-observation','snippet-url','snippet-title','snippet-description','snippet-h1','snippet-fields'],elements=Object.fromEntries(ids.map(x=>[x,new Element()]));
 const created=[],doc={getElementById:id=>elements[id],createElement:tag=>{created.push(tag);return new Element(tag);}},preview=createSnippetPreview(doc);
 const r=run(input('url,title,description,og_image',[['https://example.test/','<svg/onload=alert(1)>','D','https://private.test/image'],['https://example.test/2','Second','E','']]));
 preview.render(r.snippets);assert.equal(elements['snippet-title'].textContent,'<svg/onload=alert(1)>');assert.equal(elements['snippet-row'].children.length,2);assert.match(elements['snippet-observation'].textContent,/^Result row 1/);assert.match(elements['snippet-row'].children[0].textContent,/^Result row 1/);
 elements['snippet-row'].value='1';elements['snippet-row'].listeners.change();assert.equal(elements['snippet-title'].textContent,'Second');
 assert.ok(created.every(t=>['option','dt','dd'].includes(t)));
 preview.clear();assert.equal(elements['snippet-preview'].hidden,true);assert.equal(elements['snippet-title'].textContent,'');assert.equal(elements['snippet-fields'].children.length,0);assert.equal(elements['snippet-row'].children.length,0);
});
test('new module and preview source contain no network storage or active DOM APIs',()=>{
 for(const file of ['batch4.mjs','snippet-preview.mjs']){
  const code=readFileSync(new URL('./assets/static/free-tools/'+file,import.meta.url),'utf8');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket/,/innerHTML|outerHTML|insertAdjacentHTML/,/\beval\s*\(/])assert.ok(!pattern.test(code),file+': '+pattern);
 }
 assert.equal(Object.keys(ANALYZERS).length,10);assert.equal(Object.keys(TOOLS).length,10);
});
test('blank CSV records and multiline cells yield sequential result rows rather than input line numbers',()=>{
 const r=run('url,title,description\n,,\n" "," "," "\nhttps://example.test/a,"Title\nwith newline",D\n,T,D\n');
 assert.equal(Object.fromEntries(r.summary)['Rows checked (blank records excluded)'],2);
 assert.equal(r.columns[0],'Result row');assert.deepEqual(r.rows.map(x=>x[0]),[1,2]);
 assert.deepEqual(r.snippets.map(x=>x.resultRow),[1,2]);assert.ok(r.snippets.every(x=>!('record' in x)&&!('parsedRecordIndex' in x)));
 assert.equal(r.rows[0][3],'Title with newline');assert.equal(r.rows[1][2],'INVALID');
 const checked=r.exports.find(x=>x.name.endsWith('-checked-rows.csv'));
 assert.equal(checked.label,'Rows checked CSV');const csv=csvRows(checked.text);assert.deepEqual(csv.map(x=>x[0]),['Result row','1','2']);assert.equal(csv[1][2],'Title\nwith newline');
 const fs=csvRows(r.exports.find(x=>x.name.endsWith('-findings.csv')).text);assert.equal(fs[0][4],'Result row');
 assert.ok(r.findings.every(f=>f.subject==='Result row 2'&&f.source==='2'));
 assert.match(r.manifest.scope.blank_records,/skipped count is not available/);assert.ok(!('ignored_count' in r.manifest.scope));
 assert.match(r.manifest.scope.result_row_numbering,/sequentially from 1/);
 const report=r.exports.find(x=>x.name.endsWith('-report.md')).text;assert.match(report,/Blank CSV records are ignored/);assert.ok(!report.includes('frozen parser'));
 const exact=run('url,title,description\n,,\nhttps://example.test/a,T,D\n');assert.equal(exact.rows[0][0],1);
});

import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {decode,xmlRows,build,expectedRows} from './source/core.mjs';
const NS='http://www.sitemaps.org/schemas/sitemap/0.9';
const URL='https://example.test/A?b=2&a=1';
const body=`<s:urlset xmlns:s="${NS}"><s:url><s:loc>https://example.test/A?b=2&amp;a=1</s:loc></s:url></s:urlset>`;
// Enumerated fixture domain independent of the product regex: Unicode White_Space,
// ECMAScript whitespace plus historical whitespace-like codepoints; XML S removed.
const nonXML=[0x0b,0x0c,0x85,0xa0,0x1680,0x180e,...Array.from({length:11},(_,i)=>0x2000+i),0x2028,0x2029,0x202f,0x205f,0x3000,0xfeff];
const separators=['after xml','before encoding','before standalone','before close'];
function document(parts) {return `<?xml${parts[0]}version="1.0"${parts[1]}encoding="UTF-8"${parts[2]}standalone="yes"${parts[3]}?>`+body;}
const cases=[],checks=[],roundTrips=[];
function check(name,fn){try{fn();checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',error:e.message});}}
for(const cp of nonXML) for(let position=0;position<4;position++) for(const mixed of [false,true]) {
 const parts=[' ',' ',' ',' '];parts[position]=(mixed?' \t':'')+String.fromCodePoint(cp)+(mixed?'\r\n':'');
 cases.push({name:`U+${cp.toString(16).toUpperCase().padStart(4,'0')} ${separators[position]} ${mixed?'mixed':'single'}`,well_formed:false,xml:document(parts),codepoint:cp,position,mixed});
}
for(const [name,decl] of [
 ['exact reviewer NBSP after xml','<?xml\u00a0version="1.0"?>'],
 ['exact reviewer EM SPACE before encoding','<?xml version="1.0"\u2003encoding="UTF-8"?>'],
 ['exact reviewer NBSP before close','<?xml version="1.0"\u00a0?>']
]) cases.push({name,well_formed:false,xml:decl+body});
for(const separator of [' ','\t','\r','\n',' \t\r\n']) for(let position=0;position<4;position++) {
 const parts=[' ',' ',' ',' '];parts[position]=separator;
 cases.push({name:`XML S ${JSON.stringify(separator)} ${separators[position]}`,well_formed:true,xml:document(parts),urls:[URL]});
}
cases.push({name:'no optional declaration fields or trailing separator',well_formed:true,xml:'<?xml version="1.0"?>'+body,urls:[URL]});
cases.push({name:'single quotes and UTF-8 case variation',well_formed:true,xml:"<?xml\tversion='1.0'\nencoding='utf-8'\rstandalone='no' ?>"+body,urls:[URL]});
for(const c of cases) check(c.name,()=>{
 const utf8=new TextEncoder().encode(c.xml), decoded=decode(utf8);
 assert.equal(decoded,c.xml); c.utf8_bytes=utf8.byteLength;
 if(!c.well_formed) {
  assert.throws(()=>xmlRows(decoded),/XML/);
  try{xmlRows(decoded);}catch(e){c.product_error=e.message;}
 } else {
  const parsed=xmlRows(decoded);assert.deepEqual(parsed.rows.map(r=>r.url),c.urls);
  const r=build(expectedRows(URL,'txt'),parsed,'example.test',[],'2026-10-08T00:00:00Z');
  assert.equal(r.manifest.counts.included,1);assert.equal(r.manifest.counts.added,0);assert.equal(r.manifest.counts.missing,0);
  assert.ok(!r.xml.includes('lastmod'));assert.equal(r.manifest.ruleset,'base2026.sitemap-local/1.0.2');
  roundTrips.push({name:c.name,xml:r.xml,urls:c.urls,csv:r.csv,manifest:r.manifest,report:r.report});
 }
});
const evidence={observed_at:new Date().toISOString(),primary_reference:'https://www.w3.org/TR/xml/#NT-S',scope:'UTF-8 real codepoints in every supported XML declaration separator; non-XML controls/Unicode whitespace and mixed runs; positive XML S, namespace, missing lastmod, exports',cases,roundTrips,checks,passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length};
writeFileSync(new globalThis.URL('./R3-REGRESSION-EVIDENCE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({passed:evidence.passed,failed:evidence.failed,negative:cases.filter(c=>!c.well_formed).length,positive:cases.filter(c=>c.well_formed).length,failures:checks.filter(c=>c.status==='FAIL')}));
if(evidence.failed)process.exitCode=1;

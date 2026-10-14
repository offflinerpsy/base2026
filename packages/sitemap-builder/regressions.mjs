import assert from 'node:assert/strict';
import {writeFileSync, readFileSync} from 'node:fs';
import {decode, expectedRows, xmlRows, build, csvCell, urlHost, LIMITS} from './source/core.mjs';
const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const xmlnsNS = 'http://www.w3.org/2000/xmlns/';
const at = new Date().toISOString(), checks = [], roundTrips = [], malformed = [], validXML = [], unsupportedXML = [];
function test(name, fn) { try { fn(); checks.push({name,status:'PASS'}); } catch(e) { checks.push({name,status:'FAIL',error:e.message}); } }
const validURLs = [
  'https://example.test/A','https://example.test/A/','https://example.test/a',
  'https://example.test/q?b=2&a=1','https://example.test/東京?c=é',
  "https://example.test/it's",'https://example.test/%FF%FE/%2F',
  ...[0xD7FF,0xE000,0xFFFD,0x10000,0x1FFFE,0x10FFFF].map(n=>'https://example.test/'+String.fromCodePoint(n))
];
const forbidden = [...Array.from({length:31},(_,i)=>i+1).filter(n=>![9,10,13].includes(n)),0xFFFE,0xFFFF];
for (const format of ['txt','csv']) {
  const badURLs = forbidden.map(n=>'https://example.test/x'+String.fromCodePoint(n)+'y');
  const urls = [...validURLs,...badURLs,validURLs[0],'https://other.test/other','<script>globalThis.PWNED=1</script>'];
  const text = format === 'txt' ? urls.join('\n') : 'url\r\n'+urls.map(csvCell).join('\r\n');
  writeFileSync(new URL('./correction.'+format,import.meta.url),text);
  test(`${format}: decoded UTF-8 forbidden characters excluded exactly without URL rewriting`,()=> {
    const p = expectedRows(decode(new TextEncoder().encode(text)),format);
    const r = build(p,undefined,'example.test',[],at);
    assert.deepEqual(r.included.map(x=>x.url),validURLs);
    assert.deepEqual(r.excluded.filter(x=>x.reason==='xml-forbidden-character').map(x=>x.url),badURLs);
    assert.equal(r.manifest.counts.duplicate,1);
    assert.equal(r.manifest.counts.excluded,badURLs.length+2);
    assert.deepEqual(xmlRows(r.xml).rows.map(x=>x.url),[...validURLs].sort());
    roundTrips.push({name:format+' R1 character boundaries',xml:r.xml,included:r.included.map(x=>x.url),counts:r.manifest.counts,csv:r.csv});
  });
}
test('R1 NUL rejected before parsing; invalid UTF-8 surrogate encoding rejected',()=> {
  assert.throws(()=>decode(new TextEncoder().encode('https://example.test/x\0y')),/NUL/);
  assert.throws(()=>decode(new Uint8Array([0xed,0xa0,0x80])),/encoding/);
});
test('R1 API excludes lone surrogates and all forbidden codepoints',()=> {
  for (const n of [0,...forbidden,0xD800,0xDBFF,0xDC00,0xDFFF]) assert.equal(urlHost('https://example.test/x'+String.fromCodePoint(n)+'y').reason,'xml-forbidden-character');
});
test('R1 exact reviewer U+FFFE/U+FFFF repros in TXT and CSV',()=> {
  for (const n of [0xFFFE,0xFFFF]) for (const format of ['txt','csv']) {
    const url='https://example.test/'+String.fromCodePoint(n);
    const text=format==='txt'?'https://example.test/A\n'+url:'url\nhttps://example.test/A\n'+csvCell(url);
    const r=build(expectedRows(decode(new TextEncoder().encode(text)),format),undefined,'example.test',[],at);
    assert.deepEqual(r.excluded.map(x=>({url:x.url,reason:x.reason})),[{url,reason:'xml-forbidden-character'}]);
    assert.equal(r.included.length,1);
    roundTrips.push({name:`reviewer exact U+${n.toString(16).toUpperCase()} ${format}`,xml:r.xml,included:r.included.map(x=>x.url),counts:r.manifest.counts,csv:r.csv});
  }
});
const empty = `<urlset xmlns="${ns}"/>`;
const invalid = [
  ['decimal reference before root','&#32;'+empty],['decimal reference after root',empty+'&#32;'],
  ['hex reference before root','&#x20;'+empty],['tab reference after root',empty+'&#9;'],
  ['named reference outside root','&amp;'+empty],['literal NBSP before root','\u00A0'+empty],
  ['literal Unicode whitespace after root',empty+'\u2003'],
  ['reserved xml prefix rebound',`<xml:urlset xmlns:xml="${ns}"/>`],
  ['unused reserved xml prefix rebound',`<urlset xmlns="${ns}" xmlns:xml="urn:wrong"/>`],
  ['xmlns prefix declared',`<urlset xmlns="${ns}" xmlns:xmlns="urn:wrong"/>`],
  ['XML URI assigned to other prefix',`<urlset xmlns="${ns}" xmlns:p="${xmlNS}"/>`],
  ['XML URI assigned to default',`<urlset xmlns="${xmlNS}"/>`],
  ['XMLNS URI assigned to other prefix',`<urlset xmlns="${ns}" xmlns:p="${xmlnsNS}"/>`],
  ['XMLNS URI assigned to default',`<urlset xmlns="${xmlnsNS}"/>`],
  ['empty prefixed namespace',`<urlset xmlns="${ns}" xmlns:p=""/>`],
  ['empty local name',`<s: xmlns:s="${ns}"/>`],['digit-start local name',`<s:1 xmlns:s="${ns}"/>`],
  ['leading colon',`<:urlset xmlns="${ns}"/>`],['multiple colons',`<s:x:urlset xmlns:s="${ns}"/>`],
];
for (const [name,xml] of invalid) test('R2 reject '+name,()=> {
  let error; try {xmlRows(xml);} catch(e){error=e.message;}
  assert.ok(error); malformed.push({name,xml,error});
});
const good = [
  ['literal XML whitespace and comments around root',' \t\n\r<!--before-->'+empty+'<!--after--> \t\r\n'],
  ['declaration and correct reserved xml declaration',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}" xmlns:xml="${xmlNS}"/>`],
  ['ordinary bound prefix and numeric reference inside root',`<s:urlset xmlns:s="${ns}" xmlns:xml="${xmlNS}"><s:url><s:loc>https://example.test/&#x41;?a=1&amp;b=2</s:loc></s:url></s:urlset>`],
  ['unused ordinary prefix',`<urlset xmlns="${ns}" xmlns:p="urn:other"/>`],
];
test('R2 valid implicit xml namespace remains outside sitemap subset',()=> {
  const xml = `<xml:urlset xmlns="${ns}"/>`;
  assert.throws(()=>xmlRows(xml),/Unsupported XML namespace/);
  unsupportedXML.push({name:'implicit xml prefix denotes XML namespace, not sitemap',xml});
});
for (const [name,xml] of good) test('R2 retain '+name,()=> { const p=xmlRows(xml); validXML.push({name,xml,urls:p.rows.map(x=>x.url)}); });
const baseline=JSON.parse(readFileSync(new URL('./FIXTURES.json',import.meta.url)));
for (const format of ['txt','csv']) test('independent oracle input: baseline '+format,()=> {
  const p=expectedRows(format==='txt'?baseline.expected:'url\n'+expectedRows(baseline.expected,'txt').rows.map(x=>csvCell(x.url)).join('\n'),format);
  const r=build(p,xmlRows(baseline.existing),'example.test',[],at);
  roundTrips.push({name:'baseline '+format,xml:r.xml,included:r.included.map(x=>x.url),counts:r.manifest.counts,csv:r.csv});
});
test('independent oracle input: 5,000 exact URLs both inputs at 2 MiB',()=> {
  const urls=Array.from({length:LIMITS.urls},(_,i)=>'https://example.test/'+i+'?b=2&a=1');
  const txt=urls.join('\n')+'\n';
  const xml=`<urlset xmlns="${ns}">`+urls.map(u=>'<url><loc>'+u.replaceAll('&','&amp;')+'</loc></url>').join('')+'</urlset>';
  const e=expectedRows(decode(new TextEncoder().encode(txt+' '.repeat(LIMITS.fileBytes-Buffer.byteLength(txt)))),'txt');
  const padded=xml.replace('</urlset>','<!--'+' '.repeat(LIMITS.fileBytes-Buffer.byteLength(xml)-7)+'--></urlset>');
  assert.equal(Buffer.byteLength(padded),LIMITS.fileBytes);
  const r=build(e,xmlRows(decode(new TextEncoder().encode(padded))),'example.test',[],at);
  assert.equal(r.added.length,0);assert.equal(r.missing.length,0);
  roundTrips.push({name:'maximum two 2 MiB files, 5,000 URLs/input',xml:r.xml,included:urls,counts:r.manifest.counts,csv:r.csv});
});
const evidence={observed_at:at,node:process.version,checks,passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length,roundTrips,malformed,validXML,unsupportedXML,primary_references:['https://www.w3.org/TR/xml/#NT-document','https://www.w3.org/TR/xml/#charsets','https://www.w3.org/TR/xml-names/#xmlReserved']};
writeFileSync(new URL('./REGRESSION-EVIDENCE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({passed:evidence.passed,failed:evidence.failed,failures:checks.filter(c=>c.status==='FAIL')}));
if(evidence.failed) process.exitCode=1;

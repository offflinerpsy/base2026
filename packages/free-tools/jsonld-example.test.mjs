import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runTool} from './assets/static/free-tools/engine.mjs';
import {BATCH5_TOOLS} from './assets/static/free-tools/batch5-tools.mjs';
import {CORRECTED_JSONLD,jsonldExampleResults,jsonldWorkedExampleHtml,jsonldWorkedExampleMarkdown} from './jsonld-worked-example.mjs';

const ID='json-ld-schema-auditor';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const original=read('./assets/tools/'+ID+'/sample-schema_input.json');
const corrected=read('./assets/tools/'+ID+'/sample-schema_input-corrected.json');
const run=text=>runTool(ID,{schema_input:text},{},[],'2026-10-15T00:00:00.000Z');
const refs=result=>result.rows.filter(row=>row[7]==='ID_ONLY_REFERENCE').map(row=>[row[6],row[8],row[9]]);

test('original download remains the existing sample with exact local gap and external UNKNOWN',()=>{
  assert.equal(original,BATCH5_TOOLS[ID].sample.schema_input);
  const r=run(original);
  assert.deepEqual(r.summary,[['Parsing','Parsed JSON'],['Entity inventory','Inventoried'],['Reference coverage','Local gaps; external unknown'],['Typed entity objects',2],['Entity rows',5],['ID-only references',3]]);
  assert.deepEqual(refs(r),[['#author',1,'MATCHED_ONE_DEFINITION_IN_INPUT'],['#publisher',0,'LOCAL_REFERENCE_NOT_MATCHED'],['https://license.example.test/terms',0,'EXTERNAL_DEFINITION_UNKNOWN']]);
  assert.deepEqual(r.findings.map(f=>[f.rule,f.subject]),[['LOCAL_REFERENCE_NOT_MATCHED','Entity row 3'],['EXTERNAL_DEFINITION_UNKNOWN','Entity row 4']]);
  assert.equal(r.scope.references_matched_in_input,1);assert.equal(r.scope.local_references_not_matched,1);assert.equal(r.scope.external_definitions_unknown,1);
});

test('corrected download adds only the publisher and improves measured coverage while license stays UNKNOWN',()=>{
  assert.equal(corrected,CORRECTED_JSONLD);
  const before=JSON.parse(original),after=JSON.parse(corrected);
  assert.deepEqual(after,{'@context':before['@context'],'@graph':[...before['@graph'],{'@id':'#publisher','@type':'Organization',name:'Example Publishing'}]});
  const r=run(corrected);
  assert.deepEqual(r.summary,[['Parsing','Parsed JSON'],['Entity inventory','Inventoried'],['Reference coverage','External definitions unknown'],['Typed entity objects',3],['Entity rows',6],['ID-only references',3]]);
  assert.deepEqual(refs(r),[['#author',1,'MATCHED_ONE_DEFINITION_IN_INPUT'],['#publisher',1,'MATCHED_ONE_DEFINITION_IN_INPUT'],['https://license.example.test/terms',0,'EXTERNAL_DEFINITION_UNKNOWN']]);
  assert.equal(r.scope.references_matched_in_input,2);assert.equal(r.scope.local_references_not_matched,0);assert.equal(r.scope.external_definitions_unknown,1);
  assert.deepEqual(r.findings.map(f=>f.rule),['EXTERNAL_DEFINITION_UNKNOWN']);
  assert.deepEqual(jsonldExampleResults().corrected.summary,r.summary);
  assert.equal(r.exports.length,4);assert.deepEqual(r.manifest.scope,r.scope);
  for(const [key,value]of Object.entries({jsonld_validation:'NOT_PERFORMED',schema_org_vocabulary:'NOT_VERIFIED',google_rich_result_eligibility:'NOT_INFERRED',visible_page_parity:'NOT_CHECKED',live_http:'NOT_REQUESTED'}))assert.equal(r.scope[key],value);
  for(const key of ['target_fetch','upload','storage','telemetry'])assert.equal(r.manifest.privacy[key],false);
});

test('generated worked example uses actual counts, functional input links and visible limits without extra schema',()=>{
  const html=read('./assets/tools/'+ID+'/index.html'),md=read('./assets/tools/'+ID+'/README.md');
  assert(html.includes(jsonldWorkedExampleHtml()));assert(md.includes(jsonldWorkedExampleMarkdown()));
  for(const target of ['#try-example','#run-tool','#file-schema_input','#clear-tool','./sample-schema_input.json','./sample-schema_input-corrected.json','./input-contract.json','../../static/free-tools/batch5.mjs','../../static/free-tools/LICENSE'])assert(html.includes(`href="${target}"`));
  assert(md.includes('| Entity rows | 5 | 6 |'));
  assert(md.includes('| References matched in input | 1 | 2 |'));
  assert(md.includes('| Local references not matched | 1 | 0 |'));
  assert(md.includes('| External definitions unknown | 1 | 1 |'));
  for(const r of Object.values(jsonldExampleResults()))for(const [label,value]of r.summary){assert(md.includes(String(value)));assert(html.includes(String(value)));}
  assert(html.includes('The first six observations appear in the result summary'));
  for(const text of ['Choosing a file replaces pasted text.','Editing the text clears the selected file and previous results;','empties both.']){assert(html.includes(text));assert(md.includes(text));}
  assert(!html.includes('before switching back to pasted text'));
  assert(!md.includes('before switching back to pasted text'));
  assert(html.includes('Repeated member names inside a single object'));
  assert.equal((html.match(/<script type="application\/ld\+json">/g)||[]).length,2);
  assert(!html.includes('"@type":"FAQPage"'));
});

test('malformed raw JSON and HTML retain the existing syntax error observation and no reference inventory',()=>{
  for(const input of ['{"@type":"Article",}','<script type="application/ld+json">{}</script>']){
    const r=run(input);
    assert.deepEqual(r.summary,[['Parsing','Syntax error'],['Entity inventory','Not inspected'],['Reference coverage','Not inspected'],['Typed entity objects',0],['Entity rows',0],['ID-only references',0]]);
    assert.deepEqual(r.rows,[]);assert.equal(r.scope.reference_coverage,'NOT_INSPECTED');
    assert.deepEqual(r.findings.map(f=>f.rule),['JSON_SYNTAX_ERROR']);assert.match(r.findings[0].detail,/Supply raw JSON without HTML or script tags/);
    assert.equal(r.exports.length,4);assert.equal(r.scope.jsonld_validation,'NOT_PERFORMED');
  }
});

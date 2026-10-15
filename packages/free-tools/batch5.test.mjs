import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
import {runTool,ANALYZERS} from './assets/static/free-tools/engine.mjs';
import {TOOLS,LIMITS} from './assets/static/free-tools/tools.mjs';
import {inspectJsonLd,JSONLD_LIMITS} from './assets/static/free-tools/batch5.mjs';
import {csvRows,decode} from './assets/static/free-tools/sitemap-core.mjs';
const ID='json-ld-schema-auditor',stamp='2026-10-15T00:00:00.000Z';
const run=text=>runTool(ID,{schema_input:typeof text==='string'?text:JSON.stringify(text)},{},[],stamp);
const rows=r=>r.rows.map(v=>Object.fromEntries(r.columns.map((k,i)=>[k,v[i]])));
const found=(r,rule)=>r.findings.filter(f=>f.rule===rule);
const summary=r=>Object.fromEntries(r.summary);
test('sample calculates separate parsing, entity and reference coverage observations',()=>{
 const r=run(TOOLS[ID].sample.schema_input);
 assert.deepEqual(summary(r),{'Parsing':'Parsed JSON','Entity inventory':'Inventoried','Reference coverage':'Local gaps; external unknown','Typed entity objects':2,'Entity rows':5,'ID-only references':3});
 assert.equal(r.scope.references_matched_in_input,1);assert.equal(r.scope.local_references_not_matched,1);assert.equal(r.scope.external_definitions_unknown,1);assert.equal(r.exports.length,4);assert.equal(r.findings.length,2);
 assert.equal(r.scope.jsonld_validation,'NOT_PERFORMED');assert.equal(r.scope.google_rich_result_eligibility,'NOT_INFERRED');
});
test('malformed JSON gives actionable syntax diagnostics without echoing hostile parser snippets',()=>{
 const hostile='<img/src=x/onerror=alert(1)>',r=run('{"'+hostile+'": }');
 assert.equal(summary(r).Parsing,'Syntax error');assert.equal(r.scope.entity_inventory,'NOT_INSPECTED');assert.equal(r.scope.reference_coverage,'NOT_INSPECTED');assert.equal(r.rows.length,0);
 assert.equal(found(r,'JSON_SYNTAX_ERROR').length,1);assert.match(r.findings[0].detail,/double-quoted|commas/);assert.ok(!r.exports.find(e=>e.name.endsWith('-report.md')).text.includes(hostile));
 const location=r.scope.syntax_diagnostic;if(location)assert.ok(location.line_one_based>=1&&location.column_utf16_one_based>=1);
});
test('HTML and script wrappers are not extracted',()=>{
 for(const text of ['<script type="application/ld+json">{"@type":"Article"}</script>','<html><body>{}</body></html>']){
  const r=run(text);assert.equal(r.scope.parsing,'JSON_SYNTAX_ERROR');assert.equal(r.rows.length,0);assert.match(r.findings[0].detail,/without HTML or script tags/);
 }
});
test('valid JSON primitives are parsed but never treated as a graph or inspected entities',()=>{
 for(const text of ['null','42','true','"Article"']){const r=run(text);assert.equal(r.scope.parsing,'JSON_PARSED');assert.equal(r.scope.entity_inventory,'NOT_INSPECTED_UNSUPPORTED_ROOT');assert.equal(r.scope.reference_coverage,'NOT_INSPECTED');assert.equal(r.rows.length,0);assert.equal(found(r,'ROOT_OBJECT_OR_ARRAY_REQUIRED').length,1);}
});
test('empty object, array and pure containers yield no entity or validation pass',()=>{
 for(const value of [{},[],{'@context':'https://schema.org'},{'@graph':[]}]){const r=run(value);assert.equal(r.scope.parsing,'JSON_PARSED');assert.equal(r.scope.entity_inventory,'NO_ENTITY_OBJECTS');assert.equal(r.scope.reference_coverage,'NO_ID_ONLY_REFERENCES');assert.equal(r.rows.length,0);assert.equal(found(r,'NO_ENTITY_OBJECTS').length,1);}
});
test('arrays, graph nodes, nested typed objects and type arrays retain supplied order',()=>{
 const r=run([{'@type':['Article','CreativeWork'],author:{'@type':'Person',name:'A'}},{'@graph':[{'@type':'Organization'},[{'@type':'Place'}]]}]);
 assert.deepEqual(rows(r).map(x=>x['JSON pointer']),['/0','/0/author','/1/@graph/0','/1/@graph/1/0']);
 assert.deepEqual(rows(r).map(x=>x.Placement),['ROOT_ARRAY_ITEM','NESTED_OBJECT','GRAPH_NODE','GRAPH_NODE']);assert.equal(r.scope.typed_entity_objects,4);
 assert.equal(rows(r)[0]['Literal @type'],'["Article","CreativeWork"]');assert.equal(rows(r)[0]['Type observation'],'SUPPLIED_STRING_ARRAY');
});
test('untyped node objects remain observations instead of missing-field invalidity',()=>{
 const r=run({name:'A node without a literal type'});assert.equal(rows(r)[0]['Object observation'],'UNTYPED_NODE');assert.equal(r.scope.typed_entity_objects,0);assert.equal(r.rows.length,1);
 assert.equal(found(r,'TYPE_NOT_SUPPLIED').length,1);assert.equal(r.findings[0].severity,'info');assert.ok(!r.findings.some(f=>/required|invalid/i.test(f.rule)));
});
test('contexts and aliases are inventoried without applying or indexing their contents',()=>{
 const r=run({'@context':[{'kind':'@type','@id':'#inside','@type':'Person'},'https://remote.example.test/context'],kind:'Article',author:{'@id':'#inside'}});
 assert.equal(r.scope.contexts.length,1);assert.equal(r.scope.contexts[0].supplied_kind,'ARRAY');assert.equal(r.scope.typed_entity_objects,0);assert.equal(r.scope.local_references_not_matched,1);
 assert.equal(r.rows.length,2);assert.ok(rows(r).every(x=>!x['JSON pointer'].startsWith('/@context/')));assert.equal(r.scope.keywords,'LITERAL_ONLY_NO_CONTEXT_OR_ALIAS_EXPANSION');
});
test('value/list/set wrappers are not entities but nested node objects are inspected',()=>{
 const r=run({'@graph':[{'@value':'text','@type':'https://www.w3.org/2001/XMLSchema#string'},{'@list':[{'@type':'Thing'}]},{'@set':[{'@id':'#a'}]}]});
 assert.equal(r.rows.length,2);assert.equal(r.scope.typed_entity_objects,1);assert.equal(r.scope.id_only_references,1);assert.ok(rows(r).some(x=>x['JSON pointer']==='/@graph/1/@list/0'));
});
test('id-string cycles match local definitions without recursive dereferencing',()=>{
 const r=run([{'@id':'#a','@type':'Thing',related:{'@id':'#b'}},{'@id':'#b','@type':'Thing',related:{'@id':'#a'}}]);
 assert.equal(r.scope.reference_coverage,'ALL_MATCHED_IN_INPUT');assert.equal(r.scope.references_matched_in_input,2);assert.equal(r.rows.length,4);assert.equal(r.findings.length,0);
});
test('repeated id definitions are retained for review, including differing fragments and types',()=>{
 const r=run([{'@id':'#person','@type':'Person',name:'A'},{'@id':'#person',description:'More detail'},{'@id':'#person','@type':'Organization'},{'@id':'#person'}]);
 assert.equal(r.rows.length,4);assert.equal(r.scope.multiple_definition_id_groups,1);assert.equal(found(r,'MULTIPLE_ID_DEFINITIONS_REVIEW').length,3);assert.ok(found(r,'MULTIPLE_ID_DEFINITIONS_REVIEW').every(f=>f.severity==='info'));
 assert.equal(rows(r)[3]['Reference observation'],'MATCHED_MULTIPLE_DEFINITIONS_IN_INPUT');assert.equal(rows(r)[3]['Definition objects with this ID'],3);assert.ok(!r.findings.some(f=>/conflict|invalid|duplicate_id/i.test(f.rule)));
});
test('unmatched absolute reference definition is UNKNOWN and local references are a separate coverage state',()=>{
 const external=run([{'@id':'https://example.test/#author'},{'@id':'urn:example:person:1'}]);assert.equal(external.scope.reference_coverage,'EXTERNAL_DEFINITIONS_UNKNOWN');assert.equal(external.scope.external_definitions_unknown,2);assert.ok(external.findings.every(f=>f.rule==='EXTERNAL_DEFINITION_UNKNOWN'&&f.severity==='info'));
 const local=run([{'@id':'#author'},{'@id':'/author'},{'@id':'_:person'},{'@id':''}]);assert.equal(local.scope.reference_coverage,'LOCAL_GAPS');assert.equal(local.scope.local_references_not_matched,4);assert.equal(local.scope.external_definitions_unknown,0);
});
test('reference matching is exact without trimming, URL normalization, Unicode normalization or base resolution',()=>{
 const ids=['#a','/a','https://EXAMPLE.test/a','é'];
 const r=run([...ids.map(id=>({'@id':id,name:'Definition'})),...[' #a','#A','https://example.test/a','é'].map(id=>({'@id':id})),{'@id':'#a'}]);
 assert.equal(r.scope.references_matched_in_input,1);assert.equal(r.scope.local_references_not_matched,3);assert.equal(r.scope.external_definitions_unknown,1);assert.equal(rows(r).at(-1)['Reference observation'],'MATCHED_ONE_DEFINITION_IN_INPUT');
});
test('id plus context without assertions is not a target definition',()=>{
 const r=run([{'@id':'#a','@context':'https://schema.org'},{'@id':'#a'}]);assert.equal(rows(r)[0]['ID observation'],'ID_WITHOUT_ASSERTIONS');assert.equal(rows(r)[1]['Reference observation'],'LOCAL_REFERENCE_NOT_MATCHED');
});
test('duplicate JSON member names follow the documented native last-value behavior',()=>{
 const r=run('{"@id":"#old","@id":"#new","@type":"Article","@type":"Person"}');assert.equal(rows(r)[0]['Literal @id'],'#new');assert.equal(rows(r)[0]['Literal @type'],'Person');assert.equal(r.scope.duplicate_member_names,'NATIVE_JSON_PARSE_LAST_VALUE_KEPT_NOT_SEPARATELY_DIAGNOSED');
});
test('unusual literal keyword values are retained as shape observations, without full validation claims',()=>{
 const r=run([{'@id':42,'@type':{'term':'Thing'}},{'@graph':42},{'@type':[]}]);assert.equal(found(r,'ID_VALUE_SHAPE_REVIEW').length,1);assert.equal(found(r,'TYPE_VALUE_REVIEW').length,2);assert.equal(found(r,'GRAPH_VALUE_SHAPE_REVIEW').length,1);assert.equal(r.scope.jsonld_validation,'NOT_PERFORMED');
});
test('hostile supplied text stays inert in CSV and does not enter Markdown findings',()=>{
 const hostile='<svg/onload=alert(1)>',r=run([{'@id':'=1+1','@type':'@SUM(A1)',[hostile]:'value'},{'@id':'#missing',[hostile]:{'@id':'#absent'}}]);
 const csv=csvRows(r.exports.find(e=>e.name.endsWith('-results.csv')).text);assert.equal(csv[1][6],"'=1+1");assert.equal(csv[1][4],"'@SUM(A1)");assert.ok(csv.some(x=>x.some(v=>v.includes(hostile))));
 assert.ok(!r.exports.find(e=>e.name.endsWith('-report.md')).text.includes(hostile));assert.ok(r.findings.every(f=>/^(Entity row \d+|JSON input)$/.test(f.subject)));assert.ok(r.findings.every(f=>/^(\d+|Not applicable \(input\))$/.test(f.source)));
 assert.equal(csvRows(r.exports.find(e=>e.name.endsWith('-findings.csv')).text)[0][4],'Entity row');
});
test('depth limit accepts64 containers and rejects deeper or huge nesting without a stack crash',()=>{
 const bounded='{"p":'.repeat(63)+'{}'+'}'.repeat(63);assert.doesNotThrow(()=>run(bounded));
 assert.throws(()=>run('{"p":'.repeat(64)+'{}'+'}'.repeat(64)),/maximum 64.*Reduce nesting/);
 assert.throws(()=>run('['.repeat(10000)+'0'+']'.repeat(10000)),/maximum 64/);
 const escaped=run({'@type':'Thing',name:'[{" braces in a string \\" do not add depth ]'});assert.equal(escaped.scope.typed_entity_objects,1);
});
test('object cap includes context objects and rejects before exporting a partial inventory',()=>{
 assert.equal(run(Array.from({length:5000},()=>({}))).scope.objects_inspected,5000);
 assert.throws(()=>run(Array.from({length:5001},()=>({}))),/maximum 5,000 objects/);
 assert.throws(()=>run({'@context':Array.from({length:5000},()=>({}))}),/maximum 5,000 objects/);
});
test('value, string, pointer and UTF8 byte limits are actionable',()=>{
 assert.equal(run(Array(19999).fill(0)).scope.values_inspected,20000);assert.throws(()=>run(Array(20000).fill(0)),/20,000 total values/);
 assert.doesNotThrow(()=>run({name:'x'.repeat(16384)}));assert.throws(()=>run({name:'x'.repeat(16385)}),/16,384 UTF-16/);
 assert.throws(()=>run({['x'.repeat(4096)]:1}),/pointer exceeds 4,096/);
 assert.throws(()=>run('x'.repeat(LIMITS.fileBytes+1)),/2 MiB/);assert.throws(()=>inspectJsonLd({schema_input:'é'.repeat(JSONLD_LIMITS.fileBytes/2+1)}),/2 MiB/);
});
test('actual shared Worker validates role, hashes UTF8 input and returns syntax and inventory exports',async()=>{
 let callback,reply;const source=readFileSync(new URL('./assets/static/free-tools/worker.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInNewContext(source,{self:{set onmessage(fn){callback=fn;},postMessage(x){reply=x;}},TOOLS,LIMITS,runTool,decode,crypto:webcrypto,TextEncoder,Uint8Array,Blob,Number,Set,Error,String});
 const text=TOOLS[ID].sample.schema_input;await callback({data:{id:ID,inputs:[{role:'schema_input',text}],options:{}}});assert.equal(reply.ok,true);assert.equal(reply.result.exports.length,4);assert.equal(reply.result.manifest.input_observations[0].sha256,createHash('sha256').update(text).digest('hex'));
 await callback({data:{id:ID,inputs:[{role:'schema_input',text:'{"bad": }'}],options:{}}});assert.equal(reply.ok,true);assert.equal(reply.result.scope.parsing,'JSON_SYNTAX_ERROR');assert.equal(reply.result.exports.length,4);
 await callback({data:{id:ID,inputs:[{role:'visible_text',text:'x'}],options:{}}});assert.equal(reply.ok,false);assert.match(reply.error,/roles/);
});
test('new module has no network/storage/active-DOM APIs and all existing analyzers remain registered',()=>{
 const code=readFileSync(new URL('./assets/static/free-tools/batch5.mjs',import.meta.url),'utf8');
 for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket/,/innerHTML|outerHTML|insertAdjacentHTML/,/\beval\s*\(/])assert.ok(!pattern.test(code));
 assert.equal(Object.keys(ANALYZERS).length,11);assert.equal(Object.keys(TOOLS).length,11);assert.ok(!Object.keys(ANALYZERS).some(k=>k==='rich-result-validator'));
});

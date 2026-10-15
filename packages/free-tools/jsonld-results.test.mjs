import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {TOOLS,LIMITS} from './assets/static/free-tools/tools.mjs';
import {runTool} from './assets/static/free-tools/engine.mjs';
import {CORRECTED_JSONLD} from './jsonld-worked-example.mjs';
import {JSONLD_PREVIEW_COLUMNS,renderJsonLdRow,renderJsonLdFinding} from './assets/static/free-tools/jsonld-results.mjs';
const ID='json-ld-schema-auditor',stamp='2026-10-15T00:00:00.000Z';
const run=input=>runTool(ID,{schema_input:typeof input==='string'?input:JSON.stringify(input)},{},[],stamp);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.listeners={};this.value='';this.files=[];this.hidden=false;this.disabled=false;this._text='';}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  set innerHTML(value){throw Error('Active HTML parsing is forbidden');}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this._text='';this.children=[...children];}
  setAttribute(key,value){this.attributes[key]=String(value);}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  click(){for(const fn of this.listeners.click??[])fn({target:this});}
  focus(){this.focused=true;}
  remove(){}
  scrollIntoView(){}
}
const documentStub=()=>({createElement:tag=>new Element(tag)});
const descendants=node=>[node,...node.children.flatMap(descendants)];
const rawFields=tr=>{const dl=descendants(tr).find(node=>node.tagName==='dl');return Array.from({length:dl.children.length/2},(_,i)=>[dl.children[i*2].textContent,dl.children[i*2+1].textContent]);};
function appHarness(id=ID){
  const def=TOOLS[id],nodes=new Map(),get=name=>{if(!nodes.has(name))nodes.set(name,new Element('div'));return nodes.get(name);};
  const root=new Element('main');root.dataset.freeTool=id;
  const document={...documentStub(),getElementById:get,querySelector:()=>root,body:new Element('body')};
  const workers=[],blobs=[],windowEvents={};
  class Worker{constructor(){workers.push(this);}terminate(){this.terminated=true;}postMessage(message){this.message=message;}}
  const context={document,TOOLS,LIMITS,JSONLD_PREVIEW_COLUMNS,renderJsonLdRow,renderJsonLdFinding,createSnippetPreview:()=>({clear(){},render(){}}),Worker,Blob,URL:{createObjectURL(blob){blobs.push(blob);return 'blob:test';},revokeObjectURL(){}},setTimeout(){},matchMedia:()=>({matches:true}),window:{addEventListener(name,fn){windowEvents[name]=fn;}},navigator:{},fetch(){throw Error('Unexpected request');}};
  for(const input of def.inputs)get('input-'+input.role).value=def.sample[input.role];
  for(const option of def.options){get('option-'+option.name).value=option.sampleValue??option.value;get('option-'+option.name).checked=!!option.value;}
  vm.runInNewContext(readFileSync(new URL('./assets/static/free-tools/app.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
  return {get,workers,blobs,windowEvents,render(result){get('run-tool').click();assert(workers.at(-1).message);workers.at(-1).onmessage({data:{ok:true,result}});}};
}
test('original/corrected results have four semantic cells, all raw fields and immutable exports',()=>{
  assert.deepEqual(JSONLD_PREVIEW_COLUMNS,['Entity','Type','Reference','Details']);
  for(const [input,count,findings]of [[TOOLS[ID].sample.schema_input,5,2],[CORRECTED_JSONLD,6,1]]){
    const result=freeze(run(input)),before=hash(result);
    for(const values of result.rows){
      const tr=renderJsonLdRow(documentStub(),result.columns,values);
      assert.equal(tr.children.length,4);assert.deepEqual(tr.children.map(cell=>cell.dataset.label),JSONLD_PREVIEW_COLUMNS);
      assert.deepEqual(rawFields(tr),result.columns.map((column,i)=>[column,String(values[i])]));
      assert(tr.children[0].textContent.includes(`Row ${values[0]}`));assert(tr.children[0].textContent.includes(values[1]));if(values[6])assert(tr.children[0].textContent.includes(values[6]));
      const details=tr.children[3].children[0];assert.equal(details.tagName,'details');assert.equal(details.children[0].tagName,'summary');
    }
    for(const finding of result.findings){const li=renderJsonLdFinding(documentStub(),finding);assert(li.textContent.includes(finding.rule));assert(li.textContent.includes(finding.detail));assert(li.children[0].textContent.startsWith(finding.severity+': '));}
    assert.equal(result.rows.length,count);assert.equal(result.findings.length,findings);assert.equal(hash(result),before);
  }
});
test('types, nested locations and reference labels keep missing, empty, unsupported, matched and UNKNOWN distinct',()=>{
  const result=run([{'@id':'#a','@type':['Thing','CreativeWork'],child:{'@id':'#a'}},{'@id':'#a','@type':'Thing'},{'@id':'#a'},{'@id':'#missing'},{'@id':'https://outside.example.test/x'},{name:'No type'},{'@type':''},{'@type':[]},{'@type':42},{'@id':42},{'@id':42,name:'Non-string definition'},{'@id':'#bare','@context':'https://schema.org'}]);
  const rendered=result.rows.map(row=>renderJsonLdRow(documentStub(),result.columns,row));
  assert(rendered[0].children[1].textContent.includes('Thing, CreativeWork'));
  for(const text of ['Matched multiple definitions in this input','No local definition matched','External definition UNKNOWN','No literal @type supplied','Empty @type string','Empty or partly empty @type array','@type shape needs review','@id is not a string; not indexed','@id is not a string; not matched','@id supplied without definition assertions','JSON pointer: /0/child'])assert(rendered.some(row=>row.textContent.includes(text)),text);
  const single=run([{'@id':'#one','@type':'Thing'},{'@id':'#one'}]);assert(renderJsonLdRow(documentStub(),single.columns,single.rows[1]).textContent.includes('Matched one definition in this input'));
  const root=run({'@type':'Person'});assert(renderJsonLdRow(documentStub(),root.columns,root.rows[0]).textContent.includes('JSON pointer: (root; empty string)'));
  const empty=run({'@id':''});assert(renderJsonLdRow(documentStub(),empty.columns,empty.rows[0]).textContent.includes('Empty @id string'));
});
test('malformed input preserves syntax detail, severity and source with no entity rows',()=>{
  const r=freeze(run('{"@type": }')),before=hash(r),h=appHarness();h.render(r);
  assert.equal(h.get('result-body').children.length,0);assert.equal(h.get('result-head').children[0].children.length,4);
  const li=h.get('finding-body').children[0];assert.equal(li.children[0].textContent,'warning: JSON could not be parsed');
  for(const text of [r.findings[0].detail,'JSON_SYNTAX_ERROR','Not applicable (input)'])assert(li.textContent.includes(text));assert.equal(hash(r),before);
});
test('unknown future codes use honest raw-code fallbacks',()=>{
  const r=run({'@type':'Thing'}),values=[...r.rows[0]];values[5]='FUTURE_TYPE_CODE';values[9]='FUTURE_REFERENCE_CODE';
  const tr=renderJsonLdRow(documentStub(),r.columns,values);
  assert(tr.children[1].textContent.includes('Unrecognized type observation: FUTURE_TYPE_CODE'));assert(tr.children[2].textContent.includes('Unrecognized reference observation: FUTURE_REFERENCE_CODE'));
  const li=renderJsonLdFinding(documentStub(),{severity:'info',rule:'FUTURE_RULE',subject:'Entity row 1',detail:'Future detail',source:'1'});
  assert.equal(li.children[0].textContent,'info: Unrecognized finding rule: FUTURE_RULE');assert(li.textContent.includes('Future detail'));
  for(const code of ['toString','__proto__']){values[5]=code;values[7]=code;values[9]=code;const future=renderJsonLdRow(documentStub(),r.columns,values);assert(future.children[0].textContent.includes(`Unrecognized ID observation: ${code}`));assert(future.children[1].textContent.includes(`Unrecognized type observation: ${code}`));assert(future.children[2].textContent.includes(`Unrecognized reference observation: ${code}`));const unknown=renderJsonLdFinding(documentStub(),{severity:'info',rule:code,subject:'JSON input',detail:'Future detail',source:'1'});assert(unknown.children[0].textContent.includes(`Unrecognized finding rule: ${code}`));}
});
test('hostile HTML remains inert text and the presentation module has no request or storage APIs',()=>{
  const hostile='<svg/onload=alert(1)>',r=run({'@id':'javascript:alert(1)','@type':hostile,[hostile]:{name:hostile}});
  const elements=r.rows.map(row=>renderJsonLdRow(documentStub(),r.columns,row)).flatMap(descendants);
  assert(elements.some(node=>node.textContent.includes(hostile)));assert(!elements.some(node=>['svg','script','img','a'].includes(node.tagName)));assert(elements.every(node=>!Object.keys(node.attributes).some(key=>/^on/i.test(key))));
  const code=readFileSync(new URL('./assets/static/free-tools/jsonld-results.mjs',import.meta.url),'utf8');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket|sendBeacon/,/innerHTML|outerHTML|insertAdjacentHTML/,/\beval\s*\(/])assert(!pattern.test(code));
});
test('shared UI preserves 30-row/findings pagination, Clear, pagehide and all export bytes',async()=>{
  const r=freeze(run(Array.from({length:65},(_,i)=>({name:`Entity ${i}`})))),before=hash(r),h=appHarness();h.render(r);
  assert.equal(h.get('result-body').children.length,30);assert.equal(h.get('finding-body').children.length,30);assert.equal(h.get('table-page').textContent,'1–30 of 65 result rows');
  assert.deepEqual(h.get('result-head').children[0].children.map(node=>[node.textContent,node.scope]),JSONLD_PREVIEW_COLUMNS.map(label=>[label,'col']));
  h.get('next-rows').click();assert.equal(h.get('result-body').children[0].children[0].children[0].textContent,'Entity row 31');h.get('next-rows').click();assert.equal(h.get('result-body').children.length,5);assert.equal(h.get('next-rows').disabled,true);
  h.get('prev-rows').click();assert.equal(h.get('table-page').textContent,'31–60 of 65 result rows');h.get('next-findings').click();assert.equal(h.get('findings-page').textContent,'31–60 of 65 findings');h.get('next-findings').click();assert.equal(h.get('finding-body').children.length,5);assert.equal(h.get('next-findings').disabled,true);
  for(const button of h.get('downloads').children)button.click();assert.equal(h.blobs.length,r.exports.length);for(let i=0;i<h.blobs.length;i++)assert.equal(await h.blobs[i].text(),r.exports[i].text);assert.equal(hash(r),before);
  h.get('clear-tool').click();assert.equal(h.get('tool-results').hidden,true);for(const name of ['result-body','finding-body','downloads'])assert.equal(h.get(name).children.length,0);for(const name of ['input-schema_input','file-schema_input'])assert.equal(h.get(name).value,'');
  h.get('input-schema_input').value=TOOLS[ID].sample.schema_input;h.render(r);assert.equal(h.get('table-page').textContent,'1–30 of 65 result rows');assert.equal(h.get('findings-page').textContent,'1–30 of 65 findings');h.windowEvents.pagehide();assert.equal(h.get('tool-results').hidden,true);
});
test('the ten other tools preserve original raw-column presentation and machine-rule finding text',()=>{
  for(const [id,def]of Object.entries(TOOLS).filter(([id])=>id!==ID)){
    const options=Object.fromEntries(def.options.map(option=>[option.name,option.sampleValue??option.value]));
    const r=runTool(id,def.sample,options,[],stamp),before=hash(r),h=appHarness(id);h.render(r);
    assert.deepEqual(h.get('result-head').children[0].children.map(node=>node.textContent),r.columns,id);assert.equal(h.get('result-body').children.length,Math.min(30,r.rows.length),id);
    for(let row=0;row<h.get('result-body').children.length;row++)assert.deepEqual(h.get('result-body').children[row].children.map(node=>node.textContent),r.rows[row].map(value=>String(def.previewSignificantDigits===12&&typeof value==='number'&&Number.isFinite(value)&&!Number.isInteger(value)?Number(value.toPrecision(12)):value)),id);
    for(let i=0;i<h.get('finding-body').children.length;i++)assert.equal(h.get('finding-body').children[i].children[0].textContent,`${r.findings[i].severity}: ${r.findings[i].rule}`,id);assert.equal(hash(r),before,id);
  }
});
test('generated explanation describes compact preview and 12-column CSV with an available source link',()=>{
  const page=readFileSync(new URL('./assets/tools/'+ID+'/index.html',import.meta.url),'utf8'),readme=readFileSync(new URL('./assets/tools/'+ID+'/README.md',import.meta.url),'utf8');
  assert(page.includes('the results CSV keeps all 12 columns'));assert(readme.includes('results CSV retains all 12 columns'));assert(readme.includes('[jsonld-results.mjs](../../static/free-tools/jsonld-results.mjs)'));
});

// These accepted page bytes fence this JSON-LD-only cache correction.
const UNRELATED_PAGE_SHA256=Object.freeze({
  "assets/tools/broken-link-task-builder/index.html": "5a370d8de8ff0b85ebfda2ca89de83ab6cffc1f332d94ca5ea82e423285e1adc",
  "assets/tools/gsc-period-diff-analyzer/index.html": "d59c844dec85e3604f2a82cd525d76f70242d9f73372f150a7d754bfffdde620",
  "assets/tools/hreflang-checker/index.html": "3adc8471ba3c9a6dd7a970e8ce2ab028817e50e405c3ef86c552a2a10f8be4ee",
  "assets/tools/indexing-signal-reconciler/index.html": "5e49860359b29886acc32168b0cb2fefc2d77e30e6c24897532d2a8ba3110367",
  "assets/tools/internal-link-anchor-auditor/index.html": "99fc66b7a95eb61a3a85c45a4280a504074ca0e6ea7c03cbf2c069f454a7c76f",
  "assets/tools/redirect-map-checker/index.html": "3cf6aef42dcffc8739b2eabcc27415e429ba636923a04d1a88b8ab4625c59acb",
  "assets/tools/redirect-rule-compiler/index.html": "865bba9da8b25cbb49ec93477e9b7543de4cca8ba9296b8810f42b1ea2b82e5b",
  "assets/tools/robots-txt-tester/index.html": "fb171f5bcb10aabc6957a0406bdbb975e470dbe54ebe9519376e99252c193ee5",
  "assets/tools/seo-crawl-comparison/index.html": "3b642add6b11e4c2c55dbb72c03cb3a253d326174ab7ce94224fe50c6965bb1b",
  "assets/tools/serp-snippet-audit/index.html": "eaa3b906bfcb7051866ce546506cccb9670f8b77ec6f4f10438dc3cecbcde3aa"
});
test('JSON-LD app and CSS URLs carry exact content hashes while the ten other pages keep accepted bytes',()=>{
  const page=readFileSync(new URL('./assets/tools/'+ID+'/index.html',import.meta.url),'utf8');
  for(const [tag,attr,path]of [['script','src','/static/free-tools/app.mjs'],['link','href','/static/free-tools/jsonld-inspector.css']]){
    const matches=[...page.matchAll(new RegExp(`<${tag}\\b[^>]*\\b${attr}="([^" ]+)"`,'g'))].map(match=>match[1]).filter(value=>value.split('?')[0]===path);
    assert.equal(matches.length,1,path);
    const bytes=readFileSync(new URL('./assets'+path,import.meta.url)),expected=createHash('sha256').update(bytes).digest('hex');
    assert.equal(matches[0],path+'?v='+expected,path);
  }
  for(const [path,expected]of Object.entries(UNRELATED_PAGE_SHA256))assert.equal(createHash('sha256').update(readFileSync(new URL('./'+path,import.meta.url))).digest('hex'),expected,path);
});

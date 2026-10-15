import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import * as core from './source/core.mjs';
import {DEMO_HOST,SAMPLE_URLS,SAMPLE_SITEMAP,sampleFiles} from './source/sample.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const calculated=core.build(core.expectedRows(SAMPLE_URLS,'txt'),core.xmlRows(SAMPLE_SITEMAP),DEMO_HOST,[],'2026-10-15T00:00:00Z');
class Element {
  constructor(id=''){this.id=id;this.children=[];this.listeners={};this.dataset={};this.attributes={};this._value='';this.files=[];this.hidden=false;this.disabled=false;this.textContent='';}
  set value(value){this._value=value;if(value===''&&['expected','existing'].includes(this.id))this.files=[];}
  get value(){return this._value;}
  replaceChildren(...children){this.children=children;if(this.id==='host')this.value=children[0]?.value||'';}
  append(...children){this.children.push(...children);}
  addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
  dispatch(type){for(const listener of this.listeners[type]||[])listener({});}
  setAttribute(key,value){this.attributes[key]=value;}
  focus(){this.focused=true;}
  click(){this.dispatch('click');}
}
function harness(){
  const ids=['status','host','build','import','clear','try-example','example-note','results','form','expected','existing','rows','counts','comparison','warnings','xml-preview','page-label','prev','next'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  elements.results.hidden=true;elements['example-note'].hidden=true;elements.host.disabled=true;elements.build.disabled=true;
  const categories=['included','added','missing','excluded','duplicate'].map(category=>Object.assign(new Element(),{dataset:{category}}));
  const downloads=['xml','csv','manifest','report'].map(download=>Object.assign(new Element(),{dataset:{download}}));
  const workers=[],links=[],blobs=[];const window=new Element();
  class WorkerAdapter {
    constructor(path,options){
      assert.equal(path,'./worker.mjs');assert.equal(options.type,'module');this.messages=[];this.tasks=[];this.replies=[];this.delivered=[];this.terminated=false;workers.push(this);
      this.context={...core,crypto:webcrypto,Blob,Uint8Array,TextEncoder,TextDecoder,self:{postMessage:data=>this.replies.push(data)}};
      // Only the module import is supplied by the adapter; execute the actual product Worker body.
      vm.runInNewContext(read('./source/worker.mjs').replace(/^import .*;\n/,''),this.context);
    }
    postMessage(message){this.messages.push(message);this.tasks.push(this.context.self.onmessage({data:message}));}
    terminate(){this.terminated=true;}
    emit(data){this.delivered.push(data);this.onmessage?.({data});}
  }
  const document={getElementById:id=>{assert(elements[id],id);return elements[id];},querySelectorAll:selector=>selector==='[data-category]'?categories:selector==='[data-download]'?downloads:[],createElement:tag=>{const el=new Element();if(tag==='a')links.push(el);return el;}};
  const context={document,window,Worker:WorkerAdapter,Option:class extends Element{constructor(label,value){super();this.textContent=label;this.value=value;}},checkSizes:core.checkSizes,DEMO_HOST,sampleFiles,Blob,Date,URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:offline-test';},revokeObjectURL:()=>{}},setTimeout:fn=>fn()};
  vm.runInNewContext(read('./source/app.mjs').replace(/^import .*;\n/gm,''),context);
  return {elements,workers,window,downloads,blobs,links,click:id=>elements[id].click(),async flush(){
    for(let round=0;round<20;round++){
      const tasks=workers.flatMap(worker=>worker.tasks.splice(0));if(tasks.length)await Promise.all(tasks);
      let delivered=0;for(const worker of workers)for(const reply of worker.replies.splice(0)){worker.emit(reply);delivered++;}
      if(!delivered&&!workers.some(worker=>worker.tasks.length))return;
    }
    assert.fail('Message adapter did not settle');
  }};
}
function selectFile(h,text='https://customer.test/own\n',name='urls.txt'){
  const file=new Blob([text]);file.name=name;h.elements.expected.files=[file];h.elements.expected.value=name;h.elements.expected.dispatch('change');
}
function expectedCounts(h){return Object.fromEntries(h.elements.counts.children.map(box=>[box.children[1].textContent,box.children[0].textContent]));}

test('bundled demo bytes exactly match both unchanged sample downloads',async()=>{
  assert.equal(SAMPLE_URLS,read('./source/sample-urls.txt'));assert.equal(SAMPLE_SITEMAP,read('./source/sample-sitemap.xml'));
  const files=sampleFiles();assert.equal(files.length,2);
  for(const [index,text]of [SAMPLE_URLS,SAMPLE_SITEMAP].entries()){assert.equal(await files[index].file.text(),text);assert.equal(files[index].size,Buffer.byteLength(text));}
});

test('one click imports and builds through exact Worker logic with calculated exports and visible demo state',async()=>{
  const h=harness();selectFile(h);h.click('try-example');
  assert.equal(h.elements.expected.files.length,0);assert.equal(h.elements.existing.files.length,0);
  assert.equal(h.elements['example-note'].hidden,false);await h.flush();
  assert.equal(h.workers.length,1);assert.deepEqual(h.workers[0].messages.map(message=>message.type),['import','build']);
  assert.equal(h.workers[0].messages[1].host,DEMO_HOST);assert.equal(h.elements.host.value,DEMO_HOST);
  assert.equal(h.elements.results.hidden,false);assert.match(h.elements.status.textContent,/Synthetic example.test demo ready/);assert.match(h.elements.comparison.textContent,/^Synthetic example.test demo/);
  assert.deepEqual(expectedCounts(h),Object.fromEntries(['included','added','missing','excluded','duplicate'].map(key=>[key,calculated.manifest.counts[key]])));
  assert.equal(h.elements['xml-preview'].textContent,calculated.xml);
  const built=h.workers[0].delivered.find(message=>message.type==='built').result;
  const exports=[['sitemap.xml',built.xml],['changes.csv',built.csv],['manifest.json',JSON.stringify(built.manifest,null,2)+'\n'],['report.txt',built.report]];
  for(const [index,[filename,bytes]]of exports.entries()){
    h.downloads[index].click();assert.equal(await h.blobs[index].text(),bytes);assert.equal(h.links[index].download,filename);
    assert.equal(h.elements.status.textContent,`Prepared ${filename} for download. Your browser controls saving. Synthetic example inputs remain in tab memory until cleared or closed.`);
  }
});

test('Clear during demo import invalidates even an already queued imported reply',async()=>{
  const h=harness();h.click('try-example');const old=h.workers[0];h.click('clear');await h.flush();
  assert.equal(old.terminated,true);assert.deepEqual(old.messages.map(message=>message.type),['import']);
  assert.equal(h.elements.results.hidden,true);assert.equal(h.elements.host.disabled,true);assert.equal(h.elements.host.value,'');
  assert.equal(h.elements['example-note'].hidden,true);assert.equal(h.elements['try-example'].disabled,false);assert.match(h.elements.status.textContent,/cleared/);
});

test('file change during demo load drops stale replies and retains explicit host choice for ordinary import',async()=>{
  const h=harness();h.click('try-example');const old=h.workers[0];selectFile(h);await h.flush();
  assert.equal(old.terminated,true);assert.equal(h.elements.results.hidden,true);assert.equal(h.elements['example-note'].hidden,true);
  h.click('import');await h.flush();const ordinary=h.workers[1];
  assert.deepEqual(ordinary.messages.map(message=>message.type),['import']);assert.equal(h.elements.host.value,'');assert.equal(h.elements.build.disabled,true);
  assert.match(h.elements.status.textContent,/Choose one host/);
  h.elements.host.value='customer.test';h.elements.host.dispatch('change');h.click('build');await h.flush();
  assert.equal(h.elements.results.hidden,false);assert.equal(expectedCounts(h).included,1);assert.equal(h.elements['example-note'].hidden,true);
  assert(!h.elements.status.textContent.includes('Synthetic'));
  h.downloads[0].click();assert.equal(h.elements.status.textContent,'Prepared sitemap.xml for download. Your browser controls saving. Your imported files remain in tab memory until cleared or closed.');
});

test('queued built reply from a replaced demo cannot overwrite a new run or unlock its controls',async()=>{
  const h=harness();h.click('try-example');const old=h.workers[0];
  await Promise.all(old.tasks.splice(0));old.emit(old.replies.shift()); // Imported triggers a real build, whose reply is now in flight.
  h.click('clear');h.click('try-example');const newer=h.workers[1];
  old.emit({type:'built',result:calculated});old.onerror?.();
  assert.equal(h.elements.results.hidden,true);assert.equal(h.elements['try-example'].disabled,true);assert.equal(h.elements.form.attributes['aria-busy'],'true');
  await h.flush();assert.equal(h.elements.results.hidden,false);assert.equal(newer.messages[1].host,DEMO_HOST);
});

test('actual file change after demo result removes its result and prevents stale downloads',async()=>{
  const h=harness();h.click('try-example');await h.flush();selectFile(h);h.downloads[0].click();
  assert.equal(h.elements.results.hidden,true);assert.equal(h.elements['example-note'].hidden,true);assert.equal(h.blobs.length,0);
  assert.equal(h.elements.host.value,'');assert.equal(h.elements.host.disabled,true);
});

test('ordinary import errors, host-change invalidation, Clear and pagehide retain their lifecycle',async()=>{
  const h=harness();h.click('import');assert.match(h.elements.status.textContent,/Choose an expected/);
  selectFile(h,'https://customer.test/one\nhttps://second.test/two\n');h.click('import');await h.flush();
  assert.equal(h.elements.host.value,'');assert.equal(h.elements.build.disabled,true);
  h.elements.host.value='customer.test';h.elements.host.dispatch('change');h.click('build');await h.flush();
  assert.equal(h.elements.results.hidden,false);h.elements.host.value='second.test';h.elements.host.dispatch('change');assert.equal(h.elements.results.hidden,true);
  h.click('clear');assert.equal(h.elements.expected.files.length,0);assert.equal(h.elements.existing.files.length,0);
  h.click('try-example');h.window.dispatch('pagehide');await h.flush();assert.equal(h.elements.results.hidden,true);
});

test('example UI retains input contracts, source links and a practical publication note',()=>{
  const html=read('./source/index.html'),md=read('./source/README.md'),app=read('./source/app.mjs');
  assert(html.includes('id="try-example"'));assert(html.includes('id="example-note"'));assert(html.includes('Your own files still require an explicit host choice.'));
  assert(html.includes('Added means expected-only'));assert(html.includes('Neither label describes Google indexing.'));assert(html.includes('commonly <code>/sitemap.xml</code>'));
  assert(md.includes('same Worker import, hashing, parser and build functions'));assert(md.includes('It never submits or publishes a sitemap.'));
  for(const pattern of [/\bfetch\s*\(/,/\bDataTransfer\b/,/\bXMLHttpRequest\b/,/localStorage|sessionStorage|indexedDB/])assert(!pattern.test(app));
});

test('HTML app query exactly fingerprints the current app bytes',()=>{
  const html=read('./source/index.html');
  const appHash=createHash('sha256').update(readFileSync(new URL('./source/app.mjs',import.meta.url))).digest('hex');
  assert.equal((html.match(/src="\.\/app\.mjs[^"]*"/g)||[]).length,1);
  assert(html.includes(`src="./app.mjs?v=${appHash}"`));
});

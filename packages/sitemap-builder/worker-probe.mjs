// Execute the exact product Worker module in Node's worker_threads with a
// small self/message adapter. This is a worker integration test, not browser QA.
import {Worker, isMainThread, parentPort} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
if (!isMainThread) {
  globalThis.self = globalThis;
  self.postMessage = m => parentPort.postMessage(m);
  const read = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = function () { parentPort.postMessage({type:'trace',event:'file-read',bytes:this.size}); return read.call(this); };
  for (const name of ['fetch','XMLHttpRequest','WebSocket','EventSource']) globalThis[name] = () => { parentPort.postMessage({type:'trace',event:'network-call',name}); throw Error('Network forbidden by test'); };
  await import('./source/worker.mjs');
  parentPort.on('message',data=>self.onmessage({data}));
} else {
  const NS='http://www.sitemaps.org/schemas/sitemap/0.9', maxBytes=2*1024*1024;
  const records=[],checks=[];
  async function run(name,files,options={}) {
    const worker = new Worker(new URL(import.meta.url));
    const trace=[], times=[], t=performance.now(); let previous=t;
    const interval=setInterval(()=>{const now=performance.now();times.push(now-previous);previous=now;},10);
    function next() { return new Promise((resolve,reject)=> { const timer=setTimeout(()=>reject(new Error('Worker timeout')),5000); const fn=data=> { if(data.type==='trace') trace.push(data); else {clearTimeout(timer);worker.off('message',fn);resolve(data);} };worker.on('message',fn);worker.once('error',reject); }); }
    try {
      let wait=next(); worker.postMessage({type:'import',files,observedAt:'2026-10-08T00:00:00Z'}); const imported=await wait;
      let built;
      if(imported.type==='imported') {wait=next();worker.postMessage({type:'build',host:'example.test'});built=await wait;}
      const ms=performance.now()-t;
      const summary={name,milliseconds:ms,timer_ticks:times.length,max_timer_gap_ms:times.length?Math.max(...times):null,trace,import_type:imported.type,import_error:imported.message};
      assert.equal(trace.filter(e=>e.event==='network-call').length,0);
      if(options.error) {
        assert.equal(imported.type,'error'); assert.match(imported.message,options.error);
        if(options.noRead) assert.equal(trace.length,0);
        wait=next();worker.postMessage({type:'build',host:'example.test'});
        assert.deepEqual(await wait,{type:'error',message:'Import files first.'});
      } else {
        assert.equal(imported.type,'imported'); assert.equal(built.type,'built');
        summary.counts=built.result.manifest.counts;
        summary.input_manifest=built.result.manifest.inputs;
        summary.ruleset=built.result.manifest.ruleset;
        for(let i=0;i<files.length;i++) assert.equal(built.result.manifest.inputs[i].sha256,createHash('sha256').update(Buffer.from(await files[i].file.arrayBuffer())).digest('hex'));
        if(options.counts) for(const [key,value] of Object.entries(options.counts)) assert.equal(summary.counts[key],value);
        if(options.upper) { assert.ok(ms<5000);assert.ok(times.length>0);assert.equal(summary.counts.included,5000);assert.equal(summary.counts.added,0);assert.equal(summary.counts.missing,0); }
      }
      records.push(summary);checks.push({name,status:'PASS'});
    } catch(e) {checks.push({name,status:'FAIL',error:e.message});}
    finally {clearInterval(interval);await worker.terminate();}
  }
  const file=(text,role,format,size)=>({file:new Blob([text]),size:size??Buffer.byteLength(text),role,format});
  const txt=readFileSync(new URL('./correction.txt',import.meta.url),'utf8');
  const csv=readFileSync(new URL('./correction.csv',import.meta.url),'utf8');
  for (const [format,text] of [['txt',txt],['csv',csv]]) await run('R1 exact product worker '+format,[file(text,'expected',format)],{counts:{included:13,excluded:32,duplicate:1}});
  const samples=JSON.parse(readFileSync(new URL('./REGRESSION-EVIDENCE.json',import.meta.url)));
  for(const sample of samples.malformed) await run('R2 worker '+sample.name,[file('https://example.test/A','expected','txt'),file(sample.xml,'existing','xml')],{error:/XML|namespace/});
  await run('oversize metadata before any file read',[file('small','expected','txt',maxBytes+1)],{error:/2 MiB/,noRead:true});
  await run('third file rejected before any file read',[file('small','expected','txt'),file('small','existing','xml'),file('small','existing','xml')],{error:/at most one/,noRead:true});
  const urls=Array.from({length:5000},(_,i)=>'https://example.test/'+i+'?b=2&a=1');
  const t=urls.join('\n')+'\n';const paddedTxt=t+' '.repeat(maxBytes-Buffer.byteLength(t));
  const x=`<urlset xmlns="${NS}">`+urls.map(u=>'<url><loc>'+u.replaceAll('&','&amp;')+'</loc></url>').join('')+'</urlset>';
  const paddedXML=x.replace('</urlset>','<!--'+' '.repeat(maxBytes-Buffer.byteLength(x)-7)+'--></urlset>');
  writeFileSync(new URL('./maximum.txt',import.meta.url),paddedTxt);
  writeFileSync(new URL('./maximum.xml',import.meta.url),paddedXML);
  await run('max 4 MiB total; 5,000 URL records in each input',[file(paddedTxt,'expected','txt'),file(paddedXML,'existing','xml')],{upper:true});
  const evidence={observed_at:new Date().toISOString(),environment:{runtime:'Node '+process.version,platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model,logical_cpus:os.cpus().length,total_memory:os.totalmem()},scope:'exact product Web Worker module via Node self/message adapter; NOT a fresh browser performance/UI result',checks,passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length,records};
  writeFileSync(new URL('./WORKER-EVIDENCE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify({passed:evidence.passed,failed:evidence.failed,failures:checks.filter(c=>c.status==='FAIL'),maximum:records.at(-1)}));
  if(evidence.failed)process.exitCode=1;
}

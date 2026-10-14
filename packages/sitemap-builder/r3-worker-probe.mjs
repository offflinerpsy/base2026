// Execute the unmodified product worker.mjs under a Node self/message adapter.
import {Worker,isMainThread,parentPort} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
if(!isMainThread){
 globalThis.self=globalThis;self.postMessage=m=>parentPort.postMessage(m);
 for(const name of ['fetch','XMLHttpRequest','WebSocket','EventSource'])globalThis[name]=()=>{parentPort.postMessage({type:'trace',event:'network-call',name});throw Error('Forbidden network');};
 await import('./source/worker.mjs');parentPort.on('message',data=>self.onmessage({data}));
}else{
 const data=JSON.parse(readFileSync(new URL('./R3-REGRESSION-EVIDENCE.json',import.meta.url)));
 const worker=new Worker(new URL(import.meta.url)),checks=[],trace=[];
 worker.on('message',m=>{if(m.type==='trace')trace.push(m);});
 const request=m=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),5000);const listener=r=>{if(r.type==='trace')return;clearTimeout(timer);worker.off('message',listener);resolve(r);};worker.on('message',listener);worker.postMessage(m);});
 const file=(text,role,format)=>({file:new Blob([text]),size:Buffer.byteLength(text),role,format});
 const expected='https://example.test/A?b=2&a=1',good=data.cases.find(c=>c.well_formed);
 async function valid(c){
  const imported=await request({type:'import',files:[file(expected,'expected','txt'),file(c.xml,'existing','xml')],observedAt:'2026-10-08T00:00:00Z'});
  assert.equal(imported.type,'imported');assert.deepEqual(imported.hosts,['example.test']);
  const built=await request({type:'build',host:'example.test'});assert.equal(built.type,'built');
  assert.deepEqual(built.result.manifest.counts,{expected_records:1,existing_records:1,included:1,existing_included:1,added:0,missing:0,excluded:0,duplicate:0,exclusion_reasons:{}});
  assert.equal(built.result.manifest.ruleset,'base2026.sitemap-local/1.0.2');
  assert.equal(built.result.manifest.inputs[1].sha256,createHash('sha256').update(c.xml).digest('hex'));
  assert.equal(built.result.included[0].url,expected);assert.ok(!built.result.xml.includes('lastmod'));
 }
 try{
  for(const c of data.cases){
   try{
    if(c.well_formed)await valid(c);
    else{
     await valid(good); // Prime existing state first; failed import must destroy it.
     const error=await request({type:'import',files:[file(expected,'expected','txt'),file(c.xml,'existing','xml')],observedAt:'2026-10-08T00:00:00Z'});
     assert.equal(error.type,'error');assert.match(error.message,/XML/);
     assert.deepEqual(await request({type:'build',host:'example.test'}),{type:'error',message:'Import files first.'});
     await valid(good); // Recovery via normal import/build, no process restart.
    }
    checks.push({name:c.name,status:'PASS',valid_state_primed_before_error:!c.well_formed,build_after_error_rejected:!c.well_formed,reimport_recovery_checked:!c.well_formed});
   }catch(e){checks.push({name:c.name,status:'FAIL',error:e.message});}
  }
  assert.equal(trace.length,0);
 }finally{await worker.terminate();}
 const out={observed_at:new Date().toISOString(),runtime:process.version,scope:'exact product Worker via Node adapter; not browser acceptance',worker_sha256:createHash('sha256').update(readFileSync(new URL('./source/worker.mjs',import.meta.url))).digest('hex'),core_sha256:createHash('sha256').update(readFileSync(new URL('./source/core.mjs',import.meta.url))).digest('hex'),checks,network_calls:trace,passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length};
 writeFileSync(new URL('./R3-WORKER-EVIDENCE.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({passed:out.passed,failed:out.failed,failures:checks.filter(c=>c.status==='FAIL').slice(0,3)}));if(out.failed)process.exitCode=1;
}

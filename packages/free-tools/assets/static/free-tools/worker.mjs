import {decode} from './sitemap-core.mjs';
import {TOOLS,LIMITS} from './tools.mjs';
import {runTool} from './engine.mjs';

const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
self.onmessage=async({data})=>{
  try {
    const def=TOOLS[data.id];if(!def)throw Error('Unknown tool.');
    if(!Array.isArray(data.inputs)||data.inputs.length!==def.inputs.length)throw Error('Input roles do not match this tool.');
    const inputs={},metadata=[];let total=0;
    for(const field of def.inputs) {
      const item=data.inputs.find(i=>i.role===field.role);if(!item)throw Error(`Missing ${field.label}.`);
      const size=item.file?item.file.size:new Blob([item.text||'']).size;
      if(!Number.isSafeInteger(size)||size<1||size>LIMITS.fileBytes)throw Error(`${field.label}: choose nonempty UTF-8 content up to 2 MiB.`);
      total+=size;if(total>LIMITS.totalBytes)throw Error('Combined inputs exceed 4 MiB.');
      if(field.role==='robots'&&size>LIMITS.robotsBytes)throw Error('robots.txt: maximum 64 KiB.');
    }
    for(const field of def.inputs) {
      const item=data.inputs.find(i=>i.role===field.role);
      const buffer=item.file?await item.file.arrayBuffer():new TextEncoder().encode(item.text).buffer;
      const raw=new Uint8Array(buffer);inputs[field.role]=decode(raw);
      metadata.push({role:field.role,sha256:await hash(buffer),bytes:raw.byteLength,input_kind:item.file?'local file':'pasted text',observation_date:'USER_DATA_OR_UNKNOWN'});
    }
    const result=runTool(data.id,inputs,data.options||{},metadata);
    self.postMessage({ok:true,result});
  } catch(error) {self.postMessage({ok:false,error:String(error?.message||'Unable to process the supplied data.').slice(0,1000)});}
};

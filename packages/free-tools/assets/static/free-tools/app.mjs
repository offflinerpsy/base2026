import {createSnippetPreview} from './snippet-preview.mjs';
import {TOOLS,LIMITS} from './tools.mjs';
const $=id=>document.getElementById(id),root=document.querySelector('[data-free-tool]');
const id=root?.dataset.freeTool,def=TOOLS[id];
if(def) {
  const snippet=def.snippetPreview?createSnippetPreview(document):null;
  let worker,result,tablePage=0,findingsPage=0;const PAGE=30;
  const status=(message,error=false)=>{$('tool-status').textContent=message;$('tool-status').className='tool-status'+(error?' tool-error':'');};
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
  const counted=(count,noun)=>`${count} ${noun}${count===1?'':'s'}`;
  function resetResult(){snippet?.clear();worker?.terminate();worker=undefined;result=undefined;tablePage=0;findingsPage=0;$('tool-results').hidden=true;if($('config-preview'))$('config-preview').value='';$('run-tool').disabled=false;$('tool-form').setAttribute('aria-busy','false');for(const name of ['summary','downloads','result-head','result-body','finding-body','report-notes'])$(name).replaceChildren();}
  function clearAll(){resetResult();for(const field of def.inputs){$('input-'+field.role).value='';$('file-'+field.role).value='';}for(const opt of def.options)if(opt.clearOnReset)$('option-'+opt.name).value=opt.value;status('Paste your data, choose local files or try the example.');}
  function inputsReady(){resetResult();status('Inputs changed. Run the check to get fresh results.');}
  function renderRows(){
    const data=result.rows,start=tablePage*PAGE,end=Math.min(data.length,start+PAGE);$('result-body').replaceChildren();
    for(const row of data.slice(start,end)){const tr=node('tr');row.forEach((value,i)=>{const shown=def.previewSignificantDigits===12&&typeof value==='number'&&Number.isFinite(value)&&!Number.isInteger(value)?Number(value.toPrecision(12)):value;const td=node('td',shown);td.dataset.label=result.columns[i];tr.append(td);});$('result-body').append(tr);}
    $('table-page').textContent=data.length?`${start+1}–${end} of ${data.length} result rows`:'No result rows. Read findings and scope below.';$('prev-rows').disabled=tablePage===0;$('next-rows').disabled=end>=data.length;
    const fs=findingsPage*PAGE,fe=Math.min(result.findings.length,fs+PAGE);$('finding-body').replaceChildren();
    for(const f of result.findings.slice(fs,fe)){const li=node('li');li.append(node('strong',`${f.severity}: ${f.rule}`),node('p',f.subject),node('p',f.detail));if(f.source)li.append(node('small',f.source));$('finding-body').append(li);}
    $('findings-page').textContent=result.findings.length?`${fs+1}–${fe} of ${result.findings.length} findings`:'No findings in the supplied data. Live correctness is not established.';$('prev-findings').disabled=findingsPage===0;$('next-findings').disabled=fe>=result.findings.length;
  }
  function render(data){
    result=data;$('summary').replaceChildren();for(const [label,value]of data.summary){const card=node('div');card.append(node('strong',value),node('span',label));$('summary').append(card);}
    $('downloads').replaceChildren();for(const [i,file]of data.exports.entries()){const b=node('button',file.label,i===0?'b26-button--primary':'b26-button--secondary');b.type='button';b.addEventListener('click',()=>{if(!result)return;const blob=new Blob([file.text],{type:file.mime}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=file.name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status(`${file.name} prepared for download. Your browser controls where it is saved.`);});$('downloads').append(b);}
    const tr=node('tr');for(const text of data.columns) {const th=node('th',text);th.scope='col';tr.append(th);}$('result-head').replaceChildren(tr);
    $('report-notes').replaceChildren(...data.notes.map(text=>node('li',text)));
    if($('config-preview'))$('config-preview').value=data.exports.find(f=>f.name==='_redirects')?.text||'';
    snippet?.render(data.snippets);
    $('tool-results').hidden=false;renderRows();status(`Complete: ${counted(data.rows.length,'result row')} and ${counted(data.findings.length,'finding')}. Review scope before using the exports.`);$('tool-results').focus();
  }
  $('copy-config')?.addEventListener('click',async()=>{if(!result)return;const el=$('config-preview');try{await navigator.clipboard.writeText(el.value);status('Draft copied. Test the configuration in staging before use.');}catch{el.focus();el.select();status('Draft selected. Use your browser copy command, then test it in staging.');}});
  $('clear-tool').addEventListener('click',clearAll);
  $('try-example').addEventListener('click',()=>{clearAll();for(const field of def.inputs)$('input-'+field.role).value=def.sample[field.role];for(const opt of def.options){const el=$('option-'+opt.name);if(opt.type==='checkbox')el.checked=!!opt.value;else el.value=opt.sampleValue??opt.value;}status('Made-up example data loaded. Run the check to see real calculated results.');$('tool-form').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
  for(const field of def.inputs){$('input-'+field.role).addEventListener('input',()=>{if($('file-'+field.role).files.length){$('file-'+field.role).value='';}inputsReady();});$('file-'+field.role).addEventListener('change',()=>{if($('file-'+field.role).files.length)$('input-'+field.role).value='';inputsReady();});}
  for(const option of def.options)$('option-'+option.name).addEventListener('input',inputsReady);
  $('run-tool').addEventListener('click',()=>{
    resetResult();try {
      let total=0;const inputs=def.inputs.map(field=>{const file=$('file-'+field.role).files[0],text=$('input-'+field.role).value,size=file?file.size:new Blob([text]).size;if(!size&&field.required)throw Error(`${field.label}: paste content or choose a local file.`);if(size>LIMITS.fileBytes)throw Error(`${field.label}: maximum 2 MiB.`);total+=size;return {role:field.role,...(file?{file}:{text})};});
      if(total>LIMITS.totalBytes)throw Error('Combined inputs exceed 4 MiB.');const options={};for(const option of def.options){const el=$('option-'+option.name);options[option.name]=option.type==='checkbox'?el.checked:el.value;}
      worker=new Worker('/static/free-tools/worker.mjs',{type:'module'});const current=worker;
      worker.onmessage=({data})=>{if(worker!==current)return;current.terminate();worker=undefined;$('run-tool').disabled=false;$('tool-form').setAttribute('aria-busy','false');if(data.ok)render(data.result);else{resetResult();status(data.error,true);$('tool-status').focus();}};
      worker.onerror=()=>{if(worker!==current)return;resetResult();status('The local processing worker could not start. Check browser support and reload.',true);};
      $('run-tool').disabled=true;$('tool-form').setAttribute('aria-busy','true');status('Checking your data in this tab… You can Clear to cancel.');worker.postMessage({id,inputs,options});
    }catch(error){resetResult();status(error.message,true);$('tool-status').focus();}
  });
  $('prev-rows').addEventListener('click',()=>{if(result&&tablePage>0){tablePage--;renderRows();}});$('next-rows').addEventListener('click',()=>{if(result&&(tablePage+1)*PAGE<result.rows.length){tablePage++;renderRows();}});
  $('prev-findings').addEventListener('click',()=>{if(result&&findingsPage>0){findingsPage--;renderRows();}});$('next-findings').addEventListener('click',()=>{if(result&&(findingsPage+1)*PAGE<result.findings.length){findingsPage++;renderRows();}});
  window.addEventListener('pagehide',clearAll);
}

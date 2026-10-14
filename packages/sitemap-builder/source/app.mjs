import {checkSizes} from './core.mjs';
const $ = id => document.getElementById(id);
let worker, result, category = 'included', page = 0, busy = false;
const PAGE = 25;
function status(message, error = false) { $('status').textContent = message; $('status').className = error ? 'notice error' : 'notice'; }
function invalidate() {
  worker?.terminate(); worker = undefined; result = undefined; busy = false;
  $('host').replaceChildren(new Option('Import files, then choose a host', ''));
  $('host').disabled = true; $('build').disabled = true; $('import').disabled = false;
  $('results').hidden = true; $('form').setAttribute('aria-busy','false');
  for (const id of ['rows','counts','comparison','warnings','xml-preview','page-label']) $(id).replaceChildren();
}
function setBusy(value) { busy = value; $('import').disabled = value; $('build').disabled = value || !$('host').value; $('host').disabled = value; $('form').setAttribute('aria-busy',String(value)); }
for (const id of ['expected','existing']) $(id).addEventListener('change',()=> { invalidate(); status('Files changed. Import them to choose a host.'); });
$('clear').addEventListener('click',()=> { invalidate(); $('expected').value = ''; $('existing').value = ''; status('Files and results cleared from this tab.'); $('expected').focus(); });
$('import').addEventListener('click',()=> {
  invalidate();
  try {
    const expected = $('expected').files[0], existing = $('existing').files[0];
    if (!expected) throw new Error('Choose an expected TXT or CSV file.');
    const format = expected.name.toLowerCase().endsWith('.txt') ? 'txt' : expected.name.toLowerCase().endsWith('.csv') ? 'csv' : '';
    if (!format) throw new Error('Expected file must have a .txt or .csv extension.');
    if (existing && !existing.name.toLowerCase().endsWith('.xml')) throw new Error('Existing sitemap must have a .xml extension.');
    const files = [{file:expected,size:expected.size,role:'expected',format},...(existing?[{file:existing,size:existing.size,role:'existing',format:'xml'}]:[])];
    checkSizes(files); // before cloning files to Worker; checked again there
    worker = new Worker('./worker.mjs',{type:'module'});
    worker.onmessage = ({data}) => {
      setBusy(false);
      if (data.type === 'error') { invalidate(); status(data.message,true); $('status').focus(); }
      else if (data.type === 'imported') {
        $('host').replaceChildren(new Option('Choose one host explicitly', ''),...data.hosts.map(h=>new Option(h,h)));
        $('host').disabled = false;
        status(`Imported ${data.records.map(r=>`${r.records} ${r.role} records`).join(' and ')}. Choose one host to build.`);
        $('host').focus();
      } else if (data.type === 'built') {
        result = data.result; category = 'included'; page = 0; render();
        status(`Ready. ${result.manifest.counts.included} URLs included. Review exclusions and download your files.`);
        $('results').hidden = false; $('results').focus();
      }
    };
    worker.onerror = () => { invalidate(); status('Worker could not start. Reload the local preview and import again.',true); };
    setBusy(true); status('Reading and parsing in this tab…');
    worker.postMessage({type:'import',files,observedAt:new Date().toISOString()});
  } catch (e) { invalidate(); status(e.message,true); $('status').focus(); }
});
$('host').addEventListener('change',()=> { result = undefined; $('results').hidden = true; $('build').disabled = !$('host').value || busy; });
$('build').addEventListener('click',()=> { setBusy(true); $('results').hidden = true; status('Building sitemap and comparing exact URL strings…'); worker.postMessage({type:'build',host:$('host').value}); });
function td(text, label) { const el = document.createElement('td'); el.textContent = String(text ?? ''); el.dataset.label = label; return el; }
function render() {
  const c = result.manifest.counts;
  $('counts').replaceChildren(...['included','added','missing','excluded','duplicate'].map(k=> {
    const box = document.createElement('div'), strong = document.createElement('strong'), label = document.createElement('span');
    strong.textContent = c[k]; label.textContent = k; box.append(strong,label); return box;
  }));
  $('comparison').textContent = result.manifest.scope.comparison ? `Host: ${result.manifest.scope.host}. Added = expected-only; missing = existing-only. Excluded and duplicate counts cover both inputs.` : `Host: ${result.manifest.scope.host}. No comparison XML supplied; added and missing counts are zero.`;
  $('warnings').textContent = result.manifest.warnings.length ? result.manifest.warnings.map(w=>`${w.source || 'input'}${w.row?` record ${w.row}`:''}: ${w.reason}`).join('\n') : 'No parsing or duplicate warnings.';
  for (const b of document.querySelectorAll('[data-category]')) b.setAttribute('aria-pressed',String(b.dataset.category === category));
  const records = result[category]; const start = page * PAGE;
  $('rows').replaceChildren(...records.slice(start,start+PAGE).map(r=> { const tr = document.createElement('tr'); tr.append(td(r.url,'URL'),td(r.source,'Source'),td(r.row,'Record'),td(r.reason || 'selected-host','Reason')); return tr; }));
  $('page-label').textContent = records.length ? `${start+1}–${Math.min(start+PAGE,records.length)} of ${records.length} ${category} records` : `0 ${category} records`;
  $('prev').disabled = page === 0; $('next').disabled = start+PAGE >= records.length;
  $('xml-preview').textContent = result.xml.length > 8000 ? result.xml.slice(0,8000)+'\n… Preview truncated; download contains the complete XML.' : result.xml;
}
for (const b of document.querySelectorAll('[data-category]')) b.addEventListener('click',()=> { category = b.dataset.category; page = 0; render(); });
$('prev').addEventListener('click',()=> { page--; render(); });
$('next').addEventListener('click',()=> { page++; render(); });
const downloads = {xml:['sitemap.xml','application/xml;charset=utf-8',()=>result.xml],csv:['changes.csv','text/csv;charset=utf-8',()=>result.csv],manifest:['manifest.json','application/json;charset=utf-8',()=>JSON.stringify(result.manifest,null,2)+'\n'],report:['report.txt','text/plain;charset=utf-8',()=>result.report]};
for (const button of document.querySelectorAll('[data-download]')) button.addEventListener('click',()=> {
  if (!result) return;
  const [filename,type,value] = downloads[button.dataset.download];
  const url = URL.createObjectURL(new Blob([value()],{type}));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000); status(`Downloaded ${filename}. Your imported files remain in tab memory until cleared or closed.`);
});
window.addEventListener('pagehide',()=> { worker?.terminate(); result = undefined; });

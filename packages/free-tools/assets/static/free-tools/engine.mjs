import {auditMetadata} from './batch4.mjs';
import {auditInternalLinks,compareGscPeriods} from './batch3.mjs';
import {reconcileIndexing,compileRedirects} from './batch2.mjs';
import {csvRows, csvCell} from './sitemap-core.mjs';
import {TOOLS, LIMITS} from './tools.mjs';

const fail = message => { throw new Error(message); };
const bytes = s => new TextEncoder().encode(s).byteLength;
const clean = value => String(value ?? '').trim();
const header = value => clean(value).toLowerCase().replace(/[\s-]+/g,'_');
const ref = (role,record) => `${role} record ${record}`;
const finding = (list,severity,rule,subject,detail,source='') => list.push({severity,rule,subject,detail,source});
const oneLine = value => String(value ?? '').replace(/[\r\n\t]+/g,' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
export function urlValue(value) {
  const raw=clean(value);
  if (!raw || raw.length>LIMITS.urlLength || /[\s\u0000-\u001f\u007f]/u.test(raw)) return {error:'Use an absolute HTTP(S) URL without whitespace (maximum 4,096 characters).'};
  try { const parsed=new URL(raw); if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash) return {error:'Only HTTP(S) URLs without credentials or fragments are supported.'}; return {raw,parsed}; }
  catch {return {error:'Invalid absolute HTTP(S) URL.'};}
}
export function readCsv(text,role,schema,required,{preserveValues=false}={}) {
  if (bytes(text)>LIMITS.fileBytes) fail(`${role}: file exceeds 2 MiB.`);
  const all=csvRows(text,LIMITS.records+1);
  if (!all.length) fail(`${role}: CSV is empty. Include a header row.`);
  const aliases=new Map();
  for (const [name,names] of Object.entries(schema)) for (const alias of [name,...names]) aliases.set(header(alias),name);
  const keys=all[0].map(header), seen=new Set(), mapped=new Set(), columns=[];
  for (const k of keys) {if (!k) fail(`${role}: header names cannot be empty.`); if(seen.has(k))fail(`${role}: duplicate header ${k}.`);seen.add(k);const name=aliases.get(k);if(name&&mapped.has(name))fail(`${role}: several headers map to ${name}.`);if(name)mapped.add(name);columns.push(name||null);}
  for (const k of required) if(!mapped.has(k))fail(`${role}: required header ${k} is missing.`);
  const rows=[];
  for(let i=1;i<all.length;i++) {
    if(all[i].length!==keys.length)fail(`${role}: record ${i+1} has ${all[i].length} cells; expected ${keys.length}.`);
    if(all[i].every(v=>clean(v)===''))continue;
    const row={record:i+1};
    for(let c=0;c<columns.length;c++) {if(all[i][c].length>LIMITS.cellLength)fail(`${role}: a cell exceeds 16,384 characters.`);if(columns[c])row[columns[c]]=preserveValues?all[i][c]:clean(all[i][c]);}
    rows.push(row);
  }
  if(rows.length>LIMITS.records)fail(`${role}: maximum 5,000 data records.`);
  if(!rows.length)fail(`${role}: no data records were supplied.`);
  return {rows,fields:[...mapped],ignored:keys.filter((k,i)=>!columns[i])};
}
function ignoredColumns(parsed,role,findings) {if(parsed.ignored.length)finding(findings,'info','ignored_columns',role,`Unsupported columns were not interpreted: ${parsed.ignored.join(', ')}`);}
function validRows(parsed,fields,role,findings) {
  return parsed.rows.filter(r=>{let ok=true;for(const field of fields){const u=urlValue(r[field]);if(u.error){finding(findings,'error','invalid_url',r[field]||'(empty)',`${field}: ${u.error}`,ref(role,r.record));ok=false;}}return ok;});
}
const statusNumber = value => /^\d{3}$/.test(clean(value)) && +value>=100 && +value<=599 ? +value : null;

function robotsNormalize(value) {
  // Percent escapes for unreserved octets compare decoded; reserved octets remain escaped.
  let out='';
  for(const char of value)out+=char.codePointAt(0)>127?encodeURIComponent(char):char;
  return out.replace(/%([0-9a-f]{2})/gi,(_,hex)=>{const c=String.fromCharCode(parseInt(hex,16));return /[A-Za-z0-9._~-]/.test(c)?c:'%'+hex.toUpperCase();});
}
function robotsPattern(pattern) {
  const norm=robotsNormalize(pattern), terminal=norm.endsWith('$'), body=terminal?norm.slice(0,-1):norm;
  const parts=body.split('*');
  const matches=path=>{
    if(!path.startsWith(parts[0]))return false;
    if(parts.length===1)return terminal?path===parts[0]:true;
    let at=parts[0].length;
    for(let i=1;i<parts.length;i++) {
      const part=parts[i];if(i===parts.length-1&&terminal)return path.endsWith(part)&&path.length-part.length>=at;
      const next=path.indexOf(part,at);if(next<0)return false;at=next+part.length;
    }
    return true;
  };
  return {matches,specificity:bytes(body.replaceAll('*',''))};
}
export function testRobots(inputs,options={}) {
  const findings=[], groups=[], sitemap=[];let group=null, hasRules=false;
  if(bytes(inputs.robots)>LIMITS.robotsBytes)fail('robots.txt: maximum 64 KiB.');
  const agent=clean(options.agent||'Googlebot');
  if(!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(agent))fail('Crawler product token must contain letters, digits, _ or -, without spaces or version suffixes.');
  const lines=inputs.robots.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/);
  for(let i=0;i<lines.length;i++) {
    if(lines[i].length>8192)fail(`robots.txt line ${i+1} exceeds 8,192 characters.`);
    const text=lines[i].split('#',1)[0].trim();if(!text)continue;
    const colon=text.indexOf(':');if(colon<0){finding(findings,'warning','malformed_directive',`Line ${i+1}`,'No colon was found; line ignored.');continue;}
    const key=text.slice(0,colon).trim().toLowerCase(), value=text.slice(colon+1).trim();
    if(key==='user-agent') {
      if(!value||!/^\*$|^[A-Za-z][A-Za-z0-9_-]*$/.test(value)){finding(findings,'warning','unsupported_agent',`Line ${i+1}`,'Unsupported user-agent token; its following rules are not applied.');group=null;hasRules=false;continue;}
      if(!group||hasRules){group={agents:[],rules:[]};groups.push(group);hasRules=false;}
      group.agents.push(value.toLowerCase());continue;
    }
    if(key==='sitemap'){sitemap.push(value);continue;}
    if(key!=='allow'&&key!=='disallow'){finding(findings,'warning','ignored_directive',`Line ${i+1}`,`${key||'(empty)'} is not applied by this Google-style rule tester.`);continue;}
    if(!group){finding(findings,'warning','ungrouped_rule',`Line ${i+1}`,'Rule before a user-agent group was ignored.');continue;}
    hasRules=true;
    if(!value)continue;
    if(!value.startsWith('/')){finding(findings,'warning','invalid_rule_path',`Line ${i+1}`,'Rule must start with /. It was ignored.');continue;}
    if(group.rules.length>=5000)fail('Maximum 5,000 rules per group.');
    group.rules.push({action:key,pattern:value,line:i+1,...robotsPattern(value)});
  }
  const scored=groups.map(g=>({group:g,score:Math.max(-1,...g.agents.filter(a=>a!=='*'&&agent.toLowerCase().startsWith(a)).map(a=>a.length))}));
  const best=Math.max(-1,...scored.map(g=>g.score));
  const selected=best>=0?scored.filter(g=>g.score===best).map(g=>g.group):groups.filter(g=>g.agents.includes('*'));
  const rules=selected.flatMap(g=>g.rules), raw=inputs.urls.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/).map(clean).filter(Boolean);
  if(!raw.length)fail('Enter at least one URL to test.');if(raw.length>LIMITS.records)fail('Maximum 5,000 URLs.');
  if(rules.length*raw.reduce((n,u)=>n+u.length,0)>10000000)fail('This rule/URL combination is too large for one local check. Split the URL list and try again.');
  const seen=new Set(),origins=new Set(),rows=[];let allowed=0,blocked=0,invalid=0,duplicates=0;
  for(let i=0;i<raw.length;i++) {
    const v=urlValue(raw[i]);if(v.error){invalid++;finding(findings,'error','invalid_url',raw[i],v.error,ref('urls',i+1));continue;}
    origins.add(v.parsed.origin);if(seen.has(raw[i])){duplicates++;continue;}seen.add(raw[i]);
    const path=robotsNormalize(v.parsed.pathname+v.parsed.search);
    const matching=rules.filter(r=>r.matches(path)).sort((a,b)=>b.specificity-a.specificity||(a.action==='allow'?-1:1));
    const rule=matching[0],decision=rule?.action==='disallow'?'Blocked by supplied rule':'Allowed by supplied rules';
    if(rule?.action==='disallow')blocked++;else allowed++;
    rows.push([raw[i],decision,rule?.action||'No matching rule',rule?.pattern||'',rule?.line||'',path]);
  }
  if(origins.size>1)fail('Use URLs from one origin: the same scheme, host and port. A robots.txt file is scoped to that origin.');
  if(!rows.length)finding(findings,'warning','no_valid_urls','URL list','No valid URLs remained after validation.');
  return {summary:[['URLs tested',rows.length],['Allowed',allowed],['Blocked',blocked],['Invalid',invalid],['Exact duplicates',duplicates]],findings,columns:['URL','Supplied-rule decision','Rule','Pattern','robots.txt line','Matched path and query'],rows,
    scope:{crawler_token:agent,selected_groups:selected.map(g=>g.agents),rule_count:rules.length,sitemap_directives:sitemap,origin:[...origins][0]||null,matching_profile:'Google-style most-specific group, longest Allow/Disallow path, wildcard * and terminal $'},notes:TOOLS['robots-txt-tester'].boundaries};
}

export function checkRedirectMap(inputs) {
  const findings=[], parsed=readCsv(inputs.map,'map',{from:['source','source_url','old_url'],to:['target','destination','target_url','new_url'],status:['status_code','code']},['from','to']);ignoredColumns(parsed,'map',findings);
  const good=validRows(parsed,['from','to'],'map',findings), groups=new Map();
  for(const r of good){if(!groups.has(r.from))groups.set(r.from,[]);groups.get(r.from).push(r);}
  const graph=new Map(), conflicting=new Set();let duplicates=0;
  for(const [from,rs] of groups) {
    const distinct=new Set(rs.map(r=>JSON.stringify([r.to,r.status||''])));
    if(distinct.size>1){conflicting.add(from);finding(findings,'error','conflicting_source',from,'Several different target/status mappings are supplied. Excluded from chain resolution.',rs.map(r=>ref('map',r.record)).join('; '));continue;}
    duplicates+=rs.length-1;graph.set(from,rs[0]);
    const code=rs[0].status?statusNumber(rs[0].status):null;
    if(rs[0].status&&!new Set([301,302,303,307,308]).has(code))finding(findings,'warning','unsupported_redirect_status',from,`Supplied status ${rs[0].status} is not a supported redirect status; no live status was checked.`,ref('map',rs[0].record));
  }
  const memo=new Map();
  for(const start of graph.keys()) {
    if(memo.has(start))continue;
    const trail=[],local=new Map();let current=start,result;
    while(true) {
      if(conflicting.has(current)){result={kind:'Conflict downstream',final:current,hops:null};break;}
      if(memo.has(current)){result=memo.get(current);break;}
      if(local.has(current)){const loop=trail.slice(local.get(current));result={kind:'Loop',final:'',hops:null};for(const n of loop)memo.set(n,result);break;}
      if(!graph.has(current)){result={kind:'Terminal in supplied map',final:current,hops:0};break;}
      local.set(current,trail.length);trail.push(current);current=graph.get(current).to;
    }
    for(let i=trail.length-1;i>=0;i--) {const n=trail[i];if(memo.has(n))result=memo.get(n);else{result={...result,hops:result.hops===null?null:result.hops+1};memo.set(n,result);}}
  }
  const rows=[];let loops=0,chains=0;
  for(const [from,r] of graph) {
    const out=memo.get(from);if(out.kind==='Loop'){loops++;finding(findings,'error','redirect_loop',from,'This source enters a loop in the supplied map.',ref('map',r.record));}
    else if(out.kind==='Conflict downstream')finding(findings,'error','downstream_conflict',from,'Chain reaches a source with conflicting mappings.',ref('map',r.record));
    else if(out.hops>1){chains++;finding(findings,'warning','redirect_chain',from,`${out.hops} planned hops; review whether this source should point directly to the intended final destination.`,ref('map',r.record));}
    rows.push([from,r.to,r.status||'UNKNOWN',out.kind,out.hops??'UNKNOWN',out.final||'UNKNOWN',r.record]);
  }
  return {summary:[['Valid unique sources',graph.size],['Conflicting sources',conflicting.size],['Sources entering loops',loops],['Multi-hop sources',chains],['Exact duplicate mappings',duplicates]],findings,
    columns:['From','Planned to','Supplied status','Map result','Planned hops','Terminal map target','Input record'],rows,scope:{url_identity:'exact trimmed string',live_http_status:'UNKNOWN',final_target_status:'UNKNOWN'},notes:TOOLS['redirect-map-checker'].boundaries};
}

export function checkHreflang(inputs) {
  const findings=[], parsed=readCsv(inputs.map,'map',{page_url:['url','page','source'],hreflang:['language','language_code','lang'],alternate_url:['alternate','href','target']},['page_url','hreflang','alternate_url']);ignoredColumns(parsed,'map',findings);
  const good=validRows(parsed,['page_url','alternate_url'],'map',findings), byPage=new Map(), valid=[];let duplicates=0,conflicts=0,unknown=0,missingReturn=0,missingSelf=0;
  for(const r of good) {
    r.lang=r.hreflang.toLowerCase();
    if(r.lang!=='x-default'&&!/^[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?$/.test(r.lang)){finding(findings,'error','invalid_tag_shape',r.hreflang,'Expected a language tag shape such as en, en-US, zh-Hans or x-default. This is not a complete ISO/Google validity check.',ref('map',r.record));continue;}
    if(!byPage.has(r.page_url))byPage.set(r.page_url,new Map());const tags=byPage.get(r.page_url);
    if(!tags.has(r.lang))tags.set(r.lang,new Map());const slot=tags.get(r.lang);
    if(slot.has(r.alternate_url)){duplicates++;continue;}slot.set(r.alternate_url,r);valid.push(r);
  }
  const targets=new Map(),allTargets=new Map(),conflicted=new Set();
  for(const [page,tags] of byPage){const resolved=new Set(),all=new Set();for(const [lang,slot] of tags){for(const target of slot.keys())all.add(target);if(slot.size>1){conflicts++;conflicted.add(JSON.stringify([page,lang]));finding(findings,'error','conflicting_language_target',page,`${lang} points to several different destinations. This language slot is excluded from return/self-reference inference.`,[...slot.values()].map(r=>ref('map',r.record)).join('; '));}else resolved.add(slot.keys().next().value);}targets.set(page,resolved);allTargets.set(page,all);}
  for(const [page,set] of targets)if(!set.has(page)){if(allTargets.get(page).has(page))finding(findings,'warning','self_reference_unknown',page,'A self-reference appears only in a conflicting language slot; resolve that conflict before interpreting it.');else{missingSelf++;finding(findings,'warning','self_reference_not_found',page,'No self-reference was found among this page’s supplied alternates.');}}
  const rows=[];
  for(const r of valid) {
    let state='Return link present in supplied map';
    if(conflicted.has(JSON.stringify([r.page_url,r.lang]))){unknown++;state='UNKNOWN: conflicting language target';}
    else if(r.page_url===r.alternate_url)state='Self-reference';
    else if(!targets.has(r.alternate_url)){unknown++;state='UNKNOWN: destination map not supplied';}
    else if(!targets.get(r.alternate_url).has(r.page_url)&&allTargets.get(r.alternate_url).has(r.page_url)){unknown++;state='UNKNOWN: return link is in a conflicting language slot';}
    else if(!targets.get(r.alternate_url).has(r.page_url)){missingReturn++;state='Return link not found in supplied map';finding(findings,'warning','return_link_not_found',r.page_url,`Destination ${r.alternate_url} has no supplied return link to this page.`,ref('map',r.record));}
    rows.push([r.page_url,r.hreflang,r.alternate_url,state,r.record]);
  }
  return {summary:[['Pages supplied',byPage.size],['Alternate rows checked',rows.length],['Conflicting language targets',conflicts],['Missing self references',missingSelf],['Return links not found',missingReturn],['Unknown alternate checks',unknown],['Exact duplicates',duplicates]],findings,
    columns:['Page URL','Hreflang','Alternate URL','Supplied-map return link','Input record'],rows,scope:{iso_code_assignment:'NOT_CHECKED',google_support:'NOT_CHECKED',live_html:'UNKNOWN',coverage:'SUPPLIED_MAP_ONLY',conflicting_language_slots:'EXCLUDED_FROM_INFERENCE'},notes:TOOLS['hreflang-checker'].boundaries};
}

export function buildBrokenLinkTasks(inputs) {
  const findings=[], statuses=readCsv(inputs.statuses,'statuses',{url:['address','target','target_url'],status:['status_code','code'],observed_at:['crawl_date','date']},['url','status']);
  const inlinks=readCsv(inputs.inlinks,'inlinks',{source:['from','source_url'],target:['to','target_url','destination'],anchor:['anchor_text','link_text']},['source','target']);
  ignoredColumns(statuses,'statuses',findings);ignoredColumns(inlinks,'inlinks',findings);
  const sr=validRows(statuses,['url'],'statuses',findings), ir=validRows(inlinks,['source','target'],'inlinks',findings), byStatus=new Map();
  for(const r of sr){if(!byStatus.has(r.url))byStatus.set(r.url,[]);byStatus.get(r.url).push(r);}
  const resolved=new Map();
  for(const [url,rs] of byStatus) {
    const unique=new Set(rs.map(r=>r.status));if(unique.size!==1){resolved.set(url,{status:null,date:'UNKNOWN'});finding(findings,'warning','conflicting_statuses',url,'Conflicting supplied statuses; not classified as broken.',rs.map(r=>ref('statuses',r.record)).join('; '));continue;}
    const code=statusNumber(rs[0].status),dates=[...new Set(rs.map(r=>r.observed_at).filter(Boolean))];resolved.set(url,{status:code,date:dates.length===1?dates[0]:'UNKNOWN',record:rs[0].record});
  }
  const groups=new Map(), seen=new Set(), rows=[];let duplicates=0,unknown=0,unstable=0;
  for(const r of ir) {
    const key=JSON.stringify([r.source,r.target,r.anchor||'']);if(seen.has(key)){duplicates++;continue;}seen.add(key);
    const s=resolved.get(r.target),code=s?.status;
    if(code===404||code===410){if(!groups.has(r.target))groups.set(r.target,{status:code,links:[],sources:new Set(),date:s.date});const g=groups.get(r.target);g.links.push(r);g.sources.add(r.source);rows.push([r.source,r.target,r.anchor||'',code,s.date,r.record,s.record]);}
    else if(code>=500&&code<=599){unstable++;finding(findings,'warning','server_error_review',r.target,`Supplied ${code}: server error needs review; not a confirmed broken-link task.`,ref('inlinks',r.record));}
    else if(code===403||code===429||!code){unknown++;finding(findings,'info','status_unknown',r.target,`Status ${code||'not available'} does not establish a broken link.`,ref('inlinks',r.record));}
  }
  for(const [url,g] of groups)finding(findings,'repair','observed_broken_target',url,`Supplied ${g.status}; ${g.links.length} unique link row(s) from ${g.sources.size} supplied page(s). Review/remove/update those links, then recheck. Observation: ${g.date}.`,g.links.map(r=>ref('inlinks',r.record)).join('; '));
  return {summary:[['Broken targets in supplied data',groups.size],['Repairable link rows',rows.length],['Unknown link statuses',unknown],['Server-error links to review',unstable],['Exact duplicate inlinks',duplicates]],findings,
    columns:['Source page','Broken target','Anchor from export','Supplied status','Supplied observed_at','Inlinks record','Status record'],rows,scope:{classification:'supplied 404/410 only',live_status:'UNKNOWN',link_graph:'SUPPLIED_INLINKS_ONLY',observation_dates:'USER_SUPPLIED_UNVERIFIED'},notes:TOOLS['broken-link-task-builder'].boundaries};
}

export function compareCrawls(inputs,options={}) {
  const findings=[],schema={url:['address','page_url'],status:['status_code','code'],title:['title_1','page_title'],canonical:['canonical_link_element_1','canonical_url'],robots:['meta_robots_1','meta_robots','robots_directives'],h1:['h1_1'],description:['meta_description_1','meta_description'],link_count:['inlinks','unique_inlinks']};
  const before=readCsv(inputs.before,'before',schema,['url']),after=readCsv(inputs.after,'after',schema,['url']);ignoredColumns(before,'before',findings);ignoredColumns(after,'after',findings);
  const fields=before.fields.filter(f=>f!=='url'&&after.fields.includes(f));if(!fields.length)fail('The exports need at least one shared supported comparison column besides url.');
  function index(data,role) {
    const rs=validRows(data,['url'],role,findings),map=new Map(),bad=new Set();
    for(const r of rs){if(bad.has(r.url))continue;if(map.has(r.url)){const prior=map.get(r.url);if(fields.some(f=>prior[f]!==r[f])){bad.add(r.url);map.delete(r.url);finding(findings,'error','conflicting_duplicate_url',r.url,'Conflicting duplicate records excluded from comparison.',`${ref(role,prior.record)}; ${ref(role,r.record)}`);}}else map.set(r.url,r);}
    return {map,bad};
  }
  const b=index(before,'before'),a=index(after,'after'),all=new Set([...b.map.keys(),...a.map.keys()]),rows=[];let changedUrls=0,changes=0,onlyBefore=0,onlyAfter=0,matched=0;
  for(const url of [...all].sort()) {
    if(b.bad.has(url)||a.bad.has(url))continue;const old=b.map.get(url),now=a.map.get(url);
    if(!old||!now){const role=old?'before':'after';if(old)onlyBefore++;else onlyAfter++;const kind=old?'Only in before export':'Only in after export',detail=options.complete?'Same complete scope was declared by user; verify the intended URL change.':'Coverage unknown: this is not proof that a page was added or deleted.';rows.push([url,'URL coverage',old?'present':'not observed',now?'present':'not observed',kind,detail]);finding(findings,'info','one_export_only',url,`${kind}. ${detail}`,ref(role,(old||now).record));continue;}
    matched++;let changed=false;
    for(const field of fields)if(old[field]!==now[field]) {
      changed=true;changes++;let note='Observed value changed between supplied exports.';
      if(field==='status'&&(!statusNumber(old[field])||!statusNumber(now[field])))note='At least one supplied status is blank or invalid; live status remains unknown.';
      else if(field==='status'&&statusNumber(old[field])===200&&[404,410].includes(statusNumber(now[field])))note='Review: supplied 200 changed to supplied 404/410.';
      else if(field==='robots'&&!/(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(old[field])&&/(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(now[field]))note='Review: a noindex/none token appears in the after export.';
      rows.push([url,field,old[field],now[field],'Changed supplied field',note]);
      finding(findings,note.startsWith('Review:')?'warning':'info','field_changed',url,`${field}: ${note}`,`${ref('before',old.record)}; ${ref('after',now.record)}`);
    }
    if(changed)changedUrls++;
  }
  return {summary:[['Matched URLs compared',matched],['URLs with field changes',changedUrls],['Changed fields',changes],['Only in before export',onlyBefore],['Only in after export',onlyAfter],['Conflicting URLs excluded',new Set([...b.bad,...a.bad]).size]],findings,
    columns:['URL','Field','Before observation','After observation','Finding','Review note'],rows,scope:{fields_compared:fields,coverage:options.complete?'USER_DECLARED_COMPLETE_SAME_SCOPE':'UNKNOWN',url_identity:'exact trimmed string',live_status:'UNKNOWN',ranking_or_traffic_cause:'NOT_INFERRED'},notes:TOOLS['seo-crawl-comparison'].boundaries};
}

export const ANALYZERS={'serp-snippet-audit':(i,o)=>auditMetadata(i,o,{readCsv,urlValue,tableCsv}),'internal-link-anchor-auditor':(i,o)=>auditInternalLinks(i,o,{readCsv,urlValue}),'gsc-period-diff-analyzer':(i,o)=>compareGscPeriods(i,o,{readCsv}),'robots-txt-tester':testRobots,'redirect-map-checker':checkRedirectMap,'hreflang-checker':checkHreflang,'broken-link-task-builder':buildBrokenLinkTasks,'seo-crawl-comparison':compareCrawls,'indexing-signal-reconciler':(i,o)=>reconcileIndexing(i,o,{readCsv,urlValue}),'redirect-rule-compiler':(i,o)=>compileRedirects(i,o,{readCsv,urlValue})};
export function tableCsv(columns,rows) {return [columns,...rows].map(row=>row.map(v=>csvCell(String(v??''))).join(',')).join('\r\n')+'\r\n';}
export function runTool(id,inputs,options={},metadata=[],observedAt=new Date().toISOString()) {
  const def=TOOLS[id];if(!def||!ANALYZERS[id])fail('Unknown tool.');let total=0;
  for(const field of def.inputs){const text=inputs[field.role]??'';if(typeof text!=='string'||(field.required&&!text.trim()))fail(`${field.label}: choose a file or paste content.`);const size=bytes(text);if(size>LIMITS.fileBytes)fail(`${field.label}: maximum 2 MiB.`);total+=size;}
  if(total>LIMITS.totalBytes)fail('Combined inputs exceed 4 MiB.');
  const result=ANALYZERS[id](inputs,options);
  const manifest={schema:'base2026.free-tools-input-manifest/1',ruleset:`base2026.${id}/1.0.0`,observed_at:observedAt,scope:result.scope,input_observations:metadata,limits:LIMITS,
    counts:{...Object.fromEntries(result.summary),findings:result.findings.length,result_rows:result.rows.length},privacy:{storage:false,telemetry:false,target_fetch:false,upload:false,retention:'tab memory until cleared, page navigation or closed'},limitations:result.notes};
  const findingsRows=result.findings.map(f=>[f.severity,f.rule,f.subject,f.detail,f.source]);
  const report=[`# ${def.name}`,'',`Processed at: ${observedAt}`,'',...result.summary.map(([k,v])=>`- ${k}: ${v}`),'','## Scope','',...result.notes.map(s=>`- ${s}`),'','## Findings','',...(result.findings.length?result.findings.map(f=>`- [${f.severity}] ${oneLine(f.rule)} — ${oneLine(f.subject)}: ${oneLine(f.detail)}${f.source?' ('+oneLine(f.source)+')':''}`):['No findings in the supplied data. This does not establish live correctness.']),'','Full observed rows are in the results CSV; input hashes and scope are in the manifest.'].join('\n')+'\n';
  const exports=[{name:`${id}-results.csv`,label:'Results CSV',mime:'text/csv;charset=utf-8',text:tableCsv(result.columns,result.rows)},
    {name:`${id}-findings.csv`,label:'Findings CSV',mime:'text/csv;charset=utf-8',text:tableCsv(['Severity','Rule','Subject','Detail',def.findingSourceLabel||'Source record'],findingsRows)},
    {name:`${id}-report.md`,label:'Readable report',mime:'text/markdown;charset=utf-8',text:report},
    {name:`${id}-manifest.json`,label:'Input manifest',mime:'application/json;charset=utf-8',text:JSON.stringify(manifest,null,2)+'\n'}];
  return {...result,manifest,exports:[...exports,...(result.extraExports||[])]};
}

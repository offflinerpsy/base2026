import {TOOLS,LIMITS} from './tools.mjs';
import {expectedRows,xmlRows,csvRows} from './sitemap-core.mjs';
const clean=v=>String(v??'').trim();
const note=(findings,severity,rule,subject,detail,source='')=>findings.push({severity,rule,subject,detail,source});
const number=v=>/^\d{3}$/.test(v)&&+v>=100&&+v<=599?+v:null;
const crawlSchema={url:['address','page_url'],status:['status_code','http_status','status code'],robots:['meta_robots','meta robots 1','x_robots_tag'],canonical:['declared_canonical','canonical link element 1']};
const gscSchema={url:[],gsc_status:[],google_canonical:[],last_crawl:[]};
function indexRows(parsed,role,findings,urlValue) {
  const map=new Map(),conflicts=new Set(),urls=new Set();
  if(parsed.ignored.length)note(findings,'info','IGNORED_COLUMNS',role,`Unsupported columns: ${parsed.ignored.join(', ')}.`);
  for(const row of parsed.rows){const u=urlValue(row.url);if(u.error){note(findings,'error','INVALID_URL',row.url||'(empty)',u.error,`${role} record ${row.record}`);continue;}
    urls.add(row.url);const prior=map.get(row.url);
    if(prior&&parsed.fields.some(k=>k!=='url'&&prior[k]!==row[k]))conflicts.add(row.url);
    else if(prior)note(findings,'info','DUPLICATE_ROW_COLLAPSED',row.url,'Identical supplied row collapsed.',`${role} record ${row.record}`);
    else map.set(row.url,row);
  }
  for(const url of conflicts){map.delete(url);note(findings,'warning',`CONFLICTING_${role.toUpperCase()}_ROW`,url,'Conflicting observations excluded from inference. No first row was selected.');}
  return {map,conflicts,urls};
}
function robots(value) {
  if(!value)return {noindex:'UNKNOWN',state:'MISSING',nofollow:'UNKNOWN'};
  // Scope selection is outside this MVP. A scoped directive must not become
  // a generic noindex, even when its token is separated by whitespace.
  const parameters=new Set(['max-snippet','max-image-preview','max-video-preview','unavailable_after']);
  const scopes=[...value.matchAll(/(?:\b([a-z][a-z0-9_-]*)|(\*))\s*:/gi)].map(m=>(m[1]||m[2]).toLowerCase()).filter(name=>!parameters.has(name));
  if(scopes.length)return {noindex:'UNKNOWN',nofollow:'UNKNOWN',state:'SCOPED_UNSUPPORTED',scopes};
  const tokens=value.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const known=new Set(['index','follow','noindex','nofollow','none','all','noarchive','nosnippet','noimageindex','notranslate']);
  const unknown=tokens.filter(t=>!known.has(t));
  const no=tokens.includes('none')||tokens.includes('noindex');
  return {noindex:no?true:!unknown.length&&(tokens.includes('index')||tokens.includes('all'))?false:'UNKNOWN',
    nofollow:tokens.includes('none')||tokens.includes('nofollow'),state:unknown.length?'UNRECOGNIZED_TOKENS':'OBSERVED',unknown};
}
function crawlSignal(url,index,urlValue) {
  if(index.conflicts.has(url))return {evidence:'CONFLICT',status:'UNKNOWN',noindex:'UNKNOWN',canonical:'UNKNOWN',relation:'UNKNOWN',robotsState:'CONFLICT',nofollow:'UNKNOWN'};
  const row=index.map.get(url);
  if(!row)return {evidence:'MISSING',status:'UNKNOWN',noindex:'UNKNOWN',canonical:'UNKNOWN',relation:'UNKNOWN',robotsState:'MISSING',nofollow:'UNKNOWN'};
  const robot=robots(row.robots),canonical=row.canonical||'';
  return {evidence:'OBSERVED',status:number(row.status||'')??'UNKNOWN',rawStatus:row.status||'',noindex:robot.noindex,robotsState:robot.state,unknownTokens:robot.unknown,robotScopes:robot.scopes,rawRobots:row.robots||'',nofollow:robot.nofollow,
    canonical:canonical||'MISSING',relation:!canonical?'MISSING':urlValue(canonical).error?'UNKNOWN':canonical===url?'SELF':'OTHER',record:row.record};
}
export function reconcileIndexing(inputs,_options,{readCsv,urlValue}) {
  const findings=[],crawl=readCsv(inputs.crawl,'crawl',crawlSchema,['url']);
  if(!crawl.fields.some(k=>['status','robots','canonical'].includes(k)))throw Error('crawl: supply at least one of status, robots or canonical.');
  const ci=indexRows(crawl,'crawl',findings,urlValue),sitemapText=clean(inputs.sitemap),gscText=clean(inputs.gsc),sitemap=new Set();
  if(sitemapText){
    // A valid TXT URL may itself contain commas. Inspect a CSV header only
    // when the first line is not an absolute URL, then accept url/loc anywhere.
    const firstLine=sitemapText.split(/\r\n|\n|\r/,1)[0];
    const csvHeader=!sitemapText.startsWith('<')&&urlValue(firstLine).error?(csvRows(sitemapText)[0]||[]).map(v=>clean(v).toLowerCase()):[];
    const parsed=sitemapText.startsWith('<')?xmlRows(sitemapText):expectedRows(sitemapText,csvHeader.some(v=>v==='url'||v==='loc')?'csv':'txt');
    for(const row of parsed.rows){const u=urlValue(row.url);if(u.error)note(findings,'error','INVALID_SITEMAP_URL',row.url,u.error,`sitemap record ${row.row}`);else sitemap.add(row.url);}}
  const gi=gscText?indexRows(readCsv(inputs.gsc,'gsc',gscSchema,['url']),'gsc',findings,urlValue):{map:new Map(),conflicts:new Set(),urls:new Set()};
  const urls=[...new Set([...ci.urls,...sitemap,...gi.urls])].sort();if(urls.length>LIMITS.records)throw Error('Combined URL scope exceeds 5,000 unique URLs.');
  const signals=new Map(urls.map(url=>[url,crawlSignal(url,ci,urlValue)]));
  const rows=[];let aligned=0,sitemapConflicts=0,splits=0,cleanUnindexed=0,unknown=0;
  for(const url of urls){const s=signals.get(url),g=gi.map.get(url),gs=gi.conflicts.has(url)?'UNKNOWN_CONFLICT':g?.gsc_status||'UNKNOWN';
    const google=gi.conflicts.has(url)?'UNKNOWN_CONFLICT':g?.google_canonical||'UNKNOWN';
    const googleState=gi.conflicts.has(url)?'UNKNOWN_CONFLICT':!g?.google_canonical?'UNKNOWN_MISSING':urlValue(g.google_canonical).error?'UNKNOWN_INVALID':'OBSERVED_VALID';
    const inside=sitemapText?sitemap.has(url):'UNKNOWN_NOT_SUPPLIED';
    const applicable=[];const add=(rule,severity,detail)=>{applicable.push(rule);note(findings,severity,rule,url,detail);};
    if(s.evidence==='CONFLICT')applicable.push('CONFLICTING_CRAWL_ROW');
    if(s.evidence==='MISSING')add('CRAWL_ROW_MISSING','info','This URL has no supplied crawl observation.');
    if(inside===true&&s.evidence==='MISSING')add('SITEMAP_URL_MISSING_FROM_CRAWL','info','The supplied sitemap lists this URL, but its crawl signals are missing.');
    if(s.rawStatus&&s.status==='UNKNOWN')add('INVALID_HTTP_STATUS','warning','The supplied status is not a numeric HTTP code from 100 to 599; it is not non-200 evidence.');
    if(s.status==='UNKNOWN')add('CRAWL_STATUS_UNKNOWN','info','No unambiguous valid HTTP status is available.');
    if(s.robotsState==='UNRECOGNIZED_TOKENS')add('ROBOTS_TOKENS_UNKNOWN','info',`Unrecognized supplied tokens: ${s.unknownTokens.join(', ')}. An index signal is not inferred from them.`);
    if(s.robotsState==='SCOPED_UNSUPPORTED')add('ROBOTS_SCOPE_UNSUPPORTED','info',`Crawler-scoped applicability is unsupported (${s.robotScopes.join(', ')}). Raw directives are retained; a generic noindex signal is not inferred.`);
    if(s.noindex==='UNKNOWN')add('ROBOTS_SIGNAL_UNKNOWN','info','An explicit unambiguous index/noindex observation is missing.');
    if(s.relation==='MISSING'||s.relation==='UNKNOWN')add('CANONICAL_SIGNAL_UNKNOWN','info','The supplied canonical is missing, invalid or conflicting.');
    if(inside===true&&s.noindex===true)add('SITEMAP_NOINDEX_CONFLICT','warning','The supplied sitemap includes a URL with a supplied noindex/none directive.');
    if(inside===true&&s.status!=='UNKNOWN'&&s.status!==200)add('SITEMAP_NON_200','warning',`The supplied sitemap includes an observed HTTP ${s.status} URL.`);
    if(inside===true&&s.relation==='OTHER')add('SITEMAP_NON_SELF_CANONICAL','warning','The sitemap URL declares another supplied canonical URL.');
    let target='NOT_APPLICABLE';
    if(s.relation==='OTHER'){const t=signals.get(s.canonical);
      if(!ci.urls.has(s.canonical)){target='UNKNOWN_OUTSIDE_CRAWL';add('CANONICAL_TARGET_OUTSIDE_CRAWL_UNKNOWN','info','The canonical target has no supplied crawl row.');}
      else if(ci.conflicts.has(s.canonical)){target='UNKNOWN_CONFLICT';add('CANONICAL_TARGET_SIGNAL_UNKNOWN','info','The canonical target has conflicting crawl rows; no target status is selected.');}
      else if(t.status!=='UNKNOWN'&&t.status!==200||t.noindex===true||t.relation==='OTHER'){target='SUPPLIED_ADVERSE_SIGNAL';add('CANONICAL_TARGET_ADVERSE_SIGNAL','warning','The target has a supplied non-200, noindex/none or non-self canonical signal. Live behavior remains unknown.');}
      else if(t.status==='UNKNOWN'||t.noindex==='UNKNOWN'||t.relation!=='SELF'){target='UNKNOWN_MISSING_SIGNAL';add('CANONICAL_TARGET_SIGNAL_UNKNOWN','info','The target is present but lacks complete unambiguous status, robots or canonical evidence.');}
      else target='SUPPLIED_SIGNALS_ALIGNED';
    }
    if(googleState==='UNKNOWN_INVALID')add('INVALID_GOOGLE_CANONICAL','warning','The supplied Google canonical is not a supported HTTP(S) URL.');
    if(gi.conflicts.has(url))applicable.push('CONFLICTING_GSC_ROW');
    if(s.relation!=='UNKNOWN'&&s.relation!=='MISSING'&&googleState==='OBSERVED_VALID'&&s.canonical!==g.google_canonical){splits++;add('USER_GOOGLE_CANONICAL_SPLIT','warning','Declared and Google-selected canonical observations differ in the supplied files.');}
    const cleanSignals=s.status===200&&s.noindex===false&&s.relation==='SELF';
    if(cleanSignals&&/\bnot indexed\b/i.test(gs)){cleanUnindexed++;add('GSC_NOT_INDEXED_CLEAN_SIGNALS','warning','The supplied Search Console status says not indexed despite these supplied technical signals. This tool does not infer the reason.');}
    if(cleanSignals&&inside===false)add('ALIGNED_SIGNALS_OMITTED_FROM_SITEMAP','info','The supplied crawl signals align, but this URL is absent from the supplied sitemap scope.');
    if(s.noindex===true)add('SUPPLIED_NOINDEX','info','The crawl contains a noindex or none token. This does not verify a live page response.');
    if(cleanSignals&&inside===true&&!applicable.length){aligned++;applicable.push('ALIGNED_SUPPLIED_SIGNALS');}
    if(!applicable.length)applicable.push('SUPPLIED_SIGNALS_REVIEW');
    if(applicable.some(k=>k.startsWith('SITEMAP_')))sitemapConflicts++;
    if(s.evidence!=='OBSERVED'||s.status==='UNKNOWN'||s.noindex==='UNKNOWN'||['UNKNOWN','MISSING'].includes(s.relation)||String(target).startsWith('UNKNOWN')||inside==='UNKNOWN_NOT_SUPPLIED'||gs.startsWith('UNKNOWN')||googleState!=='OBSERVED_VALID')unknown++;
    const precedence=['CONFLICTING_CRAWL_ROW','CONFLICTING_GSC_ROW','SITEMAP_NOINDEX_CONFLICT','SITEMAP_NON_200','SITEMAP_NON_SELF_CANONICAL','CANONICAL_TARGET_ADVERSE_SIGNAL','USER_GOOGLE_CANONICAL_SPLIT','GSC_NOT_INDEXED_CLEAN_SIGNALS','CANONICAL_TARGET_SIGNAL_UNKNOWN','CANONICAL_TARGET_OUTSIDE_CRAWL_UNKNOWN'];
    const primary=precedence.find(k=>applicable.includes(k))||applicable[0];
    rows.push([url,inside,s.evidence,s.status,s.noindex,s.canonical,s.relation,target,gs,google,g?.last_crawl||'UNKNOWN',googleState,s.rawRobots??(s.evidence==='CONFLICT'?'UNKNOWN_CONFLICT':'UNKNOWN_MISSING'),primary]);
  }
  return {summary:[['URLs reconciled',rows.length],['Aligned supplied signals',aligned],['Sitemap conflicts',sitemapConflicts],['Canonical splits',splits],['Supplied not-indexed with clean signals',cleanUnindexed],['URLs with unknown evidence',unknown]],findings,
    columns:['URL','In supplied sitemap','Crawl evidence','Supplied HTTP status','Supplied noindex signal','Declared canonical','Canonical relation','Canonical target evidence','Supplied GSC status','Supplied Google canonical','Supplied last crawl','Google canonical evidence','Supplied robots text','Primary finding'],rows,
    scope:{source:'supplied files only',sitemap_supplied:!!sitemapText,gsc_supplied:!!gscText,gsc_contract:'user-prepared url,gsc_status,google_canonical,last_crawl; no automatic native export support',url_identity:'exact trimmed string',primary_finding:'deterministic review order; all applicable findings exported',site_coverage:'UNKNOWN',live_indexability:'UNKNOWN',google_indexing:'NOT_VERIFIED',ranking_effect:'NOT_INFERRED'},notes:TOOLS['indexing-signal-reconciler'].boundaries};
}

// Strict exact-path compiler. Parsing examines raw strings before URL can normalize them.
function endpoint(raw) {
  if(!raw||raw.length>4096||/[^\x21-\x7e]|[\\<>"'`{}|^\[\]]/.test(raw))return {error:'UNSAFE_PATH_OR_CONTROL_CHARS'};
  if(raw.includes('*')||/(?:^|\/)[:]/.test(raw.replace(/^https?:\/\//,'')))return {error:'UNSUPPORTED_WILDCARD_OR_PLACEHOLDER'};
  if(raw.includes('?'))return {error:'UNSUPPORTED_QUERY'};
  if(raw.includes('#'))return {error:'UNSAFE_FRAGMENT'};
  let origin=null,path=raw;
  if(/^https?:\/\//.test(raw)){
    const match=raw.match(/^https?:\/\/[^/?#]+(\/[^?#]*)?$/);if(!match)return {error:'INVALID_HTTP_URL'};
    try{const u=new URL(raw);if(u.username||u.password)return {error:'CREDENTIALS_FORBIDDEN'};origin=u.origin;path=match[1]||'/';}catch{return {error:'INVALID_HTTP_URL'};}
  }else if(!raw.startsWith('/')||raw.startsWith('//'))return {error:'ROOT_RELATIVE_PATH_REQUIRED'};
  if(path.includes('//')||path.includes(':')||path.split('/').some(s=>s==='.'||s==='..'))return {error:'AMBIGUOUS_PATH'};
  if(/%(?![0-9a-f]{2})/i.test(path))return {error:'INVALID_PERCENT_ESCAPE'};
  for(const match of path.matchAll(/%([0-9a-f]{2})/gi)){const n=parseInt(match[1],16),c=String.fromCharCode(n);if(n<128&&!/[a-z0-9_~-]/i.test(c))return {error:'AMBIGUOUS_ENCODED_PATH'};}
  try{if(/[\s\u0000-\u001f\u007f-\u009f]/u.test(decodeURIComponent(path)))return {error:'AMBIGUOUS_ENCODED_PATH'};}catch{return {error:'INVALID_PERCENT_UTF8'};}
  return {origin,path,raw};
}
function originOf(raw){try{if(/^https?:\/\//.test(raw)){const u=new URL(raw);return u.origin;}}catch{}return null;}
function sourceHint(raw){const e=endpoint(clean(raw).split(/[?#]/,1)[0]);return e.error?null:e.path;}
export function compileRedirects(inputs,options,{readCsv}) {
  if(options.target_platform&&options.target_platform!=='cloudflare_redirects_exact_mvp')throw Error('Only Cloudflare static assets exact-path _redirects drafts are supported.');
  const fallback=clean(options.default_status||'301');if(!['301','302','307','308'].includes(fallback))throw Error('Default status must be 301, 302, 307 or 308.');
  if(options.flatten_chains!==undefined&&typeof options.flatten_chains!=='boolean')throw Error('Flatten chains must be a boolean.');
  const parsed=readCsv(inputs.map,'map',{from:[],to:[],status:[]},['from','to'],{preserveValues:true});
  if(parsed.rows.length>2000)throw Error('map: maximum 2,000 redirect mappings.');
  const findings=[],origins=new Set(parsed.rows.map(r=>originOf(r.from)).filter(Boolean)),mixed=origins.size>1,origin=origins.size===1?[...origins][0]:null;
  const entries=[],tainted=new Set(),groups=new Map();let duplicates=0,flattened=0;
  for(const r of parsed.rows){const from=endpoint(r.from),to=endpoint(r.to),status=clean(r.status)||fallback;
    const issues=[];if(mixed)issues.push('MIXED_SOURCE_ORIGINS');if(from.error)issues.push('SOURCE_'+from.error);if(to.error)issues.push('TARGET_'+to.error);
    if(!['301','302','307','308'].includes(status))issues.push('UNSUPPORTED_REDIRECT_STATUS');
    const target=!to.error?(to.origin&&to.origin!==origin?to.raw:to.path):null;
    if(!from.error&&!to.error&&`${from.path} ${target} ${status}`.length>1000)issues.push('DRAFT_LINE_TOO_LONG');
    const e={r,from,to,target,status,issues,rule:issues[0]||'',compiled:null,order:''};entries.push(e);
    if(issues.length){const hint=!from.error?from.path:sourceHint(r.from);if(hint)tainted.add(hint);
      for(const issue of issues)note(findings,'warning',issue,r.from,`Row excluded from the draft: ${issue}. No server rule was emitted.`,`map record ${r.record}`);continue;}
    if(!groups.has(from.path))groups.set(from.path,[]);groups.get(from.path).push(e);
  }
  const graph=new Map();
  for(const [source,es]of groups){const distinct=new Set(es.map(e=>JSON.stringify([e.target,e.status])));
    if(distinct.size>1){tainted.add(source);for(const e of es)e.rule='CONFLICTING_SOURCE_MAPPING';note(findings,'warning','CONFLICTING_SOURCE_MAPPING',source,'All conflicting targets or statuses for this source are excluded.');continue;}
    graph.set(source,es[0]);for(const e of es.slice(1)){e.rule='DUPLICATE_ROW_COLLAPSED';duplicates++;note(findings,'info','DUPLICATE_ROW_COLLAPSED',source,'Identical mapping collapsed.',`map record ${e.r.record}`);}
  }
  for(const source of tainted)if(graph.has(source)){graph.get(source).rule='SOURCE_HAS_EXCLUDED_ROW';note(findings,'warning','SOURCE_HAS_EXCLUDED_ROW',source,'Another row for this source was excluded; all mappings for the source are withheld.');graph.delete(source);}
  const emitted=[];
  for(const [source,e]of graph){const seen=new Set(),chain=[];let at=source,blocked='';
    while(graph.has(at)){if(seen.has(at)){blocked='REDIRECT_LOOP';break;}seen.add(at);const edge=graph.get(at);chain.push(edge);at=edge.target;if(tainted.has(at)){blocked='DOWNSTREAM_EXCLUDED_TARGET';break;}}
    if(blocked){e.rule=blocked;note(findings,'warning',blocked,source,'This path reaches a cycle or an excluded mapping. No terminal destination is invented.');continue;}
    e.compiled=e.target;e.rule='COMPILED_EXACT';
    if(chain.length>1){if(options.flatten_chains===true&&new Set(chain.map(x=>x.status)).size===1){const destination=chain.at(-1).target;
        if(`${source} ${destination} ${e.status}`.length<=1000){e.compiled=destination;e.rule='COMPILED_FLATTENED';flattened++;note(findings,'info','CHAIN_FLATTENED_FOR_DRAFT',source,`${chain.length} supplied hops with identical ${e.status} status; runtime destination remains unverified.`);}
        else note(findings,'info','FLATTENED_LINE_LIMIT_RETAINED',source,'Original hop retained because the flattened draft line would exceed the local line cap.');
      }else note(findings,'info',options.flatten_chains===true?'MIXED_STATUS_CHAIN_NOT_FLATTENED':'CHAIN_RETAINED',source,'Original hop and status retained. Temporary and permanent redirects are not silently combined.');}
    emitted.push(e);
  }
  emitted.sort((a,b)=>a.from.path<b.from.path?-1:a.from.path>b.from.path?1:0);emitted.forEach((e,i)=>e.order=i+1);
  const text=emitted.map(e=>`${e.from.path} ${e.compiled} ${e.status}`).join('\n')+(emitted.length?'\n':'');
  note(findings,'info','STAGING_TEST_REQUIRED','Draft configuration','Test deployment host, asset/Worker precedence, incoming queries, URL normalization and every intended status/location in staging before use.');
  return {summary:[['Input mappings',entries.length],['Draft rules',emitted.length],['Flattened chains',flattened],['Excluded mappings',entries.filter(e=>!e.compiled&&e.rule!=='DUPLICATE_ROW_COLLAPSED').length],['Collapsed duplicates',duplicates]],findings,
    columns:['Source input','Exact source path','Original target','Draft target','Status','Compilation result','Emitted order','Source record'],
    rows:entries.map(e=>[e.r.from,e.from.path||'',e.r.to,e.compiled||'',e.status,e.rule,e.order,e.r.record]),
    scope:{format:'Cloudflare static assets _redirects exact paths',artifact_state:'DRAFT_REQUIRES_STAGING_TEST',source_origin:origin||'UNSPECIFIED',mixed_source_origins:origins.size>1?[...origins].sort():[],deployment_host:'NOT_VERIFIED',source_query_policy:'excluded',target_query_policy:'excluded',incoming_query_behavior:'REQUIRES_STAGING_TEST',flatten_chains:options.flatten_chains===true,flatten_policy:'identical status codes only; original status retained',url_identity:'raw exact path; no trim or URL path normalization',limits:{mappings:2000,line_characters:1000,url_characters:4096},live_http:'UNKNOWN'},
    extraExports:[{name:'_redirects',label:'Draft _redirects',mime:'text/plain;charset=utf-8',text}],notes:TOOLS['redirect-rule-compiler'].boundaries};
}

/** Linear/grouped analyses of bounded supplied exports. All text is inert. */
import {csvRows,csvCell} from './sitemap-core.mjs';
import {BATCH3_TOOLS} from './batch3-tools.mjs';
const trim=v=>String(v??'').trim();
const note=(a,rule,subject,detail,source='',severity='review')=>a.push({severity,rule,subject,detail,source});
const csv=(columns,rows)=>[columns,...rows].map(r=>r.map(v=>csvCell(String(v??''))).join(',')).join('\r\n')+'\r\n';
const file=(name,label,columns,rows)=>({name,label,mime:'text/csv;charset=utf-8',text:csv(columns,rows)});
const normalizedAnchor=v=>trim(v).normalize('NFC').toLowerCase().replace(/\s+/gu,' ');
const generic=new Set(['click here','read more','learn more','here','read the related guide']);
const bool=(raw,follow=false)=>{const v=trim(raw).toLowerCase();return ['true','1','yes',...(follow?['follow']:[])].includes(v)?true:['false','0','no',...(follow?['nofollow']:[])].includes(v)?false:null;};
const status=v=>/^\d{3}$/.test(v)&&+v>=100&&+v<=599?+v:null;
function originOption(raw) {
  const v=trim(raw);let u;
  try{u=new URL(v);}catch{throw Error('site_origin is required: enter an HTTP(S) origin without a path, query, fragment or credentials.');}
  // A single trailing slash is deliberately rejected, even though URL.origin would hide it.
  if(!/^https?:\/\/[^/?#\s]+$/i.test(v)||u.username||u.password||!['http:','https:'].includes(u.protocol))throw Error('site_origin must be an HTTP(S) origin only, without a path, query, fragment or credentials.');
  return u.origin;
}
function ignored(p,role,fs){if(p.ignored.length)note(fs,'IGNORED_COLUMNS',role,`Unsupported columns were not interpreted: ${p.ignored.join(', ')}`,'','info');}
function signatureRows(text){return csvRows(text,5001);}
export function auditInternalLinks(inputs,options,{readCsv,urlValue}) {
  const origin=originOption(options.site_origin),findings=[],details=[],groups=new Map(),anchorTargets=new Map(),anchorRows=[];
  const inlinks=readCsv(inputs.inlinks,'inlinks',{source:['source_url','from'],target:['target_url','to'],anchor:['anchor_text'],follow:[]},['source','target','anchor','follow'],{preserveValues:true});ignored(inlinks,'inlinks',findings);
  const original=signatureRows(inputs.inlinks),seen=new Map();let excluded=0,duplicates=0,included=0,unknownFollow=0;
  function urlIssue(v){const u=urlValue(v);return v.includes('#')||u.error?'INVALID_OR_UNSUPPORTED_URL':u.parsed.origin!==origin?'FOREIGN_ORIGIN':null;}
  function target(url){if(!groups.has(url))groups.set(url,{url,count:0,sources:new Set(),followed:0,nofollow:0,unknown:0,anchors:new Map()});return groups.get(url);}
  for(const row of inlinks.rows){
    const source=trim(row.source),url=trim(row.target),anchor=String(row.anchor),follow=bool(row.follow,true),issues=[];
    for(const [name,v] of [['source',source],['target',url]]){const reason=urlIssue(v);if(reason)issues.push(name+':'+reason);}
    const sig=JSON.stringify(original[row.record-1]),duplicate=seen.has(sig);if(duplicate){duplicates++;note(findings,'EXACT_DUPLICATE_LINK_OCCURRENCE',url,'Exact duplicate row retained as another occurrence.',`inlinks record ${row.record}; first ${seen.get(sig)}`,'info');}else seen.set(sig,row.record);
    if(issues.length){excluded++;note(findings,'EXCLUDED_LINK_ROW',url,issues.join('; '),`inlinks record ${row.record}`);details.push(['inlinks',row.record,source,url,anchor,row.follow,'EXCLUDED',issues.join('; '),duplicate,'','']);continue;}
    included++;const t=target(url);t.count++;t.sources.add(source);if(follow===true)t.followed++;else if(follow===false)t.nofollow++;else{t.unknown++;unknownFollow++;note(findings,'FOLLOW_UNKNOWN',url,'Missing or unrecognized follow value; this occurrence is not counted as known followed or known nofollow.',`inlinks record ${row.record}`);}
    const a=normalizedAnchor(anchor);if(!t.anchors.has(a))t.anchors.set(a,{count:0,sources:new Set(),followed:0,nofollow:0,unknown:0});const g=t.anchors.get(a);g.count++;g.sources.add(source);g[follow===true?'followed':follow===false?'nofollow':'unknown']++;
    if(a){if(!anchorTargets.has(a))anchorTargets.set(a,new Set());anchorTargets.get(a).add(url);}
    if(!a)note(findings,'EMPTY_ANCHOR_REVIEW',url,'The supplied anchor is empty; surrounding link context is unknown.',`inlinks record ${row.record}`);
    else if(generic.has(a))note(findings,'GENERIC_ANCHOR_REVIEW',url,`The normalized anchor “${a}” matches a documented generic example. Review the surrounding context; no ranking fault is inferred.`,`inlinks record ${row.record}`);
    details.push(['inlinks',row.record,source,url,anchor,row.follow,'INCLUDED',follow===null?'FOLLOW_UNKNOWN':'KNOWN_FOLLOW_VALUE',duplicate,'','']);
  }
  const inventory=new Map(),conflicts=new Set();let invalidInventory=0;
  const hasInventory=!!trim(inputs.inventory);
  if(hasInventory){const inv=readCsv(inputs.inventory,'inventory',{url:['address'],status:['status_code'],indexable:[]},['url','status','indexable'],{preserveValues:true});ignored(inv,'inventory',findings);
    for(const r of inv.rows){const url=trim(r.url),issue=urlIssue(url);if(issue){invalidInventory++;note(findings,'EXCLUDED_INVENTORY_ROW',url,issue,`inventory record ${r.record}`);details.push(['inventory',r.record,'',url,'','','EXCLUDED',issue,false,r.status,r.indexable]);continue;}
      target(url);const old=inventory.get(url),sig=JSON.stringify([status(trim(r.status))??('UNKNOWN:'+trim(r.status)),bool(r.indexable)??('UNKNOWN:'+trim(r.indexable).toLowerCase())]);
      if(old&&old.signature!==sig){conflicts.add(url);note(findings,'CONFLICTING_INVENTORY_ROWS',url,'Status/indexable observations conflict; both fields remain UNKNOWN.',`inventory records ${old.record}, ${r.record}`);}
      if(!old)inventory.set(url,{signature:sig,status:status(trim(r.status)),indexable:bool(r.indexable),record:r.record,rawStatus:r.status,rawIndexable:r.indexable});
      const invalid=[];if(status(trim(r.status))===null)invalid.push(trim(r.status)?'INVALID_STATUS':'MISSING_STATUS');if(bool(r.indexable)===null)invalid.push(trim(r.indexable)?'INVALID_INDEXABLE':'MISSING_INDEXABLE');
      if(invalid.length)note(findings,'INVENTORY_SIGNAL_UNKNOWN',url,invalid.join('; '),`inventory record ${r.record}`);
      details.push(['inventory',r.record,'',url,'','','INCLUDED',conflicts.has(url)?'UNKNOWN_CONFLICT':invalid.join('; ')||'SUPPLIED_SIGNALS',false,r.status,r.indexable]);
    }
  }
  // Reflect final group conflicts on every inventory detail, including earlier rows.
  for(const d of details)if(d[0]==='inventory'&&d[6]==='INCLUDED'&&conflicts.has(d[3]))d[7]='UNKNOWN_CONFLICT';
  let noObserved=0,shared=0;for(const [a,urls]of anchorTargets)if(urls.size>1){shared++;note(findings,'SHARED_ANCHOR_TARGETS_REVIEW',a,`The same normalized text points to ${urls.size} supplied targets. This is an anchor distribution review, not cannibalization or a ranking fault.`,[...urls].sort().join('; '));}
  const rows=[];for(const [url,t]of [...groups].sort(([a],[b])=>a.localeCompare(b))){const inv=inventory.get(url),conflict=conflicts.has(url),inventoryState=!hasInventory?'UNKNOWN_NOT_SUPPLIED':!inv?'NOT_IN_SUPPLIED_INVENTORY':conflict?'UNKNOWN_CONFLICT':'SUPPLIED_ROW';
    if(inv&&t.count===0){noObserved++;note(findings,'NO_INLINKS_IN_SUPPLIED_EXPORT',url,'No included link occurrence points to this inventory URL. Export coverage is not verified; an actual orphan page is not established.');}
    rows.push([url,t.count,t.sources.size,t.followed,t.nofollow,t.unknown,inventoryState,conflict?'UNKNOWN_CONFLICT':inv?inv.status??(trim(inv.rawStatus)?'UNKNOWN_INVALID':'UNKNOWN_MISSING'):'UNKNOWN',conflict?'UNKNOWN_CONFLICT':inv?inv.indexable??(trim(inv.rawIndexable)?'UNKNOWN_INVALID':'UNKNOWN_MISSING'):'UNKNOWN',t.anchors.size]);
    for(const [anchor,g]of [...t.anchors].sort(([a],[b])=>a.localeCompare(b)))anchorRows.push([url,anchor,g.count,g.sources.size,g.followed,g.nofollow,g.unknown,anchor?anchorTargets.get(anchor)?.size||0:0,generic.has(anchor)]);
  }
  return {summary:[['Internal link occurrences',included],['Targets in supplied scope',rows.length],['Excluded link rows',excluded],['Exact duplicate occurrences',duplicates],['Unknown follow occurrences',unknownFollow],['Inventory URLs with no observed links',noObserved]],findings,columns:['Target URL','Link occurrences','Unique source URLs','Known followed','Known nofollow','Follow UNKNOWN','Inventory evidence','Supplied status','Supplied indexable','Normalized anchor variants'],rows,
    scope:{site_origin:origin,url_identity:'exact trimmed string; unsupported fragments excluded',coverage:hasInventory?'SUPPLIED_INVENTORY_NOT_VERIFIED_COMPLETE':'UNKNOWN_NOT_SUPPLIED',link_row_semantics:'occurrences; exact duplicates retained',inventory_conflicts:conflicts.size,excluded_inventory_rows:invalidInventory,shared_anchor_groups:shared,actual_orphan_or_crawl_depth:'NOT_ESTABLISHED',ranking_effect:'NOT_INFERRED'},notes:[...BATCH3_TOOLS['internal-link-anchor-auditor'].boundaries,...BATCH3_TOOLS['internal-link-anchor-auditor'].contractNotes],
    extraExports:[file('internal-link-anchor-auditor-anchors.csv','Anchor frequencies CSV',['Target URL','Normalized anchor','Occurrences','Unique sources','Known followed','Known nofollow','Follow UNKNOWN','Targets sharing anchor','Generic example'],anchorRows),file('internal-link-anchor-auditor-details.csv','Input details CSV',['Input','CSV record','Source','Target or inventory URL','Anchor raw','Follow raw','Disposition','Evidence','Exact duplicate occurrence','Supplied status raw','Supplied indexable raw'],details)]};
}
const decimal=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const unknown=raw=>trim(raw)?'INVALID':'UNKNOWN_MISSING';
function integer(raw){const s=trim(raw);if(!s)return {value:null,state:'UNKNOWN_MISSING',raw};const n=Number(s);return /^\d+$/.test(s)&&Number.isSafeInteger(n)?{value:n,state:'VALID',raw}:{value:null,state:'INVALID',raw};}
function position(raw){const s=trim(raw),n=Number(s);return s&&decimal.test(s)&&Number.isFinite(n)&&n>0?{value:n,state:'VALID',raw}:{value:null,state:unknown(raw),raw};}
function providedCtr(raw,format){let s=trim(raw);if(!s)return {value:null,state:'UNKNOWN_MISSING',raw};if(format==='percent')s=s.replace(/%$/,'');else if(s.includes('%'))return {value:null,state:'INVALID',raw};const n=Number(s),v=format==='percent'?n/100:n;return decimal.test(s)&&Number.isFinite(v)&&v>=0&&v<=1?{value:v,state:'VALID',raw}:{value:null,state:'INVALID',raw};}
const show=v=>v===null||v===undefined?'UNKNOWN':v;
const delta=(a,b)=>a!==null&&b!==null?b-a:null;
const percentage=(a,b)=>a===null||b===null?'UNKNOWN':a===0?'UNDEFINED_ZERO_BASELINE':(b-a)/a*100;
export function compareGscPeriods(inputs,options,{readCsv}) {
  const keyType=trim(options.key_type).toLowerCase(),format=trim(options.ctr_format).toLowerCase();
  if(!['pages','queries','key'].includes(keyType))throw Error('Choose explicit key_type: pages, queries or key.');
  if(!['percent','fraction'].includes(format))throw Error('Choose explicit ctr_format: percent or fraction.');
  const keyField={pages:'page',queries:'query',key:'key'}[keyType],schema={page:['top_pages','url'],query:['top_queries'],key:[],clicks:[],impressions:[],ctr:[],position:['average_position']},findings=[];
  function period(text,role){const parsed=readCsv(text,role,schema,['clicks','impressions'],{preserveValues:true});ignored(parsed,role,findings);const keys=parsed.fields.filter(f=>['page','query','key'].includes(f));if(keys.length!==1||keys[0]!==keyField)throw Error(`${role}: key headers must match the selected ${keyType} type exactly; mixed key types are unsupported.`);
    const original=signatureRows(text),map=new Map(),conflicts=new Set(),inputRows=parsed.rows.map(r=>({record:r.record,key:trim(r[keyField]),rawKey:r[keyField],clicks:r.clicks,impressions:r.impressions,ctr:r.ctr??'',position:r.position??''}));let duplicates=0,invalidKeys=0;
    for(const row of parsed.rows){const key=trim(row[keyField]);if(!key){invalidKeys++;note(findings,'EMPTY_KEY_EXCLUDED',role,'An empty key cannot be joined.',`${role} record ${row.record}`);continue;}const sig=JSON.stringify(original[row.record-1]),old=map.get(key);
      if(old){if(old.signature===sig){duplicates++;note(findings,'IDENTICAL_DUPLICATE_COLLAPSED',key,'Exact identical CSV row collapsed; no metrics were summed or positions averaged.',`${role} records ${old.record}, ${row.record}`,'info');}else{conflicts.add(key);note(findings,'CONFLICTING_DUPLICATE_KEY',key,'Different rows for the same exact trimmed key are quarantined; no first row wins.',`${role} records ${old.record}, ${row.record}`);}continue;}
      const clicks=integer(row.clicks),impressions=integer(row.impressions),pos=position(row.position??''),ctr=providedCtr(row.ctr??'',format);
      if(clicks.value!==null&&impressions.value!==null&&clicks.value>impressions.value){clicks.value=null;impressions.value=null;clicks.state=impressions.state='INVALID_CLICKS_EXCEED_IMPRESSIONS';}
      for(const [name,v]of [['clicks',clicks],['impressions',impressions],['position',pos],['provided_ctr',ctr]])if(v.state.startsWith('INVALID'))note(findings,'INVALID_METRIC',key,`${role} ${name}: ${v.state}. Raw value is preserved in metric details.`,`${role} record ${row.record}`);
      const derived=clicks.value!==null&&impressions.value!==null&&impressions.value>0?clicks.value/impressions.value:null;
      const ctrState=derived!==null?'DERIVED_FROM_COUNTS':impressions.value===0&&clicks.value===0?'UNKNOWN_ZERO_IMPRESSIONS':'UNKNOWN_COUNTS';
      const tolerance=0.00005+Number.EPSILON*8,ctrMismatch=derived!==null&&ctr.value!==null&&Math.abs(derived-ctr.value)>tolerance;
      if(ctrMismatch)note(findings,'PROVIDED_CTR_MISMATCH',key,`${role} provided CTR differs from clicks/impressions by more than 0.005 percentage points. Derived CTR is used.`,`${role} record ${row.record}`);
      map.set(key,{record:row.record,signature:sig,clicks,impressions,position:pos,providedCtr:ctr,ctr:derived,ctrState,ctrMismatch});
    }
    return {map,conflicts,duplicates,invalidKeys,inputRows};
  }
  const before=period(inputs.before,'before'),after=period(inputs.after,'after'),keys=[...new Set([...before.map.keys(),...after.map.keys()])].sort(),rows=[],detailRows=[],changes=[];let matched=0,missing=0,quarantined=0,decomposed=0;
  for(const key of keys){let b=before.map.get(key),a=after.map.get(key);const conflict=before.conflicts.has(key)||after.conflicts.has(key);let coverage=conflict?'UNKNOWN_CONFLICT':!b?'UNKNOWN_MISSING_BEFORE':!a?'UNKNOWN_MISSING_AFTER':'BOTH_OBSERVED';if(conflict)quarantined++;else if(!b||!a){missing++;note(findings,'MISSING_PERIOD_ROW',key,`${!b?'Before':'After'} row not observed. Missing is UNKNOWN, not zero; no gain/loss is manufactured.`);}else matched++;
    const valid=coverage==='BOTH_OBSERVED',bc=valid?b.clicks.value:null,ac=valid?a.clicks.value:null,bi=valid?b.impressions.value:null,ai=valid?a.impressions.value:null,bt=valid?b.ctr:null,at=valid?a.ctr:null,bp=valid?b.position.value:null,ap=valid?a.position.value:null;
    const dc=delta(bc,ac),di=delta(bi,ai),dt=delta(bt,at),dp=delta(bp,ap);let ic=null,tc=null,residual=null,decomp='NOT_REQUESTED',tolerance=null;
    if(options.decompose===true){decomp='UNKNOWN_NEEDS_BOTH_POSITIVE_IMPRESSIONS';if(valid&&bi>0&&ai>0&&bt!==null&&at!==null){ic=(ai-bi)*(bt+at)/2;tc=(at-bt)*(bi+ai)/2;residual=ic+tc-dc;tolerance=Math.max(1e-8,Math.abs(dc)*1e-12,(Math.abs(ic)+Math.abs(tc))*Number.EPSILON*16);decomp=Math.abs(residual)<=tolerance?'DESCRIPTIVE_CONSERVED':'UNKNOWN_NUMERIC_PRECISION';if(decomp==='DESCRIPTIVE_CONSERVED')decomposed++;else{ic=tc=null;note(findings,'DECOMPOSITION_NUMERIC_PRECISION',key,'Floating-point conservation check failed; components remain UNKNOWN.');}}}
    rows.push([key,coverage,show(dc),percentage(bc,ac),show(di),percentage(bi,ai),dt===null?'UNKNOWN':dt*100,show(dp),decomp,show(ic),show(tc)]);
    if(dc!==null&&dc!==0)changes.push({key,delta:dc});
    // A conflicted period retains raw metrics but withholds interpreted numeric values.
    const metricDetails=(p,isConflict)=>{if(!p)return ['NOT_OBSERVED','','UNKNOWN_MISSING','','UNKNOWN_MISSING','','UNKNOWN_MISSING','','UNKNOWN_MISSING','UNKNOWN_MISSING',false,'UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN'];return [isConflict?'UNKNOWN_CONFLICT':'OBSERVED',p.clicks.raw,p.clicks.state,p.impressions.raw,p.impressions.state,p.position.raw,p.position.state,p.providedCtr.raw,p.providedCtr.state,p.ctrState,p.ctrMismatch,...(isConflict?['UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN']:[show(p.clicks.value),show(p.impressions.value),show(p.position.value),show(p.ctr)])];};
    detailRows.push([key,...metricDetails(b,before.conflicts.has(key)),...metricDetails(a,after.conflicts.has(key)),coverage,show(dc),show(di),show(dp),show(ic),show(tc),show(residual),show(tolerance),decomp]);
  }
  changes.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||a.key.localeCompare(b.key));for(const x of changes.slice(0,20))note(findings,'LARGEST_OBSERVED_CLICK_DELTA',x.key,`Observed clicks changed by ${x.delta} in supplied rows. This descriptive ordering does not establish cause or comparable periods.`,'','info');
  const rawRows=[['before',before],['after',after]].flatMap(([role,p])=>p.inputRows.map(r=>[role,r.record,r.rawKey,r.key,r.clicks,r.impressions,r.ctr,r.position,!r.key?'EXCLUDED_EMPTY_KEY':p.conflicts.has(r.key)?'QUARANTINED_CONFLICT':p.map.get(r.key).record===r.record?'SELECTED_OBSERVATION':'IDENTICAL_DUPLICATE_COLLAPSED']));
  const metricHeaders=prefix=>['Observation','Clicks raw','Clicks state','Impressions raw','Impressions state','Position raw','Position state','CTR provided raw','CTR provided state','Derived CTR state','Provided CTR mismatch','Clicks numeric','Impressions numeric','Position numeric','CTR derived fraction'].map(x=>`${prefix} ${x}`);
  return {summary:[['Keys observed',keys.length],['Both periods observed',matched],['Missing-period keys',missing],['Conflicted keys quarantined',quarantined],['Descriptive decompositions',decomposed],['Identical duplicate rows collapsed',before.duplicates+after.duplicates]],findings,
    columns:['Key','Coverage evidence','Click delta','Click change %','Impression delta','Impression change %','CTR delta (percentage points)','Position delta (after minus before; lower is better)','Decomposition state','Impression component (clicks)','CTR component (clicks)'],rows,
    scope:{key_type:keyType,key_identity:'exact trimmed text',provided_ctr_units:format,provided_ctr_rounding_tolerance_fraction:0.00005,period_length_search_type_filters_property_comparability:'NOT_VERIFIED',coverage:'SUPPLIED_TOP_ROWS_MAY_OMIT_ANONYMIZED_QUERIES',missing_row:'UNKNOWN_NOT_ZERO',zero_impressions_ctr:'UNKNOWN',position_delta:'after minus before; negative means lower observed position number',decomposition:options.decompose===true?'symmetric descriptive; both impressions > 0; conservation checked':'NOT_REQUESTED',invalid_key_rows:before.invalidKeys+after.invalidKeys,causality:'NOT_INFERRED'},notes:[...BATCH3_TOOLS['gsc-period-diff-analyzer'].boundaries,...BATCH3_TOOLS['gsc-period-diff-analyzer'].contractNotes],extraExports:[file('gsc-period-diff-analyzer-input-rows.csv','Raw metric rows CSV',['Period','CSV record','Key raw','Key trimmed','Clicks raw','Impressions raw','CTR provided raw','Position raw','Disposition'],rawRows),file('gsc-period-diff-analyzer-details.csv','Metric details CSV',['Key',...metricHeaders('Before'),...metricHeaders('After'),'Coverage evidence','Click delta','Impression delta','Position delta','Impression component','CTR component','Conservation residual','Conservation tolerance','Decomposition state'],detailRows)]};
}

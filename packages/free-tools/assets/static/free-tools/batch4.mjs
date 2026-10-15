import {BATCH4_TOOLS} from './batch4-tools.mjs';
const ID='serp-snippet-audit';
const OPTIONAL=['h1','og_title','og_description','og_image','twitter_card'];
export const METADATA_ALIASES=Object.freeze({
  url:['address','page_url'],
  title:['title 1','meta_title'],
  description:['meta description 1','meta_description'],
  h1:['h1-1','heading_1'],
  og_title:['og:title'],
  og_description:['og:description'],
  og_image:['og:image'],
  twitter_card:['twitter:card']
});
export const normalizeMetadata=value=>String(value??'').normalize('NFC').replace(/\s+/gu,' ').trim();
const count=value=>Array.from(normalizeMetadata(value)).length;
const state=(fields,row,key)=>!fields.has(key)?'UNKNOWN':normalizeMetadata(row[key])?'SUPPLIED':'MISSING';
export function auditMetadata(inputs,_options,{readCsv,urlValue,tableCsv}) {
  const parsed=readCsv(inputs.pages,'pages',METADATA_ALIASES,['url','title','description'],{preserveValues:true});
  const fields=new Set(parsed.fields),findings=[];
  // Findings use record labels and controlled explanations: no supplied markup enters Markdown reports.
  const note=(resultRow,rule,detail,severity='info')=>findings.push({severity,rule,subject:resultRow===null?'CSV header':`Result row ${resultRow}`,detail,source:resultRow===null?'Not applicable (header)':String(resultRow)});
  if(parsed.ignored.length)note(null,'UNSUPPORTED_COLUMNS_IGNORED',`${parsed.ignored.length} unsupported columns were not interpreted.`);
  const entries=parsed.rows.map((row,index)=>{
    const url=String(row.url??'').trim(),check=urlValue(url);
    const error=url.includes('#')?'Fragment markers are not supported for page identity.':check.error;
    const entry={row,resultRow:index+1,url,urlState:error?'INVALID':'VALID_HTTP_URL',title:normalizeMetadata(row.title),description:normalizeMetadata(row.description),social:{}};
    if(error)note(entry.resultRow,'INVALID_PAGE_URL',error,'warning');
    for(const key of OPTIONAL)entry.social[key]=state(fields,row,key);
    return entry;
  });
  const urlRows=new Map(),groups={title:new Map(),description:new Map()};
  for(const e of entries)if(e.urlState==='VALID_HTTP_URL'){
    if(!urlRows.has(e.url))urlRows.set(e.url,[]);
    urlRows.get(e.url).push(e);
    for(const key of ['title','description'])if(e[key]){
      if(!groups[key].has(e[key]))groups[key].set(e[key],new Set());
      groups[key].get(e[key]).add(e.url);
    }
  }
  for(const es of urlRows.values())if(es.length>1)for(const e of es)note(e.resultRow,'REPEATED_SUPPLIED_URL',`This exact URL appears in ${es.length} rows checked. Each observation is retained; no current value is chosen.`);
  let missingTitles=0,missingDescriptions=0,duplicateTitleRows=0,duplicateDescriptionRows=0,h1Differences=0;
  const rows=[],snippets=[],rawRows=[];
  for(const e of entries){
    const r=e.row,observations={};
    for(const key of ['title','description']){
      const duplicate=e.urlState==='VALID_HTTP_URL'&&(groups[key].get(e[key])?.size||0)>1;
      observations[key]=!e[key]?'MISSING':duplicate?'DUPLICATE_ACROSS_SUPPLIED_URLS':'PRESENT';
      if(!e[key]){if(key==='title')missingTitles++;else missingDescriptions++;note(e.resultRow,key.toUpperCase()+'_MISSING',`The supplied ${key} cell is blank after normalization.`,'warning');}
      else if(duplicate){if(key==='title')duplicateTitleRows++;else duplicateDescriptionRows++;note(e.resultRow,key.toUpperCase()+'_DUPLICATE_REVIEW',`${groups[key].get(e[key]).size} distinct valid supplied URL strings share this normalized ${key}. Review the intended page content.`);}
    }
    const h1=e.social.h1==='UNKNOWN'?'UNKNOWN':e.social.h1==='MISSING'?'MISSING':!e.title?'UNKNOWN_TITLE_MISSING':e.title===normalizeMetadata(r.h1)?'SAME':'DIFFERENT_INFORMATIONAL';
    if(h1==='DIFFERENT_INFORMATIONAL'){h1Differences++;note(e.resultRow,'TITLE_H1_DIFFERENCE_INFORMATIONAL','Normalized title and H1 differ. This is an observation, not a rewrite prediction.');}
    for(const key of OPTIONAL.slice(1))if(e.social[key]==='MISSING')note(e.resultRow,'SUPPLIED_SOCIAL_FIELD_MISSING',`The ${key} column is present and its supplied cell is blank.`);
    rows.push([e.resultRow,e.url,e.urlState,e.title,count(r.title),observations.title,e.description,count(r.description),observations.description,h1,...OPTIONAL.slice(1).map(key=>e.social[key])]);
    snippets.push({resultRow:e.resultRow,url:e.url,urlState:e.urlState,title:e.title,description:e.description,h1Comparison:h1,fields:OPTIONAL.map(key=>({name:key,state:e.social[key],value:fields.has(key)?String(r[key]??''):null}))});
    rawRows.push([e.resultRow,r.url,r.title,r.description,...OPTIONAL.map(key=>fields.has(key)?r[key]:'UNKNOWN_COLUMN')]);
  }
  return {
    summary:[['Rows checked (blank records excluded)',entries.length],['Invalid page URLs',entries.filter(e=>e.urlState==='INVALID').length],['Missing titles',missingTitles],['Missing descriptions',missingDescriptions],['Rows with shared titles',duplicateTitleRows],['Rows with shared descriptions',duplicateDescriptionRows]],
    columns:['Result row','Supplied URL','URL observation','Normalized title','Title characters','Title observation','Normalized description','Description characters','Description observation','Title/H1 observation','OG title inventory','OG description inventory','OG image inventory','Twitter card inventory'],
    rows,findings,snippets,
    scope:{source:'supplied CSV observations after blank records are ignored',blank_records:'Blank CSV records are ignored; skipped count is not available.',result_row_numbering:'Result rows are numbered sequentially from 1 and are not line numbers in your input file. The header is not a result row.',normalization:'NFC, whitespace collapse and trim; case-sensitive comparison',character_unit:'Unicode code points; not grapheme clusters or pixels',url_identity:'exact trimmed supplied URL; case, query and trailing slash preserved',duplicate_groups:'distinct syntactically valid supplied URLs only; repeated URL observations retained',optional_fields:Object.fromEntries(OPTIONAL.map(k=>[k,fields.has(k)?'COLUMN_SUPPLIED':'UNKNOWN_COLUMN'])),social_validation:'NOT_PERFORMED_SUPPLIED_TEXT_INVENTORY_ONLY',preview:'ILLUSTRATIVE_SUPPLIED_TEXT_GOOGLE_MAY_CHOOSE_OTHER_TEXT',h1_difference:'INFORMATIONAL_ONLY',title_h1_difference_rows:h1Differences,live_http:'NOT_REQUESTED',google_results:'NOT_VERIFIED',ranking_ctr_effect:'NOT_INFERRED'},
    extraExports:[{name:ID+'-checked-rows.csv',label:'Rows checked CSV',mime:'text/csv;charset=utf-8',text:tableCsv(['Result row','Supplied URL','Supplied title','Supplied description',...OPTIONAL.map(k=>'Supplied '+k)],rawRows)}],
    notes:BATCH4_TOOLS[ID].boundaries
  };
}


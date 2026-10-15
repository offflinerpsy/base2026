import {BATCH5_TOOLS} from './batch5-tools.mjs';
export const JSONLD_LIMITS=Object.freeze({fileBytes:2097152,objects:5000,values:20000,depth:64,stringLength:16384,pointerLength:4096});
const ID='json-ld-schema-auditor',own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const absoluteId=id=>/^[A-Za-z][A-Za-z0-9+.-]*:/.test(id);
const pointer=(base,key)=>base+'/'+String(key).replaceAll('~','~0').replaceAll('/','~1');
const kind=v=>v===null?'NULL':Array.isArray(v)?'ARRAY':typeof v==='object'?'OBJECT':typeof v==='string'?'STRING':typeof v==='boolean'?'BOOLEAN':'NUMBER';
function depthGuard(text){
  let depth=0,inString=false,escaped=false;
  for(const ch of text){
    if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue;}
    if(ch==='"'){inString=true;continue;}
    if(ch==='{'||ch==='['){if(++depth>JSONLD_LIMITS.depth)throw Error('Raw JSON-LD: maximum 64 nested object/array levels. Reduce nesting or inspect a smaller fragment.');}
    else if(ch==='}'||ch===']')depth--;
  }
}
function typeObservation(node){
  if(!own(node,'@type'))return {state:'NOT_SUPPLIED',types:[]};
  const raw=node['@type'];
  if(typeof raw==='string')return {state:raw.length?'SUPPLIED_STRING':'EMPTY_STRING',types:raw.length?[raw]:[]};
  if(Array.isArray(raw)&&raw.every(v=>typeof v==='string'))return {state:raw.length&&raw.every(v=>v.length)?'SUPPLIED_STRING_ARRAY':'EMPTY_TYPE_VALUE',types:raw.filter(v=>v.length)};
  return {state:'UNSUPPORTED_SHAPE',types:[]};
}
export function inspectJsonLd(inputs){
  const text=inputs.schema_input;
  if(typeof text!=='string'||!text.trim())throw Error('Raw JSON-LD: paste one JSON object or array, or choose a UTF-8 JSON file.');
  if(new TextEncoder().encode(text).byteLength>JSONLD_LIMITS.fileBytes)throw Error('Raw JSON-LD: maximum 2 MiB. Split the input into smaller graphs.');
  depthGuard(text);
  const findings=[],entries=[],contexts=[];
  const note=(row,rule,detail,severity='info')=>findings.push({severity,rule,subject:row===null?'JSON input':`Entity row ${row}`,detail,source:row===null?'Not applicable (input)':String(row)});
  let parsing='JSON_PARSED',entities='NOT_INSPECTED',coverage='NOT_INSPECTED',diagnostic=null,objects=0,values=0,skippedObjects=0,typed=0,references=0,matched=0,localGaps=0,externalUnknown=0,multipleGroups=0,root;
  const labels={JSON_PARSED:'Parsed JSON',JSON_SYNTAX_ERROR:'Syntax error',NOT_INSPECTED:'Not inspected',NOT_INSPECTED_UNSUPPORTED_ROOT:'Unsupported root',INVENTORIED:'Inventoried',NO_ENTITY_OBJECTS:'No entity objects',NO_ID_ONLY_REFERENCES:'No ID-only references',LOCAL_GAPS_AND_EXTERNAL_UNKNOWN:'Local gaps; external unknown',LOCAL_GAPS:'Local gaps',EXTERNAL_DEFINITIONS_UNKNOWN:'External definitions unknown',ALL_MATCHED_IN_INPUT:'All matched in input'};
  const finish=()=>({
    summary:[['Parsing',labels[parsing]],['Entity inventory',labels[entities]],['Reference coverage',labels[coverage]],['Typed entity objects',typed],['Entity rows',entries.length],['ID-only references',references]],
    columns:['Entity row','JSON pointer','Placement','Object observation','Literal @type','Type observation','Literal @id','ID observation','Definition objects with this ID','Reference observation','Context on this object','Supplied member names'],
    rows:entries.map(e=>[e.row,e.path,e.placement,e.kind,e.types.length===1?e.types[0]:JSON.stringify(e.types),e.typeState,e.id??'',e.idState,e.definitionCount,e.referenceState,e.contextState,JSON.stringify(e.keys)]),findings,
    scope:{parsing,entity_inventory:entities,reference_coverage:coverage,syntax_diagnostic:diagnostic,objects_inspected:objects,values_inspected:values,non_entity_objects:skippedObjects,typed_entity_objects:typed,id_only_references:references,references_matched_in_input:matched,local_references_not_matched:localGaps,external_definitions_unknown:externalUnknown,multiple_definition_id_groups:multipleGroups,contexts:contexts,keywords:'LITERAL_ONLY_NO_CONTEXT_OR_ALIAS_EXPANSION',reference_identity:'EXACT_SUPPLIED_STRING_NO_TRIM_NORMALIZATION_OR_BASE_RESOLUTION',id_fragments:'RETAINED_MULTIPLE_DEFINITIONS_FOR_REVIEW_NO_MERGING',duplicate_member_names:'NATIVE_JSON_PARSE_LAST_VALUE_KEPT_NOT_SEPARATELY_DIAGNOSED',inspection_limits:JSONLD_LIMITS,jsonld_validation:'NOT_PERFORMED',schema_org_vocabulary:'NOT_VERIFIED',google_rich_result_eligibility:'NOT_INFERRED',visible_page_parity:'NOT_CHECKED',live_http:'NOT_REQUESTED'},
    notes:BATCH5_TOOLS[ID].boundaries
  });
  try{root=JSON.parse(text);}catch(error){
    parsing='JSON_SYNTAX_ERROR';
    const offset=String(error?.message||'').match(/position (\d+)/i),where=String(error?.message||'').match(/line (\d+) column (\d+)/i);
    if(offset&&+offset[1]<=text.length){const prefix=text.slice(0,+offset[1]).split(/\r\n|\r|\n/);diagnostic={offset_utf16_zero_based:+offset[1],line_one_based:prefix.length,column_utf16_one_based:prefix.at(-1).length+1};}
    else if(where)diagnostic={line_one_based:+where[1],column_utf16_one_based:+where[2]};
    const location=diagnostic?` Parser-reported location: line ${diagnostic.line_one_based}, column ${diagnostic.column_utf16_one_based} (1-based UTF-16 units).`:' No portable character position was supplied by this browser.';
    note(null,'JSON_SYNTAX_ERROR','JSON could not be parsed. Supply raw JSON without HTML or script tags; check double-quoted keys and strings, commas, brackets and escaping.'+location,'warning');return finish();
  }
  if(!object(root)&&!Array.isArray(root)){entities='NOT_INSPECTED_UNSUPPORTED_ROOT';note(null,'ROOT_OBJECT_OR_ARRAY_REQUIRED','This is parsed JSON, but the inspector needs a root object or array. A primitive value is not treated as a graph.','warning');return finish();}
  const stack=[{value:root,path:'',placement:'ROOT',context:false}];let scheduled=1;
  const push=(value,path,placement,context)=>{if(++scheduled>JSONLD_LIMITS.values)throw Error('Raw JSON-LD: maximum 20,000 total values. Split the graph or remove unrelated values.');if(path.length>JSONLD_LIMITS.pointerLength)throw Error('Raw JSON-LD: a JSON pointer exceeds 4,096 UTF-16 units. Shorten member names or reduce nesting.');stack.push({value,path,placement,context});};
  while(stack.length){
    const {value,path,placement,context}=stack.pop();values++;
    if(typeof value==='string'&&value.length>JSONLD_LIMITS.stringLength)throw Error('Raw JSON-LD: maximum 16,384 UTF-16 units per string. Shorten long text or inspect a smaller graph.');
    if(Array.isArray(value)){for(let i=value.length-1;i>=0;i--)push(value[i],pointer(path,i),placement==='ROOT'?'ROOT_ARRAY_ITEM':placement,context);continue;}
    if(!object(value))continue;
    if(++objects>JSONLD_LIMITS.objects)throw Error('Raw JSON-LD: maximum 5,000 objects, including contexts. Split the graph; no partial inventory is returned.');
    const keys=Object.keys(value);for(const key of keys)if(key.length>JSONLD_LIMITS.stringLength)throw Error('Raw JSON-LD: a member name exceeds 16,384 UTF-16 units. Shorten the member name.');
    const type=typeObservation(value),hasId=own(value,'@id'),id=hasId&&typeof value['@id']==='string'?value['@id']:null;
    const onlyId=keys.length===1&&keys[0]==='@id',definition=hasId&&id!==null&&keys.some(k=>!['@id','@context'].includes(k));
    const wrapper=keys.length===0||keys.every(k=>['@context','@graph'].includes(k))||own(value,'@value')||own(value,'@list')||own(value,'@set');
    let entry=null;
    if(!context&&!wrapper){
      const idState=!hasId?'NOT_SUPPLIED':id===null?'NON_STRING_NOT_INDEXED':onlyId?'ID_ONLY_REFERENCE':definition?'DEFINITION':'ID_WITHOUT_ASSERTIONS';
      entry={row:entries.length+1,path,placement,kind:onlyId?'ID_ONLY_OBJECT':type.types.length?'TYPED_ENTITY':'UNTYPED_NODE',types:type.types,typeState:type.state,id,idState,definition,definitionCount:0,referenceState:onlyId&&id===null?'ID_VALUE_NOT_STRING':'NOT_AN_ID_ONLY_REFERENCE',contextState:own(value,'@context')?'SUPPLIED_UNEXPANDED':'NOT_SUPPLIED_HERE',keys};entries.push(entry);
      if(type.types.length)typed++;
      if(hasId&&id===null)note(entry.row,'ID_VALUE_SHAPE_REVIEW','The literal @id value is not a string. It is retained in the object inventory but is not indexed or matched.','warning');
      if(type.state==='UNSUPPORTED_SHAPE'||type.state==='EMPTY_STRING'||type.state==='EMPTY_TYPE_VALUE')note(entry.row,'TYPE_VALUE_REVIEW','The literal @type does not supply a nonempty string or string array. Review the supplied value; no vocabulary or context expansion is performed.');
      else if(!onlyId&&!type.types.length)note(entry.row,'TYPE_NOT_SUPPLIED','No literal @type is supplied on this object. It remains an untyped observation; missing type alone does not establish invalid JSON-LD.');
    }else if(!context)skippedObjects++;
    if(!context&&own(value,'@graph')&&!object(value['@graph'])&&!Array.isArray(value['@graph']))note(entry?.row??null,'GRAPH_VALUE_SHAPE_REVIEW','The literal @graph value is not an object or array. Review the supplied value; no expansion is performed.','warning');
    if(!context&&own(value,'@context'))contexts.push({owner_entity_row:entry?.row??null,json_pointer:pointer(path,'@context'),supplied_kind:kind(value['@context']),state:'SUPPLIED_UNEXPANDED'});
    for(let i=keys.length-1;i>=0;i--){const key=keys[i];push(value[key],pointer(path,key),key==='@graph'?'GRAPH_NODE':'NESTED_OBJECT',context||key==='@context');}
  }
  const definitions=new Map();
  for(const e of entries)if(e.definition){if(!definitions.has(e.id))definitions.set(e.id,[]);definitions.get(e.id).push(e);}
  for(const es of definitions.values())if(es.length>1){multipleGroups++;for(const e of es)note(e.row,'MULTIPLE_ID_DEFINITIONS_REVIEW',`This exact supplied @id appears in ${es.length} definition objects. Fragments can describe the same entity; review them together. Merging is not implemented.`);}
  for(const e of entries){
    if(e.id!==null)e.definitionCount=definitions.get(e.id)?.length||0;
    if(e.idState!=='ID_ONLY_REFERENCE')continue;references++;
    if(e.definitionCount){matched++;e.referenceState=e.definitionCount===1?'MATCHED_ONE_DEFINITION_IN_INPUT':'MATCHED_MULTIPLE_DEFINITIONS_IN_INPUT';}
    else if(absoluteId(e.id)){externalUnknown++;e.referenceState='EXTERNAL_DEFINITION_UNKNOWN';note(e.row,'EXTERNAL_DEFINITION_UNKNOWN','No definition with this exact supplied absolute @id appears in the input. The external definition is UNKNOWN because no request is made.');}
    else{localGaps++;e.referenceState='LOCAL_REFERENCE_NOT_MATCHED';note(e.row,'LOCAL_REFERENCE_NOT_MATCHED','No definition with this exact supplied non-absolute @id appears in the input. Review local coverage; no base resolution is performed.','warning');}
  }
  entities=entries.length?'INVENTORIED':'NO_ENTITY_OBJECTS';
  if(!entries.length)note(null,'NO_ENTITY_OBJECTS','JSON parsed, but no entity objects were inventoried. Empty objects, context-only/graph-only containers and value/list/set wrappers are not entity rows.');
  coverage=!references?'NO_ID_ONLY_REFERENCES':localGaps&&externalUnknown?'LOCAL_GAPS_AND_EXTERNAL_UNKNOWN':localGaps?'LOCAL_GAPS':externalUnknown?'EXTERNAL_DEFINITIONS_UNKNOWN':'ALL_MATCHED_IN_INPUT';
  return finish();
}

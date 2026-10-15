// Presentation only: never alter the inventory, findings or exported files.
export const JSONLD_PREVIEW_COLUMNS=Object.freeze(['Entity','Type','Reference','Details']);
const TYPE_LABELS=Object.freeze({NOT_SUPPLIED:'No literal @type supplied',SUPPLIED_STRING:'Supplied literal type',SUPPLIED_STRING_ARRAY:'Supplied literal types',EMPTY_STRING:'Empty @type string',EMPTY_TYPE_VALUE:'Empty or partly empty @type array',UNSUPPORTED_SHAPE:'@type shape needs review'});
const REFERENCE_LABELS=Object.freeze({MATCHED_ONE_DEFINITION_IN_INPUT:'Matched one definition in this input',MATCHED_MULTIPLE_DEFINITIONS_IN_INPUT:'Matched multiple definitions in this input',EXTERNAL_DEFINITION_UNKNOWN:'External definition UNKNOWN',LOCAL_REFERENCE_NOT_MATCHED:'No local definition matched',ID_VALUE_NOT_STRING:'@id is not a string; not matched'});
const FINDING_LABELS=Object.freeze({JSON_SYNTAX_ERROR:'JSON could not be parsed',ROOT_OBJECT_OR_ARRAY_REQUIRED:'Root object or array needed',ID_VALUE_SHAPE_REVIEW:'Review the @id value',TYPE_VALUE_REVIEW:'Review the @type value',TYPE_NOT_SUPPLIED:'No literal @type supplied',GRAPH_VALUE_SHAPE_REVIEW:'Review the @graph value',MULTIPLE_ID_DEFINITIONS_REVIEW:'Multiple definitions share this @id',EXTERNAL_DEFINITION_UNKNOWN:'External definition unknown',LOCAL_REFERENCE_NOT_MATCHED:'No local definition matched',NO_ENTITY_OBJECTS:'No entity objects inventoried'});
const make=(document,tag,text,cls)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=String(text);if(cls)element.className=cls;return element;};
const labelFor=(labels,code)=>Object.hasOwn(labels,code)?labels[code]:undefined;
const rawText=value=>value===undefined?'(undefined)':value===null?'(null)':String(value);
function disclosure(document,title,fields){
  const details=make(document,'details',undefined,'jsonld-raw'),list=make(document,'dl');
  details.append(make(document,'summary',title));
  for(const [label,value] of fields)list.append(make(document,'dt',label),make(document,'dd',rawText(value)));
  details.append(list);return details;
}
function referenceLabel(row){
  const state=row['Reference observation'],idState=row['ID observation'];
  if(labelFor(REFERENCE_LABELS,state))return labelFor(REFERENCE_LABELS,state);
  if(state!=='NOT_AN_ID_ONLY_REFERENCE')return `Unrecognized reference observation: ${rawText(state)}`;
  const labels={DEFINITION:'Defines this @id in the input',NOT_SUPPLIED:'No @id supplied; not an ID-only reference',NON_STRING_NOT_INDEXED:'@id is not a string; not indexed',ID_WITHOUT_ASSERTIONS:'@id supplied without definition assertions'};
  return labelFor(labels,idState)??`Not an ID-only reference; ID observation: ${rawText(idState)}`;
}
export function renderJsonLdRow(document,columns,values){
  const row=Object.fromEntries(columns.map((name,i)=>[name,values[i]])),tr=make(document,'tr');
  const cells=JSONLD_PREVIEW_COLUMNS.map(label=>{const cell=make(document,'td');cell.dataset.label=label;tr.append(cell);return cell;});
  const hasStringId=['DEFINITION','ID_ONLY_REFERENCE','ID_WITHOUT_ASSERTIONS'].includes(row['ID observation']);
  cells[0].append(make(document,'strong',hasStringId?(row['Literal @id']===''?'Empty @id string':row['Literal @id']):`Entity row ${row['Entity row']}`));
  if(!['DEFINITION','ID_ONLY_REFERENCE','ID_WITHOUT_ASSERTIONS','NOT_SUPPLIED','NON_STRING_NOT_INDEXED'].includes(row['ID observation']))cells[0].append(make(document,'p',`Unrecognized ID observation: ${rawText(row['ID observation'])}`,'jsonld-meta'));
  cells[0].append(make(document,'p',`Row ${row['Entity row']}`,'jsonld-meta'),make(document,'p',row['JSON pointer']===''?'JSON pointer: (root; empty string)':`JSON pointer: ${row['JSON pointer']}`,'jsonld-meta'));
  const typeState=row['Type observation'];
  let type=row['Literal @type'];
  if(typeState==='SUPPLIED_STRING_ARRAY'){
    try{const types=JSON.parse(type);if(Array.isArray(types)&&types.every(value=>typeof value==='string'))type=types.join(', ');}catch{/* Raw inventory value remains visible. */}
  }
  cells[1].append(make(document,'p',['SUPPLIED_STRING','SUPPLIED_STRING_ARRAY'].includes(typeState)?type:(labelFor(TYPE_LABELS,typeState)??`Unrecognized type observation: ${rawText(typeState)}`)));
  if(['SUPPLIED_STRING','SUPPLIED_STRING_ARRAY'].includes(typeState))cells[1].append(make(document,'p',TYPE_LABELS[typeState],'jsonld-meta'));
  cells[2].append(make(document,'p',referenceLabel(row)));
  const count=row['Definition objects with this ID'];
  if(row['ID observation']!=='NOT_SUPPLIED'&&row['ID observation']!=='NON_STRING_NOT_INDEXED')cells[2].append(make(document,'p',`${count} definition object${count===1?'':'s'} with this exact @id in the input`,'jsonld-meta'));
  if(row['Reference observation']==='EXTERNAL_DEFINITION_UNKNOWN')cells[2].append(make(document,'p','No external request was made.','jsonld-meta'));
  if(row['Reference observation']==='LOCAL_REFERENCE_NOT_MATCHED')cells[2].append(make(document,'p','Check the supplied ID and local definition; no base resolution is performed.','jsonld-meta'));
  cells[3].append(disclosure(document,`Raw fields · row ${row['Entity row']}`,columns.map((name,i)=>[name,values[i]])));
  return tr;
}
export function renderJsonLdFinding(document,finding){
  const li=make(document,'li'),label=labelFor(FINDING_LABELS,finding.rule)??`Unrecognized finding rule: ${rawText(finding.rule)}`;
  li.append(make(document,'strong',`${finding.severity}: ${label}`),make(document,'p',finding.subject),make(document,'p',finding.detail));
  li.append(disclosure(document,'Machine rule and source',[['Rule',finding.rule],['Severity',finding.severity],['Source',finding.source]]));
  return li;
}

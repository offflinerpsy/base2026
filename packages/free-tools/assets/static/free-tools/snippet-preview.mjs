// Local text-only preview. No supplied URL becomes a link, image or network request.
export function createSnippetPreview(doc) {
  const get=id=>doc.getElementById(id),panel=get('snippet-preview'),select=get('snippet-row');
  let rows=[];
  const text=(id,value)=>{get(id).textContent=String(value??'');};
  function show(){
    const index=Number(select.value),row=rows[index];if(!Number.isInteger(index)||!row)return;
    text('snippet-observation',`Result row ${row.resultRow} · URL observation: ${row.urlState}. Illustrative formatting of supplied text.`);
    text('snippet-url',row.url||'(Missing supplied URL)');
    text('snippet-title',row.title||'(Missing supplied title)');
    text('snippet-description',row.description||'(Missing supplied description)');
    text('snippet-h1',`Title/H1: ${row.h1Comparison}. Difference is informational.`);
    const fields=get('snippet-fields');fields.replaceChildren();
    for(const field of row.fields){
      const dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=field.name;
      dd.textContent=field.state+(field.state==='SUPPLIED'?' — '+field.value:'');fields.append(dt,dd);
    }
  }
  select.addEventListener('change',show);
  return {
    clear(){rows=[];select.replaceChildren();panel.hidden=true;for(const id of ['snippet-observation','snippet-url','snippet-title','snippet-description','snippet-h1'])text(id,'');get('snippet-fields').replaceChildren();},
    render(data){this.clear();rows=Array.isArray(data)?data:[];if(!rows.length)return;for(const [i,row]of rows.entries()){const option=doc.createElement('option');option.value=String(i);option.textContent=`Result row ${row.resultRow} · ${row.url||'(Missing URL)'}`;select.append(option);}select.value='0';panel.hidden=false;show();}
  };
}


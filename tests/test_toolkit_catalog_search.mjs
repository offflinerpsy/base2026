import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../templates/base2026-toolkit.js',import.meta.url),'utf8');
const listeners={};
const search={value:'redirect',addEventListener:(name,fn)=>{listeners[name]=fn;}};
const make=(title,description,inputOutput,category,guide)=>({
 dataset:{category,live:'true'},hidden:false,textContent:[title,description,inputOutput,category,guide].join(' '),
 querySelector:selector=>({textContent:selector==='h3'?title:selector===':scope > p'?description:inputOutput})
});
const cards=[make('Sitemap Builder','Build XML','URLs and XML','Technical SEO','Read the redirect guide'),make('Redirect Rule Compiler','Compile a draft','CSV to _redirects','Site changes','Read a sitemap guide')];
const status={textContent:''},empty={hidden:true};
const document={querySelector:selector=>selector==='[data-tool-search]'?search:selector==='[data-filter-status]'?status:empty,querySelectorAll:selector=>selector==='[data-tool-card]'?cards:[]};
vm.runInNewContext(source,{document});
assert.deepEqual(cards.map(card=>card.hidden),[true,false]);
search.value='XML';listeners.input();assert.deepEqual(cards.map(card=>card.hidden),[false,true]);
search.value='site changes';listeners.input();assert.deepEqual(cards.map(card=>card.hidden),[true,false]);
search.value='not-a-tool';listeners.input();assert.equal(empty.hidden,false);
listeners.keydown({key:'Escape'});assert.equal(search.value,'');assert.deepEqual(cards.map(card=>card.hidden),[false,false]);
assert.equal(status.textContent,'2 tools shown. 2 available now.');
console.log('PASS: 5 catalogue search regressions; guide anchors are excluded.');

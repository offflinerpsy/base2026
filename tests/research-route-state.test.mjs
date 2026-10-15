import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Run with node --test tests/research-route-state.test.mjs.
// An optional source argument also permits checking this test before copying it.
const sourcePath=process.argv[2]||resolve(dirname(fileURLToPath(import.meta.url)),'../web/static/meili.js');
const source=readFileSync(sourcePath,'utf8');
const sourceId='tiktok-video-1234567890123456789';
const selected={handle:['@alice','@bob'],year:['2024','2025'],source_type:['tiktok_video','youtube_video']};
const clone=value=>JSON.parse(JSON.stringify(value));
function functionSource(name){
  const match=source.match(new RegExp('(?:^|\\n)(?:async )?function '+name+'\\('));assert(match,`Missing application helper: ${name}`);
  const start=match.index+(source[match.index]==='\n'?1:0),tail=source.slice(start);
  const boundary=tail.slice(1).search(/\n(?:async )?function |\nconst [A-Za-z_$]|\nsearch\.start\(\)/);
  return boundary<0?tail:tail.slice(0,boundary+1);
}
function callbackSource(prefix){
  const start=source.indexOf(prefix);assert(start>=0,`Missing application callback: ${prefix}`);
  return source.slice(start,source.indexOf('\n});',start)+4);
}
function app(href='/workspace/',initial={}){
  const events={},historyWrites=[];const counts={search:0,close:0};
  const entries=[new URL(href,'https://example.test').href];let position=0;
  const window={location:new URL(entries[0]),history:{},addEventListener(name,callback){events[name]=callback;}};
  window.history.replaceState=(_state,_title,url)=>{window.location=new URL(url,window.location);entries[position]=window.location.href;historyWrites.push('replace');};
  window.history.pushState=(_state,_title,url)=>{window.location=new URL(url,window.location);entries.splice(position+1);entries.push(window.location.href);position++;historyWrites.push('push');};
  const helper={state:{query:'',facetsRefinements:{},disjunctiveFacetsRefinements:{},...clone(initial)},setQuery(query){this.state.query=query;return this;},clearRefinements(attribute){delete this.state.facetsRefinements[attribute];delete this.state.disjunctiveFacetsRefinements[attribute];return this;},toggleFacetRefinement(attribute,value){const values=this.state.disjunctiveFacetsRefinements[attribute]||[];this.state.disjunctiveFacetsRefinements[attribute]=values.includes(value)?values.filter(entry=>entry!==value):[...values,value];return this;},search(){counts.search++;search.render?.();return this;}};
  const search={helper,on(name,callback){assert.equal(name,'render');this.render=callback;}};
  const context={window,URLSearchParams,search,searchIndex:'base2026_public_tiktok',applyingRouteState:false,document:{body:{classList:{add(){},remove(){},toggle(){}}}},syncWorkspaceActiveState(){},syncPresetButtons(){},renderSelectedTerms(){},updateMobileFilterCount(){},showSourceDetail(){},closeSourceDetail(){counts.close++;}};
  vm.createContext(context);
  const helpers=['decodeHtmlEntities','compactText','stripHandle','displayTopicLabel','routeTopicLabel','normalizedFacetRouteValues','currentFacetRouteValues','knowledgeFacetRoutePatch','patchKnowledgeRouteParams','routeSearchParams','getKnowledgeRouteState','workspaceRouteHref','setKnowledgeRouteState','initialUiStateFromKnowledgeRoute','applyFacetRoute','applyKnowledgeRouteState'];
  vm.runInContext(helpers.filter(name=>new RegExp('(?:^|\\n)function '+name+'\\(').test(source)).map(functionSource).join('\n'),context);
  vm.runInContext(callbackSource('search.on("render", () => {'),context);
  vm.runInContext(callbackSource('window.addEventListener("popstate", () => {'),context);
  function apply(){context.applyKnowledgeRouteState(context.getKnowledgeRouteState());}
  function move(delta){const next=position+delta;assert(next>=0&&next<entries.length);position=next;window.location=new URL(entries[position]);events.popstate();}
  function openSource(){
    // Run the actual source-open prefix. Its data read remains pending, without I/O.
    Object.assign(context,{sourceDetailPanel:{classList:{add(){},remove(){}},scrollIntoView(){}},currentHitCache:new Map(),selectedSourceId:'',replaceSafeHtml(){},loadDocumentById:()=>new Promise(()=>{})});
    vm.runInContext(functionSource('publicSourceIdentity')+'\n'+functionSource('showSourceDetail'),context);
    context.showSourceDetail(sourceId);
  }
  return {context,helper,window,counts,historyWrites,entries,apply,openSource,back:()=>move(-1),forward:()=>move(1),render:()=>search.render(),route(patch){context.setKnowledgeRouteState(patch);apply();},choose(){for(const [attribute,values]of Object.entries(selected))for(const value of values)helper.toggleFacetRefinement(attribute,value);},facets:()=>clone(helper.state.disjunctiveFacetsRefinements)};
}
function encodedFacets(state){const params=state.context.routeSearchParams();return {handle:params.getAll('creator').map(value=>'@'+value),year:params.getAll('year'),source_type:params.getAll('source_type')};}

test('manual multiple selections survive source, Back, Forward and a filter-free entry',()=>{
  const state=app('/workspace/#search?q=example',{query:'example'});state.choose();state.render();assert.deepEqual(encodedFacets(state),selected);state.openSource();assert.equal(state.context.getKnowledgeRouteState().source,sourceId);state.back();assert.deepEqual(state.facets(),selected);state.forward();assert.deepEqual(state.facets(),selected);assert.equal(state.context.getKnowledgeRouteState().source,sourceId);
  state.route({q:'',creator:[],year:[],source_type:[],source:''});assert.equal(state.helper.state.query,'');assert.deepEqual(state.facets(),{});state.back();assert.deepEqual(state.facets(),selected);state.forward();assert.deepEqual(state.facets(),{});assert.equal(state.counts.search,3);assert.deepEqual(state.historyWrites,['replace','push','push']);
});

test('source click snapshots selections before an asynchronous result render',()=>{
  const state=app('/workspace/#search?q=example',{query:'example'});state.choose();state.openSource();assert.deepEqual(state.historyWrites,['replace','push']);state.back();assert.deepEqual(encodedFacets(state),selected);assert.deepEqual(state.facets(),selected);assert.equal(state.counts.search,0);
});

test('absent URL fields clear stale owned state in one search and preserve other filters',()=>{
  const state=app('/workspace/',{query:'old',facetsRefinements:{handle:['@old'],year:['2020'],language:['English']},disjunctiveFacetsRefinements:{source_type:['youtube_video'],topic:['seo']},numericRefinements:{score:{'>=':[50]}},tagRefinements:['featured']});state.apply();assert.equal(state.helper.state.query,'');assert.deepEqual(state.helper.state.facetsRefinements,{language:['English']});assert.deepEqual(state.facets(),{topic:['seo']});assert.deepEqual(state.helper.state.numericRefinements,{score:{'>=':[50]}});assert.deepEqual(state.helper.state.tagRefinements,['featured']);state.apply();assert.equal(state.counts.search,1);assert.equal(state.historyWrites.length,0);
});

test('legacy single-valued query links retain query-string precedence',()=>{
  const state=app('/workspace/?q=legacy&creator=alice&year=2024&source_type=tiktok_video#search?q=ignored&creator=bob');state.apply();assert.equal(state.helper.state.query,'legacy');assert.deepEqual(state.facets(),{handle:['@alice'],year:['2024'],source_type:['tiktok_video']});assert.equal(state.context.getKnowledgeRouteState().creator,'alice');
});

test('repeated hash values seed all selections without a duplicate initial search',()=>{
  const href='/workspace/#search?q=example&creator=alice&creator=bob&year=2024&year=2025&source_type=tiktok_video&source_type=youtube_video';const parsed=app(href);const initial=clone(parsed.context.initialUiStateFromKnowledgeRoute(parsed.context.getKnowledgeRouteState())).base2026_public_tiktok;assert.deepEqual(initial.refinementList,selected);const state=app(href,{query:initial.query,disjunctiveFacetsRefinements:initial.refinementList});state.context.applyKnowledgeRouteState(state.context.getKnowledgeRouteState(),{initial:true});assert.equal(state.counts.search,0);
});

test('partial topic updates and full return payloads preserve combinations using existing keys',()=>{
  const state=app('/workspace/#search?q=example&creator=alice&creator=bob&year=2024&year=2025&custom=a&custom=b');state.apply();state.route({topic:'internal-linking',q:'Internal Linking'});assert.deepEqual(state.facets().handle,['@alice','@bob']);const prior=state.context.getKnowledgeRouteState();state.route({creator:'other'});state.route(prior);const params=state.context.routeSearchParams();assert.deepEqual(params.getAll('creator'),['alice','bob']);assert.deepEqual(params.getAll('year'),['2024','2025']);assert.deepEqual(params.getAll('custom'),['a','b']);for(const key of ['creators','years','source_types'])assert.equal(params.has(key),false);assert.equal(state.helper.state.query,'Internal Linking');
});

test('canonical renders avoid history churn and preserve either research entry',()=>{
  for(const entry of ['/workspace/','/tools/evidence-search/']){const state=app(entry+'#search?q=example&creator=bob&creator=alice&creator=alice',{query:'example',disjunctiveFacetsRefinements:{handle:['@alice','@bob']}});state.apply();state.render();const writes=state.historyWrites.length;state.render();state.apply();assert.equal(state.historyWrites.length,writes);assert.equal(state.counts.search,0);assert.equal(new URL(state.context.workspaceRouteHref({source:sourceId}),'https://example.test/').pathname,entry);}
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const out=dirname(fileURLToPath(import.meta.url));
const clone=x=>JSON.parse(JSON.stringify(x));
function fn(code,name){
  const m=code.match(new RegExp('^(?:async )?function '+name+'\\(','m'));
  assert(m,name);return code.slice(m.index,code.indexOf('\n}\n',m.index)+3);
}
function parser(code){
  const start=code.indexOf('var publicSourceExplanationContract = (() => {');
  assert(start>=0);return code.slice(start,code.indexOf('\n})();',start)+7);
}
let realNetworkCalls=0;
function context(code,url='https://example.invalid/workspace/#search?q=trends&topic=keyword-research'){
  const history=[];const events=new Map();const sinks=[];
  const panel={classList:{add(){},remove(){}},scrollIntoView(){},replaceChildren(){},querySelector(){return null;}};
  const ctx={URL,URLSearchParams,AbortSignal,Intl,console,Map,Set,Promise,Number,
    window:{location:new URL(url)},document:{body:{classList:{add(){},remove(){},toggle(){}}},
      addEventListener:(name,handler)=>events.set(name,handler),querySelectorAll:()=>[],
      querySelector:()=>null},
    searchIndex:'base2026_public_tiktok',
    search:{helper:{state:{query:'trends'},search(){},setQuery(){return this;}}},
    sourceDetailPanel:panel,currentHitCache:new Map(),documentCache:new Map(),relatedPassageCache:new Map(),insightCache:new Map(),
    selectedSourceId:'',applyingRouteState:false,analyticsState:null,assetVersion:'',
    workspaceQuery:'',WORKSPACE_VIEWS:{ALL:'all',EVIDENCE:'evidence',OUTREACH:'outreach'},
    WORKSPACE_VIEW_VALUES:new Set(['all','evidence','outreach']),
    fetch:()=>{realNetworkCalls++;throw Error('Unexpected transport: offline test must stub every fetch');},
  };
  ctx.window.history={pushState:(_a,_b,next)=>{history.push({mode:'push',next});ctx.window.location=new URL(next,ctx.window.location);},
    replaceState:(_a,_b,next)=>{history.push({mode:'replace',next});ctx.window.location=new URL(next,ctx.window.location);}};
  vm.createContext(ctx);
  for(const match of code.matchAll(/^(?:async )?function (\w+)\(/gm))vm.runInContext(fn(code,match[1]),ctx);
  vm.runInContext(parser(code),ctx);
  const icons=code.indexOf('const shareIconPaths = {');
  assert(icons>=0);vm.runInContext(code.slice(icons,code.indexOf('\n};',icons)+3),ctx);
  for(const name of ['safeHtmlTags','safeHtmlAttributes']){
    const start=code.indexOf('const '+name+' = [');
    vm.runInContext(code.slice(start,code.indexOf('\n];',start)+3),ctx);
  }
  // Preserve the actual consumer's sanitizer boundary without a browser DOM.
  // Browser pixel/layout or DOMPurify execution acceptance is not claimed.
  ctx.replaceSafeHtml=(_target,html)=>sinks.push(html);
  const clickStart=code.indexOf('document.addEventListener("click", (event) => {');
  vm.runInContext(code.slice(clickStart,code.indexOf('\n});',clickStart)+4),ctx);
  return {ctx,history,events,sinks,panel};
}
// Entirely synthetic public-contract fixture; no transcript/provider data.
const video='1234567890123456789';
const sourceId=`tiktok:fixture_creator:${video}`;
const ref={segment_start_index:3,segment_end_index:5,start_seconds:19.580123,end_seconds:26.260789};
const block=(text,origin='source_reported')=>({text,origin,evidence_refs:[clone(ref)]});
const explanation={schema_version:'base2026.source-explanation.v1',source_id:sourceId,revision:'a'.repeat(64),projection_id:'b'.repeat(40),coverage:'whole_transcript',
 summary:block('The creator describes finding related rising searches in the selected topic.'),
 steps:[block('Open the topic and inspect the related rising searches described by the source.')],conditions:[],
 limitations:[block('The available source does not establish a measured traffic outcome.','base2026_observation')],
 faq:[{question:'What action does the source describe?',answer:block('The source describes inspecting related rising searches for content ideas.')}]};
const payload={schema_version:'base2026.public-source-summary.v1',source:{platform:'tiktok',video_id:video,source_id:sourceId,title:'Use Google Trends',title_source:'source_metadata',creator_display_name:'Fixture Creator',creator_handle:'fixture_creator',creator_url:'https://www.tiktok.com/@fixture_creator',avatar_url:'',source_url:`https://www.tiktok.com/@fixture_creator/video/${video}`,published_date:'2026-10-15'},
 cards:[{ordinal:0,claim_text:'A reviewed interpretation of the source material.',suggested_action:'A separate legacy suggested action.',topic_label:'Keyword research',evidence_excerpt:'[19.58s-26.26s] Inspect the related rising searches for content ideas.',evidence_start_seconds:19.58,evidence_end_seconds:26.26}],source_explanation:explanation};
const identity={platform:'tiktok',videoId:video};
const escaped=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}

for(const variant of ['public']){
  const code=readFileSync(resolve(out,'../web/static/meili.js'),'utf8');
  await test(`${variant}: optional explanation validates; unknown/private payload is excluded`,()=>{
    const {ctx}=context(code);const p=clone(payload);p.unexpected_field='UNEXPECTED_SENTINEL';p.source.unexpected_field='UNEXPECTED_SENTINEL';
    const doc=ctx.publicSourceDocument(p,identity);assert.deepEqual(clone(doc.source_explanation),explanation);
    assert(!JSON.stringify(doc).includes('UNEXPECTED_SENTINEL'));
    for(const bad of [null,{},[],false,'bad']){
      const invalid=clone(payload);invalid.source_explanation=bad;
      if(bad===null)assert(!ctx.publicSourceDocument(invalid,identity).source_explanation);
      else assert.throws(()=>ctx.publicSourceDocument(invalid,identity),/invalid public source response/);
    }
    for(const change of [e=>e.unexpected_field='UNEXPECTED_SENTINEL',e=>e.summary.origin='unknown',e=>e.summary.evidence_refs=[],e=>e.summary.text='https://example.invalid/',e=>e.summary.text='https://example.invalid/',e=>e.projection_id='wrong',e=>e.source_id='wrong']){
      const invalid=clone(payload);change(invalid.source_explanation);assert.throws(()=>ctx.publicSourceDocument(invalid,identity),/invalid public source response/);
    }
  });
  await test(`${variant}: source identity rejects mismatched source, creator and external URL`,()=>{
    const {ctx}=context(code);
    for(const change of [s=>s.video_id='9876543210987654321',s=>s.source_id='tiktok:other:'+video,s=>s.creator_handle='other',s=>s.source_url='https://example.invalid/video']){
      const p=clone(payload);change(p.source);assert.throws(()=>ctx.publicSourceDocument(p,identity));
    }
    assert.equal(ctx.publicSourceIdentity('tiktok-video-'+video).videoId,video);
    assert.equal(ctx.publicSourceIdentity('youtube-video-AbC123_-xyz').platform,'youtube');
    assert.equal(ctx.publicSourceIdentity('youtube-video-too-long-for-native-id'),null);
  });
  await test(`${variant}: full explanation precedes exact contextual quotes, preserving timestamps and escaping`,()=>{
    const {ctx}=context(code);const p=clone(payload);p.source.title='Long <em>source caption</em> & context. '.repeat(8);
    p.source_explanation.summary.text='Compare <em>source wording</em> & the chosen context carefully.';
    const doc=ctx.publicSourceDocument(p,identity);const html=ctx.renderPublicSourceDetail(doc);
    assert(html.indexOf('What this source explains')<html.indexOf('Quoted source fragment'));
    for(const s of ['Source-reported advice','Base2026 observation; unresolved from the available source','19.580123s–26.260789s','data-source-explanation-context','data-full-source-explanation tabindex="-1"','<ol class="source-detail-stack">','<blockquote>','Questions and source context','Fixture Creator'])assert(html.includes(s),s);
    assert(!html.includes('<h3>'+escaped(p.cards[0].claim_text)+'</h3>'));assert(!html.includes(p.cards[0].suggested_action));
    assert(html.replace(/<\/p>\s*<p>/g,' ').includes(escaped(p.source.title.trim())));assert(!html.includes('<em>source wording</em>'));
    assert(html.includes('&lt;em&gt;source wording&lt;/em&gt; &amp;'));
    assert(!html.includes('<h1 class="workspace-source-title">'+escaped(p.source.title)));
  });
  await test(`${variant}: absent/null explanation keeps legacy card content and invents no explanation`,()=>{
    const {ctx}=context(code);
    for(const mode of ['missing','null']){
      const p=clone(payload);if(mode==='missing')delete p.source_explanation;else p.source_explanation=null;
      const html=ctx.renderPublicSourceDetail(ctx.publicSourceDocument(p,identity));
      assert(html.includes(p.cards[0].claim_text));assert(html.includes(p.cards[0].suggested_action));
      assert(!html.includes('data-source-explanation-context'));assert(!html.includes('What this source explains'));
    }
  });
  await test(`${variant}: compact titles preserve complete caption in disclosure and never promote an extractive claim`,()=>{
    const {ctx}=context(code);const doc={creator_handle:'fixture_creator',topic_labels:['Keyword research']};
    assert.equal(ctx.workspaceSourceHeading(doc,'Use Google Trends').text,'Use Google Trends');
    for(const title of ['An incomplete caption...','Long caption '.repeat(30),'The source states: "An exact short quotation."']){
      const h=ctx.workspaceSourceHeading(doc,title);assert.equal(h.text,'Keyword research · fixture_creator');assert.equal(h.fullTitle,title.trim());
      assert(ctx.workspaceSourceCaption(h).replace(/<\/p>\s*<p>/g,' ').includes(escaped(title.trim())));
    }
    const h=ctx.workspaceSourceHeading({creator_handle:'x'.repeat(90),topic_labels:['x'.repeat(90)]},'Long caption '.repeat(20));
    assert.equal(h.text,'Source from original creator');
    const html=ctx.hitTemplate({item_id:'legacy-source',title:'Long <caption> '.repeat(20),creator_handle:'fixture_creator',topic_labels:['Keyword research'],body:'Saved source excerpt.'});
    assert(html.includes('<h3>Keyword research · fixture_creator</h3>'));assert(html.includes('Saved source excerpt.'));
  });
  await test(`${variant}: legacy detail retains source text with compact heading and complete disclosure`,()=>{
    const {ctx}=context(code);const title='Long <caption> '.repeat(20);
    const doc={item_id:'legacy-source',title,title_source:'source_metadata',creator_handle:'fixture_creator',topic_labels:['Keyword research'],public_text:'Saved public source text.',source_url:'https://example.invalid/source'};
    // The public source-text lane remains the baseline source function.
    ctx.sourcePublicText=()=>doc.public_text;
    const html=ctx.renderSourceDetailShell(doc,null,[],[],false);
    assert(html.includes('<h1 class="workspace-source-title">Keyword research · fixture_creator</h1>'));
    assert(html.replace(/<\/p>\s*<p>/g,' ').includes(escaped(title.trim())));assert(html.includes(doc.public_text));
  });
  await test(`${variant}: caption sentence segmentation preserves decimal/timestamp/ellipsis words`,()=>{
    const {ctx}=context(code);
    for(const text of ['Version 1.2 works. Keep the complete title.', 'At 19.58s the creator says this. Preserve 26.26s.', '...A leading continuation. Dr. Smith explains version 2.1.']){
      assert.equal(ctx.splitReadableText(text).join(' '),text);
      assert.equal(ctx.readableSentences(text).join(''),text);
    }
    vm.runInContext('Intl = { Segmenter: undefined };',ctx);
    assert.equal(ctx.readableSentences('Version 1.2 works. Keep the complete title.').join(''),'Version 1.2 works. Keep the complete title.');
  });
  await test(`${variant}: context button scrolls/focuses without query or history writes`,()=>{
    const {ctx,events,history,panel}=context(code);let prevented=0,scrolled=0,focused=0;
    panel.querySelector=()=>({scrollIntoView:()=>scrolled++,focus:()=>focused++});
    events.get('click')({target:{closest:s=>s==='[data-source-explanation-context]'?{}:null},preventDefault:()=>prevented++});
    assert.deepEqual([prevented,scrolled,focused,history.length],[1,1,1,0]);assert.equal(ctx.search.helper.state.query,'trends');
  });
  await test(`${variant}: known cloud detail uses exact public API and sanitizer, never JSONL`,async()=>{
    const {ctx,sinks}=context(code);const calls=[];let staticLoads=0;
    ctx.currentHitCache.set('tiktok-video-'+video,{item_id:'tiktok-video-'+video,title_source:'public_projection'});
    ctx.loadDocumentById=()=>{staticLoads++;throw Error('Must not read JSONL for known cloud hit');};
    ctx.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>clone(payload)};};
    await ctx.showSourceDetail('tiktok-video-'+video,{scroll:false});
    assert.equal(staticLoads,0);assert.equal(calls.length,1);assert.equal(calls[0].url,`/api/public-source/v1/tiktok/${video}`);
    assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.method,'GET');
    assert(sinks.at(-1).includes('What this source explains'));assert(!Object.hasOwn(ctx.sourceDetailPanel,'innerHTML'));
  });
  await test(`${variant}: legacy static ID keeps JSONL path and never invents cloud data`,async()=>{
    const {ctx,sinks}=context(code);let loads=0;
    ctx.loadDocumentById=async()=>{loads++;return {item_id:'legacy-static-id'};};ctx.renderSourceDetailShell=()=>'<p>Legacy fixture</p>';
    ctx.loadRelatedPassages=async()=>[];ctx.loadPublicInsights=async()=>[];
    await ctx.showSourceDetail('legacy-static-id',{scroll:false});assert.equal(loads,1);assert.equal(sinks.at(-1),'<p>Legacy fixture</p>');
  });
  await test(`${variant}: stale request cannot replace the newer selection`,async()=>{
    const {ctx,sinks}=context(code);let release;
    ctx.currentHitCache.set('tiktok-video-'+video,{item_id:'tiktok-video-'+video,title_source:'public_projection'});
    ctx.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>clone(payload)});});
    const pending=ctx.showSourceDetail('tiktok-video-'+video,{scroll:false});ctx.selectedSourceId='another-source';release();await pending;
    assert.equal(sinks.length,1);assert(sinks[0].includes('Loading source'));
  });
  await test(`${variant}: unavailable cloud detail does not read JSONL or reflect private error body`,async()=>{
    const {ctx,sinks}=context(code);let staticLoads=0;
    ctx.currentHitCache.set('tiktok-video-'+video,{item_id:'tiktok-video-'+video,title_source:'public_projection'});
    ctx.fetch=async()=>({ok:false,text:async()=>'UNEXPECTED_SENTINEL'});ctx.loadDocumentById=async()=>{staticLoads++;return null;};
    await ctx.showSourceDetail('tiktok-video-'+video,{scroll:false});assert.equal(staticLoads,0);assert(!sinks.at(-1).includes('UNEXPECTED_SENTINEL'));assert(sinks.at(-1).includes('Public source detail is unavailable'));
  });
  await test(`${variant}: sanitizer remains required with only necessary quote/step tags`,()=>{
    const {ctx}=context(code);let options;
    ctx.window.DOMPurify={sanitize:(_html,opts)=>{options=opts;return {querySelectorAll:()=>[]};}};
    ctx.safeHtmlFragment('<ol><li>Step</li></ol><blockquote>Quote</blockquote>');
    assert(options.ALLOWED_TAGS.includes('ol'));assert(options.ALLOWED_TAGS.includes('blockquote'));
    assert(!options.ALLOWED_TAGS.includes('script'));assert(!options.ALLOWED_TAGS.includes('iframe'));
    assert(options.ALLOW_ARIA_ATTR);assert(options.ALLOW_DATA_ATTR);assert(options.RETURN_DOM_FRAGMENT);
  });
  if(variant==='public'){
    await test('public: current hash route merges query/facets and stays under either nested pathname',()=>{
      for(const pathname of ['/workspace/','/tools/evidence-search/']){
        const {ctx,history}=context(code,`https://example.invalid${pathname}?year=2026#search?q=saved&creator=fixture_creator&topic=keyword-research`);
        ctx.search.helper.state.query='active terms';
        const href=ctx.workspaceRouteHref({source:'tiktok-video-'+video});
        assert(href.startsWith(pathname+'#search?'));const parsed=new URL(href,'https://example.invalid/');
        const params=new URLSearchParams(parsed.hash.slice('#search?'.length));
        assert.equal(params.get('q'),'active terms');assert.equal(params.get('creator'),'fixture_creator');assert.equal(params.get('year'),'2026');assert.equal(params.get('source'),'tiktok-video-'+video);
        ctx.setKnowledgeRouteState({source:'tiktok-video-'+video});assert.equal(ctx.window.location.pathname,pathname);
        assert.equal(ctx.getKnowledgeRouteState().q,'active terms');assert.equal(ctx.getKnowledgeRouteState().source,'tiktok-video-'+video);
        ctx.setKnowledgeRouteState({source:''});assert.equal(ctx.getKnowledgeRouteState().source,'');assert.equal(ctx.getKnowledgeRouteState().creator,'fixture_creator');
        ctx.setKnowledgeRouteState({source:''});assert.equal(history.length,2);
      }
      assert(!code.includes('migrateLegacyHashSearchRoute();'));
    });
    await test('public: address query retains precedence over colliding hash values, explicit q removal works',()=>{
      const {ctx}=context(code,'https://example.invalid/workspace/?q=address&year=2026#search?q=hash&topic=keyword-research');
      assert.equal(ctx.getKnowledgeRouteState().q,'address');assert.equal(ctx.getKnowledgeRouteState().topic,'keyword-research');
      ctx.setKnowledgeRouteState({q:'',source:''});assert.equal(ctx.getKnowledgeRouteState().q,'');assert.equal(ctx.getKnowledgeRouteState().year,'2026');
    });

  }
}
assert.equal(realNetworkCalls,0);
console.log(JSON.stringify({state:'OFFLINE_SOURCE_PARITY_REGRESSION_PASS',passed,failed:0,real_network_calls:realNetworkCalls,visual_acceptance:false,complete_live_parity:false}));

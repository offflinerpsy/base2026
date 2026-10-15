import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkRedirectMap,runTool} from './assets/static/free-tools/engine.mjs';
import {csvRows} from './assets/static/free-tools/sitemap-core.mjs';
import {TOOLS} from './assets/static/free-tools/tools.mjs';
import {CORRECTED_REDIRECT_MAP,redirectWorkedExampleHtml,redirectWorkedExampleMarkdown} from './redirect-worked-example.mjs';

const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const original = read('./assets/tools/redirect-map-checker/sample-map.csv');
const corrected = read('./assets/tools/redirect-map-checker/sample-map-corrected.csv');
const url = path => 'https://example.test'+path;

test('original downloadable map calculates one chain, two loop sources and one excluded conflict',()=>{
  assert.equal(original,TOOLS['redirect-map-checker'].sample.map);
  assert.equal(csvRows(original).length-1,6);
  const result=checkRedirectMap({map:original});
  assert.deepEqual(result.summary,[['Valid unique sources',4],['Conflicting sources',1],['Sources entering loops',2],['Multi-hop sources',1],['Exact duplicate mappings',0]]);
  assert.deepEqual(result.rows.map(row=>row.slice(0,6)),[
    [url('/old'),url('/middle'),'301','Terminal in supplied map',2,url('/new')],
    [url('/middle'),url('/new'),'301','Terminal in supplied map',1,url('/new')],
    [url('/a'),url('/b'),'302','Loop','UNKNOWN','UNKNOWN'],
    [url('/b'),url('/a'),'302','Loop','UNKNOWN','UNKNOWN'],
  ]);
  assert.deepEqual(result.findings.map(f=>[f.rule,f.subject]),[
    ['conflicting_source',url('/conflict')],['redirect_chain',url('/old')],['redirect_loop',url('/a')],['redirect_loop',url('/b')],
  ]);
});

test('corrected downloadable map calculates five direct mappings with no listed map issues',()=>{
  assert.equal(corrected,CORRECTED_REDIRECT_MAP);
  const result=runTool('redirect-map-checker',{map:corrected});
  assert.deepEqual(result.summary,[['Valid unique sources',5],['Conflicting sources',0],['Sources entering loops',0],['Multi-hop sources',0],['Exact duplicate mappings',0]]);
  assert.deepEqual(result.rows.map(row=>row.slice(0,6)),[
    [url('/old'),url('/new'),'301','Terminal in supplied map',1,url('/new')],
    [url('/middle'),url('/new'),'301','Terminal in supplied map',1,url('/new')],
    [url('/a'),url('/new'),'302','Terminal in supplied map',1,url('/new')],
    [url('/b'),url('/new'),'302','Terminal in supplied map',1,url('/new')],
    [url('/conflict'),url('/one'),'301','Terminal in supplied map',1,url('/one')],
  ]);
  assert.deepEqual(result.findings,[]);
  assert.equal(result.scope.live_http_status,'UNKNOWN');
  assert.equal(result.scope.final_target_status,'UNKNOWN');
  assert.equal(result.exports.length,4);
  assert.equal(csvRows(result.exports[0].text).length,6);
  assert.equal(result.manifest.privacy.target_fetch,false);
  assert.equal(result.manifest.privacy.upload,false);
});

test('worked example remains in generated HTML and README with actual downloads and explicit limits',()=>{
  const html=read('./assets/tools/redirect-map-checker/index.html');
  const markdown=read('./assets/tools/redirect-map-checker/README.md');
  assert(html.includes(redirectWorkedExampleHtml()));
  assert(markdown.includes(redirectWorkedExampleMarkdown()));
  for(const text of ['1 multi-hop source, 2 sources entering loops and 1 conflicting source.','5 valid unique sources, 0 conflicting sources, 0 sources entering loops and 0 multi-hop sources.','All 5 result rows have one planned hop.']){
    assert(html.includes(text));assert(markdown.includes(text));
  }
  for(const target of ['#try-example','#run-tool','#file-map','./sample-map.csv','./sample-map-corrected.csv'])assert(html.includes(`href="${target}"`));
  assert(html.includes('does not verify live HTTP status, target pages or indexing'));
});

test('a malformed map still produces the existing actionable input error',()=>{
  assert.throws(()=>checkRedirectMap({map:'source_only\nhttps://example.test/old\n'}),/required header/);
});

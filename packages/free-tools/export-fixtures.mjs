import {TOOLS} from './assets/static/free-tools/tools.mjs';
import {runTool,tableCsv} from './assets/static/free-tools/engine.mjs';
const results=Object.fromEntries(Object.entries(TOOLS).filter(([id])=>!['indexing-signal-reconciler','redirect-rule-compiler'].includes(id)).map(([id,def])=>[id,runTool(id,def.sample,{},[],'2026-10-14T00:00:00.000Z')]));
const formula=tableCsv(['one','two'],[['a,"b"\nsecond','café'],['=1','@SUM(1)']]);
process.stdout.write(JSON.stringify({results,formula}));

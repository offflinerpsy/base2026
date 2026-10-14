import {checkSizes, decode, expectedRows, xmlRows, urlHost, build} from './core.mjs';
let parsed;
async function hash(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
self.onmessage = async ({data}) => {
  try {
    if (data.type === 'import') {
      parsed = undefined;
      checkSizes(data.files); // metadata gate before File.arrayBuffer or decoding
      const inputs = []; let expected, existing;
      for (const f of data.files) {
        const role = f.role; const bytes = await f.file.arrayBuffer();
        if (bytes.byteLength !== f.size) throw new Error('File size changed. Import again.');
        const text = decode(bytes);
        const value = role === 'expected' ? expectedRows(text, f.format) : xmlRows(text);
        if (role === 'expected') expected = value; else existing = value;
        inputs.push({role,format:f.format,bytes:f.size,sha256:await hash(bytes),records:value.rows.length,observed_at:data.observedAt,scope:'supplied file',completeness:'parsed all supplied records'});
      }
      parsed = {expected,existing,inputs,observedAt:data.observedAt};
      const hosts = [...new Set([...expected.rows,...(existing?.rows || [])].map(r=>urlHost(r.url).host).filter(Boolean))].sort();
      if (!hosts.length) throw new Error('No absolute HTTP(S) URL with a usable host was found.');
      self.postMessage({type:'imported',hosts,records:inputs.map(r=>({role:r.role,records:r.records})),warnings:[...expected.warnings,...(existing?.warnings || [])]});
    } else if (data.type === 'build') {
      if (!parsed) throw new Error('Import files first.');
      self.postMessage({type:'built',result:build(parsed.expected,parsed.existing,data.host,parsed.inputs,parsed.observedAt)});
    }
  } catch (e) { parsed = undefined; self.postMessage({type:'error',message:e.message}); }
};

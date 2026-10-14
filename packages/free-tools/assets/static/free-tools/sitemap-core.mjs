export const RULESET = 'base2026.sitemap-local/1.0.2';
export const LIMITS = Object.freeze({urls: 5000, fileBytes: 2 * 1024 * 1024, totalBytes: 4 * 1024 * 1024});
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';
const fail = message => { throw new Error(message); };
export function checkSizes(files) {
  if (files.length < 1 || files.length > 2) fail('Choose one expected file and at most one XML file.');
  let total = 0;
  for (const f of files) {
    if (!Number.isSafeInteger(f.size) || f.size < 0) fail('Invalid file size.');
    if (f.size > LIMITS.fileBytes) fail('Each file must be at most 2 MiB.');
    total += f.size;
  }
  if (total > LIMITS.totalBytes) fail('Combined inputs must be at most 4 MiB.');
  return total;
}
export function decode(bytes) {
  if (bytes.byteLength > LIMITS.fileBytes) fail('Each file must be at most 2 MiB.');
  let text;
  try { text = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
  catch { fail('Invalid encoding. Save the file as UTF-8.'); }
  if (text.includes('\0')) fail('NUL bytes are unsupported; save as UTF-8.');
  return text;
}
// Streaming over bounded text; do not split a hostile file into unlimited rows.
export function csvRows(text, maxRows = LIMITS.urls + 1) {
  const rows = []; let row = [], value = '', mode = 'start';
  const cell = () => { row.push(value); value = ''; mode = 'start'; if (row.length > 64) fail('CSV supports at most 64 columns.'); };
  const end = () => { cell(); if (row.some(x => x !== '')) { if (rows.length >= maxRows) fail('CSV row limit exceeded (5,000 URL records).'); rows.push(row); } row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (mode === 'quoted') {
      if (c === '"') { if (text[i+1] === '"') { value += '"'; i++; } else mode = 'closed'; }
      else value += c;
    } else if (c === ',' || c === '\n' || c === '\r') {
      if (c === ',') cell(); else { end(); if (c === '\r' && text[i+1] === '\n') i++; }
    } else if (c === '"' && mode === 'start') mode = 'quoted';
    else { if (mode === 'closed' || c === '"') fail('Malformed CSV quoting.'); mode = 'plain'; value += c; }
  }
  if (mode === 'quoted') fail('Unclosed CSV quote.');
  if (row.length || value !== '' || mode !== 'start') end();
  return rows;
}
export function expectedRows(text, format) {
  const warnings = []; const rows = [];
  const push = (value, row) => {
    if (rows.length >= LIMITS.urls) fail('Expected input exceeds 5,000 URL records.');
    const clean = value.trim();
    if (clean !== value) warnings.push({row, reason: 'surrounding-whitespace-trimmed'});
    rows.push({url: clean, row});
  };
  if (format === 'txt') {
    let start = 0, n = 0;
    for (let i = 0; i <= text.length; i++) if (i === text.length || text[i] === '\n' || text[i] === '\r') {
      const line = text.slice(start, i); n++; if (line.trim()) push(line, n);
      if (text[i] === '\r' && text[i+1] === '\n') i++;
      start = i+1;
    }
  } else if (format === 'csv') {
    const all = csvRows(text); let col = 0, offset = 0;
    const headers = all[0]?.map(x => x.trim().toLowerCase()) || [];
    if (headers.includes('url') || headers.includes('loc')) { col = headers.indexOf(headers.includes('url') ? 'url' : 'loc'); offset = 1; }
    else if (all.some(r => r.length !== 1)) fail('Multi-column CSV needs a url or loc header.');
    if (all.length - offset > LIMITS.urls) fail('Expected input exceeds 5,000 URL records.');
    for (let i = offset; i < all.length; i++) {
      if (all[i].length !== all[0].length) fail('Inconsistent CSV column count.');
      push(all[i][col], i+1);
    }
    if (all[0]?.length > 1) warnings.push({reason: 'Only the url/loc column is used; other CSV columns are ignored.'});
  } else fail('Expected input must be TXT or CSV.');
  return {rows, warnings};
}
const xmlChar = n => n === 9 || n === 10 || n === 13 || n >= 32 && n <= 0xD7FF || n >= 0xE000 && n <= 0xFFFD || n >= 0x10000 && n <= 0x10FFFF;
function entities(s) {
  if (s.includes('<')) fail('Malformed XML text.');
  let out = ''; let from = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '&') {
    out += s.slice(from, i); const end = s.indexOf(';', i);
    if (end < 0 || end-i > 16) fail('Malformed XML entity.');
    const key = s.slice(i+1, end), named = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'"};
    if (Object.hasOwn(named, key)) out += named[key];
    else if (/^#(?:[0-9]+|x[0-9a-fA-F]+)$/.test(key)) {
      const n = key[1] === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      if (!xmlChar(n)) fail('Invalid XML character reference.'); out += String.fromCodePoint(n);
    } else fail('Custom XML entities are unsupported.');
    i = end; from = end+1;
  }
  return out + s.slice(from);
}
// Narrow urlset SAX parser for a Worker. No DOM, expansion, network or HTML parser.
export function xmlRows(text) {
  if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) fail('DOCTYPE and entity declarations are forbidden.');
  for (const c of text) if (!xmlChar(c.codePointAt(0))) fail('Invalid XML character.');
  const rows = [], warnings = [], stack = []; let rootSeen = false, rootDone = false, ignoredMeta = false, item, ns = Object.create(null), i = 0;
  const nameRE = /^[A-Za-z_][\w.:-]*/;
  const name = () => { const m = text.slice(i).match(nameRE); if (!m || !/^[A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?$/.test(m[0])) fail('Malformed XML name.'); i += m[0].length; return m[0]; };
  const space = () => { const start = i; while (/[\t\n\r ]/.test(text[i] || '!')) i++; return i > start; };
  const localName = q => {
    const parts = q.split(':'); const prefix = parts.length === 2 ? parts[0] : '';
    if (ns[prefix] !== NS) fail('Unsupported XML namespace. Use a sitemap urlset.');
    return parts.at(-1);
  };
  const close = q => {
    const entry = stack.pop(); if (!entry || entry.q !== q) fail('Mismatched XML closing tag.');
    if (entry.local === 'url') {
      if (!Object.hasOwn(item, 'loc') || !item.loc.trim()) fail('Every XML url needs exactly one loc.');
      rows.push({url: item.loc, row: rows.length+1, ...(item.lastmod ? {lastmod:item.lastmod} : {})}); item = undefined;
    } else if (entry.local === 'urlset') rootDone = true;
  };
  while (i < text.length) {
    if (text[i] !== '<') {
      const end = text.indexOf('<', i); const raw = text.slice(i, end < 0 ? text.length : end);
      // Outside the root, XML permits literal S whitespace, never references.
      if (!stack.length && /[^\t\n\r ]/.test(raw)) fail('Unexpected text outside XML root.');
      if (raw.includes(']]>')) fail('Malformed XML text.'); const value = entities(raw);
      if (stack.length === 3) item[stack.at(-1).local] += value;
      else if (value.trim()) fail('Unexpected XML text.');
      i = end < 0 ? text.length : end; continue;
    }
    if (text.startsWith('<!--', i)) { const end = text.indexOf('-->', i+4); if (end < 0 || text.slice(i+4,end).includes('--') || text[end-1] === '-') fail('Malformed XML comment.'); i = end+3; continue; }
    if (text.startsWith('<![CDATA[', i)) {
      if (stack.length !== 3) fail('Unexpected CDATA.'); const end = text.indexOf(']]>', i+9); if (end < 0) fail('Unclosed CDATA.');
      item[stack.at(-1).local] += text.slice(i+9,end); i = end+3; continue;
    }
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i+2); const decl = text.slice(i, end+2);
      // XML S is only space, tab, CR and LF; Unicode whitespace is malformed here.
      if (i !== 0 || end < 0 || !/^<\?xml[\t\n\r ]+version=(["'])1\.0\1(?:[\t\n\r ]+encoding=(["'])[Uu][Tt][Ff]-8\2)?(?:[\t\n\r ]+standalone=(["'])(?:yes|no)\3)?[\t\n\r ]*\?>$/.test(decl)) fail('Unsupported XML declaration or processing instruction.');
      i = end+2; continue;
    }
    if (text.startsWith('</', i)) { i += 2; const q = name(); space(); if (text[i++] !== '>') fail('Malformed XML closing tag.'); close(q); continue; }
    if (text.startsWith('<!', i)) fail('Unsupported XML declaration.');
    i++; const q = name(); const attrs = Object.create(null); let separated = space();
    while (text[i] !== '>' && !text.startsWith('/>', i)) {
      if (!separated) fail('Malformed XML attributes.'); const key = name(); space(); if (text[i++] !== '=') fail('Malformed XML attribute.'); space();
      const quote = text[i++]; if (quote !== '"' && quote !== "'") fail('XML attributes must be quoted.');
      const end = text.indexOf(quote, i); if (end < 0 || Object.hasOwn(attrs,key)) fail('Unclosed or duplicate XML attribute.');
      attrs[key] = entities(text.slice(i,end)); i = end+1; separated = space();
    }
    const selfClosing = text.startsWith('/>', i); i += selfClosing ? 2 : 1;
    if (i > text.length || rootDone) fail('Malformed XML document.');
    if (!rootSeen) {
      rootSeen = true;
      for (const [k,v] of Object.entries(attrs)) {
        const prefix = k === 'xmlns' ? '' : /^xmlns:[A-Za-z_][\w.-]*$/.test(k) ? k.slice(6) : undefined;
        if (prefix === undefined) fail('Unsupported urlset attribute.');
        if (prefix === 'xmlns' || v === XMLNS_NS || prefix === 'xml' && v !== XML_NS || prefix !== 'xml' && v === XML_NS || prefix && !v) fail('Invalid reserved XML namespace binding.');
        ns[prefix] = v;
      }
      if (q.split(':').at(-1) === 'sitemapindex') fail('Sitemap index is unsupported. Supply one XML urlset.');
      if (localName(q) !== 'urlset') fail('XML root must be urlset.');
    } else if (Object.keys(attrs).length) fail('Attributes on sitemap records are unsupported.');
    const local = localName(q), depth = stack.length;
    if (depth === 0 && (rows.length || rootDone) || depth === 1 && local !== 'url' || depth === 2 && !['loc','lastmod','changefreq','priority'].includes(local) || depth > 2) fail('Unsupported sitemap structure.');
    if (local === 'url' && depth === 1) { if (rows.length >= LIMITS.urls) fail('XML exceeds 5,000 URL records.'); item = {}; }
    if (depth === 2) { if (Object.hasOwn(item,local)) fail('Duplicate XML field.'); item[local] = ''; if (local === 'priority' || local === 'changefreq') ignoredMeta = true; }
    stack.push({q, local}); if (selfClosing) close(q);
  }
  if (!rootSeen || !rootDone || stack.length) fail('Incomplete XML document.');
  if (ignoredMeta) warnings.push({reason:'Supplied priority/changefreq fields are ignored; no replacement values are inferred.'});
  if (rows.some(r => r.lastmod)) warnings.push({reason:'Supplied lastmod is copied only for exact matching URLs with valid date syntax; it is not verified.'});
  return {rows, warnings};
}
export function urlHost(value) {
  // The original URL is the export identity. Exclude, never rewrite, XML 1.0
  // forbidden codepoints (including lone surrogates and U+FFFE/U+FFFF).
  for (const c of value) if (!xmlChar(c.codePointAt(0))) return {reason:'xml-forbidden-character'};
  if (!/^https?:\/\//i.test(value) || /[\s<>"\x00-\x1f\x7f\\]/u.test(value)) return {reason:'invalid-absolute-http-url'};
  try {
    const u = new URL(value);
    if (!u.hostname || u.username || u.password || value.includes('#')) return {reason:'credentials-or-fragment'};
    return {host:u.host}; // URL is used only to classify host; original string is the key.
  } catch { return {reason:'invalid-absolute-http-url'}; }
}
export function classify(rows, host, source) {
  const included = [], excluded = [], duplicate = [], seen = new Set();
  for (const r of rows) {
    const record = {...r, source}; const value = urlHost(r.url);
    if (value.reason) excluded.push({...record, reason:value.reason});
    else if (seen.has(r.url)) duplicate.push({...record, reason:'exact-duplicate'});
    else { seen.add(r.url); if (value.host !== host) excluded.push({...record,reason:'other-host'}); else included.push(record); }
  }
  return {included, excluded, duplicate};
}
export const xmlEscape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function csvCell(s) {
  s = String(s ?? ''); if (/^[\s\x00-\x1f]*[=+@-]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"','""') + '"';
}
function lastmod(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(s)) return false;
  const day = new Date(s.slice(0,10)+'T00:00:00Z');
  if (Number.isNaN(+day) || day.toISOString().slice(0,10) !== s.slice(0,10) || s.startsWith('0000')) return false;
  if (s.length > 10) {
    if (+s.slice(11,13) > 23 || +s.slice(14,16) > 59 || +s.slice(17,19) > 59) return false;
    if (!s.endsWith('Z')) { const zone = s.slice(-6); if (+zone.slice(1,3) > 14 || +zone.slice(4) > 59 || +zone.slice(1,3) === 14 && +zone.slice(4) !== 0) return false; }
  }
  return !Number.isNaN(+new Date(s));
}
export function build(expected, existing, host, inputs, observedAt) {
  if (!host) fail('Choose one host explicitly.');
  const hosts = [...new Set([...expected.rows,...(existing?.rows || [])].map(r => urlHost(r.url).host).filter(Boolean))].sort();
  if (!hosts.includes(host)) fail('Selected host is not present in inputs.');
  const e = classify(expected.rows,host,'expected'), x = classify(existing?.rows || [],host,'existing');
  const es = new Set(e.included.map(r=>r.url)), xs = new Set(x.included.map(r=>r.url));
  const added = existing ? e.included.filter(r=>!xs.has(r.url)) : [], missing = existing ? x.included.filter(r=>!es.has(r.url)) : [];
  const excluded = [...e.excluded,...x.excluded], duplicate = [...e.duplicate,...x.duplicate];
  const warnings = [...expected.warnings,...(existing?.warnings || [])];
  if (duplicate.length) warnings.push({reason:`${duplicate.length} exact duplicate records removed.`});
  const dates = new Map();
  for (const r of x.included) if (r.lastmod) { if (lastmod(r.lastmod)) dates.set(r.url,r.lastmod); else warnings.push({row:r.row,source:'existing',reason:'Invalid lastmod syntax omitted.'}); }
  const urls = [...es].sort();
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="'+NS+'">\n' + urls.map(url=>'  <url><loc>'+xmlEscape(url)+'</loc>'+(dates.has(url)?'<lastmod>'+xmlEscape(dates.get(url))+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
  const csv = [['kind','source','row','url','reason'],...added.map(r=>['added',r.source,r.row,r.url,'expected-only']),...missing.map(r=>['missing',r.source,r.row,r.url,'existing-only']),...excluded.map(r=>['excluded',r.source,r.row,r.url,r.reason]),...duplicate.map(r=>['duplicate',r.source,r.row,r.url,r.reason])].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
  const reasons = {};
  for (const r of excluded) reasons[r.reason] = (reasons[r.reason] || 0)+1;
  const counts = {expected_records:expected.rows.length,existing_records:existing?.rows.length || 0,included:e.included.length,existing_included:x.included.length,added:added.length,missing:missing.length,excluded:excluded.length,duplicate:duplicate.length,exclusion_reasons:reasons};
  const manifest = {schema:'base2026.local-input-manifest/1',ruleset:RULESET,observed_at:observedAt,scope:{host,comparison:!!existing,source:'user-supplied files only',url_identity:'exact string after TXT/CSV surrounding whitespace trim; no URL serialization',lastmod:'only supplied exact XML matches with valid syntax'},completeness:{inputs:'all supplied records parsed within MVP bounds',site_coverage:'UNKNOWN',http_status:'UNKNOWN',canonical:'UNKNOWN',lastmod_verified:false},limits:LIMITS,inputs,counts,warnings,privacy:{retention:'tab memory until cleared/closed',target_fetch:false,public_api:false,inference:false,telemetry:false}};
  const report = ['Base2026 — Sitemap from a URL list',`Ruleset: ${RULESET}`,`Observed at: ${observedAt}`,`Host: ${host}`,`Comparison: ${existing?'supplied urlset':'none'}`,JSON.stringify(counts,null,2),'Added = expected-only. Missing = existing-only. Counts cover both inputs for exclusions/duplicates.','Site coverage, HTTP status and canonical: UNKNOWN. No target URL requested. Lastmod is supplied, never inferred.','Input SHA256:',...inputs.map(r=>`${r.role}: ${r.sha256} (${r.bytes} bytes)`),'Warnings:',...warnings.map(r=>JSON.stringify(r))].join('\n')+'\n';
  return {included:e.included,existingIncluded:x.included,added,missing,excluded,duplicate,manifest,xml,csv,report};
}

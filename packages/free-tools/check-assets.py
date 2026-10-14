"""Bounded generated-page/source contract checks; no browser or deployment claim."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import datetime

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.scripts = []
        self.current_script = None
        self.feed(text)
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        self.tags.append((tag, attrs))
        assert not any(k.startswith('on') for k in attrs), 'inline event handler'
        assert 'style' not in attrs, 'inline style'
        for key in ['href', 'src']:
            assert not attrs.get(key, '').lower().startswith('javascript:'), 'active URL'
        if tag == 'script':
            self.current_script = [attrs, '']
            self.scripts.append(self.current_script)
    def handle_endtag(self, tag):
        if tag == 'script':
            self.current_script = None
    def handle_data(self, data):
        if self.current_script is not None:
            self.current_script[1] += data

registry = json.loads((BASE / 'REGISTRY.json').read_text())['tools']
manifest = json.loads((BASE / 'ASSET-MANIFEST.json').read_text())
files = {str(f.relative_to(ASSETS)): f for f in ASSETS.rglob('*') if f.is_file()}
assert set(files) == set(manifest['files']), 'asset manifest path mismatch'
for name, path in files.items():
    raw = path.read_bytes()
    assert len(raw) == manifest['files'][name]['bytes'], name
    assert hashlib.sha256(raw).hexdigest() == manifest['files'][name]['sha256'], name
checks = [{'name': 'all asset paths, bytes and SHA256 match manifest', 'pass': True, 'files': len(files)}]
required = ['main', 'try-example', 'tool-form', 'run-tool', 'clear-tool', 'tool-status', 'tool-results', 'summary', 'downloads', 'result-head', 'result-body', 'table-page', 'prev-rows', 'next-rows', 'finding-body', 'findings-page', 'prev-findings', 'next-findings', 'report-notes']
for tool in registry:
    text = (ASSETS / tool['route'].lstrip('/') / 'index.html').read_text()
    page = Page(text)
    ids = [a['id'] for tag, a in page.tags if 'id' in a]
    assert len(ids) == len(set(ids)), tool['id'] + ' duplicate IDs'
    assert set(required).issubset(ids), tool['id'] + ' app hook missing'
    for field in tool['inputs']:
        assert 'input-' + field['role'] in ids and 'file-' + field['role'] in ids
    assert text.count('<h1>') == 1 and '<h1>' + tool['h1'] + '</h1>' in text
    metas = {a.get('name', a.get('property')): a.get('content') for tag, a in page.tags if tag == 'meta'}
    assert metas['description'] == tool['description'] and metas['og:description'] == tool['description']
    assert metas['robots'] == 'index,follow'
    assert metas['og:url'] == tool['canonical']
    assert len([a for tag, a in page.tags if tag == 'link' and a.get('rel') == 'canonical' and a.get('href') == tool['canonical']]) == 1
    for tag, attrs in page.tags:
        if (tag == 'script' and attrs.get('src')) or (tag == 'link' and attrs.get('rel') in ['stylesheet', 'icon']):
            url = attrs.get('src', attrs.get('href', ''))
            assert url.startswith('/static/free-tools/'), url
            assert (ASSETS / url.lstrip('/')).is_file(), url
    data = [json.loads(content) for attrs, content in page.scripts if attrs.get('type') == 'application/ld+json']
    assert len(data) == 2 and data[0]['@type'] == 'WebApplication' and data[1]['@type'] == 'BreadcrumbList'
    executable = [(attrs, content) for attrs, content in page.scripts if attrs.get('type') != 'application/ld+json']
    assert len(executable) == 1 and executable[0][0] == {'type': 'module', 'src': '/static/free-tools/app.mjs'} and not executable[0][1]
    checks.append({'name': tool['id'] + ': IDs, metadata, JSON-LD and same-origin executable assets', 'pass': True})

source = '\n'.join(f.read_text() for f in (ASSETS / 'static/free-tools').glob('*.mjs'))
for pattern in [r'\bfetch\s*\(', r'\bXMLHttpRequest\b', r'\b(?:localStorage|sessionStorage|indexedDB)\b', r'\bsendBeacon\s*\(', r'\bWebSocket\b', r'\.innerHTML\s*=', r'\beval\s*\(']:
    assert not re.search(pattern, source), pattern
assert "new Worker('/static/free-tools/worker.mjs',{type:'module'})" in source
assert 'URL.createObjectURL(blob)' in source and 'URL.revokeObjectURL(url)' in source
csp = (BASE / 'CSP-RULES.txt').read_text()
assert "connect-src 'none'" in csp and "worker-src 'self'" in csp and '/static/free-tools/*' in csp
checks.append({'name': 'source privacy/safe-DOM and Worker response CSP boundaries', 'pass': True})
report = {'state': 'PASS', 'observed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'checks': checks,
          'scope': 'static/source checks only; unused shared base CSS references two unrendered brand atlas selectors, no present page uses them; root browser network/CSP verification remains required'}
(BASE / 'ASSET-CHECK-EVIDENCE.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'state': 'PASS', 'checks': len(checks), 'assets': len(files)}))

"""Independent Expat/ElementTree XML and stdlib CSV oracle, no product parser."""
import csv, io, json, platform, hashlib
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone

base = Path(__file__).resolve().parent
path = base / 'REGRESSION-EVIDENCE.json'
data = json.loads(path.read_text())
checks = []
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
for sample in data['roundTrips']:
    root = ET.fromstring(sample['xml'])
    actual = [loc.text for loc in root.findall('s:url/s:loc', ns)]
    # Product documents ECMAScript's deterministic UTF-16 lexical sort.
    # Python's default codepoint order differs for supplementary characters.
    assert actual == sorted(sample['included'], key=lambda s: s.encode('utf-16-be')), sample['name']
    assert len(actual) == len(set(actual)) == sample['counts']['included']
    rows = list(csv.DictReader(io.StringIO(sample['csv'], newline='')))
    counts = sample['counts']
    for kind in ['added', 'missing', 'excluded', 'duplicate']:
        assert sum(r['kind'] == kind for r in rows) == counts[kind]
    checks.append({'name': sample['name'], 'status': 'PASS', 'every_included_URL_read_back': len(actual), 'csv_records': len(rows), 'xml_sha256': hashlib.sha256(sample['xml'].encode()).hexdigest()})
for sample in data['malformed']:
    try:
        ET.fromstring(sample['xml'])
    except ET.ParseError as e:
        checks.append({'name': sample['name'], 'status': 'PASS', 'product_error': sample['error'], 'oracle_error': str(e)})
    else:
        raise AssertionError('Oracle accepted malformed sample: ' + sample['name'])
for sample in data['validXML']:
    root = ET.fromstring(sample['xml'])
    actual = [loc.text for loc in root.findall('s:url/s:loc', ns)]
    assert actual == sample['urls'], sample['name']
    checks.append({'name': sample['name'], 'status': 'PASS', 'urls': actual})
for sample in data['unsupportedXML']:
    # Valid XML may intentionally be outside the narrow sitemap input subset.
    root = ET.fromstring(sample['xml'])
    assert root.tag == '{http://www.w3.org/XML/1998/namespace}urlset'
    checks.append({'name': sample['name'], 'status': 'PASS', 'well_formed_but_unsupported': True})
evidence = {'observed_at': datetime.now(timezone.utc).isoformat(), 'python': platform.python_version(), 'oracle': 'stdlib xml.etree.ElementTree (Expat); csv.DictReader', 'source': {'path': str(path.relative_to(base.parents[2])), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}, 'checks': checks, 'passed': len(checks), 'failed': 0, 'included_URLs_checked': sum(c.get('every_included_URL_read_back', 0) for c in checks)}
(base/'ORACLE-EVIDENCE.json').write_text(json.dumps(evidence, ensure_ascii=True, indent=2)+'\n')
print(f"{len(checks)} independent oracle checks PASS; {evidence['included_URLs_checked']} exact included URL readbacks")

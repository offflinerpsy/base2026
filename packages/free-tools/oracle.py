"""Independent stdlib CSV/JSON export oracle for the five synthetic tool examples."""
from pathlib import Path
import csv
import io
import json
import platform
import subprocess
import datetime

base = Path(__file__).resolve().parent
process = subprocess.run(['node', str(base / 'export-fixtures.mjs')], check=True, capture_output=True, text=True)
data = json.loads(process.stdout)
expected = {'robots-txt-tester': 4, 'redirect-map-checker': 4, 'hreflang-checker': 6,
            'broken-link-task-builder': 3, 'seo-crawl-comparison': 5}
checks = []
for tool, result in data['results'].items():
    outputs = result['exports']
    assert len(outputs) == 4
    rows = list(csv.reader(io.StringIO(outputs[0]['text'], newline='')))
    assert len(rows) == expected[tool] + 1, tool
    assert rows[0] == result['columns'], tool
    assert all(len(row) == len(rows[0]) for row in rows), tool
    assert rows[1:] == [[str(value) for value in row] for row in result['rows']], tool
    flags = list(csv.reader(io.StringIO(outputs[1]['text'], newline='')))
    assert len(flags) == len(result['findings']) + 1, tool
    manifest = json.loads(outputs[3]['text'])
    assert all(manifest['privacy'][name] is False for name in ['storage', 'telemetry', 'target_fetch', 'upload']), tool
    assert manifest['counts']['result_rows'] == expected[tool], tool
    assert outputs[2]['text'].startswith('# '), tool
    assert 'Scope' in outputs[2]['text'], tool
    checks.append({'name': tool + ': independent CSV/JSON/Markdown readback', 'pass': True,
                   'result_rows': len(rows) - 1, 'finding_rows': len(flags) - 1})

robots = data['results']['robots-txt-tester']['rows']
assert robots[1][1] == 'Blocked by supplied rule'
assert robots[2][1] == 'Allowed by supplied rules'
assert robots[3][1] == 'Allowed by supplied rules'  # specific Googlebot group overrides *
redirects = {row[0]: row for row in data['results']['redirect-map-checker']['rows']}
assert redirects['https://example.test/old'][4] == 2
assert redirects['https://example.test/old'][5] == 'https://example.test/new'
assert redirects['https://example.test/a'][3] == 'Loop'
assert 'https://example.test/conflict' not in redirects
assert all(row[3] in [404, 410] for row in data['results']['broken-link-task-builder']['rows'])
assert data['results']['seo-crawl-comparison']['scope']['coverage'] == 'UNKNOWN'
checks.append({'name': 'decisive sample decisions match explicit golden expectations', 'pass': True})

formula = list(csv.reader(io.StringIO(data['formula'], newline='')))
assert formula[1] == ['a,"b"\nsecond', 'café']
assert formula[2] == ["'=1", "'@SUM(1)"]
checks.append({'name': 'independent CSV quotes, newlines, Unicode and formula defense', 'pass': True})
report = {'state': 'PASS', 'observed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'python': platform.python_version(), 'checks': checks,
          'scope': 'synthetic exported files only; no browser, deployment or human pilot claim'}
(base / 'ORACLE-EVIDENCE.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'state': 'PASS', 'checks': len(checks), 'python': platform.python_version()}))

"""Independent UTF-8 Expat/ElementTree + CSV oracle; imports no product code."""
from pathlib import Path
import xml.etree.ElementTree as ET
import pyexpat, csv, io, json, hashlib, platform, datetime
base=Path(__file__).resolve().parent
p=base/'R3-REGRESSION-EVIDENCE.json'; data=json.loads(p.read_text()); checks=[]
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
for c in data['cases']:
    try:
        root=ET.fromstring(c['xml'].encode('utf-8'))
    except ET.ParseError as e:
        assert not c['well_formed'], c['name']
        checks.append({'name':c['name'],'status':'PASS','oracle_error':str(e),'product_error':c['product_error'],'utf8_sha256':hashlib.sha256(c['xml'].encode()).hexdigest()})
    else:
        assert c['well_formed'], c['name']
        urls=[loc.text for loc in root.findall('s:url/s:loc',ns)]
        assert urls==c['urls'], c['name']
        checks.append({'name':c['name'],'status':'PASS','urls':urls})
for r in data['roundTrips']:
    root=ET.fromstring(r['xml'].encode('utf-8'))
    assert [loc.text for loc in root.findall('s:url/s:loc',ns)]==r['urls']
    assert root.find('.//s:lastmod',ns) is None
    rows=list(csv.DictReader(io.StringIO(r['csv'],newline='')))
    assert rows==[],r['name']
    manifest=json.loads(json.dumps(r['manifest']))
    assert manifest['ruleset']=='base2026.sitemap-local/1.0.2' and manifest['counts']['included']==1
    assert 'Ruleset: base2026.sitemap-local/1.0.2' in r['report']
    checks.append({'name':'export readback '+r['name'],'status':'PASS','xml_sha256':hashlib.sha256(r['xml'].encode()).hexdigest()})
out={'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'oracle':f'Python {platform.python_version()}, {pyexpat.EXPAT_VERSION}, ElementTree and csv.DictReader','source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'checks':checks,'passed':len(checks),'failed':0}
(base/'R3-ORACLE-EVIDENCE.json').write_text(json.dumps(out,indent=2)+'\n')
print(f'{len(checks)} R3 independent UTF-8 XML/export oracle checks PASS')

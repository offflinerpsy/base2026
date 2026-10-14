"""Loopback-only preview of the supplied assets with production CSP headers."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os

ROOT = Path(__file__).resolve().parent
CSP = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; worker-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'application/javascript', '.woff2': 'font/woff2'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'assets'), **kwargs)
    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def list_directory(self, path):
        self.send_error(404)
        return None

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
record = {'pid': os.getpid(), 'url': 'http://127.0.0.1:' + str(server.server_port), 'asset_root': str(ROOT / 'assets'),
          'scope': 'five new tool pages only; shared homepage/catalog/P1 and policy routes require root integration', 'csp': CSP}
(ROOT / 'PREVIEW-RUNTIME.json').write_text(json.dumps(record, indent=2) + '\n')
os.chmod(ROOT / 'PREVIEW-RUNTIME.json', 0o600)
print(json.dumps(record), flush=True)
server.serve_forever()

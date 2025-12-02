import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import os
import json

# 環境変数から読み込み、なければデフォルト値を使用
HA_HOST = os.environ.get('HA_HOST', 'homeassistant-c79dr.taila92268.ts.net')
HA_TOKEN = os.environ.get('HA_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyOGZkMDAxYTA0YzM0YmNmYjZmNDRiYmQ4NTRiNDE2MiIsImlhdCI6MTc2NDU2NjQzNCwiZXhwIjoyMDc5OTI2NDM0fQ.oNFT02bsTReNQOFsue9VbusD_vHZiGW9dvIixOs-mr8')
PORT = 8000

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 1. Provide config endpoint
        if self.path == '/config':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            config = {
                'HA_HOST': HA_HOST,
                'HA_TOKEN': HA_TOKEN
            }
            self.wfile.write(json.dumps(config).encode())
            return

        # 2. Proxy API requests
        if self.path.startswith('/api/'):
            target_url = f'https://{HA_HOST}{self.path}'
            print(f'Proxying {self.path} to {target_url}')
            
            try:
                # Create request with original headers
                req = urllib.request.Request(target_url)
                for key, value in self.headers.items():
                    if key.lower() != 'host': # Don't forward host header
                        req.add_header(key, value)
                
                # Fetch from Home Assistant
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.status)
                    for key, value in response.headers.items():
                        self.send_header(key, value)
                    self.end_headers()
                    self.wfile.write(response.read())
                    
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                print(f'Proxy Error: {e}')
                self.send_error(500, str(e))
            return

        # 3. Serve Static Files
        return super().do_GET()

print(f"Starting Python Proxy Server at http://localhost:{PORT}")
print(f"Proxying API requests to https://{HA_HOST}")
print(f"Using HA_TOKEN: {HA_TOKEN[:20]}..." if HA_TOKEN else "No HA_TOKEN set")

with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server")
        httpd.server_close()

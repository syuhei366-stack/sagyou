import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import os

HA_HOST = 'homeassistant-c79dr.taila92268.ts.net'
PORT = 8000

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 1. Proxy API requests
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

        # 2. Serve Static Files
        return super().do_GET()

print(f"Starting Python Proxy Server at http://localhost:{PORT}")
print(f"Proxying API requests to https://{HA_HOST}")

with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server")
        httpd.server_close()

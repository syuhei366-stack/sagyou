const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const HA_HOST = 'homeassistant-c79dr.taila92268.ts.net';
const PORT = 8000;

const MIMES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // 1. Proxy API requests to Home Assistant
    if (req.url.startsWith('/api/')) {
        const options = {
            hostname: HA_HOST,
            port: 443,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                host: HA_HOST // Important: Set host header to target
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            // Forward status and headers
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error('Proxy Error:', e);
            res.writeHead(502);
            res.end('Bad Gateway');
        });

        req.pipe(proxyReq);
        return;
    }

    // 2. Serve Static Files
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const ext = path.extname(filePath);
    const contentType = MIMES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n--- Local Proxy Server Running ---`);
    console.log(`Open http://localhost:${PORT} in your browser`);
    console.log(`API requests will be proxied to https://${HA_HOST}\n`);
});

/**
 * Multi-locale development proxy
 *
 * Spawns two Docusaurus dev servers (English + zh-Hans) and exposes a single
 * reverse-proxy on port 3000 that routes /zh-Hans/* requests to the Chinese
 * server and everything else to the English server.
 *
 * Usage:  yarn dev          (via package.json script)
 *    or:  node scripts/dev-i18n.js
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const PROXY_PORT = 3000;
const EN_PORT = 3001;
const ZH_PORT = 3002;
const ROOT = path.resolve(__dirname, '..');

// Track which locale each WebSocket client belongs to via Referer on upgrade
let wsLocaleMap = new WeakMap();

// ── Helpers ──────────────────────────────────────────────────────────────

function isZhHans(url) {
  return url && url.startsWith('/zh-Hans');
}

function targetPort(req) {
  // For WebSocket upgrades, the URL is always /ws regardless of locale.
  // Use the Referer header to decide which backend to proxy to.
  if (req.url === '/ws') {
    const referer = req.headers['referer'] || '';
    return referer.includes('/zh-Hans') ? ZH_PORT : EN_PORT;
  }
  return isZhHans(req.url) ? ZH_PORT : EN_PORT;
}

function proxyRequest(req, res, port) {
  const opts = {
    hostname: 'localhost',
    port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${port}` },
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end(`Proxy error (port ${port}): ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
}

// Low-level TCP tunnel for WebSocket — avoids any framing issues
function proxyUpgrade(req, clientSocket, head, port) {
  const serverSocket = net.connect(port, 'localhost', () => {
    // Rebuild the raw HTTP upgrade request
    let rawReq = `${req.method} ${req.url} HTTP/1.1\r\n`;
    for (const [key, val] of Object.entries(req.headers)) {
      rawReq += `${key}: ${val}\r\n`;
    }
    rawReq += '\r\n';

    serverSocket.write(rawReq);
    if (head && head.length) serverSocket.write(head);

    // Bi-directional pipe
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', () => clientSocket.destroy());
  clientSocket.on('error', () => serverSocket.destroy());
}

// ── Spawn dev servers ────────────────────────────────────────────────────

function launchDocusaurus(locale, port) {
  const args = ['docusaurus', 'start', '--port', String(port), '--no-open'];
  if (locale) args.push('--locale', locale);

  // Each locale gets its own .docusaurus generated-files directory to avoid
  // race conditions when both servers write concurrently.
  const genDir = locale ? `.docusaurus-${locale}` : '.docusaurus';

  const child = spawn('yarn', args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none', DOCUSAURUS_GENERATED_FILES_DIR_NAME: genDir },
  });

  const label = locale || 'en';

  child.stdout.on('data', (d) => {
    for (const line of d.toString().split('\n')) {
      const t = line.trim();
      if (t) console.log(`  [${label}] ${t}`);
    }
  });
  child.stderr.on('data', (d) => {
    for (const line of d.toString().split('\n')) {
      const t = line.trim();
      if (t) console.error(`  [${label}] ${t}`);
    }
  });
  child.on('exit', (code) => {
    console.log(`  [${label}] exited (code ${code})`);
    process.exit(code ?? 1);
  });

  return child;
}

// ── Main ─────────────────────────────────────────────────────────────────

const enChild = launchDocusaurus(null, EN_PORT);
const zhChild = launchDocusaurus('zh-Hans', ZH_PORT);

const proxy = http.createServer((req, res) => {
  proxyRequest(req, res, targetPort(req));
});

proxy.on('upgrade', (req, socket, head) => {
  proxyUpgrade(req, socket, head, targetPort(req));
});

proxy.listen(PROXY_PORT, () => {
  console.log('');
  console.log('  \x1b[36m✦ Multi-locale dev proxy running\x1b[0m');
  console.log(`    English  →  http://localhost:${PROXY_PORT}/`);
  console.log(`    中文     →  http://localhost:${PROXY_PORT}/zh-Hans/`);
  console.log('');
  console.log('  Locale switching in the navbar works seamlessly.');
  console.log('  Both servers have hot-reload enabled.');
  console.log('');
});

// ── Cleanup ──────────────────────────────────────────────────────────────

function cleanup() {
  enChild.kill();
  zhChild.kill();
  proxy.close();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

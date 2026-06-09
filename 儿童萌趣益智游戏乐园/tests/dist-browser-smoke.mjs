import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = resolve(projectRoot, 'dist');
const missingResources = [];

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function toDistPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const resolvedPath = resolve(distRoot, cleanPath || 'index.html');
  const distPrefix = distRoot.endsWith(sep) ? distRoot : `${distRoot}${sep}`;
  if (resolvedPath !== distRoot && !resolvedPath.startsWith(distPrefix)) {
    return null;
  }
  return resolvedPath;
}

function createDistServer() {
  return createServer((request, response) => {
    const requestPath = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    let filePath = toDistPath(requestPath);

    if (!filePath || !existsSync(filePath)) {
      missingResources.push(requestPath);
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(`Missing ${requestPath}`);
      return;
    }

    if (statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const ext = extname(filePath);
    response.writeHead(200, {
      'content-type': mimeByExt[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(readFileSync(filePath));
  });
}

if (!existsSync(join(distRoot, 'index.html'))) {
  throw new Error(`Run npm run build before dist smoke test: ${normalize(distRoot)}`);
}

const server = createDistServer();
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const appUrl = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mobile-home-header', { timeout: 10000 });
  await page.waitForSelector('#shortcut-backpack', { timeout: 10000 });

  const result = await page.evaluate(() => ({
    title: document.title,
    appMounted: document.documentElement.dataset.appMounted,
    diagnosticsVisible: Boolean(document.getElementById('app-boot-diagnostics')),
    headerVisible: Boolean(document.getElementById('mobile-home-header')),
    shortcutVisible: Boolean(document.getElementById('shortcut-backpack')),
  }));

  console.log(JSON.stringify({
    ...result,
    missingResources,
    consoleErrors,
    pageErrors,
  }, null, 2));

  if (result.appMounted !== 'true') {
    throw new Error('Expected production dist app to mark itself as mounted');
  }
  if (result.diagnosticsVisible) {
    throw new Error('Boot diagnostics should not appear for a healthy production dist load');
  }
  if (missingResources.length > 0) {
    throw new Error(`Production dist requested missing resources: ${missingResources.join(', ')}`);
  }
  if (pageErrors.length > 0) {
    throw new Error(`Production dist raised page errors: ${pageErrors.join(' | ')}`);
  }
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}

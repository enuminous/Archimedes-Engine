/* Optional real-browser suite. Supplied for reproduction; not executed in the build environment.
   npm install --no-save playwright && npx playwright install chromium
   node tests/browser.cjs
*/
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!(file === root || file.startsWith(root + path.sep))) { res.writeHead(403); res.end(); return; }
  const target = file === root ? path.join(root, 'index.html') : file;
  try { res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream'); res.end(fs.readFileSync(target)); }
  catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await page.locator('#agents .agent').first().waitFor();
    assert.equal(await page.locator('#metric-c').textContent(), '1.000');
    await page.locator('#step').click(); assert.equal(await page.locator('#clock').textContent(), 't = 0.1 s');
    await page.locator('#explore').click(); await page.locator('#future-results').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#alternatives button').count(), 4);
    await page.locator('#alternatives button').last().click(); await page.locator('#apply').click();
    assert.equal(await page.locator('#intention').inputValue(), 'recharge');
    await page.locator('[data-intervene="pulse"]').click();
    assert.match(await page.locator('#journal').textContent(), /pulse injected/);
    await page.locator('#explore').click(); await page.locator('#future-results').waitFor({ state: 'visible' });
    fs.mkdirSync(path.join(root, 'results/browser'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'results/browser/desktop.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    const downloadPromise = page.waitForEvent('download'); await page.locator('#export').click();
    const download = await downloadPromise, exported = path.join(root, 'results/browser/export.json'); await download.saveAs(exported);
    await page.locator('#step').click(); await page.locator('#import-file').setInputFiles(exported);
    await page.getByText('Session restored.', { exact: true }).waitFor();
    const priorClock = await page.locator('#clock').textContent();
    await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"bad":1}') });
    await page.locator('#toast').filter({ hasText: 'Import rejected' }).waitFor(); assert.equal(await page.locator('#clock').textContent(), priorClock);
    await page.getByRole('button', { name: 'Mathematics', exact: true }).click(); assert.ok(await page.locator('#mathematics').isVisible());
    await page.getByRole('button', { name: 'Operators', exact: true }).click(); assert.equal(await page.locator('#operator-list article').count(), 6);
    await page.getByRole('button', { name: 'Laboratory', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.screenshot({ path: path.join(root, 'results/browser/mobile.png'), fullPage: true });
    const offline = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
    const filePage = await offline.newPage(); filePage.on('pageerror', e => errors.push(e.message));
    await filePage.goto(pathToFileURL(path.join(root, 'Archimedes-Engine.html')).href);
    await filePage.locator('#step').click(); assert.equal(await filePage.locator('#clock').textContent(), 't = 0.1 s');
    assert.deepEqual(errors, []); console.log('Browser interaction, layout-boundary, import/export and standalone checks passed. Inspect screenshots separately.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });

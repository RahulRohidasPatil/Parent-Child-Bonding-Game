import { chromium } from 'playwright-core';

export async function open() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 2400, height: 2400 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('response', r => { if (r.status() >= 400) console.log('http', r.status(), r.url()); });
  await page.goto('http://127.0.0.1:8765/bake/bake.html');
  await page.waitForFunction(() => document.title === 'ready');
  return {
    async shoot(job, path) {
      const info = await page.evaluate(j => window.run(j), job);
      await page.locator('canvas').screenshot({ path, omitBackground: true });
      return info;
    },
    close: () => browser.close(),
  };
}

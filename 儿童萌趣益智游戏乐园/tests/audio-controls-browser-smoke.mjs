import { chromium } from 'playwright';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.waitForSelector('#music-mute-toggle-btn', { timeout: 10000 });
  await page.waitForSelector('#sound-mute-toggle-btn', { timeout: 10000 });

  const initial = await page.evaluate(() => ({
    music: localStorage.getItem('kids_applet_music_muted'),
    effects: localStorage.getItem('kids_applet_effects_muted'),
  }));

  await page.locator('#music-mute-toggle-btn').click();
  const afterMusicToggle = await page.evaluate(() => ({
    music: localStorage.getItem('kids_applet_music_muted'),
    effects: localStorage.getItem('kids_applet_effects_muted'),
    musicLabel: document.getElementById('music-mute-toggle-btn')?.getAttribute('aria-label'),
    effectsLabel: document.getElementById('sound-mute-toggle-btn')?.getAttribute('aria-label'),
  }));

  await page.locator('#sound-mute-toggle-btn').click();
  const afterEffectsToggle = await page.evaluate(() => ({
    music: localStorage.getItem('kids_applet_music_muted'),
    effects: localStorage.getItem('kids_applet_effects_muted'),
    musicLabel: document.getElementById('music-mute-toggle-btn')?.getAttribute('aria-label'),
    effectsLabel: document.getElementById('sound-mute-toggle-btn')?.getAttribute('aria-label'),
  }));

  const result = {
    initial,
    afterMusicToggle,
    afterEffectsToggle,
  };

  console.log(JSON.stringify(result, null, 2));

  if (afterMusicToggle.music !== 'true') {
    throw new Error('Expected music toggle to mute background music');
  }

  if (afterMusicToggle.effects === 'true') {
    throw new Error('Expected music toggle not to mute effects');
  }

  if (afterEffectsToggle.effects !== 'true') {
    throw new Error('Expected effects toggle to mute sound effects');
  }
} finally {
  await browser.close();
}

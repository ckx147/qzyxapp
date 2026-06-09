import { chromium } from 'playwright';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function closeBlockingModals(page) {
  for (let i = 0; i < 3; i++) {
    const achievementButton = page.locator('#achievement-alert-root button').last();
    if (await achievementButton.count()) {
      await achievementButton.click({ force: true });
      await page.waitForTimeout(200);
    }

    const rewardButton = page.locator('#reward-claimed-modal button').last();
    if (await rewardButton.count()) {
      await rewardButton.click({ force: true });
      await page.waitForTimeout(200);
    }
  }
}

async function isMostlyVisible(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.top < viewHeight * 0.8;
  });
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#shortcut-backpack', { timeout: 10000 });
  await closeBlockingModals(page);

  await page.locator('#shortcut-route').click();
  await page.waitForSelector('#games-selection-tab', { timeout: 10000 });
  const routeVisible = await page.locator('#games-selection-tab').count() > 0;

  await page.locator('#tab-btn-home').click();
  await page.waitForSelector('#shortcut-stamps', { timeout: 10000 });
  await page.locator('#shortcut-stamps').click();
  await page.waitForSelector('#profile-detailed-tab', { timeout: 10000 });
  await page.waitForSelector('#achievements-gallery-module', { timeout: 10000 });
  const stampsVisible = await page.locator('#achievements-gallery-module').count() > 0;

  await page.locator('#tab-btn-home').click();
  await page.waitForSelector('#shortcut-backpack', { timeout: 10000 });
  await page.locator('#shortcut-backpack').click();
  await page.waitForFunction(() => {
    const target = document.getElementById('inventory-or-shop-container');
    if (!target) return false;
    const rect = target.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.top < viewHeight * 0.8;
  }, null, { timeout: 10000 });
  const backpackVisible = await isMostlyVisible(page, '#inventory-or-shop-container');

  const result = {
    routeVisible,
    stampsVisible,
    backpackVisible,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.backpackVisible) {
    throw new Error('Expected backpack shortcut to scroll inventory into view');
  }
} finally {
  await browser.close();
}

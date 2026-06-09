import { chromium } from 'playwright';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function closeBlockingModals(page) {
  for (let i = 0; i < 3; i++) {
    const achievementButton = page.locator('#achievement-alert-root button').last();
    if (await achievementButton.count()) {
      await achievementButton.click({ force: true });
      await page.waitForTimeout(300);
    }

    const rewardButton = page.locator('#reward-claimed-modal button').last();
    if (await rewardButton.count()) {
      await rewardButton.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
}

async function readProfile(page) {
  return JSON.parse(await page.evaluate(() => localStorage.getItem('kid_games_profile')));
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#btn-day-checkin', { timeout: 10000 });
  await closeBlockingModals(page);

  let profile = await readProfile(page);
  const beforeCheckIn = profile.points;

  await page.click('#btn-day-checkin');
  await page.waitForTimeout(500);
  profile = await readProfile(page);
  const afterCheckIn = profile.points;

  await closeBlockingModals(page);
  await page.click('#btn-snack-shop');
  await page.waitForTimeout(300);
  await page.locator('#inventory-or-shop-container button').first().click();
  await page.waitForTimeout(500);

  profile = await readProfile(page);
  const afterBuyCandy = profile.points;

  const result = {
    beforeCheckIn,
    afterCheckIn,
    checkInDelta: afterCheckIn - beforeCheckIn,
    afterBuyCandy,
    buyCandyDelta: afterBuyCandy - afterCheckIn,
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.checkInDelta !== 20) {
    throw new Error(`Expected daily check-in to add 20 points, got ${result.checkInDelta}`);
  }

  if (result.buyCandyDelta !== -15) {
    throw new Error(`Expected first snack purchase to deduct 15 points, got ${result.buyCandyDelta}`);
  }
} finally {
  await browser.close();
}

import { chromium } from 'playwright';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function closeBlockingModals(page) {
  for (let i = 0; i < 4; i++) {
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

async function readProfile(page) {
  return JSON.parse(await page.evaluate(() => localStorage.getItem('kid_games_profile')));
}

async function readAchievements(page) {
  return JSON.parse(await page.evaluate(() => localStorage.getItem('kid_games_achievements')));
}

async function setRandomQueue(page, values) {
  await page.evaluate((queueValues) => {
    window.__originalMathRandomForGameSmoke = window.__originalMathRandomForGameSmoke || Math.random;
    const queue = [...queueValues];
    Math.random = () => (queue.length ? queue.shift() : 0);
  }, values);
}

async function restoreRandom(page) {
  await page.evaluate(() => {
    if (window.__originalMathRandomForGameSmoke) {
      Math.random = window.__originalMathRandomForGameSmoke;
      delete window.__originalMathRandomForGameSmoke;
    }
  });
}

async function openGamesHub(page) {
  await closeBlockingModals(page);
  await page.getByRole('button', { name: /游戏堡/ }).click();
  await page.waitForSelector('#games-selection-tab', { timeout: 10000 });
}

async function openGame(page, cardSelector) {
  await openGamesHub(page);
  await page.locator(cardSelector).click();
  await page.waitForTimeout(300);
}

async function clickBombKeypad(page, value) {
  for (const digit of String(value)) {
    await page.locator('#kids-bomb-keypad button', { hasText: digit }).click();
  }
  await page.locator('#btn-guess-submit').click();
}

async function testBomb(page) {
  await openGame(page, '#launch-bomb-game-card');
  await page.waitForSelector('#bomb-game-module');
  await setRandomQueue(page, [0.5, 0]);

  const before = (await readProfile(page)).points;
  await page.getByRole('button', { name: /开启拆雷派对/ }).click({ force: true });
  await page.waitForSelector('#bomb-play-view');
  await clickBombKeypad(page, 51);
  await page.waitForSelector('#bomb-exploded-panel', { timeout: 10000 });
  await closeBlockingModals(page);
  await page.getByRole('button', { name: /我已经完成了有趣的运动惩罚/ }).click({ force: true });
  await page.waitForSelector('#bomb-intro-view', { timeout: 10000 });
  await restoreRandom(page);

  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before };
}

async function testBombAiClear(page) {
  await openGame(page, '#launch-bomb-game-card');
  await page.waitForSelector('#bomb-game-module');
  await setRandomQueue(page, [0.5, 0.08]);

  const before = (await readProfile(page)).points;
  await page.getByRole('button', { name: /开启拆雷派对/ }).click({ force: true });
  await page.waitForSelector('#bomb-play-view');
  await clickBombKeypad(page, 25);
  await page.waitForSelector('#bomb-cleared-panel', { timeout: 10000 });
  await restoreRandom(page);

  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before };
}

async function solveKlotski3x3(page) {
  const state = await page.locator('#klotski-wood-board button').evaluateAll((buttons) =>
    buttons.map((button) => Number(button.textContent.trim() || '0'))
  );
  const target = '1,2,3,4,5,6,7,8,0';
  const start = state.join(',');
  if (start === target) return [];

  const neighbors = (serialized) => {
    const current = serialized.split(',').map(Number);
    const empty = current.indexOf(0);
    const row = Math.floor(empty / 3);
    const col = empty % 3;
    const result = [];
    for (const offset of [-3, 3, -1, 1]) {
      const next = empty + offset;
      if (next < 0 || next > 8) continue;
      const nextRow = Math.floor(next / 3);
      const nextCol = next % 3;
      if (Math.abs(row - nextRow) + Math.abs(col - nextCol) !== 1) continue;
      const copy = [...current];
      const tile = copy[next];
      copy[empty] = tile;
      copy[next] = 0;
      result.push({ serialized: copy.join(','), tile });
    }
    return result;
  };

  const queue = [{ serialized: start, path: [] }];
  const seen = new Set([start]);

  while (queue.length) {
    const current = queue.shift();
    for (const next of neighbors(current.serialized)) {
      if (seen.has(next.serialized)) continue;
      const path = [...current.path, next.tile];
      if (next.serialized === target) return path;
      seen.add(next.serialized);
      queue.push({ serialized: next.serialized, path });
    }
  }

  throw new Error(`No Klotski solution found for ${start}`);
}

async function testKlotski(page) {
  await openGame(page, '#launch-klotski-game-card');
  await page.waitForSelector('#klotski-game-module');
  const before = (await readProfile(page)).points;
  await page.getByRole('button', { name: /打乱木块/ }).click();
  await page.waitForSelector('#klotski-active-screen');
  const path = await solveKlotski3x3(page);
  for (const tile of path) {
    await page.locator('#klotski-wood-board button', { hasText: String(tile) }).click();
    await page.waitForTimeout(20);
  }
  await page.waitForSelector('text=恭喜你！成功解开！', { timeout: 10000 });
  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before, moves: path.length };
}

async function testSchulte(page) {
  await openGame(page, '#launch-schulte-game-card');
  await page.waitForSelector('#schulte-game-module');
  const before = (await readProfile(page)).points;
  await page.getByRole('button', { name: /开启专注力加速器/ }).click();
  await page.waitForSelector('#schulte-tile-board');

  for (let next = 1; next <= 9; next++) {
    await page.locator('#schulte-tile-board button', { hasText: String(next) }).click();
    await page.waitForTimeout(30);
  }

  await page.waitForSelector('text=专注大闯关成功', { timeout: 10000 });
  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before };
}

async function testGomoku(page) {
  await openGame(page, '#launch-gomoku-game-card');
  await page.waitForSelector('#gomoku-game-module');
  await page.locator('#btn-mode-pvp').click();
  await page.waitForTimeout(200);

  const before = (await readProfile(page)).points;
  const moves = [
    [0, 0], [1, 0],
    [0, 1], [1, 1],
    [0, 2], [1, 2],
    [0, 3], [1, 3],
    [0, 4],
  ];

  for (const [row, col] of moves) {
    await page.locator(`#cell-${row}-${col}`).click();
    await page.waitForTimeout(60);
  }

  await page.waitForSelector('text=黑子队连成一线获胜', { timeout: 10000 });
  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before };
}

async function gomokuPieceCount(page) {
  return page.locator('#gomoku-fruit-board > div').evaluateAll((cells) =>
    cells.filter((cell) => cell.querySelector('.rounded-full.bg-gradient-to-br')).length
  );
}

async function waitForPieceCount(page, count) {
  await page.waitForFunction((expectedCount) => {
    const cells = Array.from(document.querySelectorAll('#gomoku-fruit-board > div'));
    return cells.filter((cell) => cell.querySelector('.rounded-full.bg-gradient-to-br')).length >= expectedCount;
  }, count, { timeout: 10000 });
}

async function testGomokuWhiteWin(page) {
  await openGame(page, '#launch-gomoku-game-card');
  await page.waitForSelector('#gomoku-game-module');
  await page.locator('#btn-mode-pvp').click();
  await page.waitForTimeout(200);

  const before = (await readProfile(page)).points;
  const moves = [
    [10, 10], [0, 0],
    [9, 10], [0, 1],
    [8, 10], [0, 2],
    [7, 10], [0, 3],
    [6, 9], [0, 4],
  ];

  for (const [row, col] of moves) {
    const beforeMoveCount = await gomokuPieceCount(page);
    await page.locator(`#cell-${row}-${col}`).click();
    await waitForPieceCount(page, beforeMoveCount + 1);
  }

  await page.waitForSelector('text=白子队连成一线获胜', { timeout: 15000 });
  const after = (await readProfile(page)).points;
  return { before, after, delta: after - before };
}

async function testAchievementClaimOnce(page) {
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('kid_games_profile'));
    const achievements = JSON.parse(localStorage.getItem('kid_games_achievements'));
    const checkIn = JSON.parse(localStorage.getItem('kid_games_checkin'));
    const target = achievements.find((achievement) => achievement.id === 'ach_checkin_1');

    profile.points = 500;
    checkIn.unlockedItems = ['糖果'];
    checkIn.streak = Math.max(checkIn.streak || 0, 1);
    target.unlocked = true;
    target.rewardsClaimed = false;
    target.progress = 1;
    target.tier = 1;
    target.targetValue = 1;

    localStorage.setItem('kid_games_profile', JSON.stringify(profile));
    localStorage.setItem('kid_games_achievements', JSON.stringify(achievements));
    localStorage.setItem('kid_games_checkin', JSON.stringify(checkIn));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await closeBlockingModals(page);

  const before = (await readProfile(page)).points;
  await page.locator('#tab-btn-profile').click();
  await page.waitForSelector('#achievements-gallery-module');
  await page.getByRole('button', { name: /开启【青铜级】晋级宝盒/ }).first().click({ force: true });
  await page.waitForFunction(() => {
    const profile = JSON.parse(localStorage.getItem('kid_games_profile'));
    return profile.points === 550;
  }, null, { timeout: 10000 });

  const afterFirstClaim = (await readProfile(page)).points;
  await page.waitForTimeout(500);
  const claimButtonsAfter = await page.getByRole('button', { name: /开启【青铜级】晋级宝盒/ }).count();
  const afterSecondAttempt = (await readProfile(page)).points;
  const achievement = (await readAchievements(page)).find((item) => item.id === 'ach_checkin_1');

  return {
    before,
    afterFirstClaim,
    afterSecondAttempt,
    firstDelta: afterFirstClaim - before,
    secondDelta: afterSecondAttempt - afterFirstClaim,
    claimButtonsAfter,
    nextTier: achievement.tier,
    unlockedAfterClaim: achievement.unlocked,
  };
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await closeBlockingModals(page);

  const result = {
    bomb: await testBomb(page),
    bombAiClear: await testBombAiClear(page),
    klotski: await testKlotski(page),
    schulte: await testSchulte(page),
    gomoku: await testGomoku(page),
    gomokuWhiteWin: await testGomokuWhiteWin(page),
    achievementClaim: await testAchievementClaimOnce(page),
  };

  console.log(JSON.stringify(result, null, 2));

  const expected = {
    bomb: 10,
    bombAiClear: 50,
    klotski: 80,
    schulte: 60,
    gomoku: 50,
    gomokuWhiteWin: 50,
  };

  for (const [game, delta] of Object.entries(expected)) {
    if (result[game].delta !== delta) {
      throw new Error(`Expected ${game} to change points by ${delta}, got ${result[game].delta}`);
    }
  }

  if (result.achievementClaim.firstDelta !== 50) {
    throw new Error(`Expected first achievement claim to add 50 points, got ${result.achievementClaim.firstDelta}`);
  }

  if (result.achievementClaim.secondDelta !== 0 || result.achievementClaim.nextTier !== 2 || result.achievementClaim.unlockedAfterClaim) {
    throw new Error(`Achievement claim did not advance exactly once: ${JSON.stringify(result.achievementClaim)}`);
  }
} finally {
  try {
    const pages = browser.contexts().flatMap((context) => context.pages());
    await Promise.all(pages.map((page) => restoreRandom(page).catch(() => {})));
  } catch {}
  await browser.close();
}

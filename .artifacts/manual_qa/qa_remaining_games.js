const { chromium } = require("../../Frontend/node_modules/playwright");

async function openQa(page) {
  await page.goto("http://127.0.0.1:4174/qa.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__festivalDebug), null, {
    timeout: 15000,
  });
}

async function startScene(page, key) {
  await page.evaluate((sceneKey) => {
    window.__festivalDebug.startMiniGame(sceneKey);
  }, key);
  await page.waitForTimeout(1200);
}

async function resetToMap(page) {
  await page.evaluate(() => {
    window.__festivalDebug.resetToMap();
  });
  await page.waitForTimeout(1200);
}

async function clickCanvas(page, selector, points) {
  const canvas = page.locator(selector);
  await canvas.waitFor({ state: "visible", timeout: 10000 });
  const box = await canvas.boundingBox();
  for (const [xPct, yPct] of points) {
    await page.mouse.click(
      box.x + box.width * xPct,
      box.y + box.height * yPct,
    );
    await page.waitForTimeout(300);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const requests = [];

  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`console: ${msg.text()}`);
    }
  });
  page.on("response", (resp) => {
    if (resp.status() >= 400) {
      requests.push(`${resp.status()} ${resp.url()}`);
    }
  });

  try {
    await openQa(page);

    await startScene(page, "FishScoopingScene");
    await clickCanvas(page, "canvas", [[0.45, 0.5], [0.6, 0.55], [0.52, 0.7], [0.25, 0.8]]);
    await resetToMap(page);

    await startScene(page, "HorseDeliveryScene");
    await clickCanvas(page, "canvas", [[0.5, 0.5]]);
    for (let i = 0; i < 5; i += 1) {
      await clickCanvas(page, "canvas", [[0.65, 0.65]]);
      await page.waitForTimeout(800);
    }
    await resetToMap(page);

    await startScene(page, "WorshipBoothScene");
    await page.getByRole("button", { name: /ธูป/i }).click();
    await page.getByRole("button", { name: /เทียน/i }).click();
    await page.getByRole("button", { name: /ดอกบัว/i }).click();
    await page.getByRole("button", { name: /ขอพร/i }).click();
    await page.waitForTimeout(2000);

    await startScene(page, "BoxingGameScene");
    await page.getByRole("button", { name: /เริ่ม/i }).click();
    await page.waitForTimeout(31000);
    const card = page.locator("#bg-deck .bg-name-card").first();
    const zone = page.locator(".bg-drop-zone").first();
    await card.waitFor({ state: "visible", timeout: 15000 });
    await card.dragTo(zone);
    await page.waitForTimeout(2000);
    await resetToMap(page);

    await startScene(page, "DollGameScene");
    await page.locator("#dg-start-btn").click({ force: true });
    await page.waitForTimeout(5000);
    await clickCanvas(page, ".dg-canvas", [[0.55, 0.45], [0.62, 0.4], [0.48, 0.52]]);
    await page.keyboard.press("Space");
    await page.waitForTimeout(1500);
    await resetToMap(page);

    await startScene(page, "FlowerGameScene");
    await page.locator("#tutorialBtn").click();
    await page.locator("#closeTutorialBtn").click();
    await page.waitForTimeout(5500);
    await page.evaluate(() => {
      document.querySelector(".fl-customer")?.click();
    });
    await page.locator(".fl-btn").nth(0).click();
    await page.locator(".fl-btn").nth(1).click();
    await page.waitForTimeout(1000);
    await resetToMap(page);

    await startScene(page, "HauntedHouseScene");
    await page.locator("#start").click();
    await page.waitForTimeout(1200);
    await page.locator(".hh-hit").first().click();
    await page.waitForTimeout(1200);
    const secondHit = page.locator(".hh-hit").first();
    if (await secondHit.count()) {
      await secondHit.click();
    }
    await page.waitForTimeout(1200);
    await resetToMap(page);

    await startScene(page, "TugOfWarScene");
    await page.locator("#enter-game-btn").click();
    await page.waitForTimeout(1200);
    await page.locator(".rps-item").first().click();
    await page.waitForTimeout(1500);
    await page.waitForTimeout(2000);

    console.log(JSON.stringify({ ok: true, errors, requests }, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        { ok: false, error: error.message, errors, requests },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

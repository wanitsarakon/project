const { chromium } = require("../../Frontend/node_modules/playwright");

async function openQa(page) {
  await page.goto("http://127.0.0.1:4174/qa.html", { waitUntil: "domcontentloaded" });
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
  await page.waitForTimeout(1000);
}

async function clickCenter(page, selector) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible", timeout: 10000 });
  await locator.click({ force: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const requests = [];

  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("response", (resp) => {
    if (resp.status() >= 400) requests.push(`${resp.status()} ${resp.url()}`);
  });

  try {
    await openQa(page);

    await startScene(page, "FishScoopingScene");
    await page.mouse.click(400, 450);
    await page.waitForTimeout(5200);
    await page.mouse.move(480, 350);
    await page.waitForTimeout(400);
    await page.mouse.move(120, 480);
    await page.waitForTimeout(1200);
    await resetToMap(page);

    await startScene(page, "HorseDeliveryScene");
    await page.mouse.click(400, 450);
    await page.waitForTimeout(5200);
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press("Space");
      await page.waitForTimeout(900);
    }
    await resetToMap(page);

    await startScene(page, "WorshipBoothScene");
    await clickCenter(page, "#wb-start-btn");
    await page.waitForTimeout(5200);
    const sequences = await page.locator("#wb-sequence .wb-pill").allTextContents();
    for (const item of sequences) {
      if (item.includes("ธูป")) await clickCenter(page, '[data-step-id="incense"]');
      if (item.includes("เทียน")) await clickCenter(page, '[data-step-id="candle"]');
      if (item.includes("ดอกบัว")) await clickCenter(page, '[data-step-id="lotus"]');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(400);
    const moreRounds = 2;
    for (let round = 0; round < moreRounds; round += 1) {
      const nextSeq = await page.locator("#wb-sequence .wb-pill").allTextContents();
      for (const item of nextSeq) {
        if (item.includes("ธูป")) await clickCenter(page, '[data-step-id="incense"]');
        if (item.includes("เทียน")) await clickCenter(page, '[data-step-id="candle"]');
        if (item.includes("ดอกบัว")) await clickCenter(page, '[data-step-id="lotus"]');
        await page.waitForTimeout(300);
      }
    }
    await clickCenter(page, "#wb-pray");
    await page.waitForTimeout(600);
    await clickCenter(page, "#wb-finish-btn");

    console.log(JSON.stringify({ ok: true, errors, requests }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, error: error.message, errors, requests }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

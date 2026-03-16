const { chromium } = require("../../Frontend/node_modules/playwright");
const { ensureFrontendServer } = require("./server_helper");

const QA_BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/qa.html";

async function openQa(page) {
  await page.goto(QA_BASE_URL, { waitUntil: "domcontentloaded" });
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

async function completeWorshipRound(page) {
  await page.waitForFunction(() => {
    const pills = Array.from(document.querySelectorAll("#wb-sequence .wb-pill"));
    return pills.length > 0;
  });

  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const normalize = (value) => (value || "").replace(/\s+/g, "").trim();
    const pills = Array.from(document.querySelectorAll("#wb-sequence .wb-pill"));
    const buttons = Array.from(document.querySelectorAll("#wb-grid .wb-btn"));

    for (const pill of pills) {
      const label = normalize(pill.textContent);
      const target = buttons.find((btn) => normalize(btn.textContent).includes(label));
      if (target) {
        target.click();
        await wait(280);
      }
    }
  });
}

async function completeWorshipUntilReady(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const isReady = await page.evaluate(() => {
      const prayBtn = document.querySelector("#wb-pray");
      return Boolean(prayBtn && !prayBtn.disabled);
    });
    if (isReady) return;
    await completeWorshipRound(page);
    await page.waitForTimeout(500);
  }
}

async function run() {
  await ensureFrontendServer();
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
    await completeWorshipUntilReady(page);
    await clickCenter(page, "#wb-pray");
    await page.waitForFunction(() => {
      const result = document.querySelector("#wb-result");
      return result && getComputedStyle(result).display !== "none";
    });
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

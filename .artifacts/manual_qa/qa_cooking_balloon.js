const { chromium } = require("../../Frontend/node_modules/playwright");
const { ensureFrontendServer } = require("./server_helper");

const QA_BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/qa.html";

async function openQa(page) {
  await page.goto(QA_BASE_URL, { waitUntil: "networkidle" });
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
  await page.waitForTimeout(800);
}

async function run() {
  await ensureFrontendServer();
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

    await startScene(page, "CookingGameScene");
    await page.locator("#ck-btn-start").click({ force: true });
    await page.waitForTimeout(10000);
    const ingredient = page.locator(".ck-ingredient").first();
    await ingredient.waitFor({ state: "visible", timeout: 20000 });
    const bowl = page.locator("#ck-bowl");
    await ingredient.dragTo(bowl);
    await page.waitForTimeout(2000);
    await resetToMap(page);

    await startScene(page, "BalloonShootScene");
    await page.getByRole("button", { name: "เริ่มเกม" }).click();
    await page.waitForTimeout(5000);
    await page.keyboard.down("Space");
    await page.waitForTimeout(1200);
    await page.keyboard.up("Space");
    await page.waitForTimeout(1500);

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

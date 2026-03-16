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
  await page.waitForTimeout(1000);
}

async function ensureDir(path) {
  const fs = require("fs");
  fs.mkdirSync(path, { recursive: true });
}

async function run() {
  const fs = require("fs");
  await ensureFrontendServer();
  const shotsDir = "c:/Users/ppang/OneDrive/เอกสาร/project/.artifacts/manual_qa/shots";
  ensureDir(shotsDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  const requests = [];
  const notes = [];

  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("response", (resp) => {
    if (resp.status() >= 400) requests.push(`${resp.status()} ${resp.url()}`);
  });

  try {
    await openQa(page);

    await startScene(page, "CookingGameScene");
    await page.screenshot({ path: `${shotsDir}/cooking_start.png`, fullPage: true });
    await page.locator("#ck-btn-start").click({ force: true });
    await page.waitForTimeout(9000);
    await page.locator(".ck-ingredient").first().waitFor({ state: "visible", timeout: 20000 });
    await page.screenshot({ path: `${shotsDir}/cooking_live.png`, fullPage: true });

    const cookingMetrics = await page.evaluate(() => {
      const bowl = document.querySelector("#ck-bowl")?.getBoundingClientRect();
      const table = document.querySelector("#ck-table-decor")?.getBoundingClientRect();
      const area = document.querySelector("#ck-table-area")?.getBoundingClientRect();
      const npc = document.querySelector(".ck-npc-area")?.getBoundingClientRect();
      return { bowl, table, area, npc };
    });
    notes.push({ cookingMetrics });
    await resetToMap(page);

    for (const sceneKey of ["DollGameScene", "FlowerGameScene", "HauntedHouseScene"]) {
      await startScene(page, sceneKey);
      await page.screenshot({ path: `${shotsDir}/${sceneKey}.png`, fullPage: true });
      if (sceneKey === "DollGameScene") {
        await page.locator("#dg-start-btn").click({ force: true });
        await page.waitForTimeout(2500);
      }
      if (sceneKey === "FlowerGameScene") {
        const tutorialBtn = page.locator("#tutorialBtn");
        if (await tutorialBtn.count()) {
          await tutorialBtn.click({ force: true });
          await page.waitForTimeout(400);
          const closeBtn = page.locator("#closeTutorialBtn");
          if (await closeBtn.count()) await closeBtn.click({ force: true });
        }
      }
      if (sceneKey === "HauntedHouseScene") {
        await page.locator("#start").click({ force: true });
        await page.waitForTimeout(1000);
      }
      await resetToMap(page);
    }

    fs.writeFileSync(
      "c:/Users/ppang/OneDrive/เอกสาร/project/.artifacts/manual_qa/qa_zip_games_round2.json",
      JSON.stringify({ ok: true, errors, requests, notes }, null, 2),
    );
    console.log(JSON.stringify({ ok: true, errors, requests, notes }, null, 2));
  } catch (error) {
    fs.writeFileSync(
      "c:/Users/ppang/OneDrive/เอกสาร/project/.artifacts/manual_qa/qa_zip_games_round2.json",
      JSON.stringify({ ok: false, error: error.message, errors, requests, notes }, null, 2),
    );
    console.log(JSON.stringify({ ok: false, error: error.message, errors, requests, notes }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

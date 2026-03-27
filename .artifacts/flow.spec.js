const { test, expect } = require("playwright/test");

const APP_URL = "http://127.0.0.1:5173";
const SCENES = [
  "FishScoopingScene",
  "HorseDeliveryScene",
  "WorshipBoothScene",
  "BoxingGameScene",
  "CookingGameScene",
  "BalloonShootScene",
  "DollGameScene",
  "FlowerGameScene",
  "HauntedHouseScene",
  "TugOfWarScene",
];

async function enterAs(page, name, roleIndex) {
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.locator(".enter-btn").click();
  await page.locator(".name-input").fill(name);
  await page.locator(".role-btn").nth(roleIndex).click();
  await page.locator(".confirm-btn").click();
}

test("host/player flow reaches festival map and scenes start without page errors", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();

  const pageErrors = [];
  for (const page of [hostPage, playerPage]) {
    page.on("pageerror", (err) => {
      pageErrors.push(String(err));
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        pageErrors.push(msg.text());
      }
    });
  }

  await enterAs(hostPage, "HostA", 0);
  await hostPage.locator(".confirm-btn").click();
  await expect(hostPage.locator("text=Lobby")).toBeVisible();

  const roomCode = (
    await hostPage.locator("text=/^[0-9]{6}$/").innerText()
  ).trim();
  await hostPage.locator(".confirm-btn").click();

  await enterAs(playerPage, "PlayerA", 1);
  await playerPage
    .locator(".room-card")
    .filter({ hasText: roomCode })
    .locator("button")
    .click();

  await expect(playerPage.locator("text=Lobby")).toBeVisible();
  await hostPage.locator(".start-btn.big").click();

  await expect(hostPage.locator("text=Host Control")).toBeVisible();
  await expect(playerPage.locator("text=Festival Map")).toBeVisible();
  await playerPage.waitForFunction(() => !!window.__festivalDebug);

  await hostPage.getByRole("button", { name: "เริ่มรอบถัดไป" }).click();
  await playerPage.waitForTimeout(1200);

  const firstSceneActive = await playerPage.evaluate(() =>
    window.__festivalDebug.game.scene.isActive("FishScoopingScene")
  );
  expect(firstSceneActive).toBeTruthy();

  await playerPage.evaluate(() => window.__festivalDebug.resetToMap());
  await playerPage.waitForTimeout(600);

  for (const sceneKey of SCENES) {
    await playerPage.evaluate((scene) => {
      window.__festivalDebug.startMiniGame(scene);
    }, sceneKey);

    await playerPage.waitForTimeout(1200);

    const isActive = await playerPage.evaluate((scene) => {
      return window.__festivalDebug.game.scene.isActive(scene);
    }, sceneKey);

    expect(isActive, `${sceneKey} should become active`).toBeTruthy();

    await playerPage.evaluate(() => window.__festivalDebug.resetToMap());
    await playerPage.waitForTimeout(500);
  }

  expect(pageErrors).toEqual([]);

  await hostContext.close();
  await playerContext.close();
});

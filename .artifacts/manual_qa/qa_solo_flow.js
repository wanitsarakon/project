const { chromium } = require("../../Frontend/node_modules/playwright");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const API_BASE = process.env.QA_API_BASE || "http://127.0.0.1:18082";
const GAME_SEQUENCE = [
  "FishScoopingScene",
  "HorseDeliveryScene",
  "BoxingGameScene",
  "CookingGameScene",
  "BalloonShootScene",
  "DollGameScene",
  "FlowerGameScene",
  "HauntedHouseScene",
  "TugOfWarScene",
  "WorshipBoothScene",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJsonResponse(page, predicate, trigger) {
  const responsePromise = page.waitForResponse(predicate, { timeout: 20000 });
  await trigger();
  const response = await responsePromise;
  return response.json();
}

async function enterAs(page, name, role) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator(".temple-enter-btn").click();
  await page.locator(".festival-name-input").fill(name);

  if (role === "host") {
    await page.locator(".host-card").click();
  } else {
    await page.locator(".player-card").click();
  }

  await page.locator(".festival-confirm-btn").click();
}

async function createHostRoom(page) {
  await enterAs(page, "HostSolo", "host");
  await page.locator(".festival-choice-pill").first().click();
  await page.locator(".festival-room-input").first().fill("2");

  const data = await waitForJsonResponse(
    page,
    (response) =>
      response.url() === `${API_BASE}/rooms` &&
      response.request().method() === "POST",
    () => page.getByRole("button", { name: /สร้างห้อง/i }).click(),
  );

  await page.getByRole("button", { name: /Lobby/i }).click();
  return {
    roomCode: data.room_code,
    player: {
      id: data.player.id,
      name: data.player.name,
      isHost: true,
    },
  };
}

async function joinPlayer(page, name, roomCode) {
  await enterAs(page, name, "player");
  await page.locator(".festival-room-search-input").fill(roomCode);

  const data = await waitForJsonResponse(
    page,
    (response) =>
      response.url() === `${API_BASE}/rooms/join` &&
      response.request().method() === "POST",
    async () => {
      await page.getByRole("button", { name: /เข้าร่วม/i }).first().click();
    },
  );

  return {
    player: {
      id: data.player.id,
      name: data.player.name,
      isHost: false,
    },
  };
}

async function fetchProgress(page, roomCode, playerId) {
  return page.evaluate(
    async ({ apiBase, code, pid }) => {
      const res = await fetch(`${apiBase}/rooms/${code}/progress?player_id=${pid}`);
      return res.json();
    },
    { apiBase: API_BASE, code: roomCode, pid: playerId },
  );
}

async function completeGame(page, roomCode, playerId, gameKey, score) {
  return page.evaluate(
    async ({ apiBase, code, pid, key, points }) => {
      const res = await fetch(`${apiBase}/rooms/${code}/games/${key}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: pid,
          score: points,
          meta: {
            qa: true,
            source: "qa_solo_flow",
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, body };
    },
    { apiBase: API_BASE, code: roomCode, pid: playerId, key: gameKey, points: score },
  );
}

async function fetchSummary(page, roomCode) {
  return page.evaluate(
    async ({ apiBase, code }) => {
      const res = await fetch(`${apiBase}/rooms/${code}/summary`);
      return res.json();
    },
    { apiBase: API_BASE, code: roomCode },
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const requests = [];

  const attachLogging = (page, label) => {
    page.on("pageerror", (err) => {
      errors.push(`${label}: pageerror: ${err.message}`);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`${label}: console: ${msg.text()}`);
      }
    });
    page.on("response", (resp) => {
      const status = resp.status();
      if (status >= 400 && !resp.url().includes("favicon")) {
        requests.push(`${label}: ${status} ${resp.url()}`);
      }
    });
  };

  try {
    const hostPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const playerPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    attachLogging(hostPage, "host");
    attachLogging(playerPage, "player");

    const host = await createHostRoom(hostPage);
    const joined = await joinPlayer(playerPage, "SoloPlayer", host.roomCode);

    await hostPage.getByRole("button", { name: /เริ่มเกม/i }).click();

    await hostPage.waitForFunction(() => document.body.innerText.includes("Host Monitor"), null, {
      timeout: 20000,
    });
    await playerPage.waitForFunction(
      () =>
        document.body.innerText.includes("ความคืบหน้า")
        || document.body.innerText.includes("ซุ้มถัดไป"),
      null,
      { timeout: 20000 },
    );

    let expectedTotal = 0;
    for (let index = 0; index < GAME_SEQUENCE.length; index += 1) {
      const gameKey = GAME_SEQUENCE[index];
      const progress = await fetchProgress(playerPage, host.roomCode, joined.player.id);
      const me = progress?.me || {};

      if (!me.unlocked_games?.includes(gameKey) && !me.completed_games?.includes(gameKey)) {
        throw new Error(`solo player missing unlock for ${gameKey}`);
      }

      if (!me.completed_games?.includes(gameKey)) {
        const rawScore = (index + 1) * 17;
        const result = await completeGame(playerPage, host.roomCode, joined.player.id, gameKey, rawScore);
        if (!result.ok) {
          throw new Error(`complete ${gameKey} failed: ${JSON.stringify(result.body)}`);
        }
        expectedTotal += gameKey === "WorshipBoothScene" ? 0 : rawScore;
        await sleep(250);
      }
    }

    await hostPage.waitForFunction(
      () => document.body.innerText.includes("สรุปผู้ชนะ"),
      null,
      { timeout: 20000 },
    );
    await hostPage.getByRole("button", { name: /สรุปผู้ชนะ/i }).click();

    await Promise.all([
      hostPage.waitForFunction(
        () => document.body.innerText.includes("สรุปผลผู้ชนะ") || document.body.innerText.includes("Podium"),
        null,
        { timeout: 20000 },
      ),
      playerPage.waitForFunction(
        () => document.body.innerText.includes("สรุปผลผู้ชนะ") || document.body.innerText.includes("Podium"),
        null,
        { timeout: 20000 },
      ),
    ]);

    const summary = await fetchSummary(hostPage, host.roomCode);
    const top = Array.isArray(summary?.podium) ? summary.podium[0] : null;

    const ok =
      errors.length === 0
      && requests.length === 0
      && summary?.mode === "solo"
      && Number(top?.total_score || 0) === expectedTotal
      && Number(top?.player_id || 0) === joined.player.id;

    console.log(JSON.stringify({
      ok,
      roomCode: host.roomCode,
      expectedTotal,
      top,
      errors,
      requests,
    }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }

    await browser.close();
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      error: error.message,
      errors,
      requests,
    }, null, 2));
    process.exitCode = 1;
    await browser.close();
  }
}

run();

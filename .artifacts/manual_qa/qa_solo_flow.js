const { chromium } = require("../../Frontend/node_modules/playwright");
const { ensureBackendServer, ensureFrontendServer } = require("./server_helper");

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
  await page.locator(role === "host" ? ".host-card" : ".player-card").click();
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
    () => page.locator(".festival-page-card .festival-primary-btn").first().click(),
  );

  await page.locator(".festival-created-box .festival-primary-btn").click();
  await page.locator(".lobby-card-theme").waitFor({ state: "visible", timeout: 15000 });

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
    () => page.locator(".festival-room-card .festival-primary-btn").first().click(),
  );

  await page.locator(".lobby-card-theme").waitFor({ state: "visible", timeout: 15000 });

  return {
    player: {
      id: data.player.id,
      name: data.player.name,
      isHost: false,
    },
  };
}

async function fetchJson(url, init, attempts = 5) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const body = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, body };
    } catch (error) {
      lastError = error;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError || new Error("fetch failed");
}

async function fetchProgress(roomCode, playerId) {
  const result = await fetchJson(`${API_BASE}/rooms/${roomCode}/progress?player_id=${playerId}`);
  return result.body;
}

async function completeGame(roomCode, playerId, gameKey, score) {
  return fetchJson(`${API_BASE}/rooms/${roomCode}/games/${gameKey}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player_id: playerId,
      score,
      meta: {
        qa: true,
        source: "qa_solo_flow",
      },
    }),
  });
}

async function fetchSummary(roomCode) {
  const result = await fetchJson(`${API_BASE}/rooms/${roomCode}/summary`);
  return result.body;
}

async function waitForPlayerMap(page) {
  await page.waitForSelector("#phaser-root", { state: "visible", timeout: 20000 });
}

async function waitForSummary(page) {
  await page.waitForFunction(
    () => {
      const text = document.body.innerText || "";
      return text.includes("Podium") || text.includes("สรุปผลผู้ชนะ");
    },
    null,
    { timeout: 20000 },
  );
}

async function run() {
  await ensureBackendServer();
  await ensureFrontendServer();
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const requests = [];

  const attachLogging = (page, label) => {
    page.on("pageerror", (err) => {
      errors.push(`${label}: pageerror: ${err.message}`);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("ERR_SOCKET_NOT_CONNECTED")
          || text.includes("ERR_EMPTY_RESPONSE")
          || text.includes("loadRoom error: TypeError: Failed to fetch")
          || text.includes("loadProgress error: TypeError: Failed to fetch")
        ) {
          return;
        }
        errors.push(`${label}: console: ${text}`);
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

    await hostPage.getByRole("button", { name: "เริ่มเกม" }).click();

    await hostPage.waitForFunction(
      () => (document.body.innerText || "").includes("Host Monitor"),
      null,
      { timeout: 20000 },
    );
    await waitForPlayerMap(playerPage);

    let expectedTotal = 0;
    for (let index = 0; index < GAME_SEQUENCE.length; index += 1) {
      const gameKey = GAME_SEQUENCE[index];
      const progress = await fetchProgress(host.roomCode, joined.player.id);
      const me = progress?.me || {};

      if (!me.unlocked_games?.includes(gameKey) && !me.completed_games?.includes(gameKey)) {
        throw new Error(`solo player missing unlock for ${gameKey}`);
      }

      if (!me.completed_games?.includes(gameKey)) {
        const rawScore = (index + 1) * 17;
        const result = await completeGame(host.roomCode, joined.player.id, gameKey, rawScore);
        if (!result.ok) {
          throw new Error(`complete ${gameKey} failed: ${JSON.stringify(result.body)}`);
        }
        expectedTotal += gameKey === "WorshipBoothScene" ? 0 : rawScore;
        await sleep(250);
      }
    }

    await hostPage.waitForFunction(
      () => (document.body.innerText || "").includes("สรุปผู้ชนะ"),
      null,
      { timeout: 20000 },
    );
    await hostPage.getByRole("button", { name: "สรุปผู้ชนะ" }).click();

    await Promise.all([waitForSummary(hostPage), waitForSummary(playerPage)]);

    const summary = await fetchSummary(host.roomCode);
    const top = Array.isArray(summary?.podium) ? summary.podium[0] : null;

    const ok =
      errors.length === 0 &&
      requests.length === 0 &&
      summary?.mode === "solo" &&
      Number(top?.total_score || 0) === expectedTotal &&
      Number(top?.player_id || 0) === joined.player.id;

    console.log(
      JSON.stringify(
        {
          ok,
          roomCode: host.roomCode,
          expectedTotal,
          top,
          errors,
          requests,
        },
        null,
        2,
      ),
    );

    if (!ok) process.exitCode = 1;
    await browser.close();
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: error.message,
          errors,
          requests,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    await browser.close();
  }
}

run();

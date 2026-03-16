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
  await enterAs(page, "HostQA", "host");
  await page.locator(".festival-choice-pill").nth(1).click();
  await page.locator(".festival-room-input").first().fill("4");

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
            source: "qa_team_flow",
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
  const pages = [];
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
    pages.push(hostPage);
    attachLogging(hostPage, "host");

    const playerPages = [];
    for (let i = 0; i < 3; i += 1) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      pages.push(page);
      attachLogging(page, `player${i + 1}`);
      playerPages.push(page);
    }

    const host = await createHostRoom(hostPage);
    const joinedPlayers = [];
    for (let i = 0; i < playerPages.length; i += 1) {
      joinedPlayers.push(await joinPlayer(playerPages[i], `Player${i + 1}`, host.roomCode));
    }

    await hostPage.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("ห้อง") && text.includes("4");
    }, null, { timeout: 15000 });

    await hostPage.getByRole("button", { name: /เริ่มเกม/i }).click();

    await hostPage.waitForFunction(() => document.body.innerText.includes("Host Monitor"), null, {
      timeout: 20000,
    });
    for (const page of playerPages) {
      await page.waitForFunction(
        () =>
          document.body.innerText.includes("ความคืบหน้า")
          || document.body.innerText.includes("ซุ้มถัดไป"),
        null,
        { timeout: 20000 },
      );
    }

    const playerEntries = joinedPlayers.map((entry, index) => ({
      id: entry.player.id,
      name: entry.player.name,
      page: playerPages[index],
      totalScore: 0,
      team: "",
    }));

    for (let gameIndex = 0; gameIndex < GAME_SEQUENCE.length; gameIndex += 1) {
      const gameKey = GAME_SEQUENCE[gameIndex];

      for (let playerIndex = 0; playerIndex < playerEntries.length; playerIndex += 1) {
        const entry = playerEntries[playerIndex];
        const progress = await fetchProgress(entry.page, host.roomCode, entry.id);
        const me = progress?.me || {};

        if (!me.unlocked_games?.includes(gameKey) && !me.completed_games?.includes(gameKey)) {
          throw new Error(`player ${entry.name} missing unlock for ${gameKey}`);
        }

        entry.team = me.team || entry.team;

        if (!me.completed_games?.includes(gameKey)) {
          const rawScore = (gameIndex + 1) * (12 - playerIndex * 2);
          const result = await completeGame(entry.page, host.roomCode, entry.id, gameKey, rawScore);
          if (!result.ok) {
            throw new Error(`complete ${gameKey} for ${entry.name} failed: ${JSON.stringify(result.body)}`);
          }

          const appliedScore = gameKey === "WorshipBoothScene" ? 0 : rawScore;
          entry.totalScore += appliedScore;
          await sleep(250);
        }
      }
    }

    await hostPage.waitForFunction(
      () => document.body.innerText.includes("สรุปผู้ชนะ"),
      null,
      { timeout: 20000 },
    );

    await hostPage.getByRole("button", { name: /สรุปผู้ชนะ/i }).click();

    await Promise.all(
      pages.map((page) =>
        page.waitForFunction(
          () =>
            document.body.innerText.includes("สรุปผลผู้ชนะ")
            || document.body.innerText.includes("Podium"),
          null,
          { timeout: 20000 },
        )),
    );

    const summary = await fetchSummary(hostPage, host.roomCode);
    const grouped = new Map();
    for (const entry of playerEntries) {
      const teamKey = entry.team || "unassigned";
      grouped.set(teamKey, (grouped.get(teamKey) || 0) + entry.totalScore);
    }

    const expectedTeams = [...grouped.entries()]
      .map(([team, totalScore]) => ({ team, totalScore }))
      .sort((a, b) => {
        if (b.totalScore === a.totalScore) {
          return a.team.localeCompare(b.team);
        }
        return b.totalScore - a.totalScore;
      });

    const summaryTeams = Array.isArray(summary?.teams)
      ? summary.teams.map((entry) => ({ team: entry.team, totalScore: entry.total_score }))
      : [];

    const ok =
      errors.length === 0
      && requests.length === 0
      && JSON.stringify(expectedTeams) === JSON.stringify(summaryTeams);

    console.log(JSON.stringify({
      ok,
      roomCode: host.roomCode,
      expectedTeams,
      summaryTeams,
      errors,
      requests,
    }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      error: error.message,
      errors,
      requests,
    }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

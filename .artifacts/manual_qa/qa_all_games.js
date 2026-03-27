const { execFileSync } = require("node:child_process");

const ROOT = "c:/Users/ppang/OneDrive/เอกสาร/project";

const scripts = [
  ".artifacts/manual_qa/qa_fish_horse_worship.js",
  ".artifacts/manual_qa/qa_cooking_balloon.js",
  ".artifacts/manual_qa/qa_remaining_games.js",
  ".artifacts/manual_qa/qa_zip_games_round2.js",
  ".artifacts/manual_qa/qa_solo_flow.js",
  ".artifacts/manual_qa/qa_team_flow.js",
];

function runScript(script) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = execFileSync("node", [script], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return JSON.parse(output);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

try {
  const results = scripts.map((script) => ({
    script,
    result: runScript(script),
  }));

  const failed = results.filter(
    ({ result }) =>
      !result.ok ||
      (result.errors?.length ?? 0) > 0 ||
      (result.requests?.length ?? 0) > 0,
  );

  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0,
        results,
      },
      null,
      2,
    ),
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}

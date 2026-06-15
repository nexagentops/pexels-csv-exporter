import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

type RunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

function runCli(args: string[], env: Record<string, string | undefined>): Promise<RunResult> {
  const chunks = {
    stdout: [] as Buffer[],
    stderr: [] as Buffer[]
  };
  const child = spawn(process.execPath, ["--import", "tsx", resolve("src/cli.ts"), ...args], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk: Buffer) => chunks.stdout.push(chunk));
  child.stderr.on("data", (chunk: Buffer) => chunks.stderr.push(chunk));

  return new Promise((resolveRun, rejectRun) => {
    child.on("error", rejectRun);
    child.on("close", (code) => {
      resolveRun({
        code,
        stdout: Buffer.concat(chunks.stdout).toString("utf8"),
        stderr: Buffer.concat(chunks.stderr).toString("utf8")
      });
    });
  });
}

test("CLI loads PEXELS_API_KEY from dotenv config without printing it", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "pexels-cli-env-"));
  const envPath = join(tmp, ".env");
  const jsonPath = join(tmp, "export.json");
  const csvPath = join(tmp, "export.csv");

  await writeFile(envPath, "PEXELS_API_KEY=unit-test-placeholder\n", "utf8");
  await writeFile(
    join(tmp, "mock-fetch.mjs"),
    `
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const headers = new Headers(init.headers);

  if (url.toString() !== "https://api.pexels.com/v1/search?query=workspace+desk&page=1&per_page=1") {
    return new Response("unexpected url", { status: 500 });
  }

  if (headers.get("Authorization") !== "unit-test-placeholder") {
    return new Response("bad auth", { status: 401 });
  }

  return new Response(JSON.stringify({
    page: 1,
    per_page: 1,
    total_results: 1,
    photos: [{
      id: 123,
      width: 800,
      height: 600,
      url: "https://www.pexels.com/photo/workspace-123/",
      photographer: "Unit Tester",
      photographer_url: "https://www.pexels.com/@unit-tester",
      photographer_id: 456,
      src: { medium: "https://images.pexels.com/photos/123/pexels-photo-123.jpeg" },
      alt: "Workspace desk"
    }]
  }), {
    headers: {
      "Content-Type": "application/json",
      "X-Ratelimit-Limit": "20000",
      "X-Ratelimit-Remaining": "19999",
      "X-Ratelimit-Reset": "1770000000"
    }
  });
};
`,
    "utf8"
  );

  const result = await runCli(
    [
      "--type",
      "photos",
      "--query",
      "workspace desk",
      "--limit",
      "1",
      "--per-page",
      "1",
      "--out",
      jsonPath,
      "--csv",
      csvPath,
      "--fetched-at",
      "2026-01-01T00:00:00.000Z"
    ],
    {
      DOTENV_CONFIG_PATH: envPath,
      NODE_OPTIONS: `--import ${join(tmp, "mock-fetch.mjs")}`
    }
  );

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Exported 1 photos record/);
  assert.equal(result.stdout.includes("unit-test-placeholder"), false);
  assert.equal(result.stderr.includes("unit-test-placeholder"), false);

  const json = await readFile(jsonPath, "utf8");
  const csv = await readFile(csvPath, "utf8");

  assert.equal(json.includes("unit-test-placeholder"), false);
  assert.equal(csv.includes("unit-test-placeholder"), false);
  assert.match(json, /"exported_count": 1/);
  assert.match(csv, /Photo by Unit Tester on Pexels/);
});

test("CLI still fails safely when PEXELS_API_KEY is not available", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "pexels-cli-missing-env-"));

  const result = await runCli(
    ["--type", "photos", "--query", "workspace desk", "--limit", "1", "--out", join(tmp, "export.json")],
    {
      DOTENV_CONFIG_PATH: join(tmp, "missing.env")
    }
  );

  assert.equal(result.code, 2);
  assert.match(result.stderr, /PEXELS_API_KEY is required in the environment\./);
  assert.equal(result.stdout.includes("unit-test-placeholder"), false);
  assert.equal(result.stderr.includes("unit-test-placeholder"), false);
});

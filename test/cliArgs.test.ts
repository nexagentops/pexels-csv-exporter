import assert from "node:assert/strict";
import test from "node:test";
import { parseCliArgs } from "../src/cliArgs.js";

test("parseCliArgs accepts the public README photo export example", () => {
  const options = parseCliArgs([
    "--type",
    "photos",
    "--query",
    "coffee shop workspace",
    "--limit",
    "50",
    "--out",
    "out/pexels-photos.json",
    "--csv",
    "out/pexels-photos.csv",
    "--fetched-at",
    "2026-06-14T00:00:00.000Z"
  ]);

  assert.equal(options.type, "photos");
  assert.equal(options.query, "coffee shop workspace");
  assert.equal(options.limit, 50);
  assert.equal(options.fetchedAt, "2026-06-14T00:00:00.000Z");
});

test("parseCliArgs rejects unsafe or unsupported options", () => {
  assert.throws(
    () => parseCliArgs(["--type", "videos", "--query", "workspace", "--csv", "out.csv", "--color", "blue"]),
    /--color is only supported/
  );

  assert.throws(
    () => parseCliArgs(["--type", "photos", "--query", "workspace", "--csv", ".env"]),
    /must not write to \.env/
  );

  assert.throws(
    () => parseCliArgs(["--type", "photos", "--query", "workspace", "--csv", "out.csv", "--per-page", "81"]),
    /--per-page must be 80 or lower/
  );

  assert.throws(
    () => parseCliArgs(["--type", "photos", "--query", "workspace", "--csv", "out.csv", "--orientation", "wide"]),
    /--orientation must be one of/
  );
});

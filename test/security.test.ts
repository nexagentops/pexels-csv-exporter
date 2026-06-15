import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test(".env is ignored and .env.example has an empty placeholder", async () => {
  const [gitignore, envExample] = await Promise.all([
    readFile(".gitignore", "utf8"),
    readFile(".env.example", "utf8")
  ]);

  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
  assert.equal(envExample, "PEXELS_API_KEY=\n");
});

import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvValue, toCsv } from "../src/csv.js";
import type { NormalizedPexelsRecord } from "../src/types.js";

test("escapeCsvValue quotes commas, quotes, and newlines", () => {
  assert.equal(escapeCsvValue("plain"), "plain");
  assert.equal(escapeCsvValue("coffee, desk"), '"coffee, desk"');
  assert.equal(escapeCsvValue('Photo by "A"'), '"Photo by ""A"""');
  assert.equal(escapeCsvValue("line\nbreak"), '"line\nbreak"');
  assert.equal(escapeCsvValue("=HYPERLINK(\"https://example.com\")"), "\"'=HYPERLINK(\"\"https://example.com\"\")\"");
  assert.equal(escapeCsvValue("  =1+1"), "'  =1+1");
  assert.equal(escapeCsvValue(null), "");
});

test("toCsv writes headers and normalized rows", () => {
  const row: NormalizedPexelsRecord = {
    source: "Pexels",
    media_type: "photo",
    id: 1,
    query: "coffee shop",
    pexels_url: "https://www.pexels.com/photo/1/",
    creator_name: "Jane Doe",
    creator_url: "https://www.pexels.com/@jane",
    creator_id: 10,
    attribution_text: "Photo by Jane Doe on Pexels",
    attribution_url: "https://www.pexels.com/photo/1/",
    pexels_linkback_url: "https://www.pexels.com",
    width: 1000,
    height: 500,
    aspect_ratio: 2,
    duration_seconds: null,
    avg_color: "#ffffff",
    alt_text: "A cafe, with laptop",
    preview_url: "https://images.pexels.com/photos/1/preview.jpeg",
    fetched_at: "2026-06-14T00:00:00.000Z"
  };

  const csv = toCsv([row]);
  assert.ok(csv.startsWith("\uFEFFsource,media_type,id,query,"));
  assert.match(csv, /\r\n/);
  assert.match(csv, /"A cafe, with laptop"/);
});

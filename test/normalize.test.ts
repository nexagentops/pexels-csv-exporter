import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhoto, normalizeVideo } from "../src/normalize.js";

test("normalizePhoto keeps attribution and spreadsheet-friendly preview fields", () => {
  const record = normalizePhoto(
    {
      id: 123,
      width: 3000,
      height: 2000,
      url: "https://www.pexels.com/photo/coffee-123/",
      photographer: "Alex Example",
      photographer_url: "https://www.pexels.com/@alex",
      photographer_id: 456,
      avg_color: "#101010",
      alt: "Coffee shop workspace",
      src: {
        original: "https://images.pexels.com/original.jpeg",
        medium: "https://images.pexels.com/medium.jpeg"
      }
    },
    "coffee shop workspace",
    "2026-06-14T00:00:00.000Z"
  );

  assert.equal(record.media_type, "photo");
  assert.equal(record.attribution_text, "Photo by Alex Example on Pexels");
  assert.equal(record.attribution_url, "https://www.pexels.com/photo/coffee-123/");
  assert.equal(record.pexels_linkback_url, "https://www.pexels.com");
  assert.equal(record.preview_url, "https://images.pexels.com/medium.jpeg");
  assert.equal(record.aspect_ratio, 1.5);
});

test("normalizeVideo does not expose direct video file links", () => {
  const record = normalizeVideo(
    {
      id: 789,
      width: 1920,
      height: 1080,
      url: "https://www.pexels.com/video/desk-789/",
      image: "https://images.pexels.com/videos/789/poster.jpg",
      duration: 12,
      user: {
        id: 111,
        name: "Sam Example",
        url: "https://www.pexels.com/@sam"
      },
      video_files: [
        {
          id: 1,
          link: "https://player.vimeo.com/external/file.mp4"
        }
      ]
    },
    "workspace",
    "2026-06-14T00:00:00.000Z"
  );

  assert.equal(record.media_type, "video");
  assert.equal(record.attribution_text, "Video by Sam Example on Pexels");
  assert.equal(record.preview_url, "https://images.pexels.com/videos/789/poster.jpg");
  assert.equal(JSON.stringify(record).includes("player.vimeo.com"), false);
  assert.equal(record.duration_seconds, 12);
});

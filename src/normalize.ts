import { PEXELS_LINKBACK_URL } from "./constants.js";
import type { NormalizedPexelsRecord, PexelsPhoto, PexelsVideo } from "./types.js";

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function aspectRatio(width: number | null | undefined, height: number | null | undefined): number | null {
  if (!width || !height) {
    return null;
  }

  return Number((width / height).toFixed(4));
}

export function normalizePhoto(photo: PexelsPhoto, query: string, fetchedAt: string): NormalizedPexelsRecord {
  const creatorName = cleanText(photo.photographer) ?? "Unknown photographer";
  const pexelsUrl = photo.url;

  return {
    source: "Pexels",
    media_type: "photo",
    id: photo.id,
    query,
    pexels_url: pexelsUrl,
    creator_name: creatorName,
    creator_url: cleanText(photo.photographer_url),
    creator_id: photo.photographer_id ?? null,
    attribution_text: `Photo by ${creatorName} on Pexels`,
    attribution_url: pexelsUrl,
    pexels_linkback_url: PEXELS_LINKBACK_URL,
    width: photo.width ?? null,
    height: photo.height ?? null,
    aspect_ratio: aspectRatio(photo.width, photo.height),
    duration_seconds: null,
    avg_color: cleanText(photo.avg_color),
    alt_text: cleanText(photo.alt),
    preview_url: photo.src?.medium ?? photo.src?.small ?? photo.src?.tiny ?? null,
    fetched_at: fetchedAt
  };
}

export function normalizeVideo(video: PexelsVideo, query: string, fetchedAt: string): NormalizedPexelsRecord {
  const creatorName = cleanText(video.user?.name) ?? "Unknown videographer";
  const pexelsUrl = video.url;

  return {
    source: "Pexels",
    media_type: "video",
    id: video.id,
    query,
    pexels_url: pexelsUrl,
    creator_name: creatorName,
    creator_url: cleanText(video.user?.url),
    creator_id: video.user?.id ?? null,
    attribution_text: `Video by ${creatorName} on Pexels`,
    attribution_url: pexelsUrl,
    pexels_linkback_url: PEXELS_LINKBACK_URL,
    width: video.width ?? null,
    height: video.height ?? null,
    aspect_ratio: aspectRatio(video.width, video.height),
    duration_seconds: video.duration ?? null,
    avg_color: null,
    alt_text: null,
    preview_url: cleanText(video.image) ?? cleanText(video.video_pictures?.[0]?.picture),
    fetched_at: fetchedAt
  };
}

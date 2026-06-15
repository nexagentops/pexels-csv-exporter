import type { PexelsMediaType } from "./types.js";

export const PEXELS_LINKBACK_URL = "https://www.pexels.com";
export const PEXELS_PHOTO_SEARCH_URL = "https://api.pexels.com/v1/search";
export const PEXELS_VIDEO_SEARCH_URL = "https://api.pexels.com/v1/videos/search";

export const DEFAULT_LIMIT = 25;
export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 80;
export const MAX_EXPORT_LIMIT = 250;

export function endpointForType(type: PexelsMediaType): string {
  return type === "photos" ? PEXELS_PHOTO_SEARCH_URL : PEXELS_VIDEO_SEARCH_URL;
}

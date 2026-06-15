import { endpointForType, PEXELS_LINKBACK_URL } from "./constants.js";
import { normalizePhoto, normalizeVideo } from "./normalize.js";
import { searchPexels } from "./pexelsClient.js";
import type { ExportDocument, PexelsMediaType, SearchFilters } from "./types.js";

export type ExportOptions = {
  apiKey: string;
  type: PexelsMediaType;
  query: string;
  limit: number;
  perPage: number;
  filters: SearchFilters;
  fetchedAt?: string;
};

export async function createExportDocument(options: ExportOptions): Promise<ExportDocument> {
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const result = await searchPexels(options);
  const records =
    result.type === "photos"
      ? result.items.map((photo) => normalizePhoto(photo, options.query, fetchedAt))
      : result.items.map((video) => normalizeVideo(video, options.query, fetchedAt));

  return {
    meta: {
      source: "Pexels",
      source_linkback_url: PEXELS_LINKBACK_URL,
      media_type: options.type,
      query: options.query,
      requested_limit: options.limit,
      exported_count: records.length,
      total_results: result.totalResults,
      pages_fetched: result.pagesFetched,
      per_page_requested: options.perPage,
      api_endpoint: endpointForType(options.type),
      rate_limit: result.rateLimit,
      fetched_at: fetchedAt,
      usage_note: "Metadata export only; no media files were downloaded.",
      attribution_note: "Keep creator attribution and link back to Pexels with any reviewed result."
    },
    records
  };
}

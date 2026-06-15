import { endpointForType, MAX_PER_PAGE } from "./constants.js";
import type {
  PexelsMediaType,
  PexelsPhoto,
  PexelsSearchResponse,
  PexelsVideo,
  RateLimitInfo,
  SearchFilters
} from "./types.js";

export type FetchLike = (input: URL, init?: RequestInit) => Promise<Response>;

export type SearchPexelsOptions = {
  apiKey: string;
  type: PexelsMediaType;
  query: string;
  limit: number;
  perPage: number;
  filters: SearchFilters;
  fetchImpl?: FetchLike;
};

export type SearchPexelsResult =
  | {
      type: "photos";
      items: PexelsPhoto[];
      totalResults: number | null;
      pagesFetched: number;
      rateLimit: RateLimitInfo;
    }
  | {
      type: "videos";
      items: PexelsVideo[];
      totalResults: number | null;
      pagesFetched: number;
      rateLimit: RateLimitInfo;
    };

export class PexelsApiError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly responseBody: string | null;
  readonly rateLimit: RateLimitInfo;

  constructor(status: number, endpoint: string, responseBody: string | null, rateLimit: RateLimitInfo, apiKey: string) {
    super(`Pexels API request failed with HTTP ${status}.`);
    this.name = "PexelsApiError";
    this.status = status;
    this.endpoint = redactSecret(endpoint, apiKey);
    this.responseBody = responseBody ? redactSecret(responseBody, apiKey) : null;
    this.rateLimit = rateLimit;
  }
}

export function readRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: headers.get("X-Ratelimit-Limit"),
    remaining: headers.get("X-Ratelimit-Remaining"),
    reset: headers.get("X-Ratelimit-Reset")
  };
}

function mergeRateLimitInfo(previous: RateLimitInfo, next: RateLimitInfo): RateLimitInfo {
  return {
    limit: next.limit ?? previous.limit,
    remaining: next.remaining ?? previous.remaining,
    reset: next.reset ?? previous.reset
  };
}

export function hasRateLimitInfo(rateLimit: RateLimitInfo): boolean {
  return Boolean(rateLimit.limit || rateLimit.remaining || rateLimit.reset);
}

export function formatRateLimitInfo(rateLimit: RateLimitInfo): string | null {
  if (!hasRateLimitInfo(rateLimit)) {
    return null;
  }

  const parts = [
    rateLimit.remaining ? `remaining=${rateLimit.remaining}` : null,
    rateLimit.limit ? `limit=${rateLimit.limit}` : null,
    rateLimit.reset ? `reset=${rateLimit.reset}` : null
  ].filter(Boolean);

  return `Pexels rate limit: ${parts.join(", ")}`;
}

function redactSecret(value: string, secret: string): string {
  return secret ? value.replaceAll(secret, "[REDACTED]") : value;
}

function buildSearchUrl(type: PexelsMediaType, query: string, page: number, perPage: number, filters: SearchFilters): URL {
  const url = new URL(endpointForType(type));
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  if (filters.orientation) {
    url.searchParams.set("orientation", filters.orientation);
  }

  if (filters.size) {
    url.searchParams.set("size", filters.size);
  }

  if (filters.locale) {
    url.searchParams.set("locale", filters.locale);
  }

  if (type === "photos" && filters.color) {
    url.searchParams.set("color", filters.color);
  }

  return url;
}

async function parseJsonResponse(response: Response): Promise<PexelsSearchResponse> {
  return (await response.json()) as PexelsSearchResponse;
}

export async function searchPexels(options: SearchPexelsOptions): Promise<SearchPexelsResult> {
  if (options.perPage > MAX_PER_PAGE) {
    throw new Error(`perPage must be ${MAX_PER_PAGE} or lower.`);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const items: Array<PexelsPhoto | PexelsVideo> = [];
  let page = 1;
  let pagesFetched = 0;
  let totalResults: number | null = null;
  let rateLimit: RateLimitInfo = {
    limit: null,
    remaining: null,
    reset: null
  };

  while (items.length < options.limit) {
    const remaining = options.limit - items.length;
    const perPage = Math.min(options.perPage, MAX_PER_PAGE, remaining);
    const url = buildSearchUrl(options.type, options.query, page, perPage, options.filters);
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        Authorization: options.apiKey
      }
    });

    rateLimit = mergeRateLimitInfo(rateLimit, readRateLimitHeaders(response.headers));

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new PexelsApiError(response.status, url.toString(), body || null, rateLimit, options.apiKey);
    }

    const payload = await parseJsonResponse(response);
    const pageItems = options.type === "photos" ? payload.photos ?? [] : payload.videos ?? [];

    pagesFetched += 1;
    totalResults = typeof payload.total_results === "number" ? payload.total_results : totalResults;
    items.push(...pageItems.slice(0, remaining));

    if (!payload.next_page || pageItems.length === 0) {
      break;
    }

    page = payload.page + 1;
  }

  if (options.type === "photos") {
    return {
      type: "photos",
      items: items as PexelsPhoto[],
      totalResults,
      pagesFetched,
      rateLimit
    };
  }

  return {
    type: "videos",
    items: items as PexelsVideo[],
    totalResults,
    pagesFetched,
    rateLimit
  };
}

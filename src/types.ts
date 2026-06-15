export type PexelsMediaType = "photos" | "videos";

export type SearchFilters = {
  orientation?: string;
  size?: string;
  color?: string;
  locale?: string;
};

export type RateLimitInfo = {
  limit: string | null;
  remaining: string | null;
  reset: string | null;
};

export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color?: string | null;
  src?: Partial<Record<"original" | "large2x" | "large" | "medium" | "small" | "portrait" | "landscape" | "tiny", string>>;
  alt?: string | null;
};

export type PexelsVideoFile = {
  id: number;
  quality?: string;
  file_type?: string;
  width?: number | null;
  height?: number | null;
  fps?: number;
  link?: string;
};

export type PexelsVideoPicture = {
  id: number;
  picture: string;
  nr: number;
};

export type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  url: string;
  image?: string | null;
  duration: number;
  user?: {
    id: number;
    name: string;
    url: string;
  };
  video_files?: PexelsVideoFile[];
  video_pictures?: PexelsVideoPicture[];
};

export type PexelsSearchResponse = {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  prev_page?: string;
  url?: string;
  photos?: PexelsPhoto[];
  videos?: PexelsVideo[];
};

export type NormalizedPexelsRecord = {
  source: "Pexels";
  media_type: "photo" | "video";
  id: number;
  query: string;
  pexels_url: string;
  creator_name: string;
  creator_url: string | null;
  creator_id: number | null;
  attribution_text: string;
  attribution_url: string;
  pexels_linkback_url: string;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  duration_seconds: number | null;
  avg_color: string | null;
  alt_text: string | null;
  preview_url: string | null;
  fetched_at: string;
};

export type ExportMeta = {
  source: "Pexels";
  source_linkback_url: string;
  media_type: PexelsMediaType;
  query: string;
  requested_limit: number;
  exported_count: number;
  total_results: number | null;
  pages_fetched: number;
  per_page_requested: number;
  api_endpoint: string;
  rate_limit: RateLimitInfo;
  fetched_at: string;
  usage_note: string;
  attribution_note: string;
};

export type ExportDocument = {
  meta: ExportMeta;
  records: NormalizedPexelsRecord[];
};

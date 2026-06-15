import { parseArgs } from "node:util";
import { basename, normalize } from "node:path";
import { DEFAULT_LIMIT, DEFAULT_PER_PAGE, MAX_EXPORT_LIMIT, MAX_PER_PAGE } from "./constants.js";
import type { PexelsMediaType, SearchFilters } from "./types.js";

const ORIENTATIONS = new Set(["landscape", "portrait", "square"]);
const SIZES = new Set(["large", "medium", "small"]);
const PHOTO_COLORS = new Set([
  "red",
  "orange",
  "yellow",
  "green",
  "turquoise",
  "blue",
  "violet",
  "pink",
  "brown",
  "black",
  "gray",
  "white"
]);
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;
const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export type CliOptions = {
  type: PexelsMediaType;
  query: string;
  limit: number;
  perPage: number;
  jsonPath?: string;
  csvPath?: string;
  filters: SearchFilters;
  fetchedAt?: string;
};

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

function parsePositiveInteger(name: string, value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    throw new CliUsageError(`--${name} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new CliUsageError(`--${name} must be a positive integer.`);
  }

  return parsed;
}

function validateOutputPath(name: string, value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new CliUsageError(`--${name} cannot be empty.`);
  }

  const normalized = normalize(trimmed);
  const fileName = basename(normalized);
  if (fileName === ".env" || fileName.startsWith(".env.")) {
    throw new CliUsageError(`--${name} must not write to .env files.`);
  }

  if (normalized.split(/[\\/]/).includes(".git")) {
    throw new CliUsageError(`--${name} must not write inside .git.`);
  }

  return trimmed;
}

function validateEnum(name: string, value: string | undefined, allowed: Set<string>): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!allowed.has(value)) {
    throw new CliUsageError(`--${name} must be one of: ${Array.from(allowed).join(", ")}.`);
  }

  return value;
}

function validateColor(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!PHOTO_COLORS.has(value) && !HEX_COLOR_PATTERN.test(value)) {
    throw new CliUsageError("--color must be a supported color name or a 6-digit hex color like #ffffff.");
  }

  return value;
}

function validateLocale(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!LOCALE_PATTERN.test(value)) {
    throw new CliUsageError("--locale must use a Pexels locale shape like en-US.");
  }

  return value;
}

function validateFetchedAt(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!ISO_INSTANT_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new CliUsageError("--fetched-at must be an ISO UTC timestamp like 2026-06-14T00:00:00.000Z.");
  }

  return new Date(value).toISOString();
}

export function parseCliArgs(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: false,
    options: {
      type: { type: "string" },
      query: { type: "string" },
      limit: { type: "string" },
      "per-page": { type: "string" },
      out: { type: "string" },
      csv: { type: "string" },
      orientation: { type: "string" },
      size: { type: "string" },
      color: { type: "string" },
      locale: { type: "string" },
      "fetched-at": { type: "string" },
      help: { type: "boolean", short: "h" }
    }
  });

  if (values.help) {
    throw new CliUsageError(formatHelp());
  }

  if (values.type !== "photos" && values.type !== "videos") {
    throw new CliUsageError('--type is required and must be either "photos" or "videos".');
  }

  const query = values.query?.trim();
  if (!query) {
    throw new CliUsageError("--query is required.");
  }

  if (query.length > 200) {
    throw new CliUsageError("--query must be 200 characters or fewer.");
  }

  const jsonPath = validateOutputPath("out", values.out);
  const csvPath = validateOutputPath("csv", values.csv);

  if (!jsonPath && !csvPath) {
    throw new CliUsageError("Provide at least one output path with --out for JSON or --csv for CSV.");
  }

  if (jsonPath && csvPath && normalize(jsonPath) === normalize(csvPath)) {
    throw new CliUsageError("--out and --csv must write to different files.");
  }

  const limit = parsePositiveInteger("limit", values.limit, DEFAULT_LIMIT);
  if (limit > MAX_EXPORT_LIMIT) {
    throw new CliUsageError(`--limit must be ${MAX_EXPORT_LIMIT} or lower for conservative review exports.`);
  }

  const perPage = parsePositiveInteger("per-page", values["per-page"], Math.min(DEFAULT_PER_PAGE, limit));
  if (perPage > MAX_PER_PAGE) {
    throw new CliUsageError(`--per-page must be ${MAX_PER_PAGE} or lower.`);
  }

  if (values.type === "videos" && values.color) {
    throw new CliUsageError("--color is only supported for photo searches.");
  }

  const orientation = validateEnum("orientation", values.orientation, ORIENTATIONS);
  const size = validateEnum("size", values.size, SIZES);
  const color = validateColor(values.color);
  const locale = validateLocale(values.locale);
  const fetchedAt = validateFetchedAt(values["fetched-at"]);

  return {
    type: values.type,
    query,
    limit,
    perPage,
    jsonPath,
    csvPath,
    fetchedAt,
    filters: {
      orientation,
      size,
      color,
      locale
    }
  };
}

export function formatHelp(): string {
  return `Pexels CSV Exporter

Usage:
  npm run export -- --type photos --query "coffee shop workspace" --limit 50 --out out/pexels-photos.json --csv out/pexels-photos.csv

Required:
  --type photos|videos      Search photos or videos.
  --query <text>            Pexels search query.

Outputs:
  --out <path>              Write normalized JSON.
  --csv <path>              Write normalized CSV.

Options:
  --limit <number>          Results to export. Default: ${DEFAULT_LIMIT}. Max: ${MAX_EXPORT_LIMIT}.
  --per-page <number>       API page size. Default: ${DEFAULT_PER_PAGE}. Max: ${MAX_PER_PAGE}.
  --orientation <value>     landscape, portrait, or square.
  --size <value>            large, medium, or small.
  --color <value>           Photo searches only.
  --locale <value>          Pexels locale, such as en-US.
  --fetched-at <ISO time>   Optional fixed UTC timestamp for deterministic fixture exports.
  -h, --help                Show this help.
`;
}

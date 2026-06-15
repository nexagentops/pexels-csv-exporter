import type { NormalizedPexelsRecord } from "./types.js";

const UTF8_BOM = "\uFEFF";
const CSV_LINE_ENDING = "\r\n";
const DANGEROUS_SPREADSHEET_PREFIX = /^(?:[=+\-@]|\t|\r|\n|\s+[=+\-@])/;

export const CSV_HEADERS = [
  "source",
  "media_type",
  "id",
  "query",
  "pexels_url",
  "creator_name",
  "creator_url",
  "creator_id",
  "attribution_text",
  "attribution_url",
  "pexels_linkback_url",
  "width",
  "height",
  "aspect_ratio",
  "duration_seconds",
  "avg_color",
  "alt_text",
  "preview_url",
  "fetched_at"
] as const satisfies readonly (keyof NormalizedPexelsRecord)[];

function guardSpreadsheetFormula(text: string): string {
  return DANGEROUS_SPREADSHEET_PREFIX.test(text) ? `'${text}` : text;
}

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = typeof value === "string" ? guardSpreadsheetFormula(value) : String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(records: NormalizedPexelsRecord[]): string {
  const headerLine = CSV_HEADERS.join(",");
  const recordLines = records.map((record) => CSV_HEADERS.map((header) => escapeCsvValue(record[header])).join(","));

  return UTF8_BOM + [headerLine, ...recordLines].join(CSV_LINE_ENDING) + CSV_LINE_ENDING;
}

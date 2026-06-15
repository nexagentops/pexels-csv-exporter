# Pexels CSV Exporter

Metadata-only Node/TypeScript CLI for searching the Pexels API and exporting normalized JSON and CSV for spreadsheet review workflows.

This project is intentionally small and conservative. It does not download media files, scrape Pexels, crawl beyond the explicit query, build ML/AI datasets, train or benchmark models, clone a stock media platform, or clone a wallpaper app.

## Setup

```bash
npm install
cp .env.example .env
```

Set `PEXELS_API_KEY` in your shell or through your local `.env` loader. The CLI only reads this value from the environment and sends it as the `Authorization` request header. It never stores the key in exports.

```bash
export PEXELS_API_KEY=
```

## Usage

```bash
npm run export -- --type photos --query "coffee shop workspace" --limit 50 --out out/pexels-photos.json --csv out/pexels-photos.csv
```

Video search:

```bash
npm run export -- --type videos --query "coffee shop workspace" --limit 25 --out out/pexels-videos.json --csv out/pexels-videos.csv
```

At least one of `--out` or `--csv` is required. Pagination stops when `--limit` is reached or Pexels has no next page. The CLI never requests more than `per_page=80`, does not retry `429` responses, and has no background or scheduled export mode.

## Options

```text
--type photos|videos      Search photos or videos.
--query <text>            Pexels search query. Max: 200 characters.
--out <path>              Write normalized JSON.
--csv <path>              Write normalized CSV.
--limit <number>          Results to export. Default: 25. Max: 250.
--per-page <number>       API page size. Default: 25. Max: 80.
--orientation <value>     landscape, portrait, or square.
--size <value>            large, medium, or small.
--color <value>           Photo searches only.
--locale <value>          Pexels locale shape, such as en-US.
--fetched-at <ISO time>   Optional fixed UTC timestamp for deterministic fixture exports.
```

The CLI rejects empty output paths, `.env` outputs, `.git` outputs, duplicate JSON/CSV output paths, unsupported filter values, and `--per-page` values above 80.

## Export Fields

CSV and JSON records use the same normalized fields:

- `source`
- `media_type`
- `id`
- `query`
- `pexels_url`
- `creator_name`
- `creator_url`
- `creator_id`
- `attribution_text`
- `attribution_url`
- `pexels_linkback_url`
- `width`
- `height`
- `aspect_ratio`
- `duration_seconds`
- `avg_color`
- `alt_text`
- `preview_url`
- `fetched_at`

JSON also includes export metadata with the API endpoint, page count, total result count when Pexels returns it, and any Pexels rate-limit headers returned by the API:

- `X-Ratelimit-Limit`
- `X-Ratelimit-Remaining`
- `X-Ratelimit-Reset`

## CSV Safety

CSV output is UTF-8 with a BOM and CRLF line endings so it opens cleanly in Numbers, Excel, Google Sheets, and LibreOffice. Text values that could be interpreted as spreadsheet formulas are prefixed with an apostrophe to reduce spreadsheet-injection risk.

## Attribution And Media Links

Every exported row includes creator attribution and Pexels linkback fields. Preserve these fields when sharing spreadsheets or downstream review files.

Exported media-related URLs remain Pexels-hosted URLs for review and attribution. The exporter does not include direct video file links, does not include original photo file URLs, and does not download image or video files.

## Endpoint Choice

The current official Pexels API docs list:

- Photos: `https://api.pexels.com/v1/search`
- Videos: `https://api.pexels.com/v1/videos/search`

The docs also note that older video endpoints under `https://api.pexels.com/videos/` are deprecated in favor of the `/v1/videos/` path, so this repo uses `https://api.pexels.com/v1/videos/search`.

## Security Notes

- `PEXELS_API_KEY` must come from the environment only.
- `.env` is ignored and must not be committed.
- `.env.example` intentionally contains only `PEXELS_API_KEY=`.
- The CLI never logs request headers or the API key.
- API error output is redacted before surfacing response text internally.
- Tests and CI use placeholder strings only, never real API keys or real API responses.
- If a real Pexels API key is exposed, revoke or rotate it in your Pexels account before continuing, then remove the exposure from any public history or shared artifacts.

## Development

```bash
npm run lint
npm test
npm run build
npm run check
```

Use `npm run export -- --help` to print CLI usage without requiring `PEXELS_API_KEY`.

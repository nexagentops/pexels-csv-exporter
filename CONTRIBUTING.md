# Contributing

Thanks for helping keep `pexels-csv-exporter` small, safe, and useful for spreadsheet review workflows.

## Safety Rules

- Do not paste real API keys, tokens, secrets, private URLs, or exported private data into issues, pull requests, screenshots, logs, fixtures, or tests.
- Do not commit `.env`, `.env.*`, generated exports, downloaded media, `out/`, `coverage/`, `dist/`, or `node_modules/`.
- Do not add scraping, crawling, media downloading, media mirroring, wallpaper-library, stock-library clone, or AI/ML dataset features.
- Do not add CI steps that require `PEXELS_API_KEY` or call the live Pexels API.
- Keep tests mocked or fixture-based. CI must run without network calls to Pexels.

## Development

```bash
npm install
npm run check
```

Use `npm run export -- --help` for CLI usage. Do not run live exports in tests or CI.

## Pull Requests

Before opening a PR:

- Run `npm run check`.
- Confirm `.env.example` still contains only `PEXELS_API_KEY=`.
- Confirm generated files and local exports are not staged.
- Explain any behavior changes and why they stay within the metadata-only scope.

Dependency updates should be conservative and should not be bundled with unrelated feature work.

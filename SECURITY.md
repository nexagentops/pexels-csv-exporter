# Security Policy

## Supported Versions

Security fixes are accepted for the current `main` branch. This repository does not currently maintain multiple release lines.

## Reporting A Vulnerability

Please do not open public issues containing API keys, exported private data, screenshots with secrets, or private URLs.

If you find a security issue, report it privately through GitHub security advisories if enabled on the repository, or contact the maintainer through the private channel listed on the repository profile.

## Secret Handling

This project should only process `PEXELS_API_KEY`, and only from the local environment. It must never commit `.env`, real Pexels API keys, request headers, real private API responses, generated exports, or fixtures copied from user-specific exports.

If a real Pexels API key is exposed, revoke or rotate it in the Pexels account before continuing, then remove the exposure from any public history or shared artifacts.

## Public Repo Checklist

Before publishing or accepting a public contribution:

- Confirm `.env.example` contains only `PEXELS_API_KEY=`.
- Confirm `.env`, `.env.*`, generated exports, downloaded media, `out/`, `coverage/`, `dist/`, and `node_modules/` are not committed.
- Confirm tests and CI do not require `PEXELS_API_KEY` and do not call the live Pexels API.
- Confirm screenshots, logs, issues, and pull requests do not contain secrets or private exports.
- Keep CodeQL deferred until the repository is public or GitHub Code Security/code scanning is enabled for this private repository.

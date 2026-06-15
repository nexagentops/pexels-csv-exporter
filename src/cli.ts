#!/usr/bin/env node
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCliArgs, CliUsageError, formatHelp } from "./cliArgs.js";
import { toCsv } from "./csv.js";
import { createExportDocument } from "./exporter.js";
import { formatRateLimitInfo, PexelsApiError } from "./pexelsClient.js";

async function writeTextFile(path: string, contents: string): Promise<string> {
  const resolvedPath = resolve(path);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, contents, "utf8");
  return resolvedPath;
}

async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(formatHelp());
    return;
  }

  const cliOptions = parseCliArgs(argv);
  const apiKey = process.env.PEXELS_API_KEY?.trim();

  if (!apiKey) {
    throw new CliUsageError("PEXELS_API_KEY is required in the environment.");
  }

  const document = await createExportDocument({
    apiKey,
    type: cliOptions.type,
    query: cliOptions.query,
    limit: cliOptions.limit,
    perPage: cliOptions.perPage,
    filters: cliOptions.filters,
    fetchedAt: cliOptions.fetchedAt
  });

  const writtenFiles: string[] = [];

  if (cliOptions.jsonPath) {
    writtenFiles.push(await writeTextFile(cliOptions.jsonPath, JSON.stringify(document, null, 2) + "\n"));
  }

  if (cliOptions.csvPath) {
    writtenFiles.push(await writeTextFile(cliOptions.csvPath, toCsv(document.records)));
  }

  console.log(
    `Exported ${document.records.length} ${cliOptions.type} record(s) from Pexels across ${document.meta.pages_fetched} page request(s).`
  );

  for (const file of writtenFiles) {
    console.log(`Wrote ${file}`);
  }

  const rateLimitSummary = formatRateLimitInfo(document.meta.rate_limit);
  if (rateLimitSummary) {
    console.log(rateLimitSummary);
  }
}

const isDirectRun = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  main().catch((error: unknown) => {
    if (error instanceof CliUsageError) {
      console.error(error.message.startsWith("Pexels CSV Exporter") ? error.message : `${error.message}\n\n${formatHelp()}`);
      process.exitCode = 2;
      return;
    }

    if (error instanceof PexelsApiError) {
      console.error(error.message);
      const rateLimitSummary = formatRateLimitInfo(error.rateLimit);
      if (rateLimitSummary) {
        console.error(rateLimitSummary);
      }
      process.exitCode = error.status === 429 ? 75 : 1;
      return;
    }

    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { main };

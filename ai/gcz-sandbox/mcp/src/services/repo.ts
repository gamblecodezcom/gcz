import { execFile } from "node:child_process";
import { readFileSync, statSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { log } from "../utils/logger.js";

const DEFAULT_ROOT = resolve(process.cwd(), "..");

function repoRoot() {
  return process.env.GCZ_REPO_ROOT || DEFAULT_ROOT;
}

export async function repoSearch(query: string, maxResults = 50) {
  const root = repoRoot();
  const args = ["-n", "--no-heading", "-m", String(maxResults), query, root];

  return new Promise<{ path: string; line: number; preview: string }[]>((resolveResults) => {
    execFile("rg", args, (error, stdout) => {
      if (error) {
        log(`gcz:repo rg failed, falling back to empty results`);
        resolveResults([]);
        return;
      }
      const results = stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => {
          const match = line.match(/^(.*?):(\d+):(.*)$/);
          if (!match) return null;
          return {
            path: match[1],
            line: Number(match[2]),
            preview: match[3].trim()
          };
        })
        .filter((entry): entry is { path: string; line: number; preview: string } => !!entry);
      resolveResults(results);
    });
  });
}

export function repoOpen(filePath: string) {
  const root = repoRoot();
  const absolute = resolve(root, filePath);
  const stats = statSync(absolute);
  const sizeLimit = 200_000;
  const content = readFileSync(absolute, "utf8");
  const trimmed = content.length > sizeLimit ? content.slice(0, sizeLimit) : content;

  return {
    path: absolute,
    bytes: stats.size,
    truncated: content.length > sizeLimit,
    content: trimmed
  };
}

export async function repoSummary() {
  const root = repoRoot();
  const entries = readdirSync(root, { withFileTypes: true });
  const topLevel = entries.map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? "dir" : "file"
  }));

  return { root, top_level: topLevel };
}

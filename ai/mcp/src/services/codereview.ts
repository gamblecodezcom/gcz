import { log } from "../utils/logger.js";

export interface ReviewFinding {
  type: "security"|"risk"|"smell"|"performance"|"db"|"style";
  severity: "low"|"medium"|"high"|"critical";
  file: string;
  line?: number;
  message: string;
  fix?: string;
}

export async function reviewCode(diff: string): Promise<ReviewFinding[]> {

  const results: ReviewFinding[] = [];

  function add(f: ReviewFinding) {
    results.push(f);
  }

  // === SECURITY RULES ===
  if (diff.match(/eval\s*\(/i)) {
    add({
      type: "security",
      severity: "critical",
      file: "unknown",
      message: "eval() detected — remote execution risk",
      fix: "Replace eval() with safe parser or explicit logic"
    });
  }

  if (diff.match(/exec\s*\(/i)) {
    add({
      type: "security",
      severity: "high",
      file: "unknown",
      message: "exec() detected — sandbox risk",
      fix: "Use safe subprocess wrapper"
    });
  }

  if (diff.match(/process\.env/i)) {
    add({
      type: "risk",
      severity: "medium",
      file: "unknown",
      message: "Raw env access — prefer typed config layer"
    });
  }

  // === DB RULES ===
  if (diff.match(/SELECT \* /i)) {
    add({
      type: "db",
      severity: "medium",
      file: "unknown",
      message: "Use explicit fields instead of SELECT *"
    });
  }

  if (diff.match(/['"].*\$[{(]/)) {
    add({
      type: "security",
      severity: "critical",
      file: "unknown",
      message: "Possible SQL string interpolation",
      fix: "Use parameterized queries"
    });
  }

  // === ERROR HANDLING CHECK ===
  if (diff.match(/await .*;/) && !diff.match(/try/)) {
    add({
      type: "smell",
      severity: "medium",
      file: "unknown",
      message: "Async call without error handling"
    });
  }

  // === LOG ===
  log(`Review returned ${results.length} findings`);

  return results;
}

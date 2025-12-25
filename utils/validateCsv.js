
import fs from "fs";

export function validateAffiliateCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
  const header = lines[0].split(",");
  if (header.length !== 14) {
    throw new Error(`CSV header has ${header.length} columns, expected 14`);
  }
  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(",");
    if (cols.length !== 14) {
      throw new Error(`CSV row ${idx + 2} has ${cols.length} columns`);
    }
  });
}

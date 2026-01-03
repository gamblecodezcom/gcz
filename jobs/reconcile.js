
import fs from "fs";

const csv = fs.readFileSync("master_affiliates.csv","utf8").split("\n");
if (csv[0].split(",").length !== 14) {
  throw new Error("CSV schema mismatch");
}
console.log("[reconcile] CSV schema OK");

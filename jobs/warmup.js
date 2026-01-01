
import fs from "fs";
import fetch from "node-fetch";

const csv = fs.readFileSync("master_affiliates.csv","utf8").split("\n").slice(1);
for (const row of csv) {
  const name = row.split(",")[0];
  if (!name) continue;
  fetch(`http://127.0.0.1:8000/affiliates/redirect/${name}`).catch(()=>{});
}
console.log("[warmup] redirect cache primed");

const fs = require("fs");
const csv = require("csv-parser");

function validateCsv(path) {
  return new Promise((resolve, reject) => {
    const errors = [];
    const rows = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        const fields = Object.keys(row);
        if (fields.length !== 14) {
          errors.push(`Invalid field count: ${fields.length}`);
        }
        if (!row.name || !row.affiliate_url || !row.resolved_domain) {
          errors.push(`Missing critical field in row: ${JSON.stringify(row)}`);
        }
        rows.push(row);
      })
      .on("end", () => {
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve(rows);
        }
      });
  });
}

module.exports = validateCsv;

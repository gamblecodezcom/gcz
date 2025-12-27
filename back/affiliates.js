const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");

const csvPath = process.env.AFFILIATESCSVPATH || "/var/www/html/gcz/master_affiliates.csv";

router.get("/", (_, res) => {
  const results = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    })
    .on("error", (err) => {
      console.error("Affiliate CSV load failed:", err);
      res.status(500).json({ error: "Failed to read affiliate list" });
    });
});

module.exports = router;
const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");

const csvPath = process.env.AFFILIATESCSVPATH || "/var/www/html/gcz/master_affiliates.csv";

router.get("/", (_, res) => {
  const results = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    })
    .on("error", (err) => {
      console.error("Affiliate CSV load failed:", err);
      res.status(500).json({ error: "Failed to read affiliate list" });
    });
});

module.exports = router;

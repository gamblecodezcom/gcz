const http = require("http");

function checkHealth(url, label) {
  http.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`[${label}] Unhealthy, restarting...`);
      require("child_process").execSync(`pm2 restart ${label}`);
    } else {
      console.log(`[${label}] OK`);
    }
  }).on("error", () => {
    console.error(`[${label}] DOWN`);
    require("child_process").execSync(`pm2 restart ${label}`);
  });
}

checkHealth("http://localhost:3000/api/health", "gcz-api");


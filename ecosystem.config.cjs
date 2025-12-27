module.exports = {
  apps: [
    {
      name: "gcz-api",
      script: "server.js",
      cwd: "/var/www/html/gcz",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "gcz-redirect",
      script: "python3",
      args: "backend/redirect.py",
      cwd: "/var/www/html/gcz",
    },
    {
      name: "gcz-watchdog",
      script: "watchdog.js",
      cwd: "/var/www/html/gcz",
    },
  ],
};


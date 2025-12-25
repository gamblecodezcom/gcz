module.exports = {
  apps: [
    {
      name: "gcz-api",
      script: "server.js",
      cwd: "/root/gcz",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "gcz-bot",
      script: "watchdog.js",
      cwd: "/root/gcz",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "gcz-redirect",
      script: "/root/gcz/backend/redirect.py",
      interpreter: "python3",
      cwd: "/root/gcz/backend",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PYTHONUNBUFFERED: "1"
      }
    }
  ]
};

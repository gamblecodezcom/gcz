How To RunInstall Node modules:npm install express cors mysql2 body-parser jsonwebtokenUpdate credentials in db.js and schema in your MySQL or MariaDB server.Import affiliates.csv into the affiliates table or build an import utility if needed.Start backend server:node server.js6. Connect front-end to backendFetch affiliates for public listing:fetch('/api/affiliates').then(r=>r.json()).then(renderSites);Admin dashboard: send JWT in Authorization: Bearer <token>Newsletter and check-in forms: POST to /api/newsletter and /api/daily-checkinRaffle management: POST /api/raffles, POST /api/raffles/:id/draw (admin only)This backend supports all data security, admin dashboard, raffle draw, daily check-in, newsletter, affiliate CRUD, and protects via admin secret. You can expand it for full Telegram and PWA support via REST API.

/site-root/
│
├── index.html
├── affiliates.csv
├── styles.css
├── main.js
├── newsletter.js
├── pwa.js
├── telegram.js
├── manifest.json
├── favicon.svg
├── service-worker.js
│
├── admin/
│   └── admin.js
│
└── backend/
    ├── server.js
    ├── db.js
    ├── api.js
    └── schema.sql
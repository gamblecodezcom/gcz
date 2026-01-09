import { handleCallback } from "./approvals.js";
const data = process.argv[2];
await handleCallback(data);

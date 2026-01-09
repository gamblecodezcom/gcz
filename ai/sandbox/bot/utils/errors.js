import { log } from "./logger.js";

export function safeReply(ctx, message) {
  try {
    return ctx.reply(message, { parse_mode: "Markdown" });
  } catch (err) {
    log("error", "Failed to send reply", err);
  }
}

export function handleServiceError(ctx, scope, err) {
  log(scope, "Service error", err);
  return safeReply(ctx, "❌ Something went wrong. Try again shortly.");
}

export function missingArgs(ctx, usage) {
  return safeReply(ctx, `❌ Missing arguments.\nUsage:\n\`${usage}\``);
}

export function noPermission(ctx) {
  return safeReply(ctx, "⛔ You do not have permission to use this command.");
}

export function invalidInput(ctx, msg = "Invalid input.") {
  return safeReply(ctx, `❌ ${msg}`);
}
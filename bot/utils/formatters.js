// Markdown-safe formatting helpers

export const bold = (text) => `*${escapeMarkdown(text)}*`;
export const italic = (text) => `_${escapeMarkdown(text)}_`;
export const code = (text) => `\`${escapeMarkdown(text)}\``;
export const pre = (text) => `\`\`\`\n${escapeMarkdown(text)}\n\`\`\``;

// Escape characters that break Telegram Markdown
export function escapeMarkdown(text = "") {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[");
}

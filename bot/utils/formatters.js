export function formatCommandList(commands) {
  return commands.map(c => `/${c.name} — ${c.desc}`).join("\n");
}

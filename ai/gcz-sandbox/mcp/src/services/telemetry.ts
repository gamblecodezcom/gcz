type TelemetryEvent = { type: string; payload: unknown; ts: number };

const history: TelemetryEvent[] = [];
const MAX_EVENTS = 500;

function pushEvent(type: string, payload: unknown) {
  history.push({ type, payload, ts: Date.now() });
  if (history.length > MAX_EVENTS) history.shift();
}

export function emitLog(msg: string) {
  pushEvent("ops_log", { msg });
  console.log(`[GCZ MCP] ${msg}`);
}

export function emitVIP(payload: unknown) {
  pushEvent("vip_signal", payload);
}

export function emitRisk(payload: unknown) {
  pushEvent("risk_alert", payload);
}

export function emitSessions(payload: unknown) {
  pushEvent("session_cluster", payload);
}

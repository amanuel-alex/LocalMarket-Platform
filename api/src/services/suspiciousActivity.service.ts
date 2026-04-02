/**
 * Placeholder hook for fraud / abuse signals (SIEM, structured logs, etc.).
 */
export function logSuspiciousActivity(event: string, meta?: Record<string, unknown>): void {
  const payload = { event, ts: new Date().toISOString(), ...meta };
  console.warn("[suspicious]", JSON.stringify(payload));
}

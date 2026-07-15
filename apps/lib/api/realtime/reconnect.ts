export function getReconnectDelay(attempt: number): number {
  const base = Math.min(1_000 * 2 ** attempt, 30_000);
  const jitter = Math.floor(Math.random() * 300);
  return base + jitter;
}

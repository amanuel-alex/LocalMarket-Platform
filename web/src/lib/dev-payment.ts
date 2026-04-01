/**
 * Development-only: simulates M-Pesa success by POSTing to the API callback.
 * Requires API `MPESA_CALLBACK_SECRET` to match `web` env when the secret is set.
 */
export async function simulateMpesaCallbackDev(checkoutRequestId: string) {
  const res = await fetch("/internal/dev/trigger-payment-callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutRequestId }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Simulation failed (${res.status})`);
  }
  return data;
}

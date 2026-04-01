import { NextResponse } from "next/server";

/**
 * Local development helper: forwards a successful mock M-Pesa callback to the API.
 * Lives outside `/api/*` so Next rewrites to Express do not intercept it.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development" }, { status: 403 });
  }

  let body: { checkoutRequestId?: string };
  try {
    body = (await req.json()) as { checkoutRequestId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checkoutRequestId = body.checkoutRequestId?.trim();
  if (!checkoutRequestId) {
    return NextResponse.json({ error: "checkoutRequestId required" }, { status: 400 });
  }

  const apiBase = (process.env.INTERNAL_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const secret = process.env.MPESA_CALLBACK_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["X-Callback-Secret"] = secret;

  const res = await fetch(`${apiBase}/api/v1/payments/callback`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      CheckoutRequestID: checkoutRequestId,
      ResultCode: 0,
      ResultDesc: "Dev simulate",
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

import { createHmac, timingSafeEqual } from "node:crypto";

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function razorpayStatus() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return { configured: Boolean(keyId && keySecret), keyId: keyId ?? null, reason: keyId && keySecret ? null : "Razorpay test or live credentials have not been added yet." };
}

function secureEquals(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function createRazorpayOrder({ amountPaise, receipt, notes }: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  const keyId = required("RAZORPAY_KEY_ID");
  const keySecret = required("RAZORPAY_KEY_SECRET");
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  const body = (await response.json()) as RazorpayOrder & { error?: { description?: string } };
  if (!response.ok || !body.id) throw new Error(body.error?.description ?? "Razorpay could not create an order");
  return body;
}

export async function cancelRazorpaySubscriptionAtCycleEnd(subscriptionId: string) {
  const keyId = required("RAZORPAY_KEY_ID");
  const keySecret = required("RAZORPAY_KEY_SECRET");
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: "POST",
    headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
    body: JSON.stringify({ cancel_at_cycle_end: true }),
  });
  const body = (await response.json()) as { id?: string; status?: string; current_end?: number; error?: { description?: string } };
  if (!response.ok || !body.id) throw new Error(body.error?.description ?? "Razorpay could not schedule subscription cancellation");
  return body;
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) {
  const secret = required("RAZORPAY_KEY_SECRET");
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return secureEquals(signature, expected);
}

export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string | undefined) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return secureEquals(signature, expected);
}

import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { getPlan, planAllows } from "../shared/plans";
import { razorpayStatus, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "./razorpay";

const initial = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

afterEach(() => {
  if (initial.keyId === undefined) delete process.env.RAZORPAY_KEY_ID; else process.env.RAZORPAY_KEY_ID = initial.keyId;
  if (initial.keySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET; else process.env.RAZORPAY_KEY_SECRET = initial.keySecret;
  if (initial.webhookSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET; else process.env.RAZORPAY_WEBHOOK_SECRET = initial.webhookSecret;
});

describe("Razorpay-ready subscription safeguards", () => {
  it("reports the safe configuration-required state without credentials", () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(razorpayStatus()).toMatchObject({ configured: false, keyId: null });
  });

  it("accepts only a correct order-payment signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    const signature = createHmac("sha256", "test-secret").update("order_test|pay_test").digest("hex");
    expect(verifyRazorpayPaymentSignature({ orderId: "order_test", paymentId: "pay_test", signature })).toBe(true);
    expect(verifyRazorpayPaymentSignature({ orderId: "order_test", paymentId: "pay_test", signature: "tampered" })).toBe(false);
  });

  it("accepts only a correct raw webhook signature", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-test-secret";
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = createHmac("sha256", "webhook-test-secret").update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, "wrong")).toBe(false);
  });

  it("keeps Builder capabilities and Squad Pro-only capabilities distinct", () => {
    expect(getPlan("builder").pricePaise).toBe(49900);
    expect(getPlan("builder_annual").pricePaise).toBe(499900);
    expect(planAllows("explorer", "saveTrial")).toBe(false);
    expect(planAllows("builder", "saveTrial")).toBe(true);
    expect(planAllows("builder", "aiCopilot")).toBe(false);
    expect(planAllows("squad_pro", "aiCopilot")).toBe(true);
  });
});

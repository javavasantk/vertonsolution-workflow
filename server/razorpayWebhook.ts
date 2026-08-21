import express, { type Express } from "express";
import { activateCheckoutAttempt, failCheckoutAttempt } from "./db";
import { verifyRazorpayWebhookSignature } from "./razorpay";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    order?: { entity?: { id?: string } };
  };
};

/**
 * Must be registered before express.json(): Razorpay signs the exact raw body.
 * The handler is idempotent because each activation targets the created order.
 */
export function registerRazorpayWebhook(app: Express) {
  app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = req.header("x-razorpay-signature");
    if (!verifyRazorpayWebhookSignature(raw, signature)) {
      res.status(400).json({ error: "Invalid Razorpay webhook signature" });
      return;
    }
    try {
      const body = JSON.parse(raw.toString("utf8")) as RazorpayWebhook;
      const payment = body.payload?.payment?.entity;
      const orderId = payment?.order_id ?? body.payload?.order?.entity?.id;
      if (!orderId) {
        res.status(200).json({ received: true, ignored: true });
        return;
      }
      if ((body.event === "payment.captured" || body.event === "order.paid") && payment?.id) {
        await activateCheckoutAttempt({ razorpayOrderId: orderId, razorpayPaymentId: payment.id, razorpaySignature: null });
      } else if (body.event === "payment.failed") {
        await failCheckoutAttempt(orderId, "payment.failed webhook");
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Razorpay] Webhook handling failed", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

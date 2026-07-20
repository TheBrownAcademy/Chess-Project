import Stripe from "stripe";
import { env } from "../../config/env.js";
import { PaymentGateway, WebhookEventPayload } from "./payment-gateway.interface.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia" as any,
});

export class StripeGateway implements PaymentGateway {
  async createCustomer(email: string, name?: string): Promise<string> {
    console.log(`[StripeGateway]: Registering customer ${email} (${name || ""})`);
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer.id;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>
  ): Promise<string> {
    console.log(`[StripeGateway]: Creating checkout for customer: ${customerId}, price: ${priceId}`);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session creation failed to return a redirect URL.");
    }
    return session.url;
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    console.log(`[StripeGateway]: Creating billing portal session for customer: ${customerId}`);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<WebhookEventPayload> {
    console.log("[StripeGateway]: Verifying Stripe webhook signature");
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    return {
      gatewayEventId: event.id,
      eventType: event.type,
      payload: event.data.object,
    };
  }

  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    console.log(`[StripeGateway]: Retrieving checkout session details for session ID: ${sessionId}`);
    return await stripe.checkout.sessions.retrieve(sessionId);
  }
}

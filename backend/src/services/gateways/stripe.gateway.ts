import { PaymentGateway, WebhookEventPayload } from "./payment-gateway.interface.js";

export class StripeGateway implements PaymentGateway {
  async createCustomer(email: string, name?: string): Promise<string> {
    console.log(`[StripeGateway]: Mock registering customer ${email} (${name || ""})`);
    
    // Stripe SDK logic stub:
    // const customer = await stripe.customers.create({ email, name });
    // return customer.id;

    return `cus_stripe_${Math.random().toString(36).substring(7)}`;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>
  ): Promise<string> {
    console.log(`[StripeGateway]: Mock creating checkout for customer: ${customerId}, price: ${priceId}`);
    
    // Stripe SDK logic stub:
    // const session = await stripe.checkout.sessions.create({
    //   customer: customerId,
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   mode: 'subscription',
    //   success_url: successUrl,
    //   cancel_url: cancelUrl,
    //   metadata,
    // });
    // return session.url;

    return `https://checkout.stripe.com/c/pay/mock_session_${Math.random().toString(36).substring(7)}`;
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    console.log(`[StripeGateway]: Mock creating portal session for customer: ${customerId}`);
    
    // Stripe SDK logic stub:
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: customerId,
    //   return_url: returnUrl,
    // });
    // return session.url;

    return `https://billing.stripe.com/p/session/mock_portal_${customerId}`;
  }

  async constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<WebhookEventPayload> {
    console.log("[StripeGateway]: Mock verifying signature and decoding webhook payload");
    
    // Stripe SDK logic stub:
    // const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    // return { gatewayEventId: event.id, eventType: event.type, payload: event.data.object };

    const mockEventId = `evt_stripe_${Math.random().toString(36).substring(7)}`;
    return {
      gatewayEventId: mockEventId,
      eventType: "invoice.payment_succeeded",
      payload: {
        id: "in_stripe_mock_invoice",
        customer: "cus_mock_customer",
        subscription: "sub_stripe_mock_sub",
        amount_paid: 999,
        currency: "usd",
        payment_intent: "pi_stripe_mock_intent",
        charge: "ch_stripe_mock_charge",
        lines: {
          data: [
            {
              price: { id: priceIdPlaceholder() },
            }
          ]
        },
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        metadata: {
          userId: "mock-user-id",
          planIdentifier: "pro_monthly",
        }
      }
    };
  }
}

function priceIdPlaceholder(): string {
  return "price_stripe_placeholder_monthly";
}

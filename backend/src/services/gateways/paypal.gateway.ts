import { PaymentGateway, WebhookEventPayload } from "./payment-gateway.interface.js";

export class PayPalGateway implements PaymentGateway {
  async createCustomer(email: string, name?: string): Promise<string> {
    console.log(`[PayPalGateway]: Mock registering customer ${email}`);
    return `cus_paypal_${Math.random().toString(36).substring(7)}`;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>
  ): Promise<string> {
    console.log(`[PayPalGateway]: Mock creating checkout for customer: ${customerId}, plan: ${priceId}`);
    return `https://www.paypal.com/checkoutnow?token=mock_paypal_token_${Math.random().toString(36).substring(7)}`;
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    console.log(`[PayPalGateway]: Mock creating billing agreement update for customer: ${customerId}`);
    return `https://www.paypal.com/myaccount/billingAgreement?id=${customerId}`;
  }

  async constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<WebhookEventPayload> {
    console.log("[PayPalGateway]: Mock verifying signature and decoding PayPal webhook event");
    const mockEventId = `evt_paypal_${Math.random().toString(36).substring(7)}`;
    return {
      gatewayEventId: mockEventId,
      eventType: "BILLING.SUBSCRIPTION.ACTIVATED",
      payload: {
        id: "mock_paypal_sub_id",
        custom_id: "mock-user-id",
        plan_id: "paypal_price_mock",
      }
    };
  }
}

export interface WebhookEventPayload {
  gatewayEventId: string;
  eventType: string;
  payload: any;
}

export interface PaymentGateway {
  /**
   * Registers a customer account with the payment provider.
   * Returns the provider's unique customer ID.
   */
  createCustomer(email: string, name?: string): Promise<string>;

  /**
   * Generates a checkout gateway redirect URL.
   */
  createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>
  ): Promise<string>;

  /**
   * Generates a portal redirection URL for subscription/billing settings management.
   */
  createBillingPortalSession(customerId: string, returnUrl: string): Promise<string>;

  /**
   * Verifies and decodes incoming webhook event requests using provider SDK features.
   */
  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<WebhookEventPayload>;
}
